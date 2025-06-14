import express from 'express';
import pool from '../db.js';
import authMiddleware from '../middlewares/authMiddleware.js'; // ✅ IMPORTACIÓN CORRECTA


const router = express.Router();

// Función para convertir ISO8601 a "YYYY-MM-DD HH:MM:SS"
const formatDateForMySQL = (dateStr) => {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date.toISOString().slice(0, 19).replace('T', ' ');
};

// Obtener todas las suscripciones (con JOIN a usuarios)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        s.id,
        s.usuario_id,
        DATE_FORMAT(s.fecha_inicio, '%Y-%m-%d %H:%i:%s') AS fechaInicio,
        DATE_FORMAT(s.fecha_fin, '%Y-%m-%d %H:%i:%s') AS fechaFin,
        s.estado,
        u.nombre AS usuario
      FROM suscripciones s
      LEFT JOIN usuarios u ON s.usuario_id = u.id
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener las suscripciones:', error);
    res.status(500).json({ error: 'Error al obtener las suscripciones.' });
  }
});

// Actualizar el estado de renovación automática de una suscripción
router.put('/:id/renewal-status', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { renovacion_automatica } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'El ID de la suscripción es requerido.' });
  }

  if (typeof renovacion_automatica !== 'boolean') {
    return res.status(400).json({ error: 'El campo renovacion_automatica debe ser un booleano.' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM suscripciones WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Suscripción no encontrada.' });
    }

    const subscription = rows[0];

    // Verificar permisos
    if (req.user.rol !== 'admin' && subscription.usuario_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para modificar esta suscripción.' });
    }

    // Actualizar la base de datos
    await pool.query('UPDATE suscripciones SET renovacion_automatica = ? WHERE id = ?', [renovacion_automatica, id]);

    res.json({ message: 'Estado de renovación automática actualizado correctamente.' });
  } catch (error) {
    console.error('Error al actualizar el estado de renovación automática:', error);
    res.status(500).json({ error: 'Error al actualizar el estado de renovación automática.' });
  }
});

// Verificación de suscripción
router.get('/mia', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  console.log("📦 Token userId:", userId);

  try {
    const [rows] = await pool.query(
      `SELECT id, usuario_id, fecha_inicio, fecha_fin, estado, renovacion_automatica
       FROM suscripciones
       WHERE usuario_id = ? AND estado = 'activa'
       ORDER BY fecha_fin DESC LIMIT 1`,
      [userId]
    );

    console.log("📊 Resultado SQL:", rows);

    if (rows.length === 0) {
      return res.json({ suscripcion: false });
    }

    const subscriptionData = rows[0];
    // Convert renovacion_automatica to boolean if it's stored as 0 or 1
    subscriptionData.renovacion_automatica = !!subscriptionData.renovacion_automatica;

    const ahora = new Date();
    const fechaFin = new Date(subscriptionData.fecha_fin);
    const activa = !subscriptionData.fecha_fin || fechaFin > ahora;

    res.json({ suscripcion: activa, datos: subscriptionData });
  } catch (err) {
    console.error('Error al verificar suscripción:', err);
    res.status(500).json({ error: 'Error al verificar suscripción' });
  }
});


// Obtener una suscripción por id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT 
        s.id,
        s.usuario_id,
        DATE_FORMAT(s.fecha_inicio, '%Y-%m-%d %H:%i:%s') AS fechaInicio,
        DATE_FORMAT(s.fecha_fin, '%Y-%m-%d %H:%i:%s') AS fechaFin,
        s.estado,
        s.renovacion_automatica,
        u.nombre AS usuario
      FROM suscripciones s
      LEFT JOIN usuarios u ON s.usuario_id = u.id
      WHERE s.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Suscripción no encontrada.' });
    }
    const subscriptionData = rows[0];
    // Convert renovacion_automatica to boolean if it's stored as 0 or 1
    subscriptionData.renovacion_automatica = !!subscriptionData.renovacion_automatica;
    res.json(subscriptionData);
  } catch (error) {
    console.error('Error al obtener la suscripción:', error);
    res.status(500).json({ error: 'Error al obtener la suscripción.' });
  }
});

