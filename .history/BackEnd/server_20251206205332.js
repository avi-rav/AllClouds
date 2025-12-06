const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db'); // Import the database

const app = express();
app.use(bodyParser.json());

// Get all contacts
app.get('/contacts', (req, res) => {
  const contacts = db.prepare('SELECT * FROM contacts').all();
  res.json(contacts);
});

// Add a new contact
app.post('/contacts', (req, res) => {
  const { name, phone, email } = req.body;
  const stmt = db.prepare('INSERT INTO contacts (name, phone, email) VALUES (?, ?, ?)');
  const info = stmt.run(name, phone, email);
  res.json({ id: info.lastInsertRowid, name, phone, email });
});

// Delete a contact
app.delete('/contacts/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM contacts WHERE id = ?').run(id);
  res.json({ success: true });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
