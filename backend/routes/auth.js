const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const DOMINIO = '@lasallebajio.edu.mx';

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { matricula, correo, nombre, password, carrera, edad, sexo, semestre, tipo } = req.body;

  if (!matricula || !correo || !nombre || !password)
    return res.status(400).json({ error: 'Todos los campos son requeridos' });

  if (!correo.endsWith(DOMINIO))
    return res.status(400).json({ error: `El correo debe ser institucional (${DOMINIO})` });

  if (matricula.length !== 8)
    return res.status(400).json({ error: 'La matrícula debe tener exactamente 8 caracteres' });

  const hash = bcrypt.hashSync(password, 10);
  try {
    const stmt = db.prepare(`
      INSERT INTO usuario (matricula, correo, nombre, password_hash, carrera, edad, sexo, semestre, tipo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      matricula, correo, nombre, hash,
      carrera || 'ISSC',
      edad || 0,
      sexo || 'no especificado',
      semestre || '',
      tipo || 'pasajero'
    );
    db.prepare(`INSERT INTO estadisticas (usuario_id) VALUES (?)`).run(result.lastInsertRowid);

    const token = jwt.sign({ id: result.lastInsertRowid }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const user = db.prepare(`SELECT id, matricula, correo, nombre, carrera, edad, sexo, semestre, tipo, creditos, co2_total, rating_conductor, rating_pasajero FROM usuario WHERE id = ?`).get(result.lastInsertRowid);
    res.json({ token, usuario: user });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Matrícula o correo ya registrado' });
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { correo, password } = req.body;
  const user = db.prepare(`SELECT * FROM usuario WHERE correo = ?`).get(correo);
  if (!user) return res.status(401).json({ error: 'Credenciales incorrectas' });

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas' });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  const { password_hash, ...userData } = user;
  res.json({ token, usuario: userData });
});

module.exports = router;
