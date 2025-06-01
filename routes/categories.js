import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Obtener todas las categorías (incluye logo)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre, logo_url FROM categorias');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías.' });
  }
});

// Obtener canales por categoría con soporte para id=all
router.get('/canales', async (req, res) => {
  const categoriaId = req.query.id;

  // Si no se especifica id o se usa id=all, traer todos los canales
  if (!categoriaId || categoriaId === 'all') {
    try {
      const [canales] = await pool.query('SELECT * FROM canales');
      return res.json({
        categoria: { nombre: 'Todas las categorías', logo_url: null },
        canales
      });
    } catch (error) {
      console.error('Error al obtener todos los canales:', error);
      return res.status(500).json({ error: 'Error al obtener los canales.' });
    }
  }

  try {
    const [categoriaRows] = await pool.query(
      'SELECT nombre, logo_url FROM categorias WHERE id = ?',
      [categoriaId]
    );

    if (categoriaRows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada.' });
    }

    const [canales] = await pool.query(
      'SELECT * FROM canales WHERE categoria_id = ?',
      [categoriaId]
    );

    res.json({
      categoria: categoriaRows[0],
      canales
    });
  } catch (error) {
    console.error('Error al obtener canales por categoría:', error);
    res.status(500).json({ error: 'Error al obtener canales.' });
  }
});

// Crear nueva categoría con logo opcional
router.post('/', async (req, res) => {
  const { nombre, logo_url } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre de la categoría es requerido.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO categorias (nombre, logo_url) VALUES (?, ?)',
      [nombre, logo_url || null]
    );
    res.status(201).json({ message: 'Categoría creada correctamente.', categoriaId: result.insertId });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({ error: 'Error al crear la categoría.' });
  }
});

export default router;


// Nota: Asegúrate de que la tabla `categorias` tenga las columnas `id`, `nombre` y `logo_url`.