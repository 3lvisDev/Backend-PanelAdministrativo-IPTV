import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Conteo total de usuarios
    const [usersResult] = await pool.query('SELECT COUNT(*) AS totalUsuarios FROM usuarios');
    
    // Conteo de clientes (usuarios con rol "cliente")
    const [clientesResult] = await pool.query("SELECT COUNT(*) AS totalClientes FROM usuarios WHERE rol = 'cliente'");
    
    // Conteo de admins (usuarios con rol "admin")
    const [adminsResult] = await pool.query("SELECT COUNT(*) AS totalAdmins FROM usuarios WHERE rol = 'admin'");
    
    // Conteo de canales activos (suponiendo que estado TRUE indica activo)
    const [channelsResult] = await pool.query('SELECT COUNT(*) AS totalCanales FROM canales WHERE estado = TRUE');
    
    // Conteo de suscripciones
    const [subsResult] = await pool.query('SELECT COUNT(*) AS totalSuscripciones FROM suscripciones');
    
    // Suma de pagos de hoy (se asume que la columna fecha_pago es de tipo DATETIME)
    const [paymentsTodayResult] = await pool.query("SELECT SUM(monto) AS pagosHoy FROM pagos WHERE DATE(fecha_pago) = CURDATE()");
    
    // Suma de pagos del mes actual (filtrando por mes y año)
    const [paymentsMonthResult] = await pool.query(
      "SELECT SUM(monto) AS totalPagosMes FROM pagos WHERE MONTH(fecha_pago) = MONTH(CURDATE()) AND YEAR(fecha_pago) = YEAR(CURDATE())"
    );

    res.json({
      totalUsuarios: usersResult[0].totalUsuarios,
      totalClientes: clientesResult[0].totalClientes,
      totalAdmins: adminsResult[0].totalAdmins,
      canalesActivos: channelsResult[0].totalCanales,
      suscripciones: subsResult[0].totalSuscripciones,
      pagosHoy: paymentsTodayResult[0].pagosHoy || 0,
      totalPagosMes: paymentsMonthResult[0].totalPagosMes || 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

export default router;
