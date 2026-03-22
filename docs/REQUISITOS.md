# Requerimientos — Noche de Hogar

Documento para **revisión y acuerdo**. Versión alineada al plan técnico acordado.  
Cuando cambies algo aquí, lo reflejamos en el plan de implementación antes de codificar.

---

## 1. Visión del producto

| ID | Requerimiento |
|----|----------------|
| V1 | La app ayuda a **planificar una Noche de Hogar** en una sesión guiada (asistente paso a paso). |
| V2 | El resultado es una **agenda legible** (quién hace qué + himnos elegidos). |
| V3 | Para cada himno en la **agenda** y en el **momento de elegirlo**, lo esencial es un **enlace a la página oficial** en churchofjesuschrist.org (no se exige reproductor ni letra dentro de la app para ese flujo). |
| V4 | Idioma de la interfaz: **español**. |
| V5 | Uso previsto: **navegador** (escritorio y móvil), sin app nativa en el MVP. |
| V6 | **Persistencia:** en **base de datos (MongoDB) solo entra el catálogo de himnos** obtenido con el **scraper**. El resto (**miembros de familia**, **agendas / Noches de Hogar**, nombre opcional de familia, preferencia de tema si no va aparte, etc.) se guarda en **`localStorage` del navegador**. Cada dispositivo/navegador tiene su propio almacén; la **biblioteca de himnos** sigue siendo **una sola** en el servidor para todos. |
| V7 | **Durante la reunión:** una vez **programada** la Noche de Hogar, la familia puede **abrir la agenda en modo “seguimiento”** y **marcar con checks** cada parte ya realizada (preside, himnos, oraciones, etc.), con **progreso visible**. Esta experiencia es la **función central** de la app en el momento de uso: debe sentirse **clara, emotiva y memorable** en móvil y escritorio (ver **M20–M21** y §4.1). |

---

## 2. Identidad y repositorio (ya decidido)

| ID | Requerimiento |
|----|----------------|
| I1 | Nombre del producto: **Noche de Hogar**. |
| I2 | Nombre técnico del paquete / repo: **`noche-de-hogar`**. |
| I3 | Descripción corta del repo: *Planificador web para organizar la Noche de Hogar: agenda, himnos y familia.* |

---

## 3. Alcance MVP vs fuera de alcance

### 3.1 Incluido en MVP

