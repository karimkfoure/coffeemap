# Bike & Coffee Flyer Map

Web estatica para preparar un mapa limpio de cafeterias, ajustar su estilo visual y sacar capturas para flyers.

## Que resuelve

- Muestra una ciudad con un basemap simplificado.
- Destaca cafeterias con markers configurables.
- Permite cargar datos desde export de Google My Maps (`.kml`) o desde `.geojson/.json`.
- Permite importar directo pegando la URL de Google My Maps (viewer o KML), sin descarga manual.
- Incluye modo captura para ocultar el panel lateral y exportar screenshot manualmente.

## Uso local

Abrir `index.html` directamente en navegador, o levantar un servidor estatico:

```bash
python3 -m http.server 8080
```

Luego ir a `http://localhost:8080`.

## Formatos de entrada soportados

1. `KML` (export de Google My Maps) con `Placemark -> Point`.
2. `GeoJSON` (`FeatureCollection` de `Point`).
3. URL de Google My Maps (`viewer?mid=...`) o URL KML.
4. `JSON` con arreglo de objetos tipo:

```json
[
  { "name": "Cafe 1", "lat": -31.42, "lng": -64.18 },
  { "name": "Cafe 2", "latitude": -31.43, "longitude": -64.19 }
]
```

## Flujo recomendado para flyer

1. Pegar URL de Google My Maps y usar `Importar desde My Maps`.
2. Si el KML trae varias capas, seleccionar `Layer` desde la UI.
3. Ajustar base, colores, tamano de marcador y etiquetas.
4. Usar `Modo captura` para ocultar controles.
5. Sacar screenshot del mapa final.

Si el import directo falla por permisos/CORS, usar carga manual con archivo `KML` o `GeoJSON`.

## Deploy en GitHub Pages (sin build)

1. Subir este repo a GitHub.
2. Ir a `Settings -> Pages`.
3. En `Build and deployment`, elegir `Deploy from a branch`.
4. Seleccionar branch `main` y carpeta `/ (root)`.
5. Guardar y esperar el publish.

GitHub Pages va a servir directamente `index.html`.

## Estructura

- `index.html`: layout y controles.
- `styles.css`: look & feel y modo captura.
- `app.js`: mapa Leaflet, parsers y logica de UI.
- `data/cafes-ejemplo.geojson`: dataset de ejemplo.
