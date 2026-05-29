const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Database = require('better-sqlite3');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5001;

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

const dbPath = process.env.BINDER_DB_PATH || path.join(__dirname, 'data', 'binder.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS binder_states (
  id TEXT PRIMARY KEY,
  state TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
)`);

const insertStmt = db.prepare('INSERT INTO binder_states (id, state) VALUES (?, ?)');
const getStmt = db.prepare('SELECT state FROM binder_states WHERE id = ?');
const updateStmt = db.prepare("UPDATE binder_states SET state = ?, updated_at = datetime('now') WHERE id = ?");

function generateId() {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  let id = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    id += chars[bytes[i] % 36];
  }
  return id;
}

function createBinderId() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const id = generateId();
    const existing = getStmt.get(id);
    if (!existing) return id;
  }
  throw new Error('Failed to generate unique binder ID after 10 attempts');
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/pokedex', (req, res) => {
  res.json(pokedex);
});

app.post('/api/binder', (req, res) => {
  try {
    const id = createBinderId();
    const state = req.body && req.body.state ? JSON.stringify(req.body.state) : JSON.stringify({ binderSlots: [], rows: 3, columns: 3, pages: 40 });
    insertStmt.run(id, state);
    res.json({ id });
  } catch (e) {
    console.error('Failed to create binder:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/binder/:id', (req, res) => {
  const row = getStmt.get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Binder not found' });
  res.json(JSON.parse(row.state));
});

app.put('/api/binder/:id', (req, res) => {
  const row = getStmt.get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Binder not found' });
  const state = JSON.stringify(req.body);
  updateStmt.run(state, req.params.id);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Pokédex Binder server running at http://localhost:${PORT}`);
});
