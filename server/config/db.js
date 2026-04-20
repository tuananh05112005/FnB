// config/db.js
const mysql = require("mysql2");
const util = require("util");

let db;
let query;

function initDB() {
  db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "05112005",
    database: process.env.DB_NAME || "pr",
  });

  db.connect((err) => {
    if (err) {
      console.error("Lỗi kết nối MySQL:", err);
    } else {
      console.log("Kết nối MySQL thành công!");
    }
  });

  query = util.promisify(db.query).bind(db);
}

function getDB() {
  return db;
}

function getQuery() {
  return query;
}

module.exports = { initDB, getDB, getQuery };
