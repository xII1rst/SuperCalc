# SuperCalc v1.0

SuperCalc es una aplicación web progresiva de cálculo científico y visualización matemática, desarrollada por **Rafael Miranda**. Funciona con JavaScript modular nativo, Canvas 2D y un service worker; no requiere framework, dependencias de npm ni compilación.

Disponible en: https://supercalc-sooty.vercel.app

## Cómo se usa

**Buscar herramienta** encuentra calculadoras por nombre, tema y palabras clave en español o inglés, sin conexión. Está disponible en la portada, los menús y el botón de lupa de cada pantalla; **Ctrl+K** o **⌘K** abre la búsqueda desde cualquier herramienta. Las flechas recorren los resultados, Enter abre el primero desde el campo de búsqueda y Esc cierra el diálogo. Los resultados de operaciones específicas abren su ficha o seleccionan su modo automáticamente.

El launcher abre **Matemáticas** y **Física**. Matemáticas reúne Álgebra, Cálculo, Estadística, Probabilidad y Experimentos; Física reúne Electromagnetismo y Mecánica. Cálculo, Probabilidad, Experimentos y Mecánica muestran un menú de funciones antes de abrir un formulario individual; Atrás regresa a ese menú. Estadística abre directamente su único análisis. Se introducen datos, se ejecuta una operación y se muestran resultados, pasos o gráficas según el caso. Los controles usan acciones declarativas (`data-action`) enlazadas por un módulo de eventos, no llamadas JavaScript incrustadas en el HTML.

- **Álgebra:** vectores en R²/R³ con suma, productos, proyecciones, ecuaciones, incógnitas, triángulos y figuras 3D; matrices con operaciones, determinantes, inversa, sistemas y eigenvalores; inecuaciones, análisis de funciones y sucesiones/progresiones. El selector agrupa vectores y matrices por un lado, y funciones y relaciones por otro.
- **Cálculo:** entradas directas a Diferencial, Integral, Multivariable, Ecuaciones diferenciales, Graficador y Curvas. Incluye límites y operaciones entre límites, derivadas y aplicaciones (optimización, Newton-Raphson, teorema del valor medio, continuidad y funciones hiperbólicas), integración simbólica con pasos (sustitución, por partes, fracciones parciales), integral definida e impropia, series infinitas y de Taylor, derivadas parciales, gradiente, integral doble y métodos de EDO. La pestaña Integral añade aplicaciones de la integral (área entre curvas, longitud de arco, superficie de revolución, centroide, trabajo y fuerza hidrostática). La pestaña Curvas cubre curvas paramétricas, coordenadas polares y secciones cónicas. El graficador ofrece funciones lineales, cuadráticas, de valor absoluto, exponenciales, de raíz, logarítmicas y racionales.
- **Estadística:** análisis descriptivo de hasta 10 000 datos: media, mediana, moda, rango, cuartiles, percentil personalizado, rango intercuartílico, varianza y desviación estándar poblacional y muestral. Los percentiles usan interpolación lineal; los resultados incluyen histograma y diagrama de caja.
- **Probabilidad:** combinaciones, probabilidades binomiales exactas y acumuladas para hasta 1000 ensayos, y distribución de la suma de hasta 12 dados de seis caras.
- **Experimentos:** simulaciones de hasta 10 000 lanzamientos de dado o moneda, con frecuencias observadas comparadas con sus probabilidades teóricas y una vista previa de la secuencia. Calcula entre 1 y 100 cifras decimales de π con la serie de Chudnovsky y enteros de precisión arbitraria.
- **Física:** electromagnetismo con Coulomb, Gauss, potencial, Lorentz, Faraday y Maxwell; aplicaciones de energía potencial, capacitancia, campo de un hilo, inductancia, ley de Ohm, circuitos RC y FEM por cambio de flujo. Mecánica resuelve MRU, MRUA, tiro parabólico sin resistencia del aire, fuerza neta y energías cinética y potencial. Cada magnitud tiene selector de unidad; se pueden dejar incógnitas en blanco y elegir qué despejar. Se muestran las magnitudes deducibles, conversiones a SI, fórmulas con sustituciones y, cuando hay dos soluciones físicas, un selector. El tiempo explorado mueve el punto y los vectores en los gráficos de movimiento.

En **Integral → Volumen de revolución**, se define `f(x)` y el intervalo `[a,b]`. La región comprendida entre la curva y el eje X gira alrededor del eje elegido:

- Eje X: método de discos, `V = π∫ₐᵇ [f(x)]² dx`.
- Eje Y: método de cascarones, `V = 2π∫ₐᵇ |x|·|f(x)| dx`; `[a,b]` debe quedar a un solo lado de `x = 0` para evitar contar dos veces un volumen superpuesto.

Ambos resultados se aproximan con Simpson 1/3 y se expresan en unidades cúbicas. Los dos temas, «Pizarra» (oscuro, degradado violeta → aqua) y «Papel» (claro, degradado melocotón → azul pizarra), se alternan desde el launcher; la preferencia se guarda localmente. Cada menú y herramienta tiene su enlace directo (por ejemplo `#/ca/calc-int` abre Integral) y todos los controles funcionan con teclado. El service worker almacena los recursos propios para navegación y cálculos sin conexión tras su instalación; las fuentes externas (IBM Plex Sans y JetBrains Mono) son opcionales.

## Mapa del proyecto

