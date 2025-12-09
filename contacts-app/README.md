# Contact Manager (Angular + Node.js) — With Offline Application

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.0.1.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

This project is a full **offline‑first Contact Management App** built with **Angular (frontend)** and **Node.js + SQLite (backend)**. It supports creating, editing, and viewing contacts both **online and offline**, including offline image handling and automatic background syncing.

## Features

### ✅ **1. Offline‑first Architecture**
- Uses **Local storage** in the browser to store contacts when offline.
- Queue system for storing CREATE/UPDATE actions offline.
- Automatic sync when the device reconnects to the Internet.
- Smooth user experience regardless of connectivity.

### ✅ **2. Contacts CRUD**
- Create, edit, delete, view contacts.
- Email, phone, and cell validations.
- Automatic date formatting.

### ✅ **3. Image Upload (Online + Offline)**
- When online → image is uploaded to server → stored on backend.
- When offline → image stored in Local storage as Base64 → synced later.
- Preview image shown instantly.

### ✅ **4. Mobile‑First UI**
- Designed first for **small screens**.
- Clean vertical layout on mobile.
- Responsive adjustments for tablet and desktop.

### ✅ **5. Backend Using SQLite**
- Node.js + Express server.
- REST API for CRUD operations.
- SQLite local DB for permanent storage.

---

## 📁 Project Structure

```
project/
 ├── frontend/ (Angular)
 │     ├── app/
 │     │    ├── services/
 │     │    │     ├── contact.service.ts
 │     │    │     ├── notifications.service.ts
 │     │    ├── pages/
 │     │    │     ├── list/
 │     │    │     └── detail/
 │     │    └── components/
 │     └── assets/
 └── backend/ (Node.js)
       ├── server.js
       ├── db.js (SQLite init)
       └── upload/ (Directory for images)
```

---

## 🧠 How Offline Mode Works

### **🔹 1. Saving Data**
When the user saves a contact:

- **If online** → send to backend → SQLite → update local IndexedDB.
- **If offline** → save in Local storage + queue the action.

### **🔹 2. Queue System**
Each offline action is stored inside:
```
queue: [{id: create_num, type: 'create' | 'update', upload, contactId?: num_action, formData?:Image in Base64 }]
```

### **🔹 3. Syncing When Back Online**
The `ContactService` listens for browser `online` events.

When triggered:
- Upload queued contacts.
- Upload queued images.
- Clear queue.

---

## 🧩 Validations

### **Email**
- Valid email format.
- Error disappears if user clears the field.

### **Phone / Cell**
- Accepts only digits, plus, minus, and spaces and some American formats.
- Error shown and removed only after blur.
- Error removed if field is empty.

---

## 📦 Backend (Node.js + SQLite)

SQLite schema:
```sql
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
);
```

Backend provides endpoints:
- `GET /contacts`
- `GET /contacts/:id`
- `POST /contacts`
- `PUT /contacts/:id`
- `DELETE /contacts/:id`
- `POST /contacts/:id/upload` (image upload)

---

## 📱 Mobile‑First UI
Designed starting from mobile:
- Single column layout.
- Large tappable elements.
- Minimal spacing.

---

## 🚀 Setup Instructions

### **1. Backend**
```
cd backend
npm install
node server.js
```

### **2. Frontend - contacts-app**
```
cd contacts-app
npm install
ng serve
```

---

## 🌐 Sync Flow Diagram

```
User Action → Save Contact →
  IF Online → API → SQLite → Update local IndexedDB
  IF Offline → Local storage → Add to Sync Queue → Wait

Browser Goes Online → SyncService →
    Upload queued contacts
    Upload queued images
    Clean queue
```

---

## 📄 License
MIT

---

## 🙋 Support / Questions
Feel free to open an issue or ask for help.

