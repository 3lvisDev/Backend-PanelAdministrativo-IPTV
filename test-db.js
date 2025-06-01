import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'iptv_user',
  password: 'S3cureP@ssw0rd', // reemplaza por tu clave real
  database: 'iptv_db' // asegúrate que esta base exista
});

async function testConnection() {
  try {
    const [rows] = await pool.query('SELECT NOW()');
    console.log('✅ Conexión exitosa:', rows);
  } catch (err) {
    console.error('❌ Error de conexión:', err);
  }
}

testConnection();
