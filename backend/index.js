require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectMongo } = require('./mongo');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/viajes',    require('./routes/viajes'));
app.use('/api/reservas',  require('./routes/reservas'));
app.use('/api/vehiculos', require('./routes/vehiculos'));
app.use('/api/usuarios',  require('./routes/usuarios'));
app.use('/api/rastreo',   require('./routes/rastreo'));

app.get('/api/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
connectMongo().then(() => {
  app.listen(PORT, () => console.log(`GreenMove backend corriendo en http://localhost:${PORT}`));
});
