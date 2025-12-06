const Database = require('better-sqlite3');
const db = new Database('contacts.db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT
  )
`).run();

module.exports = db;
