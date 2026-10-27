# Simple Inventory API

A small backend-only inventory API built with Node.js, Express 5 and MongoDB.
There is no HTML and no CSS. Every feature is tested through JSON endpoints.

## Run it

```bash
npm install
npm start
```

The API starts at **http://localhost:3000/api**.

The first admin account is created automatically from `.env`:

```text
admin@example.com / admin123
```

Change those values in `.env` before deploying anywhere real.

## Test in Postman

1. Start the server with `npm start`.
2. In Postman, choose **Import** and select
   `postman/Simple-Inventory.postman_collection.json`.
3. Open **02. Login as admin** and send it once.
   Postman stores the `ims.sid` session cookie automatically.
4. Send the other requests in number order, or use **Run collection**.

The collection creates a test product and user, then deletes both at the end.
`baseUrl` and the admin login details are collection variables.

## Endpoints

| Method | Endpoint | Who can use it |
|---|---|---|
| GET | `/api` | Everyone |
| POST | `/api/login` | Everyone |
| GET | `/api/me` | Logged-in user |
| POST | `/api/logout` | Logged-in user |
| GET | `/api/dashboard` | Logged-in user |
| GET | `/api/products` | Logged-in user |
| GET | `/api/products/:id` | Logged-in user |
| POST | `/api/products` | Admin, manager |
| PUT | `/api/products/:id` | Admin, manager |
| DELETE | `/api/products/:id` | Admin only |
| GET | `/api/stock` | Logged-in user |
| POST | `/api/stock/in` | Logged-in user |
| POST | `/api/stock/out` | Logged-in user |
| GET | `/api/users` | Admin only |
| GET | `/api/users/:id` | Admin only |
| POST | `/api/users` | Admin only |
| PUT | `/api/users/:id` | Admin only |
| DELETE | `/api/users/:id` | Admin only |

## Request bodies

Product create or update:

```json
{
  "name": "Wireless Mouse",
  "price": 24.99,
  "quantity": 10,
  "minStock": 5
}
```

Stock in or stock out:

```json
{
  "productId": "PASTE_PRODUCT_ID_HERE",
  "amount": 3
}
```

User create:

```json
{
  "name": "Sam Staff",
  "email": "sam@example.com",
  "password": "secret123",
  "role": "staff"
}
```

User update (every field is optional):

```json
{
  "name": "Sam Manager",
  "role": "manager",
  "password": "newsecret123"
}
```

Roles are `admin`, `manager` and `staff`.

## Rules

- Product quantity and minimum stock cannot be negative.
- Stock out is rejected if it would make the quantity negative.
- Product names and user emails must be unique.
- Only admins can manage users.
- Only admins can delete products.
- An admin cannot remove or demote the last admin.
- Errors always return JSON like `{ "error": "..." }`.

## Main files

- `server.js` — starts Express and registers all routes
- `config/db.js` — MongoDB connection
- `models/` — User, Product and Activity schemas
- `middleware/` — login checks and JSON error handling
- `routes/` — auth, dashboard, products, stock and users
- `utils/publicUser.js` — hides passwords from responses
- `postman/` — ready-to-run Postman collection
