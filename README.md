# E-Kigega Arena Inventory API

A full backend-only inventory API built with Node.js, Express 5 and MongoDB.
There is no HTML and no CSS. Every feature is used through JSON endpoints.

The system has a default **super admin**, sub admins, managers and day/night
staff. Products remember who added them and who last edited them.

## Quick start

```bash
npm install
copy .env.example .env
npm start
```

The API starts at **http://localhost:3000/api**.

The default super admin is created automatically when the database has no
super admin:

```text
Email:    superadmin@example.com
Password: superadmin123
```

Change these values in `.env` before deploying anywhere real:

```text
SUPER_ADMIN_NAME=Super Admin
SUPER_ADMIN_EMAIL=superadmin@example.com
SUPER_ADMIN_PASSWORD=superadmin123
```

## How accounts work

1. The **super admin** logs in with the default credentials.
2. The super admin creates a **sub admin** and can assign any role.
3. The sub admin creates **staff** and chooses the **day** or **night** shift.
4. Roles can be changed later with the role and shift endpoints.
5. Products store `addedByName`, `addedByRole` and `addedBy`, plus
   `updatedByName` and `updatedBy` for the last edit.

```text
super_admin  -> creates admins (sub admins), managers and staff
admin        -> creates managers and staff (day or night)
manager      -> adds/edits products and moves stock
staff        -> adds products and moves stock, sees own shift statistics
```

### Roles and permissions

| Action | super_admin | admin | manager | staff |
|---|---|---|---|---|
| Manage users | Yes | Managers and staff only | No | No |
| Create sub admins | Yes | No | No | No |
| Create day/night staff | Yes | Yes | No | No |
| Assign roles | Any lower role | Manager/staff | No | No |
| Add products | Yes | Yes | Yes | Yes |
| Edit products | Yes | Yes | Yes | No |
| Delete products | Yes | Yes | No | No |
| Stock in / out | Yes | Yes | Yes | Yes |
| View dashboard | Full | Full | Full | Own shift |

Only one super admin account exists. It is created from `.env`, cannot be
created through the API, and cannot be deleted or demoted through the API.

## Endpoint links

Click any link to jump to its request details.

