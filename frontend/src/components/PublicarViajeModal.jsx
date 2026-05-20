import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function PublicarViajeModal({ onClose, onPublicado }) {
  const navigate = useNavigate();
  const [vehiculos, setVehiculos] = useState([]);
  const [form, setForm] = useState({
    vehiculo_id: '',
    origen_nombre: '',
    destino_nombre: '',
    punto_reunion: '',
    fecha: '',
    hora: '',
    asientos_ofrecidos: '',
    costo: '',
    distancia_km: ''
  });
  const [showAddVeh, setShowAddVeh] = useState(false);
  const [vehForm, setVehForm] = useState({ placas: '', marca: '', modelo: '', capacidad_maxima: '', tipo_combustible: 'gasolina' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/vehiculos/mis-vehiculos').then(r => setVehiculos(r.data)).catch(() => {});
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleVehChange = e => setVehForm({ ...vehForm, [e.target.name]: e.target.value });

  const guardarVehiculo = async () => {
    try {
      await api.post('/vehiculos', vehForm);
      const { data } = await api.get('/vehiculos/mis-vehiculos');
      setVehiculos(data);
      setShowAddVeh(false);
    } catch (e) {
      alert(e.response?.data?.error || 'Error al guardar vehículo');
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.vehiculo_id) { setError('Selecciona un vehículo'); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        fecha_hora_salida: `${form.fecha}T${form.hora}`,
        asientos_ofrecidos: Number(form.asientos_ofrecidos),
        costo: Number(form.costo),
        distancia_km: Number(form.distancia_km)
      };
      const { data } = await api.post('/viajes', payload);
      onPublicado();
      navigate('/tus-viajes', { state: { viajeId: data.id } });
    } catch (e) {
      setError(e.response?.data?.error || 'Error al publicar viaje');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 pb-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl"
          >
            ×
          </button>
          <h2 className="text-2xl font-bold text-[#1a2e5a] dark:text-white text-center">Publicar Viaje</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/30 rounded-lg px-3 py-2 text-center">{error}</p>
          )}

          {/* Vehículo */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Vehículo</label>
            <div className="flex gap-2">
              <select
                name="vehiculo_id"
                value={form.vehiculo_id}
                onChange={handleChange}
                className="flex-1 bg-gray-100 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a2e5a]"
              >
                <option value="">Selecciona un vehículo</option>
                {vehiculos.map(v => (
                  <option key={v.id} value={v.id}>{v.marca} {v.modelo} – {v.placas}</option>
                ))}
              </select>
              <button type="button" onClick={() => setShowAddVeh(s => !s)}
                className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl px-3 py-3 text-lg transition">
                +
              </button>
            </div>
          </div>

          {showAddVeh && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase">Nuevo vehículo</p>
              {[['placas', 'Placas'], ['marca', 'Marca'], ['modelo', 'Modelo'], ['capacidad_maxima', 'Cap. máxima']].map(([n, p]) => (
                <input key={n} name={n} placeholder={p} value={vehForm[n]} onChange={handleVehChange}
                  className="w-full bg-white dark:bg-gray-700 dark:text-white rounded-xl px-4 py-2 text-sm outline-none" />
              ))}
              <select name="tipo_combustible" value={vehForm.tipo_combustible} onChange={handleVehChange}
                className="w-full bg-white dark:bg-gray-700 dark:text-white rounded-xl px-4 py-2 text-sm outline-none">
                <option value="gasolina">Gasolina</option>
                <option value="diesel">Diésel</option>
                <option value="electrico">Eléctrico</option>
                <option value="hibrido">Híbrido</option>
              </select>
              <button type="button" onClick={guardarVehiculo}
                className="w-full bg-[#1a2e5a] text-white text-sm font-semibold py-2 rounded-xl">
                Guardar vehículo
              </button>
            </div>
          )}

          {/* Grid de campos */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Salida" name="origen_nombre" placeholder="León, GTO" value={form.origen_nombre} onChange={handleChange} full />
            <Field label="Horario – Fecha" name="fecha" type="date" value={form.fecha} onChange={handleChange} />
            <Field label="Hora" name="hora" type="time" value={form.hora} onChange={handleChange} />
            <Field label="Destino" name="destino_nombre" placeholder="Silao, GTO" value={form.destino_nombre} onChange={handleChange} full />
            <Field label="Pasajeros Máx." name="asientos_ofrecidos" type="number" min="1" placeholder="4" value={form.asientos_ofrecidos} onChange={handleChange} />
            <Field label="Costo ($)" name="costo" type="number" min="0" placeholder="0" value={form.costo} onChange={handleChange} />
            <Field label="Placas del vehículo" name="distancia_km" type="number" min="0" placeholder="Distancia km" value={form.distancia_km} onChange={handleChange} />
          </div>

          <Field label="Punto de reunión" name="punto_reunion" placeholder="Ej: Avenida Universidad 407-301" value={form.punto_reunion} onChange={handleChange} full />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1a2e5a] hover:bg-[#243d7a] disabled:opacity-60 text-white font-bold py-3 rounded-full transition text-sm"
          >
            {loading ? 'Publicando...' : 'Publicar'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, type = 'text', placeholder, value, onChange, full, ...rest }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase block mb-1">{label}</label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...rest}
        className="w-full bg-gray-100 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1a2e5a]"
      />
    </div>
  );
}
