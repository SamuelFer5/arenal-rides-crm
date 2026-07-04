# Arenal Rides CRM

CRM para gestión de reservas de transporte turístico en la Zona Norte de Costa Rica.

**Stack:** Node.js + Express (backend API REST) · React + Vite (frontend SPA) · PostgreSQL

---

## Credenciales temporales

| Usuario        | Email                      | Contraseña    | Rol           |
|----------------|---------------------------|---------------|---------------|
| Admin          | admin@arenalrides.com      | Arenal2026!   | Administrador |
| Carla Mora     | carla@arenalrides.com      | Carla2026!    | Empleado      |
| Diego Solís    | diego@arenalrides.com      | Diego2026!    | Empleado      |
| Mariana Vargas | mariana@arenalrides.com    | Mariana2026!  | Empleado      |
| Esteban Rojas  | esteban@arenalrides.com    | Esteban2026!  | Empleado      |

> Cámbialas desde la sección Admin después del primer login.

---

## Requisitos previos

- Node.js 18+
- PostgreSQL 14+
- npm 9+

---

## Gestión de usuarios del equipo

La app está pensada para uso privado del equipo: cualquiera puede acceder por internet,
pero solo entra quien tenga cuenta y contraseña.

### Crear usuarios para el equipo (solo admin)

1. Entra como **admin** (admin@arenalrides.com)
2. Ve a la sección **Admin** en el menú lateral
3. Haz clic en **+ Nuevo usuario**
4. Llena nombre, correo, una contraseña inicial (mínimo 8 caracteres) y el rol
5. Comparte esa contraseña con la persona (WhatsApp, en persona, etc.)

La persona podrá cambiar su contraseña después desde su perfil.

### Cambiar la contraseña propia (cualquier usuario)

1. Haz clic en tu nombre/avatar abajo a la izquierda (en el menú lateral)
2. Ingresa tu contraseña actual y la nueva
3. Guarda

### Roles

- **Administrador:** ve todo, gestiona usuarios, cambia roles, ve la auditoría, puede eliminar cualquier reserva.
- **Empleado:** gestiona reservas (crear, editar), ve reportes. No puede administrar usuarios ni ver la auditoría, y solo puede eliminar las reservas que creó.

### Desactivar a alguien que sale del equipo

En vez de borrar la cuenta (lo que perdería el rastro de auditoría), el admin puede
**Desactivar** al usuario desde la sección Admin. Esa persona ya no podrá entrar,
pero su historial queda intacto.

---

## Instalación local (paso a paso)

### 1. Clonar / descomprimir el proyecto

```
arenal-rides-crm/
├── backend/
└── frontend/
```

### 2. Crear la base de datos en PostgreSQL

Abre pgAdmin o psql y ejecuta:

```sql
CREATE USER arenal_user WITH PASSWORD 'arenal_pass';
CREATE DATABASE arenal_rides OWNER arenal_user;
GRANT ALL PRIVILEGES ON DATABASE arenal_rides TO arenal_user;
\c arenal_rides
GRANT ALL ON SCHEMA public TO arenal_user;
```

### 3. Configurar variables de entorno del backend

```bash
cd backend
cp .env.example .env
```

Edita `.env` con tus datos reales:

```env
PORT=4000
DATABASE_URL=postgresql://arenal_user:arenal_pass@localhost:5432/arenal_rides
PGSSL=false
JWT_SECRET=ponaqui_un_secreto_largo_y_aleatorio_minimo_32_chars
JWT_EXPIRES_IN=8h
FRONTEND_URL=http://localhost:5173
```

> **IMPORTANTE:** Cambia `JWT_SECRET` por una cadena aleatoria larga antes de usarlo en producción.

### 4. Instalar dependencias e inicializar la base de datos

```bash
# Desde la carpeta backend/
npm install

# Crea las tablas
npm run migrate

# Carga los 1352 registros reales + usuarios + conductores
npm run seed
```

### 5. Levantar el backend

```bash
npm run dev
# → API corriendo en http://localhost:4000
```

### 6. Configurar y levantar el frontend

```bash
cd ../frontend
npm install
```

Crea el archivo `.env`:
```env
VITE_API_URL=http://localhost:4000/api
```

```bash
npm run dev
# → App corriendo en http://localhost:5173
```

### 7. Abrir la app

Abre **http://localhost:5173** y entra con cualquiera de las credenciales de arriba.

---

## Arquitectura

