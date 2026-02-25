# MechiMap

Web estatica para crear mapas de cafeterias con estilo editorial, pensada para salidas de bici y generacion de flyers.

## Objetivo funcional

La app resuelve este flujo de punta a punta:

1. Cargar puntos de cafeterias desde una fuente KML.
2. Ajustar estilo visual del mapa y de los markers desde UI.
3. Cambiar preset/motor base sin romper el estado visual.
4. Entrar en modo captura y exportar screenshot manual para flyer.

## Funcionalidades principales

- Mapa vectorial con MapLibre GL.
- Fuente de datos base (Google My Maps) + parsing de KML.
- Filtro por layers del KML cuando existen carpetas/categorias.
- Presets visuales y ajustes finos por bloques (capas, colores, labels, atmosfera, poster, canvas).
- Selector de basemap (OpenFreeMap y CARTO).
- Modo captura para ocultar panel y priorizar encuadre.

## Fuente de datos

- Fuente por defecto: Google My Maps (URL fija definida en `src/core/constants.js`).
- Flujo de carga:
  1. Se toma el `mid` desde la URL.
  2. Se descarga KML.
  3. Se parsean `Placemark -> Point` para construir markers.
- Durante la carga, se muestra overlay para evitar estados intermedios rotos.
- Si el KML incluye carpetas/layers, se habilita filtro por layer en UI.

## Basemaps incluidos

- OpenFreeMap: `Bright`, `Positron`, `Liberty`, `Dark`.
- CARTO: `Voyager`, `Positron`, `Dark Matter`.

Todos se consumen como estilos vectoriales compatibles con MapLibre GL.

## Controles destacados

- `Capas del mapa`: agua, parques, landuse, calles principales/secundarias, edificios, limites, labels.
- `Colores por componente`: fondo, agua, verde, rutas, edificios, limites (con opacidades).
- `Refinado global`: brillo, contraste, saturacion, grises y tono.
- `Etiquetas base`: color, opacidad, halo, escala y transform.
- `Cafeterias`: marker, halo, sombra, dispersion y texto.
- `Atmosfera y poster`: tint, vignette, grano, marco, titulo y subtitulo.
- `Vista y encuadre`: ratio, padding, pitch, bearing, centro/zoom y modo captura.

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

1. Esperar carga inicial del mapa y markers.
2. Elegir layer de datos (opcional).
3. Aplicar un preset base.
4. Ajustar controles visuales segun el objetivo del flyer.
5. Ajustar ratio y encuadre.
6. Activar `Modo captura`.
7. Tomar screenshot manual.

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

# suite completa
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
- La suite prioriza contratos de estabilidad de UI luego de acciones asincronas (preset/basemap/import).
- El output de consola se mantiene corto cuando pasa; el analisis largo se hace solo cuando falla.

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

## Deploy (GitHub Pages, sin build)

1. Push de `main` al remoto.
2. Ir a `Settings -> Pages`.
3. En `Build and deployment`, elegir `Deploy from a branch`.
4. Seleccionar branch `main` y carpeta `/ (root)`.
5. Guardar y esperar publicacion.

GitHub Pages sirve directamente `index.html`.

## Estructura del proyecto

- `index.html`: layout y controles del estudio.
- `styles.css`: estilos globales, overlays y modo captura.
- `src/main.js`: bootstrap y wiring principal.
- `src/core/*`: estado compartido, constantes y utilidades base.
- `src/modules/*`: modulos funcionales (mapa, capas, datos, eventos, UI).
- `tests/*`: suite E2E y helpers de Playwright.

## Fuente de verdad para operacion

Este README concentra descripcion funcional del proyecto y todas las instrucciones de uso local, testing y deploy.
