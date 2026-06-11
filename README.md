# Sistem Peminjaman Barang

Aplikasi web untuk mengelola peminjaman dan pengembalian barang dengan database MySQL.

## Fitur

- [OK] Tambah/Edit/Hapus Barang
- [OK] Catat Peminjaman Barang
- [OK] Kembalikan Barang
- [OK] Lihat Statistik Real-time
- [OK] Responsive Design

## Requirement

- Node.js 14+
- MySQL 5.7+
- npm atau yarn

## Setup

### 1. Database Setup

```bash
mysql -u root -p < database.sql
```

### 2. Backend Setup

```bash
cd backend
npm install
cp ../.env.example .env
# Edit .env sesuai konfigurasi MySQL Anda
npm start
```

### 3. Frontend

Buka `frontend/index.html` di browser atau gunakan live server

## Struktur Project

```
peminjaman_barang/
├── backend/
│   ├── server.js          # Express server
│   └── package.json
├── frontend/
│   ├── index.html         # Main page
│   └── style.css          # Styling
├── database.sql           # Database schema
├── .env.example           # Environment variables
└── README.md
```

## API Endpoints

### Barang

- `GET /barang` - Ambil semua barang
- `POST /tambah` - Tambah barang baru
- `PUT /edit/:id` - Edit barang
- `DELETE /hapus/:id` - Hapus barang

### Peminjaman

- `GET /peminjaman` - Ambil semua peminjaman
- `POST /pinjam` - Catat peminjaman
- `PUT /kembalikan/:id` - Kembalikan barang

## Konfigurasi

Edit file `.env`:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password_anda
DB_NAME=peminjaman_barang
PORT=3000
```

## Troubleshooting

**Koneksi DB Gagal**

- Pastikan MySQL running: `net start mysql80`
- Check .env configuration

**CORS Error**

- Backend sudah enable CORS untuk localhost:3000

**Port 3000 Sudah Dipakai**

- Ubah PORT di file .env
