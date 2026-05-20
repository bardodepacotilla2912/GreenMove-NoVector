const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'greenmove.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS usuario (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    matricula        TEXT    UNIQUE NOT NULL,
    correo           TEXT    UNIQUE NOT NULL,
    nombre           TEXT    NOT NULL,
    password_hash    TEXT    NOT NULL,
    rating_conductor REAL    DEFAULT 0,
    rating_pasajero  REAL    DEFAULT 0,
    fecha_registro   TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS vehiculo (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id       INTEGER NOT NULL REFERENCES usuario(id),
    placas           TEXT    UNIQUE NOT NULL,
    marca            TEXT    NOT NULL,
    modelo           TEXT    NOT NULL,
    capacidad_maxima INTEGER NOT NULL,
    tipo_combustible TEXT    NOT NULL DEFAULT 'gasolina'
  );

  CREATE TABLE IF NOT EXISTS estadisticas (
    usuario_id           INTEGER PRIMARY KEY REFERENCES usuario(id),
    total_conductor      INTEGER DEFAULT 0,
    total_pasajero       INTEGER DEFAULT 0,
    pendientes_conductor INTEGER DEFAULT 0,
    pendientes_pasajero  INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS viaje (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    conductor_id        INTEGER NOT NULL REFERENCES usuario(id),
    vehiculo_id         INTEGER NOT NULL REFERENCES vehiculo(id),
    origen_nombre       TEXT    NOT NULL,
    destino_nombre      TEXT    NOT NULL,
    punto_reunion       TEXT,
    fecha_hora_salida   TEXT    NOT NULL,
    asientos_ofrecidos  INTEGER NOT NULL,
    asientos_disponibles INTEGER NOT NULL,
    costo               REAL    DEFAULT 0,
    estado              TEXT    DEFAULT 'activo',
    distancia_km        REAL    DEFAULT 0,
    co2_ahorrado_kg     REAL    DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS reserva (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    viaje_id      INTEGER NOT NULL REFERENCES viaje(id),
    pasajero_id   INTEGER NOT NULL REFERENCES usuario(id),
    estado        TEXT    DEFAULT 'pendiente',
    fecha_reserva TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS calificacion (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    viaje_id       INTEGER NOT NULL REFERENCES viaje(id),
    calificador_id INTEGER NOT NULL REFERENCES usuario(id),
    calificado_id  INTEGER NOT NULL REFERENCES usuario(id),
    rol_calificado TEXT    NOT NULL,
    estrellas      INTEGER NOT NULL CHECK (estrellas BETWEEN 1 AND 5),
    comentario     TEXT
  );

  CREATE TABLE IF NOT EXISTS codigo_qr (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id        INTEGER NOT NULL REFERENCES usuario(id),
    tipo              TEXT    NOT NULL,
    origen            TEXT,
    estado            TEXT    DEFAULT 'activo',
    codigo_validacion TEXT    UNIQUE NOT NULL,
    fecha_generado    TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS rastreo_gps (
    mongo_id           TEXT    PRIMARY KEY,
    viaje_id           INTEGER NOT NULL REFERENCES viaje(id),
    ruta_gps           TEXT    DEFAULT '[]',
    distancia_recorrida REAL   DEFAULT 0,
    ultima_actualizacion TEXT  DEFAULT (datetime('now'))
  );
`);

// Migraciones seguras
const cols = db.pragma(`table_info(usuario)`).map(c => c.name);
if (!cols.includes('sexo'))     db.exec(`ALTER TABLE usuario ADD COLUMN sexo     TEXT    DEFAULT 'no especificado'`);
if (!cols.includes('carrera'))  db.exec(`ALTER TABLE usuario ADD COLUMN carrera  TEXT    DEFAULT 'ISSC'`);
if (!cols.includes('edad'))     db.exec(`ALTER TABLE usuario ADD COLUMN edad     INTEGER DEFAULT 0`);
if (!cols.includes('semestre')) db.exec(`ALTER TABLE usuario ADD COLUMN semestre TEXT    DEFAULT ''`);
if (!cols.includes('tipo'))     db.exec(`ALTER TABLE usuario ADD COLUMN tipo     TEXT    DEFAULT 'pasajero'`);
if (!cols.includes('creditos')) db.exec(`ALTER TABLE usuario ADD COLUMN creditos INTEGER DEFAULT 0`);
if (!cols.includes('co2_total'))db.exec(`ALTER TABLE usuario ADD COLUMN co2_total REAL  DEFAULT 0`);

module.exports = db;
