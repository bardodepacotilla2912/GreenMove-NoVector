import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const LEON_CENTER = [21.1236, -101.6824];

export default function ViajeConfirmado() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const { logout } = useAuth();
  const reserva = state?.reserva;

  if (!reserva) {
    navigate('/');
    return null;
  }

  const pasajeros = (reserva.asientos_ofrecidos || 0) - (reserva.asientos_disponibles || 0);
  const hora = reserva.fecha_hora_salida?.slice(11, 16) || '—';

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">

      {/* ── ICON SIDEBAR ── */}
      <nav className="w-16 flex-shrink-0 h-full flex flex-col items-center py-5 gap-4
        bg-white dark:bg-gray-900 shadow-lg z-[100] border-r border-gray-100 dark:border-gray-800">
        <div className="text-2xl mb-2">🌿</div>
        <button onClick={() => navigate('/')} title="Inicio"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#1a2e5a] dark:hover:text-white transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>
        <div className="mt-auto flex flex-col items-center gap-3">
          <button onClick={toggle} className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-base">
            {dark ? '☀️' : '🌙'}
          </button>
          <button onClick={() => { logout(); navigate('/login'); }} title="Salir"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-500 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </nav>

      {/* ── PANEL IZQUIERDO ── */}
      <aside className="w-80 flex-shrink-0 h-full flex flex-col bg-white dark:bg-gray-900 shadow-xl z-[100] overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          <h1 className="text-2xl font-extrabold text-[#1a2e5a] dark:text-white">¡Viaje Confirmado!</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Info conductor */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-md p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-2xl flex-shrink-0">👤</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 dark:text-white text-sm truncate">{reserva.conductor_nombre}</p>
                {reserva.conductor_matricula && <p className="text-xs text-gray-500">{reserva.conductor_matricula}</p>}
                <p className="text-xs text-gray-500 dark:text-gray-400">Conductor</p>
                <StarRating value={reserva.rating_conductor || 0} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Row icon="👥" label="Pasajeros" value={`${pasajeros}/${reserva.asientos_ofrecidos}`} />
              <Row icon="🕐" label="Horario" value={hora} />
              <Row icon="🚗" label="Vehículo" value={`${reserva.marca || ''} ${reserva.placas || ''}`} />
            </div>

            {/* Ruta */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">A</span>
                <span className="text-gray-700 dark:text-gray-300 text-xs truncate">{reserva.origen_nombre}</span>
              </div>
              <div className="ml-2.5 border-l-2 border-dashed border-gray-300 dark:border-gray-600 h-3" />
              <div className="flex items-center gap-2 text-sm">
                <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">B</span>
                <span className="text-gray-700 dark:text-gray-300 text-xs truncate">{reserva.destino_nombre}</span>
              </div>
            </div>

            {/* Punto de reunión */}
            {reserva.punto_reunion && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl px-3 py-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Punto de reunión</p>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{reserva.punto_reunion}</p>
              </div>
            )}

            {/* Costo */}
            {reserva.costo > 0 && (
              <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 rounded-xl px-3 py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Costo del viaje</span>
                <span className="font-bold text-green-600 text-lg">${reserva.costo}</span>
              </div>
            )}

            {/* CO₂ */}
            {reserva.co2_ahorrado_kg > 0 && (
              <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-3 py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">🌱 CO₂ ahorrado</span>
                <span className="font-bold text-emerald-600">{reserva.co2_ahorrado_kg} kg</span>
              </div>
            )}

            <button
              onClick={() => navigate('/')}
              className="w-full bg-[#1a2e5a] hover:bg-[#243d7a] text-white font-bold py-3 rounded-full transition text-sm"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAPA ── */}
      <div className="flex-1 isolate">
        <MapContainer center={LEON_CENTER} zoom={12} className="w-full h-full" zoomControl>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          <Marker position={LEON_CENTER}>
            <Popup>
              <div className="text-sm space-y-1">
                <p className="font-semibold">📍 {reserva.origen_nombre}</p>
                <p className="text-gray-500">→ {reserva.destino_nombre}</p>
                <p className="text-gray-400 text-xs">{hora}</p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}

function Row({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500 dark:text-gray-400">{icon} {label}</span>
      <span className="font-semibold text-gray-800 dark:text-white">{value}</span>
    </div>
  );
}
