# AGENTS.md

## Fuente de verdad del proyecto

- `README.md` es la referencia principal para:
  - descripcion funcional del producto;
  - instrucciones de uso local;
  - estrategia de testing;
  - deploy en GitHub Pages.
- Evitar duplicar en este archivo instrucciones operativas que ya vivan en `README.md`.
- Si cambia el flujo de uso, testing o deploy, primero actualizar `README.md` y luego ajustar este `AGENTS.md` solo si cambia metodologia.

## Metodologia de trabajo

- Idioma: Espanol (salvo pedido explicito).
- Antes de editar archivos, describir en una frase el objetivo tecnico del cambio.
- Mantener la solucion simple, estatica y portable (sin build innecesario).
- Hacer cambios chicos y trazables por bloque funcional.
- Validar localmente de forma minima despues de cada cambio relevante.
- No reescribir historial de commits salvo pedido explicito.

## Validacion y criterio de tests

- Siempre probar en local como default (`http://127.0.0.1:4173`).
- Seleccion de nivel de test segun impacto:
  - Solo docs/meta: validacion minima, sin E2E obligatorio.
  - Cambio acotado de bajo riesgo: `npm run test:e2e:quick`.
  - Cambio funcional o de riesgo medio/alto: `npm run test:e2e`.
- Se considera riesgo medio/alto si se toca:
  - `src/main.js`, `src/core/**`, `src/modules/**`, `index.html`.
  - Flujo de import de datos, presets, basemap, camara/encuadre, modo captura, capas o labels.
  - `playwright.config.js`, tests/helpers/specs, scripts de test en `package.json`.
- Si hay duda, usar el camino seguro: suite completa.
- Si la suite falla, corregir y reintentar; no hacer push en rojo.
- Playwright MCP se usa para validacion manual complementaria (no reemplaza E2E automatizado).
- Cobertura minima en QA manual:
  1. Carga inicial del mapa.
  2. Import de markers.
  3. Ajuste de estilos/preset/basemap.
  4. Modo captura y verificacion visual.
- Evidencia minima en QA manual:
  - Snapshot inicial y final.
  - Screenshot final.
  - Console `warning/error`.
  - Network requests sin estaticos.
- Si se realiza ronda manual con MCP, dejar el browser abierto para QA del usuario y recolectar logs de esa misma sesion ante fallas.
- En cambios visuales relevantes, validar desktop y mobile.

## Commits y publicacion

- Un commit por bloque de cambio relevante (feature, fix, docs, refactor).
- Despues de cada commit, push inmediato (`git push`).
- Mantener `main` deployable en GitHub Pages en todo momento.

## Auto-mejora continua del agente

- Si aparece una falla no cubierta por tests, agregar/ajustar un escenario deterministico general (no parche puntual) y documentar la regla en `README.md` o `AGENTS.md` segun corresponda.
- Si surge friccion repetida del flujo (test lento, paso manual ambiguo, criterio difuso), proponer simplificacion y codificarla en estas guias dentro del mismo bloque de trabajo.
- Mantener `AGENTS.md` metodologico y `README.md` operativo: cuando una regla se vuelva instruccion de uso, moverla a README y dejar en AGENTS solo el criterio.
- Priorizar mejoras incrementales de alto impacto/ bajo costo en cada iteracion (quick wins de DX/QA antes de cambios complejos).
