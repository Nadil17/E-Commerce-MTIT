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
                         │      (http://localhost:9090)     │
                         │  • http-proxy-middleware         │
                         │  • Rate limiting                 │
                         │  • Request logging               │
                         │  • Unified Swagger /api-docs     │
                         └──────────────┬──────────────────┘
              ┌──────────┬──────────┬───┴───┬──────────┬──────────┬──────────┐
              ▼          ▼          ▼        ▼          ▼          ▼          ▼
        ┌──────────┐ ┌────────┐ ┌──────┐ ┌──────────┐ ┌─────────┐ ┌──────┐ ┌────────┐
        │ Product  │ │  User  │ │ Cart │ │Inventory │ │ Payment │ │Order │ │Comment │
        │ :3001    │ │ :3002  │ │:3003 │ │  :3004   │ │  :3005  │ │:3006 │ │ :3007  │
        └──────────┘ └────────┘ └──────┘ └──────────┘ └─────────┘ └──┬───┘ └────────┘
                                                                       │
                              Order Service orchestrates: ─────────────┘
                              Cart → Inventory check → Payment → Deduct stock → Clear cart
```

---

## 🗂 Folder Structure

```
E-Commerce-MTIT/
├── api-gateway/           ← Express proxy gateway (port 9090)
│   ├── server.js
│   ├── .env
│   └── package.json
├── product-service/       ← Port 3001
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── config/db.js
│   └── server.js
├── user-service/          ← Port 3002 (JWT auth)
├── cart-service/          ← Port 3003
├── inventory-service/     ← Port 3004
├── payment-service/       ← Port 3005 (simulated)
├── order-service/         ← Port 3006 (orchestrator)
├── comment-rating-service/ ← Port 3007
├── frontend/              ← React app (port 3000)
├── start-all.sh           ← Start everything at once
└── README.md
```

---

## ⚙️ Prerequisites

- **Node.js** v16+
- **MongoDB** running locally (default: `mongodb://localhost:27017`)
- **npm** v8+

---

## 🗄️ Database Setup

All services use **MongoDB**. No manual schema creation is required — Mongoose creates collections automatically on first run.

Make sure MongoDB is running:
```bash
# Windows
net start MongoDB

# Mac/Linux
sudo systemctl start mongod
```

Each service connects to its own database (auto-created):

| Service | Database |
|---------|----------|
| product-service | `product_db` |
| user-service | `user_db` |
| cart-service | `cart_db` |
| inventory-service | `inventory_db` |
| payment-service | `payment_db` |
| order-service | `order_db` |
| comment-rating-service | `comment_db` |

---

## 🔑 Environment Variables

Each service `.env` contains a `MONGO_URI`. The default works with a local MongoDB install:

```
MONGO_URI=mongodb://localhost:27017/<service_db_name>
PORT=<service_port>
```

The API gateway `.env` maps service URLs:
```
PORT=9090
PRODUCT_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
CART_SERVICE_URL=http://localhost:3003
INVENTORY_SERVICE_URL=http://localhost:3004
PAYMENT_SERVICE_URL=http://localhost:3005
ORDER_SERVICE_URL=http://localhost:3006
COMMENT_RATING_SERVICE_URL=http://localhost:3007
```

---

## 🚀 Installation & Running

### Option A — Run all at once (Linux/Mac/Git Bash)

```bash
chmod +x start-all.sh
./start-all.sh
```

### Option B — Run each service individually

Open **8 terminals**:

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

# Terminal 7 — Comment & Rating Service
cd comment-rating-service && npm install && npm start

# Terminal 8 — API Gateway
cd api-gateway && npm install && npm start
```

### Option C — Frontend

```bash
cd frontend && npm install && npm start
# Opens at http://localhost:3000
```

---

## 🌐 Service URLs

| Service | Direct URL | Via Gateway (port 9090) |
|---------|-----------|-------------|
| Product | http://localhost:3001 | http://localhost:9090/api/products |
| User | http://localhost:3002 | http://localhost:9090/api/users |
| Cart | http://localhost:3003 | http://localhost:9090/api/cart |
| Inventory | http://localhost:3004 | http://localhost:9090/api/inventory |
| Payment | http://localhost:3005 | http://localhost:9090/api/payments |
| Order | http://localhost:3006 | http://localhost:9090/api/orders |
| Comment & Rating | http://localhost:3007 | http://localhost:9090/api/comments |

---

## 📚 Swagger Documentation

| Service | Native URL | Via Gateway |
|---------|-----------|-------------|
| Product | http://localhost:3001/api-docs | — |
| User | http://localhost:3002/api-docs | — |
| Cart | http://localhost:3003/api-docs | — |
| Inventory | http://localhost:3004/api-docs | — |
| Payment | http://localhost:3005/api-docs | — |
| Order | http://localhost:3006/api-docs | — |
| Comment & Rating | http://localhost:3007/api-docs | — |
| **All services (unified)** | — | **http://localhost:9090/api-docs** |

---

## 🧪 Sample API Requests (Postman)

### 1. Get all products (direct)
```
GET http://localhost:3001/api/products
```

### 2. Get all products (via gateway)
```
GET http://localhost:9090/api/products
```

### 3. Register user
```
POST http://localhost:9090/api/users/register
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123"
}
```

### 4. Login
```
POST http://localhost:9090/api/users/login
Content-Type: application/json

