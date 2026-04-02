import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [foods, setFoods] = useState([]);

  useEffect(() => {
    axios.get('http://127.0.0.1:5000/api/foods')
      .then(res => setFoods(res.data))
      .catch(err => console.log(err));
  }, []);

  return (
    <div>
      <h1>Food Menu</h1>
      {foods.map(food => (
        <div key={food.id}>
          <h3>{food.name}</h3>
          <p>{food.price}</p>
        </div>
      ))}
    </div>
  );
}

export default App;
