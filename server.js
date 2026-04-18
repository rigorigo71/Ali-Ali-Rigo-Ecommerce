'use strict';
const express = require('express');
const path = require('path');
const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

/** @type {{name:string, brand:string, size:number, color:string, price:number}[]} */
const shoes = [
    { name: 'air-max', brand: 'Nike', size: 10, color: 'white', price: 129.99 },
    { name: 'chuck-taylor', brand: 'Converse', size: 9, color: 'black', price: 59.99 },
    { name: 'stan-smith', brand: 'Adidas', size: 11, color: 'white', price: 89.99 }
];

function normalizeName(name) {
    return (name ?? '').toString().trim().toLowerCase();
}

function findShoeByName(name) {
    const normalized = normalizeName(name);
    return shoes.find(shoe => shoe.name === normalized);
}

// View routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/shoes', (req, res) => {
    res.render('shoes', { shoes });
});

app.get('/shoes/:name', (req, res) => {
    const shoe = findShoeByName(req.params.name);
    if (!shoe) {
        return res.status(404).render('error', { message: 'Shoe not found' });
    }
    res.render('shoe-detail', { shoe });
});

// API routes
app.get('/api/shoes', (req, res) => {
    res.status(200).json(shoes);
});

app.get('/api/shoes/:name', (req, res) => {
    const shoe = findShoeByName(req.params.name);
    if (!shoe) {
        return res.status(404).json({ error: 'Shoe not found' });
    }
    res.status(200).json(shoe);
});

app.head('/api/shoes', (req, res) => {
    res.set('X-Product-Count', shoes.length).status(200).end();
});

app.post('/api/shoes', (req, res) => {
    const { name, brand, size, color, price } = req.body;

    if (!name || !brand || !color) {
        return res.status(400).json({ error: 'name, brand, and color are required' });
    }
    if (typeof size !== 'number' || size <= 0) {
        return res.status(400).json({ error: 'size must be a positive number' });
    }
    if (typeof price !== 'number' || price < 0) {
        return res.status(400).json({ error: 'price must be a non-negative number' });
    }
    if (findShoeByName(name)) {
        return res.status(409).json({ error: 'A shoe with that name already exists' });
    }

    const newShoe = { name: normalizeName(name), brand, size, color, price };
    shoes.push(newShoe);
    res.status(201).json(newShoe);
});

app.delete('/api/shoes/:name', (req, res) => {
    const index = shoes.findIndex(s => s.name === normalizeName(req.params.name));
    if (index === -1) {
        return res.status(404).json({ error: 'Shoe not found' });
    }
    const [removed] = shoes.splice(index, 1);
    res.status(200).json(removed);
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});