{
  "email": "jane@example.com",
  "password": "password123"
}
```

### 5. Add item to cart
```
POST http://localhost:9090/api/cart/<userId>/items
Content-Type: application/json

{
  "product_id": "<productId>",
  "quantity": 2
}
```

### 6. View cart
```
GET http://localhost:9090/api/cart/<userId>
```

### 7. Place an order (full checkout flow)
```
POST http://localhost:9090/api/orders
Content-Type: application/json

{
  "user_id": "<userId>",
  "payment_method": "credit_card",
  "shipping_address": "123 Main St, Colombo 03, Sri Lanka"
}
```
> This single call: fetches cart → checks inventory → creates order → processes payment → deducts stock → clears cart

### 8. Check inventory
```
GET http://localhost:9090/api/inventory/<productId>/check?quantity=2
```

### 9. Get order history
```
GET http://localhost:9090/api/orders/user/<userId>
```

### 10. Health check (all services)
```
GET http://localhost:9090/health
```

### 11. Post a product comment/rating
```
POST http://localhost:9090/api/comments
Content-Type: application/json

{
  "product_id": "<productId>",
  "user_id": "<userId>",
  "user_name": "Jane Doe",
  "rating": 5,
  "comment": "Excellent product!"
}
```

---

## 🔄 Service Communication Flow

```
Client → API Gateway (9090)
            │
            ▼
     Order Service (3006)
            │
    ┌───────┼────────────┐
    ▼       ▼            ▼
 Cart    Inventory   Payment
 (3003)  (3004)      (3005)
```

1. **Order Service** calls **Cart Service** (`GET /api/cart/:userId`) to get items
2. **Order Service** calls **Inventory Service** (`GET /api/inventory/:productId/check`) per item
3. Creates order record in MongoDB
4. **Order Service** calls **Payment Service** (`POST /api/payments/process`)
5. On success: calls **Inventory Service** (`POST /api/inventory/deduct`)
6. On success: calls **Cart Service** (`DELETE /api/cart/:userId/clear`)

---

## 🛡️ API Gateway Role

The gateway runs on port **9090** and eliminates the need to know individual service ports:

```
/api/products   → product-service       (3001)
/api/users      → user-service          (3002)
/api/cart       → cart-service          (3003)
/api/inventory  → inventory-service     (3004)
/api/payments   → payment-service       (3005)
/api/orders     → order-service         (3006)
/api/comments   → comment-rating-service (3007)
/api-docs       → unified Swagger UI (all services)
/health         → aggregated health of all services
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
| Member 6 | Order Service | Checkout orchestration |
| Member 7 | Comment & Rating Service + API Gateway | Reviews, ratings, gateway routing |

---

## 📝 Assignment Checklist

- ✅ Microservice per team member (7 services)
- ✅ Each service on a separate port (3001–3007)
- ✅ Each service has its own MongoDB database
- ✅ API Gateway with http-proxy-middleware (port 9090)
- ✅ No multiple ports needed — all accessed via gateway
- ✅ Swagger `/api-docs` on each service (native URL)
- ✅ Unified Swagger at gateway `/api-docs`
- ✅ Service-to-service REST communication (axios)
- ✅ Proper MVC folder structure per service
- ✅ Environment variables (.env)
- ✅ Error handling on all endpoints
- ✅ React frontend (connects only to gateway)
- ✅ No build breaks / runtime errors

---

*Built for IT4020 Modern Topics in IT — SLIIT 2026*
