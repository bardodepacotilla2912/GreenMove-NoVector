const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

// GET /api/vehiculos/mis-vehiculos
router.get('/mis-vehiculos', auth, (req, res) => {
  const vehiculos = db.prepare(`SELECT * FROM vehiculo WHERE usuario_id = ?`).all(req.user.id);
  res.json(vehiculos);
});

// POST /api/vehiculos
router.post('/', auth, (req, res) => {
  const { placas, marca, modelo, capacidad_maxima, tipo_combustible } = req.body;
  if (!placas || !marca || !modelo || !capacidad_maxima)
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  try {
    const result = db.prepare(
      `INSERT INTO vehiculo (usuario_id, placas, marca, modelo, capacidad_maxima, tipo_combustible) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(req.user.id, placas.toUpperCase(), marca, modelo, capacidad_maxima, tipo_combustible || 'gasolina');
    res.json({ id: result.lastInsertRowid, message: 'Vehículo registrado' });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Placas ya registradas' });
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/vehiculos/:id
router.delete('/:id', auth, (req, res) => {
  const v = db.prepare(`SELECT * FROM vehiculo WHERE id = ? AND usuario_id = ?`).get(req.params.id, req.user.id);
  if (!v) return res.status(403).json({ error: 'No autorizado' });
  db.prepare(`DELETE FROM vehiculo WHERE id = ?`).run(req.params.id);
  res.json({ message: 'Vehículo eliminado' });
});

module.exports = router;
