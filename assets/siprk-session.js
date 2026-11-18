/**
 * SIPRK Universitas Brawijaya — Real Data Store, Auth & API Client
 * Connects to /api/* (server.js -> data/db.json) with automatic localStorage persistence fallback
 */
window.SIPRK = (function () {
  const SESSION_KEY = 'siprk_ub_active_session_v2';
  const DB_CACHE_KEY = 'siprk_ub_db_state_v2';
  const SLOT_KEY = 'siprk_ub_selected_slot_v2';
  const LAST_BOOKING_KEY = 'siprk_ub_last_booking_v2';

  const ALLOWED_SCREENS = {
    mahasiswa: [
      's01-login.html',
      's02-beranda.html',
      's03-jadwal.html',
      's04-detail-ruangan.html',
      's05-form-peminjaman.html',
      's06-konfirmasi.html',
      's07-peminjaman-saya.html',
      's08-detail-peminjaman.html',
      's15-notifikasi.html',
      's10-profil.html',
      's17-error.html'
    ],
    dosen: [
      's01-login.html',
      's02-beranda.html',
      's03-jadwal.html',
      's04-detail-ruangan.html',
      's05-form-peminjaman.html',
      's06-konfirmasi.html',
      's07-peminjaman-saya.html',
      's08-detail-peminjaman.html',
      's09-jadwal-dosen.html',
      's15-notifikasi.html',
      's10-profil.html',
      's17-error.html'
    ],
    admin: [
      's01-login.html',
      's10-admin-pengajuan.html',
      's11-admin-ruangan.html',
      's12-admin-jadwal.html',
      's13-admin-rekap.html',
      's14-admin-dashboard.html',
      's15-notifikasi.html',
      's10-profil.html',
      's17-error.html'
    ]
  };

  const DEFAULT_DB = {
    users: [
      {
        id: 'u-mhs-1',
        role: 'mahasiswa',
        roleLabel: 'Mahasiswa',
        name: 'Rani Maharani',
        shortName: 'Rani',
        email: 'rani@student.ub.ac.id',
        idLabel: 'NIM',
        idNumber: '225150200111045',
        password: 'mahasiswa123',
        prodi: 'S1 Teknik Informatika - FILKOM UB',
        organization: 'BEM FILKOM UB',
        semester: 'Angkatan 2022 (Semester 5)',
        phone: '0812-3456-7890',
        avatar: 'RM',
        homeScreen: 's02-beranda.html',
        badgeClass: 'bg-[#DCEBFA] text-[#1F5FA8]'
      },
      {
        id: 'u-dsn-1',
        role: 'dosen',
        roleLabel: 'Dosen Pengampu',
        name: 'Dr. Rina Kusuma, S.Kom., M.T.',
        shortName: 'Dr. Rina',
        email: 'rina@ub.ac.id',
        idLabel: 'NIP',
        idNumber: '198508172012122002',
        password: 'dosen123',
        prodi: 'Departemen Teknik Informatika - FILKOM UB',
        organization: 'Dosen Pengampu FILKOM UB',
        semester: 'Semester Gasal 2026/2027',
        phone: '0811-3344-5566',
        avatar: 'DR',
        homeScreen: 's02-beranda.html',
        badgeClass: 'bg-[#D8F1E4] text-[#2E9E6B]'
      },
      {
        id: 'u-adm-1',
        role: 'admin',
        roleLabel: 'Admin Sarpras',
        name: 'Hadi Suryono, S.AP.',
        shortName: 'Pak Hadi',
        email: 'admin@ub.ac.id',
        idLabel: 'NIP',
        idNumber: '197903112005011001',
        password: 'admin123',
        prodi: 'Subbagian Sarana & Prasarana GKB UB',
        organization: 'Admin Sarpras Universitas Brawijaya',
        semester: 'Operasional Aktif 2026',
        phone: '0813-5566-7788',
        avatar: 'PH',
        homeScreen: 's10-admin-pengajuan.html',
        badgeClass: 'bg-[#FFF0C2] text-[#C98A00]'
      }
    ],
    rooms: [
      {
        id: 'rt-102',
        code: 'RT-102',
        name: 'Ruang Teori 1.2',
        building: 'Gedung Kuliah Bersama A',
        buildingShort: 'GKB-A',
        floor: 'Lantai 1',
        capacity: 45,
        dimensions: '64 m² • Kelas Teori Reguler',
        openHours: '07:00 - 17:00 WIB',
        pic: 'Pak Hadi (Sarpras GKB-A)',
        status: 'tersedia',
        maintenanceNote: '',
        facilities: ['Proyektor', 'Smartboard', 'AC', 'Wi-Fi', 'Stopkontak'],
        photo: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=900&q=80',
        slots: [
          { time: '07:00 - 08:40', status: 'terpakai', label: 'Kuliah Kalkulus 1 (IF-1A)' },
          { time: '08:40 - 10:20', status: 'tersedia', label: 'Tersedia' },
          { time: '10:20 - 12:00', status: 'tersedia', label: 'Tersedia' },
          { time: '13:00 - 14:40', status: 'menunggu', label: 'Menunggu Verifikasi' },
          { time: '15:00 - 17:00', status: 'tersedia', label: 'Tersedia' }
        ]
      },
      {
        id: 'rt-201',
        code: 'RT-201',
        name: 'Ruang Teori 2.1',
        building: 'Gedung Kuliah Bersama A',
        buildingShort: 'GKB-A',
        floor: 'Lantai 2',
        capacity: 50,
        dimensions: '72 m² • Kelas Teori Besar',
        openHours: '07:00 - 17:00 WIB',
        pic: 'Pak Hadi (Sarpras GKB-A)',
        status: 'tersedia',
        maintenanceNote: '',
        facilities: ['Proyektor', 'AC', 'Wi-Fi', 'Stopkontak', 'Sound System'],
        photo: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&q=80',
        slots: [
          { time: '07:00 - 08:40', status: 'terpakai', label: 'Kuliah Algoritma (IF-3A)' },
          { time: '08:40 - 10:20', status: 'tersedia', label: 'Tersedia' },
          { time: '10:20 - 12:00', status: 'tersedia', label: 'Tersedia' },
          { time: '13:00 - 14:40', status: 'terpakai', label: 'Kuliah PBO (IF-3B)' },
          { time: '15:00 - 17:00', status: 'tersedia', label: 'Tersedia' }
        ]
      },
      {
        id: 'lab-304',
        code: 'LAB-304',
        name: 'Lab Komputer 3.4',
        building: 'Gedung F FILKOM UB',
        buildingShort: 'FILKOM',
        floor: 'Lantai 3',
        capacity: 35,
        dimensions: '80 m² • Laboratorium Praktikum',
        openHours: '07:00 - 17:00 WIB',
        pic: 'Laboran FILKOM UB',
        status: 'tersedia',
        maintenanceNote: '',
        facilities: ['35 Unit PC', 'Proyektor', 'Smartboard', 'AC', 'Wi-Fi'],
        photo: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=900&q=80',
        slots: [
          { time: '07:00 - 08:40', status: 'tersedia', label: 'Tersedia' },
          { time: '08:40 - 10:20', status: 'terpakai', label: 'Praktikum Basis Data' },
          { time: '10:20 - 12:00', status: 'tersedia', label: 'Tersedia' },
          { time: '13:00 - 14:40', status: 'tersedia', label: 'Tersedia' },
          { time: '15:00 - 17:00', status: 'tersedia', label: 'Tersedia' }
        ]
      },
      {
        id: 'aud-101',
        code: 'AUD-101',
        name: 'Auditorium Mini 1.1',
        building: 'Gedung Dekanat FILKOM',
        buildingShort: 'Dekanat',
        floor: 'Lantai 1',
        capacity: 90,
        dimensions: '140 m² • Auditorium & Seminar',
        openHours: '07:00 - 17:00 WIB',
        pic: 'Subbag Umum Dekanat',
        status: 'tersedia',
        maintenanceNote: '',
        facilities: ['Sound System', 'Proyektor', 'Smartboard', 'AC', 'Panggung'],
        photo: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=80',
        slots: [
          { time: '07:00 - 08:40', status: 'tersedia', label: 'Tersedia' },
          { time: '08:40 - 10:20', status: 'tersedia', label: 'Tersedia' },
          { time: '10:20 - 12:00', status: 'menunggu', label: 'Seminar BEM (Pending)' },
          { time: '13:00 - 14:40', status: 'tersedia', label: 'Tersedia' },
          { time: '15:00 - 17:00', status: 'tersedia', label: 'Tersedia' }
        ]
      },
      {
        id: 'rt-202',
        code: 'RT-202',
        name: 'Ruang Diskusi 2.2',
        building: 'Gedung Kuliah Bersama A',
        buildingShort: 'GKB-A',
        floor: 'Lantai 2',
        capacity: 30,
        dimensions: '48 m² • Ruang Kelas & Diskusi',
        openHours: '07:00 - 17:00 WIB',
        pic: 'Pak Hadi (Sarpras GKB-A)',
        status: 'maintenance',
        maintenanceNote: 'Perbaikan instalasi AC rutin s/d 22 Oktober 2026',
        facilities: ['Smartboard', 'AC', 'Wi-Fi'],
        photo: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80',
        slots: [
          { time: '07:00 - 17:00', status: 'maintenance', label: 'Maintenance AC' }
        ]
      }
    ],
    schedules: [
      {
        id: 'sch-1',
        code: 'IF-2101',
        courseName: 'Pemrograman Web Lanjut',
        roomId: 'rt-102',
        roomName: 'Ruang Teori 1.2 (GKB-A)',
        building: 'GKB-A',
        day: 'Senin',
        startTime: '08:00',
        endTime: '10:30',
        semester: 'Semester 5',
        lecturer: 'Dr. Ir. Hendra, M.T.',
        capacity: 45,
        status: 'aktif'
      },
      {
        id: 'sch-2',
        code: 'SI-3302',
        courseName: 'Analisis Sistem Informasi',
        roomId: 'rt-102',
        roomName: 'Ruang Teori 1.2 (GKB-A)',
        building: 'GKB-A',
        day: 'Senin',
        startTime: '10:45',
        endTime: '13:15',
        semester: 'Semester 3',
        lecturer: 'Dr. Rina Kusuma, S.Kom., M.T.',
        capacity: 45,
        status: 'aktif'
      },
      {
        id: 'sch-3',
        code: 'IF-2205',
        courseName: 'Pemrograman Berorientasi Objek',
        roomId: 'rt-201',
        roomName: 'Ruang Teori 2.1 (GKB-A)',
        building: 'GKB-A',
        day: 'Selasa',
        startTime: '13:00',
        endTime: '14:40',
        semester: 'Semester 3',
        lecturer: 'Ir. Bambang Hermanto, M.T.',
        capacity: 50,
        status: 'aktif'
      }
    ],
    bookings: [
      {
        id: 'SIPRK-261019-0012',
        code: 'SIPRK-261019-0012',
        userId: 'u-dsn-1',
        userRole: 'dosen',
        applicantName: 'Dr. Rina Kusuma, S.Kom., M.T.',
        applicantUnit: 'Dosen Pengampu FILKOM UB',
        applicantNimNip: '198508172012122002',
        applicantPhone: '0811-3344-5566',
        applicantEmail: 'rina@ub.ac.id',
        roomId: 'rt-201',
        roomName: 'Ruang Teori 2.1',
        roomLocation: 'Gedung Kuliah Bersama A, Lantai 2',
        date: '2026-10-20',
        dateFormatted: 'Selasa, 20 Okt 2026',
        startTime: '13:00',
        endTime: '14:40',
        category: 'Kelas Pengganti',
        courseInfo: 'SI2204 Sistem Basis Data (SI-2A)',
        title: 'Kelas Pengganti: Sistem Basis Data (SI-2A)',
        participants: 38,
        capacity: 50,
        status: 'ditolak',
        priority: 'Prioritas 2 • Mendesak H-0',
        conflictNote: '',
        rejectionReason: 'Ruangan tidak dapat digunakan karena bentrok dengan jadwal Kuliah Rutin PBO (13:00 - 14:40 WIB).',
        documentName: 'RPS_Kelas_Pengganti_SBD.pdf',
        documentSize: '1.2 MB',
        createdAt: '19 Okt 2026, 09:15 WIB',
        history: [
          {
            status: 'Ditolak Admin Sarpras',
            actor: 'Hadi Suryono, S.AP.',
            time: '19 Okt 2026, 09:20 WIB',
            note: 'Alasan: Ruangan tidak dapat digunakan karena bentrok dengan jadwal Kuliah Rutin PBO (13:00 - 14:40 WIB).'
          },
          {
            status: 'Pengajuan Dibuat',
            actor: 'Dr. Rina Kusuma, S.Kom., M.T.',
            time: '19 Okt 2026, 09:14 WIB',
            note: 'Pengajuan kelas pengganti dikirim melalui aplikasi mobile.'
          }
        ]
      },
      {
        id: 'SIPRK-261019-0007',
        code: 'SIPRK-261019-0007',
        userId: 'u-mhs-1',
        userRole: 'mahasiswa',
        applicantName: 'Rani Maharani',
        applicantUnit: 'Ketua Panitia BEM FILKOM UB',
        applicantNimNip: '225150200111045',
        applicantPhone: '0812-3456-7890',
        applicantEmail: 'rani@student.ub.ac.id',
        roomId: 'rt-102',
        roomName: 'Ruang Teori 1.2',
        roomLocation: 'Gedung Kuliah Bersama A, Lantai 1',
        date: '2026-10-22',
        dateFormatted: 'Kamis, 22 Okt 2026',
        startTime: '10:20',
        endTime: '12:00',
        category: 'Kegiatan Ormawa',
        courseInfo: '',
        title: 'Seminar Nasional BEM: Transformasi Digital Kampus',
        participants: 40,
        capacity: 45,
        status: 'menunggu',
        priority: 'Prioritas 3 • Ormawa',
        conflictNote: '',
        rejectionReason: '',
        documentName: 'Proposal_Semnas_BEM_2026_Signed.pdf',
        documentSize: '2.4 MB',
        createdAt: '19 Okt 2026, 08:30 WIB',
        history: [
          {
            status: 'Menunggu Verifikasi Sarpras',
            actor: 'Sistem SIPRK (Otomatis)',
            time: '19 Okt 2026, 08:31 WIB',
            note: 'Pengajuan masuk ke antrean verifikasi Admin Sarpras GKB-A (Target SLA ≤ 1 hari kerja).'
          },
          {
            status: 'Pengajuan Berhasil Dikirim',
            actor: 'Rani Maharani',
            time: '19 Okt 2026, 08:30 WIB',
            note: 'Formulir dan berkas proposal berhasil diunggah.'
          }
        ]
      },
      {
        id: 'SIPRK-261018-0043',
        code: 'SIPRK-261018-0043',
        userId: 'u-mhs-1',
        userRole: 'mahasiswa',
        applicantName: 'Rani Maharani',
        applicantUnit: 'BEM FILKOM UB',
        applicantNimNip: '225150200111045',
        applicantPhone: '0812-3456-7890',
        applicantEmail: 'rani@student.ub.ac.id',
        roomId: 'rt-201',
        roomName: 'Ruang Teori 2.1',
        roomLocation: 'Gedung Kuliah Bersama A, Lantai 2',
        date: '2026-10-21',
        dateFormatted: 'Rabu, 21 Okt 2026',
        startTime: '15:00',
        endTime: '17:00',
        category: 'Kegiatan Ormawa',
        courseInfo: '',
        title: 'Rapat Kerja Divisi IT & Sosialisasi Web BEM',
        participants: 32,
        capacity: 50,
        status: 'disetujui',
        priority: 'Prioritas 3 • Ormawa',
        conflictNote: '',
        rejectionReason: '',
        documentName: 'Surat_Izin_Raker_BEM.pdf',
        documentSize: '1.5 MB',
        createdAt: '17 Okt 2026, 14:10 WIB',
        history: [
          {
            status: 'Disetujui Sarpras',
            actor: 'Hadi Suryono, S.AP. (Admin Sarpras)',
            time: '18 Okt 2026, 10:15 WIB',
            note: 'Berkas lengkap dan jadwal bebas bentrok. E-Tiket QR Code akses pintu diterbitkan.'
          },
          {
            status: 'Pengajuan Berhasil Dikirim',
            actor: 'Rani Maharani',
            time: '17 Okt 2026, 14:10 WIB',
            note: 'Pengajuan dikirim oleh pemohon.'
          }
        ]
      },
      {
        id: 'SIPRK-261016-0009',
        code: 'SIPRK-261016-0009',
        userId: 'u-dsn-1',
        userRole: 'dosen',
        applicantName: 'Dr. Rina Kusuma, S.Kom., M.T.',
        applicantUnit: 'Dosen Pengampu FILKOM UB',
        applicantNimNip: '198508172012122002',
        applicantPhone: '0811-3344-5566',
        applicantEmail: 'rina@ub.ac.id',
        roomId: 'rt-102',
        roomName: 'Ruang Teori 1.2',
        roomLocation: 'Gedung Kuliah Bersama A, Lantai 1',
        date: '2026-10-19',
        dateFormatted: 'Senin, 19 Okt 2026',
        startTime: '13:00',
        endTime: '14:40',
        category: 'Kelas Pengganti',
        courseInfo: 'IF2101 Algoritma & Struktur Data (IF-3A)',
        title: 'Kelas Pengganti: Algoritma & Struktur Data (IF-3A)',
        participants: 40,
        capacity: 45,
        status: 'disetujui',
        priority: 'Prioritas 2 • Dosen',
        conflictNote: '',
        rejectionReason: '',
        documentName: 'Silabus_Pertemuan_7.pdf',
        documentSize: '0.9 MB',
        createdAt: '16 Okt 2026, 11:00 WIB',
        history: [
          {
            status: 'Disetujui Sarpras',
            actor: 'Hadi Suryono, S.AP. (Admin Sarpras)',
            time: '16 Okt 2026, 13:20 WIB',
            note: 'Reservasi kelas pengganti disetujui dan dijadwalkan.'
          }
        ]
      },
      {
        id: 'SIPRK-261015-0002',
        code: 'SIPRK-261015-0002',
        userId: 'u-mhs-1',
        userRole: 'mahasiswa',
        applicantName: 'Rani Maharani',
        applicantUnit: 'BEM FILKOM UB',
        applicantNimNip: '225150200111045',
        applicantPhone: '0812-3456-7890',
        applicantEmail: 'rani@student.ub.ac.id',
        roomId: 'aud-101',
        roomName: 'Auditorium Mini 1.1',
        roomLocation: 'Gedung Dekanat FILKOM, Lantai 1',
        date: '2026-10-20',
        dateFormatted: 'Selasa, 20 Okt 2026',
        startTime: '18:00',
        endTime: '21:00',
        category: 'Kegiatan Ormawa',
        courseInfo: '',
        title: 'Latihan Rutin Malam Seni Mahasiswa',
        participants: 65,
        capacity: 90,
        status: 'ditolak',
        priority: 'Prioritas 3 • Ormawa',
        conflictNote: '',
        rejectionReason: 'Permohonan melewati jam operasional maksimal kampus (17:00 WIB) dan belum melampirkan surat izin kegiatan malam dari Wakil Dekan III.',
        documentName: 'Draft_Acara_Malam.pdf',
        documentSize: '1.1 MB',
        createdAt: '15 Okt 2026, 16:00 WIB',
        history: [
          {
            status: 'Permohonan Ditolak',
            actor: 'Hadi Suryono, S.AP. (Admin Sarpras)',
            time: '16 Okt 2026, 09:00 WIB',
            note: 'Ditolak: Permohonan melewati jam operasional maksimal kampus (17:00 WIB) dan belum melampirkan surat izin kegiatan malam dari Wakil Dekan III.'
          },
          {
            status: 'Pengajuan Berhasil Dikirim',
            actor: 'Rani Maharani',
            time: '15 Okt 2026, 16:00 WIB',
            note: 'Pengajuan dikirim oleh pemohon.'
          }
        ]
      }
    ],
    notifications: [
      {
        id: 'notif-1',
        targetRole: 'mahasiswa',
        unread: true,
        type: 'success',
        icon: 'check_circle',
        color: 'bg-[#D8F1E4] text-[#2E9E6B]',
        title: 'Pengajuan Disetujui Sarpras',
        body: 'Pengajuan SIPRK-261018-0043 (Rapat Kerja Divisi IT di Ruang Teori 2.1) telah disetujui. E-Tiket QR siap digunakan.',
        time: '10 menit yang lalu',
        bookingId: 'SIPRK-261018-0043',
        link: 's08-detail-peminjaman.html?id=SIPRK-261018-0043'
      },
      {
        id: 'notif-2',
        targetRole: 'mahasiswa',
        unread: true,
        type: 'warning',
        icon: 'schedule',
        color: 'bg-[#FFF0C2] text-[#C98A00]',
        title: 'Pengajuan Menunggu Verifikasi',
        body: 'Pengajuan SIPRK-261019-0007 (Seminar Nasional BEM) sedang dalam antrean verifikasi Admin Sarpras.',
        time: '1 jam yang lalu',
        bookingId: 'SIPRK-261019-0007',
        link: 's08-detail-peminjaman.html?id=SIPRK-261019-0007'
      },
      {
        id: 'notif-3',
        targetRole: 'dosen',
        unread: true,
        type: 'success',
        icon: 'alarm_on',
        color: 'bg-[#D8F1E4] text-[#2E9E6B]',
        title: 'Pengingat Kelas Pengganti Hari Ini',
        body: 'Kelas Pengganti Algoritma & Struktur Data (IF-3A) di Ruang Teori 1.2 dimulai pukul 13:00 WIB.',
        time: '30 menit yang lalu',
        bookingId: 'SIPRK-261016-0009',
        link: 's09-jadwal-dosen.html'
      },
      {
        id: 'notif-4',
        targetRole: 'admin',
        unread: true,
        type: 'conflict',
        icon: 'warning',
        color: 'bg-[#FFF1E6] text-[#D46B1D]',
        title: 'Pengajuan Mendesak & Konflik Jadwal!',
        body: 'Dr. Rina Kusuma mengajukan Kelas Pengganti SBD di Ruang Teori 2.1 (Bentrok Kuliah PBO).',
        time: 'Baru saja',
        bookingId: 'SIPRK-261019-0012',
        link: 's10-admin-pengajuan.html'
      }
    ]
  };

  function getDB() {
    try {
      const raw = localStorage.getItem(DB_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.users && parsed.rooms && parsed.bookings) {
          return parsed;
        }
      }
    } catch (e) {}
    saveDB(DEFAULT_DB);
    return JSON.parse(JSON.stringify(DEFAULT_DB));
  }

  function saveDB(db) {
    try {
      localStorage.setItem(DB_CACHE_KEY, JSON.stringify(db));
    } catch (e) {}
  }

  // Optional background sync with server.js (/api/db) if running on http://
  async function syncFromServer() {
    if (window.location.protocol.startsWith('http')) {
      try {
        const res = await fetch('/api/db');
        if (res.ok) {
          const serverData = await res.json();
          if (serverData && serverData.users) {
            saveDB(serverData);
            return serverData;
          }
        }
      } catch (e) {}
    }
    return getDB();
  }

  async function apiCall(endpoint, method, body) {
    if (window.location.protocol.startsWith('http')) {
      try {
        const res = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined
        });
        if (res.ok) {
          await syncFromServer();
          return await res.json();
        }
      } catch (e) {}
    }
    return null;
  }

  function decorateUser(u) {
    const role = u.role || 'mahasiswa';
    return Object.assign({}, u, {
      allowedScreens: ALLOWED_SCREENS[role] || ALLOWED_SCREENS.mahasiswa
    });
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.role) return decorateUser(parsed);
      }
    } catch (e) {}
    return decorateUser(DEFAULT_DB.users[0]);
  }

  function setSessionUser(userObj) {
    const decorated = decorateUser(userObj);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(decorated));
    } catch (e) {}
    return decorated;
  }

  async function loginWithCredentials(identifier, password) {
    const cleanId = String(identifier || '').trim().toLowerCase();
    const cleanPass = String(password || '');

    // Try server API first if running on HTTP
    if (window.location.protocol.startsWith('http')) {
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: cleanId, password: cleanPass })
        });
        const data = await res.json();
        if (res.ok && data.ok && data.user) {
          const session = setSessionUser(data.user);
          await syncFromServer();
          return { ok: true, user: session };
        } else if (res.status === 401) {
          return { ok: false, message: data.message };
        }
      } catch (e) {}
    }

    // Local DB lookup
    const db = getDB();
    const found = db.users.find(u =>
      (u.email.toLowerCase() === cleanId || u.idNumber.toLowerCase() === cleanId) &&
      u.password === cleanPass
    );
    if (!found) {
      return {
        ok: false,
        message: 'Email/NIM/NIP atau kata sandi SSO tidak sesuai. Silakan periksa kembali.'
      };
    }
    const session = setSessionUser(found);
    return { ok: true, user: session };
  }

  function logout() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {}
    window.location.href = 's01-login.html';
  }

  function getCurrentFile() {
    const path = window.location.pathname;
    return path.split('/').pop() || 'index.html';
  }

  function enforceRBAC() {
    const file = getCurrentFile();
    if (file === 'index.html' || file === 's01-login.html' || file === 's17-error.html') return true;
    const session = getSession();
    if (!session.allowedScreens.includes(file)) {
      window.location.replace('s17-error.html?code=403&from=' + encodeURIComponent(file));
      return false;
    }
    return true;
  }

  // ================= DATA CRUD OPERATIONS =================
  function getRooms() {
    return getDB().rooms;
  }

  function getRoomById(id) {
    const rooms = getRooms();
    return rooms.find(r => r.id === id || r.code === id || r.name === id) || rooms[0];
  }

  async function addRoom(roomData) {
    const db = getDB();
    const newRoom = {
      id: 'rm-' + Date.now(),
      code: roomData.code || 'RT-NEW',
      name: roomData.name || 'Ruang Baru',
      building: roomData.building || 'Gedung Kuliah Bersama A',
      buildingShort: (roomData.building || '').includes('FILKOM') ? 'FILKOM' : 'GKB-A',
      floor: roomData.floor || 'Lantai 1',
      capacity: Number(roomData.capacity) || 40,
      dimensions: '64 m² • Kelas Reguler',
      openHours: '07:00 - 17:00 WIB',
      pic: 'Pak Hadi (Sarpras UB)',
      status: roomData.status || 'tersedia',
      maintenanceNote: roomData.status === 'maintenance' ? 'Pemeliharaan berkala sarana ruangan' : '',
      facilities: roomData.facilities || ['Proyektor', 'AC', 'Wi-Fi'],
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
    saveDB(db);
    await apiCall('/api/rooms', 'POST', newRoom);
    return newRoom;
  }

  async function updateRoom(id, updates) {
    const db = getDB();
    const room = db.rooms.find(r => r.id === id || r.code === id);
    if (room) {
      Object.assign(room, updates);
      saveDB(db);
      await apiCall('/api/rooms/' + encodeURIComponent(room.id), 'PATCH', updates);
    }
    return room;
  }

  async function deleteRoom(id) {
    const db = getDB();
    const room = db.rooms.find(r => r.id === id || r.code === id);
    if (!room) return { ok: false, activeBookings: [] };

    const active = db.bookings.filter(b =>
      (b.roomId === room.id || b.roomName === room.name) &&
      ['menunggu', 'disetujui', 'konflik'].includes(b.status)
    );
    if (active.length > 0) {
      return { ok: false, activeBookings: active, room };
    }
    db.rooms = db.rooms.filter(r => r.id !== room.id);
    saveDB(db);
    await apiCall('/api/rooms/' + encodeURIComponent(room.id), 'DELETE');
    return { ok: true };
  }

  function getBookings() {
    return getDB().bookings;
  }

  function getUserBookings() {
    const session = getSession();
    const all = getBookings();
    if (session.role === 'admin' || session.role === 'fakultas') return all;
    return all.filter(b => b.userRole === session.role || b.userId === session.id);
  }

  function getBookingById(id) {
    const all = getBookings();
    if (id) {
      const found = all.find(b => b.id === id || b.code === id);
      if (found) return found;
    }
    const lastId = localStorage.getItem(LAST_BOOKING_KEY);
    if (lastId) {
      const foundLast = all.find(b => b.id === lastId || b.code === lastId);
      if (foundLast) return foundLast;
    }
    return getUserBookings()[0] || all[0];
  }

  async function createBooking(payload) {
    const db = getDB();
    const session = getSession();
    const room = getRoomById(payload.roomId || 'rt-102');
    const dateVal = payload.date || '2026-10-22';
    const startVal = payload.startTime || '08:40';
    const endVal = payload.endTime || '10:20';

    const conflictCheck = checkSlotConflict(room.id, dateVal, startVal, endVal);
    if (conflictCheck.conflict) {
      return { ok: false, message: conflictCheck.plainDetail || conflictCheck.title };
    }

    const seq = String(db.bookings.length + 45).padStart(4, '0');
    const code = `SIPRK-261019-${seq}`;
    const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    // Seluruh pengajuan baru masuk ke antrean Admin Sarpras berstatus "menunggu"
    const status = payload.isDraft ? 'draf' : 'menunggu';

    const newBooking = {
      id: code,
      code: code,
      userId: session.id,
      userRole: session.role,
      applicantName: payload.applicantName || session.name,
      applicantUnit: session.organization,
      applicantNimNip: session.idNumber,
      applicantPhone: payload.applicantPhone || session.phone || '0812-3456-7890',
      applicantEmail: session.email,
      roomId: room.id,
      roomName: room.name,
      roomLocation: `${room.building}, ${room.floor}`,
      date: dateVal,
      dateFormatted: payload.dateFormatted || 'Kamis, 22 Okt 2026',
      startTime: startVal,
      endTime: endVal,
      category: payload.category || (session.role === 'dosen' ? 'Kelas Pengganti' : 'Kegiatan Ormawa'),
      courseInfo: payload.courseInfo || '',
      title: payload.title || 'Kegiatan Akademik UB',
      participants: Number(payload.participants) || 35,
      capacity: room.capacity,
      status: status,
      priority: session.role === 'dosen' ? 'Prioritas 2 • Dosen' : 'Prioritas 3 • Ormawa',
      conflictNote: '',
      rejectionReason: '',
      documentName: payload.documentName || 'Berkas_Pendukung_SIPRK.pdf',
      documentSize: '1.8 MB',
      createdAt: `19 Okt 2026, ${nowStr}`,
      history: [
        {
          status: status === 'draf' ? 'Draf Tersimpan' : 'Menunggu Verifikasi Sarpras',
          actor: session.name,
          time: `19 Okt 2026, ${nowStr}`,
          note: status === 'draf'
            ? 'Draf pengajuan disimpan oleh pemohon.'
            : 'Pengajuan berhasil dikirim dan otomatis masuk ke antrean Admin Sarpras.'
        }
      ]
    };

    db.bookings.unshift(newBooking);

    if (status !== 'draf') {
      db.notifications.unshift({
        id: 'notif-' + Date.now(),
        targetRole: 'admin',
        unread: true,
        type: 'warning',
        icon: 'inbox',
        color: 'bg-[#FFF0C2] text-[#C98A00]',
        title: `Pengajuan Baru: ${newBooking.code}`,
        body: `${newBooking.applicantName} (${session.roleLabel}) mengajukan ${newBooking.roomName} untuk "${newBooking.title}" (${newBooking.dateFormatted}).`,
        time: 'Baru saja',
        bookingId: newBooking.id,
        link: 's10-admin-pengajuan.html'
      });

      db.notifications.unshift({
        id: 'notif-u-' + Date.now(),
        targetRole: session.role,
        unread: true,
        type: 'info',
        icon: 'schedule',
        color: 'bg-[#DCEBFA] text-[#1F5FA8]',
        title: 'Pengajuan Berhasil Dikirim',
        body: `Kode pengajuan ${newBooking.code} (${newBooking.roomName}) telah diteruskan ke Admin Sarpras.`,
        time: 'Baru saja',
        bookingId: newBooking.id,
        link: `s08-detail-peminjaman.html?id=${newBooking.id}`
      });
    }

    saveDB(db);
    try {
      localStorage.setItem(LAST_BOOKING_KEY, newBooking.id);
    } catch (e) {}
    await apiCall('/api/bookings', 'POST', newBooking);
    return newBooking;
  }

  async function updateBooking(id, updates) {
    const db = getDB();
    const booking = db.bookings.find(b => b.id === id || b.code === id);
    if (!booking) return null;
    const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    if (updates.historyEntry) {
      booking.history = booking.history || [];
      booking.history.unshift({
        status: updates.historyEntry.status,
        actor: updates.historyEntry.actor || getSession().name,
        time: `19 Okt 2026, ${nowStr}`,
        note: updates.historyEntry.note || ''
      });
    }

    const cleanUpdates = Object.assign({}, updates);
    delete cleanUpdates.historyEntry;
    Object.assign(booking, cleanUpdates);

    if (updates.status === 'disetujui') {
      db.notifications.unshift({
        id: 'notif-' + Date.now(),
        targetRole: booking.userRole,
        unread: true,
        type: 'success',
        icon: 'check_circle',
        color: 'bg-[#D8F1E4] text-[#2E9E6B]',
        title: `Pengajuan ${booking.code} Disetujui!`,
        body: `Peminjaman ${booking.roomName} untuk "${booking.title}" telah disetujui. E-Tiket QR Code siap digunakan.`,
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

    saveDB(db);
    await apiCall('/api/bookings/' + encodeURIComponent(booking.id), 'PATCH', updates);
    return booking;
  }

  async function deleteBooking(id) {
    const db = getDB();
    db.bookings = db.bookings.filter(b => b.id !== id && b.code !== id);
    saveDB(db);
    await apiCall('/api/bookings/' + encodeURIComponent(id), 'DELETE');
  }

  const BASE_SLOTS = [
    { time: '07:00 - 08:40', start: '07:00', end: '08:40' },
    { time: '08:40 - 10:20', start: '08:40', end: '10:20' },
    { time: '10:20 - 12:00', start: '10:20', end: '12:00' },
    { time: '13:00 - 14:40', start: '13:00', end: '14:40' },
    { time: '15:00 - 17:00', start: '15:00', end: '17:00' }
  ];

  function getDayNameFromDate(dateStr) {
    if (!dateStr) return 'Kamis';
    const parts = String(dateStr).split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return 'Kamis';
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[d.getDay()] || 'Kamis';
  }

  function formatShortLabel(text, maxWords = 3) {
    const cleaned = String(text || '').trim().replace(/\s+/g, ' ');
    if (!cleaned) return 'Sedang Terpakai';
    const words = cleaned.split(' ').slice(0, maxWords).map(w => w.replace(/[:;]+$/, ''));
    if (words.length > 0) {
      words[words.length - 1] = words[words.length - 1].replace(/[,.\-]+$/, '');
    }
    return words.filter(Boolean).join(' ') || 'Sedang Terpakai';
  }

  function timesOverlap(startA, endA, startB, endB) {
    return String(startA) < String(endB) && String(endA) > String(startB);
  }

  function checkSlotConflict(roomId, dateStr, startTime, endTime) {
    if (!startTime || !endTime || String(startTime) >= String(endTime)) {
      return {
        conflict: true,
        type: 'invalid_time',
        status: 'terpakai',
        title: 'Rentang Waktu Tidak Valid',
        detail: 'Jam selesai harus lebih besar dari jam mulai.',
        plainDetail: 'Jam selesai harus lebih besar dari jam mulai.',
        shortLabel: 'Jam Tidak Valid'
      };
    }

    const db = getDB();
    const room = (db.rooms || []).find(r => r.id === roomId || r.code === roomId || r.name === roomId) || getRoomById(roomId);
    if (!room) {
      return { conflict: false, type: null, status: 'tersedia', title: 'Bebas Bentrok', detail: '', plainDetail: '', shortLabel: 'Tersedia' };
    }

    if (room.status === 'maintenance') {
      const note = room.maintenanceNote || 'Ruangan sedang dalam pemeliharaan sarpras.';
      return {
        conflict: true,
        type: 'maintenance',
        status: 'maintenance',
        title: 'Ruangan Sedang Maintenance',
        detail: note,
        plainDetail: note,
        shortLabel: formatShortLabel(note, 3)
      };
    }

    const bkg = (db.bookings || []).find(b =>
      b.roomId === room.id &&
      (b.status === 'disetujui' || b.status === 'menunggu') &&
      b.date === dateStr &&
      timesOverlap(b.startTime, b.endTime, startTime, endTime)
    );
    if (bkg) {
      return {
        conflict: true,
        type: 'booking',
        status: 'terpakai',
        title: 'Ruangan Sudah Dipinjam Kegiatan Lain',
        detail: `Ruangan telah dipinjam untuk <strong>${bkg.title}</strong> oleh <strong>${bkg.applicantName}</strong> (${bkg.startTime} - ${bkg.endTime} WIB).`,
        plainDetail: `Ruangan telah dipinjam untuk "${bkg.title}" oleh ${bkg.applicantName} (${bkg.startTime} - ${bkg.endTime} WIB).`,
        shortLabel: formatShortLabel(bkg.title, 3),
        booking: bkg
      };
    }

    const dayName = getDayNameFromDate(dateStr);
    const sch = (db.schedules || []).find(s =>
      s.roomId === room.id &&
      s.status !== 'nonaktif' &&
      s.day === dayName &&
      timesOverlap(s.startTime, s.endTime, startTime, endTime)
    );
    if (sch) {
      const code = sch.code || sch.courseCode || 'Kuliah';
      return {
        conflict: true,
        type: 'schedule',
        status: 'terpakai',
        title: 'Jadwal Beririsan dengan Kuliah Reguler',
        detail: `Bentrok dengan kuliah rutin <strong>${code} ${sch.courseName}</strong> (${sch.startTime} - ${sch.endTime} WIB).`,
        plainDetail: `Bentrok dengan kuliah rutin ${code} ${sch.courseName} (${sch.startTime} - ${sch.endTime} WIB).`,
        shortLabel: formatShortLabel(`Kuliah ${sch.courseName}`, 3),
        schedule: sch
      };
    }

    const defaultSlot = (room.slots || []).find(sl => {
      if (!['terpakai', 'menunggu', 'maintenance'].includes(sl.status)) return false;
      const parts = String(sl.time || '').split(' - ').map(t => t.trim());
      if (parts.length !== 2) return false;
      return timesOverlap(parts[0], parts[1], startTime, endTime);
    });
    if (defaultSlot) {
      return {
        conflict: true,
        type: 'default_slot',
        status: defaultSlot.status === 'maintenance' ? 'maintenance' : 'terpakai',
        title: defaultSlot.status === 'menunggu' ? 'Slot Sedang Dalam Antrean Pengajuan' : 'Slot Waktu Sudah Terisi Jadwal Tetap',
        detail: `Slot waktu ${defaultSlot.time} WIB sudah terisi untuk <strong>${defaultSlot.label || 'Kegiatan Terjadwal'}</strong>.`,
        plainDetail: `Slot waktu ${defaultSlot.time} WIB sudah terisi untuk ${defaultSlot.label || 'Kegiatan Terjadwal'}.`,
        shortLabel: formatShortLabel(defaultSlot.label || 'Sudah Terisi', 3),
        slot: defaultSlot
      };
    }

    return {
      conflict: false,
      type: null,
      status: 'tersedia',
      title: 'Bebas Bentrok',
      detail: '',
      plainDetail: '',
      shortLabel: 'Tersedia'
    };
  }

  function getRoomSlotsForDate(roomOrId, dateStr) {
    const room = typeof roomOrId === 'string' ? getRoomById(roomOrId) : roomOrId;
    if (!room) return [];
    return BASE_SLOTS.map(bs => {
      const check = checkSlotConflict(room.id, dateStr, bs.start, bs.end);
      return {
        time: bs.time,
        start: bs.start,
        end: bs.end,
        status: check.status,
        conflict: check.conflict,
        type: check.type,
        label: check.shortLabel,
        shortLabel: check.shortLabel,
        fullDetail: check.plainDetail || check.detail
      };
    });
  }

  function getSchedules() {
    return getDB().schedules;
  }

  async function addSchedule(schData) {
    const db = getDB();
    const room = getRoomById(schData.roomId || 'rt-102');
    const newSch = {
      id: 'sch-' + Date.now(),
      code: schData.code || schData.courseCode || 'IF-2104',
      courseName: schData.courseName || 'Arsitektur Komputer',
      roomId: room.id,
      roomName: `${room.name} (${room.buildingShort})`,
      building: room.buildingShort,
      day: schData.day || 'Senin',
      startTime: schData.startTime || '13:30',
      endTime: schData.endTime || '16:00',
      semester: schData.semester || 'Semester 5',
      lecturer: schData.lecturer || 'Dr. Rina Kusuma, S.Kom., M.T.',
      capacity: room.capacity,
      status: 'aktif'
    };
    db.schedules.unshift(newSch);
    saveDB(db);
    await apiCall('/api/schedules', 'POST', newSch);
    return newSch;
  }

  async function deleteSchedule(id) {
    const db = getDB();
    db.schedules = db.schedules.filter(s => s.id !== id && s.code !== id);
    saveDB(db);
    await apiCall('/api/schedules/' + encodeURIComponent(id), 'DELETE');
  }

  function getNotifications() {
    const session = getSession();
    return getDB().notifications.filter(n => n.targetRole === session.role);
  }

  async function markAllNotificationsRead() {
    const db = getDB();
    const session = getSession();
    db.notifications.forEach(n => {
      if (n.targetRole === session.role) n.unread = false;
    });
    saveDB(db);
    await apiCall('/api/notifications/read-all', 'POST', { role: session.role });
  }

  function setSelectedSlot(slotInfo) {
    try {
      localStorage.setItem(SLOT_KEY, JSON.stringify(slotInfo));
    } catch (e) {}
  }

  function getSelectedSlot() {
    try {
      const raw = localStorage.getItem(SLOT_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      roomId: 'rt-102',
      roomName: 'Ruang Teori 1.2',
      building: 'Gedung Kuliah Bersama A • Lt. 1',
      capacity: 45,
      date: '2026-10-22',
      dateFormatted: 'Kamis, 22 Okt 2026',
      startTime: '08:40',
      endTime: '10:20'
    };
  }

  function renderBottomNav(activeFile) {
    const session = getSession();
    const role = session.role;
    const navEl = document.getElementById('siprk-bottom-nav');
    if (!navEl) return;

    const db = getDB();
    const pendingCount = db.bookings.filter(b => b.status === 'menunggu' || b.status === 'pending').length;

    let tabs = [];
    if (role === 'mahasiswa') {
      tabs = [
        { file: 's02-beranda.html', label: 'Beranda', icon: 'home' },
        { file: 's03-jadwal.html', label: 'Jadwal Ruang', icon: 'calendar_month' },
        { file: 's07-peminjaman-saya.html', label: 'Peminjaman', icon: 'event_available' },
        { file: 's10-profil.html', label: 'Profil', icon: 'account_circle' }
      ];
    } else if (role === 'dosen') {
      tabs = [
        { file: 's02-beranda.html', label: 'Beranda', icon: 'home' },
        { file: 's03-jadwal.html', label: 'Cari Ruang', icon: 'calendar_month' },
        { file: 's09-jadwal-dosen.html', label: 'Jadwal Saya', icon: 'event_note' },
        { file: 's07-peminjaman-saya.html', label: 'Pengajuan', icon: 'assignment' },
        { file: 's10-profil.html', label: 'Profil', icon: 'account_circle' }
      ];
    } else if (role === 'admin') {
      tabs = [
        { file: 's14-admin-dashboard.html', label: 'Dashboard', icon: 'monitoring' },
        { file: 's10-admin-pengajuan.html', label: 'Pengajuan', icon: 'inbox', badge: pendingCount > 0 ? String(pendingCount) : '' },
        { file: 's11-admin-ruangan.html', label: 'Ruangan', icon: 'meeting_room' },
        { file: 's12-admin-jadwal.html', label: 'Jadwal CSV', icon: 'edit_calendar' },
        { file: 's13-admin-rekap.html', label: 'Rekap', icon: 'fact_check' }
      ];
    }

    navEl.innerHTML = tabs.map(t => {
      const isActive = activeFile === t.file;
      return `
        <a href="${t.file}" aria-current="${isActive ? 'page' : 'false'}" class="relative flex flex-col items-center justify-center py-1 min-h-[48px] flex-1 transition-all active:scale-95 ${isActive ? 'text-[#1F5FA8] font-bold' : 'text-[#6B7785] hover:text-[#1F5FA8] font-medium'}">
          <div class="relative flex items-center justify-center px-2.5 py-0.5 rounded-full ${isActive ? 'bg-[#DCEBFA]/70' : ''}">
            <span class="material-symbols-outlined text-[22px]" style="font-variation-settings: 'FILL' ${isActive ? 1 : 0};">${t.icon}</span>
            ${t.badge ? `<span class="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#D64550] text-white text-[9px] font-bold flex items-center justify-center">${t.badge}</span>` : ''}
          </div>
          <span class="text-[10px] leading-tight mt-0.5 truncate max-w-[72px]">${t.label}</span>
        </a>
      `;
    }).join('');
  }

  return {
    getDB,
    saveDB,
    syncFromServer,
    getSession,
    setSessionUser,
    loginWithCredentials,
    logout,
    enforceRBAC,
    renderBottomNav,
    getCurrentFile,
    getRooms,
    getRoomById,
    addRoom,
    updateRoom,
    deleteRoom,
    getBookings,
    getUserBookings,
    getBookingById,
    createBooking,
    updateBooking,
    deleteBooking,
    getSchedules,
    addSchedule,
    deleteSchedule,
    getNotifications,
    markAllNotificationsRead,
    setSelectedSlot,
    getSelectedSlot,
    BASE_SLOTS,
    getDayNameFromDate,
    formatShortLabel,
    checkSlotConflict,
    getRoomSlotsForDate
  };
})();
