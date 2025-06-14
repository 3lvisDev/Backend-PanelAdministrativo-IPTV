import express from 'express';
import pool from '../db.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// Ruta segura para redirigir a la URL del canal comprada
router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userPais = req.user?.pais; // From authMiddleware

  try {
    // Fetch channel URL and its country restriction
    const [rows] = await pool.query(
      "SELECT url, pais_restriction FROM canales WHERE id = ? AND estado = 1",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Canal no encontrado o inactivo." });
    }

    const { url: streamUrl, pais_restriction: channelPaisRestriction } = rows[0];

    // Check for country restriction
    if (channelPaisRestriction && channelPaisRestriction.trim() !== "") {
      if (!userPais) {
        // This case should ideally not happen if authMiddleware ensures user.pais,
        // but as a safeguard:
        return res.status(403).json({ error: "No se pudo verificar el país del usuario." });
      }
      if (channelPaisRestriction.toLowerCase() !== userPais.toLowerCase()) {
        return res.status(403).json({ error: "Este canal no está disponible en tu país." });
      }
    }

    // If no restriction or country matches, redirect to the stream URL
    return res.redirect(streamUrl);

  } catch (error) {
    console.error("Error en /api/stream/:id", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

export default router;