```
arenal-rides-crm/
├── backend/
│   ├── migrations/        # SQL: esquema de tablas
│   ├── seed/              # Datos iniciales reales (1352 reservas)
│   └── src/
│       ├── config/        # Conexión a PostgreSQL (pool + transacciones)
│       ├── models/        # Acceso a datos (queries SQL)
│       ├── services/      # Lógica de negocio (locks, permisos, cálculos)
│       ├── controllers/   # Request/Response HTTP
│       ├── routes/        # Definición de endpoints
│       └── middlewares/   # JWT auth, roles, manejo de errores
│
└── frontend/
    └── src/
        ├── api/           # Cliente fetch hacia el backend
        ├── context/       # AuthContext (sesión global)
        ├── components/    # Sidebar, Header, modales, badges
        ├── pages/         # Dashboard, Reservas, Agenda, Conductores, Gastos, Ventas, Admin
        ├── hooks/         # useDebounce
        └── utils/         # Helpers: money(), fmtDate(), statusInfo()
```

### Endpoints principales

| Método | Ruta                      | Descripción                        |
|--------|---------------------------|------------------------------------|
| POST   | /api/auth/login           | Login con email/password           |
| GET    | /api/auth/me              | Usuario actual                     |
| GET    | /api/bookings             | Listar reservas (filtro ?month=)   |
| POST   | /api/bookings             | Crear reserva                      |
| PUT    | /api/bookings/:id         | Actualizar reserva (merge parcial) |
| DELETE | /api/bookings/:id         | Eliminar reserva                   |
| POST   | /api/bookings/:id/lock    | Tomar lock de edición (15 min TTL) |
| DELETE | /api/bookings/:id/lock    | Liberar lock                       |
| GET    | /api/reports/monthly      | Totales mensuales (rack/net/pax)   |
| GET    | /api/reports/drivers      | Métricas por conductor             |
| GET    | /api/reports/finance      | Gastos y pagos a proveedores       |
| GET    | /api/users                | Listar usuarios                    |
| POST   | /api/users                | Crear usuario (admin)              |
| POST   | /api/users/change-password| Cambiar contraseña propia          |
| PATCH  | /api/users/:id/active     | Activar/desactivar usuario (admin) |
| PATCH  | /api/users/:id/role       | Cambiar rol (admin)                |
| GET    | /api/users/audit-log      | Bitácora de auditoría (admin)      |

---

## Despliegue en producción (Render.com — recomendado)

### Base de datos (PostgreSQL)

1. En Render, crea un **PostgreSQL** (free tier disponible).
2. Copia la `External Database URL` que te da Render.

### Backend (Web Service)

1. Sube el código a GitHub (solo la carpeta `backend/`, o el mono-repo completo).
2. En Render, crea un **Web Service** con:
   - **Build command:** `npm install && npm run migrate && npm run seed`
   - **Start command:** `node server.js`
3. Variables de entorno en Render:
   ```
   DATABASE_URL = <la URL de Render>
   PGSSL = true
   JWT_SECRET = <tu secreto largo>
   JWT_EXPIRES_IN = 8h
   FRONTEND_URL = https://tu-frontend.onrender.com
   NODE_ENV = production
   ```

### Frontend (Static Site)

1. En Render, crea un **Static Site** con:
   - **Build command:** `npm install && npm run build`
   - **Publish directory:** `dist`
2. Variables de entorno:
   ```
   VITE_API_URL = https://tu-backend.onrender.com/api
   ```

> **Nota:** El seed solo debe correr una vez. Después del primer deploy, cámbia el Build command del backend a solo `npm install`.

---

## Railway.app (alternativa igual de sencilla)

Railway detecta automáticamente Node.js y PostgreSQL. Solo necesitas:

1. Crear un proyecto, agregar un plugin de **PostgreSQL**.
2. Deploy del backend apuntando a la carpeta `backend/`.
3. Configurar las mismas variables de entorno.
4. Para el frontend: Railway también soporta Static Sites, o puedes usar **Netlify/Vercel** gratis.

---

## Seguridad implementada

- **Contraseñas:** hasheadas con bcrypt (factor 10)
- **Sesiones:** JWT firmado con `HS256`, expira en 8 horas
- **Validación de sesión en cada request:** el middleware verifica que el usuario siga activo en la BD (no confía solo en el token)
- **Roles:** validados en el backend (no solo en el frontend)
- **Locks de edición concurrente:** expiración automática de 15 minutos
- **Profit calculado en servidor:** nunca se acepta el profit del cliente
- **Auditoría:** toda acción relevante queda registrada en `audit_log`

---

## Notas sobre los datos

Los 1352 registros de reservas provienen del archivo que generó Claude Design como prototipo.
Se detectó que estos bookings son **incompletos** respecto a los totales reales del negocio
(los meses Enero, Febrero y Abril muestran diferencias vs. el resumen original del prototipo).

Cuando tengas el archivo Excel/CSV original con todos los datos reales:

1. Súbelo en el chat de Claude
2. Se reemplazará el archivo `backend/seed/crm_data.json`
3. Corre `npm run seed` de nuevo para actualizar la base de datos

---

*Generado con Claude Sonnet 4.6 · Julio 2026*