| ID | Área | Requerimiento |
|----|------|----------------|
| M1 | **Familia** | **CRUD de miembros** en MVP: **añadir**, **listar**, **editar nombre** y **borrar** desde `/familia` (o pantalla equivalente). Los datos viven en **`localStorage`**. Las agendas ya guardadas **no se reescriben** al borrar o renombrar: conservan el texto que tenían al crearse (instantánea del plan). |
| M2 | **Familia** | **Sin** rutas API de miembros para persistencia; lectura/escritura solo en cliente (hooks o utilidades sobre `localStorage`). |
| M3 | **Himnos** | Biblioteca del **scraper** persistida en **MongoDB**; **buscar** vía API por número o título. |
| M4 | **Himnos** | Ver **lista completa** de himnos cargados (scroll). |
| M5 | **Himnos** | **Al elegir un himno** (pasos del asistente): la UI debe ofrecer **solo lo necesario para confirmar la elección** y un **enlace para abrir la página oficial** del himno (p. ej. botón o enlace “Ver en sitio oficial” en nueva pestaña). No es requisito del MVP mostrar **reproductor** ni **letra** dentro de la app en ese momento. |
| M5b | **Himnos** | Página **biblioteca** (`/himnos`): búsqueda + lista; cada himno puede mostrarse con **enlace a la página oficial** como acción principal (coherente con el asistente). |
| M6 | **Himnos** | Sí se ejecuta el **scraper** (Playwright) para números **1001–1210** de la colección *Himnos para el hogar y la Iglesia* (`?lang=spa`), para poblar título, URL oficial y demás campos que el scraper obtenga (letra/audio en BD son **opcionales** para el usuario; sirven para datos futuros o mejoras). |
| M7 | **Himnos** | Comando **`yarn scrape`** para ejecución larga sin depender solo del timeout de la API web. |
| M8 | **Himnos** | Opción de **datos de ejemplo** (seed) para desarrollo/pruebas sin scraper. |
| M9 | **Noche de Hogar** | Asistente de **11 pasos** en orden fijo (tabla en §4). |
| M10 | **Noche de Hogar** | Guardar cada reunión con **fecha**, **`status`** inicial **`planned`** y todos los campos del §4 en **`localStorage`** (cada ítem con **id** local, p. ej. UUID). Transiciones y bloqueos: **M22**. |
| M11 | **Noche de Hogar** | Pantalla **agenda** por id (`/agenda/[id]`) y **listado** (`/agendas`) leyendo solo del **almacén local** (no `GET` a API para agendas). |
| M12 | **Noche de Hogar** | En agenda, himnos con URL guardada se muestran como **enlace externo** (p. ej. ↗). |
| M13 | **Técnico** | Stack: **Next.js** (App Router), **TypeScript**, **Tailwind**, **Yarn**; **MongoDB + Mongoose solo** para el modelo **Hymn** y el **scraper**. |
| M14 | **UI** | Estilo **minimalista**: tipografía **Inter**, paleta **neutra**, contenido centrado (~`max-w-2xl`). |
| M19 | **UI tema** | Soporte explícito de **tema claro** y **tema oscuro** (light / dark), manteniendo el minimalismo: pocos colores, buen contraste en ambos modos. **Valor por defecto:** respetar `prefers-color-scheme` del sistema. **Control manual:** interruptor visible (p. ej. en cabecera o ajustes) para fijar claro u oscuro e ignorar el sistema mientras dure la preferencia guardada (**localStorage** + clase `dark` en `html`, o equivalente con Tailwind). |
| M15 | **Multi-usuario / privacidad** | **Varias familias** usan la misma URL de la app: los datos personales **no** están en el servidor; cada quien solo ve lo que hay en **su** `localStorage`. Limpiar datos del sitio = se pierden miembros y agendas de ese navegador. |
| M16 | **UX entrada** | **Sin modal inicial** obligatorio para nombre de familia; nombre opcional en **localStorage** o ajustes si se desea. |
| M17 | **localStorage** | Esquema **versionado** (p. ej. prefijo `noche-de-hogar:v1:`) para poder migrar en el futuro; manejo básico de **JSON** inválido o clave ausente (inicializar vacío). |
| M18 | **Copia de seguridad (opcional MVP+)** | Valorar botón **exportar / importar** JSON del contenido de `localStorage` para no perder datos al cambiar de dispositivo (refuerza **D7**). |
| M20 | **Seguimiento en vivo** | Para cada agenda guardada, existe un flujo **“Iniciar / Seguir Noche de Hogar”** (misma ruta con vista dedicada o subruta, p. ej. `/agenda/[id]/seguimiento`) que muestra **los mismos momentos que el plan** (alineados al §4), cada uno con **casilla o control para marcar “hecho”** — **solo si** la agenda sigue en estado **`planned`** (ver **M22**). Si está **`completed`**, la misma vista es **solo lectura** (histórico del progreso). El **himno opcional** (paso 7) solo aparece si en el plan había segundo himno; si no, ese ítem no se lista o se muestra como omitido. Los checks se **persisten** en el objeto de la agenda en **`localStorage`** (p. ej. mapa `completedSteps` por clave de paso) y **sobreviven al recargar** la página. |
| M21 | **Diseño del seguimiento (prioridad máxima)** | La pantalla de seguimiento es la **joya de UI del MVP**: debe destacar por encima del resto de vistas. **Lineamientos:** jerarquía tipográfica fuerte; **indicador de progreso global** (barra, anillo o pasos numerados); **áreas táctiles amplias** (ideal ≥44px) para marcar en el sofá o con una mano; himnos con **acceso rápido al enlace oficial** sin perder el contexto del checklist; transiciones **sutiles** al completar un paso; estado final **celebratorio** cuando todo lo previsto esté marcado (y al **cerrar la reunión** con **M22**). Respetar **`prefers-reduced-motion`** (animaciones opcionales o reducidas). Coherente con tema **claro/oscuro** (**M19**) y contraste **N5**. |
| M22 | **Agendas: planificada vs realizada (histórico)** | Cada agenda tiene **`status`**: **`planned`** (por defecto al crear) o **`completed`**. Mientras esté **`planned`**, se permite **editar** el plan (reabrir asistente precargado o equivalente) y **borrar** la agenda. Acción explícita **“Marcar como realizada”** (con confirmación breve, p. ej. diálogo) pasa a **`completed`**, opcionalmente guardando **`completedAt`** (ISO). En **`completed`**: **no** se puede **editar** el contenido, **no** **borrar** la fila (permanece como **histórico**), **no** modificar **`completedSteps`** ni deshacer el cierre; solo **lectura** en `/agenda/[id]` y `/agenda/[id]/seguimiento`. El listado `/agendas` debe **diferenciar** visualmente planes abiertos vs reuniones ya realizadas. |

