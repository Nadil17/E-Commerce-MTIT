# 🛒 NexusShop — Microservices E-Commerce Platform
### IT4020 Assignment 2 | Modern Topics in IT | SLIIT 2026

---

## 📐 Architecture Overview

```
                         ┌─────────────────────────────────┐
                         │         React Frontend           │
                         │      (http://localhost:3000)     │
                         └──────────────┬──────────────────┘
                                        │ All requests via /api/*
                                        ▼
                         ┌─────────────────────────────────┐
                         │         API GATEWAY              │
                         │      (http://localhost:8080)     │
                         │  • http-proxy-middleware         │
                         │  • Rate limiting                 │
                         │  • Request logging               │
                         │  • Swagger proxy /docs/*         │
                         └──────────────┬──────────────────┘
              ┌─────────────┬────────┬──┴──┬──────────┬──────────────┐
              ▼             ▼        ▼     ▼          ▼              ▼
        ┌──────────┐ ┌────────┐ ┌──────┐ ┌──────────┐ ┌─────────┐ ┌────────┐
        │ Product  │ │  User  │ │ Cart │ │Inventory │ │ Payment │ │ Order  │
        │ :3001    │ │ :3002  │ │:3003 │ │  :3004   │ │  :3005  │ │ :3006  │
        └────┬─────┘ └────────┘ └──┬───┘ └────┬─────┘ └────┬────┘ └───┬────┘
             │                     │           │             │          │
        product_db             cart_db   inventory_db   payment_db  order_db
             │                                            ▲    ▲        │
             │                                            │    │   ┌────┘
             └── Order Service calls ────────────────────┘    └───┘
                 Cart → Inventory → Payment (REST via axios)
```

---

## 🗂 Folder Structure

```
ecommerce/
├── api-gateway/
│   ├── server.js          ← Express proxy gateway (port 8080)
│   ├── .env
│   └── package.json
├── product-service/
│   ├── controllers/product.controller.js
│   ├── routes/product.routes.js
│   ├── models/product.model.js
│   ├── config/db.js
│   ├── config/schema.sql
│   ├── server.js          ← Port 3001
│   ├── .env
│   └── package.json
├── user-service/          ← Port 3002 (JWT auth)
├── cart-service/          ← Port 3003 (talks to product-service)
├── inventory-service/     ← Port 3004
├── payment-service/       ← Port 3005 (simulated)
├── order-service/         ← Port 3006 (orchestrator)
├── frontend/              ← React app (port 3000, proxied to 8080)
├── start-all.sh           ← Start everything at once
└── README.md
```

---

## ⚙️ Prerequisites

- **Node.js** v16+
- **MySQL** 8.0+ running locally
- **npm** v8+

---

## 🗄️ Database Setup

Run these SQL files in MySQL Workbench or the CLI:

```bash
mysql -u root -p < product-service/config/schema.sql
mysql -u root -p < user-service/config/schema.sql
mysql -u root -p < cart-service/config/schema.sql
mysql -u root -p < inventory-service/config/schema.sql
mysql -u root -p < payment-service/config/schema.sql
mysql -u root -p < order-service/config/schema.sql
```

This creates **6 separate databases**: `product_db`, `user_db`, `cart_db`, `inventory_db`, `payment_db`, `order_db`.

---

## 🔑 Environment Variables

Update the `DB_PASSWORD` in every `.env` file:

```
product-service/.env     → DB_PASSWORD=your_mysql_password
user-service/.env        → DB_PASSWORD=your_mysql_password
cart-service/.env        → DB_PASSWORD=your_mysql_password
inventory-service/.env   → DB_PASSWORD=your_mysql_password
payment-service/.env     → DB_PASSWORD=your_mysql_password
order-service/.env       → DB_PASSWORD=your_mysql_password
```

---

## 🚀 Installation & Running

### Option A — Run all at once (Linux/Mac)

```bash
cd ecommerce
mkdir -p logs
chmod +x start-all.sh
./start-all.sh
```

### Option B — Run each service individually

Open **7 terminals**:

```bash
# Terminal 1 — Product Service
cd product-service && npm install && npm start

# Terminal 2 — User Service
cd user-service && npm install && npm start

# Terminal 3 — Cart Service
cd cart-service && npm install && npm start

# Terminal 4 — Inventory Service
cd inventory-service && npm install && npm start

# Terminal 5 — Payment Service
cd payment-service && npm install && npm start

# Terminal 6 — Order Service
cd order-service && npm install && npm start

# Terminal 7 — API Gateway
cd api-gateway && npm install && npm start
```

### Option C — Frontend

```bash
cd frontend && npm install && npm start
# Opens at http://localhost:3000
# All API calls proxy through http://localhost:8080 (gateway)
```

---

## 🌐 Service URLs

