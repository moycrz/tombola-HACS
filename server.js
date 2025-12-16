const express = require('express');
const path = require('path');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const PRIZES_FILE = path.join(DATA_DIR, 'premios.csv');
const WON_FILE = path.join(DATA_DIR, 'premios_ganados.csv');

const SLOT_COLUMNS = ['id', 'nombre', 'descripcion', 'valor'];
const WON_COLUMNS = [...SLOT_COLUMNS, 'fechaHora'];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Simple promise chain to serialize /api/girar and avoid concurrent writes
let drawQueue = Promise.resolve();
const runWithLock = (fn) => {
  const next = drawQueue.then(() => fn());
  drawQueue = next.catch(() => {});
  return next;
};

const ensureDataFiles = () => {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(PRIZES_FILE)) {
    throw new Error(
      'El archivo data/premios.csv no existe. Crea el archivo con los premios antes de iniciar.'
    );
  }
  if (!fs.existsSync(WON_FILE)) {
    const output = stringify([], { header: true, columns: WON_COLUMNS });
    fs.writeFileSync(WON_FILE, output, 'utf8');
  }
};

const readCsv = (filePath, columns) => {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.trim()) return [];
  const rows = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  return rows.map((row) => {
    const normalized = {};
    columns.forEach((key) => {
      normalized[key] = (row[key] ?? '').toString().trim();
    });
    return normalized;
  });
};

const writeCsv = (filePath, rows, columns) => {
  const output = stringify(rows, {
    header: true,
    columns,
  });
  fs.writeFileSync(filePath, output, 'utf8');
};

const getAvailablePrizes = () => {
  const prizes = readCsv(PRIZES_FILE, SLOT_COLUMNS);
  const won = readCsv(WON_FILE, WON_COLUMNS);
  const usedIds = new Set(won.map((p) => p.id));
  return prizes.filter((p) => p.id && !usedIds.has(p.id));
};

const getHistory = () => readCsv(WON_FILE, WON_COLUMNS);

const recordWin = (prize) => {
  const current = getHistory();
  const fechaHora = new Date().toISOString();
  const entry = { ...prize, fechaHora };
  current.push(entry);
  writeCsv(WON_FILE, current, WON_COLUMNS);
  return entry;
};

app.get('/api/premios', (_req, res) => {
  try {
    ensureDataFiles();
    const available = getAvailablePrizes();
    res.json(available);
  } catch (error) {
    console.error('Error al leer premios', error);
    res.status(500).json({ error: 'No se pudieron leer los premios.' });
  }
});

app.get('/api/ganados', (_req, res) => {
  try {
    ensureDataFiles();
    const history = getHistory();
    res.json(history);
  } catch (error) {
    console.error('Error al leer historial', error);
    res.status(500).json({ error: 'No se pudo leer el historial.' });
  }
});

app.post('/api/girar', async (_req, res) => {
  const spin = async () => {
    ensureDataFiles();
    const available = getAvailablePrizes();
    if (!available.length) {
      return res.status(400).json({ error: 'No hay premios disponibles.' });
    }
    const pickIndex = Math.floor(Math.random() * available.length);
    const selected = available[pickIndex];
    const recorded = recordWin(selected);
    const remaining = available.filter((_, idx) => idx !== pickIndex);
    return res.json({ premio: recorded, ruleta: available, disponibles: remaining });
  };

  try {
    await runWithLock(spin);
  } catch (error) {
    console.error('Error durante el giro', error);
    res.status(500).json({ error: 'No se pudo completar el giro.' });
  }
});

app.get('/print', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'print.html'));
});

app.listen(PORT, () => {
  console.log(`Ruleta lista en http://localhost:${PORT}`);
});
