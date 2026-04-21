# SOLE — Shoe Store

A Node.js/Express e-commerce catalog for browsing and discovering footwear from top brands.

## Contributers

| Name | GitHub |
|------|--------|
| Rigoberto Lemus | [@rigorigo71](https://github.com/rigorigo71) |
| Ali Sohby | [@asohby04](https://github.com/asohby04) |
| Ali Piskin | [@aarda5](https://github.com/aarda5) |

All contributers collaborate through GitHub using feature branches.
---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express 5
- **Templating:** Pug
- **Dev Tools:** Nodemon

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm

### Installation

```bash
git clone https://github.com/your-org/Ali-Ali-Rigo-Ecommerce.git
cd Ali-Ali-Rigo-Ecommerce
npm install
```

### Running the App

```bash
# Production
npm start

# Development (auto-restarts on file changes)
npm run dev
```

The server starts at **http://localhost:3000** by default. You can override the port with the `PORT` environment variable:

```bash
PORT=8080 npm start
```

---

## Project Structure

```
├── server.js          # Express app & route definitions
├── package.json
├── public/
│   └── styles.css     # Global stylesheet
└── views/             # Pug templates
    ├── index.pug      # Home/hero page
    ├── shoes.pug      # Shoe catalog grid
    ├── shoe-detail.pug
    └── error.pug
```

---

## Data Model

Each shoe object has the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | URL-friendly identifier (e.g. `air-max`) |
| `brand` | `string` | Manufacturer name (e.g. `Nike`) |
| `size` | `number` | US shoe size (e.g. `10`) |
| `color` | `string` | Color description (e.g. `white`) |
| `price` | `number` | Price in USD (e.g. `129.99`) |

---

## API Reference

All API endpoints are prefixed with `/api`.

### `GET /api/shoes`
Returns the full list of shoes.

**Response `200`:**
```json
[
  { "name": "air-max", "brand": "Nike", "size": 10, "color": "white", "price": 129.99 }
]
```

---

### `GET /api/shoes/:name`
Returns a single shoe by its name identifier.

**Response `200`:**
```json
{ "name": "air-max", "brand": "Nike", "size": 10, "color": "white", "price": 129.99 }
```

**Response `404`:**
```json
{ "error": "Shoe not found" }
```

---

### `HEAD /api/shoes`
Returns the total product count in the `X-Product-Count` response header. No body is returned.

---

### `POST /api/shoes`
Adds a new shoe to the catalog.

**Request body:**
```json
{
  "name": "blazer-mid",
  "brand": "Nike",
  "size": 10,
  "color": "black",
  "price": 99.99
}
```

**Validation rules:**
- `name`, `brand`, and `color` are required strings
- `size` must be a positive number
- `price` must be a non-negative number
- `name` must be unique (case-insensitive)

**Response `201`:** Returns the newly created shoe object.

**Response `400`:** Missing or invalid fields.

**Response `409`:** A shoe with that name already exists.

---

### `DELETE /api/shoes/:name`
Removes a shoe by name and returns the deleted object.

**Response `200`:** Returns the deleted shoe object.

**Response `404`:** Shoe not found.

---

## View Routes

| Route | Description |
|-------|-------------|
| `GET /` | Home page with hero section |
| `GET /shoes` | Full catalog grid |
| `GET /shoes/:name` | Detail page for a single shoe |

---

## Future Improvements

- Improve search and filtering
- Implement user authentication
- Add database integration
- Add shopping cart function