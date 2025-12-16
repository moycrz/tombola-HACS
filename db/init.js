const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbDir = path.join(__dirname);
const dbPath = path.join(dbDir, 'tombola.db');
const schemaPath = path.join(dbDir, 'schema.sql');
const seedPath = path.join(dbDir, 'seed.sql');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');
const seedSQL = fs.readFileSync(seedPath, 'utf-8');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.exec(schemaSQL, (schemaErr) => {
    if (schemaErr) {
      console.error('Error al aplicar schema:', schemaErr.message);
      process.exit(1);
    }
    db.exec(seedSQL, (seedErr) => {
      if (seedErr) {
        console.error('Error al sembrar datos:', seedErr.message);
        process.exit(1);
      }
      console.log('Base de datos inicializada en', dbPath);
      db.close();
    });
  });
});
