#!/bin/bash
# ============================================================
#  NexusShop — Start all microservices + API Gateway
#  Usage:  chmod +x start-all.sh && ./start-all.sh
# ============================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗"
echo "  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝"
echo "  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗"
echo "  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║"
echo "  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║"
echo "  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝"
echo -e "${NC}"
echo -e "${YELLOW}  E-Commerce Microservices Platform${NC}"
echo ""

SERVICES=(
  "product-service:3001"
  "user-service:3002"
  "cart-service:3003"
  "inventory-service:3004"
  "payment-service:3005"
  "order-service:3006"
  "comment-rating-service:3007"
)

# Install dependencies for each service
echo -e "${CYAN}📦 Installing dependencies...${NC}"
for entry in "${SERVICES[@]}"; do
  dir="${entry%%:*}"
  echo -e "  → ${dir}"
  (cd "$dir" && npm install --silent) &
done
(cd api-gateway && npm install --silent) &
wait
echo -e "${GREEN}✓ Dependencies installed${NC}\n"

# Start all microservices
echo -e "${CYAN}🚀 Starting microservices...${NC}"
for entry in "${SERVICES[@]}"; do
  dir="${entry%%:*}"
  port="${entry##*:}"
  echo -e "  → ${dir} on :${port}"
  (cd "$dir" && npm start > "../logs/${dir}.log" 2>&1) &
done

# Start API Gateway
echo -e "  → api-gateway on :8080"
mkdir -p logs
(cd api-gateway && npm start > "../logs/api-gateway.log" 2>&1) &

sleep 3

echo ""
echo -e "${GREEN}✅ All services started!${NC}"
echo ""
echo -e "${CYAN}📡 Service URLs:${NC}"
echo "  Product Service       →  http://localhost:3001"
echo "  User Service          →  http://localhost:3002"
echo "  Cart Service          →  http://localhost:3003"
echo "  Inventory Service     →  http://localhost:3004"
echo "  Payment Service       →  http://localhost:3005"
echo "  Order Service         →  http://localhost:3006"
echo "  Comment-Rating Service →  http://localhost:3007"
echo "  API Gateway           →  http://localhost:8080"
echo ""
echo -e "${CYAN}📚 Swagger Docs via Gateway:${NC}"
echo "  Products   →  http://localhost:8080/docs/products"
echo "  Users      →  http://localhost:8080/docs/users"
echo "  Cart       →  http://localhost:8080/docs/cart"
echo "  Inventory  →  http://localhost:8080/docs/inventory"
echo "  Payments   →  http://localhost:8080/docs/payments"
echo "  Orders     →  http://localhost:8080/docs/orders"
echo "  Comments   →  http://localhost:8080/docs/comments"
echo ""
echo -e "${CYAN}🩺 Health:${NC}  http://localhost:8080/health"
echo ""
echo -e "Logs in: ./logs/"
