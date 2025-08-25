// src/db.js
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'app.db');

function init() {
  const dir = path.dirname(DB_PATH);
  console.log('[db] Using SQLite at:', DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      first_name TEXT,
      last_name TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      confirm_token TEXT,
      confirm_sent_at TEXT,
      confirmed_at TEXT,
      unsubscribe_token TEXT,
      unsubscribed_at TEXT,
      consent_ip TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TRIGGER IF NOT EXISTS trg_subscribers_updated_at
    AFTER UPDATE ON subscribers
    FOR EACH ROW
    BEGIN
      UPDATE subscribers SET updated_at = datetime('now') WHERE id = OLD.id;
    END;
  `);
  return db;
}

const db = init();

/* ---------- Helpers ---------- */
function getByEmail(email) {
  return db.prepare('SELECT * FROM subscribers WHERE email = ?').get(email);
}

function insertPending({ email, firstName=null, lastName=null, token, consentIp=null, userAgent=null }) {
  const stmt = db.prepare(`
    INSERT INTO subscribers (email, first_name, last_name, status, confirm_token, confirm_sent_at, consent_ip, user_agent)
    VALUES (?, ?, ?, 'pending', ?, datetime('now'), ?, ?)
  `);
  return stmt.run(email, firstName, lastName, token, consentIp, userAgent);
}

function getByConfirmToken(token) {
  return db.prepare('SELECT * FROM subscribers WHERE confirm_token = ?').get(token);
}

function confirmByToken(token) {
  return db.prepare(`
    UPDATE subscribers
       SET status = 'confirmed',
           confirmed_at = datetime('now'),
           confirm_token = NULL
     WHERE confirm_token = ?
  `).run(token);
}


// Unsubscribe
function setUnsubscribeTokenById(id, token) {
  return db.prepare(`UPDATE subscribers SET unsubscribe_token = ? WHERE id = ?`).run(token, id);
}

function getByUnsubscribeToken(token) {
  return db.prepare('SELECT * FROM subscribers WHERE unsubscribe_token = ?').get(token);
}

function unsubscribeByToken(token) {
  return db.prepare(`
    UPDATE subscribers
       SET status = 'unsubscribed',
           unsubscribed_at = datetime('now'),
           unsubscribe_token = NULL
     WHERE unsubscribe_token = ?
  `).run(token);
}


/* ---------- Export unique ---------- */
module.exports = {
  db,
  getByEmail,
  insertPending,
  getByConfirmToken,
  confirmByToken,
  setUnsubscribeTokenById,   
  getByUnsubscribeToken,    
  unsubscribeByToken
};
