USE techshelf;

CREATE TABLE IF NOT EXISTS devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('laptop','phone','tablet','monitor','accessory') NOT NULL,
  serial_number VARCHAR(50) NOT NULL UNIQUE,
  assigned_to INT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO devices (name, type, serial_number) VALUES
  ('Dell Latitude 5440',        'laptop',    'DL5440-0001'),
  ('Dell Latitude 5440',        'laptop',    'DL5440-0002'),
  ('MacBook Air M3',            'laptop',    'MBA-M3-0001'),
  ('Lenovo ThinkPad T14',       'laptop',    'TP-T14-0001'),
  ('iPhone 15',                 'phone',     'IP15-0001'),
  ('Samsung Galaxy S24',        'phone',     'SGS24-0001'),
  ('iPad 10th Gen',             'tablet',    'IPAD10-0001'),
  ('Dell 27 Monitor P2723D',    'monitor',   'P2723D-0001'),
  ('Logitech MX Keys Keyboard', 'accessory', 'MXKEYS-0001'),
  ('Jabra Evolve2 Headset',     'accessory', 'EVOLVE2-0001');

