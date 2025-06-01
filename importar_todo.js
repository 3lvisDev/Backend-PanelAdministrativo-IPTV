import fs from 'fs';
import csv from 'csv-parser';
import bcrypt from 'bcryptjs';
import pool from './db.js';  // Esto es correcto si ya estás usando db.js

async function importarCategorias() {
  const categorias = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream('/home/categorias.csv')
      .pipe(csv())
      .on('data', (row) => {
        if (row.nombre) { // Asegurarnos que no esté vacío
          categorias.push(row);
        }
      })
      .on('end', async () => {
        for (const cat of categorias) {
          const [rows] = await pool.query('SELECT id FROM categorias WHERE nombre = ?', [cat.nombre]);
          if (rows.length === 0) {
            await pool.query('INSERT INTO categorias (nombre) VALUES (?)', [cat.nombre]);
          }
        }
        console.log('✅ Categorías importadas.');
        resolve();
      })
      .on('error', reject);
  });
}

async function importarCanales() {
  const canales = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream('/home/canales.csv')
      .pipe(csv())
      .on('data', (row) => {
        if (row.nombre && row.url) {  // Verifica que `nombre` y `url` no estén vacíos
          canales.push(row);
        }
      })
      .on('end', async () => {
        for (const canal of canales) {
          const [cat] = await pool.query('SELECT id FROM categorias WHERE nombre = ?', [canal.categoria]);
          const categoria_id = cat[0] ? cat[0].id : null;
          await pool.query(
            'INSERT INTO canales (nombre, url, logo, formato, estado, categoria_id) VALUES (?, ?, ?, ?, ?, ?)',
            [canal.nombre, canal.url, canal.logo, canal.formato, canal.estado || true, categoria_id]
          );
        }
        console.log('✅ Canales importados.');
        resolve();
      })
      .on('error', reject);
  });
}

async function importarUsuarios() {
  const usuarios = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream('/home/usuarios.csv')
      .pipe(csv())
      .on('data', (row) => {
        if (row.nombre && row.email) {  // Verifica que `nombre` y `email` no estén vacíos
          usuarios.push(row);
        }
      })
      .on('end', async () => {
        for (const user of usuarios) {
          const hash = await bcrypt.hash(user.password, 10);
          await pool.query(
            'INSERT INTO usuarios (nombre, email, password_hash, fecha_nacimiento, pais, rol) VALUES (?, ?, ?, ?, ?, ?)',
            [user.nombre, user.email, hash, user.fecha_nacimiento || null, user.pais || null, user.rol || 'cliente']
          );
        }
        console.log('✅ Usuarios importados.');
        resolve();
      })
      .on('error', reject);
  });
}

async function main() {
  try {
    await importarCategorias();
    await importarCanales();
    await importarUsuarios();
    console.log('🎉 Importación completa.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error importando datos:', err);
    process.exit(1);
  }
}

main();
