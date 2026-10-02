# SuperCalc v1.0

SuperCalc es una aplicación web progresiva de cálculo científico y visualización matemática, desarrollada por **Rafael Miranda**. Funciona con JavaScript modular nativo, Canvas 2D y un service worker; no requiere framework, dependencias de npm ni compilación.

Disponible en: https://supercalc-sooty.vercel.app

## Cómo se usa

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
├── index.html        Archivo generado: se edita en html/ y se ensambla
├── html/             shell.html y un fragmento por pantalla
├── app.js            Arranque ES y composición de la tabla de acciones
├── theme.css         Paletas oscura y clara
├── styles/           Distribución visual y componentes, en orden de cascada
├── fonts/            Tipografías locales (OFL)
├── sw.js             Caché y funcionamiento offline
├── js/
│   ├── math/         Cálculos sin DOM ni canvas (calculus/ e integration/ por responsabilidad)
│   ├── ui/           Pantallas, formularios, navegación y eventos (una carpeta por herramienta grande)
│   ├── graphics/     Dibujo con Canvas 2D y SVG
│   ├── content/      Fichas teóricas, una por materia
│   ├── state/        Estado compartido de figuras
│   ├── utils/        Formato numérico, fracciones y radicales
│   └── offline.mjs   Registro PWA, instalación y actualización
├── scripts/          assemble-html.mjs (ensambla index.html) y audit.mjs (informe de tamaño)
├── docs/             architecture.md: capas, fachadas, registros y pruebas
└── tests/            Pruebas de Node, sin navegador
```

El recorrido principal es `HTML → js/ui/events.mjs → app.js → js/ui/ → js/math/ → js/graphics/`. Los motores de `js/math/` reciben datos y devuelven resultados sin leer la interfaz. Las expresiones introducidas se evalúan localmente y no constituyen un parser seguro para datos de origen no confiable. [docs/architecture.md](docs/architecture.md) explica la división en módulos y cómo se protege el comportamiento.

## Ejecutar y comprobar

Servir la raíz por HTTP y abrir `http://127.0.0.1:8765/` (los módulos ES y el service worker no se prueban desde `file://`):

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Ejecutar las pruebas automatizadas:

```sh
node --experimental-vm-modules --test tests/*.test.mjs
```

Después de editar el marcado en `html/`, regenerar `index.html` (la suite falla mientras esté desactualizado):

```sh
node scripts/assemble-html.mjs
```

La suite comprueba motores matemáticos, salidas de referencia, acciones de interfaz simuladas con su traza de efectos, la arquitectura de módulos, temas y precarga offline. El aspecto visual y el control offline real se comprueban además desde el navegador.

© Rafael Miranda — SuperCalc