| Service | Direct URL | Via Gateway |
|---------|-----------|-------------|
| Product | http://localhost:3001 | http://localhost:8080/api/products |
| User | http://localhost:3002 | http://localhost:8080/api/users |
| Cart | http://localhost:3003 | http://localhost:8080/api/cart |
| Inventory | http://localhost:3004 | http://localhost:8080/api/inventory |
| Payment | http://localhost:3005 | http://localhost:8080/api/payments |
| Order | http://localhost:3006 | http://localhost:8080/api/orders |

---

## 📚 Swagger Documentation

| Service | Native URL | Via Gateway |
|---------|-----------|-------------|
| Product | http://localhost:3001/api-docs | http://localhost:8080/docs/products/ |
| User | http://localhost:3002/api-docs | http://localhost:8080/docs/users/ |
| Cart | http://localhost:3003/api-docs | http://localhost:8080/docs/cart/ |
| Inventory | http://localhost:3004/api-docs | http://localhost:8080/docs/inventory/ |
| Payment | http://localhost:3005/api-docs | http://localhost:8080/docs/payments/ |
| Order | http://localhost:3006/api-docs | http://localhost:8080/docs/orders/ |

---

## 🧪 Sample API Requests (Postman)

### 1. Get all products (direct)
```
GET http://localhost:3001/api/products
```

### 2. Get all products (via gateway)
```
GET http://localhost:8080/api/products
```

### 3. Register user
```
POST http://localhost:8080/api/users/register
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123"
}
```

### 4. Login
```
POST http://localhost:8080/api/users/login
Content-Type: application/json

{
  "email": "admin@shop.com",
  "password": "password123"
}
```

### 5. Add item to cart
```
POST http://localhost:8080/api/cart/1/items
Content-Type: application/json

{
  "product_id": 1,
  "quantity": 2
}
```

### 6. View cart
```
GET http://localhost:8080/api/cart/1
```

### 7. Place an order (full checkout flow)
```
POST http://localhost:8080/api/orders
Content-Type: application/json

{
  "user_id": 1,
  "payment_method": "credit_card",
  "shipping_address": "123 Main St, Colombo 03, Sri Lanka"
}
```
> This single call: fetches cart → checks inventory → creates order → processes payment → deducts stock → clears cart

### 8. Check inventory
```
GET http://localhost:8080/api/inventory/1/check?quantity=2
```

### 9. Get order history
```
GET http://localhost:8080/api/orders/user/1
```

### 10. Health check (all services)
```
GET http://localhost:8080/health
```

---

## 🔄 Service Communication Flow

```
Client → API Gateway (8080)
            │
            ▼
     Order Service (3006)
            │
    ┌───────┼────────────┐
    ▼       ▼            ▼
 Cart    Inventory   Payment
 (3003)  (3004)      (3005)
    │       │
    └── axios HTTP calls (REST) ──┘
```

1. **Order Service** calls **Cart Service** (`GET /api/cart/:userId`) to get items
2. **Order Service** calls **Inventory Service** (`GET /api/inventory/:id/check`) per item
3. Creates order record in `order_db`
4. **Order Service** calls **Payment Service** (`POST /api/payments/process`)
5. On success: calls **Inventory Service** (`POST /api/inventory/deduct`)
6. On success: calls **Cart Service** (`DELETE /api/cart/:userId/clear`)

---

## 🛡️ API Gateway Role

The gateway runs on port **8080** and eliminates the need to know individual service ports:

```
/api/products  → product-service (3001)
/api/users     → user-service    (3002)
/api/cart      → cart-service    (3003)
/api/inventory → inventory-service (3004)
/api/payments  → payment-service (3005)
/api/orders    → order-service   (3006)
/docs/*        → swagger of each service
/health        → aggregated health of all services
```

---

## 👥 Team Contributions

| Member | Microservice | Responsibility |
|--------|-------------|----------------|
| Member 1 | Product Service | Product CRUD, catalog management |
| Member 2 | User Service | Authentication, JWT, user management |
| Member 3 | Cart Service | Shopping cart, session management |
| Member 4 | Inventory Service | Stock management, deduction logic |
| Member 5 | Payment Service | Simulated payment gateway |
| Member 6 | Order Service + API Gateway | Checkout orchestration, gateway routing |

---

## 📝 Assignment Checklist

- ✅ Microservice per team member (6 services)
- ✅ Each service on separate port
- ✅ Each service has own MySQL database
- ✅ API Gateway with http-proxy-middleware (port 8080)
- ✅ No multiple ports needed — all via gateway
- ✅ Swagger `/api-docs` on each service
- ✅ Swagger accessible via gateway `/docs/*`
- ✅ Service-to-service REST communication (axios)
- ✅ Proper MVC folder structure
- ✅ Environment variables (.env)
- ✅ Error handling on all endpoints
- ✅ React frontend (connects only to gateway)
- ✅ No build breaks / runtime errors

---

*Built for IT4020 Modern Topics in IT — SLIIT 2026*
