# Estado de SuperCalc: refactorización e integración

Actualizado: 2026-09-24. Rama local: `refactor/modular`. Los cambios siguen en el árbol de trabajo, sin commit ni push. La antigua carpeta `upd test/` sirvió como referencia y ya no está en este árbol de trabajo. Este documento reúne el avance, las verificaciones y lo pendiente. No equivale a una certificación de que toda la app esté libre de errores.

## Punto de partida y alcance

La aplicación partió de `9b4eeb5`: `index.html`, `style.css`, un `app.js` clásico y monolítico, `sw.js` y `README.md`. Los cálculos, el DOM, el estado y el dibujo compartían archivo; los controles estáticos y los formularios generados con `innerHTML` llamaban funciones globales mediante atributos HTML. Pasar directamente ese script a `type="module"` habría roto esos eventos. El service worker precargaba una lista cerrada de recursos, por lo que cada módulo nuevo necesitaba incorporarse a la caché. La línea base se sirvió por HTTP y se comprobó con pruebas puntuales de matemáticas y un service worker simulado; no hubo prueba visual integrada.

La refactorización usa módulos ES nativos, sin framework, gestor de paquetes ni compilador. No se han agregado funciones ajenas al alcance acordado: las funciones recuperadas de `upd test/` se implementaron dentro de esta arquitectura, no copiando su monolito.

## Arquitectura actual

| Lugar | Responsabilidad |
| --- | --- |
| `index.html`, `app.js` | Estructura de pantallas y punto de entrada ES; el arranque registra las acciones disponibles. |
| `js/math/algebra/` | Motores sin DOM de matrices, vectores, triángulos, ecuaciones vectoriales, polinomios, funciones, sucesiones e inecuaciones. |
| `js/math/calculus.mjs`, `applications.mjs`, `electromagnetism.mjs` | Cálculo y aplicaciones matemáticas y físicas independientes de la interfaz. |
| `js/math/expression.mjs`, `graph-types.mjs` | Parser numérico compartido y contrato de los siete tipos del graficador. |
| `js/ui/algebra/`, demás `js/ui/` | Formularios, navegación, controladores de Cálculo, Física y graficador, eventos, tema, toasts y ajuste de canvas. |
| `js/graphics/` | Renderizadores Canvas 2D, ejes, figuras 3D, gráficas, colores por tema y fondo animado. |
| `js/state/`, `js/utils/` | Estado explícito de figuras y utilidades de formato, fracciones y radicales. |
| `theme.css`, `style.css` | Paletas y tokens de tema separados del layout y los componentes. |
| `js/offline.mjs`, `sw.js` | Registro PWA, instalación/actualización y caché de recursos. |

La ruta de una interacción es `data-action` en HTML (también en plantillas dinámicas) → delegación de `click`/`input`/`change`/`pointerdown` en `js/ui/events.mjs` → controlador de UI → motor matemático → presentación o canvas. No hay atributos HTML de eventos inline ni se publican funciones de la app en `window`. Los motores matemáticos no deben depender del DOM ni del canvas.

## Cambios realizados

