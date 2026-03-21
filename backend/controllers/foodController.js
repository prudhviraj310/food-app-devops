const db = require('../config/db');

exports.getFoods = (req, res) => {
  db.query("SELECT * FROM foods", (err, result) => {
    if (err) throw err;
    res.json(result);
  });
};