// Crear una nueva suscripción
router.post('/', async (req, res) => {
  let { usuario_id, fecha_inicio, fecha_fin, estado, renovacion_automatica } = req.body;

  if (!usuario_id || !estado) {
    return res.status(400).json({ error: 'El usuario y el estado son requeridos.' });
  }

  // Default renovacion_automatica to false if not provided or not a boolean
  if (typeof renovacion_automatica !== 'boolean') {
    renovacion_automatica = false;
  }

  try {
    // Convertir las fechas
    fecha_inicio = fecha_inicio ? formatDateForMySQL(fecha_inicio) : formatDateForMySQL(new Date().toISOString());
    fecha_fin = fecha_fin ? formatDateForMySQL(fecha_fin) : null;

    const [result] = await pool.query(
      'INSERT INTO suscripciones (usuario_id, fecha_inicio, fecha_fin, estado, renovacion_automatica) VALUES (?, ?, ?, ?, ?)',
      [usuario_id, fecha_inicio, fecha_fin, estado, renovacion_automatica]
    );
    res.status(201).json({ message: 'Suscripción creada correctamente.', subscriptionId: result.insertId });
  } catch (error) {
    console.error('Error al crear la suscripción:', error);
    res.status(500).json({ error: 'Error al crear la suscripción.' });
  }
});

