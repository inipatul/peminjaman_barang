require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Frontend
app.use(express.static(path.join(__dirname, "../frontend")));

const db = mysql.createPool({
  host: process.env.MYSQLHOST || process.env.DB_HOST,
  user: process.env.MYSQLUSER || process.env.DB_USER,
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
  database: process.env.MYSQL_DATABASE || process.env.DB_NAME,
  port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
});

function handleConnection() {
  db.getConnection((err, connection) => {
    if (err) {
      console.error("[ERROR] Database Connection Error:", err.message);
      // Retry connection after 2 seconds
      setTimeout(handleConnection, 2000);
      return;
    }

    console.log("[OK] Database terhubung");
  });
}

handleConnection();

// Handle connection errors
db.on("error", (err) => {
  console.error("[ERROR] Database Error:", err);
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    handleConnection();
  }
  if (err.code === "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR") {
    handleConnection();
  }
  if (err.code === "PROTOCOL_ENQUEUE_AFTER_QUIT") {
    handleConnection();
  }
});

// =======================
// AMBIL DATA BARANG
// =======================
app.get("/barang", (req, res) => {
  db.query("SELECT * FROM barang", (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }

    res.json(result);
  });
});

// =======================
// TAMBAH BARANG
// =======================
app.post("/tambah", (req, res) => {
  const { nama, stok, kondisi } = req.body;

  if (!nama || stok === undefined || !kondisi) {
    return res.status(400).json({
      error: "Semua field harus diisi",
    });
  }

  db.query(
    "INSERT INTO barang (nama_barang, stok, kondisi) VALUES (?, ?, ?)",
    [nama, stok, kondisi],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          error: err.message,
        });
      }

      res.status(201).json({
        message: "Barang berhasil ditambahkan",
      });
    },
  );
});

// =======================
// EDIT BARANG
// =======================
app.put("/edit/:id", (req, res) => {
  const { id } = req.params;
  const { nama, stok, kondisi } = req.body;

  db.query(
    "UPDATE barang SET nama_barang=?, stok=?, kondisi=? WHERE id=?",
    [nama, stok, kondisi, id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          error: err.message,
        });
      }

      res.json({
        message: "Barang berhasil diperbarui",
      });
    },
  );
});

// =======================
// HAPUS BARANG
// =======================
app.delete("/hapus/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM barang WHERE id=?", [id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        error: err.message,
      });
    }

    res.json({
      message: "Barang berhasil dihapus",
    });
  });
});

// =======================
// PINJAM BARANG
// =======================
app.post("/pinjam", (req, res) => {
  const { nama, barang, jumlah, tgl_pinjam } = req.body;

  if (!nama || !barang || !jumlah || !tgl_pinjam) {
    return res.status(400).json({
      error: "Semua field harus diisi",
    });
  }

  db.query(
    "SELECT id, stok FROM barang WHERE nama_barang=?",
    [barang],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          error: err.message,
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          error: "Barang tidak ditemukan",
        });
      }

      const stok = result[0].stok;
      const barangId = result[0].id;

      if (stok < jumlah) {
        return res.status(400).json({
          error: "Stok tidak cukup",
        });
      }

      // kurangi stok
      db.query(
        "UPDATE barang SET stok = stok - ? WHERE id=?",
        [jumlah, barangId],
        (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({
              error: err.message,
            });
          }

          // simpan peminjaman
          db.query(
            `INSERT INTO peminjaman
            (nama_peminjam, barang_id, jumlah, tanggal_pinjam, status)
            VALUES (?, ?, ?, ?, ?)`,
            [nama, barangId, jumlah, tgl_pinjam, "dipinjam"],
            (err) => {
              if (err) {
                console.error(err);
                return res.status(500).json({
                  error: err.message,
                });
              }

              res.status(201).json({
                message: "Peminjaman berhasil",
              });
            },
          );
        },
      );
    },
  );
});

// =======================
// DATA PEMINJAMAN
// =======================
app.get("/peminjaman", (req, res) => {
  db.query(`
    SELECT p.*, b.nama_barang 
    FROM peminjaman p 
    JOIN barang b ON p.barang_id = b.id 
    ORDER BY p.id DESC
  `, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        error: err.message,
      });
    }
    res.json(result);
  });
});

// =======================
// KEMBALIKAN BARANG
// =======================
app.put("/kembalikan/:id", (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM peminjaman WHERE id=?", [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        error: err.message,
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        error: "Data tidak ditemukan",
      });
    }

    const data = result[0];

    if (data.status === "dikembalikan") {
      return res.status(400).json({
        error: "Barang sudah dikembalikan",
      });
    }

    // kembalikan stok
    db.query(
      "UPDATE barang SET stok = stok + ? WHERE id=?",
      [data.jumlah, data.barang_id],
      (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({
            error: err.message,
          });
        }

        db.query(
          `UPDATE peminjaman
             SET status='dikembalikan',
                 tanggal_kembali=CURDATE()
             WHERE id=?`,
          [id],
          (err) => {
            if (err) {
              console.error(err);
              return res.status(500).json({
                error: err.message,
              });
            }

            res.json({
              message: "Barang berhasil dikembalikan",
            });
          },
        );
      },
    );
  });
});

// =======================
// ERROR HANDLER
// =======================
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    error: err.message,
  });
});

// =======================
// START SERVER
// =======================
app.listen(PORT, () => {
  console.log(`[OK] Server berjalan di port ${PORT}`);
});