1. **Extracción inicial y cálculo puro.** Las operaciones básicas de matrices fueron la primera extracción. Después se separaron el resto de matrices, vectores, triángulos, ecuaciones vectoriales, polinomios, funciones, sucesiones e inecuaciones. Se modularizaron también límites, derivadas, integrales, optimización, crecimiento, movimiento, tangentes, tasas relacionadas, raíces características de EDO y fórmulas electromagnéticas. Las entradas y resultados quedaron en controladores de UI; el formato numérico y vectorial pasó a utilidades compartidas. Álgebra se reordenó en directorios paralelos `js/math/algebra/` y `js/ui/algebra/`, y Cálculo y Funciones comparten el parser numérico.
2. **Interfaz y eventos.** Se retiraron los manejadores HTML inline, incluidos los de formularios creados en ejecución y los avisos PWA, y se sustituyeron por acciones declarativas delegadas. Se separaron navegación, paneles, formularios y estado de figuras. Se añadió selección del contenido al enfocar entradas y reajuste HiDPI del bitmap de vectores y electromagnetismo al tamaño del contenedor mediante `ResizeObserver`, con alternativa en el evento de ventana.
3. **Gráficas.** Se separaron el canvas vectorial, electromagnético y de funciones, los ejes y la recta numérica, la proyección y generación de mallas 3D y el graficador. La UI del graficador conserva controles y tabla; `graph-types.mjs` define metadatos, evaluación y pasos de los siete tipos. El estado de vista se entrega al dibujante sin consultas repetidas al DOM en cada punto.
4. **Temas y experiencia visual.** `theme.css` contiene paletas oscura y clara con tokens equivalentes; `style.css` mantiene los estilos estructurales. La paleta clara se adaptó de `upd test/` sin trasladar sus selectores de colores fijos. El selector persiste `sc-theme` en `localStorage`, actualiza `data-theme`, ARIA y el color de la barra del navegador; un script temprano restaura la preferencia antes del CSS. Canvas y logo SVG leen los tokens al repintar. `--gold` y `--accent` siguen siendo distintos; `--ca3` es translúcido y `--ca-bright` sólido. El fondo de fórmulas recuperó parallax de tres capas, paleta por tema, pausa al ocultar la pestaña y respeto a movimiento reducido. Las validaciones vectoriales que usaban `alert()` muestran toasts no bloqueantes. El icono y color del manifiesto PWA permanecen estáticos.
5. **Funciones recuperadas y mejoradas de `upd test/`.** Límites y derivadas aceptan variable configurable; el cociente polinómico implícito se agrupa únicamente en límites, mientras el analizador racional de Funciones trata por separado numerador y denominador. Dos límites con el mismo punto, lado y variable se evalúan conjuntamente al detectar una suma/resta indeterminada de infinitos. El graficador incorporó raíz, logarítmica y racional a los tipos lineal, cuadrático, valor absoluto y exponencial, con validación de dominio y asíntotas. Electromagnetismo añadió un panel de aplicaciones con energía potencial, capacitancia de placas, campo de hilo largo, inductancia, ley de Ohm, circuito RC y FEM por cambio de flujo, incluyendo unidades y validación de denominadores.
6. **Offline.** `sw.js` precarga `index.html`, `app.js`, ambas hojas CSS y todos los módulos ES; la caché actual es `supercalc-v1.0.0`. La instalación exige los recursos propios y tolera el fallo de la fuente externa. El núcleo usa network-first dentro del origen y alcance de la app; al activar una versión nueva solo se eliminan cachés antiguas con prefijo `supercalc-`. `js/offline.mjs` mantiene los avisos de instalación y actualización.
7. **Correcciones de defectos previos.** Se definieron los tokens CSS antes ausentes `--text1`, `--gold` y `--ca3`; se repararon el aviso de actualización del service worker, el valor absoluto en la recta numérica, el dibujo temporal del triángulo, el modo FRAC, la derivada implícita, los extremos abiertos/cerrados de intersecciones de intervalos y el caso de eigenvector `NaN` de una matriz nula. Se añadieron pruebas matemáticas o simuladas para estos comportamientos. En la línea base eran errores del código original, no regresiones introducidas por módulos ES.
8. **Presentación v1.0.0 y organización visual.** El README y los rótulos visibles se reiniciaron en v1.0.0. El selector de Álgebra distingue «Vectores y matrices» de «Funciones y relaciones» y ya no denomina «Álgebra Lineal» a toda el área. El selector de Cálculo agrupa cinco accesos: Diferencial, Integral, Multivariable, EDO y Graficador; antes cuatro tarjetas abrían indistintamente Diferencial y el graficador carecía de tarjeta. Ahora cada acceso activa su panel y pestaña. El selector admite desplazamiento vertical en pantallas bajas. Se retiró una tarjeta física deshabilitada que solo anunciaba contenido futuro. Cálculo Integral incorporó volumen de revolución por discos (eje X) o cascarones (eje Y), con validación de límites, valores finitos en los puntos muestreados y prevención de doble conteo si el intervalo cruza el eje Y.