### 3.2 Explícitamente fuera del MVP (postergable)

| ID | Ítem |
|----|------|
| X1 | **Login** con correo/contraseña u **OAuth**. *Nota: el aislamiento es por **navegador** (`localStorage`); sin servidor para cuentas en MVP.* |
| X2 | Cron programado (`node-cron`) para scraper automático. |
| X3 | PWA / instalación como app. |
| X4 | Notificaciones push o correo. |
| X5 | **Reproductor de audio** y **visor de letra** integrados en la app (pantalla biblioteca o al seleccionar himno). |
| X6 | **Inteligencia artificial (IA)** integrada en la app: **post-MVP** y **siempre opt-in**; alcance y límites en **§11.1**. |

*(Cualquiera puede pasar a MVP si lo decides.)*

---

## 4. Asistente — 11 pasos (orden fijo)

| Paso | Campo persistido | Etiqueta mostrada al usuario | Entrada |
|------|------------------|------------------------------|---------|
| 1 | `preside` | Quién preside | Lista: miembros |
| 2 | `conducts` | Quién dirige | Lista: miembros |
| 3 | `welcomeBy` | Quién da la bienvenida | Lista: miembros |
| 4 | `openingHymn` + `openingHymnUrl` | Primer himno | Búsqueda de himnos |
| 5 | `openingPrayer` | Primera oración | Lista: miembros |
| 6 | `spiritualThoughtBy` | Pensamiento espiritual | Lista: miembros |
| 7 | `optionalHymn` + `optionalHymnUrl` | Segundo himno (opcional) | Búsqueda; puede omitirse |
| 8 | `mainMessageBy` | Mensaje principal | Lista: miembros |
| 9 | `activityBy` + `activityDescription` | Actividad | **Quién dirige** (lista: miembros) y **qué haremos** (texto libre, p. ej. “Juegos en el jardín”). |
| 10 | `closingHymn` + `closingHymnUrl` | Último himno | Búsqueda de himnos |
| 11 | `closingPrayer` | Oración final | Lista: miembros |

**Reglas:**

- No avanzar de paso si el campo obligatorio está vacío (el paso 7 es la excepción: opcional). En el paso 9, **`activityBy`** es obligatorio; **`activityDescription`** puede quedar vacío.
- Al elegir himno: guardar texto visible tipo `#número Título` y la **URL** de la página del himno para la agenda; en pantalla debe quedar claro el **enlace a la página oficial** (p. ej. abrir en nueva pestaña) como acción principal hacia el contenido del himno.
- Al finalizar: **persistir** la reunión en **`localStorage`**, mensaje de éxito y acceso a ver la agenda (`/agenda/[id]` con id local).

### 4.1 Modo seguimiento (mientras ocurre la reunión)

Los **ítems marcables** deben corresponder al plan guardado, con claves estables sugeridas (para `completedSteps`):

