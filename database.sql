-- Buat Database
CREATE DATABASE IF NOT EXISTS peminjaman_barang;
USE peminjaman_barang;

-- Tabel Barang
CREATE TABLE IF NOT EXISTS barang (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_barang VARCHAR(100) NOT NULL UNIQUE,
  stok INT NOT NULL DEFAULT 0,
  kondisi VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_nama (nama_barang)
);

-- Tabel Peminjaman
CREATE TABLE IF NOT EXISTS peminjaman (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_peminjam VARCHAR(100) NOT NULL,
  barang_id INT NOT NULL,
  jumlah INT NOT NULL,
  tanggal_pinjam DATE NOT NULL,
  tanggal_kembali DATE,
  status VARCHAR(20) DEFAULT 'dipinjam',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (barang_id) REFERENCES barang(id) ON DELETE RESTRICT,
  INDEX idx_status (status),
  INDEX idx_peminjam (nama_peminjam),
  INDEX idx_tanggal (tanggal_pinjam)
);

-- Insert data sample
INSERT INTO barang (nama_barang, stok, kondisi) VALUES
('Laptop', 5, 'Baik'),
('Printer', 2, 'Baik'),
('Kursi', 10, 'Baik'),
('Meja', 8, 'Baik'),
('Monitor', 4, 'Baik');
