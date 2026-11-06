-- TechShelf database schema (MySQL)
CREATE DATABASE IF NOT EXISTS techshelf;

-- App account: only allowed to connect from the BE VM, limited privileges
CREATE USER IF NOT EXISTS 'techshelf_app'@'10.0.0.20' IDENTIFIED BY 'CHANGE_ME';
GRANT SELECT, INSERT, UPDATE, DELETE ON techshelf.* TO 'techshelf_app'@'10.0.0.20';

USE techshelf;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);