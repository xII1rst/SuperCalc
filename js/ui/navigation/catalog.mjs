// Menús de cada módulo y destinos de Cálculo; datos sin DOM.
export const SUBMOD_CONFIG = {
  math: {
    title: '<span class="math-c">Matemáticas</span>',
    cards: [
      { icon:'algebra', name:'Álgebra', desc:'Vectores, matrices, funciones y sucesiones', id:'al', cls:'al-sub', action:'openSubmod' },
      { icon:'calculus', name:'Cálculo', desc:'Diferencial, integral, multivariable y curvas', id:'ca', cls:'ca-sub', action:'openSubmod' },
      { icon:'analysis', name:'Análisis numérico', desc:'Errores, raíces, sistemas, interpolación y PVI', id:'num', cls:'math-sub', action:'openSubmod' },
      { icon:'system', name:'Lógica matemática', desc:'Bases, proposiciones, conjuntos y grafos', id:'logic', cls:'math-sub', action:'openSubmod' },
      { icon:'statistics', name:'Estadística', desc:'Medidas, percentiles y gráficos de datos', id:'stats', cls:'math-sub' },
      { icon:'probability', name:'Probabilidad', desc:'Binomial, combinaciones y sumas de dados', id:'prob', cls:'math-sub', action:'openSubmod' },
      { icon:'experiments', name:'Experimentos', desc:'Dados, monedas y cifras de π', id:'exp', cls:'math-sub', action:'openSubmod' },
      { icon:'book', name:'Fichas teóricas', desc:'Definiciones, teoremas y cobertura por unidad', id:'theory-math', cls:'math-sub' },
    ]
  },
  num: {
    title: '<span class="math-c">Análisis numérico</span>',
    cards: [
      { icon:'error', name:'Errores y cifras', desc:'Error absoluto/relativo y cifras significativas', id:'num-errors', cls:'math-sub' },
      { icon:'taylor', name:'Taylor y error', desc:'Polinomio y resto de Lagrange con cota', id:'num-taylor', cls:'math-sub' },
      { icon:'precision', name:'Precisión finita', desc:'Redondeo o corte tras cada operación', id:'num-precision', cls:'math-sub' },
      { icon:'root', name:'Raíces', desc:'Bisección y Newton con historial', id:'num-roots', cls:'math-sub' },
      { icon:'matrix', name:'Sistemas iterativos', desc:'Jacobi y Gauss-Seidel', id:'num-linear', cls:'math-sub' },
      { icon:'jacobian', name:'Newton 2–6 variables', desc:'Jacobiano simbólico y residuo', id:'num-system', cls:'math-sub' },
      { icon:'stability', name:'Estabilidad de sistemas', desc:'Amplificación en X′=AX', id:'num-stability', cls:'math-sub' },
      { icon:'tangent', name:'Newton 2×2', desc:'Sistema no lineal con jacobiano y residuo', id:'num-system2d', cls:'math-sub' },
      { icon:'curve', name:'Interpolación y ajuste', desc:'Newton, Lagrange y mínimos cuadrados', id:'num-interpolation', cls:'math-sub' },
      { icon:'differential', name:'Derivación numérica', desc:'Diferencias finitas y refinamiento', id:'num-derivative', cls:'math-sub' },
      { icon:'quadrature', name:'Cuadratura con cota', desc:'Trapecio y Simpson con hipótesis de derivada', id:'num-quadrature', cls:'math-sub' },
      { icon:'ode', name:'PVI numérico', desc:'Euler, RK2, RK4 y Adams-Bashforth', id:'num-ode', cls:'math-sub' },
    ]
  },
  logic: {
    title: '<span class="math-c">Lógica matemática</span>',
    cards: [
      { icon:'algebra', name:'Bases y bits', desc:'Conversión, complemento a dos y operaciones', id:'logic-bases', cls:'math-sub' },
      { icon:'system', name:'Conjuntos y relaciones', desc:'Operaciones, propiedades y clases', id:'logic-sets', cls:'math-sub' },
      { icon:'probability', name:'Proposiciones', desc:'Tablas de verdad e inferencias', id:'logic-propositions', cls:'math-sub' },
      { icon:'matrix', name:'Simplificación booleana', desc:'Minitérminos y condiciones indiferentes', id:'logic-boolean', cls:'math-sub' },
      { icon:'plot', name:'Grafos y árboles', desc:'Recorridos, caminos, flujo y códigos', id:'logic-graphs', cls:'math-sub' },
    ]
  },
  prob: {
    title: '<span class="math-c">Probabilidad</span>',
    cards: [
      { icon:'algebra', name:'Combinaciones', desc:'Elegir k elementos entre n', id:'prob-combinations', cls:'math-sub' },
      { icon:'probability', name:'Éxitos en varios ensayos', desc:'Binomial, combinaciones y probabilidades acumuladas', id:'prob-coin', cls:'math-sub' },
      { icon:'experiments', name:'Suma de dados', desc:'Probabilidad y distribución de sumas', id:'prob-dice', cls:'math-sub' },
    ]
  },
  exp: {
    title: '<span class="math-c">Experimentos</span>',
    cards: [
      { icon:'experiments', name:'Tira el dado', desc:'Lanzamientos y frecuencias observadas', id:'exp-dice', cls:'math-sub' },
      { icon:'probability', name:'Cara o sello', desc:'Lanzamientos y frecuencias de moneda', id:'exp-coin', cls:'math-sub' },
      { icon:'math', name:'π con Chudnovsky', desc:'Hasta 100 cifras decimales', id:'exp-pi', cls:'math-sub' },
    ]
  },
  al: {
    title: '<span class="al-c">Álgebra</span>',
    groups: [
      { title:'Vectores y matrices', cls:'al-sub', cards:[
        { icon:'vector', name:'Vectores 3D', desc:'Operaciones, graficación y cálculo vectorial', id:'vectors', cls:'al-sub' },
        { icon:'line', name:'Rectas y planos 3D', desc:'Construcción, intersecciones, distancias y ángulos', id:'geom', cls:'al-sub' },
        { icon:'matrix', name:'Matrices y ecuaciones lineales', desc:'Operaciones, sistemas, determinantes y eigenvalores', id:'mat', cls:'al-sub' },
      ]},
      { title:'Espacios y transformaciones', cls:'al-sub', cards:[
        { icon:'algebra', name:'Bases y transformaciones', desc:'Gram-Schmidt, proyección, cambio de base y diagonalización', id:'linear', cls:'al-sub' },
      ]},
      { title:'Funciones y relaciones', cls:'al-sub', cards:[
        { icon:'inequality', name:'Inecuaciones', desc:'Libre, cuadrática, racional, sistemas y valor absoluto', id:'ineq', cls:'al-sub' },
        { icon:'function', name:'Funciones', desc:'Dominio, rango y análisis por tipo', id:'fn', cls:'al-sub' },
        { icon:'sequence', name:'Sucesiones y progresiones', desc:'Término n-ésimo, PA, PG y clasificación', id:'seq', cls:'al-sub' },
      ]},
    ]
  },
  fi: {
    title: '<span class="fi-c">Física</span>',
    cards: [
      { icon:'bolt', name:'Electromagnetismo', desc:'Electrostática, circuitos, magnetismo y ondas EM', id:'em', cls:'fi-sub', action:'openSubmod' },
      { icon:'mechanics', name:'Mecánica', desc:'Movimiento, proyectiles, fuerza y energía', id:'mech', cls:'fi-sub', action:'openSubmod' },
      { icon:'curve', name:'Ondas', desc:'Oscilaciones, sonido, propagación y óptica', id:'waves', cls:'fi-sub', action:'openSubmod' },
      { icon:'book', name:'Fichas teóricas', desc:'Definiciones, teoremas y cobertura por unidad', id:'theory-fi', cls:'fi-sub' },
    ]
  },
  em: {
    title: '<span class="fi-c">Electromagnetismo</span>',
    cards: [
      { icon:'bolt', name:'Campos y fórmulas básicas', desc:'Coulomb, Gauss, Lorentz, Faraday y Maxwell', id:'em-basics', cls:'fi-sub' },
      { icon:'physics', name:'Electrostática', desc:'Superposición, dieléctricos y Poisson 1D/2D', id:'emplus-electrostatics', cls:'fi-sub' },
      { icon:'system', name:'Circuitos', desc:'Equivalentes, nodos, RL y RLC en AC', id:'emplus-circuits', cls:'fi-sub' },
      { icon:'motion', name:'Magnetismo e inducción', desc:'Espira, solenoide, Hall y FEM', id:'emplus-magnetism', cls:'fi-sub' },
    ]
  },
  waves: {
    title: '<span class="fi-c">Ondas</span>',
    cards: [
      { icon:'motion', name:'Oscilaciones', desc:'MAS, resorte, péndulo, fasores y pulsaciones', id:'waves-oscillations', cls:'fi-sub' },
      { icon:'curve', name:'Ondas mecánicas', desc:'Cuerdas, sonido, Doppler y dispersión', id:'waves-mechanical', cls:'fi-sub' },
      { icon:'physics', name:'Ondas EM y óptica', desc:'Intensidad, polarización e interferencia', id:'waves-optics', cls:'fi-sub' },
    ]
  },
  mech: {
    title: '<span class="fi-c">Mecánica</span>',
    cards: [
      { icon:'motion', name:'Movimiento rectilíneo', desc:'MRU y MRUA, despejes y vectores', id:'mech-motion', cls:'fi-sub' },
      { icon:'mechanics', name:'Tiro parabólico', desc:'Lanzamiento, destino y trayectoria', id:'mech-projectile', cls:'fi-sub' },
      { icon:'bolt', name:'Fuerza y energía', desc:'F = ma, energía cinética y potencial', id:'mech-dynamics', cls:'fi-sub' },
      { icon:'vector', name:'Fuerzas y equilibrio', desc:'Torque, cables, vigas, planos y poleas', id:'mechplus-forces', cls:'fi-sub' },
      { icon:'circular', name:'Movimiento y marcos', desc:'Circular, corriente, peralte, rizo y marcos', id:'mechplus-motion', cls:'fi-sub' },
      { icon:'collision', name:'Colisiones y centro de masa', desc:'Impulso, energía y sistemas de partículas', id:'mechplus-collisions', cls:'fi-sub' },
      { icon:'physics', name:'Rotación y gravitación', desc:'Inercia y órbita circular', id:'mechplus-rotation', cls:'fi-sub' },
    ]
  },
  ca: {
    title: '<span class="ca-c">Cálculo</span>',
    groups: [
      { title:'Una variable', cls:'ca-sub', cards:[
        { icon:'differential', name:'Cálculo diferencial', desc:'Límites, derivadas y análisis de función', id:'calc-dif', cls:'ca-sub' },
        { icon:'tangent', name:'Aplicaciones diferenciales', desc:'Continuidad por tramos y derivadas de curvas', id:'study-differential', cls:'ca-sub' },
        { icon:'calculus', name:'Cálculo integral', desc:'Antiderivadas, integrales, volúmenes y Taylor', id:'calc-int', cls:'ca-sub' },
        { icon:'area', name:'Aplicaciones integrales', desc:'Áreas polares, arco, superficie y series', id:'study-integral', cls:'ca-sub' },
        { icon:'curve', name:'Curvas', desc:'Paramétricas, polares y cónicas', id:'calc-cur', cls:'ca-sub' },
      ]},
      { title:'Varias variables y modelos', cls:'ca-sub', cards:[
        { icon:'multivariable', name:'Cálculo multivariable', desc:'Derivadas parciales, gradiente e integral doble', id:'calc-mul', cls:'ca-sub' },
        { icon:'region', name:'Regiones y superficies', desc:'Integral doble variable y plano tangente', id:'study-multivariable', cls:'ca-sub' },
        { icon:'ode', name:'Ecuaciones diferenciales', desc:'Primer y segundo orden', id:'calc-edo', cls:'ca-sub' },
        { icon:'field', name:'Métodos de EDO', desc:'Separable, Bernoulli, logística, forzada, sistemas y Laplace', id:'study-ode', cls:'ca-sub' },
      ]},
      { title:'Visualización', cls:'ca-sub', cards:[
        { icon:'plot', name:'Graficador', desc:'Siete familias de funciones y tabla de valores', id:'calc-graf', cls:'ca-sub' },
      ]},
    ]
  }
};

export const CALC_DESTINATIONS={
  calc:'dif', 'calc-dif':'dif', 'calc-int':'int',
  'calc-mul':'mul', 'calc-edo':'edo', 'calc-graf':'graf',
  'calc-cur':'cur',
};

export function cardsOf(parent){
  const cfg = SUBMOD_CONFIG[parent];
  return cfg ? (cfg.groups ? cfg.groups.flatMap(group => group.cards) : cfg.cards) : [];
}

// Nombre de cada herramienta por su enlace directo, para las fichas teóricas.
export function routeCatalog(){
  const tools = new Map();
  for (const parent of Object.keys(SUBMOD_CONFIG)) {
    for (const card of cardsOf(parent)) if (card.action !== 'openSubmod') tools.set(`#/${parent}/${card.id}`, card.name);
  }
  return tools;
}
