# CoffeeMap

Web estatica para crear mapas de cafeterias con estilo editorial, pensada para salidas de bici y generacion de flyers.

## Objetivo funcional

La app resuelve este flujo de punta a punta:

1. Cargar puntos de cafeterias desde una fuente KML.
2. Ajustar estilo visual del mapa y de los markers desde UI.
3. Cambiar preset/motor base sin romper el estado visual.
4. Entrar en modo captura y exportar PNG desde la UI o tomar screenshot manual para flyer.

## Funcionalidades principales

- Mapa vectorial con MapLibre GL.
- Fuente de datos base (Google My Maps) + parsing de KML.
- Filtro por layers del KML cuando existen carpetas/categorias.
- Presets visuales y ajustes finos por bloques (capas, colores, labels, atmosfera, poster, canvas).
- Variantes de marcador para cafeterias (`Sello`, `Punto`, `Anillo`, `Diana`) con opcion de mostrar indice dentro del marcador.
- Selector de basemap agrupado por proveedor (OpenFreeMap, CARTO, Stadia), con variantes `NoLabels` y estilos disruptivos.
- Modo captura para ocultar panel y priorizar encuadre.
- Exportacion PNG 2x del viewport actual del mapa, incluyendo atmosfera, marco y poster.

## Fuente de datos

- Fuente por defecto: Google My Maps (URL fija definida en `src/core/constants.js`).
- Flujo de carga:
  1. Se toma el `mid` desde la URL.
  2. Se descarga KML.
  3. Se parsean `Placemark -> Point` para construir markers.
- Durante la carga, se muestra overlay para evitar estados intermedios rotos.
- Si el KML incluye carpetas/layers, se habilita filtro por layer en UI.

## Basemaps incluidos

- OpenFreeMap:
  - `Bright`, `Positron`, `Liberty`, `Dark`.
- CARTO:
  - `Voyager`, `Positron`, `Dark Matter`.
  - `Voyager NoLabels`, `Positron NoLabels`, `Dark Matter NoLabels`.
- Stadia:
  - `Stamen Toner`, `Stamen Toner Lite`, `Stamen Toner Dark`.
  - `Stamen Terrain`, `Stamen Watercolor`.
  - `Outdoors`, `Alidade Smooth`, `Alidade Smooth Dark`, `Alidade Satellite`, `OSM Bright`.

Todos se consumen como estilos vectoriales compatibles con MapLibre GL.

### Auth y uso por proveedor

- Sin API key:
  - OpenFreeMap.
  - CARTO (`basemaps.cartocdn.com`), incluyendo variantes `NoLabels`.
- Con auth por dominio (ya configurada en Stadia):
  - Todos los estilos `tiles.stadiamaps.com` listados arriba.
- No usamos en este repo:
  - Endpoints raster legacy de Stadia/Stamen.
  - Estilos que requieran inyectar token en URL desde cliente.

Comportamiento de precedencia:

- Al aplicar un preset, los valores del preset tienen prioridad sobre ajustes finos previos en controles conflictivos.
- Al cambiar basemap manualmente desde el selector, se limpian overrides conflictivos (colores/componentes, labels base, filtros globales y atmosfera) para evitar residuos visuales del estilo anterior.

## Controles destacados

- `Capas del mapa`: agua, parques, landuse, calles principales/secundarias, edificios, limites, labels.
- `Capas del mapa`: si un grupo no existe en el style activo, su toggle queda deshabilitado para evitar no-ops/confusion.
- `Motor`: selector agrupado por proveedor (OpenFreeMap, CARTO, Stadia).
- `Edicion creativa`: perfil rapido, jerarquia de labels, acento visual, escala de trazos/rio, foco de features y transformacion geometrica. Los escalados aplican tambien cuando el style usa expresiones (`step`/`interpolate`).
- `Entidades del style activo`: editor dinamico por capas reales del basemap actual (`source-layer`) con visibilidad, color, opacidad y trazo cuando el style lo soporta.
- `Colores por componente`: fondo, agua, verde, rutas, edificios, limites (con opacidades).
- `Refinado global`: brillo, contraste, saturacion, grises y tono.
- `Etiquetas base`: color, opacidad, halo, escala y transform.
- `Cafeterias`: variante de marcador, indice dentro del marker, halo, sombra, dispersion y texto. Las variantes no circulares regeneran el pin al vuelo y sobreviven al cambio de basemap.
- `Atmosfera y poster`: tint, vignette, grano, marco, titulo y subtitulo.
- `Vista y encuadre`: ratio, padding, pitch, bearing, centro/zoom, modo captura y descarga PNG 2x.

