import express from 'express';
import pool from '../db.js';
import authMiddleware from '../middlewares/authMiddleware.js'; // ✅ IMPORTACIÓN CORRECTA


const router = express.Router();

// Obtener todas las suscripciones (con JOIN a usuarios)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        s.id,
        s.usuario_id,
        DATE_FORMAT(s.fecha_inicio, '%Y-%m-%d %H:%i:%s') AS fechaInicio,
        DATE_FORMAT(s.fecha_fin, '%Y-%m-%d %H:%i:%s') AS fechaFin,
        s.estado,
        u.nombre AS usuario
      FROM suscripciones s
      LEFT JOIN usuarios u ON s.usuario_id = u.id
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener las suscripciones:', error);
    res.status(500).json({ error: 'Error al obtener las suscripciones.' });
  }
});

// Verificación de suscripción
router.get('/mia', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  console.log("📦 Token userId:", userId);

  try {
    const [rows] = await pool.query(
      `SELECT * FROM suscripciones 
       WHERE usuario_id = ? AND estado = 'activa'
       ORDER BY fecha_fin DESC LIMIT 1`,
      [userId]
    );

    console.log("📊 Resultado SQL:", rows);

    if (rows.length === 0) {
      return res.json({ suscripcion: false });
    }

    const ahora = new Date();
    const fechaFin = new Date(rows[0].fecha_fin);
    const activa = !rows[0].fecha_fin || fechaFin > ahora;

    res.json({ suscripcion: activa, datos: rows[0] });
  } catch (err) {
    console.error('Error al verificar suscripción:', err);
    res.status(500).json({ error: 'Error al verificar suscripción' });
  }
});


// Obtener una suscripción por id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT 
        s.id,
        s.usuario_id,
        DATE_FORMAT(s.fecha_inicio, '%Y-%m-%d %H:%i:%s') AS fechaInicio,
        DATE_FORMAT(s.fecha_fin, '%Y-%m-%d %H:%i:%s') AS fechaFin,
        s.estado,
        u.nombre AS usuario
      FROM suscripciones s
      LEFT JOIN usuarios u ON s.usuario_id = u.id
      WHERE s.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Suscripción no encontrada.' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener la suscripción:', error);
    res.status(500).json({ error: 'Error al obtener la suscripción.' });
  }
});

// Crear una nueva suscripción
router.post('/', async (req, res) => {
  let { usuario_id, fecha_inicio, fecha_fin, estado } = req.body;

  if (!usuario_id || !estado) {
    return res.status(400).json({ error: 'El usuario y el estado son requeridos.' });
  }

  try {
    // Función para convertir ISO8601 a "YYYY-MM-DD HH:MM:SS"
    const formatDateForMySQL = (dateStr) => {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date.toISOString().slice(0, 19).replace('T', ' ');
    };

    // Convertir las fechas
    fecha_inicio = fecha_inicio ? formatDateForMySQL(fecha_inicio) : formatDateForMySQL(new Date().toISOString());
    fecha_fin = fecha_fin ? formatDateForMySQL(fecha_fin) : null;

    const [result] = await pool.query(
      'INSERT INTO suscripciones (usuario_id, fecha_inicio, fecha_fin, estado) VALUES (?, ?, ?, ?)',
      [usuario_id, fecha_inicio, fecha_fin, estado]
    );
    res.status(201).json({ message: 'Suscripción creada correctamente.', subscriptionId: result.insertId });
  } catch (error) {
    console.error('Error al crear la suscripción:', error);
    res.status(500).json({ error: 'Error al crear la suscripción.' });
  }
});

// Actualizar una suscripción existente
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { usuario_id, fecha_inicio, fecha_fin, estado } = req.body;

  try {
    const [result] = await pool.query(
      'UPDATE suscripciones SET usuario_id = ?, fecha_inicio = ?, fecha_fin = ?, estado = ? WHERE id = ?',
      [usuario_id, fecha_inicio, fecha_fin, estado, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Suscripción no encontrada.' });
    }
    res.json({ message: 'Suscripción actualizada correctamente.' });
  } catch (error) {
    console.error('Error al actualizar la suscripción:', error);
    res.status(500).json({ error: 'Error al actualizar la suscripción.' });
  }
});

// Eliminar una suscripción
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM suscripciones WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Suscripción no encontrada.' });
    }
    res.json({ message: 'Suscripción eliminada correctamente.' });
  } catch (error) {
    console.error('Error al eliminar la suscripción:', error);
    res.status(500).json({ error: 'Error al eliminar la suscripción.' });
  }
});

export default router;

