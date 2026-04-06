const mysql = require('mysql2');

const db =  mysql.createConnection({
host: 'food-app-db',
  user: 'root',
  password: 'Prudhviraj@310',
  database: 'fooddb'
});

db.connect(err => {
  if (err) throw err;
  console.log("MySQL Connected...");
});

module.exports = db;
