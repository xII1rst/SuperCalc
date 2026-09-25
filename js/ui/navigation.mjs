import * as matrixUI from './algebra/matrix.mjs';
import * as ineqUI from './algebra/inequalities.mjs';

export function createNavigation({ initVectorsApp, emInit, emResizeCanvas, calcInit, fnBack, seqSetMode }) {
// ═══════════════════════════════════════════════════════
// SUPER CALC — NAVIGATION
// ═══════════════════════════════════════════════════════
const SUBMOD_CONFIG = {
  al: {
    title: '<span class="al-c">Álgebra</span>',
    groups: [
      { title:'Vectores y matrices', cls:'al-sub', cards:[
        { icon:'⟶', name:'Vectores 3D', desc:'Operaciones, graficación y cálculo vectorial', id:'vectors', cls:'al-sub' },
        { icon:'▦', name:'Matrices y ecuaciones lineales', desc:'Operaciones, sistemas, determinantes y eigenvalores', id:'mat', cls:'al-sub' },
      ]},
      { title:'Funciones y relaciones', cls:'al-sub', cards:[
        { icon:'≠', name:'Inecuaciones', desc:'Libre, cuadrática, racional, sistemas y valor absoluto', id:'ineq', cls:'al-sub' },
        { icon:'f(x)', name:'Funciones', desc:'Dominio, rango y análisis por tipo', id:'fn', cls:'al-sub' },
        { icon:'Σ', name:'Sucesiones y progresiones', desc:'Término n-ésimo, PA, PG y clasificación', id:'seq', cls:'al-sub' },
      ]},
    ]
  },
  fi: {
    title: '<span class="fi-c">Física</span>',
    cards: [
      { icon:'⚡', name:'Electromagnetismo', desc:'Coulomb, Gauss, Lorentz, Faraday, Maxwell y aplicaciones', id:'em', cls:'fi-sub' },
    ]
  },
  ca: {
    title: '<span class="ca-c">Cálculo</span>',
    groups: [
      { title:'Una variable', cls:'ca-sub', cards:[
        { icon:'∂', name:'Cálculo diferencial', desc:'Límites, derivadas y análisis de función', id:'calc-dif', cls:'ca-sub' },
        { icon:'∫', name:'Cálculo integral', desc:'Antiderivadas, integrales, volúmenes y Taylor', id:'calc-int', cls:'ca-sub' },
      ]},
      { title:'Varias variables y modelos', cls:'ca-sub', cards:[
        { icon:'∇', name:'Cálculo multivariable', desc:'Derivadas parciales, gradiente e integral doble', id:'calc-mul', cls:'ca-sub' },
        { icon:'dy', name:'Ecuaciones diferenciales', desc:'Primer y segundo orden', id:'calc-edo', cls:'ca-sub' },
      ]},
      { title:'Visualización', cls:'ca-sub', cards:[
        { icon:'📈', name:'Graficador', desc:'Siete familias de funciones y tabla de valores', id:'calc-graf', cls:'ca-sub' },
      ]},
    ]
  }
};

const CALC_DESTINATIONS={
  calc:'dif', 'calc-dif':'dif', 'calc-int':'int',
  'calc-mul':'mul', 'calc-edo':'edo', 'calc-graf':'graf',
};

let currentParent = null;

// ══════════════════════════════════════════════════════
// ── NAVEGACIÓN CON HISTORY API (back button) ──────────
// Cada transición empuja un estado al historial del navegador.
// El botón back del SO/navegador dispara popstate y retrocede
// un nivel en lugar de cerrar la app.
// ══════════════════════════════════════════════════════

// Estados posibles: 'launcher' | 'submod' | 'module'
function navPush(state){
  history.pushState(state, '');
}

window.addEventListener('popstate', (e) => {
  const state = e.state;
  // Determinar dónde estamos ahora y retroceder un nivel
  const moduleIds = ['app','em-app','mat-app','calc-app','ineq-app','fn-app','seq-app'];
  const activeModule = moduleIds.find(id => {
    const el = document.getElementById(id);
    return el && (el.style.display === 'flex' || el.classList.contains('visible'));
  });
  const submodVisible = document.getElementById('submod-screen')?.classList.contains('visible');

  if(activeModule){
    // Estamos en un módulo → volver a submod-screen sin cerrar app
    _closeModuleNoHistory(activeModule.replace('-app','').replace('app','vectors'));
  } else if(submodVisible){
    // Estamos en submod → volver al launcher
    _closeSubmodNoHistory();
  } else {
    // Estamos en el launcher → preguntar si quiere salir
    _confirmExit();
  }
  // Siempre mantener al menos un estado en el historial
  // para que el siguiente back también lo interceptemos
  history.pushState({sc:'base'}, '');
});

// Inicializar historial al cargar
window.addEventListener('load', () => {
  history.replaceState({sc:'launcher'}, '');
  history.pushState({sc:'base'}, '');
  setAuthorVisible(true);
});

// ── Versiones internas sin pushState (evitar loops) ────
function _closeSubmodNoHistory(){
  document.getElementById('submod-screen').classList.remove('visible');
  const launcher = document.getElementById('launcher');
  launcher.style.display = 'flex';
  launcher.style.opacity = '0';
  setTimeout(() => {
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
  setTimeout(() => {
    document.getElementById('submod-screen').classList.add('visible');
  }, 50);
}

function setAuthorVisible(visible){
  const el = document.getElementById('sc-author-footer');
  if(el) el.style.opacity = visible ? '' : '0';
}

function _confirmExit(){
  // Diálogo nativo de confirmación de salida
  // En PWA instalada en Android esto actúa como el back final
  const confirmed = confirm('¿Salir de SuperCalc?');
  if(confirmed){
    // Dejar que el navegador maneje el back real
    history.go(-2);
  } else {
    // Reempujar estado para seguir interceptando
    history.pushState({sc:'base'}, '');
  }
}

function openSubmod(parent) {
  setAuthorVisible(false);
  currentParent = parent;
  const cfg = SUBMOD_CONFIG[parent];
  document.getElementById('submod-title').innerHTML = cfg.title;
  const cardsEl = document.getElementById('submod-cards');
  const renderCard=c=>`
    <div class="submod-card ${c.cls}" data-action="launchSubmod" data-arg="${c.id}">
      <div class="submod-icon">${c.icon}</div>
      <div class="submod-info">
        <div class="submod-name">${c.name}</div>
        <div class="submod-desc">${c.desc}</div>
      </div>
      <div class="submod-arrow">›</div>
    </div>`;
  cardsEl.innerHTML = cfg.groups
    ? cfg.groups.map(group=>`
      <section class="submod-group ${group.cls}" aria-label="${group.title}">
        <h2 class="submod-group-title">${group.title}</h2>
        ${group.cards.map(renderCard).join('')}
      </section>`).join('')
    : cfg.cards.map(renderCard).join('');
  const launcher = document.getElementById('launcher');
  launcher.classList.add('hidden');
  setTimeout(() => {
    launcher.style.display = 'none';
    document.getElementById('submod-screen').classList.add('visible');
  }, 300);
  navPush({sc:'submod', parent});
}

function closeSubmod() {
  document.getElementById('submod-screen').classList.remove('visible');
  const launcher = document.getElementById('launcher');
  launcher.style.display = 'flex';
  launcher.style.opacity = '0';
  setTimeout(() => {
    launcher.classList.remove('hidden');
    launcher.style.opacity = '';
    setAuthorVisible(true);
  }, 50);
}

function launchSubmod(id) {
  if (id === 'vectors') {
    document.getElementById('submod-screen').classList.remove('visible');
    setTimeout(() => {
      document.getElementById('app').style.display = 'flex';
      initVectorsApp();
    }, 300);
  } else if (id === 'em') {
    document.getElementById('submod-screen').classList.remove('visible');
    setTimeout(() => {
      document.getElementById('em-app').classList.add('visible');
      emInit();
      setTimeout(() => emResizeCanvas(), 50);
      setTimeout(() => emResizeCanvas(), 350);
    }, 300);
  } else if (id === 'mat') {
    document.getElementById('submod-screen').classList.remove('visible');
    setTimeout(() => {
      document.getElementById('mat-app').classList.add('visible');
      matrixUI.matInit();
    }, 300);
  } else if (Object.hasOwn(CALC_DESTINATIONS,id)) {
    document.getElementById('submod-screen').classList.remove('visible');
    setTimeout(() => {
      document.getElementById('calc-app').classList.add('visible');
      calcInit(CALC_DESTINATIONS[id]);
    }, 300);
  } else if (id === 'ineq') {
    document.getElementById('submod-screen').classList.remove('visible');
    setTimeout(() => {
      document.getElementById('ineq-app').classList.add('visible');
    }, 300);
  } else if (id === 'fn') {
    document.getElementById('submod-screen').classList.remove('visible');
    setTimeout(() => {
      document.getElementById('fn-app').classList.add('visible');
    }, 300);
  } else if (id === 'seq') {
    document.getElementById('submod-screen').classList.remove('visible');
    setTimeout(() => {
      document.getElementById('seq-app').classList.add('visible');
      seqSetMode('terminos');
    }, 300);
  }
  navPush({sc:'module', id});
}

function closeModule(id) {
  if (id === 'vectors') {
    document.getElementById('app').style.display = 'none';
  } else if (id === 'em') {
    document.getElementById('em-app').classList.remove('visible');
  } else if (id === 'mat') {
    document.getElementById('mat-app').classList.remove('visible');
  } else if (id === 'ineq') {
    document.getElementById('ineq-app').classList.remove('visible');
    setTimeout(() => ineqUI.ineqBack(), 350);
  } else if (id === 'fn') {
    document.getElementById('fn-app').classList.remove('visible');
    setTimeout(() => fnBack(), 350);
  } else if (id === 'seq') {
    document.getElementById('seq-app').classList.remove('visible');
  } else if (id === 'calc') {
    document.getElementById('calc-app').classList.remove('visible');
  }
  setTimeout(() => {
    document.getElementById('submod-screen').classList.add('visible');
  }, 50);
}

// Legacy goHome — now goes to submod screen
function goHome() {
  closeModule('em');
}

return { openSubmod, launchSubmod, closeSubmod, closeModule, goHome };
}
