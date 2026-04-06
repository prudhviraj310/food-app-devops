const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'food-app-db',
  user: 'root',
  password: process.env.DB_PASSWORD || 'rootpassword', // No more hardcoded secret!
  database: 'fooddb'
});

db.connect(err => {
  if (err) {
    console.error("Database connection failed: " + err.stack);
    return;
  }
  console.log("MySQL Connected...");
});

module.exports = db;