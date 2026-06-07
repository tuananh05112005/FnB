// config/db.js
const mysql = require("mysql2");
const util = require("util");

let db;
let query;

function initDB() {
  const connectionConfig = {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "05112005",
    database: process.env.DB_NAME || "pr",
  };

  if (process.env.DB_SSL === "true" || connectionConfig.host.includes("aivencloud.com")) {
    connectionConfig.ssl = {
      rejectUnauthorized: false
    };
  }

  db = mysql.createPool(connectionConfig);

  // Lấy một kết nối từ pool để kiểm tra và đồng bộ dữ liệu ban đầu
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Lỗi kết nối MySQL từ Pool:", err);
    } else {
      console.log("Kết nối MySQL từ Pool thành công!");
      // Một lần duy nhất gán order_code cho các dòng cũ
      connection.query(
        "UPDATE cart SET order_code = CONCAT('DH', LPAD(id, 8, '0')) WHERE order_code IS NULL",
        (updateErr) => {
          connection.release();
          if (updateErr) {
            console.error("Lỗi cập nhật order_code cho dữ liệu cũ:", updateErr);
          } else {
            console.log("Đã đồng bộ order_code cho các bản ghi cũ thành công.");
          }
        }
      );
    }
  });

  query = util.promisify(db.query).bind(db);
}

// Tra ve ket noi MySQL goc cho nhung controller dang dung callback.
function getDB() {
  return db;
}

// Tra ve ham query Promise de dung voi async/await.
function getQuery() {
  return query;
}

module.exports = { initDB, getDB, getQuery };
