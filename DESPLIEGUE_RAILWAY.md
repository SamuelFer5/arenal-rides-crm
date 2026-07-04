# Guía de despliegue en Railway — Arenal Rides CRM

Esta guía te lleva de cero a tener la app funcionando en internet, accesible
solo para tu equipo (protegida por login).

> **Tiempo estimado:** 30-45 minutos la primera vez.

---

## Antes de empezar

Necesitas:
- Una cuenta de GitHub (gratis) → https://github.com
- Una cuenta de Railway (gratis) → https://railway.app — puedes entrar con tu GitHub
- El código del proyecto (la carpeta `arenal-rides-crm`)

---

## Paso 1: Subir el código a GitHub

Railway despliega desde un repositorio de GitHub. Primero sube tu código:

```bash
cd arenal-rides-crm
git init
git add .
git commit -m "Arenal Rides CRM - primera versión"
```

Luego crea un repositorio en GitHub (puede ser **privado**, de hecho es lo
recomendable para código de negocio) y conéctalo:

```bash
git remote add origin https://github.com/TU_USUARIO/arenal-rides-crm.git
git branch -M main
git push -u origin main
```

> **Verifica antes de subir:** que exista el archivo `.gitignore` en `backend/`
> con `node_modules/` y `.env`. Nunca subas tu archivo `.env` real (tiene la
> contraseña de la base de datos y el JWT_SECRET). Ya está configurado para
> ignorarse, pero conviene confirmarlo.

---

## Paso 2: Crear el proyecto en Railway + base de datos

1. Entra a https://railway.app y haz clic en **New Project**.
2. Elige **Provision PostgreSQL**. Railway te crea una base de datos en segundos.
3. Haz clic en la base de datos → pestaña **Variables** → copia el valor de
   `DATABASE_URL` (lo necesitarás en el paso siguiente). Empieza con
   `postgresql://...`

---

## Paso 3: Desplegar el backend

1. En el mismo proyecto de Railway, haz clic en **New** → **GitHub Repo** →
   selecciona tu repositorio.
2. Railway detectará que es Node.js. Ahora configura:

   **Settings → Root Directory:** escribe `backend`

   **Settings → Build Command:**
   ```
   npm install
   ```

   **Settings → Start Command:**
   ```
   npm run migrate && npm run seed && node server.js
   ```
   > Este comando corre las migraciones y el seed la primera vez. Ver la nota
   > al final sobre cómo cambiarlo después del primer arranque.

3. Ve a la pestaña **Variables** del backend y agrega:

   | Variable        | Valor                                                    |
   |-----------------|----------------------------------------------------------|
   | `DATABASE_URL`  | *(pega el que copiaste de PostgreSQL en el paso 2)*      |
   | `PGSSL`         | `true`                                                   |
   | `JWT_SECRET`    | *(una cadena larga y aleatoria, mín. 32 caracteres)*     |
   | `JWT_EXPIRES_IN`| `8h`                                                     |
   | `NODE_ENV`      | `production`                                             |
   | `FRONTEND_URL`  | *(lo llenas en el paso 5, cuando tengas la URL del front)* |

   > Para generar un `JWT_SECRET` seguro, puedes usar esta web:
   > https://generate-secret.vercel.app/32 o en tu terminal:
   > `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

4. Railway desplegará automáticamente. En **Settings → Networking**, haz clic en
   **Generate Domain** para obtener la URL pública del backend
   (algo como `https://arenal-backend-production.up.railway.app`).
   Anótala.

---

## Paso 4: Desplegar el frontend

1. En el proyecto, **New** → **GitHub Repo** → el mismo repositorio otra vez.
2. Configura:

   **Settings → Root Directory:** `frontend`

   **Settings → Build Command:**
   ```
   npm install && npm run build
   ```

   **Settings → Start Command:** (para servir los archivos estáticos)
   ```
   npx vite preview --host 0.0.0.0 --port $PORT
   ```

3. En **Variables** del frontend, agrega:

   | Variable       | Valor                                              |
   |----------------|----------------------------------------------------|
   | `VITE_API_URL` | `https://TU-BACKEND.up.railway.app/api`            |
   |                | *(la URL del backend del paso 3, + `/api` al final)* |

4. En **Settings → Networking → Generate Domain** para obtener la URL pública
   del frontend. **Esta es la URL que le pasarás a tu equipo.**

---

## Paso 5: Conectar frontend y backend (CORS)

1. Vuelve al servicio **backend** en Railway → **Variables**.
2. Edita `FRONTEND_URL` y pon la URL pública del frontend (sin `/` al final):
   ```
   FRONTEND_URL=https://TU-FRONTEND.up.railway.app
   ```
3. El backend se reiniciará solo. Listo.

---

## Paso 6: Primera prueba

1. Abre la URL del frontend en tu navegador.
2. Entra con `admin@arenalrides.com` / `Arenal2026!`
3. Cambia la contraseña del admin de inmediato (clic en tu avatar abajo).
4. Crea los usuarios de tu equipo desde la sección **Admin**.

---

## IMPORTANTE: después del primer arranque

El `Start Command` del backend incluye `npm run seed`, que **carga los datos
iniciales**. Si lo dejas así, cada reinicio intentaría re-insertar, lo que
puede duplicar o fallar.

**Después de confirmar que todo funciona**, cambia el Start Command del backend a
solo:
```
node server.js
```
(quitando `npm run migrate && npm run seed &&`).

Las migraciones usan `IF NOT EXISTS`, así que no rompen nada, pero el seed sí
debe correr una única vez.

---

## Advertencia sobre datos de producción

El plan gratuito de Railway ($5 de crédito/mes) sirve para arrancar y que el
equipo pruebe. **Pero para uso real del negocio con datos importantes:**

- El plan gratuito **no incluye respaldos automáticos** de la base de datos.
- Si el proyecto queda inactivo o se agota el crédito, podrías perder datos.

**Recomendación:** una vez que esto sea la herramienta real del día a día,
activa un plan pago (~$5/mes) que incluya respaldos, o configura respaldos
manuales periódicos exportando la base con `pg_dump`.

### Respaldo manual (mientras tanto)

Desde tu computadora, con la `DATABASE_URL` de Railway:
```bash
pg_dump "postgresql://...la_url_de_railway..." > respaldo_$(date +%Y%m%d).sql
```
Guárdalo en un lugar seguro (Google Drive, etc.). Hazlo al menos una vez por semana.

---

## Solución de problemas comunes

**"Failed to fetch" al hacer login:**
Es CORS. Verifica que `FRONTEND_URL` en el backend sea exactamente la URL del
frontend (sin `/` final) y que `VITE_API_URL` en el frontend termine en `/api`.

**El backend no arranca / error de base de datos:**
Verifica que `DATABASE_URL` esté bien copiado y que `PGSSL=true`.

**La primera carga es lenta:**
Normal en el plan gratuito si el servicio estuvo inactivo. Mejora con plan pago.

**Los cambios en el código no se reflejan:**
Haz `git push` de nuevo; Railway redespliega automáticamente con cada push a `main`.
