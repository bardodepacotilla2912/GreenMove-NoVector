import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import StarRating from '../components/StarRating';
import PublicarViajeModal from '../components/PublicarViajeModal';
import PerfilPanel from '../components/PerfilPanel';
import api from '../api/axios';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const LEON_CENTER = [21.1236, -101.6824];
const TABS = { home: 'home', perfil: 'perfil' };

export default function Home() {
  const { logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const [tab, setTab] = useState(TABS.home);
  const [viajes, setViajes] = useState([]);
  const [misReservas, setMisReservas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [vRes, rRes] = await Promise.all([
        api.get('/viajes'),
        api.get('/reservas/mis-reservas'),
      ]);
      setViajes(vRes.data);
      setMisReservas(rRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleReservar = async (viaje) => {
    try {
      const { data } = await api.post('/reservas', { viaje_id: viaje.id });
      navigate('/viaje-confirmado', { state: { reserva: data } });
    } catch (e) {
      alert(e.response?.data?.error || 'Error al reservar');
    }
  };

  const viajesFiltrados = viajes.filter(v => {
    const q = busqueda.toLowerCase();
    const f = filtro.toLowerCase();
    return (
      (!q || v.origen_nombre.toLowerCase().includes(q) || v.destino_nombre.toLowerCase().includes(q) || v.conductor_nombre?.toLowerCase().includes(q)) &&
      (!f || v.origen_nombre.toLowerCase().includes(f) || v.destino_nombre.toLowerCase().includes(f))
    );
  });

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">

      {/* ── ICON SIDEBAR (60px) ── */}
      <nav className="w-16 flex-shrink-0 h-full flex flex-col items-center py-5 gap-4
        bg-white dark:bg-gray-900 shadow-lg z-30 border-r border-gray-100 dark:border-gray-800">
        {/* Logo */}
        <div className="text-2xl mb-2">🌿</div>

        <IconBtn
          active={tab === TABS.home}
          onClick={() => setTab(TABS.home)}
          title="Inicio"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </IconBtn>

        <IconBtn
          active={tab === TABS.perfil}
          onClick={() => setTab(TABS.perfil)}
          title="Perfil"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </IconBtn>

        <div className="mt-auto flex flex-col items-center gap-3">
          <IconBtn onClick={toggle} title={dark ? 'Modo claro' : 'Modo oscuro'}>
            <span className="text-base">{dark ? '☀️' : '🌙'}</span>
          </IconBtn>

          <IconBtn onClick={() => { logout(); navigate('/login'); }} title="Cerrar sesión">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </IconBtn>
        </div>
      </nav>

      {/* ── CONTENT PANEL (280px) ── */}
      <aside className="w-72 flex-shrink-0 h-full flex flex-col bg-white dark:bg-gray-900 shadow-xl z-20 overflow-hidden">
        {tab === TABS.home ? (
          <ViajesPanel
            viajes={viajesFiltrados}
            misReservas={misReservas}
            loading={loading}
            busqueda={busqueda}
            setBusqueda={setBusqueda}
            onPublicar={() => setShowModal(true)}
            onReservar={handleReservar}
          />
        ) : (
          <PerfilPanel />
        )}
      </aside>

      {/* ── MAPA + BARRA SUPERIOR ── */}
      {/* isolate crea un stacking context propio → contiene los z-index internos de Leaflet */}
      <div className="flex-1 flex flex-col isolate overflow-hidden">
        {/* Barra de búsqueda y filtro (solo en tab home) — parte del flujo flex, NO absolute */}
        {tab === TABS.home && (
          <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3
            bg-white dark:bg-gray-900 shadow-sm z-10">
            <div className="flex-1 flex items-center bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 gap-2">
              <input
                placeholder="Buscando viaje para..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none text-gray-700 dark:text-white placeholder-gray-400"
              />
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 gap-2">
              <input
                placeholder="Filtrar viaje"
                value={filtro}
                onChange={e => setFiltro(e.target.value)}
                className="w-28 bg-transparent text-sm outline-none text-gray-700 dark:text-white placeholder-gray-400"
              />
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 8h10M11 12h2" />
              </svg>
            </div>
          </div>
        )}

        <MapContainer center={LEON_CENTER} zoom={13} className="flex-1 w-full" zoomControl>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          {viajesFiltrados.map(v => (
            <Marker key={v.id} position={LEON_CENTER}>
              <Popup>
                <div className="text-sm min-w-[180px] space-y-2">
                  <div>
                    <p className="text-xs text-gray-400">Salida</p>
                    <p className="font-semibold">📍 {v.origen_nombre}</p>
                    <p className="text-xs text-gray-400">{v.fecha_hora_salida?.replace('T', ' – ')?.slice(0, 19)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Llegada</p>
                    <p className="font-semibold">📍 {v.destino_nombre}</p>
                  </div>
                  {v.co2_ahorrado_kg > 0 && (
                    <p className="text-xs text-green-600">🌱 -{v.co2_ahorrado_kg} kg CO₂ ahorrado</p>
                  )}
                  <button
                    onClick={() => handleReservar(v)}
                    className="w-full bg-[#1a2e5a] text-white text-xs font-semibold py-1.5 rounded-full mt-1"
                  >
                    Unirme
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {showModal && (
        <PublicarViajeModal
          onClose={() => setShowModal(false)}
          onPublicado={() => { setShowModal(false); fetchData(); }}
        />
      )}
    </div>
  );
}

/* ── Botón icono para sidebar ── */
function IconBtn({ children, onClick, active, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition
        ${active
          ? 'bg-[#1a2e5a] text-white shadow-md'
          : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#1a2e5a] dark:hover:text-white'
        }`}
    >
      {children}
    </button>
  );
}

/* ── Panel de viajes ── */
function ViajesPanel({ viajes, misReservas, loading, busqueda, setBusqueda, onPublicar, onReservar }) {
  return (
    <>
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={onPublicar}
          className="w-full bg-[#1a2e5a] hover:bg-[#243d7a] text-white text-sm font-semibold py-2.5 rounded-full transition flex items-center justify-center gap-2"
        >
          <span className="text-lg leading-none">+</span> Publicar viaje
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 mt-3">
        {/* Tus viajes */}
        <section>
          <h2 className="text-base font-bold text-gray-800 dark:text-white mb-2">Tus viajes</h2>
          {!loading && misReservas.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-3">No has reservado ningún viaje</p>
          )}
          <div className="space-y-2">
            {misReservas.map(r => (
              <TarjetaViaje
                key={r.id}
                origen={r.origen_nombre}
                destino={r.destino_nombre}
                conductor={r.conductor_nombre}
                matricula={r.conductor_matricula || '—'}
                rating={r.rating_conductor || 0}
                personas={`${(r.asientos_ofrecidos || 4) - (r.asientos_disponibles || 0)}/${r.asientos_ofrecidos || 4}`}
                boton={<span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">Unido</span>}
              />
            ))}
          </div>
        </section>

        {/* Viajes publicados */}
        <section>
          <h2 className="text-base font-bold text-gray-800 dark:text-white mb-2">Viajes Publicados</h2>
          {loading && <p className="text-xs text-gray-400">Cargando...</p>}
          {!loading && viajes.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-3">No hay viajes disponibles</p>
          )}
          <div className="space-y-2">
            {viajes.map(v => (
              <TarjetaViaje
                key={v.id}
                origen={v.origen_nombre}
                destino={v.destino_nombre}
                conductor={v.conductor_nombre}
                matricula={v.conductor_matricula || '—'}
                rating={v.rating_conductor || 0}
                personas={`${v.asientos_ofrecidos - v.asientos_disponibles}/${v.asientos_ofrecidos}`}
                co2={v.co2_ahorrado_kg}
                boton={
                  <button
                    onClick={e => { e.stopPropagation(); onReservar(v); }}
                    className="bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold px-3 py-1 rounded-full transition"
                  >
                    Unirme
                  </button>
                }
              />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function TarjetaViaje({ origen, destino, conductor, matricula, rating, personas, co2, boton }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 space-y-2 hover:shadow-md transition">
      <div className="flex items-center gap-2 text-xs font-bold text-[#1a2e5a] dark:text-white bg-blue-50 dark:bg-gray-700 rounded-lg px-2 py-1">
        <span className="truncate">{origen}</span>
        <span className="text-gray-400 flex-shrink-0">→</span>
        <span className="truncate">{destino}</span>
      </div>
      <div className="flex items-start gap-2">
        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-base flex-shrink-0">👤</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-800 dark:text-white">Conductor</p>
          <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{conductor}</p>
          <p className="text-xs text-gray-400">Matrícula: {matricula}</p>
          <p className="text-xs text-gray-400">Carrera: ISSC</p>
          <div className="flex items-center gap-1 mt-0.5">
            <StarRating value={rating} />
            <span className="text-xs text-gray-500">{rating.toFixed(1)}/5</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Personas: <span className="font-semibold text-gray-700 dark:text-gray-300">{personas}</span></span>
          {co2 > 0 && <p className="text-xs text-green-600">🌱 -{co2} kg CO₂</p>}
        </div>
        {boton}
      </div>
    </div>
  );
}
