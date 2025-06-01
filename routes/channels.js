import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Obtener todos los canales con su categoría
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT canales.*, categorias.nombre AS categoria
      FROM canales
      LEFT JOIN categorias ON canales.categoria_id = categorias.id
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener canales:', error);
    res.status(500).json({ error: 'Error al obtener canales.' });
  }
});

// Obtener un canal por id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT canales.*, categorias.nombre AS categoria
      FROM canales
      LEFT JOIN categorias ON canales.categoria_id = categorias.id
      WHERE canales.id = ?
    `, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Canal no encontrado.' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener canal:', error);
    res.status(500).json({ error: 'Error al obtener el canal.' });
  }
});

// Crear un nuevo canal
router.post('/', async (req, res) => {
  const { nombre, url, logo, formato, estado, categoria_id } = req.body;

  if (!nombre || !url || !formato) {
    return res.status(400).json({ error: 'Nombre, URL y formato son requeridos.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO canales (nombre, url, logo, formato, estado, categoria_id) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, url, logo || null, formato, estado !== undefined ? estado : true, categoria_id || null]
    );
    res.status(201).json({ message: 'Canal creado correctamente.', canalId: result.insertId });
  } catch (error) {
    console.error('Error al crear canal:', error);
    res.status(500).json({ error: 'Error al crear el canal.' });
  }
});

// Actualizar un canal existente
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, url, logo, formato, estado, categoria_id } = req.body;

  try {
    const [result] = await pool.query(
      'UPDATE canales SET nombre = ?, url = ?, logo = ?, formato = ?, estado = ?, categoria_id = ? WHERE id = ?',
      [nombre, url, logo, formato, estado, categoria_id || null, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Canal no encontrado.' });
    }
    res.json({ message: 'Canal actualizado correctamente.' });
  } catch (error) {
    console.error('Error al actualizar canal:', error);
    res.status(500).json({ error: 'Error al actualizar el canal.' });
  }
});

// Eliminar un canal
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM canales WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Canal no encontrado.' });
    }
    res.json({ message: 'Canal eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar canal:', error);
    res.status(500).json({ error: 'Error al eliminar el canal.' });
  }
});

export default router;
