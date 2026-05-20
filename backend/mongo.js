const mongoose = require('mongoose');

const RastreoSchema = new mongoose.Schema({
  viaje_id:            { type: Number, required: true, index: true },
  ruta_gps:            { type: [[Number]], default: [] }, // [[lat, lng], ...]
  distancia_recorrida: { type: Number, default: 0 },
  ultima_actualizacion:{ type: Date,   default: Date.now }
});

const Rastreo = mongoose.model('Rastreo', RastreoSchema);

async function connectMongo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB conectado');
  } catch (e) {
    console.warn('MongoDB no disponible, rastreo GPS desactivado:', e.message);
  }
}

module.exports = { connectMongo, Rastreo };
