import express from 'express';
import pool from '../db.js';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path'; // Using path for robustness, though __dirname is tricky with ES modules

const router = express.Router();

// Helper function to read and parse the CSV file
const getIdsToIgnore = (filePath) => {
  return new Promise((resolve, reject) => {
    const idsToIgnore = new Set();
    if (!fs.existsSync(filePath)) {
      console.warn(`[WARN] CSV file not found: ${filePath}. Proceeding without ignore list.`);
      resolve(idsToIgnore);
      return;
    }

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        if (row.id_canal) {
          idsToIgnore.add(row.id_canal.trim());
        }
      })
      .on('end', () => {
        console.log(`[INFO] Successfully parsed CSV: ${filePath}. ${idsToIgnore.size} IDs to ignore.`);
        resolve(idsToIgnore);
      })
      .on('error', (error) => {
        console.error(`[ERROR] Error parsing CSV file ${filePath}:`, error);
        // Resolve with an empty set in case of parsing errors to not break the main flow
        resolve(new Set());
      });
  });
};

// Obtener todos los canales con su categoría
router.get('/', async (req, res) => {
  try {
    const baseQuery = `
      SELECT canales.*, categorias.nombre AS categoria, canales.pais_restriction
      FROM canales
      LEFT JOIN categorias ON canales.categoria_id = categorias.id
    `;

    if (req.query.app_source === 'padres') {
      // Path to the CSV file, assuming server runs from project root
      const csvFilePath = './canales_ignorar_padres.csv';
      const idsToIgnore = await getIdsToIgnore(csvFilePath);

      const [allChannels] = await pool.query(baseQuery);

      let filteredChannels = allChannels.filter(channel => {
        return !idsToIgnore.has(String(channel.id));
      });

      if (req.query.pais) {
        const paisQueryParam = req.query.pais.toLowerCase();
        filteredChannels = filteredChannels.filter(channel => {
          if (!channel.pais_restriction || channel.pais_restriction.trim() === "") {
            return true; // Keep if no restriction
          }
          return channel.pais_restriction.toLowerCase() === paisQueryParam;
        });
      }
      res.json(filteredChannels);
    } else {
      // For all other apps or requests without app_source=padres, return the complete list without these specific filters
      const [rows] = await pool.query(baseQuery);
      res.json(rows);
    }
  } catch (error) {
    console.error('Error al obtener canales:', error);
    res.status(500).json({ error: 'Error al obtener canales.' });
  }
});

// Obtener un canal por id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT canales.*, categorias.nombre AS categoria, canales.pais_restriction
      FROM canales
      LEFT JOIN categorias ON canales.categoria_id = categorias.id
      WHERE canales.id = ?
    `, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Canal no encontrado.' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener canal:', error);
    res.status(500).json({ error: 'Error al obtener el canal.' });
  }
});

// Crear un nuevo canal
router.post('/', async (req, res) => {
  const { nombre, url, logo, formato, estado, categoria_id, pais_restriction } = req.body;

  if (!nombre || !url || !formato) {
    return res.status(400).json({ error: 'Nombre, URL y formato son requeridos.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO canales (nombre, url, logo, formato, estado, categoria_id, pais_restriction) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, url, logo || null, formato, estado !== undefined ? estado : true, categoria_id || null, pais_restriction || null]
    );
    res.status(201).json({ message: 'Canal creado correctamente.', canalId: result.insertId });
  } catch (error) {
    console.error('Error al crear canal:', error);
    res.status(500).json({ error: 'Error al crear el canal.' });
  }
});

// Actualizar un canal existente
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, url, logo, formato, estado, categoria_id, pais_restriction } = req.body;

  // Basic check: if no fields are provided for update (excluding id from params)
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'No se proporcionaron datos para actualizar.' });
  }

  try {
    // Construct parts of the query dynamically
    const fieldsToUpdate = [];
    const values = [];

    if (req.body.hasOwnProperty('nombre')) {
      fieldsToUpdate.push('nombre = ?');
      values.push(nombre);
    }
    if (req.body.hasOwnProperty('url')) {
      fieldsToUpdate.push('url = ?');
      values.push(url);
    }
    if (req.body.hasOwnProperty('logo')) {
      fieldsToUpdate.push('logo = ?');
      values.push(logo); // Explicitly allow setting logo to null by providing it
    }
    if (req.body.hasOwnProperty('formato')) {
      fieldsToUpdate.push('formato = ?');
      values.push(formato);
    }
    if (req.body.hasOwnProperty('estado')) {
      fieldsToUpdate.push('estado = ?');
      values.push(estado);
    }
    if (req.body.hasOwnProperty('categoria_id')) {
      fieldsToUpdate.push('categoria_id = ?');
      values.push(categoria_id); // Explicitly allow setting categoria_id to null
    }
    if (req.body.hasOwnProperty('pais_restriction')) {
      fieldsToUpdate.push('pais_restriction = ?');
      values.push(pais_restriction); // Explicitly allow setting pais_restriction to null
    }

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ error: 'Ningún campo válido proporcionado para la actualización.' });
    }

    const query = `UPDATE canales SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
    values.push(id);

    const [result] = await pool.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Canal no encontrado.' });
    }
    res.json({ message: 'Canal actualizado correctamente.' });
  } catch (error) {
    console.error('Error al actualizar canal:', error);
    res.status(500).json({ error: 'Error al actualizar el canal.' });
  }
});

// Eliminar un canal
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM canales WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Canal no encontrado.' });
    }
    res.json({ message: 'Canal eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar canal:', error);
    res.status(500).json({ error: 'Error al eliminar el canal.' });
  }
});

export default router;
