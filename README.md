# SuperCalc v1.0.0

SuperCalc es una aplicación web progresiva de cálculo científico y visualización matemática, desarrollada por **Ing. Rafael Miranda (xII1rst)**. Funciona con JavaScript modular nativo, Canvas 2D y un service worker; no requiere framework, dependencias de npm ni compilación.

Disponible en: https://supercalc-sooty.vercel.app

## Cómo se usa

El launcher abre tres áreas. Cada tarjeta de submódulo conduce a su pantalla o sección correspondiente; dentro de las pantallas, pestañas y tarjetas organizan los formularios. Se introducen datos, se ejecuta una operación y se muestran resultados, pasos o gráficas según el caso. Los controles usan acciones declarativas (`data-action`) enlazadas por un módulo de eventos, no llamadas JavaScript incrustadas en el HTML.

- **Álgebra:** vectores en R²/R³ con suma, productos, proyecciones, ecuaciones, incógnitas, triángulos y figuras 3D; matrices con operaciones, determinantes, inversa, sistemas y eigenvalores; inecuaciones, análisis de funciones y sucesiones/progresiones. El selector agrupa vectores y matrices por un lado, y funciones y relaciones por otro.
- **Física:** electromagnetismo con Coulomb, Gauss, potencial, Lorentz, Faraday y Maxwell; aplicaciones de energía potencial, capacitancia, campo de un hilo, inductancia, ley de Ohm, circuitos RC y FEM por cambio de flujo. El canvas representa vectores y figuras geométricas.
- **Cálculo:** entradas directas a Diferencial, Integral, Multivariable, Ecuaciones diferenciales, Graficador y Curvas. Incluye límites y operaciones entre límites, derivadas y aplicaciones (optimización, Newton-Raphson, teorema del valor medio, continuidad y funciones hiperbólicas), integración simbólica con pasos (sustitución, por partes, fracciones parciales), integral definida e impropia, series infinitas y de Taylor, derivadas parciales, gradiente, integral doble y métodos de EDO. La pestaña Integral añade aplicaciones de la integral (área entre curvas, longitud de arco, superficie de revolución, centroide, trabajo y fuerza hidrostática). La pestaña Curvas cubre curvas paramétricas, coordenadas polares y secciones cónicas. El graficador ofrece funciones lineales, cuadráticas, de valor absoluto, exponenciales, de raíz, logarítmicas y racionales.

En **Integral → Volumen de revolución**, se define `f(x)` y el intervalo `[a,b]`. La región comprendida entre la curva y el eje X gira alrededor del eje elegido:

- Eje X: método de discos, `V = π∫ₐᵇ [f(x)]² dx`.
- Eje Y: método de cascarones, `V = 2π∫ₐᵇ |x|·|f(x)| dx`; `[a,b]` debe quedar a un solo lado de `x = 0` para evitar contar dos veces un volumen superpuesto.

Ambos resultados se aproximan con Simpson 1/3 y se expresan en unidades cúbicas. Los dos temas, oscuro y claro, se pueden alternar desde el launcher; la preferencia se guarda localmente. El service worker almacena los recursos propios para navegación y cálculos sin conexión tras su instalación; la fuente externa es opcional.

## Mapa del proyecto

