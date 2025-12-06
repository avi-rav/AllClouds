const Database = require('better-sqlite3');
const db = new Database('contacts.db'); // SQLite database file

// Create the contacts table if it doesn't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT
  )
`).run();

module.exports = db;
