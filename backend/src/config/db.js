const path = require('path');
const fs = require('fs');
require('dotenv').config();

let dbClient = process.env.DB_CLIENT || 'sqlite';
let pool = null;
let sqliteDb = null;

if (dbClient === 'mysql' && process.env.DB_HOST) {
  try {
    const mysql = require('mysql2/promise');
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'kiss_vtms',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    console.log('[DB] Connected to MySQL database');
  } catch (err) {
    console.warn('[DB] MySQL initialization failed, falling back to SQLite:', err.message);
    dbClient = 'sqlite';
  }
}

if (!pool) {
  dbClient = 'sqlite';
  const sqlite3 = require('sqlite3').verbose();
  const bundledDir = path.join(__dirname, '../../data');
  let dbDir = bundledDir;
  if (process.env.VERCEL) {
    // Vercel's filesystem is read-only except /tmp: copy the bundled DB there.
    dbDir = '/tmp/kiss-data';
    fs.mkdirSync(dbDir, { recursive: true });
    const bundled = path.join(bundledDir, 'kiss_vtms.sqlite');
    const target = path.join(dbDir, 'kiss_vtms.sqlite');
    if (!fs.existsSync(target) && fs.existsSync(bundled)) {
      fs.copyFileSync(bundled, target);
    }
  } else if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbPath = path.join(dbDir, 'kiss_vtms.sqlite');
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('[DB] SQLite connection failed:', err);
    } else {
      console.log(`[DB] Connected to SQLite database at ${dbPath}`);
      sqliteDb.run('PRAGMA foreign_keys = ON;');
    }
  });
}

function exec(sql) {
  if (pool) {
    return pool.query(sql);
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.exec(sql, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
}

function query(sql, params = []) {
  if (pool) {
    return pool.execute(sql, params).then(([rows]) => rows);
  } else {
    return new Promise((resolve, reject) => {
      const trimmed = sql.trim().toUpperCase();
      if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA')) {
        sqliteDb.all(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        });
      } else {
        sqliteDb.run(sql, params, function (err) {
          if (err) return reject(err);
          resolve({ insertId: this.lastID, affectedRows: this.changes });
        });
      }
    });
  }
}

function getOne(sql, params = []) {
  if (pool) {
    return pool.execute(sql, params).then(([rows]) => rows[0] || null);
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  }
}

module.exports = {
  query,
  getOne,
  exec,
  dbClient
};
