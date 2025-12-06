const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Create uploads folder if not exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Setup multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use('/uploads', express.static(uploadDir)); // serve uploaded images

// Initialize SQLite database
const db = new Database('contacts.db');

// Create table if not exists
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

// ----------- Routes -----------

// Get all contacts
app.get('/contacts', (req, res) => {
  const contacts = db.prepare('SELECT * FROM contacts').all();
  res.json(contacts);
});

// Get contact by ID
app.get('/contacts/:id', (req, res) => {
  const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  if (!contact) return res.status(404).json({ error: 'Contact not found' });
  res.json(contact);
});

// Add new contact
app.post('/contacts', upload.single('image'), (req, res) => {
  const { name, fullAddress, email, phone, cell, registrationDate, age } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  const stmt = db.prepare(`
    INSERT INTO contacts (name, fullAddress, email, phone, cell, registrationDate, age, image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(name, fullAddress, email, phone, cell, registrationDate, age, image);
  res.json({ id: info.lastInsertRowid });
});

// Update contact
app.put('/contacts/:id', upload.single('image'), (req, res) => {
  const { name, fullAddress, email, phone, cell, registrationDate, age } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  const stmt = db.prepare(`
    UPDATE contacts
    SET name=?, fullAddress=?, email=?, phone=?, cell=?, registrationDate=?, age=?, image=COALESCE(?, image)
    WHERE id=?
  `);
  const info = stmt.run(name, fullAddress, email, phone, cell, registrationDate, age, image, req.params.id);

  if (info.changes === 0) return res.status(404).json({ error: 'Contact not found' });
  res.json({ success: true });
});

// Delete contact
app.delete('/contacts/:id', (req, res) => {
  const stmt = db.prepare('DELETE FROM contacts WHERE id=?');
  const info = stmt.run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Contact not found' });
  res.json({ success: true });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