| Clave | Contenido mostrado (resumen) |
|-------|------------------------------|
| `preside` | Quién preside |
| `conducts` | Quién dirige |
| `welcome` | Bienvenida |
| `openingHymn` | Primer himno (+ enlace si hay URL) |
| `openingPrayer` | Primera oración |
| `spiritualThought` | Pensamiento espiritual |
| `optionalHymn` | Segundo himno — **solo si** hubo himno opcional en el plan |
| `mainMessage` | Mensaje principal |
| `activity` | Actividad: **quién dirige** + **descripción** (si existe en el plan) |
| `closingHymn` | Último himno (+ enlace) |
| `closingPrayer` | Oración final |

El orden en pantalla sigue el de la tabla del §4. Desde la **vista agenda clásica** (`/agenda/[id]`) debe haber una **llamada a la acción muy visible** hacia el modo seguimiento.

---

## 5. Datos que se guardan (resumen)

### 5.1 Himno — **MongoDB** (única colección servidor)

`number`, `title`, `pageUrl` (obligatorios para el flujo de enlace oficial), y opcionalmente `lyrics`, `audioUrl`, `sheetMusicUrl` si el scraper los rellena; fechas de creación/actualización. **Solo esto** vive en base de datos.

### 5.2 Cliente — **`localStorage`** (sin MongoDB)

Estructura lógica sugerida (una clave JSON o varias claves versionadas):

- `members`: lista de `{ id, name }` (o solo `name` si no hace falta id estable).
- `agendas` o `fheList`: lista de objetos con `id` (UUID), `date`, **`status`**: `'planned' | 'completed'` (por defecto `'planned'`), **`completedAt`** (string ISO, solo si `completed`), todos los campos del §4 (textos + `openingHymnUrl`, `optionalHymnUrl`, `closingHymnUrl` cuando apliquen), más **`completedSteps`** (objeto opcional para **M20**). Si falta `completedSteps`, se asume ningún paso completado. Reglas de **M22** sobre edición/borrado e histórico.
- `familyName` (opcional), `theme` (si no se reutiliza la misma clave que **M19**).

**Límites:** `localStorage` ~5 MB según navegador; agendas largas podrían acercarse al límite en casos extremos (poco probable en uso familiar normal).

**No hay** colecciones `Family`, `FamilyMember` ni `FamilyHomeEvening` en el servidor.

---

## 6. API (contrato mínimo)

**Solo catálogo de himnos y scraper** hablan con MongoDB. **No** existen rutas API para miembros ni agendas.

| Método y ruta | Propósito |
|---------------|-----------|
| `GET /api/hymns` | Todos los himnos (orden por número) |
| `GET /api/hymns/search?q=` | Búsqueda |
| `GET /api/hymns/[id]` | Detalle |
| `GET /api/hymns/stats` | Conteo |
| `POST /api/hymns/seed` | Himnos de ejemplo (desarrollo) |
| `POST /api/scrape` | Ejecutar scraper → escribe en MongoDB (puede ser limitado por tiempo en hosting) |

**Rutas de página** `/agendas`, `/agenda/[id]`, **`/agenda/[id]/seguimiento`** (o equivalente), `/planificar`, `/familia`: **Client Components** (o hidratación) que leen/escriben `localStorage`; el `[id]` de agenda es el **id local** guardado en el cliente.

**Futuro (§11.1, X6):** si se añade IA, exponerla solo vía **API Route / Server Action** en Next.js (sin API keys en el cliente), p. ej. prefijo `/api/ai/...`.

---

## 7. Scraper — reglas

- Rango de números: **1001** a **1210** inclusive.
- URL base de cada himno: colección oficial en español (*hymns-for-home-and-church* + `?lang=spa`).
- Un fallo en un número **no** debe impedir intentar el resto.
- Errores recopilados para mostrar o registrar (timeouts, páginas sin contenido, etc.).

---

## 8. No funcionales

