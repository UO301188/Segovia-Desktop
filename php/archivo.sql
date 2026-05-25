-- Creación de la base de datos
CREATE DATABASE IF NOT EXISTS turismo_segovia DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE turismo_segovia;

-- 1. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS Usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- 2. Tabla de Categorías de Recursos
CREATE TABLE IF NOT EXISTS Categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_categoria VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255)
);

-- 3. Tabla de Recursos Turísticos
CREATE TABLE IF NOT EXISTS Recursos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_categoria INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    plazas INT NOT NULL,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_categoria) REFERENCES Categorias(id) ON DELETE CASCADE
);

-- 4. Tabla de Reservas (Cabecera)
CREATE TABLE IF NOT EXISTS Reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    fecha_reserva DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('Confirmada', 'Anulada') DEFAULT 'Confirmada',
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id) ON DELETE CASCADE
);

-- 5. Tabla de Líneas de Reserva (Detalle)
CREATE TABLE IF NOT EXISTS LineasReserva (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_reserva INT NOT NULL,
    id_recurso INT NOT NULL,
    personas INT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_reserva) REFERENCES Reservas(id) ON DELETE CASCADE,
    FOREIGN KEY (id_recurso) REFERENCES Recursos(id) ON DELETE CASCADE
);