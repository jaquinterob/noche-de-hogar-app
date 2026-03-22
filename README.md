# Noche de Hogar

Planificador web para organizar la Noche de Hogar: agenda y familia.

## Requisitos

- **Node.js** 20+
- **Yarn**
- **MongoDB** (local o Atlas) para himnos, **familia** (apellidos e integrantes) y **agendas** (histórico completo)

## Puesta en marcha

1. Copia variables de entorno:

   ```bash
   cp .env.local.example .env.local
   ```

   Edita `MONGODB_URI` con tu cadena de conexión. En **producción**, define también `HYMNS_COOKIE_SECRET` (≥16 caracteres) para firmar la sesión de administración de himnos (ver más abajo).

2. Instala dependencias e instala Chromium para Playwright (solo si vas a scrapear):

   ```bash
   yarn install
   yarn playwright install chromium
   ```

3. Arranca en desarrollo:

   ```bash
   yarn dev
   ```

   Abre [http://localhost:3000](http://localhost:3000).

   Por defecto usa **Webpack** (más estable). Si quieres **Turbopack** (más rápido, pero a veces falla con `ENOENT` / `_buildManifest.js.tmp`):

   ```bash
   yarn dev:turbopack
   ```

   Si ves **`ENOENT` … `routes-manifest.json`**, **`pages-manifest.json`**, **`_buildManifest.js.tmp`** u otro archivo dentro de **`.next`**: el caché de compilación quedó a medias (p. ej. borraste `.next` con el servidor encendido, o mezclaste `build` y `dev`). **Para el servidor** (`Ctrl+C`) y ejecuta:

   ```bash
   yarn dev:fresh
   ```

   (equivale a `yarn clean && yarn dev`).

4. **Himnos en el menú:** **`/himnos`** es el **catálogo público** (lista + filtro + enlace al sitio oficial). Cualquiera puede consultarlo.

5. **Administración del catálogo** (solo con clave):

   - Desde **`/himnos`** usa **Administración (clave)** o entra en **`/himnos/acceso`**.
   - La clave se guarda en MongoDB en la colección **`appsettings`** (documento único), campo **`hymnsAccessKey`**. El valor **inicial al crear el documento** es `matrimonio`; puedes cambiarlo en la base de datos cuando quieras.
   - Tras entrar irás a **`/himnos/admin`**: estadísticas, **scrape vía API** (lento) y lista completa. No hay datos de ejemplo en la UI; usa el scrape o la terminal.
   - El **scraper por terminal** (`yarn scrape`) **pide la misma clave** que la web (te la solicita en la terminal) o usa la variable **`HYMNS_SCRAPE_KEY`** en `.env.local`. Lee **dos listas** oficiales y las fusiona: [Himnos — Para el hogar y la Iglesia](https://www.churchofjesuschrist.org/media/music/collections/hymns-for-home-and-church?lang=spa) y [Himnos (libro clásico)](https://www.churchofjesuschrist.org/media/music/collections/hymns?lang=spa). Los números no son consecutivos en la primera (p. ej. salto **1062** → **1201**). Si un número existiera en ambas colecciones, se conserva el de *hogar e Iglesia*. Opcional: `SCRAPE_PRUNE=1` borra en MongoDB himnos que ya no aparezcan en la unión de ambas listas (solo sin `SCRAPE_FROM`/`SCRAPE_TO`).

   Las rutas públicas **`/api/hymns/search`**, **`/api/hymns/catalog`** y **`/api/hymns/[id]`** están disponibles para el asistente; el listado admin completo, estadísticas y scrape vía API exigen sesión de admin.    La ruta **`/api/hymns/seed`** sigue existiendo por si la usas a mano, pero no hay botón en la interfaz.

6. En **Planificar**, en cada paso de himno puedes abrir **“Ver lista completa con filtro”** para elegir en `/planificar/elegir-himno` y volver al mismo paso con el himno ya seleccionado.

## Documentación

- **[Requerimientos](docs/REQUISITOS.md)** — alcance MVP, seguimiento en vivo, histórico, IA post-MVP, etc.

## Datos

- **Himnos:** MongoDB.
- **Familia y agendas:** MongoDB (por defecto colecciones **`families`** y **`fheagendas`**). Cada agenda tiene un `agendaId` (UUID) y está ligada a la familia por `familyId`. En el navegador solo se guarda el **id de la familia** (`noche-de-hogar:v2:family-mongo-id`) para saber qué hogar cargar. Si tenías datos antiguos en `localStorage` (v1), al abrir la app se intenta **migrarlos** una vez a MongoDB.
- **Modo sin conexión (PWA / offline):**
  - Tras cargar bien con internet, la app guarda una **copia local** de familia + agendas (`noche-de-hogar:v3:family-snapshot`) y el **catálogo de himnos** en JSON (`noche-de-hogar:v3:hymns-cache`). Si no hay red, se usan esos datos para planificar y buscar himnos.
  - Los cambios sin red se **encolan** y se envían a MongoDB al recuperar la conexión (evento `online`). La primera vez que creas el hogar o migras desde datos v1 **sí hace falta conexión** al servidor.
  - Si el catálogo es muy grande y no cabe en `localStorage`, se intenta guardar una versión **sin letras** de los himnos (sigue valiendo buscar por número y título).
- **Tiempos de reunión:** al abrir **seguimiento** se guarda la hora de inicio; al marcar cada momento con el deslizador se guarda la hora de ese paso (duración por momento y totales visibles en la ficha de la agenda).
