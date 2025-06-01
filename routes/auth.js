import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import verifyToken, { checkAdminRole } from '../middlewares/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'L8v3yB1zR4sQ7nU2mX9kP5dF0jT6wE8a';

// 📆 Convertir fecha a dd/mm/yyyy
function formatearFecha(fecha) {
  const date = new Date(fecha);
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const anio = date.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

// 📁 Configurar multer para subir imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './uploads';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `usuario_${req.user.id}_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// 🧪 Validaciones
function validarPais(pais) {
  const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{2,}$/;
  return regex.test(pais.trim());
}

function validarFechaDDMMYYYY(fechaStr) {
  const [dia, mes, anio] = fechaStr.split('/').map(Number);
  if (!dia || !mes || !anio) return false;
  if (anio < 1900 || anio > new Date().getFullYear()) return false;
  if (mes < 1 || mes > 12) return false;
  const diasPorMes = [31, (anio % 4 === 0 && anio % 100 !== 0) || (anio % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return dia >= 1 && dia <= diasPorMes[mes - 1];
}

// 🔐 LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email y contraseña requeridos.' });

  try {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas.' });

    const passwordValida = await bcrypt.compare(password, user.password_hash);
    if (!passwordValida) return res.status(401).json({ message: 'Credenciales inválidas.' });

    const fechaFormateada = formatearFecha(user.fecha_nacimiento);
    const token = jwt.sign(
      {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        pais: user.pais,
        fecha_nacimiento: fechaFormateada,
        foto_url: user.foto_url
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 60 * 60 * 1000,
    }).json({
      message: 'Inicio de sesión exitoso.',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        pais: user.pais,
        fecha_nacimiento: fechaFormateada,
        foto_url: user.foto_url
      }
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
});

// 🔍 GET /me
router.get('/me', verifyToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [userId]);
    const user = rows[0];
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
    const fechaFormateada = formatearFecha(user.fecha_nacimiento);
    res.json({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      pais: user.pais,
      fecha_nacimiento: fechaFormateada,
      foto_url: user.foto_url
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el perfil.' });
  }
});

// 👤 Registro de cliente
router.post('/register', async (req, res) => {
  const { nombre, email, password, fecha_nacimiento, pais } = req.body;
  if (!nombre || !email || !password || !fecha_nacimiento || !pais)
    return res.status(400).json({ message: 'Todos los campos son requeridos.' });
  if (!validarFechaDDMMYYYY(fecha_nacimiento))
    return res.status(400).json({ message: '❌ Fecha de nacimiento inválida.' });
  if (!validarPais(pais))
    return res.status(400).json({ message: '❌ País inválido.' });

  const [d, m, a] = fecha_nacimiento.split('/');
  const fechaConvertida = `${a}-${m}-${d}`;

  try {
    const [existing] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (existing.length > 0)
      return res.status(409).json({ message: 'El email ya está registrado.' });

    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, email, password_hash, rol, fecha_nacimiento, pais) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, email, password_hash, 'cliente', fechaConvertida, pais]
    );

    const [userRows] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [result.insertId]);
    const user = userRows[0];
    const fechaFormateada = formatearFecha(user.fecha_nacimiento);

    const token = jwt.sign(
      {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        pais: user.pais,
        fecha_nacimiento: fechaFormateada,
        foto_url: user.foto_url
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 60 * 60 * 1000,
    }).json({
      message: 'Registro exitoso.',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        pais: user.pais,
        fecha_nacimiento: fechaFormateada,
        foto_url: user.foto_url
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar.' });
  }
});

// 👑 Registro de administrador (solo admin puede)
router.post('/register-admin', verifyToken, checkAdminRole, async (req, res) => {
  const { nombre, email, password, fecha_nacimiento, pais } = req.body;
  if (!nombre || !email || !password || !fecha_nacimiento || !pais)
    return res.status(400).json({ message: 'Todos los campos son requeridos.' });

  if (!validarFechaDDMMYYYY(fecha_nacimiento))
    return res.status(400).json({ message: '❌ Fecha inválida.' });

  if (!validarPais(pais))
    return res.status(400).json({ message: '❌ País inválido.' });

  const [d, m, a] = fecha_nacimiento.split('/');
  const fechaConvertida = `${a}-${m}-${d}`;

  try {
    const [existing] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (existing.length > 0)
      return res.status(409).json({ message: 'El email ya está registrado.' });

    const password_hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO usuarios (nombre, email, password_hash, rol, fecha_nacimiento, pais) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, email, password_hash, 'admin', fechaConvertida, pais]
    );

    res.json({ message: '✅ Administrador registrado correctamente.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar admin.' });
  }
});

