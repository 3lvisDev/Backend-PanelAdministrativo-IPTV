import pool from './db.js';

async function createTables() {
  try {
    console.log("Creando tabla 'usuarios'...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        fecha_nacimiento DATE,
        pais VARCHAR(100),
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        rol ENUM('admin','cliente') NOT NULL DEFAULT 'cliente'
      )
    `);

    console.log("Creando tabla 'categorias'...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL
      )
    `);

    console.log("Creando tabla 'canales'...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS canales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        url VARCHAR(255) NOT NULL,
        logo VARCHAR(255),
        formato ENUM('m3u','m3u8','mkv','mp4') NOT NULL,
        estado BOOLEAN DEFAULT TRUE,
        categoria_id INT,
        FOREIGN KEY (categoria_id) REFERENCES categorias(id)
      )
    `);

    console.log("Creando tabla 'suscripciones'...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS suscripciones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_fin TIMESTAMP,
        estado ENUM('activa','vencida') NOT NULL,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);

    console.log("Creando tabla 'pagos'...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pagos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        monto DECIMAL(10,2) NOT NULL,
        metodo_pago ENUM('Stripe','PayPal') NOT NULL,
        fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        estado ENUM('completado','pendiente','fallido') NOT NULL,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);

    console.log("Creando tabla 'estadisticas'...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS estadisticas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        total_usuarios INT DEFAULT 0,
        total_clientes INT DEFAULT 0,
        total_admins INT DEFAULT 0,
        canales_activos INT DEFAULT 0,
        suscripciones INT DEFAULT 0,
        pagos_hoy DECIMAL(10,2) DEFAULT 0.00,
        total_pagos_mes DECIMAL(10,2) DEFAULT 0.00,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log("Todas las tablas han sido creadas exitosamente.");
    process.exit(0);
  } catch (error) {
    console.error("Error al crear las tablas:", error);
    process.exit(1);
  }
}

createTables();
