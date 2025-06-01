import express from 'express';
import pool from '../db.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// Ruta segura para redirigir a la URL del canal comprada
router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query("SELECT url FROM canales WHERE id = ? AND estado = 1", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Canal no encontrado o inactivo." });
    }

    const streamUrl = rows[0].url;

    // Redirección segura a la URL real
    return res.redirect(streamUrl);

  } catch (error) {
    console.error("Error en /api/stream/:id", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

export default router;