## Verificaciones realizadas

- `node --experimental-vm-modules --test tests/*.test.mjs`: 22 archivos de prueba, todos pasan en la comprobación de v1.0.0. Cubren motores puros (incluidos discos y cascarones), entradas a las cinco secciones de Cálculo mediante eventos simulados, interfaz, gráficas/canvas simulados, temas, toasts y service worker. La prueba offline compara la precarga con todos los `.mjs` y simula una ruta `/SuperCalc/`.
- `node --check` pasó para `app.js`, `sw.js` y todos los `.mjs` en esta consolidación; `git diff --check` no detectó problemas de espacios en cambios versionados. No existe paso de compilación de producción; los módulos se cargan directamente desde HTTP.
- Un servidor local en `127.0.0.1:8765` respondió en esta comprobación con HTTP 200 para la página, ambas hojas CSS, el service worker, el punto de entrada y los módulos de Cálculo/navegación; los `.mjs` tuvieron MIME JavaScript. Para repetir: `python3 -m http.server 8765 --bind 127.0.0.1`, luego abrir `http://127.0.0.1:8765/`. No abrir con `file://`.
- El usuario probó manualmente en VS Code Live Server una versión modular anterior y reportó que funcionaba. Esa prueba precede a las últimas funciones y a la reorganización de Álgebra. En este entorno no se completó una prueba visual de la versión actual ni una recarga offline en navegador real; las pruebas automatizadas no sustituyen esa comprobación.

## Qué falta comprobar o decidir

Antes de publicar, repetir en un navegador real el recorrido siguiente y registrar entrada, resultado esperado, consola y captura ante cualquier fallo:

- Abrir las tres áreas desde el launcher, recorrer todas sus pestañas, formularios generados, botones atrás y teclado de Cálculo. Confirmar que cada `data-action` funciona una sola vez y no aparecen errores de importación, 404 ni `ReferenceError`.
- Probar vectores R²/R³, FRAC/DEC, arrastre y gestos; matrices (determinante de `[[1,2],[3,4]]` = −2, inversa, sistemas y eigen); inecuaciones (incluida la recta numérica); funciones y sucesiones; triángulo de lados 3/4/5 con área 6; figuras 3D.
- Probar en Cálculo que cada una de las cinco tarjetas abre su pestaña correcta. Calcular un límite de `t²` en 3 con variable `t` (= 9), su derivada (= 6), el límite de `4x²−9/2x−3` en 2 (= 7), la resta de dos límites idénticos de `1/x²` hacia 0 (= 0), integral definida de `x²` entre 0 y 1 (≈ 1/3), derivada implícita, Taylor, gradiente, aplicaciones y EDO. En Volumen de revolución usar `f(x)=x`, `a=0`, `b=1`: eje X ≈ π/3 y eje Y ≈ 2π/3; comprobar el aviso al usar eje Y con `a=-1`, `b=1`. Fuera de límites, escribir fracciones ambiguas con paréntesis explícitos.
- Probar los siete tipos del graficador y sus puntos fuera de dominio; analizar una función racional con numerador y denominador separados. Recorrer los paneles EM existentes y las siete aplicaciones nuevas, así como el cambio de coordenadas y el ajuste del canvas al redimensionar el panel.
- Revisar ambos temas tras cambio, recarga y reapertura: contraste de launcher, paneles, resultados, logo, canvas, fondo parallax y toasts; verificar `aria-checked`, ausencia de destello, movimiento reducido y diseño móvil de 360–390 px.
- Tras cargar online, confirmar en DevTools que `sw.js` controla la página y que la caché activa es `supercalc-v1.0.0`; desconectar la red, recargar y repetir cálculos. Restaurar red y comprobar actualización, instalación PWA y ausencia de recursos antiguos. Repetir bajo una subruta `/SuperCalc/` si se publica allí. La fuente de Google puede no estar disponible offline y debe verse una alternativa local.

