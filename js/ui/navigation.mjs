import * as matrixUI from './algebra/matrix.mjs';
import * as ineqUI from './algebra/inequalities.mjs';

export function createNavigation({ initVectorsApp, emInit, emResizeCanvas, emPlusOpenPanel, calcInit, studyOpenPanel, geomInit, linearInit, numOpenPanel, logicOpenPanel, wavesOpenPanel, fnBack, seqSetMode, mechOpenPanel, mechPlusOpenPanel, probOpenPanel, expOpenPanel }) {
// ═══════════════════════════════════════════════════════
// SUPER CALC — NAVIGATION
// ═══════════════════════════════════════════════════════
const SUBMOD_CONFIG = {
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
    ]
  },
  num: {
    title: '<span class="math-c">Análisis numérico</span>',
    cards: [
      { icon:'analysis', name:'Errores y cifras', desc:'Error absoluto/relativo y cifras significativas', id:'num-errors', cls:'math-sub' },
      { icon:'root', name:'Raíces', desc:'Bisección y Newton con historial', id:'num-roots', cls:'math-sub' },
      { icon:'matrix', name:'Sistemas iterativos', desc:'Jacobi y Gauss-Seidel', id:'num-linear', cls:'math-sub' },
      { icon:'curve', name:'Interpolación y ajuste', desc:'Newton, Lagrange y mínimos cuadrados', id:'num-interpolation', cls:'math-sub' },
      { icon:'tangent', name:'Derivación numérica', desc:'Diferencias finitas y refinamiento', id:'num-derivative', cls:'math-sub' },
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
    ]
  },
  em: {
    title: '<span class="fi-c">Electromagnetismo</span>',
    cards: [
      { icon:'bolt', name:'Campos y fórmulas básicas', desc:'Coulomb, Gauss, Lorentz, Faraday y Maxwell', id:'em-basics', cls:'fi-sub' },
      { icon:'physics', name:'Electrostática', desc:'Superposición, dieléctricos y Poisson 1D', id:'emplus-electrostatics', cls:'fi-sub' },
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
      { icon:'motion', name:'Movimiento y marcos', desc:'Circular, corriente, peralte, rizo y marcos', id:'mechplus-motion', cls:'fi-sub' },
      { icon:'mechanics', name:'Colisiones y centro de masa', desc:'Impulso, energía y sistemas de partículas', id:'mechplus-collisions', cls:'fi-sub' },
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
        { icon:'analysis', name:'Aplicaciones integrales', desc:'Áreas polares, arco, superficie y series', id:'study-integral', cls:'ca-sub' },
        { icon:'curve', name:'Curvas', desc:'Paramétricas, polares y cónicas', id:'calc-cur', cls:'ca-sub' },
      ]},
      { title:'Varias variables y modelos', cls:'ca-sub', cards:[
        { icon:'multivariable', name:'Cálculo multivariable', desc:'Derivadas parciales, gradiente e integral doble', id:'calc-mul', cls:'ca-sub' },
        { icon:'curve', name:'Regiones y superficies', desc:'Integral doble variable y plano tangente', id:'study-multivariable', cls:'ca-sub' },
        { icon:'ode', name:'Ecuaciones diferenciales', desc:'Primer y segundo orden', id:'calc-edo', cls:'ca-sub' },
        { icon:'analysis', name:'Métodos de EDO', desc:'Separable, Bernoulli, logística, forzada, sistemas y Laplace', id:'study-ode', cls:'ca-sub' },
      ]},
      { title:'Visualización', cls:'ca-sub', cards:[
        { icon:'plot', name:'Graficador', desc:'Siete familias de funciones y tabla de valores', id:'calc-graf', cls:'ca-sub' },
      ]},
    ]
  }
};

const CALC_DESTINATIONS={
  calc:'dif', 'calc-dif':'dif', 'calc-int':'int',
  'calc-mul':'mul', 'calc-edo':'edo', 'calc-graf':'graf',
  'calc-cur':'cur',
};

let currentParent = null;
let launcherRevealTimer = null;
let submodRevealTimer = null;
let moduleLaunchTimer = null;

function navPush(state){
  history.pushState(state, '');
}

function activeModuleId() {
  const moduleIds = ['app','em-app','emplus-app','mech-app','mechplus-app','waves-app','mat-app','geom-app','linear-app','num-app','logic-app','study-app','calc-app','ineq-app','fn-app','seq-app','stats-app','prob-app','exp-app'];
  const activeModule = moduleIds.find(id => {
    const el = document.getElementById(id);
    return el && (el.style.display === 'flex' || el.classList.contains('visible'));
  });
  return activeModule?.replace('-app','').replace('app','vectors');
}

