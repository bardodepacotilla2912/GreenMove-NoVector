import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const CARRERAS = [
  'Ing. en Software y Sistemas Computacionales',
  'Ing. en Mecatrónica',
  'Ing. Industrial y de Sistemas',
  'Ing. Civil',
  'Arquitectura',
  'Administración de Empresas',
  'Contaduría',
  'Derecho',
  'Medicina',
  'Psicología',
  'Otra',
];

const SEMESTRES = ['1er Semestre','2do Semestre','3er Semestre','4to Semestre','5to Semestre',
  '6to Semestre','7mo Semestre','8vo Semestre','9no Semestre','10mo Semestre'];

export default function Login() {
  const { login, register } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const [modo, setModo] = useState('login');
  const [step, setStep] = useState(1); // 2 pasos en registro
  const [form, setForm] = useState({
    correo: '', password: '', nombre: '', matricula: '',
    carrera: '', edad: '', sexo: '', semestre: '', tipo: 'pasajero',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const validarStep1 = () => {
    if (!form.nombre || !form.matricula || !form.correo || !form.password) return 'Completa todos los campos';
    if (!form.correo.endsWith('@lasallebajio.edu.mx')) return 'El correo debe ser @lasallebajio.edu.mx';
    if (form.matricula.length !== 8) return 'La matrícula debe tener 8 caracteres';
    return null;
  };

  const handleNext = () => {
    const err = validarStep1();
    if (err) { setError(err); return; }
    setError('');
    setStep(2);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (modo === 'login') {
        await login(form.correo, form.password);
      } else {
        await register(form);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const resetModo = (m) => { setModo(m); setError(''); setStep(1); };

  return (
    <div
      className="min-h-screen relative flex items-center justify-center"
      style={{ backgroundImage: 'url(/lasalle-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-black/50" />

      {/* toggle tema */}
      <button
        onClick={toggle}
        className="absolute top-4 right-4 z-20 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition"
      >
        {dark ? '☀️' : '🌙'}
      </button>

      <div className="relative z-10 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl px-8 py-7 w-full max-w-md mx-4">
        {/* Logo + nombre app */}
        <div className="flex flex-col items-center mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-3xl">🌿</span>
            <span className="text-2xl font-extrabold text-[#1a2e5a] dark:text-white">GreenMove</span>
          </div>
          <p className="text-xs text-gray-400">Movilidad Sustentable · La Salle Bajío</p>
        </div>

        <h2 className="text-center text-xl font-bold text-[#1a2e5a] dark:text-white mb-5">
          {modo === 'login' ? 'Iniciar Sesión' : step === 1 ? 'Crear Cuenta (1/2)' : 'Crear Cuenta (2/2)'}
        </h2>

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 rounded-lg px-3 py-2 text-center">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {modo === 'login' ? (
            <>
              <Field name="correo" type="email" placeholder="correo@lasallebajio.edu.mx" value={form.correo} onChange={handleChange} icon="👤" />
              <Field name="password" type="password" placeholder="Contraseña" value={form.password} onChange={handleChange} isPassword />
              <button type="submit" disabled={loading}
                className="w-full bg-[#1a2e5a] hover:bg-[#243d7a] disabled:opacity-60 text-white font-semibold py-3 rounded-full transition mt-2">
                {loading ? 'Cargando...' : 'Iniciar sesión'}
              </button>
            </>
          ) : step === 1 ? (
            <>
              <Field name="nombre" placeholder="Nombre completo" value={form.nombre} onChange={handleChange} icon="👤" />
              <Field name="matricula" placeholder="Matrícula (8 caracteres)" value={form.matricula} onChange={handleChange} icon="🎓" maxLength={8} />
              <Field name="correo" type="email" placeholder="correo@lasallebajio.edu.mx" value={form.correo} onChange={handleChange} icon="✉️" />
              <Field name="password" type="password" placeholder="Contraseña" value={form.password} onChange={handleChange} isPassword />
              <button type="button" onClick={handleNext}
                className="w-full bg-[#1a2e5a] hover:bg-[#243d7a] text-white font-semibold py-3 rounded-full transition mt-2">
                Siguiente →
              </button>
            </>
          ) : (
            <>
              {/* Carrera */}
              <div>
                <select name="carrera" value={form.carrera} onChange={handleChange}
                  className="w-full bg-gray-100 dark:bg-gray-800 dark:text-white rounded-full px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a2e5a]">
                  <option value="">Carrera</option>
                  {CARRERAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field name="edad" type="number" placeholder="Edad" value={form.edad} onChange={handleChange} min="16" max="80" />
                <select name="sexo" value={form.sexo} onChange={handleChange}
                  className="bg-gray-100 dark:bg-gray-800 dark:text-white rounded-full px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a2e5a]">
                  <option value="">Sexo</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <select name="semestre" value={form.semestre} onChange={handleChange}
                className="w-full bg-gray-100 dark:bg-gray-800 dark:text-white rounded-full px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a2e5a]">
                <option value="">Semestre</option>
                {SEMESTRES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 pl-2">Rol en la app</p>
                <div className="flex gap-2">
                  {['pasajero','conductor','ambos'].map(t => (
                    <button key={t} type="button"
                      onClick={() => setForm(f => ({ ...f, tipo: t }))}
                      className={`flex-1 py-2 rounded-full text-xs font-semibold border transition
                        ${form.tipo === t
                          ? 'bg-[#1a2e5a] text-white border-[#1a2e5a]'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                        }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold py-3 rounded-full transition hover:bg-gray-50 dark:hover:bg-gray-800">
                  ← Atrás
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-[#1a2e5a] hover:bg-[#243d7a] disabled:opacity-60 text-white font-semibold py-3 rounded-full transition">
                  {loading ? '...' : 'Registrarse'}
                </button>
              </div>
            </>
          )}
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          {modo === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button onClick={() => resetModo(modo === 'login' ? 'register' : 'login')}
            className="text-[#1a2e5a] dark:text-blue-400 font-semibold hover:underline">
            {modo === 'login' ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </div>
  );
}

function Field({ name, type = 'text', placeholder, value, onChange, icon, isPassword, ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        name={name}
        type={isPassword ? (show ? 'text' : 'password') : type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...rest}
        className="w-full bg-gray-100 dark:bg-gray-800 dark:text-white rounded-full px-5 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-[#1a2e5a] transition"
      />
      {(icon || isPassword) && (
        <span
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer select-none"
          onClick={() => isPassword && setShow(s => !s)}
        >
          {isPassword ? (show ? '🙈' : '👁️') : icon}
        </span>
      )}
    </div>
  );
}
