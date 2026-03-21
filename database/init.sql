CREATE DATABASE IF NOT EXISTS fooddb;
USE fooddb;

CREATE TABLE foods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  price DECIMAL(10,2)
);

INSERT INTO foods (name, price) VALUES
('Pizza', 10.99),
('Burger', 5.99),
('Pasta', 7.49);
