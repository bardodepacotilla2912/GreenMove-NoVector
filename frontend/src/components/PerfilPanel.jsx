import { useEffect, useState } from 'react';
import api from '../api/axios';
import StarRating from './StarRating';

export default function PerfilPanel() {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({});

  const fetchPerfil = async () => {
    try {
      const { data } = await api.get('/usuarios/perfil');
      setPerfil(data);
      setForm({
        nombre: data.nombre || '',
        carrera: data.carrera || '',
        edad: data.edad || '',
        sexo: data.sexo || '',
        semestre: data.semestre || '',
        tipo: data.tipo || 'pasajero',
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPerfil(); }, []);

  const handleGuardar = async () => {
    try {
      await api.put('/usuarios/perfil', form);
      await fetchPerfil();
      setEditando(false);
    } catch (e) {
      alert(e.response?.data?.error || 'Error al guardar');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-gray-400">Cargando perfil...</p>
      </div>
    );
  }

  const vehiculoPrincipal = perfil?.vehiculos?.[0];
  const rating = perfil?.tipo === 'conductor'
    ? perfil.rating_conductor
    : perfil.rating_pasajero;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[#1a2e5a] dark:text-white">Perfil</h1>
        <button
          onClick={() => setEditando(e => !e)}
          className="text-xs text-[#1a2e5a] dark:text-blue-400 hover:underline font-semibold"
        >
          {editando ? 'Cancelar' : 'Editar'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Avatar + datos */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-md p-5 space-y-4">
          {/* Avatar */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-4xl">
              👤
            </div>
          </div>

          {editando ? (
            <div className="space-y-3">
              <EditField label="Nombre" value={form.nombre} onChange={v => setForm(f => ({ ...f, nombre: v }))} />
              <EditField label="Carrera" value={form.carrera} onChange={v => setForm(f => ({ ...f, carrera: v }))} />
              <EditField label="Edad" type="number" value={form.edad} onChange={v => setForm(f => ({ ...f, edad: v }))} />
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Sexo</label>
                <select
                  value={form.sexo}
                  onChange={e => setForm(f => ({ ...f, sexo: e.target.value }))}
                  className="w-full mt-1 bg-gray-100 dark:bg-gray-700 dark:text-white rounded-xl px-3 py-2 text-sm outline-none"
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                  <option value="no especificado">Prefiero no decir</option>
                </select>
              </div>
              <EditField label="Semestre" value={form.semestre} onChange={v => setForm(f => ({ ...f, semestre: v }))} placeholder="Ej: 4to Semestre" />
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                  className="w-full mt-1 bg-gray-100 dark:bg-gray-700 dark:text-white rounded-xl px-3 py-2 text-sm outline-none"
                >
                  <option value="conductor">Conductor</option>
                  <option value="pasajero">Pasajero</option>
                  <option value="ambos">Ambos</option>
                </select>
              </div>
              <button
                onClick={handleGuardar}
                className="w-full bg-[#1a2e5a] hover:bg-[#243d7a] text-white text-sm font-semibold py-2.5 rounded-full transition"
              >
                Guardar cambios
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <DataRow label="Nombre" value={perfil.nombre} />
              <DataRow label="Matrícula" value={perfil.matricula} />
              <DataRow label="Carrera" value={perfil.carrera || '—'} />
              <DataRow label="Edad" value={perfil.edad ? `${perfil.edad} años` : '—'} />
              <DataRow label="Sexo" value={perfil.sexo || '—'} />
              <DataRow label="Semestre" value={perfil.semestre || '—'} />
              <DataRow label="Tipo" value={capitalize(perfil.tipo) || '—'} />

              {/* Calificación */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Calificación</span>
                <div className="flex items-center gap-1">
                  <StarRating value={rating || 0} />
                  <span className="text-sm text-gray-600 dark:text-gray-300">{(rating || 0).toFixed(1)} / 5</span>
                </div>
              </div>

              {/* Vehículo */}
              {vehiculoPrincipal && (
                <>
                  <DataRow label="Auto" value={`${vehiculoPrincipal.marca} ${vehiculoPrincipal.modelo}`} />
                  <DataRow label="Capacidad" value={`${vehiculoPrincipal.capacidad_maxima} Personas`} />
                  <DataRow label="Placas" value={vehiculoPrincipal.placas} />
                </>
              )}

              {/* Créditos y CO₂ */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700 space-y-2">
                <div className="flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/20 rounded-xl px-3 py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">🏆 Créditos universitarios</span>
                  <span className="font-bold text-yellow-600 text-base">{perfil.creditos || 0}</span>
                </div>
                <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 rounded-xl px-3 py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">🌱 CO₂ ahorrado</span>
                  <span className="font-bold text-green-600 text-base">{(perfil.co2_total || 0).toFixed(2)} kg</span>
                </div>
              </div>

              {/* Stats */}
              {perfil.estadisticas && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <StatBox label="Viajes conductor" value={perfil.estadisticas.total_conductor || 0} />
                  <StatBox label="Viajes pasajero" value={perfil.estadisticas.total_pasajero || 0} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DataRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 flex-shrink-0">{label}:</span>
      <span className="text-sm text-gray-800 dark:text-white text-right">{value}</span>
    </div>
  );
}

function EditField({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full mt-1 bg-gray-100 dark:bg-gray-700 dark:text-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1a2e5a]"
      />
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl px-3 py-2 text-center">
      <p className="text-xl font-bold text-[#1a2e5a] dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
