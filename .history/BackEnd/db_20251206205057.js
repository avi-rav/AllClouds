const Database = require('better-sqlite3');

// Opens (or creates) a local SQLite file
const db = new Database('contacts.db');

// Create table if it doesn't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT
  )
`).run();

module.exports = db;
