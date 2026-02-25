# AGENTS.md

## Forma de trabajo

- Idioma de trabajo: Espanol (salvo que se pida otro).
- Cada cambio funcional o documental relevante se confirma con un commit separado.
- Cada commit debe ir seguido de push inmediato al remoto (`git push`).
- Antes de tocar archivos, se describe brevemente el objetivo tecnico del cambio.
- Despues de cada cambio, se valida localmente de forma minima (estructura, carga, ejecucion basica).
- No se reescriben commits existentes salvo pedido explicito.
- Se prioriza mantener una web estatica simple, portable y compatible con GitHub Pages.

## Acuerdos activos de este proyecto

- Objetivo: mapa de cafeterias para salidas de bici con estetica limpia para flyer.
- Prioridad tecnica: simplicidad operativa (sin build) + import flexible de markers.
- Flujo base: importar datos -> ajustar estilo en UI -> modo captura -> screenshot.
- Commits: un commit por bloque de cambio (feature/documentacion/ajuste) para trazabilidad.
- Publicacion: push despues de cada commit para mantener remoto sincronizado.

## Convenciones para este repo

- Evitar dependencias de build cuando no sean necesarias.
- Mantener configuraciones y UI legibles para uso practico en generacion de flyers.
- Documentar en `README.md` como cargar datos y ajustar estilos del mapa.
- Guardar ejemplos de entrada en `data/` cuando aporte valor para pruebas visuales.

## Validacion pre-push con Playwright MCP

- Flujo recomendado de velocidad:
  - Desarrollo iterativo: `npm run test:e2e:quick` (smoke deterministico).
  - Antes de push: `npm run test:e2e` (suite completa).
- Default pre-push: correr primero la suite automatica local con Playwright Test (`npm run test:e2e`) sobre `http://127.0.0.1:4173`.
- La suite automatica debe ser deterministica:
  - Escenarios definidos en specs.
  - Fixture local para import de KML.
  - Logs extensos solo si falla (diagnostico en `test-results/`).
- Si la suite automatica falla, corregir y reintentar; no pasar a push con rojo.
- Usar Playwright MCP como capa manual/visual complementaria, no como reemplazo del test automatizado.
- Para cambios de UI, estilos, flujo de import o captura, correr smoke test manual asistido por Playwright MCP antes de `git push`.
- Levantar la web estatica en local (por ejemplo `python3 -m http.server 4173`) y probar sobre `http://127.0.0.1:4173`.
- Cobertura minima obligatoria del flujo base:
  1. Carga inicial del mapa sin errores visibles.
  2. Import de markers (idealmente con ejemplo en `data/`).
  3. Ajuste de estilos desde UI.
  4. Activacion de modo captura y verificacion de resultado visual.
- Evidencia minima por corrida:
  - `browser_snapshot` de estado inicial y estado final.
  - Screenshot (viewport o full page) del resultado esperado para flyer.
  - `browser_console_messages` en nivel `error` y `warning`.
  - `browser_network_requests` (sin estaticos) para detectar fallos de carga.
- Criterios de pase antes de pushear:
  - Sin errores en consola relacionados a la app.
  - Sin requests criticos fallidos.
  - Flujo base completo ejecutado de punta a punta.
- En cambios visuales relevantes, validar en dos vistas: desktop (ej. `1366x900`) y mobile (ej. `390x844`).
- Handoff de QA con usuario:
  - Tras mis pruebas, no cerrar el browser de Playwright MCP; dejar la pagina lista para prueba manual del usuario.
  - Si el usuario detecta un problema, recolectar logs de la misma sesion abierta (`browser_console_messages` y `browser_network_requests`) antes de reiniciar nada.
  - Solo cerrar la sesion de browser cuando el usuario confirme que ya termino su ronda manual.