Limitaciones conocidas que no se deben confundir con fallos nuevos: la EDO de segundo orden presenta la solución general pero no resuelve C₁/C₂ a partir de condiciones iniciales; la segunda derivada numérica conserva un paso pequeño susceptible al redondeo; varios analizadores heredados usan `Function` para expresiones locales y no son seguros para entrada no confiable. Endurecer el parser o cambiar la semántica matemática requiere una tarea separada. También queda por decidir si el manifiesto/icono PWA debe variar con el tema; hoy solo cambia el `<meta name="theme-color">` de la página.

Si se decide versionar este trabajo, revisar primero `git status` y separar commits pequeños por pruebas y dominios (matemáticas, controladores/UI, gráficas, temas, offline y documentación), sin incluir inadvertidamente otros cambios locales. No se ha hecho push.

## Plan de Cálculo: pantallas independientes y visualización didáctica

**Estado de este apartado: plan, no implementación.** El código actual mantiene cinco tarjetas de entrada en Cálculo, pero todas abren el mismo `#calc-app`: `index.html` conserva una barra `.calc-tabs` que permite pasar directamente de Integral a Multivariable; `js/ui/calculus.mjs` comparte `calcTab`, `calcCurrentTab`, teclado y controladores. Esto corrige el destino inicial de cada tarjeta, pero **no** cumple la separación visual solicitada. En Volumen de revolución, `revolutionVolume()` integra numéricamente una región supuesta y `calcRevolutionVolume()` muestra la fórmula general y el resultado, sin construcción de la región, pasos intermedios ni gráfica. `js/graphics/graph-canvas.mjs` dibuja una curva 2D en un rango fijo; `js/graphics/figures.mjs` genera algunas figuras conocidas, no un sólido de revolución arbitrario.

### 1. Contrato de navegación y separación

- Cada tarjeta de Cálculo abrirá una **pantalla propia**: Diferencial, Integral, Multivariable, Ecuaciones diferenciales o Graficador. Dentro de cada pantalla habrá solo sus herramientas; se retirará la barra de cinco pestañas compartidas. Para ir de Integral a Multivariable habrá que volver al selector de Cálculo, igual que para pasar de Vectores a Matrices en Álgebra. «Separación» significa aislamiento de navegación y estado, no un control de seguridad.
- `js/ui/navigation.mjs` mapeará cada tarjeta a su pantalla. Cada una conservará sus entradas mientras dure la sesión; «Limpiar» las restablecerá, y salir pausará animaciones y liberará observadores sin alterar otras pantallas. Cerrar, usar Atrás del navegador y reabrir deberán regresar al selector correcto sin dejar dos pantallas visibles ni perder el foco. Habrá que actualizar el inventario de pantallas de `popstate` y `closeModule`; `app.js` conservará una tabla cerrada de acciones. Se eliminarán `calcTab` y `calcCurrentTab` cuando no tengan consumidores. La barra que usa Sucesiones no debe desaparecer por compartir hoy la clase CSS `.calc-tabs`.
- El HTML y la UI se dividirán por dominio, sin duplicar utilidades de teclado, tarjetas, formato o validación. Estructura orientativa:

  ```text
  index.html                       cinco contenedores de Cálculo, sin barra común
  js/ui/calculus/                 differential, integral, multivariable, ode, graphing
  js/ui/calculus/shared.mjs       teclado, tarjetas y presentación reutilizables
  js/math/calculus/               límites, derivadas, integración, revolución, EDO
  js/graphics/calculus/           curva/región 2D, límites y sólido 3D
  ```

  Son destinos propuestos, no archivos existentes. La separación se hará por etapas con pruebas de equivalencia; no requiere POO, framework ni compilador.

### 2. Definir el problema antes de integrar

