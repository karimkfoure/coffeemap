# Bike & Coffee Flyer Map

Web estatica para preparar un mapa limpio de cafeterias y generar estilos visuales listos para compartir/capturar en flyers.

## Que resuelve

- Carga automaticamente una fuente fija de Google My Maps al abrir la app.
- No muestra markers hasta terminar la descarga del KML (con overlay de loading).
- Permite filtrar por layer del KML.
- Usa MapLibre GL (vector) para controlar visibilidad y estilo por componentes reales del mapa.
- Incluye controles amplios para estilo: capas base, colores por componente, labels base, cafeterias, atmosfera, poster y canvas.
- Incluye presets visuales y paneles colapsables para ajustes finos.
- Incluye modo captura para ocultar el panel lateral y exportar screenshot manualmente.

## Uso local

Abrir `index.html` directamente en navegador, o levantar un servidor estatico:

```bash
python3 -m http.server 8080
```

Luego ir a `http://localhost:8080`.

## Tests E2E automatizados (Playwright)

La validacion automatica corre en local por defecto sobre `http://127.0.0.1:4173`.

Instalacion inicial:

```bash
npm install
npx playwright install chromium
```

Ejecucion:

```bash
# ciclo corto de desarrollo (smoke)
npm run test:e2e:quick

# suite completa
npm run test:e2e
```

Opciones utiles:

```bash
npm run test:e2e:headed
npm run test:e2e:ui
```

Notas de la suite:

- Usa fixture KML local para el flujo de import (`tests/fixtures/cafes-sample.kml`) y evitar dependencia de red en los escenarios de datos.
- La suite completa esta consolidada en un flujo unico con `test.step` para evitar recargar la app varias veces.
- Guarda trazas/screenshot/diagnostico solo cuando falla un test (`test-results/`).
- El reporte por consola es corto en verde; el detalle largo se revisa solo en rojo.

## Fuente de datos

- URL fija de My Maps (configurada en `app.js`): se toma el `mid`, se descarga KML y se parsean `Placemark -> Point`.
- Si hay carpetas/layers en el KML, se habilita selector de layer para visualizar subconjuntos.

## Flujo recomendado para flyer

1. Esperar que carguen los puntos por defecto.
2. Elegir layer (opcional).
3. Aplicar un preset base.
4. Ajustar estilo visual por bloques colapsables (capas, colores, labels, atmosfera, etc).
5. Definir ratio de salida y margen externo para encuadre.
6. Activar `Modo captura` y sacar screenshot.

## Controles destacados

- `Capas del mapa`: agua, parques, landuse, calles principales/secundarias, edificios, limites y familias de labels.
- `Colores por componente`: fondo, agua, verde, rutas, edificios, limites + opacidades por categoria.
- `Refinado global`: brillo, contraste, saturacion, grises y tono.
- `Etiquetas base`: color, opacidad, halo, escala de tamano y transform.
- `Cafeterias`: marker, halo, sombra, dispersion, modo de texto y estilo de etiqueta.
- `Atmosfera y poster`: tint, vignette, grano, marco y bloque de titulo/subtitulo.
- `Vista y encuadre`: ratio, padding, pitch, bearing, centro/zoom y modo captura.

## Deploy en GitHub Pages (sin build)

1. Subir este repo a GitHub.
2. Ir a `Settings -> Pages`.
3. En `Build and deployment`, elegir `Deploy from a branch`.
4. Seleccionar branch `main` y carpeta `/ (root)`.
5. Guardar y esperar el publish.

GitHub Pages va a servir directamente `index.html`.

## Estructura

- `index.html`: layout del estudio visual + controles jerarquicos colapsables.
- `styles.css`: look & feel, overlays, poster y canvas.
- `app.js`: MapLibre GL + carga fija desde My Maps + presets + estilado por capas.
