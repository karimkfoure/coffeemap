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