Rotar una **curva** produce una superficie; para obtener un **volumen** debe definirse una región plana cerrada y un eje de rotación. La pantalla pedirá: curva `y=f(x)`, fronteras que cierran la región (por ejemplo `y=0`, `x=a`, `x=b`), eje de giro y unidades. Dibujará esa región antes de ofrecer «Calcular». No rellenará silenciosamente límites ni eje con valores por defecto; cualquier ejemplo precargado se identificará como tal. Si faltan datos, mostrará qué frontera o eje se necesita y permitirá completar el enunciado.

El enunciado inicial «`y=x²`; `x=2`» **no determina por sí solo un volumen único**: hay que saber qué región se rota y alrededor de qué eje. El docente aclaró que se deben calcular **ambos giros**, en X y en Y. Los resultados de clase corresponden a la región limitada por `y=x²`, `y=0` y `x=2` (el extremo `x=0` es la intersección de las dos curvas):

- Alrededor de **X**, discos: `V = π∫₀²(x²)²dx = π∫₀²x⁴dx = π[x⁵/5]₀² = 32π/5 ≈ 20.10619298`.
- Alrededor de **Y**, cascarones: `V = 2π∫₀²x·x²dx = 2π∫₀²x³dx = 2π[x⁴/4]₀² = 8π ≈ 25.13274123`.

La pantalla debe mostrar explícitamente `y=0` como frontera confirmada, aunque no se haya escrito en el enunciado abreviado; no debe inventarla silenciosamente. Estos dos cálculos son casos de aceptación distintos, con su figura y procedimiento propios.

Primera cobertura matemática: región entre `f(x)` y `y=0` en `[a,b]`, con giro alrededor del eje X (discos) o Y (cascarones). Para Y se mantendrá la restricción de que `[a,b]` quede a un solo lado de `x=0`, porque sumar cascarones de ambos lados puede contar volumen superpuesto. Los cambios de signo de `f` se marcarán como tramos de región y se evitará unirlos falsamente en el dibujo. Después de estabilizar ese contrato se podrá ampliar a otra curva frontera `g(x)`, arandelas y ejes desplazados; **no** se aplicará `π(R²−r²)` sin verificar qué radio es exterior en todo el intervalo. Una discontinuidad, intervalo no acotado o región que no cierra tendrá un mensaje explicativo, no un resultado engañoso.

### 3. Resultado con procedimiento comprobable

La salida seguirá siempre la misma secuencia: (1) datos y región elegida; (2) eje y corte transversal; (3) método —disco, cascarón o arandela cuando corresponda— y radios/altura; (4) integral construida y sustitución de `f(x)`; (5) expansión o simplificación del integrando; (6) antiderivada y evaluación de límites, si están soportadas; (7) **resultado exacto en primer plano** y aproximación decimal debajo. Para polinomios sencillos como `x²` deben aparecer `32π/5` y `8π`, no solo `20.106…` y `25.132…`. El valor exacto se derivará de la operación simbólica con coeficientes racionales, **nunca** se inventará convirtiendo retrospectivamente un decimal de Simpson en una fracción de π. Esto requiere integrar la expresión transformada (`[f(x)]²` o `x|f(x)|` por tramos), no simplemente llamar a la antiderivada básica de `f`. Si el motor no puede integrar simbólicamente, etiquetará el resultado como **aproximación numérica** y mostrará Simpson 1/3 con `n`, paso `h`, sumas ponderadas y una comparación de refinamiento; no fingirá pasos algebraicos que no calculó. La derivada puede ayudar a analizar la forma de la curva, pero no es necesaria para la fórmula del volumen.

La app explicará la **sección transversal** y, si reconoce un caso verificable, relacionará el método integral con una fórmula geométrica conocida: `f(x)=r` sobre una altura `h` alrededor de X forma un cilindro (`πr²h`); una recta que parte de radio cero forma un cono (`πr²h/3`). No etiquetará cualquier curva como cono o cilindro. La vista del sólido y sus cortes serán la ayuda principal para aprender a identificar la geometría.

