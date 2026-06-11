require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

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
   
    console.log(err);
  } else {
    console.log("Database terhubung");
  }
});

// =======================
// AMBIL DATA BARANG
// =======================
app.get("/barang", (req, res) => {
  db.query("SELECT * FROM barang", (err, result) => {
    if (err) {
      console.log(err);
      return res.send("Error");
    }

    res.json(result);
  });
});

// =======================
// TAMBAH BARANG
// =======================
app.post("/tambah", (req, res) => {
  const { nama, stok, kondisi } = req.body;

  db.query(
    "INSERT INTO barang (nama_barang, stok, kondisi) VALUES (?, ?, ?)",
    [nama, stok, kondisi],
    (err) => {
      if (err) {
        console.log(err);
        return res.send("Gagal tambah");
      }

      res.send("Berhasil tambah");
    },
  );
});

// =======================
// EDIT BARANG
// =======================
app.put("/edit/:id", (req, res) => {
  const id = req.params.id;
  const { nama, stok, kondisi } = req.body;

  db.query(
    "UPDATE barang SET nama_barang=?, stok=?, kondisi=? WHERE id=?",
    [nama, stok, kondisi, id],
    (err) => {
      if (err) {
        console.log(err);
        return res.send("Gagal edit");
      }

      res.send("Berhasil edit");
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
      console.log(err);
      return res.send("Gagal hapus");
    }

    res.send("Berhasil hapus");
  });
});

// =======================
// PINJAM BARANG
// =======================
app.post("/pinjam", (req, res) => {
  const { nama, barang, jumlah, tgl_pinjam } = req.body;

  db.query(
    "SELECT stok FROM barang WHERE nama_barang=?",
    [barang],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.send("Error");
      }

      if (result.length === 0) {
        return res.send("Barang tidak ditemukan");
      }

      if (result[0].stok < jumlah) {
        return res.send("Stok tidak cukup");
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
      );

      res.send("Berhasil pinjam");
    },
  );
});

// =======================
// LIHAT DATA PEMINJAMAN
// =======================
app.get("/peminjaman", (req, res) => {
  db.query("SELECT * FROM peminjaman", (err, result) => {
    if (err) {
      console.log(err);
      return res.send("Error");
    }

    res.json(result);
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
        console.log(err);
        return res.send("Error");
      }

      if (result.length === 0) {
        return res.send("Data tidak ditemukan");
      }

      const data = result[0];

      if (data.status === "dikembalikan") {
        return res.send("Barang sudah dikembalikan");
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
            console.log(err);
            return res.send("Gagal mengembalikan");
          }

          res.send("Barang berhasil dikembalikan");
        },
      );
    },
  );
});
// =======================
// JALANKAN SERVER
// =======================
app.listen(process.env.PORT || 3000, () => {
  console.log(`Server jalan di port ${process.env.PORT || 3000}`);
});
