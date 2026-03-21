const express = require('express');
const cors = require('cors');
const foodRoutes = require('./routes/foodRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/foods', foodRoutes);

app.get('/', (req, res) => {
  res.send("Food API Running");
});

app.listen(5000, () => console.log("Server running on port 5000"));