```text
SuperCalc/
├── index.html                 Pantallas, formularios y acciones declarativas
├── app.js                     Arranque ES y registro de acciones
├── theme.css                  Paletas oscura y clara
├── style.css                  Distribución visual y componentes
├── sw.js                      Caché y funcionamiento offline
├── js/
│   ├── math/                 Cálculos sin DOM ni canvas
│   │   ├── algebra/
│   │   │   ├── matrix.mjs              Matrices y sistemas
│   │   │   ├── vector.mjs              Operaciones vectoriales
│   │   │   ├── vector-equations.mjs    Ecuaciones e incógnitas vectoriales
│   │   │   ├── triangle.mjs            Geometría de triángulos
│   │   │   ├── inequalities.mjs        Solución de inecuaciones
│   │   │   ├── functions.mjs           Análisis de funciones
│   │   │   ├── polynomial.mjs          Utilidades polinómicas
│   │   │   └── sequences.mjs           Sucesiones y progresiones
│   │   ├── calculus.mjs                Límites, derivadas, integrales y volúmenes
│   │   ├── integration.mjs             Integración simbólica (CAS) con pasos
│   │   ├── series.mjs                  Series infinitas y polinomio de Taylor
│   │   ├── numeric.mjs                 Integración numérica e integrales impropias
│   │   ├── integral-applications.mjs   Aplicaciones de la integral definida
│   │   ├── parametric.mjs              Curvas paramétricas
│   │   ├── polar.mjs                   Coordenadas polares
│   │   ├── conics.mjs                  Secciones cónicas
│   │   ├── applications.mjs            Aplicaciones de derivadas y EDO
│   │   ├── electromagnetism.mjs        Fórmulas físicas
│   │   ├── expression.mjs              Lectura numérica de expresiones
│   │   └── graph-types.mjs             Siete tipos del graficador
│   ├── ui/                   DOM, formularios, navegación y eventos
│   │   ├── algebra/
│   │   │   ├── matrix.mjs              Pantalla de matrices
│   │   │   ├── vectors.mjs             Paneles y controles de vectores
│   │   │   ├── inequalities.mjs        Pantalla de inecuaciones
│   │   │   ├── functions.mjs           Pantalla de funciones
│   │   │   └── sequences.mjs           Pantalla de sucesiones
│   │   ├── calculus.mjs                Paneles y resultados de Cálculo
│   │   ├── electromagnetism.mjs        Paneles de electromagnetismo
│   │   ├── electromagnetism-extra.mjs  Aplicaciones físicas
│   │   ├── plotter.mjs                 Controles y tabla del graficador
│   │   ├── navigation.mjs              Launcher, submódulos e historial
│   │   ├── events.mjs                  Delegación de data-action
│   │   ├── figure-controls.mjs         Controles de figuras 3D
│   │   ├── canvas-size.mjs             Ajuste del bitmap al contenedor
│   │   ├── branding.mjs                Logo y presentación
│   │   ├── theme.mjs                   Selector y persistencia del tema
│   │   └── toast.mjs                   Avisos no bloqueantes
│   ├── graphics/             Dibujo con Canvas 2D
│   │   ├── vector-canvas.mjs, em-canvas.mjs
│   │   ├── graph-canvas.mjs, analysis.mjs
│   │   ├── axes.mjs, figures.mjs
│   │   └── colors.mjs, formula-background.mjs
│   ├── state/figures.mjs      Estado de figuras
│   ├── utils/format.mjs       Formato numérico, fracciones y radicales
│   └── offline.mjs            Registro PWA, instalación y actualización
├── tests/                   Pruebas de Node, sin navegador
│   ├── app-ui.test.mjs, events.test.mjs, offline.test.mjs
│   ├── calculus.test.mjs, applications.test.mjs, electromagnetism.test.mjs
│   ├── integration.test.mjs, series.test.mjs, numeric.test.mjs
│   ├── integral-applications.test.mjs, parametric.test.mjs
│   ├── polar.test.mjs, conics.test.mjs
│   ├── matrix.test.mjs, vector.test.mjs, vector-equations.test.mjs
│   ├── inequalities.test.mjs, functions.test.mjs, polynomial.test.mjs
│   ├── sequences.test.mjs, graph-types.test.mjs, format.test.mjs
│   ├── canvas.test.mjs, canvas-size.test.mjs, analysis-graphics.test.mjs
│   ├── figures.test.mjs, formula-background.test.mjs
│   └── theme.test.mjs, toast.test.mjs
└── docs/estado-proyecto.md   Registro técnico de la refactorización
```

El recorrido principal es `HTML → js/ui/events.mjs → app.js → js/ui/ → js/math/ → js/graphics/`. `js/state/` y `js/utils/` sirven a varios dominios; `js/offline.mjs` y `sw.js` gestionan recursos y caché por separado. Los motores de `js/math/` reciben datos y devuelven resultados sin leer la interfaz. Las expresiones introducidas se evalúan localmente y no constituyen un parser seguro para datos de origen no confiable.

## Ejecutar y comprobar

Servir la raíz por HTTP y abrir `http://127.0.0.1:8765/` (los módulos ES y el service worker no se prueban desde `file://`):

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Ejecutar las pruebas automatizadas:

```sh
node --experimental-vm-modules --test tests/*.test.mjs
```

La suite comprueba motores matemáticos, acciones de interfaz simuladas, renderizadores con canvas simulado, temas y precarga offline. La interacción, el aspecto visual y el control offline real se comprueban desde el navegador y sus DevTools.

© 2026 Ing. Rafael Miranda (xII1rst) — SuperCalc
