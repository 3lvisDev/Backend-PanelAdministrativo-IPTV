export default function checkAdminRole(req, res, next) {
  try {
    console.log("🧠 Middleware checkAdminRole | Token decodificado:", req.user);

    const rol = req.user?.rol?.trim().toLowerCase();
    if (rol !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado: se requiere rol de administrador.' });
    }

    next();
  } catch (error) {
    console.error("❌ Error en checkAdminRole:", error);
    return res.status(500).json({ message: 'Error interno en la verificación de rol.' });
  }
}
