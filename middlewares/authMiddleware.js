import jwt from 'jsonwebtoken';

// Middleware principal: verifica token y decodifica datos del usuario
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ message: 'Token de acceso no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Cargamos los datos del usuario desde el token
    req.user = {
      id: decoded.id,
      nombre: decoded.nombre,
      email: decoded.email,
      rol: decoded.rol,
      pais: decoded.pais,
      fecha_nacimiento: decoded.fecha_nacimiento,
      foto_url: decoded.foto_url
    };

    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token inválido o expirado' });
  }
};

// Middleware adicional para verificar si el usuario es admin
export const checkAdminRole = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({
      message: '⛔ Acceso denegado. Esta sección es solo para administradores.'
    });
  }
  next();
};

export default authMiddleware;
