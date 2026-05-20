# GreenMove - Movilidad Sustentable ULS Bajío

Plataforma de carpooling universitario para la comunidad de Universidad La Salle Bajío. Permite a estudiantes compartir viajes, reducir emisiones de CO₂ y acumular créditos universitarios.

## Tecnologías

- **Frontend**: React 18 + Vite, Tailwind CSS v4, React Router DOM v6, Leaflet (OpenStreetMap)
- **Backend**: Node.js + Express 5 (CommonJS)
- **Base de datos**: SQLite (better-sqlite3) para datos transaccionales
- **GPS / Rastreo**: MongoDB Atlas (Mongoose)
- **Autenticación**: JWT (7 días), bcryptjs

## Repositorio

```
https://github.com/bardodepacotilla2912/GreenMove-NoVector.git
```

---

## Estructura del Proyecto

```
greenMove/
├── backend/
│   ├── index.js          # Punto de entrada Express
│   ├── database.js       # Esquema SQLite + migraciones
│   ├── mongo.js          # Conexión y modelo MongoDB
│   ├── .env              # Variables de entorno (no subir a producción)
│   └── routes/
│       ├── auth.js       # Registro y login JWT
│       ├── viajes.js     # CRUD de viajes
│       ├── reservas.js   # Reservas + créditos CO₂
│       ├── vehiculos.js  # Vehículos del usuario
│       ├── usuarios.js   # Perfil y estadísticas
│       └── rastreo.js    # GPS en tiempo real
└── frontend/
    ├── vite.config.js    # Proxy /api → localhost:3001
    └── src/
        ├── App.jsx
        ├── pages/
        │   ├── Login.jsx           # Registro 2 pasos + login
        │   ├── Home.jsx            # Mapa + lista de viajes
        │   ├── TusViajes.jsx       # Vista conductor
        │   └── ViajeConfirmado.jsx # Confirmación de reserva
        └── components/
            ├── Navbar.jsx
            ├── PerfilPanel.jsx
            ├── PublicarViajeModal.jsx
            └── StarRating.jsx
```

---

## Requisitos Previos

- Node.js >= 18
- npm >= 9
- Cuenta en MongoDB Atlas (ya configurada en `.env`)

> **Red universitaria**: Si npm no puede conectar, configura el mirror:
> ```bash
> npm config set registry https://registry.npmmirror.com
> ```

---

## Instalación y Ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/bardodepacotilla2912/GreenMove-NoVector.git
cd GreenMove-NoVector
```

### 2. Configurar el Backend

```bash
cd backend
npm install
```

Crea el archivo `.env` en `backend/` con:

```env
PORT=3001
JWT_SECRET=greenmove_lasalle_secret_2024
MONGODB_URI=mongodb+srv://ferchoperezlopez10_db_user:TAF4mavBNhu3UjAO@greenmovedb.frxqmcb.mongodb.net/greenmove?retryWrites=true&w=majority
```

Inicia el servidor:

```bash
node index.js
```

El backend queda disponible en `http://localhost:3001`.

### 3. Configurar el Frontend

```bash
cd ../frontend
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

### 4. Usuario de Prueba

Si la base de datos está vacía, regístrate desde la app o usa el endpoint de seed:

```
Correo:     arc80259@lasallebajio.edu.mx
Matrícula:  arc80259
Contraseña: 1234
```

---

## Funcionalidades Principales

| Funcionalidad | Descripción |
|---|---|
| Autenticación institucional | Solo correos `@lasallebajio.edu.mx` con matrícula de 8 caracteres |
| Registro en 2 pasos | Datos personales + perfil universitario (carrera, semestre, tipo) |
| Publicar viajes | Origen, destino, horario, asientos, costo, punto de reunión |
| Buscar y reservar | Mapa interactivo con lista de viajes disponibles |
| Vista conductor | Aceptar o rechazar solicitudes de pasajeros |
| CO₂ ahorrado | Cálculo automático: `distancia_km × 0.21 kg` |
| Créditos universitarios | Se otorgan al aceptar pasajeros: `max(1, floor(co2_kg))` |
| Calificaciones | Sistema 1-5 estrellas bidireccional (conductor ↔ pasajero) |
| GPS en tiempo real | Rastreo de ruta almacenado en MongoDB Atlas |
| Modo oscuro/claro | Toggle disponible en toda la app |

---

## API Endpoints Principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/login` | Login, retorna JWT |
| GET | `/api/viajes` | Listar viajes disponibles |
| POST | `/api/viajes` | Publicar nuevo viaje |
| GET | `/api/viajes/:id/solicitudes` | Solicitudes pendientes (conductor) |
| POST | `/api/reservas` | Reservar un viaje |
| POST | `/api/reservas/:id/aceptar` | Aceptar pasajero + otorgar créditos |
| POST | `/api/reservas/:id/rechazar` | Rechazar solicitud |
| GET | `/api/usuarios/perfil` | Obtener perfil del usuario autenticado |
| PUT | `/api/usuarios/perfil` | Actualizar perfil |
| GET | `/api/vehiculos/mis-vehiculos` | Vehículos del usuario |
| POST | `/api/vehiculos` | Registrar vehículo |

---

## Base de Datos SQLite

Tablas: `usuario`, `vehiculo`, `estadisticas`, `viaje`, `reserva`, `calificacion`, `codigo_qr`, `rastreo_gps`

La base de datos se crea automáticamente en `backend/greenmove.db` al iniciar el servidor.

---

## Equipo

- Abraham Rodriguez Contreras - 80259
- Oliver Emilio Luna Becerra - 83355
- Emilio Humberto Rodriguez Barron - 83042
- Miguel Angel Chavez Elias - 81685
- Cristiano Ronaldo Garnica Zuñiga - 80846
- Diego Garcia Ramirez - 80904
- Derek Andri Esau Lopez Olvera - 84191
- Fernando Emmanuel Perez Lopez - 81660
- Naomi Monsterat Barrera Bautista - 77746
- Amir Goyri Espinoza - 81737

Universidad La Salle Bajío - Ingeniería en Sistemas y Software Computacional - 6to Semestre - 2025
