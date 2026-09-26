# SuperCalc — Integración total del motor de Cálculo

Plan de cambios + resultados de la prueba de 200 ejercicios.

---

## 1. Resultados de la prueba (200 ejercicios)

Fuentes: `docs/calculo_ejercicios.md` y `docs/calculo_respuestas.md`.

Veredicto por bloque (aproximado, "resoluble" = el motor tiene un camino de cálculo):

| Bloque | Contenido | Resoluble hoy | Huecos principales |
|---|---|---|---|
| **A. Diferencial (1–50)** | Límites 1–15, Derivadas 16–50 | **~47/50** | Límites: exactitud simbólica (`e`, `e³`, `1/2`, `1/e`) y **variables libres / variable del límite**. Derivadas implícitas 41–43 solo numéricas (falta `dy/dx` simbólico). |
| **B. Integral (51–100)** | Indefinidas 51–80, Definidas 81–95, Impropias 96–100 | **~45/50** | Integrales **impropias 96–100** sin soporte. |
| **C. Vectorial (101–150)** | Vectores 101–110, ∇/div/rot 111–125, Línea/teoremas 126–150 | **~13/50** | div, rot, ∇3D, campo conservativo + potencial, integrales de línea/superficie, Green, Gauss, Stokes, curvatura, tangente. |
| **D. Multivariable (151–200)** | Parciales 151–162, Límites/extremos 163–176, Dobles/triples 177–200 | **~20/50** | Mixtas f_xy (161), 3 variables (192), límites multivariable (163–166), direccional (167–169), críticos+Hessiano (170–173, 198), Lagrange (175–176, 196), polares (181–182, 189–190, 199), triples (183–186), jacobiano (187–188), centro de masa (191). |

**Total estimado: ~125/200 resueltos hoy** (y de esos, varios solo numéricos, no exactos).

### Huecos concretos confirmados con sonda
- `lim x→2 [12x²−y]` → devuelve `48` en vez de `48−y` (la variable libre `y` se pasa como 0).
- `lim w→2 [12x²−w]` → «Función inválida» (el parser sólo reconoce `x`/`y`).
- `lim x→0 (1−cos x)/x²` → `0.50004445` en vez de `1/2`.
- `lim x→∞ (1+1/x)^x` → `2.71828183` en vez de `e`.

### Causa raíz
`calcParse` (js/math/expression.mjs:29) construye `new Function(varName, varName==='y'?'x':'y', …)`; sólo acepta `x`/`y`, cualquier otra letra provoca `ReferenceError` → `null`.

---

## 2. Lista de cambios (una sola pasada)

### 0. Limpieza / housekeeping
1. Escribir este análisis a `noCommit/analisis_motor_200.md` (referencia pre-integración).
2. Crear `noCommit/` y mover `docs/calculo_ejercicios.md` y `docs/calculo_respuestas.md` ahí. `docs/estado-proyecto.md` queda en `docs/`.
3. Crear `.gitignore` (no existe) con `noCommit/`.

### 1. Motor base — `js/math/expression.mjs`
4. `calcParse` multi-variable: extraer todos los identificadores libres (regex, filtrando funciones/constantes), deduplicar y construir `new Function(varName, ...otros, body)`. Helper exportado `collectVariables(expr)`.

### 2. Límites simbólicos — `js/math/calculus.mjs`
5. `symbolicLimit(fxStr, aStr, varName)`: tokeniza + `parseExpr` (ya exportados en línea 895), sustituye `varName → evalA(aStr)`, `simplify` + `astToStr`. Variables libres → string simbólico (`48 − y`, `12x² − 2`); numérico → valor directo.
6. `substAST(node, varName, valueNode)` (utilidad interna).
7. L'Hôpital simbólico para `0/0` y `∞/∞` con `diffAST` → `1/2` exacto para `(1−cos x)/x²`.
8. Reconocimiento `1^∞`: `(1 + c/x)^(k·x) → e^(c·k)` (y `(1+1/x)ˣ → e`).
9. `computeLimit`: probar `symbolicLimit` primero; si hay variables libres, emitir simbólico; si no, flujo numérico actual.
10. `toExact`: reconocer `e` y `√π`.

### 3. Integrales definidas e impropias — `js/math/integration.mjs` + `js/math/calculus.mjs`
11. `definiteIntegral(fxStr, a, b, varName)`: antiderivada simbólica (`integrate`) → `F(b)−F(a)` exacto; si impropia → `improperIntegral`; si no → `simpsonIntegral`.
12. `improperIntegral(fn, a, b, opts)`: transformación `x = a + t/(1−t)` para `[a,∞)` (y análogos), Simpson sobre intervalo finito, detección de divergencia. Cubre 96–100.
13. `calcIntegralDef` (UI): usar `definiteIntegral` y mostrar antiderivada + evaluación como pasos.

### 4. Cálculo vectorial — nuevo `js/math/vector-calculus.mjs` (puro)
14. `divergence(Fx,Fy,Fz,x,y,z)` y `curl(Fx,Fy,Fz,x,y,z)` (diferencias centrales, 2D/3D).
15. `gradient3D(f,x,y,z)`.
16. `isConservative2D(Fx,Fy)` / `potentialFunction2D(Fx,Fy)`.
17. `lineIntegralScalar(f,r,t0,t1)` (∫ f ds) y `lineIntegralVector(Fx,Fy,r,t0,t1)` (∫ F·dr).
18. `greenLineIntegral(P,Q,region)`, `fluxDivergenceTheorem(F,region)` (Gauss), `stokesLineIntegral(F,disk)`.
19. `curvature(r,t)` = `|r'×r''|/|r'|³`, `unitTangent(r,t)`, `unitNormal(r,t)`.
20. `arcLengthParametric` ya existe en `js/math/parametric.mjs` → reusar.

