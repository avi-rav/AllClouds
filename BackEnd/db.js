const Database = require('better-sqlite3');
const db = new Database('contacts.db');

// Drop the old table if it exists
db.prepare(`DROP TABLE IF EXISTS contacts`).run();

// Create the new table with your desired fields
db.prepare(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    fullAddress TEXT,
    email TEXT,
    phone TEXT,
    cell TEXT,
    registrationDate TEXT,
    age INTEGER,
    image TEXT
  )
`).run();

console.log('New contacts table created successfully');
module.exports = db;