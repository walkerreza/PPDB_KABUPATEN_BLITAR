# PPDB BLITAR — Monorepo (Frontend + Backend)

Dokumentasi singkat untuk mengembangkan, menjalankan, dan deploy aplikasi PPDB ini. Proyek terdiri dari dua bagian utama:

- Frontend: `Frontend/` (React + Vite + Tailwind/Material Tailwind)
- Backend: `Backend/` (Node.js + Express + Sequelize + PostgreSQL)

## Persyaratan
- Node.js 18+ dan npm 9+
- Git
- PostgreSQL 13+ (lokal atau remote)
- OS: Windows (disarankan PowerShell/Terminal)

## Struktur Proyek
```
PPDB BLITAR/
├─ Frontend/
│  ├─ package.json (vite, react, tailwind)
│  └─ src/
└─ Backend/
   ├─ server.js (entry server Express)
   └─ package.json (express, sequelize, pg)
```

## Setup Cepat (Development)
1) Clone & masuk ke folder proyek
```
# contoh
# git clone https://github.com/<username>/<repo>.git
cd "d:/Ngoding/pindahan laragon www/PPDB BLITAR"
```

2) Install dependencies
```
# Frontend
cd Frontend
npm install

# Backend
cd ../Backend
npm install
```

3) Buat file environment
- Backend: `Backend/.env`
```
# Server
PORT=5000
# Database (pilih salah satu gaya)
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DBNAME
# atau
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ppdb
DB_USER=postgres
DB_PASS=postgres

# Auth / Keamanan
JWT_SECRET=ubah_ini_dengan_string_acak_yang_kuat

# Upload/Storage (opsional, sesuaikan dengan server.js)
STORAGE_DIR=content/uploads
TZ=Asia/Jakarta
```

- Frontend: `Frontend/.env`
```
# URL API backend
VITE_API_BASE_URL=http://localhost:5000
```

4) Jalankan aplikasi (dua terminal terpisah)
```
# Terminal 1 — Backend
cd Backend
node server.js

# Terminal 2 — Frontend
cd Frontend
npm run dev
```

- Frontend default Vite dev di http://localhost:5173
- Backend berjalan di http://localhost:5000 (atau sesuai PORT)

## Skrip Penting
- Frontend (`Frontend/package.json`):
  - `npm run dev` — jalankan Vite dev server
  - `npm run build` — build produksi
  - `npm run preview` — preview build
  - `npm run lint` — linting

- Backend (`Backend/package.json`):
  - Belum ada `start` script, jalankan langsung: `node server.js`
  - Rekomendasi (opsional): tambahkan script berikut agar lebih nyaman:
    ```json
    {
      "scripts": {
        "start": "node server.js",
        "dev": "nodemon server.js"
      }
    }
    ```
    Catatan: perubahan ini tidak dibuat otomatis di repo.

## Catatan Database
- Pastikan database PostgreSQL siap dan kredensial sesuai dengan `.env`.
- Jika menggunakan Sequelize, migrasi/seed (jika ada) perlu dijalankan sesuai utilitas proyek (tidak disertakan di package saat ini).

## Build Produksi
- Frontend: `cd Frontend && npm run build` menghasilkan folder `dist/`.
- Backend: jalankan `node server.js` di lingkungan produksi, gunakan proses manager (pm2/systemd) dan reverse proxy (Nginx) jika perlu.

## Environment & Keamanan
- Jangan commit file `.env`.
- Gunakan `JWT_SECRET` yang kuat dan unik.
- Atur CORS di backend sesuai domain produksi.

## Troubleshooting
- Port bentrok: ubah `PORT` backend atau port Vite (`--port`), contoh `npm run dev -- --port 5174`.
- Koneksi DB gagal: cek `DATABASE_URL`/`DB_*`, firewall, atau service PostgreSQL.
- CORS error: pastikan `VITE_API_BASE_URL` benar dan backend mengizinkan origin front-end.

## Kontribusi
- Buat branch fitur: `feat/<nama-fitur>`
- Commit message: gunakan konvensi singkat, contoh: `feat: tambah filter monitoring siswa`
- Pull Request disarankan sebelum merge ke `main`.

## Lisensi
Tuliskan lisensi proyek Anda di sini (mis. MIT). Jika belum ditentukan, tambahkan sebelum rilis publik.
