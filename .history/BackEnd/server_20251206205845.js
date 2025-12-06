const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db'); // make sure db.js exists in the same folder

const app = express();
app.use(bodyParser.json());

app.get('/test', (req, res) => {
    res.send('Server is alive!');
  });
  
// GET all contacts
app.get('/contacts', (req, res) => {
  const contacts = db.prepare('SELECT * FROM contacts').all();
  res.json(contacts);
});

// POST a contact
app.post('/contacts', (req, res) => {
  const { name, phone, email } = req.body;
  const info = db.prepare('INSERT INTO contacts (name, phone, email) VALUES (?, ?, ?)').run(name, phone, email);
  res.json({ id: info.lastInsertRowid, name, phone, email });
});

// DELETE a contact
app.delete('/contacts/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM contacts WHERE id = ?').run(id);
  res.json({ success: true });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