| ID | Requerimiento |
|----|----------------|
| N1 | Variables sensibles solo en `.env.local` (no en git). |
| N2 | `yarn build` debe completar sin error antes de dar por cerrada una versión. |
| N3 | En producción pública, valorar **proteger** `POST /api/scrape` (token o uso solo desde servidor). |
| N4 | **`localStorage`:** los datos de familia/agenda **no** están cifrados; cualquier script con acceso al origen puede leerlos (riesgo XSS mitigado con buenas prácticas de Next/React). Informar en **ajustes** o README que borrar datos del sitio elimina miembros y agendas. |
| N5 | **Accesibilidad visual:** textos y enlaces legibles en **claro y oscuro** (contraste razonable; sin grises demasiado claros sobre fondo claro ni demasiado oscuros sobre fondo oscuro). |
| N6 | **Movimiento:** en la vista de seguimiento (**M21**), las animaciones decorativas deben respetar **`prefers-reduced-motion: reduce`** (reducir o desactivar). Los checks y el foco deben ser **operables con teclado** donde aplique. |
| N7 | **IA (cuando exista):** no enviar datos personales sin **consentimiento explícito** por acción; **clave de API solo en servidor** (p. ej. ruta `/api/ai/...`); el modelo **no debe inventar** URLs ni números de himnos: para himnos, solo **elegir o rankear** entre el **catálogo real** (MongoDB) o devolver candidatos validados en servidor. |

---

## 9. Criterios de aceptación del MVP (checklist)

- [ ] Sin modal inicial obligatorio; miembros y agendas persisten en **localStorage** de ese navegador.
- [ ] Crear al menos un miembro y verlo en el asistente; **editar nombre** y **borrar** otro de prueba; recargar y **comprobar persistencia** (localStorage). Tras crear una agenda, comprobar que **cambiar/borrar miembros no altera** el texto ya guardado en esa agenda (**M1**).
- [ ] En otro navegador o ventana privada **no** aparecen los mismos miembros/agendas (salvo importación manual futura).
- [ ] Tener himnos en BD (seed o scraper) y buscarlos en `/himnos`; al elegir, acceso claro al **enlace oficial**.
- [ ] Completar el asistente y ver la agenda con fecha y nombres correctos.
- [ ] En la agenda, himnos con URL muestran enlace; sin URL, solo texto.
- [ ] Listado `/agendas` abre el detalle de una reunión guardada y **distingue** planes **`planned`** vs histórico **`completed`** (**M22**).
- [ ] Con agenda **`planned`**: **editar** y **borrar** disponibles; **marcar como realizada** la bloquea: ya **no** se puede editar ni borrar ni cambiar checks; solo lectura (**M22**).
- [ ] Desde una agenda, entrar al **modo seguimiento**; marcar varios pasos, recargar y **comprobar que el progreso se mantiene** (`completedSteps` en `localStorage`).
- [ ] Con himno opcional vacío en el plan, el seguimiento **no exige** (o no muestra) ese paso como obligatorio.
- [ ] La vista de seguimiento cumple la intención de **M21** (progreso global, táctil cómodo, enlace a himno a mano, cierre celebratorio al completar).
- [ ] **Tema:** se ve bien en **claro** y en **oscuro**; el **toggle** cambia el aspecto y la preferencia **persiste** al recargar.

---

## 10. Decisiones pendientes — **tú eliges** (paso a paso)

No implementamos estos puntos hasta que los confirmes (podemos ir **uno por uno** en el chat).

| # | Tema | Opciones / notas |
|---|------|------------------|
| D4 | **Fecha del asistente** | ¿Elegir fecha al **inicio** del flujo o solo al **final** al guardar? |
| D5 | **Imprimir / compartir** | ¿Quieres botón “Imprimir agenda” o “Copiar texto” en la primera versión? |
| D6 | **Scraper en producción** | ¿Quién puede ejecutarlo? ¿Solo tú (token) o cualquiera con la URL? |
| D7 | **Mismo hogar, varios dispositivos** | Con solo `localStorage`, cada dispositivo es independiente. **MVP:** aceptado o compensar con **exportar/importar JSON** (**M18**). Alternativas futuras: sync en nube + login (**X1**). |

---

## 11. Sugerencias de producto (opcionales, no acordadas aún)

Ideas para **después** del MVP o si quieres subir el listón:

- Recordatorio semanal (correo o calendario .ics).
- Plantillas de Noche de Hogar (ej. “con niños pequeños”).
- *(Tema claro/oscuro ya está en MVP — §3.1 **M19**.)*
- Accesibilidad: foco visible, etiquetas ARIA en reproductor y asistente.
- Internacionalización (inglés) como segunda lengua.

