'use strict';
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'shoes.db'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT    NOT NULL UNIQUE,
    brand TEXT    NOT NULL,
    size  REAL    NOT NULL,
    color TEXT    NOT NULL,
    price REAL    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS customers (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT    NOT NULL UNIQUE,
    password TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cart (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    product_name TEXT   NOT NULL,
    qty         INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (product_name) REFERENCES products(name)
  );
`);

// Seed products
const { cnt } = db.prepare('SELECT COUNT(*) AS cnt FROM products').get();
if (cnt === 0) {
  const insert = db.prepare(
    'INSERT INTO products (name, brand, size, color, price) VALUES (?, ?, ?, ?, ?)'
  );
  const seed = db.transaction(() => {
    insert.run('air-max',      'Nike',     10, 'white', 129.99);
    insert.run('chuck-taylor', 'Converse',  9, 'black',  59.99);
    insert.run('stan-smith',   'Adidas',   11, 'white',  89.99);
  });
  seed();
  console.log('Database seeded.');
}

module.exports = db;