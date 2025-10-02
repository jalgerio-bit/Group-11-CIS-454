
-- restaurant.sql
-- Schema + realistic dummy data for a small restaurant
-- Compatible with MySQL 8 / MariaDB / Cloud SQL / AWS RDS

DROP DATABASE IF EXISTS restaurant;
CREATE DATABASE restaurant;
USE restaurant;

-- Customers
CREATE TABLE customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE,
    phone VARCHAR(20)
);

-- Menu
CREATE TABLE menu_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(7,2) NOT NULL
);

-- Orders
CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PLACED','PREPARING','READY','SERVED','CANCELLED') DEFAULT 'PLACED',
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- Order line items
CREATE TABLE order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    line_total DECIMAL(9,2) GENERATED ALWAYS AS (quantity * (SELECT price FROM menu_items WHERE menu_items.item_id = item_id)) STORED,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (item_id) REFERENCES menu_items(item_id)
);

-- Payments
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    amount DECIMAL(9,2) NOT NULL,
    method ENUM('CASH','CARD','ONLINE') NOT NULL,
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

INSERT INTO customers (name, email, phone) VALUES
('Alice Johnson','alice@example.com','555-1001'),
('Bob Smith','bob@example.com','555-1002'),
('Charlie Brown','charlie@example.com','555-1003'),
('Dana Lee','dana@example.com','555-1004'),
('Evan Wright','evan@example.com','555-1005'),
('Fiona Patel','fiona@example.com','555-1006'),
('Gabe Torres','gabe@example.com','555-1007'),
('Hannah Kim','hannah@example.com','555-1008'),
('Ivan Petrov','ivan@example.com','555-1009'),
('Jenna Alvarez','jenna@example.com','555-1010');

INSERT INTO menu_items (name, category, price) VALUES
('Cheeseburger','Entree',9.99),
('Veggie Burger','Entree',9.49),
('Grilled Chicken Sandwich','Entree',10.49),
('Margherita Pizza','Entree',12.99),
('Pepperoni Pizza','Entree',13.99),
('Caesar Salad','Appetizer',6.99),
('Garden Salad','Appetizer',6.49),
('French Fries','Side',3.99),
('Sweet Potato Fries','Side',4.49),
('Tomato Soup','Appetizer',5.99),
('Chocolate Cake','Dessert',5.50),
('Apple Pie','Dessert',5.25),
('Ice Cream Scoop','Dessert',3.50),
('Soda','Drink',1.99),
('Iced Tea','Drink',2.49),
('Coffee','Drink',2.25);

INSERT INTO orders (customer_id, order_date) VALUES
(2, '2025-09-30 13:12:30'),
(9, '2025-09-30 13:12:30'),
(9, '2025-09-30 13:12:30'),
(6, '2025-09-30 13:12:30'),
(2, '2025-09-30 13:12:30'),
(10, '2025-09-30 13:12:30'),
(2, '2025-09-30 13:12:30'),
(10, '2025-09-30 13:12:30'),
(5, '2025-09-30 13:12:30'),
(6, '2025-09-30 13:12:30'),
(2, '2025-09-30 13:12:30'),
(9, '2025-09-30 13:12:30'),
(5, '2025-09-30 13:12:30'),
(7, '2025-09-30 13:12:30'),
(9, '2025-09-30 13:12:30'),
(2, '2025-09-30 13:12:30'),
(7, '2025-09-30 13:12:30'),
(5, '2025-09-30 13:12:30'),
(3, '2025-09-30 13:12:30'),
(3, '2025-09-30 13:12:30'),
(1, '2025-09-30 13:12:30'),
(10, '2025-09-30 13:12:30'),
(9, '2025-09-30 13:12:30'),
(9, '2025-09-30 13:12:30');

INSERT INTO order_items (order_id, item_id, quantity) VALUES
(1, 8, 3),
(1, 4, 1),
(1, 3, 3),
(2, 2, 1),
(2, 1, 3),
(2, 16, 3),
(2, 4, 1),
(3, 8, 1),
(3, 16, 1),
(3, 10, 3),
(3, 5, 2),
(4, 7, 2),
(4, 13, 1),
(5, 12, 2),
(6, 15, 3),
(7, 10, 3),
(8, 3, 3),
(8, 1, 1),
(9, 4, 2),
(9, 7, 2),
(10, 12, 2),
(10, 4, 3),
(10, 11, 3),
(11, 6, 2),
(11, 8, 2),
(12, 2, 1),
(12, 4, 2),
(12, 14, 2),
(13, 11, 3),
(13, 4, 2),
(14, 9, 1),
(14, 3, 3),
(15, 13, 3),
(15, 6, 2),
(15, 4, 1),
(15, 3, 1),
(16, 14, 1),
(16, 10, 2),
(17, 1, 1),
(17, 11, 3),
(17, 12, 3),
(18, 10, 2),
(19, 9, 3),
(20, 7, 1),
(20, 3, 3),
(20, 6, 3),
(21, 1, 2),
(21, 2, 1),
(21, 6, 1),
(21, 13, 1),
(22, 16, 1),
(23, 16, 1),
(23, 9, 2),
(24, 7, 2),
(24, 12, 2);

INSERT INTO payments (order_id, amount, method) VALUES
(1, (SELECT SUM(line_total) FROM order_items WHERE order_id=1), 'CARD'),
(2, (SELECT SUM(line_total) FROM order_items WHERE order_id=2), 'CARD'),
(3, (SELECT SUM(line_total) FROM order_items WHERE order_id=3), 'CARD'),
(4, (SELECT SUM(line_total) FROM order_items WHERE order_id=4), 'CARD'),
(5, (SELECT SUM(line_total) FROM order_items WHERE order_id=5), 'CARD'),
(6, (SELECT SUM(line_total) FROM order_items WHERE order_id=6), 'CARD'),
(7, (SELECT SUM(line_total) FROM order_items WHERE order_id=7), 'CARD'),
(8, (SELECT SUM(line_total) FROM order_items WHERE order_id=8), 'CARD'),
(9, (SELECT SUM(line_total) FROM order_items WHERE order_id=9), 'CARD'),
(10, (SELECT SUM(line_total) FROM order_items WHERE order_id=10), 'CARD'),
(11, (SELECT SUM(line_total) FROM order_items WHERE order_id=11), 'CARD'),
(12, (SELECT SUM(line_total) FROM order_items WHERE order_id=12), 'CARD'),
(13, (SELECT SUM(line_total) FROM order_items WHERE order_id=13), 'CARD'),
(14, (SELECT SUM(line_total) FROM order_items WHERE order_id=14), 'CARD'),
(15, (SELECT SUM(line_total) FROM order_items WHERE order_id=15), 'CARD'),
(16, (SELECT SUM(line_total) FROM order_items WHERE order_id=16), 'CARD'),
(17, (SELECT SUM(line_total) FROM order_items WHERE order_id=17), 'CARD'),
(18, (SELECT SUM(line_total) FROM order_items WHERE order_id=18), 'CARD'),
(19, (SELECT SUM(line_total) FROM order_items WHERE order_id=19), 'CARD'),
(20, (SELECT SUM(line_total) FROM order_items WHERE order_id=20), 'CARD'),
(21, (SELECT SUM(line_total) FROM order_items WHERE order_id=21), 'CARD'),
(22, (SELECT SUM(line_total) FROM order_items WHERE order_id=22), 'CARD'),
(23, (SELECT SUM(line_total) FROM order_items WHERE order_id=23), 'CARD'),
(24, (SELECT SUM(line_total) FROM order_items WHERE order_id=24), 'CARD');

