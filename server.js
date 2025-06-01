import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import pool from './db.js';
import authRoutes from './routes/auth.js';
import channelRoutes from './routes/channels.js';
import subscriptionRoutes from './routes/subscriptions.js';
import paymentRoutes from './routes/payments.js';
import statsRoutes from './routes/stats.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import streamRoutes from './routes/stream.js';
import categoriasRoutes from './routes/categories.js'; // Solo esta importación de categorías
import publicidadRoutes from './routes/publicidad.js';



const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

    // Configuración de CORS para permitir solicitudes desde el frontend
    const corsOptions = {
	  origin: "https://pleytv.com",
	  methods: ["GET", "POST", "PUT", "DELETE"],
	  allowedHeaders: ["Content-Type", "Authorization"],
	  credentials: true,
};



app.use(cors(corsOptions));
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor IPTV funcionando 🚀');
});

// Ruta para probar la conexión a la base de datos
app.get('/test-db', async (req, res) => {
  try {
    const [result] = await pool.query('SELECT 1 + 1 AS solution');
    res.json({ message: 'Conexión exitosa a MySQL', result });
  } catch (error) {
    res.status(500).json({ error: 'Error conectando a la base de datos' });
  }
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/categorias', categoriasRoutes); // ✅ RUTA UNIFICADA PARA CATEGORÍAS
app.use('/api/images', publicidadRoutes);
app.use('/api/suscripciones', subscriptionRoutes);
app.use('/uploads', express.static('uploads'));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});
// Manejo de errores