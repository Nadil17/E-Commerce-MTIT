CREATE DATABASE IF NOT EXISTS inventory_db;
USE inventory_db;

CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNIQUE NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  reserved INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 5,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  action ENUM('restock','deduct','reserve','release') NOT NULL,
  quantity INT NOT NULL,
  reference VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO inventory (product_id, product_name, quantity, reorder_level) VALUES
(1, 'MacBook Pro 14"', 15, 3),
(2, 'iPhone 15 Pro', 30, 5),
(3, 'Sony WH-1000XM5', 25, 5),
(4, 'Samsung 4K Monitor', 10, 2),
(5, 'Mechanical Keyboard', 50, 10),
(6, 'Logitech MX Master 3', 40, 8);
