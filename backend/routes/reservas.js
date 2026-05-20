const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

// GET /api/reservas/mis-reservas
router.get('/mis-reservas', auth, (req, res) => {
  const reservas = db.prepare(`
    SELECT r.*,
           v.origen_nombre, v.destino_nombre, v.fecha_hora_salida, v.punto_reunion,
           v.costo, v.asientos_ofrecidos, v.asientos_disponibles, v.co2_ahorrado_kg,
           u.nombre AS conductor_nombre, u.matricula AS conductor_matricula,
           u.carrera AS conductor_carrera, u.rating_conductor,
           veh.placas, veh.marca, veh.modelo
    FROM reserva r
    JOIN viaje v ON v.id = r.viaje_id
    JOIN usuario u ON u.id = v.conductor_id
    JOIN vehiculo veh ON veh.id = v.vehiculo_id
    WHERE r.pasajero_id = ?
    ORDER BY r.fecha_reserva DESC
  `).all(req.user.id);
  res.json(reservas);
});

// POST /api/reservas - reservar un viaje
router.post('/', auth, (req, res) => {
  const { viaje_id } = req.body;
  if (!viaje_id) return res.status(400).json({ error: 'viaje_id requerido' });

  const viaje = db.prepare(`SELECT * FROM viaje WHERE id = ? AND estado = 'activo'`).get(viaje_id);
  if (!viaje) return res.status(404).json({ error: 'Viaje no disponible' });
  if (viaje.conductor_id === req.user.id) return res.status(400).json({ error: 'No puedes reservar tu propio viaje' });
  if (viaje.asientos_disponibles < 1) return res.status(400).json({ error: 'Sin asientos disponibles' });

  const existe = db.prepare(`SELECT id FROM reserva WHERE viaje_id = ? AND pasajero_id = ? AND estado != 'cancelada'`).get(viaje_id, req.user.id);
  if (existe) return res.status(409).json({ error: 'Ya tienes una reserva en este viaje' });

  const result = db.prepare(`INSERT INTO reserva (viaje_id, pasajero_id) VALUES (?, ?)`).run(viaje_id, req.user.id);
  db.prepare(`UPDATE viaje SET asientos_disponibles = asientos_disponibles - 1 WHERE id = ?`).run(viaje_id);
  db.prepare(`UPDATE estadisticas SET pendientes_pasajero = pendientes_pasajero + 1 WHERE usuario_id = ?`).run(req.user.id);

  const reserva = db.prepare(`
    SELECT r.*, v.origen_nombre, v.destino_nombre, v.fecha_hora_salida, v.punto_reunion,
           v.costo, u.nombre AS conductor_nombre, u.matricula AS conductor_matricula,
           u.rating_conductor, veh.placas, veh.marca, veh.modelo,
           v.asientos_ofrecidos, v.asientos_disponibles
    FROM reserva r
    JOIN viaje v ON v.id = r.viaje_id
    JOIN usuario u ON u.id = v.conductor_id
    JOIN vehiculo veh ON veh.id = v.vehiculo_id
    WHERE r.id = ?
  `).get(result.lastInsertRowid);

  res.json(reserva);
});

// POST /api/reservas/:id/aceptar - conductor acepta un pasajero
router.post('/:id/aceptar', auth, (req, res) => {
  const reserva = db.prepare(`
    SELECT r.*, v.conductor_id, v.co2_ahorrado_kg, v.distancia_km
    FROM reserva r
    JOIN viaje v ON v.id = r.viaje_id
    WHERE r.id = ?
  `).get(req.params.id);
  if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });
  if (reserva.conductor_id !== req.user.id) return res.status(403).json({ error: 'No autorizado' });
  if (reserva.estado !== 'pendiente') return res.status(400).json({ error: 'La reserva no está pendiente' });

  const co2 = reserva.co2_ahorrado_kg || 0;
  const creditos = Math.max(1, Math.floor(co2)); // 1 crédito mínimo, +1 por kg CO₂

  db.prepare(`UPDATE reserva SET estado = 'aceptada' WHERE id = ?`).run(req.params.id);
  // Sumar créditos y CO₂ al pasajero
  db.prepare(`UPDATE usuario SET creditos = creditos + ?, co2_total = co2_total + ? WHERE id = ?`).run(creditos, co2, reserva.pasajero_id);
  // Sumar créditos y CO₂ al conductor
  db.prepare(`UPDATE usuario SET creditos = creditos + ?, co2_total = co2_total + ? WHERE id = ?`).run(creditos, co2, reserva.conductor_id);
  db.prepare(`UPDATE estadisticas SET total_pasajero = total_pasajero + 1, pendientes_pasajero = MAX(0, pendientes_pasajero - 1) WHERE usuario_id = ?`).run(reserva.pasajero_id);
  res.json({ message: 'Pasajero aceptado', creditos_otorgados: creditos, co2_ahorrado: co2 });
});

// POST /api/reservas/:id/rechazar - conductor rechaza un pasajero
router.post('/:id/rechazar', auth, (req, res) => {
  const reserva = db.prepare(`
    SELECT r.*, v.conductor_id FROM reserva r
    JOIN viaje v ON v.id = r.viaje_id
    WHERE r.id = ?
  `).get(req.params.id);
  if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });
  if (reserva.conductor_id !== req.user.id) return res.status(403).json({ error: 'No autorizado' });

  db.prepare(`UPDATE reserva SET estado = 'rechazada' WHERE id = ?`).run(req.params.id);
  db.prepare(`UPDATE viaje SET asientos_disponibles = asientos_disponibles + 1 WHERE id = ?`).run(reserva.viaje_id);
  res.json({ message: 'Pasajero rechazado' });
});

// POST /api/reservas/:id/cancelar
router.post('/:id/cancelar', auth, (req, res) => {
  const reserva = db.prepare(`SELECT * FROM reserva WHERE id = ? AND pasajero_id = ?`).get(req.params.id, req.user.id);
  if (!reserva) return res.status(403).json({ error: 'No autorizado' });
  if (reserva.estado === 'cancelada') return res.status(400).json({ error: 'Ya cancelada' });

  db.prepare(`UPDATE reserva SET estado = 'cancelada' WHERE id = ?`).run(req.params.id);
  db.prepare(`UPDATE viaje SET asientos_disponibles = asientos_disponibles + 1 WHERE id = ?`).run(reserva.viaje_id);
  res.json({ message: 'Reserva cancelada' });
});

module.exports = router;
