const express = require('express');
const router = express.Router();
const { Rastreo } = require('../mongo');
const auth = require('../middleware/auth');

// POST /api/rastreo/:viaje_id/punto - agregar punto GPS
router.post('/:viaje_id/punto', auth, async (req, res) => {
  const { lat, lng } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: 'lat y lng requeridos' });
  try {
    const rastreo = await Rastreo.findOneAndUpdate(
      { viaje_id: Number(req.params.viaje_id) },
      {
        $push: { ruta_gps: [lat, lng] },
        $set: { ultima_actualizacion: new Date() }
      },
      { upsert: true, new: true }
    );
    res.json({ ok: true, puntos: rastreo.ruta_gps.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/rastreo/:viaje_id - obtener ruta
router.get('/:viaje_id', auth, async (req, res) => {
  try {
    const rastreo = await Rastreo.findOne({ viaje_id: Number(req.params.viaje_id) });
    res.json(rastreo || { ruta_gps: [], distancia_recorrida: 0 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
