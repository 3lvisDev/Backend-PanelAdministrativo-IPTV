import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Servir archivos estáticos desde la carpeta "videos"
app.use('/videos', express.static(path.join(__dirname, 'videos')));

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor IPTV activo y sirviendo videos 📺');
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
