# Noche de Hogar

Planificador web para organizar la Noche de Hogar: agenda y familia.

## Requisitos

- **Node.js** 20+
- **Yarn**
- **MongoDB** (local o Atlas) para el catálogo de himnos

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

   Si ves **`ENOENT` … `routes-manifest.json`**, **`_buildManifest.js.tmp`** u otro archivo dentro de **`.next`**: el caché de compilación quedó a medias (p. ej. borraste `.next` con el servidor encendido, o mezclaste `build` y `dev`). **Para el servidor** (`Ctrl+C`) y ejecuta:

   ```bash
   yarn dev:fresh
   ```

   (equivale a `yarn clean && yarn dev`).

4. **Administración del catálogo de himnos** (solo tú, no aparece en el menú público):

   - Abre en el navegador **`/himnos/acceso`** e introduce la clave.
   - La clave se guarda en MongoDB en la colección **`appsettings`** (documento único), campo **`hymnsAccessKey`**. El valor **inicial al crear el documento** es `matrimonio`; puedes cambiarlo en la base de datos cuando quieras.
   - Tras entrar verás **`/himnos`**: seed, scrape vía API y lista completa.
   - El **scraper por terminal** sigue funcionando sin cookie: `yarn scrape`. Lee **dos listas** oficiales y las fusiona: [Himnos — Para el hogar y la Iglesia](https://www.churchofjesuschrist.org/media/music/collections/hymns-for-home-and-church?lang=spa) y [Himnos (libro clásico)](https://www.churchofjesuschrist.org/media/music/collections/hymns?lang=spa). Los números no son consecutivos en la primera (p. ej. salto **1062** → **1201**). Si un número existiera en ambas colecciones, se conserva el de *hogar e Iglesia*. Opcional: `SCRAPE_PRUNE=1` borra en MongoDB himnos que ya no aparezcan en la unión de ambas listas (solo sin `SCRAPE_FROM`/`SCRAPE_TO`).

   Las rutas públicas **`/api/hymns/search`**, **`/api/hymns/catalog`** (lista filtrable para planificar) y **`/api/hymns/[id]`** están disponibles para el asistente; el listado admin, estadísticas, seed y scrape exigen sesión de admin.

   En **Planificar**, en cada paso de himno puedes abrir **“Ver lista completa con filtro”** para elegir en `/planificar/elegir-himno` y volver al mismo paso con el himno ya seleccionado.

## Documentación

- **[Requerimientos](docs/REQUISITOS.md)** — alcance MVP, seguimiento en vivo, histórico, IA post-MVP, etc.

## Datos

- **Himnos:** MongoDB.
- **Miembros y agendas:** `localStorage` del navegador (no se sincronizan entre dispositivos).