### 11.1 Inteligencia artificial (post-MVP, **X6**)

**Principios:** la IA **no sustituye** el flujo principal (planificar → seguimiento → histórico **M20–M22**). Debe ser **opt-in** (botón explícito), **no bloqueante**, y con **aviso de privacidad** cuando se envíe contexto al proveedor. **No** integrar IA en la vista de **seguimiento en vivo** ni en el **cierre histórico** (prioridad: claridad y ritual).

**En features ya previstas (uso ligero):**

| Lugar | Propuesta |
|-------|-----------|
| **Paso 9 — actividad** | Botón **“Sugerir ideas con IA”**: devuelve una lista corta (3–5) de actividades según criterios opcionales (edades, tiempo, tema); el usuario **elige y edita**; nunca sobrescribe sin confirmación. |
| **Biblioteca `/himnos`** | **Búsqueda asistida** o **re-ranking semántico** sobre el catálogo **ya en MongoDB**; el servidor valida que los resultados sean himnos reales (la IA **no inventa** `number` ni `pageUrl`). |

**Nuevas features recomendadas (mayor valor):**

- **Asistente de preparación** (chat o panel): a partir de un breve contexto familiar, propone un **esquema** de noche (roles sugeridos + tipo de actividad); himnos solo como **sugerencias** acotadas al catálogo o dejados para el flujo manual actual.
- **Generador de actividades ampliado**: ideas con materiales y duración; siempre editable y marcadas como sugerencia.
- **Plantillas inteligentes**: “Noche corta”, “con adolescentes”, etc., generadas o adaptadas con IA bajo demanda.
- **Resumen opcional post-reunión**: si en el futuro existe **campo de notas** por agenda, IA puede proponer un párrafo de recuerdo (solo con consentimiento explícito al enviar ese texto).

**Técnica (alineado a N7):** variables `OPENAI_API_KEY` (u otro proveedor) en servidor; rate limiting y mensajes de error claros; feature flag para desactivar IA en despliegues sin presupuesto.

---

## 12. Siguiente paso contigo

1. Revisa las secciones **3**, **4** y **10** (sobre todo **D4–D7**).  
2. Dime qué **cambiar, quitar o añadir** (puedes ir **una decisión por mensaje**).  
3. Actualizo este documento y el plan; **después** acordamos si implementamos.

---

## Historial de decisiones (breve)

| Fecha (aprox.) | Decisión |
|----------------|----------|
| — | **Himnos:** mantener **scraper** 1001–1210. En el **momento de elegir** himno, la experiencia requerida es **enlace a la página oficial**; reproductor/letra en app pasan a **fuera de MVP** (§3.2 **X5**). |
| — | **Persistencia:** **solo himnos (scraper) en MongoDB**; **miembros, agendas y demás en `localStorage`**. Sin API de familia/FHE. **D7** vía export/import o futuro sync. |
| — | **UI:** minimalista con **light + dark**, default según sistema y **toggle** manual con preferencia persistida. |
| — | **Seguimiento en vivo:** checklist por paso durante la reunión (**M20**), con **diseño prioritario** (**M21**); progreso en `localStorage` por agenda. |
| — | **D1 — Paso 9:** **`activityBy`** (quién dirige) + **`activityDescription`** (texto libre de la actividad); descripción **opcional** en validación. |
| — | **D2 — Miembros:** **CRUD completo** en MVP (añadir, listar, editar nombre, borrar); agendas pasadas conservan texto **congelado** al guardarse. |
| — | **D3 — Agendas:** **Editar** y **borrar** solo en **`planned`**. Tras **“Marcar como realizada”** → **`completed`**: **histórico inmutable** (sin editar, sin borrar, sin tocar `completedSteps`). |
| — | **IA (X6):** Fuera del MVP base; hoja de ruta y límites en **§11.1**; **N7** (API en servidor, himnos solo del catálogo real, opt-in, sin IA en seguimiento ni histórico). |

---

*Última sincronización con el plan interno: requisitos funcionales y técnicos del MVP Noche de Hogar.*