| Method | Endpoint | Who can use it |
|---|---|---|
| GET | [GET /api](#get-api) | Everyone |
| POST | [POST /api/login](#post-apilogin) | Everyone |
| POST | [POST /api/logout](#post-apilogout) | Logged-in user |
| GET | [GET /api/me](#get-apime) | Logged-in user |
| GET | [GET /api/dashboard](#get-apidashboard) | Logged-in user |
| GET | [GET /api/products](#get-apiproducts) | Logged-in user |
| GET | [GET /api/products/:id](#get-apiproductsid) | Logged-in user |
| POST | [POST /api/products](#post-apiproducts) | Logged-in user |
| PUT | [PUT /api/products/:id](#put-apiproductsid) | super_admin, admin, manager |
| DELETE | [DELETE /api/products/:id](#delete-apiproductsid) | super_admin, admin |
| GET | [GET /api/stock](#get-apistock) | Logged-in user |
| POST | [POST /api/stock/in](#post-apistockin) | Logged-in user |
| POST | [POST /api/stock/out](#post-apistockout) | Logged-in user |
| GET | [GET /api/users](#get-apiusers) | super_admin, admin |
| GET | [GET /api/users/roles](#get-apiusersroles) | super_admin, admin |
| GET | [GET /api/users/:id](#get-apiusersid) | super_admin, admin |
| POST | [POST /api/users](#post-apiusers) | super_admin, admin |
| POST | [POST /api/users/admins](#post-apiusersadmins) | super_admin |
| POST | [POST /api/users/staff](#post-apiusersstaff) | super_admin, admin |
| PUT | [PUT /api/users/:id](#put-apiusersid) | super_admin, admin |
| PUT | [PUT /api/users/:id/role](#put-apiusersidrole) | super_admin, admin |
| PUT | [PUT /api/users/:id/shift](#put-apiusersidshift) | super_admin, admin |
| DELETE | [DELETE /api/users/:id](#delete-apiusersid) | super_admin, admin |

## Auth endpoints

### GET /api

Returns the API name, status, roles, shifts and the endpoint list.

### POST /api/login

Logs in and stores the `ims.sid` session cookie. Use this body:

```json
{
  "email": "superadmin@example.com",
  "password": "superadmin123"
}
```

### POST /api/logout

Destroys the session and clears the `ims.sid` cookie.

### GET /api/me

Returns the logged-in user, including `role` and `shift`.

```json
{
  "user": {
    "_id": "...",
    "name": "Super Admin",
    "email": "superadmin@example.com",
    "role": "super_admin",
    "shift": null
  }
}
```

## Dashboard

### GET /api/dashboard

Super admins and admins get product totals, low stock, user totals and day/night
staff counts. Staff get their own shift, stock added/removed totals and recent
activity.

## Product endpoints

### GET /api/products

Returns all products with the creator information. Optional filter:
`GET /api/products?addedBy=USER_ID`.

Each product includes:

```json
{
  "name": "Wireless Mouse",
  "addedByName": "Super Admin",
  "addedByRole": "super_admin",
  "addedBy": { "_id": "...", "name": "Super Admin", "role": "super_admin" },
  "updatedByName": "",
  "updatedBy": null
}
```

### GET /api/products/:id

Returns one product with the same creator and editor details.

### POST /api/products

Any logged-in user can add a product. The API saves the current user as
`addedBy`, `addedByName` and `addedByRole`.

```json
{
  "name": "Wireless Mouse",
  "price": 24.99,
  "quantity": 10,
  "minStock": 5
}
```

### PUT /api/products/:id

Updates a product and saves `updatedBy` and `updatedByName`. Send any of:

```json
{
  "name": "Wireless Mouse Pro",
  "price": 29.99,
  "quantity": 12,
  "minStock": 5
}
```

### DELETE /api/products/:id

Deletes a product. Only the super admin and sub admins can do this.

## Stock endpoints

### GET /api/stock

Returns products plus the 12 most recent stock movements.

### POST /api/stock/in

Adds stock. Body:

```json
{
  "productId": "PASTE_PRODUCT_ID_HERE",
  "amount": 3
}
```

### POST /api/stock/out

Removes stock. It is rejected if the quantity would go below zero.

```json
{
  "productId": "PASTE_PRODUCT_ID_HERE",
  "amount": 2
}
```

## User endpoints

### GET /api/users

Returns users without passwords. Optional filters:

```text
GET /api/users?role=staff&shift=night
GET /api/users?search=sam
GET /api/users?role=admin
```

The response also contains `count`, `byRole` and `byShift` totals.

### GET /api/users/roles

Shows the roles and shifts the logged-in account is allowed to assign.

### GET /api/users/:id

Returns one user without the password.

### POST /api/users

Creates a user inside your permission level.

Super admin can create `admin`, `manager` or `staff`. A sub admin can create
`manager` or `staff`. Staff must include a `shift` of `day` or `night`.

```json
{
  "name": "Sam Staff",
  "email": "sam@example.com",
  "password": "secret123",
  "role": "staff",
  "shift": "day"
}
```

### POST /api/users/admins

Super admin only. Creates a sub admin. No role field is needed:

```json
{
  "name": "Sub Admin",
  "email": "subadmin@example.com",
  "password": "admin123"
}
```

### POST /api/users/staff

Creates day or night staff. The role is forced to `staff`, so `shift` is
required:

```json
{
  "name": "Night Staff",
  "email": "night@example.com",
  "password": "staff123",
  "shift": "night"
}
```

### PUT /api/users/:id

Updates a user. Every field is optional:

```json
{
  "name": "Sam Manager",
  "email": "sam.manager@example.com",
  "password": "newsecret123"
}
```

You can also send `role` and `shift` here, but the same role rules apply.

### PUT /api/users/:id/role

Assigns a role. A super admin can assign `admin`, `manager` or `staff`. A sub
admin can assign `manager` or `staff`.

```json
{
  "role": "manager"
}
```

When assigning `staff`, include the shift:

```json
{
  "role": "staff",
  "shift": "night"
}
```

### PUT /api/users/:id/shift

Moves a staff member between the day and night shift:

```json
{
  "shift": "day"
}
```

### DELETE /api/users/:id

Deletes a user. You cannot delete yourself, the super admin, an account above
your level, or the last remaining sub admin.

## Rules

- Product quantity and minimum stock cannot be negative.
- Stock out is rejected if it would make the quantity negative.
- Product names and user emails must be unique.
- Staff always need a day or night shift.
- Only staff can have a shift.
- Only super admins can create sub admins.
- Sub admins can only create and manage managers and staff.
- The super admin cannot be created, deleted or demoted through the API.
- Passwords are never included in API responses.
- Errors always return JSON like `{ "error": "..." }`.

## Test in Postman

1. Start the server with `npm start`.
2. In Postman choose **Import** and select
   `postman/Simple-Inventory.postman_collection.json`.
3. Run **02. Login as super admin** using the default credentials.
4. Run the rest in number order, or use **Run collection**.

The collection creates a sub admin, a day shift staff member and a night shift
staff member, assigns roles and shifts, creates a product and checks
`addedByName`, then deletes everything it created.

## Main files

- `server.js` — starts Express, registers routes and creates the default super admin
- `config/db.js` — MongoDB connection
- `models/` — User, Product and Activity schemas
- `middleware/` — login checks, role checks and JSON error handling
- `routes/` — auth, dashboard, products, stock and users
- `utils/publicUser.js` — hides passwords from responses
- `postman/` — ready-to-run Postman collection