### 4. Gráficas vinculadas a cada herramienta

```text
Selector de Cálculo
  ├─ Diferencial → Límites → curva 2D + punto de aproximación lateral
  ├─ Integral    → Volumen de revolución
  │                ├─ Región 2D: f(x), fronteras, eje y área sombreada
  │                └─ Sólido 3D: giro progresivo, sección y cámara interactiva
  ├─ Multivariable
  ├─ Ecuaciones diferenciales
  └─ Graficador
```

- **Volumen:** generar una malla paramétrica del sólido a partir de la región válida, no escoger una figura prefabricada por semejanza. Mostrar la curva y el área 2D al lado de una vista 3D sincronizada. Un control de ángulo `0–360°` permitirá observar el barrido en tiempo real, pausarlo y enseñar un disco/cascarón de muestra. La cámara tendrá rotación, zoom y reinicio como la de Vectores; la animación se detendrá al salir de la pantalla, al ocultar la pestaña y con movimiento reducido. Cambiar datos válidos actualizará la vista con una breve espera para no recalcular en cada tecla. La malla visual será una aproximación independiente del cálculo numérico del volumen.
- **Límites:** reutilizar ejes, colores y transformaciones, pero añadir una vista alrededor de `x=a` con trazos izquierdo/derecho, valor de `f(a)` separado del límite, huecos y asíntotas. Nunca unir visualmente una curva a través de una discontinuidad. El gráfico expresará el resultado de `computeLimit()`, no calculará otra respuesta por su cuenta.
- La proyección, el orden de polígonos y los controles de puntero de Vectores pueden servir de patrón; no se importará su estado mutable en Cálculo. `renderGraphCanvas()` tiene un rango `−N…N` fijo, así que se extraerán primitivas 2D reutilizables antes de usarlo para límites o regiones arbitrarias. Canvas 2D nativo será la primera opción; se medirá fluidez antes de considerar otra tecnología.

### 5. Orden de ejecución y criterios de cierre

1. Caracterizar con pruebas las cinco rutas actuales, el botón Atrás, los eventos dinámicos y los cálculos de cada panel. Separar pantallas/controladores y retirar la barra; comprobar que ningún acceso directo entre submódulos permanece.
2. Definir un objeto de problema de revolución (región, fronteras, eje, intervalo) y un resultado estructurado con método, fórmula, pasos, valor exacto cuando sea demostrable y valor aproximado. Probar entradas incompletas, curvas negativas, polos, intervalos inválidos y giro alrededor de ambos ejes. Mantener separados el cálculo puro y el HTML de pasos.
3. Implementar la región 2D, la malla/sólido 3D y el barrido angular con controles de Vectores adaptados. Probar vértices, radios, tapas y ausencia de `NaN`; verificar manualmente escritorio, móvil, ambos temas, interacción táctil y movimiento reducido.
4. Incorporar el gráfico de límites con casos `x²` al acercarse a 2, `sin(x)/x` al acercarse a 0 (hueco con límite 1) y `1/x` al acercarse a 0 (comportamientos laterales distintos). Probar que una asíntota no se dibuje como línea continua.
5. Cerrar con pruebas de integración de acciones y navegación, sintaxis de todos los módulos, HTTP/MIME, precarga de nuevas rutas en `sw.js`, recarga offline real y comparación visual contra resultados analíticos: cilindro, cono y los dos giros de `x²` descritos arriba. En estos últimos, verificar en la interfaz **frontera `y=0`, todos los pasos, `32π/5` y `8π` antes de los decimales**, no solo la coincidencia numérica. Actualizar README y este documento con **lo implementado**, sin presentar este plan como funcionalidad terminada.

No se ha modificado el código de producción como parte de este plan. La prueba automática existente de 22 archivos caracteriza el estado actual; no demuestra todavía la nueva navegación independiente ni las visualizaciones propuestas.