window.addEventListener('popstate', (event) => {
  clearTimeout(submodRevealTimer);
  clearTimeout(moduleLaunchTimer);
  const state = event.state;
  if (state?.sc === 'exit') {
    _confirmExit();
    return;
  }
  const active = activeModuleId();
  if (active) _closeModuleNoHistory(active);
  if (state?.sc === 'launcher') {
    showLauncher();
  } else if (state?.sc === 'submod' && Object.hasOwn(SUBMOD_CONFIG, state.parent)) {
    hideLauncherImmediately();
    renderSubmod(state.parent);
    const screen = document.getElementById('submod-screen');
    screen.inert = false;
    screen.classList.add('visible');
  } else if (state?.sc === 'module') {
    hideLauncherImmediately();
    if (Object.hasOwn(SUBMOD_CONFIG, state.parent)) renderSubmod(state.parent);
    launchSubmod(state.id, false);
  }
});

window.addEventListener('load', () => {
  history.replaceState({sc:'exit'}, '');
  history.pushState({sc:'launcher'}, '');
  setAuthorVisible(true);
});

function hideLauncherImmediately() {
  clearTimeout(launcherRevealTimer);
  const launcher = document.getElementById('launcher');
  launcher.inert = true;
  launcher.classList.add('hidden');
  launcher.style.display = 'none';
  setAuthorVisible(false);
}

function showLauncher(){
  const screen = document.getElementById('submod-screen');
  screen.classList.remove('visible');
  screen.inert = true;
  const launcher = document.getElementById('launcher');
  launcher.inert = false;
  launcher.style.display = 'flex';
  launcher.style.opacity = '0';
  clearTimeout(launcherRevealTimer);
  launcherRevealTimer = setTimeout(() => {
    launcher.classList.remove('hidden');
    launcher.style.opacity = '';
    setAuthorVisible(true);
  }, 50);
}

function _closeModuleNoHistory(id){
  if(id==='vectors')      document.getElementById('app').style.display='none';
  else if(id==='em')      document.getElementById('em-app').classList.remove('visible');
  else if(id==='mat')     document.getElementById('mat-app').classList.remove('visible');
  else if(id==='geom') {
    const screen = document.getElementById('geom-app');
    screen.classList.remove('visible');
    screen.inert = true;
  }
  else if(id==='linear') {
    const screen = document.getElementById('linear-app');
    screen.classList.remove('visible');
    screen.inert = true;
  }
  else if(id==='num') {
    const screen = document.getElementById('num-app');
    screen.classList.remove('visible');
    screen.inert = true;
  }
  else if(id==='logic') {
    const screen = document.getElementById('logic-app');
    screen.classList.remove('visible');
    screen.inert = true;
  }
  else if(id==='waves') {
    const screen = document.getElementById('waves-app');
    screen.classList.remove('visible');
    screen.inert = true;
  }
  else if(id==='mechplus') {
    const screen = document.getElementById('mechplus-app');
    screen.classList.remove('visible');
    screen.inert = true;
  }
  else if(id==='emplus') {
    const screen = document.getElementById('emplus-app');
    screen.classList.remove('visible');
    screen.inert = true;
  }
  else if(id==='study') {
    const screen = document.getElementById('study-app');
    screen.classList.remove('visible');
    screen.inert = true;
  }
  else if(id==='ineq'){   document.getElementById('ineq-app').classList.remove('visible'); setTimeout(()=>ineqUI.ineqBack(),350); }
  else if(id==='fn'){    document.getElementById('fn-app').classList.remove('visible'); setTimeout(()=>fnBack(),350); }
  else if(id==='seq'){   document.getElementById('seq-app').classList.remove('visible'); }
  else if(id==='calc')    document.getElementById('calc-app').classList.remove('visible');
  else if(id==='stats' || id==='prob' || id==='exp' || id==='mech') {
    const screen = document.getElementById(`${id}-app`);
    screen.classList.remove('visible');
    screen.inert = true;
  }
}

function setAuthorVisible(visible){
  const el = document.getElementById('sc-author-footer');
  if(el) el.style.opacity = visible ? '' : '0';
}

function _confirmExit(){
  const confirmed = confirm('¿Salir de SuperCalc?');
  if(confirmed){
    history.go(-1);
  } else {
    history.pushState({sc:'launcher'}, '');
  }
}