// Renovar una suscripción
router.post('/:id/renew', authMiddleware, async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'El ID de la suscripción es requerido.' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM suscripciones WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Suscripción no encontrada.' });
    }

    const subscription = rows[0];

    // Verificar permisos
    if (req.user.rol !== 'admin' && subscription.usuario_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para renovar esta suscripción.' });
    }

    let currentEndDate = subscription.fecha_fin ? new Date(subscription.fecha_fin) : null;
    const now = new Date();
    let newEndDate;

    // Si la fecha_fin es nula, inválida o está en el pasado, renovar por 1 mes desde hoy
    if (!currentEndDate || isNaN(currentEndDate.getTime()) || currentEndDate < now) {
      newEndDate = new Date(now);
    } else {
      newEndDate = new Date(currentEndDate);
    }

    // Añadir un mes
    newEndDate.setMonth(newEndDate.getMonth() + 1);

    // Manejo de desbordamiento de mes (e.g., Jan 31 + 1 month)
    // Si newEndDate.getMonth() no es (startDate.getMonth() + 1) % 12, entonces hubo desbordamiento.
    // Ejemplo: Enero (0) + 1 mes = Febrero (1). Si newEndDate.getMonth() es 2 (Marzo), hubo desbordamiento.
    // Corrección: Establecer el día a 0 del mes siguiente al objetivo, lo que da el último día del mes objetivo.
    // Esto es una forma simplificada; la lógica de setDate(0) es más robusta.
    // Si la fecha original era, por ejemplo, Jan 31, newEndDate es ahora Mar 3 (o Mar 2 en bisiesto)
    // Para corregir, si el mes de newEndDate no es el mes esperado (currentEndDate.getMonth() + 1),
    // se retrocede al último día del mes correcto.
    // Esta lógica se puede simplificar: si el día del mes de newEndDate no es el mismo que el de startDate,
    // significa que setMonth desbordó al siguiente mes y ajustó el día.
    // Por ejemplo, si startDate es Jan 31, newEndDate.getMonth() + 1 apunta a Feb.
    // Si newEndDate es Mar 3, newEndDate.setDate(0) lo llevaría al último día de Feb.
    // Esta es una forma común de manejarlo:
    // newEndDate.setDate(0) -- esto lo llevaría al último día del mes *anterior* al actual de newEndDate
    // La lógica correcta es: si el mes cambió más de lo esperado, ajustar.
    // Una forma más simple es verificar si el día del mes cambió.
    // Si partimos de Jan 31st, y newEndDate es March 3rd. newEndDate.getDate() es 3.
    // Si el currentEndDate.getDate() era 31. Si son diferentes, y el mes es el mes+2, ajustar.
    // La manera más robusta y simple es setear el mes y luego verificar si el día cambió y ajustar si es necesario.
    // O usar la lógica de `setDate(0)` del mes siguiente al mes objetivo.
    // Si el mes objetivo es M, vamos a M+1 y hacemos setDate(0).
    // Example: current Feb 28 2023. newEndDate = Mar 28 2023.
    // Example: current Jan 30 2024. newEndDate = Feb 29 2024. (getMonth()+1)
    // Example: current Jan 31 2024. newEndDate = Mar 2 2024. (getMonth()+1) -> Debería ser Feb 29.
    //   En este caso, newEndDate (Mar 2).getMonth() es 2. currentEndDate.getMonth() es 0.
    //   Si (newEndDate.getMonth() !== (currentEndDate.getMonth() + 1) % 12 && !(currentEndDate.getMonth() === 11 && newEndDate.getMonth() === 0) ) {
    //      newEndDate.setDate(0); // Pone al último día del mes anterior (Feb)
    //   }
    // La lógica de setMonth ya maneja la mayoría de los casos correctamente, excepto el desbordamiento al día X del mes M+2.
    // Si la fecha original era el día D del mes M.
    // Si al hacer newDate.setMonth(newDate.getMonth() + 1) el día no es D, es porque D no existe en M+1.
    // En tal caso, JavaScript lo pasa al mes M+2.
    // Ejemplo: Jan 31 (D=31, M=0). newDate.setMonth(0+1) -> newDate se vuelve Feb 31, que es Mar 2 o 3.
    // Para corregirlo, si newDate.getDate() no es D, entonces hacemos newDate.setDate(0) en el *siguiente* mes.
    // O sea, si currentEndDate.getDate() !== newEndDate.getDate(), entonces newEndDate.setDate(0) (del mes actual de newEndDate)
    // lo cual lo regresa al último día del mes anterior.

    // Si la fecha de inicio era el día X, y después de añadir un mes, la fecha es Y (Y != X),
    // significa que el mes M+1 no tiene día X (ej. Ene 31 -> Feb no tiene 31).
    // En este caso, `setMonth` lo pasa a Mar <algo>. Para corregir, hacemos `setDate(0)` en `newEndDate`,
    // lo que lo lleva al último día del mes anterior (Feb).
    if (currentEndDate && currentEndDate.getDate() !== newEndDate.getDate()) {
        // Esto sucede si, por ejemplo, pasamos de Jan 31 a Mar 03 (en lugar de Feb 28/29)
        // newEndDate.setDate(0) lo llevaría al último día del mes *anterior* al actual de newEndDate (Feb)
        newEndDate.setDate(0);
    }


    const newFechaFinFormatted = formatDateForMySQL(newEndDate.toISOString());

    await pool.query(
      'UPDATE suscripciones SET fecha_fin = ?, estado = ? WHERE id = ?',
      [newFechaFinFormatted, 'activa', id]
    );

    res.json({ message: 'Suscripción renovada correctamente.', nueva_fecha_fin: newFechaFinFormatted });
  } catch (error) {
    console.error('Error al renovar la suscripción:', error);
    res.status(500).json({ error: 'Error al renovar la suscripción.' });
  }
});

// Actualizar una suscripción existente
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { usuario_id, fecha_inicio, fecha_fin, estado } = req.body;

  try {
    const [result] = await pool.query(
      'UPDATE suscripciones SET usuario_id = ?, fecha_inicio = ?, fecha_fin = ?, estado = ? WHERE id = ?',
      [usuario_id, fecha_inicio, fecha_fin, estado, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Suscripción no encontrada.' });
    }
    res.json({ message: 'Suscripción actualizada correctamente.' });
  } catch (error) {
    console.error('Error al actualizar la suscripción:', error);
    res.status(500).json({ error: 'Error al actualizar la suscripción.' });
  }
});

// Eliminar una suscripción
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM suscripciones WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Suscripción no encontrada.' });
    }
    res.json({ message: 'Suscripción eliminada correctamente.' });
  } catch (error) {
    console.error('Error al eliminar la suscripción:', error);
    res.status(500).json({ error: 'Error al eliminar la suscripción.' });
  }
});

export default router;

