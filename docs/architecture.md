# Arquitectura de SuperCalc

Aplicación web progresiva en módulos ES nativos, sin npm ni paso de compilación. Este documento describe cómo está dividido el código y cómo se comprueba que un cambio no altera el comportamiento.

## Capas

| Carpeta | Contenido | Puede importar |
| --- | --- | --- |
| `js/math/` | Cálculos puros, sin DOM ni canvas | `math`, `utils` |
| `js/graphics/` | Dibujo con Canvas 2D y SVG | `graphics`, `math`, `utils`, `state` |
| `js/ui/` | Formularios, navegación y eventos | todo lo anterior y `content` |
| `js/content/` | Datos (fichas teóricas) | `content` |
| `js/state/`, `js/utils/` | Estado compartido y formato | su propia capa (`state` también `utils`) |

`tests/architecture.test.mjs` lee el grafo de módulos con el propio analizador del motor y falla si una importación no existe, si hay un ciclo o si una capa importa otra no permitida.

## Fachadas

Los módulos grandes se dividieron por responsabilidad y su ruta antigua quedó como **fachada** de reexportaciones, de modo que los importadores y las pruebas no cambian:

- `js/math/calculus.mjs` → `js/math/calculus/` (analizador, AST, impresión, formato, derivadas, formas de límites, límites, núcleos numéricos, revolución, antiderivada).
- `js/math/integration.mjs` → `js/math/integration/` (motor, reglas básica/sustitución/partes/trigonométrica, fracciones parciales, polinomios, impropias, definidas). Las reglas recursivas reciben `integrateNode` como parámetro: ninguna importa el motor.
- `js/ui/calculus.mjs` → `js/ui/calculus/` (teclado, fichas, resultados, diferencial, aplicaciones, integral, series, multivariable, EDO, curvas, vista previa, revolución); `calcInit` sigue en la fachada.

Los módulos internos importan de sus vecinos directos, nunca de la fachada.

## Registros por familia

Las herramientas con muchos modos declaran cada modo junto a sus campos y su solucionador, agrupados por familia:

- `js/ui/study/` (cálculo aplicado: diferencial, integral, multivariable, EDO), `js/ui/electromagnetism/` (electrostática, circuitos, magnetismo), `js/ui/mechanics/` (fuerzas, movimiento, colisiones, rotación) y `js/ui/waves/` (oscilaciones, ondas mecánicas, óptica) exportan `fields`/`modes` y `solvers`.
- `js/ui/numerical/` y `js/ui/logic/` exportan su tabla `panels` junto a cada manejador.

La fachada de cada herramienta une las familias y busca el solucionador por clave propia; una clave desconocida lanza el mismo error que antes. Para añadir un modo basta con editar su familia. `tests/registries.test.mjs` exige las mismas claves en campos, modos y solucionadores, sin repetidos entre familias.

## Estado y oyentes

Cada variable de estado de módulo tiene un único dueño que la asigna; los demás la leen por enlace vivo o usan una función del dueño (`setCalcActiveInput`, `clearRevolutionSolid`, `stopAnimation`). Los núcleos de vectores y del electromagnetismo básico conservan su estado juntos de forma deliberada: su lienzo lee una veintena de variables compartidas, y separarlos exigiría reescribirlos.

## Acciones

`app.js` compone la tabla de acciones con `composeActions` (`js/ui/action-registry.mjs`): mismo orden y mismas funciones que la antigua propagación de espacios de nombres, pero un nombre ligado a dos funciones distintas es un error. `physicsOutputUnitChanged` tiene como dueño `js/ui/physics-output.mjs`, aunque tres fachadas lo reexporten.

## Navegación

`createNavigation` es el único punto de inicialización: conserva el ciclo de vida de pantallas, el historial y los temporizadores. Los menús (`SUBMOD_CONFIG`) y el catálogo de rutas están en `js/ui/navigation/catalog.mjs`; el diálogo de salida en `exit-dialog.mjs`.

## Búsqueda

`js/ui/search.mjs` crea el diálogo de búsqueda al abrirlo por primera vez. `search/catalog.mjs` deriva sus entradas de los menús y de los registros de modos; `search/markup.mjs` añade fichas de cálculo, pestañas de matrices y opciones de geometría y espacios lineales desde el marcado existente. Añadir una operación a esos registros o formularios también la incorpora al buscador. Los sinónimos y el ranking están en `js/utils/search.mjs`, sin DOM.

La búsqueda usa las acciones declarativas y el oyente de teclado existente de `bindActions`; no añade oyentes al arrancar. `navigation.searchGo` valida el destino, cierra la pantalla activa y cancela transiciones pendientes. Su callback selecciona la operación después de inicializar la nueva pantalla. Los módulos y estilos se precargan para funcionar sin conexión.

## Marcado y estilos

- `index.html` es un **archivo generado**. El marcado se edita en `html/` (`shell.html` incluye un fragmento por pantalla) y se ensambla con `node scripts/assemble-html.mjs`. `tests/html-assembly.test.mjs` falla si `index.html` quedó desactualizado.
- Los estilos están en `styles/`, enlazados desde el HTML en orden de cascada después de `fonts/fonts.css` y `theme.css`. Toda hoja enlazada debe estar en la precarga de `sw.js` (lo comprueba `tests/theme.test.mjs`).
- Al cambiar un recurso precargado se incrementa `CACHE` en `sw.js`.

## Pruebas de comportamiento

Además de las pruebas por módulo:

- **Salidas de referencia** (`tests/fixtures/golden/`): `calculus-golden` e `integration-golden` reproducen miles de llamadas registradas; `study-golden` ejecuta los 81 modos de estudio con sus valores por defecto. Se regeneran con `GOLDEN_WRITE=1` solo cuando un cambio de comportamiento es intencionado.
- **Trazas de interfaz** (`tests/fixtures/golden/ui-trace/`): el arnés de `tests/helpers/app-harness.mjs` registra cada efecto observable (escrituras en el DOM, clases, atributos, oyentes, temporizadores con su estado de cancelación, historial y almacenamiento) y compara su huella por archivo de prueba. `UI_TRACE_WRITE=1` registra nuevas trazas; `UI_TRACE_DUMP=<dir>` las vuelca para compararlas.
- `tests/calculus-interaction.test.mjs` usa el reloj manual del arnés para comprobar oyentes únicos al reabrir y la espera de 250 ms de la vista previa.

`node scripts/audit.mjs` informa del tamaño del código escrito a mano y de las líneas muy largas.