function renderSubmod(parent) {
  currentParent = parent;
  const cfg = SUBMOD_CONFIG[parent];
  document.getElementById('submod-title').innerHTML = cfg.title;
  const backLabel = ['al','ca','prob','exp','num','logic'].includes(parent) ? 'Matemáticas' : ['mech','waves','em'].includes(parent) ? 'Física' : 'Inicio';
  document.getElementById('submod-back').innerHTML = `<svg class="sc-icon" aria-hidden="true"><use href="#sc-icon-arrow-left"></use></svg> ${backLabel}`;
  const cardsEl = document.getElementById('submod-cards');
  const renderCard=c=>`
    <button type="button" class="submod-card ${c.cls}" data-action="${c.action || 'launchSubmod'}" data-arg="${c.id}">
      <span class="submod-icon"><svg class="sc-icon" aria-hidden="true"><use href="#sc-icon-${c.icon}"></use></svg></span>
      <span class="submod-info">
        <span class="submod-name">${c.name}</span>
        <span class="submod-desc">${c.desc}</span>
      </span>
      <span class="submod-arrow"><svg class="sc-icon" aria-hidden="true"><use href="#sc-icon-chevron"></use></svg></span>
    </button>`;
  cardsEl.innerHTML = cfg.groups
    ? cfg.groups.map(group=>`
      <section class="submod-group ${group.cls}" aria-label="${group.title}">
        <h2 class="submod-group-title">${group.title}</h2>
        ${group.cards.map(renderCard).join('')}
      </section>`).join('')
    : cfg.cards.map(renderCard).join('');
}

function openSubmod(parent) {
  if (!Object.hasOwn(SUBMOD_CONFIG, parent)) return;
  setAuthorVisible(false);
  renderSubmod(parent);
  const screen = document.getElementById('submod-screen');
  screen.inert = false;
  if (screen.classList.contains('visible')) {
    navPush({sc:'submod', parent});
    return;
  }
  const launcher = document.getElementById('launcher');
  clearTimeout(launcherRevealTimer);
  launcher.inert = true;
  launcher.classList.add('hidden');
  submodRevealTimer = setTimeout(() => {
    launcher.style.display = 'none';
    screen.classList.add('visible');
  }, 300);
  navPush({sc:'submod', parent});
}

function closeSubmod() {
  history.back();
}

function scheduleModuleLaunch(callback) {
  clearTimeout(moduleLaunchTimer);
  moduleLaunchTimer = setTimeout(callback, 300);
}

