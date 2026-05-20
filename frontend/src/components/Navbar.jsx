import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3
      bg-white/90 dark:bg-gray-900/90 backdrop-blur shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-2xl"></span>
        <span className="font-bold text-[#1a2e5a] dark:text-white text-lg">GreenMove</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-lg"
          title="Cambiar tema"
        >
          {dark ? '☀️' : '🌙'}
        </button>

        {usuario && (
          <>
            <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
              {usuario.nombre}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-full transition"
            >
              Salir
            </button>
          </>
        )}
      </div>
    </header>
  );
}
