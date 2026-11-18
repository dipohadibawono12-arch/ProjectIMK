const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const IS_VERCEL = Boolean(process.env.VERCEL);
const INITIAL_DB_PATH = path.join(ROOT_DIR, 'data', 'db.json');
const DB_PATH = IS_VERCEL ? '/tmp/db.json' : INITIAL_DB_PATH;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function ensureDB() {
  if (IS_VERCEL && !fs.existsSync(DB_PATH)) {
    try {
      fs.copyFileSync(INITIAL_DB_PATH, DB_PATH);
    } catch (err) {
      console.error('Error copying db.json to /tmp:', err);
    }
  }
}

function readDB() {
  ensureDB();
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeDB(data) {
  ensureDB();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function sendJSON(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    return sendJSON(res, 200, { ok: true });
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  // ================= REST API ENDPOINTS =================
  if (pathname === '/api/db' && req.method === 'GET') {
    return sendJSON(res, 200, readDB());
  }

  if (pathname === '/api/login' && req.method === 'POST') {
    const { identifier, password } = await parseBody(req);
    const db = readDB();
    const cleanId = String(identifier || '').trim().toLowerCase();
    const user = db.users.find(u =>
      (u.email.toLowerCase() === cleanId || u.idNumber.toLowerCase() === cleanId) &&
      u.password === String(password || '')
    );
    if (!user) {
      return sendJSON(res, 401, {
        ok: false,
        message: 'Email/NIM/NIP atau kata sandi SSO tidak sesuai. Silakan periksa kembali.'
      });
    }
    const { password: _, ...safeUser } = user;
    return sendJSON(res, 200, { ok: true, user: safeUser });
  }

  if (pathname === '/api/bookings' && req.method === 'POST') {
    const body = await parseBody(req);
    const db = readDB();

    const roomId = body.roomId || 'rt-102';
    const startVal = body.startTime || '08:40';
    const endVal = body.endTime || '10:20';
    const dateVal = body.date || '2026-10-22';

    const timesOverlap = (aStart, aEnd, bStart, bEnd) => String(aStart) < String(bEnd) && String(aEnd) > String(bStart);
    const getDayName = (ds) => {
      const p = String(ds || '').split('-').map(Number);
      if (p.length !== 3 || p.some(isNaN)) return 'Kamis';
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      return days[new Date(p[0], p[1] - 1, p[2]).getDay()] || 'Kamis';
    };

    if (!startVal || !endVal || String(startVal) >= String(endVal)) {
      return sendJSON(res, 400, {
        ok: false,
        message: 'Rentang jam tidak valid. Jam selesai harus lebih besar dari jam mulai.'
      });
    }

    const room = (db.rooms || []).find(r => r.id === roomId || r.code === roomId);
    if (room && room.status === 'maintenance') {
      return sendJSON(res, 400, {
        ok: false,
        message: room.maintenanceNote || 'Ruangan sedang dalam pemeliharaan sarpras.'
      });
    }

    const targetRoomId = room ? room.id : roomId;
    const dayName = getDayName(dateVal);

    // Validasi backend identik dengan frontend: booking aktif, jadwal kuliah reguler sesuai hari, dan default slot
    const hasBookingConflict = (db.bookings || []).some(b =>
      b.roomId === targetRoomId &&
      (b.status === 'disetujui' || b.status === 'menunggu') &&
      b.date === dateVal &&
      timesOverlap(b.startTime, b.endTime, startVal, endVal)
    );

    const hasSchConflict = (db.schedules || []).some(s =>
      s.roomId === targetRoomId &&
      s.status !== 'nonaktif' &&
      s.day === dayName &&
      timesOverlap(s.startTime, s.endTime, startVal, endVal)
    );

    const hasDefaultSlotConflict = room && (room.slots || []).some(sl => {
      if (!['terpakai', 'menunggu', 'maintenance'].includes(sl.status)) return false;
      const parts = String(sl.time || '').split(' - ').map(t => t.trim());
      if (parts.length !== 2) return false;
      return timesOverlap(parts[0], parts[1], startVal, endVal);
    });

    if (hasBookingConflict || hasSchConflict || hasDefaultSlotConflict) {
      return sendJSON(res, 400, {
        ok: false,
        message: 'Jadwal ruangan bentrok dengan kegiatan atau perkuliahan lain. Pengajuan dibatalkan sistem.'
      });
    }

    const seq = String(db.bookings.length + 45).padStart(4, '0');
    const code = body.code || `SIPRK-261019-${seq}`;
    const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    const newBooking = {
      id: code,
      code: code,
      userId: body.userId || 'u-mhs-1',
      userRole: body.userRole || 'mahasiswa',
      applicantName: body.applicantName || 'Rani Maharani',
      applicantUnit: body.applicantUnit || 'BEM FILKOM UB',
      applicantNimNip: body.applicantNimNip || '225150200111045',
      applicantPhone: body.applicantPhone || '0812-3456-7890',
      applicantEmail: body.applicantEmail || 'rani@student.ub.ac.id',
      roomId: body.roomId || 'rt-102',
      roomName: body.roomName || 'Ruang Teori 1.2',
      roomLocation: body.roomLocation || 'Gedung Kuliah Bersama A, Lantai 1',
      date: body.date || '2026-10-22',
      dateFormatted: body.dateFormatted || 'Kamis, 22 Okt 2026',
      startTime: body.startTime || '10:20',
      endTime: body.endTime || '12:00',
      category: body.category || 'Kegiatan Ormawa',
      courseInfo: body.courseInfo || '',
      title: body.title || 'Kegiatan Mahasiswa UB',
      participants: Number(body.participants) || 35,
      capacity: Number(body.capacity) || 45,
      status: body.status || 'menunggu',
      priority: body.userRole === 'dosen' ? 'Prioritas 2 • Dosen' : 'Prioritas 3 • Ormawa',
      conflictNote: body.conflictNote || '',
      rejectionReason: '',
      documentName: body.documentName || 'Proposal_Kegiatan_UB.pdf',
      documentSize: body.documentSize || '1.8 MB',
      createdAt: `19 Okt 2026, ${nowStr}`,
      history: [
        {
          status: body.status === 'draf' ? 'Disimpan sebagai Draf' : 'Menunggu Verifikasi Sarpras',
          actor: body.applicantName || 'Pemohon',
          time: `19 Okt 2026, ${nowStr}`,
          note: body.status === 'draf'
            ? 'Draf pengajuan disimpan oleh pemohon.'
            : 'Pengajuan berhasil dikirim dan masuk ke antrean verifikasi Admin Sarpras.'
        }
      ]
    };

    db.bookings.unshift(newBooking);

    if (newBooking.status !== 'draf') {
      db.notifications.unshift({
        id: 'notif-' + Date.now(),
        targetRole: 'admin',
        unread: true,
        type: 'warning',
        icon: 'inbox',
        color: 'bg-[#FFF0C2] text-[#C98A00]',
        title: `Pengajuan Baru: ${newBooking.code}`,
        body: `${newBooking.applicantName} mengajukan ${newBooking.roomName} untuk "${newBooking.title}" (${newBooking.dateFormatted}, ${newBooking.startTime}-${newBooking.endTime}).`,
        time: 'Baru saja',
        bookingId: newBooking.id,
        link: 's10-admin-pengajuan.html'
      });
      db.notifications.unshift({
        id: 'notif-u-' + Date.now(),
        targetRole: newBooking.userRole,
        unread: true,
        type: 'info',
        icon: 'schedule',
        color: 'bg-[#DCEBFA] text-[#1F5FA8]',
        title: 'Pengajuan Terkirim ke Sarpras',
        body: `Kode pengajuan ${newBooking.code} (${newBooking.roomName}) sedang menunggu verifikasi Admin Sarpras.`,
        time: 'Baru saja',
        bookingId: newBooking.id,
        link: `s08-detail-peminjaman.html?id=${newBooking.id}`
      });
    }

    writeDB(db);
    return sendJSON(res, 201, { ok: true, booking: newBooking });
  }

  if (pathname.startsWith('/api/bookings/') && req.method === 'PATCH') {
    const id = pathname.split('/').pop();
    const updates = await parseBody(req);
    const db = readDB();
    const booking = db.bookings.find(b => b.id === id || b.code === id);
    if (!booking) return sendJSON(res, 404, { ok: false, message: 'Pengajuan tidak ditemukan' });

    const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    Object.assign(booking, updates);

    if (updates.historyEntry) {
      booking.history = booking.history || [];
      booking.history.unshift({
        status: updates.historyEntry.status,
        actor: updates.historyEntry.actor || 'Admin Sarpras',
        time: `19 Okt 2026, ${nowStr}`,
        note: updates.historyEntry.note || ''
      });
      delete booking.historyEntry;
    }

    if (updates.status === 'disetujui') {
      db.notifications.unshift({
        id: 'notif-' + Date.now(),
        targetRole: booking.userRole,
        unread: true,
        type: 'success',
        icon: 'check_circle',
        color: 'bg-[#D8F1E4] text-[#2E9E6B]',
        title: `Pengajuan ${booking.code} Disetujui!`,
        body: `Peminjaman ${booking.roomName} untuk "${booking.title}" telah disetujui Admin Sarpras. E-Tiket QR siap digunakan.`,
        time: 'Baru saja',
        bookingId: booking.id,
        link: `s08-detail-peminjaman.html?id=${booking.id}`
      });
    } else if (updates.status === 'ditolak') {
      if (updates.rejectionReason) booking.rejectionReason = updates.rejectionReason;
      if (updates.rejectReason) booking.rejectionReason = updates.rejectReason;
      db.notifications.unshift({
        id: 'notif-' + Date.now(),
        targetRole: booking.userRole,
        unread: true,
        type: 'danger',
        icon: 'cancel',
        color: 'bg-[#F9DADD] text-[#D64550]',
        title: `Pengajuan ${booking.code} Ditolak`,
        body: `Alasan penolakan: ${booking.rejectionReason || 'Ruangan tidak dapat digunakan pada waktu tersebut.'}`,
        time: 'Baru saja',
        bookingId: booking.id,
        link: `s08-detail-peminjaman.html?id=${booking.id}`
      });
    }

    writeDB(db);
    return sendJSON(res, 200, { ok: true, booking });
  }

  if (pathname.startsWith('/api/bookings/') && req.method === 'DELETE') {
    const id = pathname.split('/').pop();
    const db = readDB();
    db.bookings = db.bookings.filter(b => b.id !== id && b.code !== id);
    writeDB(db);
    return sendJSON(res, 200, { ok: true });
  }

  if (pathname === '/api/rooms' && req.method === 'POST') {
    const body = await parseBody(req);
    const db = readDB();
    const newRoom = {
      id: body.id || ('rm-' + Date.now()),
      code: body.code || 'RT-NEW',
      name: body.name || 'Ruang Kelas Baru',
      building: body.building || 'Gedung Kuliah Bersama A',
      buildingShort: body.buildingShort || 'GKB-A',
      floor: body.floor || 'Lantai 1',
      capacity: Number(body.capacity) || 40,
      dimensions: '64 m² • Kelas Reguler',
      openHours: '07:00 - 17:00 WIB',
      pic: 'Pak Hadi (Sarpras UB)',
      status: body.status || 'tersedia',
      maintenanceNote: body.maintenanceNote || '',
      facilities: body.facilities || ['Proyektor', 'AC', 'Wi-Fi'],
      photo: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=900&q=80',
      slots: [
        { time: '07:00 - 08:40', status: 'tersedia', label: 'Tersedia' },
        { time: '08:40 - 10:20', status: 'tersedia', label: 'Tersedia' },
        { time: '10:20 - 12:00', status: 'tersedia', label: 'Tersedia' },
        { time: '13:00 - 14:40', status: 'tersedia', label: 'Tersedia' },
        { time: '15:00 - 17:00', status: 'tersedia', label: 'Tersedia' }
      ]
    };
    db.rooms.unshift(newRoom);
    writeDB(db);
    return sendJSON(res, 201, { ok: true, room: newRoom });
  }

  if (pathname.startsWith('/api/rooms/') && req.method === 'PATCH') {
    const id = pathname.split('/').pop();
    const updates = await parseBody(req);
    const db = readDB();
    const room = db.rooms.find(r => r.id === id || r.code === id);
    if (!room) return sendJSON(res, 404, { ok: false, message: 'Ruangan tidak ditemukan' });
    Object.assign(room, updates);
    writeDB(db);
    return sendJSON(res, 200, { ok: true, room });
  }

  if (pathname.startsWith('/api/rooms/') && req.method === 'DELETE') {
    const id = pathname.split('/').pop();
    const db = readDB();
    const room = db.rooms.find(r => r.id === id || r.code === id);
    if (!room) return sendJSON(res, 404, { ok: false, message: 'Ruangan tidak ditemukan' });

    const active = db.bookings.filter(b =>
      (b.roomId === room.id || b.roomName === room.name) &&
      ['menunggu', 'disetujui', 'konflik'].includes(b.status)
    );
    if (active.length > 0) {
      return sendJSON(res, 400, {
        ok: false,
        message: 'Ruangan memiliki pengajuan aktif dan tidak dapat dihapus.',
        activeBookings: active
      });
    }
    db.rooms = db.rooms.filter(r => r.id !== id && r.code !== id);
    writeDB(db);
    return sendJSON(res, 200, { ok: true });
  }

  if (pathname === '/api/schedules' && req.method === 'POST') {
    const body = await parseBody(req);
    const db = readDB();
    const newSch = {
      id: 'sch-' + Date.now(),
      code: body.code || 'IF-2104',
      courseName: body.courseName || 'Mata Kuliah Baru',
      roomId: body.roomId || 'rt-102',
      roomName: body.roomName || 'Ruang Teori 1.2 (GKB-A)',
      building: body.building || 'GKB-A',
      day: body.day || 'Senin',
      startTime: body.startTime || '13:00',
      endTime: body.endTime || '15:00',
      semester: body.semester || 'Semester 5',
      lecturer: body.lecturer || 'Dosen Pengampu FILKOM UB',
      capacity: Number(body.capacity) || 45,
      status: 'aktif'
    };
    db.schedules.unshift(newSch);
    writeDB(db);
    return sendJSON(res, 201, { ok: true, schedule: newSch });
  }

  if (pathname.startsWith('/api/schedules/') && req.method === 'DELETE') {
    const id = pathname.split('/').pop();
    const db = readDB();
    db.schedules = db.schedules.filter(s => s.id !== id && s.code !== id);
    writeDB(db);
    return sendJSON(res, 200, { ok: true });
  }

  if (pathname === '/api/notifications/read-all' && req.method === 'POST') {
    const { role } = await parseBody(req);
    const db = readDB();
    db.notifications.forEach(n => {
      if (!role || n.targetRole === role) n.unread = false;
    });
    writeDB(db);
    return sendJSON(res, 200, { ok: true });
  }

  // ================= STATIC FILE SERVER =================
  let filePath = path.join(ROOT_DIR, pathname === '/' ? 'index.html' : pathname);
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('404 Not Found');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
});

if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`SIPRK Universitas Brawijaya Server berjalan di http://localhost:${PORT}`);
  });
}

module.exports = server;
