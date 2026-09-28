import * as matrixUI from './algebra/matrix.mjs';
import * as ineqUI from './algebra/inequalities.mjs';

export function createNavigation({ initVectorsApp, emInit, emResizeCanvas, calcInit, fnBack, seqSetMode, mechOpenPanel, probOpenPanel, expOpenPanel }) {
// ═══════════════════════════════════════════════════════
// SUPER CALC — NAVIGATION
// ═══════════════════════════════════════════════════════
const SUBMOD_CONFIG = {
  math: {
    title: '<span class="math-c">Matemáticas</span>',
    cards: [
      { icon:'algebra', name:'Álgebra', desc:'Vectores, matrices, funciones y sucesiones', id:'al', cls:'al-sub', action:'openSubmod' },
      { icon:'calculus', name:'Cálculo', desc:'Diferencial, integral, multivariable y curvas', id:'ca', cls:'ca-sub', action:'openSubmod' },
      { icon:'statistics', name:'Estadística', desc:'Medidas, percentiles y gráficos de datos', id:'stats', cls:'math-sub' },
      { icon:'probability', name:'Probabilidad', desc:'Binomial, combinaciones y sumas de dados', id:'prob', cls:'math-sub', action:'openSubmod' },
      { icon:'experiments', name:'Experimentos', desc:'Dados, monedas y cifras de π', id:'exp', cls:'math-sub', action:'openSubmod' },
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
        { icon:'matrix', name:'Matrices y ecuaciones lineales', desc:'Operaciones, sistemas, determinantes y eigenvalores', id:'mat', cls:'al-sub' },
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
      { icon:'bolt', name:'Electromagnetismo', desc:'Coulomb, Gauss, Lorentz, Faraday, Maxwell y aplicaciones', id:'em', cls:'fi-sub' },
      { icon:'mechanics', name:'Mecánica', desc:'Movimiento, proyectiles, fuerza y energía', id:'mech', cls:'fi-sub', action:'openSubmod' },
    ]
  },
  mech: {
    title: '<span class="fi-c">Mecánica</span>',
    cards: [
      { icon:'motion', name:'Movimiento rectilíneo', desc:'MRU y MRUA, despejes y vectores', id:'mech-motion', cls:'fi-sub' },
      { icon:'mechanics', name:'Tiro parabólico', desc:'Lanzamiento, destino y trayectoria', id:'mech-projectile', cls:'fi-sub' },
      { icon:'bolt', name:'Fuerza y energía', desc:'F = ma, energía cinética y potencial', id:'mech-dynamics', cls:'fi-sub' },
    ]
  },
  ca: {
    title: '<span class="ca-c">Cálculo</span>',
    groups: [
      { title:'Una variable', cls:'ca-sub', cards:[
        { icon:'differential', name:'Cálculo diferencial', desc:'Límites, derivadas y análisis de función', id:'calc-dif', cls:'ca-sub' },
        { icon:'calculus', name:'Cálculo integral', desc:'Antiderivadas, integrales, volúmenes y Taylor', id:'calc-int', cls:'ca-sub' },
        { icon:'curve', name:'Curvas', desc:'Paramétricas, polares y cónicas', id:'calc-cur', cls:'ca-sub' },
      ]},
      { title:'Varias variables y modelos', cls:'ca-sub', cards:[
        { icon:'multivariable', name:'Cálculo multivariable', desc:'Derivadas parciales, gradiente e integral doble', id:'calc-mul', cls:'ca-sub' },
        { icon:'ode', name:'Ecuaciones diferenciales', desc:'Primer y segundo orden', id:'calc-edo', cls:'ca-sub' },
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
  const moduleIds = ['app','em-app','mech-app','mat-app','calc-app','ineq-app','fn-app','seq-app','stats-app','prob-app','exp-app'];
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
  const backLabel = ['al','ca','prob','exp'].includes(parent) ? 'Matemáticas' : parent === 'mech' ? 'Física' : 'Inicio';
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
  } else if (id === 'em') {
    document.getElementById('submod-screen').classList.remove('visible');
    scheduleModuleLaunch(() => {
      document.getElementById('em-app').classList.add('visible');
      emInit();
      setTimeout(() => emResizeCanvas(), 50);
      setTimeout(() => emResizeCanvas(), 350);
    });
  } else if (id === 'mat') {
    document.getElementById('submod-screen').classList.remove('visible');
    scheduleModuleLaunch(() => {
      document.getElementById('mat-app').classList.add('visible');
      matrixUI.matInit();
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
