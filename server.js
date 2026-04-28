'use strict';
const express = require('express');
const path = require('path');
const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Pug setup
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// ---------- In‑memory product data ----------
const shoes = [
    { name: 'air-max', brand: 'Nike', size: 10, color: 'white', price: 129.99 },
    { name: 'chuck-taylor', brand: 'Converse', size: 9, color: 'black', price: 59.99 },
    { name: 'stan-smith', brand: 'Adidas', size: 11, color: 'white', price: 89.99 }
];

function normalizeName(name) {
    return (name ?? '').toString().trim().toLowerCase();
}

function findProductByIdentifier(identifier) {
    const normalized = normalizeName(identifier);
    return shoes.find(shoe => shoe.name === normalized);
}

// ---------- VIEW ROUTES (HTML via Pug) ----------

// Home page
app.get('/', (req, res) => {
    res.render('home');
});

// All products page
app.get('/products', (req, res) => {
    res.render('products', { shoes });
});

// Single product detail page (or 404)
app.get('/products/:identifier', (req, res) => {
    const product = findProductByIdentifier(req.params.identifier);
    if (!product) {
        return res.status(404).render('404', { identifier: req.params.identifier });
    }
    res.render('product-detail', { shoe: product });
});

// Login form (GET)
app.get('/login', (req, res) => {
    res.render('login');
});

// Login form submission (POST) – dummy handler
app.post('/login', (req, res) => {
    // No real authentication – just redirect to home
    res.redirect('/');
});

// User profile (static mockup)
app.get('/profile', (req, res) => {
    res.render('profile');
});

// Shopping cart (static mockup)
app.get('/cart', (req, res) => {
    res.render('cart');
});

// ---------- API ROUTES (JSON, under /api prefix) ----------

// Get all products as JSON
app.get('/api/products', (req, res) => {
    res.status(200).json(shoes);
});

// Get one product as JSON
app.get('/api/products/:identifier', (req, res) => {
    const product = findProductByIdentifier(req.params.identifier);
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json(product);
});

// HEAD request – returns product count in header
app.head('/api/products', (req, res) => {
    res.set('X-Product-Count', shoes.length).status(200).end();
});

// Add a new product
app.post('/api/products/add', (req, res) => {
    const { name, brand, size, color, price } = req.body;

    // Validation
    if (!name || !brand || !color) {
        return res.status(400).json({ error: 'name, brand, and color are required' });
    }
    if (typeof size !== 'number' || size <= 0) {
        return res.status(400).json({ error: 'size must be a positive number' });
    }
    if (typeof price !== 'number' || price < 0) {
        return res.status(400).json({ error: 'price must be a non-negative number' });
    }
    if (findProductByIdentifier(name)) {
        return res.status(409).json({ error: 'A product with that name already exists' });
    }

    const newProduct = {
        name: normalizeName(name),
        brand,
        size,
        color,
        price
    };
    shoes.push(newProduct);
    res.status(201).json(newProduct);
});

// Delete a product
app.delete('/api/products/:identifier', (req, res) => {
    const index = shoes.findIndex(s => s.name === normalizeName(req.params.identifier));
    if (index === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }
    const removed = shoes.splice(index, 1);
    res.status(200).json(removed[0]);
});

// ---------- Catch‑all 404 for undefined routes (returns JSON) ----------
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// ---------- Global error handler ----------
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

// ---------- Start server ----------
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});