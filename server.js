const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5001;

const csvPath = path.join(__dirname, 'data', 'pokedex.csv');
let pokedex = [];
try {
  const csvData = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvData.trim().split('\n');
  pokedex = lines.slice(1).map(line => {
    const values = line.split(',');
    return {
      number: parseInt(values[0], 10),
      name: values[1],
      type1: values[2],
      type2: values[3] || null,
    };
  });
} catch (e) {
  console.error('Failed to load Pokédex data:', e.message);
  process.exit(1);
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/pokedex', (req, res) => {
  res.json(pokedex);
});

app.listen(PORT, () => {
  console.log(`Pokédex Binder server running at http://localhost:${PORT}`);
});
