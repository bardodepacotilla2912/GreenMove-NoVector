const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

// GET /api/usuarios/perfil
router.get('/perfil', auth, (req, res) => {
  const user = db.prepare(`
    SELECT id, matricula, correo, nombre, carrera, edad, sexo, semestre, tipo,
           creditos, co2_total, rating_conductor, rating_pasajero, fecha_registro
    FROM usuario WHERE id = ?
  `).get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const stats = db.prepare(`SELECT * FROM estadisticas WHERE usuario_id = ?`).get(req.user.id);
  const vehiculos = db.prepare(`SELECT * FROM vehiculo WHERE usuario_id = ?`).all(req.user.id);

  res.json({ ...user, estadisticas: stats || {}, vehiculos });
});

// PUT /api/usuarios/perfil - actualizar datos del perfil
router.put('/perfil', auth, (req, res) => {
  const { nombre, carrera, edad, sexo, semestre, tipo } = req.body;
  db.prepare(`
    UPDATE usuario SET nombre=?, carrera=?, edad=?, sexo=?, semestre=?, tipo=? WHERE id=?
  `).run(nombre, carrera, edad, sexo, semestre, tipo, req.user.id);

  const user = db.prepare(`
    SELECT id, matricula, correo, nombre, carrera, edad, sexo, semestre, tipo,
           creditos, co2_total, rating_conductor, rating_pasajero FROM usuario WHERE id = ?
  `).get(req.user.id);
  res.json(user);
});

// GET /api/usuarios/:id/perfil-publico
router.get('/:id/perfil-publico', auth, (req, res) => {
  const user = db.prepare(`
    SELECT id, nombre, carrera, rating_conductor, rating_pasajero, co2_total
    FROM usuario WHERE id = ?
  `).get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(user);
});

module.exports = router;
