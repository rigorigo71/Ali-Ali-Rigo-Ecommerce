'use strict';
const Database = require('better-sqlite3');
const path     = require('path');

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
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id  INTEGER NOT NULL,
    product_name TEXT    NOT NULL,
    qty          INTEGER NOT NULL DEFAULT 1,
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
    // Original 3
    insert.run('air-max',         'Nike',        10, 'white',  129.99);
    insert.run('chuck-taylor',    'Converse',     9, 'black',   59.99);
    insert.run('stan-smith',      'Adidas',      11, 'white',   89.99);
    // 10 new products
    insert.run('dunk-low',        'Nike',        10, 'white',  110.00);
    insert.run('air-jordan-1',    'Jordan',      11, 'red',    180.00);
    insert.run('air-jordan-4',    'Jordan',      10, 'black',  210.00);
    insert.run('new-balance-574', 'New Balance',  9, 'grey',    89.99);
    insert.run('new-balance-990', 'New Balance', 11, 'grey',   184.99);
    insert.run('ultraboost-22',   'Adidas',      10, 'black',  190.00);
    insert.run('old-skool',       'Vans',         8, 'black',   65.00);
    insert.run('classic-leather', 'Reebok',      10, 'white',   80.00);
    insert.run('gel-kayano-30',   'ASICS',       10, 'blue',   160.00);
    insert.run('suede-classic',   'Puma',         9, 'navy',    70.00);
  });
  seed();
  console.log('Database seeded.');
}

module.exports = db;