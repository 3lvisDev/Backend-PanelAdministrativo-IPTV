import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Obtener todos los pagos con información del usuario
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.id,
        p.usuario_id,
        p.monto,
        p.metodo_pago,
        DATE_FORMAT(p.fecha_pago, '%Y-%m-%d %H:%i:%s') AS fecha_pago,
        p.estado,
        u.nombre AS usuario
      FROM pagos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los pagos.' });
  }
});

// Obtener un pago por id con JOIN a usuarios
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT 
        p.id,
        p.usuario_id,
        p.monto,
        p.metodo_pago,
        DATE_FORMAT(p.fecha_pago, '%Y-%m-%d %H:%i:%s') AS fecha_pago,
        p.estado,
        u.nombre AS usuario
      FROM pagos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      WHERE p.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Pago no encontrado.' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el pago.' });
  }
});

// Registrar un nuevo pago
router.post('/', async (req, res) => {
  const { usuario_id, monto, metodo_pago, estado } = req.body;

  if (!usuario_id || !monto || !metodo_pago || !estado) {
    return res.status(400).json({ error: 'usuario_id, monto, metodo_pago y estado son requeridos.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO pagos (usuario_id, monto, metodo_pago, estado) VALUES (?, ?, ?, ?)',
      [usuario_id, monto, metodo_pago, estado]
    );
    res.status(201).json({ message: 'Pago registrado correctamente.', paymentId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar el pago.' });
  }
});

// Actualizar un pago existente
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { usuario_id, monto, metodo_pago, estado } = req.body;

  try {
    const [result] = await pool.query(
      'UPDATE pagos SET usuario_id = ?, monto = ?, metodo_pago = ?, estado = ? WHERE id = ?',
      [usuario_id, monto, metodo_pago, estado, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Pago no encontrado.' });
    }
    res.json({ message: 'Pago actualizado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el pago.' });
  }
});

// Eliminar un pago
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM pagos WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Pago no encontrado.' });
    }
    res.json({ message: 'Pago eliminado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el pago.' });
  }
});

// Actualizar un pago existente y crear suscripción si es 'completado'
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { usuario_id, monto, metodo_pago, estado } = req.body;

  try {
    const [result] = await pool.query(
      'UPDATE pagos SET usuario_id = ?, monto = ?, metodo_pago = ?, estado = ? WHERE id = ?',
      [usuario_id, monto, metodo_pago, estado, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Pago no encontrado.' });
    }

    // ✅ Si el estado del pago es 'completado', crear suscripción
    if (estado === 'completado') {
      // Verificar si ya tiene una suscripción activa
      const [subs] = await pool.query(
        `SELECT * FROM suscripciones 
         WHERE usuario_id = ? AND estado = 'activa' 
         AND (fecha_fin IS NULL OR fecha_fin > NOW())`,
        [usuario_id]
      );

      if (subs.length === 0) {
        const fecha_inicio = new Date();
        const fecha_fin = new Date();
        fecha_fin.setMonth(fecha_fin.getMonth() + 1); // ejemplo: 1 mes de duración

        await pool.query(
          `INSERT INTO suscripciones (usuario_id, fecha_inicio, fecha_fin, estado) 
           VALUES (?, ?, ?, 'activa')`,
          [usuario_id, fecha_inicio, fecha_fin]
        );
      }
    }

    res.json({ message: 'Pago actualizado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el pago.' });
  }
});


export default router;