function launchSubmod(id, recordHistory = true) {
  document.getElementById('submod-screen').inert = true;
  if (id === 'vectors') {
    document.getElementById('submod-screen').classList.remove('visible');
    scheduleModuleLaunch(() => {
      document.getElementById('app').style.display = 'flex';
      initVectorsApp();
    });
  } else if (id === 'em' || id === 'em-basics') {
    document.getElementById('submod-screen').classList.remove('visible');
    scheduleModuleLaunch(() => {
      document.getElementById('em-app').classList.add('visible');
      emInit();
      setTimeout(() => emResizeCanvas(), 50);
      setTimeout(() => emResizeCanvas(), 350);
    });
  } else if (id.startsWith('emplus-') && ['electrostatics','circuits','magnetism'].includes(id.slice(7))) {
    document.getElementById('submod-screen').classList.remove('visible');
    scheduleModuleLaunch(() => {
      const screen = document.getElementById('emplus-app');
      screen.inert = false;
      screen.classList.add('visible');
      emPlusOpenPanel(id.slice(7));
    });
  } else if (id === 'mat') {
    document.getElementById('submod-screen').classList.remove('visible');
    scheduleModuleLaunch(() => {
      document.getElementById('mat-app').classList.add('visible');
      matrixUI.matInit();
    });
  } else if (id === 'geom') {
    document.getElementById('submod-screen').classList.remove('visible');
    scheduleModuleLaunch(() => {
      const screen = document.getElementById('geom-app');
      screen.inert = false;
      screen.classList.add('visible');
      geomInit();
    });
  } else if (id === 'linear') {
    document.getElementById('submod-screen').classList.remove('visible');
    scheduleModuleLaunch(() => {
      const screen = document.getElementById('linear-app');
      screen.inert = false;
      screen.classList.add('visible');
      linearInit();
    });
  } else if (id.startsWith('num-') && ['errors','roots','linear','interpolation','derivative','ode'].includes(id.slice(4))) {
    document.getElementById('submod-screen').classList.remove('visible');
    scheduleModuleLaunch(() => {
      const screen = document.getElementById('num-app');
      screen.inert = false;
      screen.classList.add('visible');
      numOpenPanel(id.slice(4));
    });
  } else if (id.startsWith('logic-') && ['bases','sets','propositions','boolean','graphs'].includes(id.slice(6))) {
    document.getElementById('submod-screen').classList.remove('visible');
    scheduleModuleLaunch(() => {
      const screen = document.getElementById('logic-app');
      screen.inert = false;
      screen.classList.add('visible');
      logicOpenPanel(id.slice(6));
    });
  } else if (id.startsWith('waves-') && ['oscillations','mechanical','optics'].includes(id.slice(6))) {
    document.getElementById('submod-screen').classList.remove('visible');
    scheduleModuleLaunch(() => {
      const screen = document.getElementById('waves-app');
      screen.inert = false;
      screen.classList.add('visible');
      wavesOpenPanel(id.slice(6));
    });
  } else if (id.startsWith('mechplus-') && ['forces','motion','collisions','rotation'].includes(id.slice(9))) {
    document.getElementById('submod-screen').classList.remove('visible');
    scheduleModuleLaunch(() => {
      const screen = document.getElementById('mechplus-app');
      screen.inert = false;
      screen.classList.add('visible');
      mechPlusOpenPanel(id.slice(9));
    });
  } else if (id.startsWith('study-') && ['differential','integral','multivariable','ode'].includes(id.slice(6))) {
    document.getElementById('submod-screen').classList.remove('visible');
    scheduleModuleLaunch(() => {
      const screen = document.getElementById('study-app');
      screen.inert = false;
      screen.classList.add('visible');
      studyOpenPanel(id.slice(6));
    });
  } else if (Object.hasOwn(CALC_DESTINATIONS,id)) {
    document.getElementById('submod-screen').classList.remove('visible');
    scheduleModuleLaunch(() => {
      document.getElementById('calc-app').classList.add('visible');
      calcInit(CALC_DESTINATIONS[id]);
    });
  } else if (id === 'ineq') {
    document.getElementById('submod-screen').classList.remove('visible');
    scheduleModuleLaunch(() => {
      document.getElementById('ineq-app').classList.add('visible');
    });
  } else if (id === 'fn') {
    document.getElementById('submod-screen').classList.remove('visible');
    scheduleModuleLaunch(() => {
      document.getElementById('fn-app').classList.add('visible');
    });
  } else if (id === 'seq') {
    document.getElementById('submod-screen').classList.remove('visible');
    scheduleModuleLaunch(() => {
      document.getElementById('seq-app').classList.add('visible');
      seqSetMode('terminos');
    });
  } else if (id.startsWith('mech-') && ['motion','projectile','dynamics'].includes(id.slice(5))) {
    document.getElementById('submod-screen').classList.remove('visible');
    scheduleModuleLaunch(() => {
      const screen = document.getElementById('mech-app');
      screen.inert = false;
      screen.classList.add('visible');
      mechOpenPanel(id.slice(5));
    });
  } else if (id.startsWith('prob-') && ['combinations','coin','dice'].includes(id.slice(5))) {
    document.getElementById('submod-screen').classList.remove('visible');
    scheduleModuleLaunch(() => {
      const screen = document.getElementById('prob-app');
      screen.inert = false;
      screen.classList.add('visible');
      probOpenPanel(id.slice(5));
    });
  } else if (id.startsWith('exp-') && ['dice','coin','pi'].includes(id.slice(4))) {
    document.getElementById('submod-screen').classList.remove('visible');
    scheduleModuleLaunch(() => {
      const screen = document.getElementById('exp-app');
      screen.inert = false;
      screen.classList.add('visible');
      expOpenPanel(id.slice(4));
    });
  } else if (id === 'stats' || id === 'prob' || id === 'exp' || id === 'mech') {
    document.getElementById('submod-screen').classList.remove('visible');
    scheduleModuleLaunch(() => {
      const screen = document.getElementById(`${id}-app`);
      screen.inert = false;
      screen.classList.add('visible');
    });
  }
  if (recordHistory) navPush({sc:'module', id, parent:currentParent});
}

function closeModule() {
  history.back();
}

// Legacy goHome — now goes to submod screen
function goHome() {
  closeModule('em');
}

return { openSubmod, launchSubmod, closeSubmod, closeModule, goHome };
}
