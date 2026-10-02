import * as matrixUI from './algebra/matrix.mjs';
import * as ineqUI from './algebra/inequalities.mjs';
import { parseRoute, routeHash } from './routes.mjs';
import { SUBMOD_CONFIG, CALC_DESTINATIONS, cardsOf, routeCatalog } from './navigation/catalog.mjs';
import { _confirmExit, exitStay, exitLeave } from './navigation/exit-dialog.mjs';

export function createNavigation({ initVectorsApp, emInit, emResizeCanvas, emPlusOpenPanel, calcInit, studyOpenPanel, geomInit, linearInit, numOpenPanel, logicOpenPanel, wavesOpenPanel, fnBack, seqSetMode, mechOpenPanel, mechPlusOpenPanel, probOpenPanel, expOpenPanel, theoryOpen }) {
// ═══════════════════════════════════════════════════════
// SUPER CALC — NAVIGATION
// ═══════════════════════════════════════════════════════
let currentParent = null;
let launcherRevealTimer = null;
let submodRevealTimer = null;
let moduleLaunchTimer = null;

function baseUrl(){
  const location = globalThis.location || {};
  return `${location.pathname || ''}${location.search || ''}`;
}

function navPush(state){
  history.pushState(state, '', routeHash(state) || baseUrl());
}

// Desde una ficha se salta a la herramienta; al volver se regresa a la ficha.
function theoryGo(hash){
  const route = parseRoute(hash);
  if (!route?.parent || !routeCatalog().has(`#/${route.parent}/${route.id}`)) return;
  _closeModuleNoHistory('theory');
  openRoute(route);
}

// Abre el menú o la herramienta del enlace; un destino desconocido deja la portada.
function openRoute(route){
  if (!route) return false;
  const parent = route.parent && Object.hasOwn(SUBMOD_CONFIG, route.parent) ? route.parent : null;
  if (!route.id) {
    if (!parent) return false;
    openSubmod(parent);
    return true;
  }
  const owner = parent || Object.keys(SUBMOD_CONFIG).find(key => cardsOf(key).some(card => card.id === route.id));
  const card = owner && cardsOf(owner).find(item => item.id === route.id);
  if (!card) return false;
  if (card.action === 'openSubmod') {
    openSubmod(card.id);
    return true;
  }
  hideLauncherImmediately();
  renderSubmod(owner);
  navPush({sc:'submod', parent:owner});
  launchSubmod(card.id);
  return true;
}

function activeModuleId() {
  const moduleIds = ['app','em-app','emplus-app','mech-app','mechplus-app','waves-app','mat-app','geom-app','linear-app','num-app','logic-app','study-app','calc-app','ineq-app','fn-app','seq-app','stats-app','prob-app','exp-app','theory-app'];
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
  if (!state) {
    // Cambio manual del fragmento: se reconstruye la ruta desde la portada.
    const active = activeModuleId();
    if (active) _closeModuleNoHistory(active);
    showLauncher();
    openRoute(parseRoute(globalThis.location?.hash));
    return;
  }
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
  const route = parseRoute(globalThis.location?.hash);
  history.replaceState({sc:'exit'}, '', baseUrl());
  history.pushState({sc:'launcher'}, '', baseUrl());
  setAuthorVisible(true);
  openRoute(route);
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
  else if(id==='stats' || id==='prob' || id==='exp' || id==='mech' || id==='theory') {
    const screen = document.getElementById(`${id}-app`);
    screen.classList.remove('visible');
    screen.inert = true;
  }
}

function setAuthorVisible(visible){
  const el = document.getElementById('sc-author-footer');
  if(el) el.style.opacity = visible ? '' : '0';
}

// Esc cierra el diálogo: equivale a quedarse.
document.getElementById('exit-dialog')?.addEventListener?.('cancel', event => { event.preventDefault(); exitStay(); });

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
  } else if (id.startsWith('num-') && ['errors','taylor','precision','roots','linear','system','stability','system2d','interpolation','derivative','quadrature','ode'].includes(id.slice(4))) {
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
  } else if (id === 'theory-math' || id === 'theory-fi') {
    document.getElementById('submod-screen').classList.remove('visible');
    scheduleModuleLaunch(() => {
      const screen = document.getElementById('theory-app');
      screen.inert = false;
      screen.classList.add('visible');
      theoryOpen(id.slice(7), routeCatalog());
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

return { openSubmod, launchSubmod, closeSubmod, closeModule, goHome, exitStay, exitLeave, theoryGo, routeCatalog };
}