```text
SuperCalc/
├── index.html                                      HTML generado al ensamblar shell y fragmentos de html/
├── app.js                                          Arranque ES y composición del registro de acciones
├── theme.css                                       Paletas de los temas Pizarra y Papel
├── sw.js                                           Precarga, caché y servicio de recursos sin conexión
├── README.md                                       Uso, mapa del proyecto y comandos de comprobación
├── .gitignore                                      Exclusión de noCommit/ del control de versiones
├── html/                                           Fuentes del marcado ensamblado en index.html
│   ├── shell.html                                  Documento base, recursos e inclusiones de fragmentos
│   ├── shared/                                     Fragmentos comunes
│   │   ├── icons.html                              Símbolos SVG reutilizables de la interfaz
│   │   ├── launcher.html                           Portada, logo y acceso a Matemáticas y Física
│   │   ├── search.html                             Diálogo y acceso global a la búsqueda de herramientas
│   │   └── submenu.html                            Contenedor del selector de submódulos
│   └── screens/                                    Fragmentos de pantallas y formularios
│       ├── calculus/                               Fragmentos de la pantalla de Cálculo
│       │   ├── header.html                         Cabecera de Cálculo y control del sólido de revolución
│       │   ├── differential.html                   Límites, derivadas, análisis y aplicaciones
│       │   ├── integral-1.html                     Integrales indefinidas, definidas y revolución
│       │   ├── integral-2.html                     Taylor, integración simbólica, series y aplicaciones
│       │   ├── multivariable-1.html                Parciales, gradiente, integral doble y curvas
│       │   ├── multivariable-2.html                Divergencia, rotacional, campos e integrales de línea
│       │   ├── multivariable-3.html                Límites, extremos e integrales múltiples
│       │   ├── ode.html                            Formularios de EDO separables, lineales y de orden dos
│       │   ├── plotter.html                        Selector, entradas y lienzo del graficador
│       │   └── curves.html                         Formularios de curvas paramétricas, polares y cónicas
│       ├── electromagnetism-advanced.html          Formulario de electromagnetismo por familias
│       ├── electromagnetism.html                   Pantalla de electromagnetismo con lienzo y paneles
│       ├── experiments.html                        Formularios de dados, moneda y cifras de π
│       ├── functions.html                          Selector y formulario de análisis de funciones
│       ├── geometry.html                           Formulario de rectas y planos en R³
│       ├── inequalities.html                       Selector y formularios de inecuaciones
│       ├── linear-spaces.html                      Formulario de bases y transformaciones lineales
│       ├── logic.html                              Formulario de lógica matemática por paneles
│       ├── matrices.html                           Operaciones, sistemas y espacios de matrices
│       ├── mechanics-advanced.html                 Formulario de mecánica por familias
│       ├── mechanics.html                          Formularios de movimiento, tiro, fuerza y energía
│       ├── numerical.html                          Formulario de análisis numérico por paneles
│       ├── probability.html                        Combinaciones, binomial y suma de dados
│       ├── sequences.html                          Términos, recurrencias y progresiones
│       ├── statistics.html                         Entrada de datos y resultados estadísticos
│       ├── study.html                              Formulario de aplicaciones de cálculo por familias
│       ├── theory.html                             Selector de materias y contenedor de fichas teóricas
│       ├── vectors.html                            Lienzo, paneles y controles de vectores en R²/R³
│       └── waves.html                              Formulario de ondas, unidades y animación
├── styles/                                         Hojas de componentes en orden de cascada
│   ├── base.css                                    Tipografía, disposición base, foco y componentes comunes
│   ├── vectors.css                                 Disposición adaptable, tarjetas y solucionadores vectoriales
│   ├── electromagnetism.css                        Lienzo, paneles y controles de electromagnetismo
│   ├── launcher.css                                Portada, submenús, diálogo de salida y avisos
│   ├── tools.css                                   Pantallas, formularios y resultados de herramientas
│   ├── calculus.css                                Paneles, teclado, fichas y gráficas de Cálculo
│   ├── gradients.css                               Degradados de fondos, títulos y estados activos
│   ├── search.css                                  Buscador, resultados y acceso desde herramientas
│   └── utilities.css                               Clases auxiliares y estilos de fichas teóricas
├── fonts/                                          Tipografías locales y licencias SIL OFL
│   ├── OFL-IBM-Plex-Sans.txt                       Licencia SIL OFL 1.1 de IBM Plex Sans
│   ├── OFL-JetBrains-Mono.txt                      Licencia SIL OFL 1.1 de JetBrains Mono
│   ├── fonts.css                                   Declaraciones @font-face locales por peso y subconjunto
│   ├── ibm-plex-sans-400-greek.woff2               IBM Plex Sans 400, griego
│   ├── ibm-plex-sans-400-italic-greek.woff2        IBM Plex Sans 400 cursiva, griego
│   ├── ibm-plex-sans-400-italic-latin-ext.woff2    IBM Plex Sans 400 cursiva, latín extendido
│   ├── ibm-plex-sans-400-italic-latin.woff2        IBM Plex Sans 400 cursiva, latín
│   ├── ibm-plex-sans-400-latin-ext.woff2           IBM Plex Sans 400, latín extendido
│   ├── ibm-plex-sans-400-latin.woff2               IBM Plex Sans 400, latín
│   ├── ibm-plex-sans-500-greek.woff2               IBM Plex Sans 500, griego
│   ├── ibm-plex-sans-500-latin-ext.woff2           IBM Plex Sans 500, latín extendido
│   ├── ibm-plex-sans-500-latin.woff2               IBM Plex Sans 500, latín
│   ├── ibm-plex-sans-600-greek.woff2               IBM Plex Sans 600, griego
│   ├── ibm-plex-sans-600-latin-ext.woff2           IBM Plex Sans 600, latín extendido
│   ├── ibm-plex-sans-600-latin.woff2               IBM Plex Sans 600, latín
│   ├── ibm-plex-sans-700-greek.woff2               IBM Plex Sans 700, griego
│   ├── ibm-plex-sans-700-latin-ext.woff2           IBM Plex Sans 700, latín extendido
│   ├── ibm-plex-sans-700-latin.woff2               IBM Plex Sans 700, latín
│   ├── jetbrains-mono-400-greek.woff2              JetBrains Mono 400, griego
│   ├── jetbrains-mono-400-latin-ext.woff2          JetBrains Mono 400, latín extendido
│   ├── jetbrains-mono-400-latin.woff2              JetBrains Mono 400, latín
│   ├── jetbrains-mono-600-greek.woff2              JetBrains Mono 600, griego
│   ├── jetbrains-mono-600-latin-ext.woff2          JetBrains Mono 600, latín extendido
│   └── jetbrains-mono-600-latin.woff2              JetBrains Mono 600, latín
├── js/                                             Módulos ES de la aplicación
│   ├── math/                                       Cálculos sin DOM ni Canvas
│   │   ├── algebra/                                Motores de álgebra y geometría
│   │   │   ├── functions.mjs                       Análisis de dominio, rango y puntos de funciones
│   │   │   ├── geometry.mjs                        Rectas, planos, intersecciones, distancias y ángulos en R³
│   │   │   ├── inequalities.mjs                    Solución de inecuaciones y tablas de signos
│   │   │   ├── linear-spaces.mjs                   Bases, proyecciones, transformaciones y diagonalización
│   │   │   ├── matrix.mjs                          Operaciones, determinantes, sistemas, espacios y autopares
│   │   │   ├── parameter-systems.mjs               Clasificación de sistemas con parámetros y semejanza
│   │   │   ├── polynomial.mjs                      Lectura de polinomios y cálculo de raíces reales
│   │   │   ├── sequences.mjs                       Términos, límites, recurrencias y progresiones
│   │   │   ├── triangle.mjs                        Geometría de un triángulo definido por tres puntos en R³
│   │   │   ├── vector-equations.mjs                Ecuaciones vectoriales e incógnitas en componentes
│   │   │   └── vector.mjs                          Magnitud, productos, ángulos y proyecciones vectoriales
│   │   ├── calculus/                               Componentes de la fachada calculus.mjs
│   │   │   ├── antiderivative.mjs                  Primitivas básicas de expresiones elementales
│   │   │   ├── ast.mjs                             Evaluación, simplificación y sustitución del AST
│   │   │   ├── derivatives.mjs                     Derivación simbólica y estudio de curvas implícitas
│   │   │   ├── format.mjs                          Formato exacto, fracciones y resultados de cálculo
│   │   │   ├── limit-forms.mjs                     Formas analíticas e indeterminaciones de límites
│   │   │   ├── limits.mjs                          Límites simbólicos y operaciones entre límites
│   │   │   ├── numeric.mjs                         RK4, Simpson, Taylor, parciales y gradiente numéricos
│   │   │   ├── parser.mjs                          Tokenización y análisis sintáctico de expresiones
│   │   │   ├── printer.mjs                         Impresión legible del AST y agrupación de términos
│   │   │   └── revolution.mjs                      Volúmenes de revolución, ejes desplazados y cruces
│   │   ├── integration/                            Componentes de la fachada integration.mjs
│   │   │   ├── rules/                              Reglas del motor de integración
│   │   │   │   ├── basic.mjs                       Tabla básica, sustitución lineal y formas cuadráticas
│   │   │   │   ├── by-parts.mjs                    Reglas de integración por partes
│   │   │   │   ├── substitution.mjs                Reglas de integración por sustitución u
│   │   │   │   └── trigonometric.mjs               Integración de potencias de seno y coseno
│   │   │   ├── ast-tools.mjs                       Constructores, comparación y transformación del AST
│   │   │   ├── definite.mjs                        Evaluación de integrales definidas
│   │   │   ├── engine.mjs                          Motor recursivo de integración simbólica con pasos
│   │   │   ├── format.mjs                          Impresión de primitivas y coeficientes fraccionarios
│   │   │   ├── improper.mjs                        Integrales impropias y detección de singularidades
│   │   │   ├── partial-fractions.mjs               Descomposición e integración por fracciones parciales
│   │   │   ├── polynomials.mjs                     Aritmética e integración de polinomios sobre el AST
│   │   │   └── revolution.mjs                      Evaluación simbólica de revolución para polinomios
│   │   ├── applications.mjs                        Aplicaciones de derivadas y EDO de segundo orden
│   │   ├── calculus.mjs                            Fachada de calculus/: límites, derivadas y núcleos numéricos
│   │   ├── conics.mjs                              Parábolas, elipses, hipérbolas y clasificación de cónicas
│   │   ├── differential-applications.mjs           Análisis simbólico, optimización y casos de teoremas
│   │   ├── domain-guard.mjs                        Detección por muestreo de fallos de dominio y derivabilidad
│   │   ├── electromagnetism-advanced.mjs           Electrostática, circuitos, magnetismo e inducción avanzados
│   │   ├── electromagnetism.mjs                    Coulomb, Gauss, Lorentz, Faraday y aplicaciones físicas
│   │   ├── experiments.mjs                         Simulación de dados y moneda; π con Chudnovsky
│   │   ├── expression.mjs                          Normalización, variables y evaluación numérica de expresiones
│   │   ├── graph-types.mjs                         Evaluadores y campos de los siete tipos del graficador
│   │   ├── graphs.mjs                              Recorridos, caminos, árboles, flujo y algoritmos de grafos
│   │   ├── integral-applications.mjs               Áreas, arco, superficie, trabajo, centroides y Pappus
│   │   ├── integration.mjs                         Fachada de integration/: integración simbólica con pasos
│   │   ├── logic-advanced.mjs                      Cuantificadores, formas normales, Karnaugh e inducción
│   │   ├── logic.mjs                               Bases, proposiciones, conjuntos y minimización booleana
│   │   ├── mechanics-advanced.mjs                  Equilibrio, choques, rotación, gravitación y marcos
│   │   ├── mechanics-solver.mjs                    Despejes, ramas y estados de movimiento y dinámica
│   │   ├── mechanics-units.mjs                     Factores y conversiones de magnitudes mecánicas a SI
│   │   ├── mechanics.mjs                           Movimiento rectilíneo, tiro parabólico, fuerza y energía
│   │   ├── multivariable-study.mjs                 Estudio de superficies, campos, extremos y teoremas
│   │   ├── multivariable.mjs                       Parciales, límites, extremos e integrales múltiples
│   │   ├── numeric.mjs                             Riemann, trapecio e integrales impropias numéricas
│   │   ├── numerical-advanced.mjs                  LU, precisión finita, Bairstow, ajustes y cotas
│   │   ├── numerical-analysis.mjs                  Errores, raíces, interpolación y métodos de EDO con pasos
│   │   ├── numerical-study.mjs                     Cotas de error, Taylor y estudio de convergencia
│   │   ├── numerical-systems.mjs                   Newton para sistemas y estabilidad matricial de métodos
│   │   ├── ode-study.mjs                           Clasificación y estudio de EDO y sistemas forzados
│   │   ├── parametric.mjs                          Pendiente, arco, área y superficie de curvas paramétricas
│   │   ├── physics-output.mjs                      Catálogo dimensional y conversión de unidades de salida
│   │   ├── poisson-rectangle.mjs                   Solución de Poisson en una malla rectangular 2D
│   │   ├── polar.mjs                               Conversión polar, área, arco y pendiente
│   │   ├── probability.mjs                         Combinaciones, distribución binomial y suma de dados
│   │   ├── series.mjs                              Taylor y criterios de convergencia de series
│   │   ├── statistics.mjs                          Análisis descriptivo, percentiles e histograma
│   │   ├── study-calculus.mjs                      Problemas de cálculo aplicado, regiones y superficies
│   │   ├── study-ode.mjs                           EDO separables, lineales, exactas, Laplace y sistemas
│   │   ├── vector-calculus.mjs                     Divergencia, rotacional, integrales de línea y teoremas
│   │   └── waves.mjs                               Oscilaciones, ondas mecánicas, electromagnéticas y óptica
│   ├── ui/                                         Interfaz, formularios, navegación y eventos
│   │   ├── search.mjs                              Diálogo, teclado y selección de resultados
│   │   ├── search/                                 Catálogo derivado de menús, registros y marcado
│   │   │   ├── catalog.mjs                          Herramientas y operaciones por familia
│   │   │   └── markup.mjs                           Fichas, pestañas y opciones de formularios estáticos
│   │   ├── algebra/                                Herramientas de álgebra
│   │   │   ├── vectors/                            Secciones y herramientas de triángulos
│   │   │   │   ├── sections.mjs                    Despliegue de secciones y pasos de resolución
│   │   │   │   └── triangle.mjs                    Herramientas de triángulos con dependencias inyectadas
│   │   │   ├── functions.mjs                       Selector, análisis y resultados de funciones
│   │   │   ├── geometry.mjs                        Selección y cálculo de rectas y planos 3D
│   │   │   ├── inequalities.mjs                    Formularios y resultados de inecuaciones
│   │   │   ├── linear-spaces.mjs                   Selección y cálculo de bases y transformaciones
│   │   │   ├── matrix.mjs                          Formularios de matrices, sistemas y espacios
│   │   │   ├── sequences.mjs                       Modos y resultados de sucesiones y progresiones
│   │   │   └── vectors.mjs                         Estado, lienzo, paneles y cálculo de vectores
│   │   ├── calculus/                               Componentes de la fachada calculus.mjs de interfaz
│   │   │   ├── applications.mjs                    Paneles de aplicaciones de derivadas
│   │   │   ├── cards.mjs                           Pestañas, fichas desplegables y limpieza de resultados
│   │   │   ├── curves.mjs                          Cálculo de curvas paramétricas, polares y cónicas
│   │   │   ├── differential.mjs                    Controles de límites, derivadas y análisis
│   │   │   ├── integral.mjs                        Controles de integrales numéricas, simbólicas y aplicaciones
│   │   │   ├── keyboard.mjs                        Teclado matemático, foco de entrada y tecla Enter
│   │   │   ├── multivariable.mjs                   Controles de cálculo multivariable y vectorial
│   │   │   ├── ode.mjs                             Controles de EDO separables, lineales y de orden dos
│   │   │   ├── preview-renderer.mjs                Preparación y dibujo de vistas previas de Cálculo
│   │   │   ├── previews.mjs                        Oyentes y actualización diferida de vistas previas
│   │   │   ├── results.mjs                         Lectura de entradas y cajas de resultados y errores
│   │   │   ├── revolution.mjs                      Estado, controles y dibujo del sólido de revolución
│   │   │   └── series.mjs                          Controles de Taylor y criterios de series
│   │   ├── electromagnetism/                       Paneles básicos y familias avanzadas de electromagnetismo
│   │   │   ├── base-panels.mjs                     Paneles de Gauss, potencial, Lorentz, Faraday y Maxwell
│   │   │   ├── circuits.mjs                        Campos, modos y solucionadores de circuitos
│   │   │   ├── electrostatics.mjs                  Campos, modos y solucionadores de electrostática
│   │   │   ├── magnetism.mjs                       Campos, modos y solucionadores de magnetismo e inducción
│   │   │   └── units.mjs                           Selectores, lectura y conversión de unidades de entrada
│   │   ├── logic/                                  Paneles de lógica por dominio
│   │   │   ├── bases.mjs                           Paneles y operaciones de bases y palabras binarias
│   │   │   ├── boolean.mjs                         Paneles de álgebra booleana y redes lógicas
│   │   │   ├── graphs.mjs                          Paneles de grafos, árboles y algoritmos
│   │   │   ├── inputs.mjs                          Lectura, validación, tablas y presentación de resultados
│   │   │   ├── propositions.mjs                    Paneles de proposiciones, argumentos y cuantificadores
│   │   │   └── sets.mjs                            Paneles de conjuntos, relaciones e inducción
│   │   ├── mechanics/                              Familias de mecánica avanzada
│   │   │   ├── collisions.mjs                      Campos, modos y solucionadores de choques y centro de masa
│   │   │   ├── forces.mjs                          Campos, modos y solucionadores de fuerzas y equilibrio
│   │   │   ├── motion.mjs                          Campos, modos y solucionadores de movimiento y marcos
│   │   │   ├── rotation.mjs                        Campos, modos y solucionadores de rotación y gravitación
│   │   │   └── units.mjs                           Selectores y lectura de magnitudes escalares y vectoriales
│   │   ├── navigation/                             Catálogo de destinos y diálogo de salida
│   │   │   ├── catalog.mjs                         Catálogo de menús, tarjetas y destinos de herramientas
│   │   │   └── exit-dialog.mjs                     Diálogo de salida al retroceder desde la portada
│   │   ├── numerical/                              Paneles de análisis numérico por dominio
│   │   │   ├── derivative-quadrature.mjs           Paneles de derivación numérica y cuadratura
│   │   │   ├── errors.mjs                          Paneles de errores, precisión finita y Taylor
│   │   │   ├── inputs.mjs                          Lectura de expresiones, vectores y tablas de iteraciones
│   │   │   ├── interpolation.mjs                   Paneles de interpolación y ajuste
│   │   │   ├── ode.mjs                             Paneles de métodos numéricos de EDO
│   │   │   ├── roots.mjs                           Paneles de búsqueda de raíces
│   │   │   └── systems.mjs                         Paneles de sistemas lineales, no lineales y estabilidad
│   │   ├── study/                                  Familias de aplicaciones de cálculo
│   │   │   ├── differential.mjs                    Campos, modos y solucionadores de aplicaciones diferenciales
│   │   │   ├── inputs.mjs                          Lectura de números, funciones y fórmulas de coordenadas
│   │   │   ├── integral.mjs                        Campos, modos y solucionadores de aplicaciones integrales
│   │   │   ├── multivariable.mjs                   Campos, modos y solucionadores de regiones y superficies
│   │   │   └── ode.mjs                             Campos, modos y solucionadores de estudio de EDO
│   │   ├── waves/                                  Familias, unidades y animación de ondas
│   │   │   ├── animation.mjs                       Estado, tiempo, reproducción y repintado de ondas
│   │   │   ├── mechanical.mjs                      Modos y solucionadores de ondas mecánicas y sonido
│   │   │   ├── optics.mjs                          Modos y solucionadores de ondas EM y óptica
│   │   │   ├── oscillations.mjs                    Modos y solucionadores de oscilaciones
│   │   │   └── output.mjs                          Lectura, unidades y formato de resultados de ondas
│   │   ├── action-registry.mjs                     Composición de acciones y detección de nombres duplicados
│   │   ├── branding.mjs                            Animación de los electrones del logo
│   │   ├── calculus.mjs                            Fachada de calculus/ e inicialización de Cálculo
│   │   ├── canvas-size.mjs                         Ajuste HiDPI del bitmap y observación del contenedor
│   │   ├── electromagnetism-advanced.mjs           Fachada de electromagnetism/: familias y resultados avanzados
│   │   ├── electromagnetism-extra.mjs              Paneles y cálculos de aplicaciones electromagnéticas
│   │   ├── electromagnetism.mjs                    Estado, lienzo y paneles del electromagnetismo básico
│   │   ├── events.mjs                              Delegación de eventos declarativos data-action
│   │   ├── experiments.mjs                         Paneles y resultados de dados, moneda y cifras de π
│   │   ├── figure-controls.mjs                     Controles compartidos de figuras geométricas 3D
│   │   ├── logic.mjs                               Fachada de logic/: composición y apertura de paneles
│   │   ├── mechanics-advanced.mjs                  Fachada de mechanics/: familias y resultados avanzados
│   │   ├── mechanics.mjs                           Formularios, despejes y exploración temporal de mecánica
│   │   ├── navigation.mjs                          Navegación, launcher, historial y catálogo de navigation/
│   │   ├── numerical-analysis.mjs                  Fachada de numerical/: paneles y vista de entradas
│   │   ├── physics-output.mjs                      Resultados físicos y selectores de unidades de salida
│   │   ├── plotter.mjs                             Entradas, vista previa, tabla y controles del graficador
│   │   ├── probability.mjs                         Paneles de combinaciones, binomial y dados
│   │   ├── routes.mjs                              Lectura y construcción de enlaces #/menú/herramienta
│   │   ├── statistics.mjs                          Entrada, resultados y gráficas de estadística
│   │   ├── study-calculus.mjs                      Fachada de study/: familias de aplicaciones de cálculo
│   │   ├── theme.mjs                               Aplicación, selector y persistencia del tema
│   │   ├── theory.mjs                              Presentación de materias, fichas y cobertura teórica
│   │   ├── toast.mjs                               Avisos de texto no bloqueantes
│   │   └── waves.mjs                               Fachada de waves/: modos, formularios y resultados
│   ├── graphics/                                   Dibujo con Canvas 2D y SVG
│   │   ├── analysis.mjs                            Gráficas de funciones y rectas numéricas en Canvas
│   │   ├── axes.mjs                                Intervalos de marcas para ejes y cuadrículas
│   │   ├── colors.mjs                              Lectura de la paleta vigente para cada repintado
│   │   ├── em-canvas.mjs                           Renderizador del lienzo electromagnético
│   │   ├── figures.mjs                             Generación y dibujo de mallas geométricas 3D
│   │   ├── formula-background.mjs                  Fondo de fórmulas con capas y movimiento
│   │   ├── function-analysis.mjs                   Gráfica SVG de funciones con ramas separadas por polos
│   │   ├── graph-canvas.mjs                        Renderizado Canvas de los tipos del graficador
│   │   ├── logic-graph.mjs                         Diagramas SVG de grafos y árboles
│   │   ├── mechanics-trajectory.mjs                Gráficas de movimiento rectilíneo y tiro parabólico
│   │   ├── physics-diagrams.mjs                    Diagramas SVG de fuerzas, circuitos, impedancia y potencial
│   │   ├── preview-canvas.mjs                      Muestreo y vistas previas de funciones y curvas
│   │   ├── projection.mjs                          Proyección ortográfica compartida de 3D a 2D
│   │   ├── revolution.mjs                          Mallas, extensión y centrado de sólidos de revolución
│   │   ├── statistics-charts.mjs                   Histograma y diagrama de caja
│   │   ├── study-plot.mjs                          Gráficas SVG de series y regiones de estudio
│   │   ├── vector-canvas.mjs                       Renderizador del lienzo vectorial en R²/R³
│   │   └── wave-plot.mjs                           Escenas de ondas con dibujo Canvas y alternativa SVG
│   ├── content/                                    Datos de contenido teórico sin DOM
│   │   ├── theory/                                 Fichas por materia y constructores comunes
│   │   │   ├── diferencial.mjs                     Fichas y cobertura de cálculo diferencial
│   │   │   ├── edo.mjs                             Fichas y cobertura de ecuaciones diferenciales
│   │   │   ├── em.mjs                              Fichas y cobertura de electromagnetismo
│   │   │   ├── helpers.mjs                         Constructores de fichas, subtemas y rutas
│   │   │   ├── integral.mjs                        Fichas y cobertura de cálculo integral
│   │   │   ├── lineal.mjs                          Fichas y cobertura de álgebra lineal
│   │   │   ├── logica.mjs                          Fichas y cobertura de lógica matemática
│   │   │   ├── mecanica.mjs                        Fichas y cobertura de mecánica
│   │   │   ├── multivariable.mjs                   Fichas y cobertura de cálculo multivariable
│   │   │   ├── numerico.mjs                        Fichas y cobertura de análisis numérico
│   │   │   └── ondas.mjs                           Fichas y cobertura de ondas y óptica
│   │   └── theory.mjs                              Fachada de theory/: materias, fichas y conteos de cobertura
│   ├── state/                                      Estado compartido de figuras y resultados físicos
│   │   ├── figures.mjs                             Estado de figuras compartido por interfaz y lienzos
│   │   └── physics-output.mjs                      Último resultado calculado de cada panel de física
│   ├── utils/                                      Utilidades independientes del navegador
│   │   ├── search.mjs                              Normalización, sinónimos y ranking de resultados
│   │   └── format.mjs                              Formato numérico, fracciones, radicales y ángulos
│   └── offline.mjs                                 Registro PWA, instalación y actualización de la aplicación
├── scripts/                                        Ensamblado HTML y auditoría de fuentes
│   ├── assemble-html.mjs                           Ensamblado de index.html desde shell y fragmentos
│   └── audit.mjs                                   Informe de tamaño de fuentes y líneas largas
├── docs/                                           Documentación de arquitectura
│   └── architecture.md                             Capas, fachadas, registros y pruebas de arquitectura
└── tests/                                          Pruebas de Node con interfaz y lienzos simulados
    ├── fixtures/                                   Datos de referencia de pruebas
    │   └── golden/                                 Corpus de resultados y efectos esperados
    │       ├── ui-trace/                           Una traza por prueba de interfaz (conteo y SHA-256)
    │       │   ├── action-registry.test.json       Conteo y huella de efectos de action-registry.test.mjs
    │       │   ├── algebra-ui.test.json            Conteo y huella de efectos de algebra-ui.test.mjs
    │       │   ├── app-harness.test.json           Conteo y huella de efectos de app-harness.test.mjs
    │       │   ├── app-ui.test.json                Conteo y huella de efectos de app-ui.test.mjs
    │       │   ├── calculus-interaction.test.json  Conteo y huella de efectos de calculus-interaction.test.mjs
    │       │   ├── calculus-ui.test.json           Conteo y huella de efectos de calculus-ui.test.mjs
    │       │   ├── electromagnetism-ui.test.json   Conteo y huella de efectos de electromagnetism-ui.test.mjs
    │       │   ├── logic-ui.test.json              Conteo y huella de efectos de logic-ui.test.mjs
    │       │   ├── mechanics-ui.test.json          Conteo y huella de efectos de mechanics-ui.test.mjs
    │       │   ├── navigation-ui.test.json         Conteo y huella de efectos de navigation-ui.test.mjs
    │       │   ├── numerical-ui.test.json          Conteo y huella de efectos de numerical-ui.test.mjs
    │       │   ├── statistics-ui.test.json         Conteo y huella de efectos de statistics-ui.test.mjs
    │       │   ├── study-golden.test.json          Conteo y huella de efectos de study-golden.test.mjs
    │       │   └── waves-ui.test.json              Conteo y huella de efectos de waves-ui.test.mjs
    │       ├── calculus.json                       Casos y salidas de referencia de la fachada de cálculo
    │       ├── integration.json                    Casos y salidas de referencia de integración
    │       └── study-modes.json                    Resultados y errores de los modos de estudio por defecto
    ├── helpers/                                    Arnés y comparación de salidas de referencia
    │   ├── app-harness.mjs                         Arnés de módulos ES con DOM, Canvas y efectos simulados
    │   └── golden.mjs                              Comparación de exportaciones con un corpus de referencia
    ├── action-registry.test.mjs                    Composición, duplicados y propiedad de acciones
    ├── algebra-exercises.test.mjs                  Referencias independientes de ejercicios de álgebra
    ├── algebra-geometry.test.mjs                   Rectas, planos, intersecciones y casos degenerados
    ├── algebra-linear-spaces.test.mjs              Bases, transformaciones y diagonalización
    ├── algebra-parameter-systems.test.mjs          Sistemas con parámetros y matrices semejantes
    ├── algebra-spaces.test.mjs                     Rango, nulidad e imagen de matrices rectangulares
    ├── algebra-ui.test.mjs                         Interfaz de álgebra y graficador con traza de efectos
    ├── analysis-graphics.test.mjs                  Dibujo de funciones y rectas numéricas sin DOM
    ├── app-harness.test.mjs                        Resolución, fuentes y aislamiento del arnés
    ├── app-ui.test.mjs                             Arranque, eventos y cálculos principales de la aplicación
    ├── applications.test.mjs                       Aplicaciones de derivadas, teoremas y EDO
    ├── architecture.test.mjs                       Importaciones existentes, capas permitidas y ausencia de ciclos
    ├── calculus-bank.test.mjs                      Muestra adicional de referencias del banco de cálculo
    ├── calculus-golden.test.mjs                    Exportaciones de cálculo frente al corpus de referencia
    ├── calculus-interaction.test.mjs               Oyentes únicos, foco del teclado y demora de vistas previas
    ├── calculus-ui.test.mjs                        Paneles de Cálculo y aplicaciones con traza de efectos
    ├── calculus.test.mjs                           Parser, AST, límites, derivadas y núcleos de cálculo
    ├── canvas-size.test.mjs                        Tamaño del bitmap y observación de contenedores
    ├── canvas.test.mjs                             Lienzos de vectores y electromagnetismo con paleta vigente
    ├── conics.test.mjs                             Geometría y clasificación de secciones cónicas
    ├── contrast.test.mjs                           Contraste de texto y controles en ambos temas
    ├── differential-exercises.test.mjs             Referencias de ejercicios diferenciales y casos de dominio
    ├── domain-guard.test.mjs                       Dominio, singularidades y derivabilidad de aplicaciones
    ├── electromagnetism-advanced.test.mjs          Circuitos, campos, inducción y modelos avanzados
    ├── electromagnetism-exercises.test.mjs         Referencias independientes de ejercicios de electromagnetismo
    ├── electromagnetism-ui.test.mjs                Paneles y lienzo de electromagnetismo con traza de efectos
    ├── electromagnetism.test.mjs                   Leyes y aplicaciones electromagnéticas básicas
    ├── events.test.mjs                             Delegación de acciones estáticas y dinámicas
    ├── experiments.test.mjs                        Secuencias, frecuencias y precisión de cifras de π
    ├── figures.test.mjs                            Mallas, renderizado inyectado y marcas de ejes
    ├── format.test.mjs                             Formatos numéricos, fracciones, radicales y ángulos
    ├── formula-background.test.mjs                 Capas, tema, visibilidad y movimiento reducido del fondo
    ├── functions.test.mjs                          Análisis de funciones sin DOM
    ├── graph-types.test.mjs                        Evaluadores, campos y dominios del graficador
    ├── graphs.test.mjs                             Recorridos, caminos, flujo, árboles y diagramas
    ├── html-assembly.test.mjs                      Sincronización de index.html e inclusiones válidas
    ├── inequalities.test.mjs                       Operaciones y solucionadores de inecuaciones
    ├── integral-applications.test.mjs              Áreas, arco, trabajo, centroides y Pappus
    ├── integral-exercises.test.mjs                 Referencias integrales, dominio y límites de series
    ├── integration-golden.test.mjs                 Exportaciones de integración frente al corpus de referencia
    ├── integration.test.mjs                        Reglas simbólicas, primitivas y expresiones no elementales
    ├── interaction.test.mjs                        Teclado, rutas, accesibilidad y fuentes locales
    ├── logic-advanced.test.mjs                     Cuantificadores, Karnaugh, inducción y pruebas guiadas
    ├── logic-exercises.test.mjs                    Referencias de lógica y contraejemplos independientes
    ├── logic-ui.test.mjs                           Paneles y ejercicios de lógica con traza de efectos
    ├── logic.test.mjs                              Bases, proposiciones, conjuntos y minimización booleana
    ├── matrix.test.mjs                             Operaciones, sistemas, espacios y autopares de matrices
    ├── mechanics-advanced.test.mjs                 Equilibrio, choques, rotación, órbitas y marcos
    ├── mechanics-exercises.test.mjs                Referencias independientes de ejercicios de mecánica
    ├── mechanics-solver.test.mjs                   Unidades, despejes, ramas físicas y estados de movimiento
    ├── mechanics-ui.test.mjs                       Paneles y ejercicios de mecánica con traza de efectos
    ├── mechanics.test.mjs                          Movimiento, energía y gráficas de trayectoria
    ├── multivariable-exercises.test.mjs            Referencias multivariables, regularidad y orientación
    ├── multivariable.test.mjs                      Parciales, límites, extremos e integrales múltiples
    ├── navigation-ui.test.mjs                      Navegación desde fichas a herramientas y regreso al menú
    ├── numeric.test.mjs                            Riemann, trapecio e integrales impropias numéricas
    ├── numerical-advanced.test.mjs                 LU, precisión, Bairstow, ajustes y cotas numéricas
    ├── numerical-analysis.test.mjs                 Errores, raíces, interpolación y métodos de EDO
    ├── numerical-exercises.test.mjs                Referencias numéricas, dominios y casos degenerados
    ├── numerical-systems.test.mjs                  Newton multidimensional y estabilidad matricial
    ├── numerical-ui.test.mjs                       Paneles y ejercicios numéricos con traza de efectos
    ├── ode-exercises.test.mjs                      Referencias de EDO, singularidades y resonancia
    ├── offline.test.mjs                            Instalación de caché completa y funcionamiento sin conexión
    ├── parametric.test.mjs                         Pendiente, arco, área y superficie paramétricos
    ├── physics-presentation.test.mjs               Unidades de salida y diagramas físicos accesibles
    ├── poisson-rectangle.test.mjs                  Poisson y Laplace 2D, fronteras y convergencia
    ├── polar.test.mjs                              Conversiones, área, arco y pendiente polares
    ├── polynomial.test.mjs                         Lectura de polinomios y raíces compartidas
    ├── preview-canvas.test.mjs                     Muestreo, rango y renderizado de vistas previas
    ├── probability.test.mjs                        Combinaciones, binomial y conteos de dados
    ├── projection.test.mjs                         Rotaciones, escala y orden de proyección 3D
    ├── registries.test.mjs                         Coherencia de campos, modos y solucionadores por familia
    ├── revolution.test.mjs                         Geometría, centrado y volúmenes de sólidos de revolución
    ├── sequences.test.mjs                          Términos, progresiones y límites de sucesiones
    ├── series-criteria.test.mjs                    Criterios de raíz, integral y Leibniz
    ├── series.test.mjs                             Taylor y criterios básicos de convergencia
    ├── statistics-ui.test.mjs                      Estadística, probabilidad y experimentos con historial
    ├── statistics.test.mjs                         Medidas descriptivas, percentiles e histograma
    ├── study-calculus.test.mjs                     Aplicaciones, regiones, láminas y superficies
    ├── study-exercises.test.mjs                    Muestra de referencias independientes entre materias
    ├── study-golden.test.mjs                       Resultados por defecto y traza de los modos de estudio
    ├── study-ode.test.mjs                          EDO, transformadas de Laplace y sistemas lineales
    ├── theme.test.mjs                              Recursos, tokens y aplicación de ambos temas
    ├── theory.test.mjs                             Materias, fichas, cobertura y rutas del temario
    ├── toast.test.mjs                              Avisos seguros, apilados y temporales
    ├── tree-classification.test.mjs                Conectividad, ciclos y clasificación de árboles
    ├── vector-calculus.test.mjs                    Campos, integrales de línea y teoremas vectoriales
    ├── vector-equations.test.mjs                   Ecuaciones e incógnitas vectoriales sin DOM
    ├── vector.test.mjs                             Operaciones vectoriales y geometría de triángulos
    ├── waves-exercises.test.mjs                    Referencias independientes de ejercicios de ondas
    ├── waves-ui.test.mjs                           Paneles, unidades y animación de ondas con traza de efectos
    └── waves.test.mjs                              Oscilaciones, propagación, óptica y representación de ondas
```

© Rafael Miranda — SuperCalc
