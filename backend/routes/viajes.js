const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

// GET /api/viajes - listar viajes activos (excluye los propios)
router.get('/', auth, (req, res) => {
  const viajes = db.prepare(`
    SELECT v.*, u.nombre AS conductor_nombre, u.matricula AS conductor_matricula,
           u.carrera AS conductor_carrera, u.rating_conductor,
           veh.placas, veh.marca, veh.modelo
    FROM viaje v
    JOIN usuario u ON u.id = v.conductor_id
    JOIN vehiculo veh ON veh.id = v.vehiculo_id
    WHERE v.estado = 'activo' AND v.asientos_disponibles > 0
      AND v.conductor_id != ?
    ORDER BY v.fecha_hora_salida ASC
  `).all(req.user.id);
  res.json(viajes);
});

// GET /api/viajes/mis-viajes - viajes del conductor autenticado
router.get('/mis-viajes', auth, (req, res) => {
  const viajes = db.prepare(`
    SELECT v.*, veh.placas, veh.marca, veh.modelo
    FROM viaje v
    JOIN vehiculo veh ON veh.id = v.vehiculo_id
    WHERE v.conductor_id = ?
    ORDER BY v.fecha_hora_salida DESC
  `).all(req.user.id);
  res.json(viajes);
});

// GET /api/viajes/:id
router.get('/:id', auth, (req, res) => {
  const viaje = db.prepare(`
    SELECT v.*, u.nombre AS conductor_nombre, u.matricula AS conductor_matricula,
           u.rating_conductor, veh.placas, veh.marca, veh.modelo
    FROM viaje v
    JOIN usuario u ON u.id = v.conductor_id
    JOIN vehiculo veh ON veh.id = v.vehiculo_id
    WHERE v.id = ?
  `).get(req.params.id);
  if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado' });
  res.json(viaje);
});

// GET /api/viajes/:id/solicitudes - pasajeros pendientes (solo conductor)
router.get('/:id/solicitudes', auth, (req, res) => {
  const viaje = db.prepare(`SELECT conductor_id FROM viaje WHERE id = ?`).get(req.params.id);
  if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado' });
  if (viaje.conductor_id !== req.user.id) return res.status(403).json({ error: 'No autorizado' });

  const solicitudes = db.prepare(`
    SELECT r.id, r.estado, r.fecha_reserva,
           u.id AS pasajero_id, u.nombre, u.matricula, u.carrera, u.sexo,
           u.rating_pasajero
    FROM reserva r
    JOIN usuario u ON u.id = r.pasajero_id
    WHERE r.viaje_id = ? AND r.estado = 'pendiente'
    ORDER BY r.fecha_reserva ASC
  `).all(req.params.id);
  res.json(solicitudes);
});

// POST /api/viajes - publicar viaje
router.post('/', auth, (req, res) => {
  const {
    vehiculo_id, origen_nombre, destino_nombre, punto_reunion,
    fecha_hora_salida, asientos_ofrecidos, costo, distancia_km
  } = req.body;

  if (!vehiculo_id || !origen_nombre || !destino_nombre || !fecha_hora_salida || !asientos_ofrecidos)
    return res.status(400).json({ error: 'Faltan campos requeridos' });

  const co2 = distancia_km ? +(distancia_km * 0.21).toFixed(2) : 0;

  const result = db.prepare(`
    INSERT INTO viaje (conductor_id, vehiculo_id, origen_nombre, destino_nombre, punto_reunion,
      fecha_hora_salida, asientos_ofrecidos, asientos_disponibles, costo, distancia_km, co2_ahorrado_kg)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id, vehiculo_id, origen_nombre, destino_nombre, punto_reunion || '',
    fecha_hora_salida, asientos_ofrecidos, asientos_ofrecidos, costo || 0, distancia_km || 0, co2
  );

  db.prepare(`UPDATE estadisticas SET pendientes_conductor = pendientes_conductor + 1 WHERE usuario_id = ?`).run(req.user.id);
  res.json({ id: result.lastInsertRowid, message: 'Viaje publicado' });
});

// POST /api/viajes/:id/cancelar
router.post('/:id/cancelar', auth, (req, res) => {
  const viaje = db.prepare(`SELECT * FROM viaje WHERE id = ? AND conductor_id = ?`).get(req.params.id, req.user.id);
  if (!viaje) return res.status(403).json({ error: 'No autorizado' });
  db.prepare(`UPDATE viaje SET estado = 'cancelado' WHERE id = ?`).run(req.params.id);
  res.json({ message: 'Viaje cancelado' });
});

module.exports = router;
