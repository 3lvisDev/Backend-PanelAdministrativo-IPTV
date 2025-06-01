import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  res.json({ message: "Bienvenido al Dashboard", user: req.user });
});

export default router;