### 5. Multivariable — nuevo `js/math/multivariable.mjs` (puro)
21. `mixedPartial(fxyStr, ordX, ordY)` (componer `symbolicDeriv` con distinto `varName`) y `partial3D(fxyzStr, varName)`.
22. `multivariableLimit(fxyStr, x0, y0)` (varias trayectorias, informa existencia).
23. `criticalPoints2D(fxyStr, region)` + clasificación por Hessiano `D = f_xx·f_yy − f_xy²`.
24. `lagrangeMultipliers(fxyStr, gxyStr, c)` (∇f = λ∇g, g=c).
25. `directionalDerivative(f,x0,y0,dir)` y magnitud de máximo crecimiento.
26. `doubleIntegralPolar(...)`, `tripleIntegral(...)` (midpoint 3D), `jacobian2D(...)`, `centerOfMass2D(...)`.

### 6. UI — `js/ui/calculus.mjs` + `index.html` + `style.css`
27. **Enter dispara el cálculo**: listener `keydown` en `#calc-app`; si `Enter` sobre `.calc-inp`, `btn.click()` al botón primario (`.calc-btn:not(.sec)`), reutilizando `bindActions`.
28. **Toggle del sólido de revolución**: estado `showRevSolid=false` + `toggleRevSolid()`; markup `.icon-tog` `#rev-fig-tog` (patrón de `#fig-tog` de vectores); el sólido se dibuja sólo si el toggle está ON. Las previews 2D en vivo quedan siempre encendidas.
29. **Pasos/procedimientos** (patrón `mathTogSteps`): derivada (`symbolicDerivSteps`), integral definida (antiderivada + `F(b)−F(a)`), nuevos solvers con `steps:[]`. Límites y CAS ya muestran pasos → verificar.
30. **Nuevas tarjetas en `#calc-pMul`**: `card-vec` (ops vectoriales), `card-divcurl` (∇/div/rot), `card-conserv` (conservativo+potencial), `card-lineint` (línea/Green/Gauss/Stokes/longitud/curvatura), `card-mvlim` (límites multivariable), `card-extr` (críticos+Lagrange), `card-mvint` (polar/triple/jacobiano/centro de masa).
31. Nuevas funciones de cálculo en `js/ui/calculus.mjs` exportadas (para `...calculusUI` en `app.js`).
32. `style.css`: estilos mínimos para las nuevas tarjetas y el toggle del sólido.

### 7. Service worker + tests
33. `sw.js`: precachear `js/math/vector-calculus.mjs` y `js/math/multivariable.mjs` (lo exige `tests/offline.test.mjs`).
34. `tests/app-ui.test.mjs`: añadir las dos entradas al `Map` de enlazado.
35. Tests nuevos: `tests/vector-calculus.test.mjs`, `tests/multivariable.test.mjs`, `tests/symbolic-limit.test.mjs`, `tests/improper.test.mjs`.

---

## 3. Archivos

- **Modificar**: `js/math/expression.mjs`, `js/math/calculus.mjs`, `js/math/integration.mjs`, `js/ui/calculus.mjs`, `index.html`, `style.css`, `sw.js`, `tests/app-ui.test.mjs`.
- **Crear**: `js/math/vector-calculus.mjs`, `js/math/multivariable.mjs`, `tests/vector-calculus.test.mjs`, `tests/multivariable.test.mjs`, `tests/symbolic-limit.test.mjs`, `tests/improper.test.mjs`, `noCommit/analisis_motor_200.md`, `.gitignore`.
- **Mover**: `docs/calculo_ejercicios.md`, `docs/calculo_respuestas.md` → `noCommit/`.

## 4. Reutilización (no reinventar)
- `tokenize/parseExpr/diffAST/simplify/collectTerms/astToStr/evalAST/isConst` — `js/math/calculus.mjs:895`.
- `vmag/vdot/vcross/vangle/vproj` — `js/math/algebra/vector.mjs`.
- `integrate` (CAS) — `js/math/integration.mjs:788`; `simpsonIntegral`, `midpointIntegral2D`, `partialDerivative`, `gradient2D` — `js/math/calculus.mjs`.
- Toggle de figura: `toggleFigure` + `.icon-tog` — `js/ui/algebra/vectors.mjs:83-87` e `index.html:148`.
- Pasos colapsables: `mathTogSteps` — `js/ui/algebra/vectors.mjs:49-59` y CSS `.math-steps-tog/.math-steps-body` — `style.css:283-292`.
- Dispatch declarativo: `bindActions` — `js/ui/events.mjs`.

## 5. Verificación
- `node --experimental-vm-modules --test tests/*.test.mjs` → todo verde.
- `python3 -m http.server 8765 --bind 127.0.0.1` → `http://127.0.0.1:8765`:
  - Límites: `12*x^2 - y` en `x→2` → `48 − y`; var `w` → `12x² − 2`; `(1−cos x)/x²` → `1/2`; `(1+1/x)^x` → `e`.
  - Integrales: `x^2` en [0,1] → `1/3`; impropias 96–100 (incl. `√π`, divergencia de `∫1/x`).
  - Volumen de revolución: toggle FIG muestra/oculta el sólido; drag rota, rueda zoom.
  - Enter dispara el cálculo en cualquier `.calc-inp`.
  - Pasos visibles en derivada, integral definida y solvers nuevos.
