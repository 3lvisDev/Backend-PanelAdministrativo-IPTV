import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Obtener publicidad por tipo (ej: ?tipo=banner o ?tipo=logo)
router.get('/', async (req, res) => {
  const { tipo } = req.query;

  // Si el tipo es "banner", devolvemos directamente los 3 banners
  if (tipo === 'banner') {
    return res.json({
      banners: [
        "https://pleytv.com/uploads/BannerPrincipal.png",
        "https://pleytv.com/uploads/segundoBanner.png",
        "https://pleytv.com/uploads/tercerBanner.png",
		"https://pleytv.com/uploads/bannerPrincipalTV.png",
		"https://pleytv.com/uploads/segundoBannerTV.png",
		"https://pleytv.com/uploads/tercerBannerTV.png",
      ]
    });
  }

  // Si el tipo es "logo", devolvemos directamente los 3 logos
  if (tipo === 'logo') {
    return res.json({
      logos: [
        "https://pleytv.com/uploads/logo.png",
      ]
    });
  }

  // Otros tipos: consulta a la base de datos
  try {
    const [ads] = await pool.query(
      'SELECT * FROM publicidad WHERE tipo = ?',
      [tipo || 'banner']
    );
    res.json(ads);
  } catch (error) {
    console.error('Error al obtener publicidad:', error);
    res.status(500).json({ error: 'Error al obtener la publicidad.' });
  }
});

export default router;
