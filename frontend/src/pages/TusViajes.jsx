import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import StarRating from '../components/StarRating';
import api from '../api/axios';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const LEON_CENTER = [21.1236, -101.6824];

export default function TusViajes() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const { dark, toggle } = useTheme();

  const viajeId = state?.viajeId;

  const [viaje, setViaje] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loadingViaje, setLoadingViaje] = useState(true);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(true);
  const [accionando, setAccionando] = useState(null); // id de reserva en proceso

  const fetchViaje = async () => {
    if (!viajeId) return;
    try {
      const { data } = await api.get(`/viajes/${viajeId}`);
      setViaje(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingViaje(false);
    }
  };

  const fetchSolicitudes = async () => {
    if (!viajeId) return;
    try {
      const { data } = await api.get(`/viajes/${viajeId}/solicitudes`);
      setSolicitudes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSolicitudes(false);
    }
  };

  useEffect(() => {
    fetchViaje();
    fetchSolicitudes();
  }, [viajeId]);

  const handleAceptar = async (reservaId) => {
    setAccionando(reservaId);
    try {
      await api.post(`/reservas/${reservaId}/aceptar`);
      setSolicitudes(s => s.filter(r => r.id !== reservaId));
    } catch (e) {
      alert(e.response?.data?.error || 'Error al aceptar');
    } finally {
      setAccionando(null);
    }
  };

  const handleRechazar = async (reservaId) => {
    setAccionando(reservaId);
    try {
      await api.post(`/reservas/${reservaId}/rechazar`);
      setSolicitudes(s => s.filter(r => r.id !== reservaId));
    } catch (e) {
      alert(e.response?.data?.error || 'Error al rechazar');
    } finally {
      setAccionando(null);
    }
  };

  if (!viajeId) {
    navigate('/');
    return null;
  }

  const hora = viaje?.fecha_hora_salida?.slice(11, 16) || '—';
  const pasajeros = viaje
    ? `${viaje.asientos_ofrecidos - viaje.asientos_disponibles}/${viaje.asientos_ofrecidos}`
    : '—';

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">

      {/* ── PANEL IZQUIERDO ── */}
      <aside className="w-80 flex-shrink-0 h-full flex flex-col bg-white dark:bg-gray-900 shadow-xl z-[100] overflow-hidden">

        {/* Encabezado */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-[#1a2e5a] dark:text-white">Tus Viajes</h1>
          <div className="flex items-center gap-1">
            <button onClick={toggle} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-base transition">
              {dark ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-[#1a2e5a] dark:hover:text-white transition text-lg"
              title="Volver al inicio"
            >
              ←
            </button>
          </div>
        </div>

        {/* Scrolleable */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

          {/* Tarjeta del viaje */}
          {loadingViaje ? (
            <div className="text-center text-gray-400 py-6 text-sm">Cargando viaje...</div>
          ) : viaje ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-md overflow-hidden">
              {/* Info conductor */}
              <div className="p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-2xl flex-shrink-0">
                    👤
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 dark:text-white text-sm leading-tight">
                      {viaje.conductor_nombre}
                    </p>
                    {viaje.conductor_matricula && (
                      <p className="text-xs text-gray-500">{viaje.conductor_matricula}</p>
                    )}
                    <p className="text-xs text-gray-500">Conductor</p>
                    <div className="flex items-center gap-1 mt-1">
                      <StarRating value={viaje.rating_conductor || 0} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">ISSC</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                      Pasajeros: <span className="font-semibold">{pasajeros}</span>
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      Horario: <span className="font-semibold">{hora}</span>
                    </p>
                  </div>
                </div>

                {/* Ruta */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <span>🚗</span>
                  </div>
                  <div className="flex-1 flex items-center justify-between px-2">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{viaje.origen_nombre}</span>
                    <span className="text-gray-400 mx-1">→</span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{viaje.destino_nombre}</span>
                  </div>
                  <span className="text-gray-400">📍</span>
                </div>
              </div>

              {/* Punto de reunión */}
              {viaje.punto_reunion && (
                <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Punto de reunión:</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{viaje.punto_reunion}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-6 text-sm">Viaje no encontrado</div>
          )}

          {/* Solicitudes de pasajeros */}
          <div className="space-y-3">
            {loadingSolicitudes && (
              <p className="text-xs text-gray-400 text-center py-4">Cargando solicitudes...</p>
            )}
            {!loadingSolicitudes && solicitudes.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 text-center">
                <p className="text-sm text-gray-400 dark:text-gray-500">No hay solicitudes pendientes</p>
              </div>
            )}
            {solicitudes.map(s => (
              <SolicitudCard
                key={s.id}
                solicitud={s}
                costo={viaje?.costo || 0}
                onAceptar={() => handleAceptar(s.id)}
                onRechazar={() => handleRechazar(s.id)}
                loading={accionando === s.id}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* ── MAPA ── */}
      <div className="flex-1 relative isolate">
        <MapContainer center={LEON_CENTER} zoom={13} className="w-full h-full" zoomControl>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          {viaje && (
            <Marker position={LEON_CENTER}>
              <Popup>
                <div className="text-sm space-y-2 min-w-[160px]">
                  <div>
                    <p className="text-xs text-gray-400">Salida</p>
                    <p className="font-semibold">📍 {viaje.origen_nombre}</p>
                    <p className="text-xs text-gray-400">{viaje.fecha_hora_salida?.replace('T', ' – ')?.slice(0, 19)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Llegada</p>
                    <p className="font-semibold">📍 {viaje.destino_nombre}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}

function SolicitudCard({ solicitud, costo, onAceptar, onRechazar, loading }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-md p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xl flex-shrink-0">
          👤
        </div>
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
            Nombre: {solicitud.nombre}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Carrera: {solicitud.carrera || 'ISSC'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Sexo: {solicitud.sexo || 'No especificado'}
          </p>
          {costo > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Precio: <span className="font-semibold text-green-600">${costo}</span>
            </p>
          )}
        </div>
        <button
          onClick={onAceptar}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-full transition flex-shrink-0"
        >
          {loading ? '...' : 'Aceptar'}
        </button>
      </div>
    </div>
  );
}
