require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database Connection Error:", err.message);
    process.exit(1);
  } else {
    console.log("✅ Database terhubung");
  }
});

// =======================
// AMBIL DATA BARANG
// =======================
app.get("/barang", (req, res) => {
  db.query("SELECT * FROM barang", (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Gagal mengambil data barang" });
    }

    res.status(200).json(result);
  });
});

// =======================
// TAMBAH BARANG
// =======================
app.post("/tambah", (req, res) => {
  const { nama, stok, kondisi } = req.body;

  // Validasi input
  if (!nama || !stok || !kondisi) {
    return res.status(400).json({ error: "Semua field harus diisi" });
  }

  if (isNaN(stok) || stok < 0) {
    return res.status(400).json({ error: "Stok harus berupa angka positif" });
  }

  db.query(
    "INSERT INTO barang (nama_barang, stok, kondisi) VALUES (?, ?, ?)",
    [nama, stok, kondisi],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Gagal tambah barang" });
      }

      res.status(201).json({ message: "Berhasil tambah barang" });
    },
  );
});

// =======================
// EDIT BARANG
// =======================
app.put("/edit/:id", (req, res) => {
  const id = req.params.id;
  const { nama, stok, kondisi } = req.body;

  if (!nama || !stok || !kondisi) {
    return res.status(400).json({ error: "Semua field harus diisi" });
  }

  if (isNaN(stok) || stok < 0) {
    return res.status(400).json({ error: "Stok harus berupa angka positif" });
  }

  db.query(
    "UPDATE barang SET nama_barang=?, stok=?, kondisi=? WHERE id=?",
    [nama, stok, kondisi, id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Gagal edit barang" });
      }

      res.status(200).json({ message: "Berhasil edit barang" });
    },
  );
});

// =======================
// HAPUS BARANG
// =======================
app.delete("/hapus/:id", (req, res) => {
  const id = req.params.id;

  db.query("DELETE FROM barang WHERE id=?", [id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Gagal hapus barang" });
    }

    res.status(200).json({ message: "Berhasil hapus barang" });
  });
});

// =======================
// PINJAM BARANG
// =======================
app.post("/pinjam", (req, res) => {
  const { nama, barang, jumlah, tgl_pinjam } = req.body;

  // Validasi input
  if (!nama || !barang || !jumlah || !tgl_pinjam) {
    return res.status(400).json({ error: "Semua field harus diisi" });
  }

  if (isNaN(jumlah) || jumlah <= 0) {
    return res.status(400).json({ error: "Jumlah harus berupa angka positif" });
  }

  db.query(
    "SELECT stok FROM barang WHERE nama_barang=?",
    [barang],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Gagal cek stok" });
      }

      if (result.length === 0) {
        return res.status(404).json({ error: "Barang tidak ditemukan" });
      }

      if (result[0].stok < jumlah) {
        return res.status(400).json({ error: "Stok tidak cukup" });
      }

      // kurangi stok
      db.query("UPDATE barang SET stok = stok - ? WHERE nama_barang=?", [
        jumlah,
        barang,
      ]);

      // simpan peminjaman
      db.query(
        "INSERT INTO peminjaman (nama_peminjam, nama_barang, jumlah, tanggal_pinjam, status) VALUES (?, ?, ?, ?, ?)",
        [nama, barang, jumlah, tgl_pinjam, "dipinjam"],
        (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: "Gagal catat peminjaman" });
          }

          res.status(201).json({ message: "Berhasil pinjam barang" });
        },
      );
    },
  );
});

// =======================
// LIHAT DATA PEMINJAMAN
// =======================
app.get("/peminjaman", (req, res) => {
  db.query("SELECT * FROM peminjaman ORDER BY created_at DESC", (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Gagal mengambil data peminjaman" });
    }

    res.status(200).json(result);
  });
});

// =======================
// KEMBALIKAN BARANG
// =======================
app.put("/kembalikan/:id", (req, res) => {
  const id = req.params.id;

  db.query(
    "SELECT nama_barang, jumlah, status FROM peminjaman WHERE id=?",
    [id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Gagal cek data peminjaman" });
      }

      if (result.length === 0) {
        return res.status(404).json({ error: "Data peminjaman tidak ditemukan" });
      }

      const data = result[0];

      if (data.status === "dikembalikan") {
        return res.status(400).json({ error: "Barang sudah dikembalikan" });
      }

      // tambah stok kembali
      db.query("UPDATE barang SET stok = stok + ? WHERE nama_barang=?", [
        data.jumlah,
        data.nama_barang,
      ]);

      // ubah status peminjaman
      db.query(
        "UPDATE peminjaman SET status='dikembalikan', tanggal_kembali=CURDATE() WHERE id=?",
        [id],
        (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: "Gagal mengembalikan barang" });
          }

          res.status(200).json({ message: "Barang berhasil dikembalikan" });
        },
      );
    },
  );
});

// =======================
// ERROR HANDLING MIDDLEWARE
// =======================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Server error" });
});
});
// =======================
// JALANKAN SERVER
// =======================
app.listen(PORT, () => {
  console.log(`✅ Server jalan di port ${PORT}`);
});