// 🗑️ Eliminar usuario (solo admin)
router.delete('/users/:id', verifyToken, checkAdminRole, async (req, res) => {
  const userId = parseInt(req.params.id);
  const adminId = req.user.id;

  if (userId === adminId) {
    return res.status(400).json({ message: '⛔ No puedes eliminar tu propia cuenta.' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    await pool.query('DELETE FROM usuarios WHERE id = ?', [userId]);
    res.json({ message: '✅ Usuario eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error al eliminar el usuario.' });
  }
});

// ✏️ Editar usuario (solo admin)
router.put('/update/:id', verifyToken, checkAdminRole, async (req, res) => {
  const { id } = req.params;
  const { nombre, email, rol } = req.body;

  if (!nombre || !email || !rol) {
    return res.status(400).json({ message: 'Todos los campos son requeridos.' });
  }

  try {
    await pool.query(
      'UPDATE usuarios SET nombre = ?, email = ?, rol = ? WHERE id = ?',
      [nombre, email, rol, id]
    );
    res.json({ message: '✅ Usuario actualizado correctamente.' });
  } catch (error) {
    console.error('❌ Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error al actualizar el usuario.' });
  }
});


// 🔍 Listar usuarios (solo admin)
router.get('/users', verifyToken, checkAdminRole, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, nombre, email, rol, pais, fecha_nacimiento FROM usuarios ORDER BY id DESC'
    );
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Error al listar usuarios.' });
  }
});

// 📸 Subir foto de perfil
router.put('/profile-picture', verifyToken, upload.single('foto'), async (req, res) => {
  const userId = req.user.id;
  const relativePath = req.file.path.replace(/\\/g, '/');

  try {
    await pool.query('UPDATE usuarios SET foto_url = ? WHERE id = ?', [relativePath, userId]);

    res.json({
      message: '✅ Foto actualizada.',
      foto_url: `https://pleytv.com/${relativePath}`
    });
  } catch (error) {
    console.error("❌ Error al subir foto:", error);
    res.status(500).json({ message: 'Error al subir foto.' });
  }
});


// ✏️ Actualizar perfil
router.put('/profile', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { nombre, email, pais, fecha_nacimiento } = req.body;

  if (!nombre || !email || !pais || !fecha_nacimiento)
    return res.status(400).json({ message: 'Todos los campos son requeridos.' });

  if (!validarFechaDDMMYYYY(fecha_nacimiento))
    return res.status(400).json({ message: '❌ Fecha inválida.' });

  if (!validarPais(pais))
    return res.status(400).json({ message: '❌ País inválido.' });

  const [d, m, a] = fecha_nacimiento.split('/');
  const fechaConvertida = `${a}-${m}-${d}`;

  try {
    await pool.query(
      'UPDATE usuarios SET nombre = ?, email = ?, pais = ?, fecha_nacimiento = ? WHERE id = ?',
      [nombre, email, pais, fechaConvertida, userId]
    );
    res.json({
      message: '✅ Perfil actualizado.',
      user: { id: userId, nombre, email, pais, fecha_nacimiento }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar perfil.' });
  }
});

// 🔐 Cambiar contraseña
router.put('/profile-password', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { actual, nueva } = req.body;

  if (!actual || !nueva)
    return res.status(400).json({ message: 'Se requieren ambas contraseñas.' });

  try {
    const [rows] = await pool.query('SELECT password_hash FROM usuarios WHERE id = ?', [userId]);
    const user = rows[0];

    const coincide = await bcrypt.compare(actual, user.password_hash);
    if (!coincide)
      return res.status(401).json({ message: '❌ Contraseña actual incorrecta.' });

    const nuevoHash = await bcrypt.hash(nueva, 10);
    await pool.query('UPDATE usuarios SET password_hash = ? WHERE id = ?', [nuevoHash, userId]);

    res.json({ message: '✅ Contraseña actualizada correctamente.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al cambiar contraseña.' });
  }
});

export default router;
