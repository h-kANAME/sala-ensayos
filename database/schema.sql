-- Schema para Sala de Ensayos Musicales
CREATE DATABASE IF NOT EXISTS sala_ensayos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE sala_ensayos;

-- Tabla de usuarios del sistema
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    rol ENUM('admin', 'operario') DEFAULT 'operario',
    nombre_completo VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_login TIMESTAMP NULL
);

-- Tabla de clientes (bandas)
CREATE TABLE clientes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_banda VARCHAR(100) NOT NULL,
    contacto_nombre VARCHAR(100) NOT NULL,
    contacto_email VARCHAR(100),
    contacto_telefono VARCHAR(20),
    direccion TEXT,
    notas TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de salas
CREATE TABLE salas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT,
    capacidad INT,
    equipamiento TEXT,
    tarifa_hora DECIMAL(10,2) NOT NULL,
    activa BOOLEAN DEFAULT TRUE
);

-- Tabla de productos
CREATE TABLE productos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    categoria ENUM('equipo', 'consumible') NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    stock_minimo INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE
);

-- Tabla de reservas
CREATE TABLE reservas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cliente_id INT NOT NULL,
    sala_id INT NOT NULL,
    usuario_id INT NOT NULL,
    fecha_reserva DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    horas_reservadas INT NOT NULL,
    estado ENUM('pendiente', 'confirmada', 'cancelada', 'completada') DEFAULT 'pendiente',
    importe_total DECIMAL(12,2) NOT NULL,
    notas TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (sala_id) REFERENCES salas(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de productos en reservas
CREATE TABLE reserva_productos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reserva_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Tabla de asistencias
CREATE TABLE asistencias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reserva_id INT NOT NULL,
    hora_ingreso TIMESTAMP NULL,
    hora_salida TIMESTAMP NULL,
    estado ENUM('pendiente', 'presente', 'ausente', 'cancelada') DEFAULT 'pendiente',
    observaciones TEXT,
    FOREIGN KEY (reserva_id) REFERENCES reservas(id)
);

-- Tabla de ventas
CREATE TABLE ventas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cliente_id INT NULL,
    usuario_id INT NOT NULL,
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(12,2) NOT NULL,
    tipo_pago ENUM('efectivo', 'tarjeta', 'transferencia') NOT NULL,
    notas TEXT,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de items de venta
CREATE TABLE venta_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    venta_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Insertar datos iniciales
INSERT INTO usuarios (username, password_hash, email, rol, nombre_completo) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@salaensayos.com', 'admin', 'Administrador Principal'),
('operario1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'operario1@salaensayos.com', 'operario', 'Operario Uno');

INSERT INTO salas (nombre, descripcion, capacidad, equipamiento, tarifa_hora) VALUES
('Sala A', 'Sala principal con amplificación completa', 6, 'Amplificador Marshall, Batería Pearl, Micrófonos Shure', 2500.00),
('Sala B', 'Sala acústica para ensayos suaves', 4, 'Amplificador Fender, Batería Mapex, Piano digital', 2000.00);

INSERT INTO productos (nombre, descripcion, categoria, precio, stock) VALUES
('Cuerdas guitarra', 'Cuerdas de guitarra Elixir .010', 'consumible', 1500.00, 50),
('Baquetas', 'Baquetas Vic Firth 5A', 'consumible', 800.00, 100),
('Amplificador', 'Amplificador de guitarra Line6', 'equipo', 500.00, 5),
('Micrófono', 'Micrófono Shure SM58', 'equipo', 300.00, 8);