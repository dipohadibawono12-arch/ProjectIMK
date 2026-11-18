# SIPRK — Sistem Informasi Peminjaman dan Ketersediaan Ruangan Kelas (Mobile App)
**Universitas Brawijaya**

Aplikasi mobile web (`max-w-[430px]`) untuk peminjaman dan ketersediaan ruangan kelas berbasis peran (**Role-Based Access Control / RBAC**) dengan backend ringan Node.js (`server.js`) dan database JSON (`data/db.json`).

---

## 👥 Daftar Akun Pengguna Resmi (3 Peran)

Sistem membedakan fitur dan hak akses secara otomatis berdasarkan akun yang dimasukkan di halaman login **`screens/s01-login.html`**:

| Peran Pengguna | Nama Lengkap | Email SSO UB | NIM / NIP (Alternatif Login) | Password | Hak Akses Utama |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Mahasiswa / Ormawa** | Rani Maharani | `rani@student.ub.ac.id` | `225150200111045` | `mahasiswa123` | • Form Peminjaman 4-Langkah (H-1)<br>• Unggah Berkas Proposal / Surat Izin<br>• Simpan Draf & Batalkan Pengajuan<br>• Status Pengajuan (Menunggu, Disetujui, Ditolak)<br>• E-Tiket Digital |
| **Dosen Pengampu** | Dr. Rina Kusuma, S.Kom., M.T. | `rina@ub.ac.id` | `198508172012122002` | `dosen123` | • Pengajuan Kelas Pengganti Mendesak (Bisa H-0)<br>• Filter Ruangan berdasarkan Fasilitas Ajar<br>• Jadwal Mengajar Saya & Ekspor Kalender (`.ics`)<br>• Status Pengajuan (Menunggu, Disetujui, Ditolak) |
| **Admin Sarpras** *(Satu-satunya Admin)* | Hadi Suryono, S.AP. | `admin@ub.ac.id` | `197903112005011001` | `admin123` | • **Pengajuan Masuk Otomatis:** Seluruh pengajuan mahasiswa & dosen langsung masuk ke antrean verifikasi Admin Sarpras<br>• **Keputusan:** **Setujui** atau **Tolak** (wajib menyertakan penjelasan kenapa ruangan tidak dapat digunakan, min. 10 karakter)<br>• **Master Data Ruangan:** Tambah, ubah data, dan ubah status Tersedia / Maintenance<br>• **Jadwal Perkuliahan:** Tambah jadwal manual & impor jadwal CSV<br>• **Rekap PIC & Dashboard Evaluasi:** Pantau utilisasi dan okupansi ruangan |

---

## ⚙️ Alur Peminjaman Ruangan

1. **Mahasiswa / Dosen** mengajukan peminjaman ruangan melalui form wizard peminjaman.
2. Pengajuan **otomatis masuk ke sistem backend** (`data/db.json`) dengan status **Menunggu Verifikasi** dan memicu notifikasi langsung ke akun **Admin Sarpras**.
3. **Admin Sarpras** meninjau pengajuan di menu **Pengajuan**:
   - **Setujui:** Status berubah menjadi **Disetujui**, menerbitkan E-Tiket digital untuk pemohon.
   - **Tolak:** Admin memasukkan alasan penolakan (misal: *Ruangan sedang digunakan untuk kuliah rutin / dalam masa pemeliharaan fasilitas*). Pemohon akan menerima notifikasi beserta alasan penolakan tersebut di aplikasi mereka.

---

## 💻 Cara Menjalankan di Komputer Lokal (Localhost)

1. Buka terminal pada folder proyek:
   ```bash
   node server.js
   ```
2. Buka browser:
   - **Landing Page Mobile:** [http://localhost:3000](http://localhost:3000)
   - **Halaman Login SSO:** [http://localhost:3000/screens/s01-login.html](http://localhost:3000/screens/s01-login.html)

---

## 🚀 Panduan Deploy ke Vercel

Aplikasi ini sudah dilengkapi [vercel.json](file:///c:/Users/LOQ/.gemini/antigravity/scratch/Project%20IMK/vercel.json) dan `server.js` yang mendukung serverless handler dengan salinan database otomatis di `/tmp/db.json`.

Jalankan perintah berikut di terminal Anda:
```bash
git add .
git commit -m "update: hapus badge sla, status hanya setujui/tolak, dan role admin tunggal sarpras"
git push
```
Vercel akan otomatis melakukan rebuild dan aplikasi langsung aktif.
