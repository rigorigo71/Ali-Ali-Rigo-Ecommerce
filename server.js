'use strict';
const express  = require('express');
const path     = require('path');
const session  = require('express-session');
const bcrypt   = require('bcryptjs');
const db       = require('./database');

const app  = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;

// ---------- Middleware ----------
app.use(session({
  secret: 'sole-secret-key',
  resave: false,
  saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Pug setup ----------
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// ---------- Helpers ----------
function normalizeName(name) {
  return (name ?? '').toString().trim().toLowerCase();
}

function findProduct(identifier) {
  return db.prepare('SELECT * FROM products WHERE name = ?')
           .get(normalizeName(identifier));
}

function getCart(customerId) {
  return db.prepare(`
    SELECT c.product_name AS name, c.qty, p.brand, p.price, p.size, p.color
    FROM cart c
    JOIN products p ON p.name = c.product_name
    WHERE c.customer_id = ?
  `).all(customerId);
}

function requireLogin(req, res, next) {
  if (!req.session.customer) return res.redirect('/login');
  next();
}

// ---------- VIEW ROUTES ----------

app.get('/', (req, res) => res.render('home'));

app.get('/products', (req, res) => {
  const sortMap = {
    'price-asc':  'price ASC',
    'price-desc': 'price DESC',
    'brand-asc':  'brand ASC',
    'name-asc':   'name ASC',
    'color-asc':  'color ASC',
  };
  const sort = sortMap[req.query.sort] || 'id ASC';
  const shoes = db.prepare(`SELECT * FROM products ORDER BY ${sort}`).all();
  res.render('products', { shoes, currentSort: req.query.sort || '' });
});

app.get('/products/:identifier', (req, res) => {
  const shoe = findProduct(req.params.identifier);
  if (!shoe) return res.status(404).render('404', { message: `We couldn't find "${req.params.identifier}"` });
  res.render('product-detail', { shoe });
});

// ---------- AUTH ROUTES ----------

app.get('/register', (req, res) => res.render('register', { error: null }));

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.render('register', { error: 'Username and password are required.' });

  // Normalize username so "Alice" and "alice" are treated as the same account
  const normalizedUsername = username.trim().toLowerCase();

  const existing = db.prepare('SELECT id FROM customers WHERE username = ?').get(normalizedUsername);
  if (existing)
    return res.render('register', { error: 'Username already taken.' });

  const hash   = await bcrypt.hash(password, 12);
  const result = db.prepare('INSERT INTO customers (username, password) VALUES (?, ?)')
                   .run(normalizedUsername, hash);

  req.session.customer = { id: result.lastInsertRowid, username: normalizedUsername };
  res.redirect('/');
});

app.get('/login', (req, res) => res.render('login', { error: null }));

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const normalizedUsername = (username ?? '').trim().toLowerCase();

  const customer = db.prepare('SELECT * FROM customers WHERE username = ?').get(normalizedUsername);

  // Use bcrypt.compare for hashed passwords. The intentionally vague error
  // message avoids leaking whether the username exists.
  const valid = customer && await bcrypt.compare(password, customer.password);
  if (!valid)
    return res.render('login', { error: 'Invalid username or password.' });

  req.session.customer = { id: customer.id, username: customer.username };
  res.redirect('/');
});

app.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// ---------- PROFILE ----------

app.get('/profile', requireLogin, (req, res) => {
  res.render('profile', { customer: req.session.customer });
});

// ---------- CART ROUTES ----------

app.get('/cart', requireLogin, (req, res) => {
  const cart = getCart(req.session.customer.id);
  res.render('cart', { cart, customer: req.session.customer });
});

// Accepts optional qty (defaults to 1). If the item is already in the cart,
// the requested qty is added on top of the existing quantity.
app.post('/cart/add', requireLogin, (req, res) => {
  const { name, qty: rawQty } = req.body;
  const qty = Math.max(1, parseInt(rawQty, 10) || 1);   // ← qty support

  const product = findProduct(name);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const customerId = req.session.customer.id;
  const existing = db.prepare(
    'SELECT * FROM cart WHERE customer_id = ? AND product_name = ?'
  ).get(customerId, product.name);

  if (existing) {
    db.prepare('UPDATE cart SET qty = qty + ? WHERE customer_id = ? AND product_name = ?')
      .run(qty, customerId, product.name);
  } else {
    db.prepare('INSERT INTO cart (customer_id, product_name, qty) VALUES (?, ?, ?)')
      .run(customerId, product.name, qty);
  }

  res.json({ success: true, cart: getCart(customerId) });
});

// Adjusts qty by delta (+1 or -1). Removes the item if qty drops to 0.
app.post('/cart/update', requireLogin, (req, res) => {
  const { name, delta } = req.body;
  const customerId = req.session.customer.id;
  const normalized = normalizeName(name);

  const existing = db.prepare(
    'SELECT * FROM cart WHERE customer_id = ? AND product_name = ?'
  ).get(customerId, normalized);

  if (!existing) return res.status(404).json({ error: 'Item not in cart' });

  const newQty = existing.qty + (parseInt(delta, 10) || 0);
  if (newQty <= 0) {
    db.prepare('DELETE FROM cart WHERE customer_id = ? AND product_name = ?')
      .run(customerId, normalized);
  } else {
    db.prepare('UPDATE cart SET qty = ? WHERE customer_id = ? AND product_name = ?')
      .run(newQty, customerId, normalized);
  }

  res.json({ success: true, cart: getCart(customerId) });
});

app.post('/cart/remove', requireLogin, (req, res) => {
  const { name } = req.body;
  const customerId = req.session.customer.id;
  db.prepare('DELETE FROM cart WHERE customer_id = ? AND product_name = ?')
    .run(customerId, normalizeName(name));
  res.json({ success: true, cart: getCart(customerId) });
});

// ---------- API ROUTES ----------

app.get('/api/products', (req, res) => {
  res.json(db.prepare('SELECT * FROM products').all());
});

app.get('/api/products/:identifier', (req, res) => {
  const product = findProduct(req.params.identifier);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

app.head('/api/products', (req, res) => {
  const { cnt } = db.prepare('SELECT COUNT(*) AS cnt FROM products').get();
  res.set('X-Product-Count', cnt).status(200).end();
});

app.post('/api/products/add', (req, res) => {
  const { name, brand, size, color, price } = req.body;

  if (!name || !brand || !color)
    return res.status(400).json({ error: 'name, brand, and color are required' });
  if (typeof size !== 'number' || size <= 0)
    return res.status(400).json({ error: 'size must be a positive number' });
  if (typeof price !== 'number' || price < 0)
    return res.status(400).json({ error: 'price must be a non-negative number' });
  if (findProduct(name))
    return res.status(409).json({ error: 'A product with that name already exists' });

  const normalized = normalizeName(name);
  db.prepare(
    'INSERT INTO products (name, brand, size, color, price) VALUES (?, ?, ?, ?, ?)'
  ).run(normalized, brand, size, color, price);

  res.status(201).json({ name: normalized, brand, size, color, price });
});

app.delete('/api/products/:identifier', (req, res) => {
  const product = findProduct(req.params.identifier);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  db.prepare('DELETE FROM products WHERE name = ?').run(normalizeName(req.params.identifier));
  res.json(product);
});

// ---------- Catch-all & Error handler ----------
app.use((req, res) => res.status(404).render('404', { message: 'Page not found' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));