## Requisitos

- Navegador moderno.
- Python 3 (para servidor estatico local).
- Node.js 18+ (solo para correr tests E2E).

## Ejecutar en local

Servidor estatico recomendado:

```bash
python3 -m http.server 4173
```

Abrir:

```text
http://127.0.0.1:4173
```

## Uso funcional de la web

La carga inicial abre con `Default Toner Lite`: `Stamen Toner Lite`, zoom `11.99`, labels de cafeterias con halo al maximo y offset alto, y entidades `place`, `water_name`, `poi` y `transportation_name` apagadas.

1. Esperar carga inicial del mapa y markers.
2. Elegir layer de datos (opcional).
3. Aplicar un preset base.
4. Ajustar controles visuales segun el objetivo del flyer.
5. Ajustar ratio y encuadre.
6. Activar `Modo captura`.
7. Descargar PNG desde `Descargar PNG` o tomar screenshot manual.

## Testing (Playwright)

Instalacion inicial:

```bash
npm install
npx playwright install chromium
```

Ejecucion:

```bash
# smoke / feedback rapido
npm run test:e2e:quick

# suite completa (catalogo completo de basemaps + presets + flujo combinado)
npm run test:e2e
```

Modos utiles de depuracion:

```bash
npm run test:e2e:headed
npm run test:e2e:ui
```

Notas:

- Los tests corren en local sobre `http://127.0.0.1:4173`.
- Se usa fixture local para import (`tests/fixtures/cafes-sample.kml`) para mejorar determinismo.
- Artefactos detallados se revisan solo en falla (`test-results/`).
- `quick` valida smoke + switch de basemaps representativos (proveedores/estilos extremos) y contrato de no-bloqueo.
- `full` recorre todo el catalogo de basemaps y presets, incluyendo `import -> preset -> basemap -> captura`.
- La suite prioriza contratos de estabilidad de UI luego de acciones asincronas (preset/basemap/import).
- El output de consola se mantiene corto cuando pasa; el analisis largo se hace solo cuando falla.
- Los sliders (`input[type="range"]`) soportan doble click para volver al valor default, incluyendo sliders creados dinamicamente en `Entidades del style activo`.

## QA manual asistido (Playwright MCP)

- Usar siempre entorno local.
- Flujo minimo a validar:
  1. Carga inicial del mapa.
  2. Import de markers.
  3. Cambios de estilo/preset/basemap.
  4. Modo captura + verificacion visual.
- Evidencia recomendada:
  - `browser_snapshot` inicial y final.
  - screenshot final del resultado.
  - consola (`error`/`warning`) y requests no estaticos.

## Deploy (GitHub Pages via Actions, sin build)

Este repo despliega con `.github/workflows/pages.yml` y publica el sitio estatico sin paso de build.

Reglas de disparo:

- Push a `main` con cambios de runtime del sitio: dispara deploy.
- Cambios solo de documentacion (`*.md`, `docs/**`) o cambios solo en `.github/**`: no disparan deploy automatico.
- Deploy manual disponible con `workflow_dispatch` desde GitHub Actions.

Configuracion inicial en GitHub:

1. Ir a `Settings -> Pages`.
2. En `Build and deployment`, elegir `Source: GitHub Actions`.
3. Verificar que el workflow `Deploy Pages` quede habilitado.

## Estructura del proyecto

- `index.html`: layout y controles del estudio.
- `styles.css`: estilos globales, overlays y modo captura.
- `src/main.js`: bootstrap y wiring principal.
- `src/core/*`: estado compartido, constantes y utilidades base.
- `src/modules/*`: modulos funcionales (mapa, capas, datos, eventos, UI).
- `tests/*`: suite E2E y helpers de Playwright.

## Fuente de verdad para operacion

Este README concentra descripcion funcional del proyecto y todas las instrucciones de uso local, testing y deploy.
