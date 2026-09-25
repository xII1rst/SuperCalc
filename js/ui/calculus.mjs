import {
  calcParse, symbolicDeriv, computeLimit, calculateLimitOperation, fmtA, fmtNum,
  fmtResult, visSubstitute, basicAntideriv, rk4,
  simpsonIntegral, revolutionVolume, taylorCoefficients, partialDerivative,
  gradient2D, midpointIntegral2D, implicitDerivative,
} from '../math/calculus.mjs';
import { fN } from '../utils/format.mjs';
import { optimizeFunction, populationGrowth, motionAt, tangentAt, relatedRates, characteristicRoots } from '../math/applications.mjs';
import * as plotter from './plotter.mjs';

// ═══════════════════════════════════════════════════════
// TECLADO — arquitectura correcta
// El input activo se registra con onfocus (no oninput)
// El botón usa pointer events para no robar el foco
// ═══════════════════════════════════════════════════════
let calcActiveInput = null;
let calcCurrentTab  = 'dif';
const trackedCalcInputs = new WeakSet();

// Registrar todos los inputs calc-inp con onfocus
function initInputTracking(){
  document.querySelectorAll('.calc-inp').forEach(inp=>{
    if(trackedCalcInputs.has(inp)) return;
    inp.addEventListener('focus', ()=>{ calcActiveInput = inp; });
    trackedCalcInputs.add(inp);
  });
}

const CALC_KB = [
  { label:'Funciones', btns:[
    {icon:'sin',  name:'seno',     ins:'sin('},
    {icon:'cos',  name:'coseno',   ins:'cos('},
    {icon:'tan',  name:'tangente', ins:'tan('},
    {icon:'asin', name:'arcsin',   ins:'asin('},
    {icon:'acos', name:'arccos',   ins:'acos('},
    {icon:'atan', name:'arctan',   ins:'atan('},
    {icon:'ln',   name:'log nat',  ins:'ln('},
    {icon:'log',  name:'log₁₀',   ins:'log('},
    {icon:'√',    name:'raíz',     ins:'sqrt('},
    {icon:'|x|',  name:'abs',      ins:'abs('},
    {icon:'eˣ',   name:'exp',      ins:'e^('},
  ]},
  { label:'Constantes y operadores', btns:[
    {icon:'xⁿ',  name:'potencia', ins:'^'},
    {icon:'π',   name:'pi',       ins:'π'},
    {icon:'e',   name:'euler',    ins:'e'},
    {icon:'∞',   name:'inf',      ins:'Infinity'},
    {icon:'( )', name:'parén.',   ins:'('},
    {icon:'*',   name:'mult.',    ins:'*'},
    {icon:'1/x', name:'fracción', ins:'1/('},
  ]},
];

function buildKB(containerId){
  const el = document.getElementById(containerId);
  if(!el || el.dataset.built) return;
  el.dataset.built = '1';
  el.innerHTML = CALC_KB.map(g=>`
    <div class="calc-kb-group">
      <div class="calc-kb-label">${g.label}</div>
      <div class="calc-kb-btns">
        ${g.btns.map(b=>`
          <button class="calc-kb-btn"
            data-action="kbInsert" data-event="pointerdown" data-insert="${b.ins}">
            <span class="kb-icon">${b.icon}</span>
            <span class="kb-name">${b.name}</span>
          </button>`).join('')}
      </div>
    </div>`).join('');
}

function kbInsert(event, text){
  // Prevenir que el pointer event robe el foco del input
  event.preventDefault();

  // Buscar el mejor input target:
  // 1. El que tiene foco actualmente (calcActiveInput)
  // 2. Si no, el primer input visible en la card abierta del panel activo
  let inp = calcActiveInput;
  if(!inp || !document.contains(inp)){
    const panelId = 'calc-p' + calcCurrentTab.charAt(0).toUpperCase() + calcCurrentTab.slice(1);
    const panel   = document.getElementById(panelId);
    const openCard = panel ? panel.querySelector('.calc-card-body.open') : null;
    inp = openCard ? openCard.querySelector('.calc-inp') : null;
    if(!inp && panel) inp = panel.querySelector('.calc-inp');
  }
  if(!inp) return;

  const s = inp.selectionStart ?? inp.value.length;
  const e = inp.selectionEnd   ?? inp.value.length;
  inp.value = inp.value.slice(0,s) + text + inp.value.slice(e);
  const pos = s + text.length;
  inp.focus();
  inp.setSelectionRange(pos, pos);
  calcActiveInput = inp;
}

// ═══════════════════════════════════════════════════════
// NAVEGACIÓN
// ═══════════════════════════════════════════════════════
function calcTab(id){
  document.querySelectorAll('.calc-tab').forEach(t=>{
    t.classList.toggle('on', t.dataset.arg===id);
  });
  ['Dif','Int','Mul','Edo','Graf'].forEach(p=>{
    const el = document.getElementById('calc-p'+p);
    if(el) el.classList.toggle('on', p.toLowerCase()===id);
  });
  calcCurrentTab = id;
  if(id==='graf') plotter.grafInit();
}

function toggleCard(id){
  const body  = document.getElementById('body-'+id);
  const arr   = document.getElementById('arr-'+id);
  const card  = document.getElementById('card-'+id);
  const isOpen = body.classList.contains('open');
  body.classList.toggle('open',  !isOpen);
  arr.classList.toggle('open',   !isOpen);
  card.classList.toggle('active',!isOpen);
}

function clearCard(id){
  // Limpiar inputs dentro de body-id
  const body = document.getElementById('body-'+id);
  if(!body) return;
  body.querySelectorAll('.calc-inp').forEach(el=>el.value='');
  // Limpiar res dentro de body-id
  body.querySelectorAll('[id^="res-"]').forEach(el=>el.innerHTML='');
  // También buscar res específico por convención
  const resMap = {lim:'res-lim',der:'res-der',imp:'res-imp',ana:'res-ana',
    indef:'res-indef',def:'res-def',rev:'res-rev',taylor:'res-taylor',
    par:'res-par',grad:'res-grad',dint:'res-dint',
    sep:'res-sep',edolin:'res-edolin',edo2:'res-edo2'};
  if(resMap[id]) { const r=document.getElementById(resMap[id]); if(r) r.innerHTML=''; }
}

// ═══════════════════════════════════════════════════════
// PARSER NUMÉRICO
// ═══════════════════════════════════════════════════════
function resBox(label,val,hint='',big=false){
  return `<div class="calc-res-box">
    <div class="calc-res-label">${label}</div>
    <div class="calc-res-val${big?' big':''}">${val}</div>
    ${hint?`<div class="calc-res-hint">${hint}</div>`:''}
  </div>`;
}
function errBox(msg){ return `<div class="calc-err">⚠ ${msg}</div>`; }

// ── HTML DE PASOS ──
function limitStepsHTML(r){
  if(r.error) return errBox(r.error);
  const S=r.steps, a=fmtA(r.aStr), fx=r.fxStr;
  const variable=r.varName||'x';
  let html='<div class="lim-steps">';
  let n=1;

  // 1 Planteamiento
  html+=`<div class="lim-step"><div class="lim-step-num">${n++}</div><div class="lim-step-body">
    <div class="lim-step-title">Planteamiento</div>
    <div class="lim-step-expr">lim<sub>${variable}→${a}</sub> [ ${fx} ]</div>
  </div></div>`;

  // 2 Sustitución con desarrollo numérico
  const sub=S.find(s=>s.tipo==='sustitucion');
  if(sub){
    const visSub=sub.visSub||visSubstitute(fx,r.a,variable);
    if(sub.direct!==null){
      html+=`<div class="lim-step"><div class="lim-step-num">${n++}</div><div class="lim-step-body">
        <div class="lim-step-title">Sustitución ${variable} = ${a}</div>
        <div class="lim-step-expr">${visSub}</div>
        <div class="lim-step-expr lim-ok">= ${fmtResult(sub.direct)}</div>
      </div></div>`;
    } else {
      const i00=S.find(s=>s.tipo==='indet_00');
      const numV=i00?fmtNum(i00.faNum,4):'0';
      const denV=i00?fmtNum(i00.faDen,4):'0';
      html+=`<div class="lim-step"><div class="lim-step-num">${n++}</div><div class="lim-step-body">
        <div class="lim-step-title">Sustitución ${variable} = ${a}</div>
        <div class="lim-step-expr">${visSub}</div>
        ${i00?`<div class="lim-step-expr">= ${numV} / ${denV}</div>`:''}
        <div class="lim-step-expr"><span class="lim-warn">→ 0/0 Forma indeterminada</span></div>
      </div></div>`;
    }
  }

  // 3 Estrategia
  const i00=S.find(s=>s.tipo==='indet_00');
  const iII=S.find(s=>s.tipo==='indet_inf');
  if(i00){
    html+=`<div class="lim-step"><div class="lim-step-num">${n++}</div><div class="lim-step-body">
      <div class="lim-step-title">Estrategia: L'Hôpital / Cancelación</div>
      <div class="lim-step-hint">Forma 0/0 — se deriva num. y den. por separado</div>
    </div></div>`;
  } else if(iII){
    html+=`<div class="lim-step"><div class="lim-step-num">${n++}</div><div class="lim-step-body">
      <div class="lim-step-title">Estrategia: L'Hôpital (forma ∞/∞)</div>
    </div></div>`;
  }

  // L'Hôpital
  S.filter(s=>s.tipo==='lhopital').forEach(lh=>{
    html+=`<div class="lim-step"><div class="lim-step-num">${n++}</div><div class="lim-step-body">
      <div class="lim-step-title">L'Hôpital — orden ${lh.orden}</div>
      <div class="lim-step-expr">N'(${a}) = ${fmtNum(lh.numDeriv)} , D'(${a}) = ${fmtNum(lh.denDeriv)}</div>
      <div class="lim-step-expr">lim = ${fmtNum(lh.numDeriv)} / ${fmtNum(lh.denDeriv)} = <strong class="lim-ok">${isFinite(lh.result)?fmtResult(lh.result):'∞'}</strong></div>
    </div></div>`;
  });

  // Cancelación
  const canc=S.find(s=>s.tipo==='cancelacion');
  if(canc){
    html+=`<div class="lim-step"><div class="lim-step-num">${n++}</div><div class="lim-step-body">
      <div class="lim-step-title">Cancelación factor (${variable} − ${a})</div>
      <div class="lim-step-expr">Q_N ≈ ${fmtNum(canc.qnum)} , Q_D ≈ ${fmtNum(canc.qden)}</div>
      <div class="lim-step-expr">lim = <strong class="lim-ok">${fmtResult(canc.result)}</strong></div>
    </div></div>`;
  }

  // Verificación lateral
  if(r.tipo!=='directo'){
    const lat=S.find(s=>s.tipo==='laterales');
    if(lat){
      html+=`<div class="lim-step"><div class="lim-step-num">✓</div><div class="lim-step-body">
        <div class="lim-step-title">Verificación numérica</div>
        <div class="lim-step-expr">${variable}→${a}⁺ ≈ ${fmtNum(lat.vr)} , ${variable}→${a}⁻ ≈ ${fmtNum(lat.vl)}</div>
      </div></div>`;
    }
  }
  html+='</div>';

  // Caja resultado
  const showApprox=r.exact&&r.valueNum&&Math.abs(r.valueNum)>1e-10&&r.tipo!=='directo';
  html+=`<div class="calc-res-box" style="margin-top:8px;${r.exists?'border-color:var(--ca2)':''}">
    <div class="calc-res-label">lim<sub>${variable}→${a}</sub> [ ${fx} ]</div>
    <div class="calc-res-val big">${r.value||'No existe'}</div>
    ${showApprox?`<div class="calc-res-hint">≈ ${fmtNum(r.valueNum,8)}</div>`:''}
    <div class="calc-res-hint">${
      r.exists
        ?(r.tipo==='directo'?'✓ Sustitución directa'
          :(r.tipo==='indet_00'||r.tipo==='indet_inf')?'✓ Resuelto por L\u2019H\u00f4pital'
          :'✓ Límite existe')
        :(r.isInfinity?'Límite infinito — la función diverge'
          :'⚠ El límite no existe (laterales distintos)')
    }</div>
  </div>`;
  return html;
}

// ── CALCULAR LÍMITE (callback del botón) ──
function calcLimit(){
  const fxStr=document.getElementById('dif-lim-fx').value.trim();
  const aStr =document.getElementById('dif-lim-a').value.trim();
  const side =document.getElementById('dif-lim-side').value;
  const variable=document.getElementById('dif-lim-var')?.value.trim()||'x';
  const res  =document.getElementById('res-lim');
  if(!fxStr){ res.innerHTML=errBox('Ingresa una función f('+variable+')'); return; }
  const r=computeLimit(fxStr,aStr,side,variable);
  res.innerHTML=limitStepsHTML(r);
}

// ── OPERACIÓN ENTRE DOS LÍMITES ──
function calcLimitOp(){
  const fx1  =document.getElementById('lim-op-fx1').value.trim();
  const a1Str=document.getElementById('lim-op-a1').value.trim();
  const s1   =document.getElementById('lim-op-side1').value;
  const variable1=document.getElementById('lim-op-var1')?.value.trim()||'x';
  const op   =document.getElementById('lim-op-op').value;
  const fx2  =document.getElementById('lim-op-fx2').value.trim();
  const a2Str=document.getElementById('lim-op-a2').value.trim();
  const s2   =document.getElementById('lim-op-side2').value;
  const variable2=document.getElementById('lim-op-var2')?.value.trim()||'x';
  const res  =document.getElementById('res-lim-op');
  if(!fx1||!fx2){ res.innerHTML=errBox('Ingresa ambas funciones'); return; }

  const {first:r1,second:r2,valueNum:resVal,reason}=calculateLimitOperation(
    {expr:fx1,point:a1Str,side:s1,variable:variable1},
    {expr:fx2,point:a2Str,side:s2,variable:variable2},op);
  const v1=r1.valueNum, v2=r2.valueNum;
  const a1=fmtA(a1Str), a2=fmtA(a2Str);
  const opSym={'+':'+','−':'−','*':'·','/':'÷'}[op]||op;

  const resStr=Number.isNaN(resVal)?'Indeterminado':fmtResult(resVal)||'Indefinido';

  let html='';
  html+=`<div class="lim-op-block"><div class="lim-op-label">Límite A — lim<sub>${variable1}→${a1}</sub> [${fx1}]</div>${limitStepsHTML(r1)}</div>`;
  html+=`<div class="lim-op-block"><div class="lim-op-label">Límite B — lim<sub>${variable2}→${a2}</sub> [${fx2}]</div>${limitStepsHTML(r2)}</div>`;
  html+=`<div class="calc-res-box" style="border-color:var(--gold);margin-top:8px">
    <div class="calc-res-label">L_A ${opSym} L_B</div>
    <div class="calc-res-val big">${resStr}</div>
    <div class="calc-res-hint">${fmtResult(v1)||'?'} ${opSym} ${fmtResult(v2)||'?'} = ${resStr}</div>
    ${reason?`<div class="calc-res-hint">${reason}</div>`:''}
  </div>`;
  res.innerHTML=html;
}

function calcDerivative(){
  const fxStr = document.getElementById('dif-der-fx').value.trim();
  const ord   = parseInt(document.getElementById('dif-der-ord').value);
  const ptStr = document.getElementById('dif-der-pt').value.trim();
  const variable=document.getElementById('dif-der-var')?.value.trim()||'x';
  const res   = document.getElementById('res-der');
  if(!fxStr){res.innerHTML=errBox('Ingresa una función');return;}

  const labels = ["Primera","Segunda","Tercera"];
  const primes = [`f'(${variable})`,`f''(${variable})`,`f'''(${variable})`];
  const sym = symbolicDeriv(fxStr, ord,variable);
  let html = '';

  if(sym){
    html += resBox(primes[ord-1]+' — derivada simbólica', sym, labels[ord-1]+' derivada', true);
    if(ptStr!==''&&ptStr!=='opcional'){
      const x0 = parseFloat(ptStr);
      if(!isNaN(x0)){
        const symFn = calcParse(sym,variable);
        if(symFn){
          const val = symFn(x0,0);
          if(isFinite(val))
          html+=resBox(`${primes[ord-1]} en ${variable} = ${x0}`, fmtResult(val)||fN(val,8),
              `Sustituyendo en ${sym}`);
        } else {
          const fn = calcParse(fxStr,variable);
          if(fn){
            const h=1e-6; let v;
            if(ord===1) v=(fn(x0+h,0)-fn(x0-h,0))/(2*h);
            else if(ord===2) v=(fn(x0+h,0)-2*fn(x0,0)+fn(x0-h,0))/(h*h);
            else v=(fn(x0+2*h,0)-2*fn(x0+h,0)+2*fn(x0-h,0)-fn(x0-2*h,0))/(2*h**3);
            html+=resBox(`${primes[ord-1]} en ${variable} = ${x0}`, fN(v,8));
          }
        }
      }
    }
  } else {
    const fn = calcParse(fxStr,variable);
    if(!fn){res.innerHTML=errBox('Función inválida');return;}
    html+=resBox('Resultado numérico (no simbólico)','','',false);
    if(ptStr.trim()!==''&&ptStr.trim()!=='opcional'){
      const x0=parseFloat(ptStr);
      if(!isNaN(x0)){
        const h=1e-6; let v;
        if(ord===1) v=(fn(x0+h,0)-fn(x0-h,0))/(2*h);
        else if(ord===2) v=(fn(x0+h,0)-2*fn(x0,0)+fn(x0-h,0))/(h*h);
        else v=(fn(x0+2*h,0)-2*fn(x0+h,0)+2*fn(x0-h,0)-fn(x0-2*h,0))/(2*h**3);
        html+=resBox(`${primes[ord-1]} en ${variable} = ${x0}`, fN(v,8));
      }
    }
  }
  res.innerHTML=html;
}

function calcImplicit(){
  const fxyStr = document.getElementById('dif-imp-fxy').value.trim();
  const x0 = parseFloat(document.getElementById('dif-imp-x0').value);
  const y0 = parseFloat(document.getElementById('dif-imp-y0').value);
  const res = document.getElementById('res-imp');
  if(!fxyStr){res.innerHTML=errBox('Ingresa F(x,y)');return;}

  const Fxy = calcParse(fxyStr);
  if(!Fxy){res.innerHTML=errBox('Función inválida. Usa x e y como variables');return;}

  let html='';
  html+=resBox('dy/dx = −∂F/∂x ÷ ∂F/∂y','— fórmula implícita —','F(x,y)=0',true);

  if(!isNaN(x0)&&!isNaN(y0)){
    const {fval,fx:fx0,fy:fy0,slope}=implicitDerivative(Fxy,x0,y0);
    if(Math.abs(fval)>0.1)
      html+=resBox('Verificación',`F(${x0},${y0}) ≈ ${fN(fval,4)}`,'⚠ El punto puede no estar en la curva');
    html+=resBox(`∂F/∂x en (${x0},${y0})`, fN(fx0,6));
    html+=resBox(`∂F/∂y en (${x0},${y0})`, fN(fy0,6));
    html+=resBox(`dy/dx en (${x0},${y0})`, isFinite(slope)?fmtResult(slope)||fN(slope,6):'indefinido',
      isFinite(slope)?'':'∂F/∂y ≈ 0 en este punto',true);
  } else {
    html+=resBox('Necesito un punto','Ingresa x₀ e y₀ para evaluar dy/dx');
  }
  res.innerHTML=html;
}

function calcAnalysis(){
  const fxStr=document.getElementById('dif-ana-fx').value.trim();
  const res=document.getElementById('res-ana');
  if(!fxStr){res.innerHTML=errBox('Ingresa una función');return;}
  const fn=calcParse(fxStr);
  if(!fn){res.innerHTML=errBox('Función inválida');return;}

  const h=1e-6, N=400, a=-8, b=8, dx=(b-a)/N;
  let incr=0, decr=0;
  const maxs=[], mins=[], infs=[];
  let prevFp=(fn(a+h,0)-fn(a-h,0))/(2*h);
  let prevFpp=(fn(a+h,0)-2*fn(a,0)+fn(a-h,0))/(h*h);

  for(let i=1;i<=N;i++){
    const x=a+i*dx;
    const fp=(fn(x+h,0)-fn(x-h,0))/(2*h);
    const fpp=(fn(x+h,0)-2*fn(x,0)+fn(x-h,0))/(h*h);
    if(isFinite(fp)){
      if(fp>0) incr++; else decr++;
      if(prevFp*fp<0&&isFinite(prevFp))
        (prevFp>0?maxs:mins).push(parseFloat(x.toFixed(3)));
    }
    if(isFinite(fpp)&&isFinite(prevFpp)&&prevFpp*fpp<0)
      infs.push(parseFloat(x.toFixed(3)));
    prevFp=fp; prevFpp=fpp;
  }
  let html='';
  html+=resBox('Monotonía en [−8,8]',
    `↑ Crece: ${incr} puntos  ↓ Decrece: ${decr} puntos`);
  html+=resBox('Máximos locales',maxs.length?maxs.map(x=>`x≈${x}`).join(', '):'Ninguno en [−8,8]');
  html+=resBox('Mínimos locales',mins.length?mins.map(x=>`x≈${x}`).join(', '):'Ninguno en [−8,8]');
  html+=resBox('Puntos de inflexión',infs.length?infs.map(x=>`x≈${x}`).join(', '):'Ninguno detectado');
  res.innerHTML=html;
}



// ═══════════════════════════════════════════════════════
// APLICACIONES DE DERIVADAS
// ═══════════════════════════════════════════════════════
let currentApp = 'opt';
let appsVisible = false;

function toggleLimOp(){
  const p=document.getElementById('lim-op-panel');
  if(p) p.style.display=p.style.display==='none'?'block':'none';
}

function toggleApps(){
  appsVisible=!appsVisible;
  document.getElementById('apps-panel').style.display=appsVisible?'block':'none';
  if(appsVisible) setApp('opt');
}

function setApp(id){
  currentApp=id;
  document.querySelectorAll('.app-sel-btn').forEach(b=>b.classList.remove('on'));
  const btn=document.getElementById('app-btn-'+id);
  if(btn) btn.classList.add('on');
  renderAppForm(id);
}

const APP_FORMS = {
  opt:{
    desc:'Dada una función f(x), encuentra los valores de x donde se alcanzan máximos y mínimos dentro de un intervalo.',
    fields:[
      {id:'app-opt-fx', label:'f(x) =', ph:'ej: -x^2 + 4*x'},
      {id:'app-opt-a',  label:'a =',   ph:'-5', sm:true},
      {id:'app-opt-b',  label:'b =',   ph:'5',  sm:true},
    ],
    btn:'Optimizar',
    fn:'appOptimize'
  },
  pob:{
    desc:'Modelo de crecimiento exponencial P(t) = P₀·eᵏᵗ. Calcula la tasa de cambio y proyecciones.',
    fields:[
      {id:'app-pob-p0',  label:'P₀ =', ph:'1000', sm:true},
      {id:'app-pob-k',   label:'k =',  ph:'0.03', sm:true},
      {id:'app-pob-t',   label:'t =',  ph:'5',    sm:true},
    ],
    btn:'Calcular',
    fn:'appGrowth'
  },
  vel:{
    desc:'Posición s(t). Calcula velocidad v = s\'(t) y aceleración a = s\'\'(t) en un instante t₀.',
    fields:[
      {id:'app-vel-st', label:'s(t) =', ph:'ej: t^3 - 6*t^2 + 9*t'},
      {id:'app-vel-t0', label:'t₀ =',  ph:'2', sm:true},
    ],
    btn:'Analizar movimiento',
    fn:'appMotion'
  },
  tan:{
    desc:'Recta tangente a f(x) en el punto x₀: y = f\'(x₀)(x − x₀) + f(x₀)',
    fields:[
      {id:'app-tan-fx', label:'f(x) =', ph:'ej: x^2 + sin(x)'},
      {id:'app-tan-x0', label:'x₀ =',  ph:'1', sm:true},
    ],
    btn:'Recta tangente',
    fn:'appTangent'
  },
  rel:{
    desc:'Tasas relacionadas: dada una relación entre variables y una tasa conocida, calcula la tasa desconocida.',
    fields:[
      {id:'app-rel-type', label:'Tipo:', select:['Esfera (radio→volumen)','Cono (radio→volumen)','Pitágoras (x,y→z)']},
      {id:'app-rel-r',  label:'r =',   ph:'5',   sm:true},
      {id:'app-rel-dr', label:'dr/dt=',ph:'2',   sm:true},
    ],
    btn:'Calcular tasa',
    fn:'appRelated'
  },
};

function renderAppForm(id){
  const cfg = APP_FORMS[id];
  if(!cfg) return;
  const c = document.getElementById('app-form-container');
  let fieldsHtml = '<div class="calc-field-row">';
  cfg.fields.forEach(f=>{
    if(f.select){
      fieldsHtml+=`<label>${f.label}</label>
        <select class="mat-sel" id="${f.id}">
          ${f.select.map(s=>`<option>${s}</option>`).join('')}
        </select>`;
    } else {
      fieldsHtml+=`<label>${f.label}</label>
        <input class="calc-inp${f.sm?' calc-inp-sm':''}" id="${f.id}" placeholder="${f.ph}"/>`;
    }
  });
  fieldsHtml+='</div>';
  c.innerHTML=`
    <div class="app-form">
      <div class="app-form-desc">${cfg.desc}</div>
      ${fieldsHtml}
      <div class="calc-btn-row">
        <button class="calc-btn" style="background:rgba(var(--gold-rgb),.12);border-color:rgba(var(--gold-rgb),.3);color:var(--gold)"
          data-action="${cfg.fn}">${cfg.btn}</button>
        <button class="calc-btn sec" data-action="clearAppResult">Limpiar</button>
      </div>
      <div id="app-res" class="calc-res"></div>
    </div>`;
  // Registrar inputs para teclado
  c.querySelectorAll('.calc-inp').forEach(inp=>{
    inp.addEventListener('focus',()=>{ calcActiveInput=inp; });
  });
}

function appRes(html){ document.getElementById('app-res').innerHTML=html; }
function clearAppResult(){ appRes(''); }

function appOptimize(){
  const fxStr=v('app-opt-fx'), a=pf('app-opt-a'), b=pf('app-opt-b');
  const fn=calcParse(fxStr);
  if(!fn||isNaN(a)||isNaN(b)){appRes(errBox('Verifica los datos'));return;}
  const {crits,maxX,minX,maxV,minV}=optimizeFunction(fn,a,b);
  const sym=symbolicDeriv(fxStr,1);
  let html=sym?resBox("f'(x) =",sym):'';
  html+=resBox('Puntos críticos f\'=0 en ['+a+','+b+']',
    crits.length?crits.map(c=>`x≈${c.x} (${c.type}, f≈${fN(c.y)})`).join('<br>'):'Ninguno detectado');
  html+=resBox('Máximo global en ['+a+','+b+']',`x≈${fN(maxX,4)},  f(x)≈${fN(maxV,6)}`,'')+
        resBox('Mínimo global en ['+a+','+b+']',`x≈${fN(minX,4)},  f(x)≈${fN(minV,6)}`,'');
  appRes(html);
}

function appGrowth(){
  const p0=pf('app-pob-p0'), k=pf('app-pob-k'), t=pf('app-pob-t');
  if([p0,k,t].some(isNaN)){appRes(errBox('Verifica los valores'));return;}
  const {Pt,dPdt,t2x}=populationGrowth(p0,k,t);
  appRes(
    resBox('P(t) = P₀·eᵏᵗ',`P(${t}) = ${fN(p0)} · e^(${k}·${t}) = ${fN(Pt,4)}`,`P₀=${p0}, k=${k}`,true)+
    resBox('Tasa de cambio dP/dt = k·P(t)', fN(dPdt,4)+' unidades/tiempo',`Proporcional a la población actual`)+
    resBox('Tiempo de duplicación  t₂ = ln(2)/k', isFinite(t2x)?fN(t2x,4)+' unidades de tiempo':'∞ (k=0)')+
    resBox('Verificación: P\'(t)/P(t)', fN(k),' = k ✓')
  );
}

function appMotion(){
  const stStr=v('app-vel-st'), t0=pf('app-vel-t0');
  const fn=calcParse(stStr);
  if(!fn||isNaN(t0)){appRes(errBox('Verifica los datos'));return;}
  const {s0,vel,acel}=motionAt(fn,t0);
  const symV=symbolicDeriv(stStr,1), symA=symbolicDeriv(stStr,2);
  appRes(
    (symV?resBox("v(t) = s'(t) =",symV):'')+
    (symA?resBox("a(t) = s''(t) =",symA):'')+
    resBox(`s(${t0}) — posición`, fN(s0,6))+
    resBox(`v(${t0}) — velocidad`, fN(vel,6), vel>0?'↑ Movimiento positivo':vel<0?'↓ Movimiento negativo':'En reposo', true)+
    resBox(`a(${t0}) — aceleración`, fN(acel,6),
      acel>0?'↑ Acelerando en dir. positiva':acel<0?'↓ Frenando':'Velocidad constante')
  );
}

function appTangent(){
  const fxStr=v('app-tan-fx'), x0=pf('app-tan-x0');
  const fn=calcParse(fxStr);
  if(!fn||isNaN(x0)){appRes(errBox('Verifica los datos'));return;}
  const {fx0,fpx0,b}=tangentAt(fn,x0);
  const symD=symbolicDeriv(fxStr,1);
  const bStr=b>=0?` + ${fN(b,4)}`:` - ${fN(Math.abs(b),4)}`;
  appRes(
    (symD?resBox("f'(x) =",symD):'')+
    resBox(`f(${x0}) — punto de tangencia`, fN(fx0,6))+
    resBox(`f'(${x0}) — pendiente`, fN(fpx0,6), 'Ángulo ≈ '+fN(Math.atan(fpx0)*180/Math.PI,2)+'°')+
    resBox('Ecuación recta tangente', `y = ${fN(fpx0,4)}x${bStr}`, `y − f(x₀) = f\'(x₀)·(x − x₀)`, true)
  );
}

function appRelated(){
  const type=document.getElementById('app-rel-type')?.value||'Esfera';
  const r=pf('app-rel-r'), drdt=pf('app-rel-dr');
  if(isNaN(r)||isNaN(drdt)){appRes(errBox('Verifica los valores'));return;}
  if(type.includes('Esfera')){
    const {V,dVdt}=relatedRates(type,r,drdt);
    appRes(
      resBox('Esfera V = (4/3)πr³','','')+
      resBox(`V cuando r=${r}`, fN(V,6)+' u³')+
      resBox('dV/dt = 4πr²·(dr/dt)', fN(dVdt,6)+' u³/tiempo',
        `4π·${r}²·${drdt} = ${fN(dVdt,4)}`, true)
    );
  } else if(type.includes('Cono')){
    const {V,dVdt}=relatedRates(type,r,drdt);
    appRes(
      resBox('Cono V = (1/3)πr³ (h=r)','','')+
      resBox(`V cuando r=${r}`, fN(V,6)+' u³')+
      resBox('dV/dt = πr²·(dr/dt)', fN(dVdt,6)+' u³/tiempo','', true)
    );
  } else {
    appRes(resBox('Pitágoras','Selecciona Esfera o Cono para demo completa',''));
  }
}



function v(id){ const el=document.getElementById(id); return el?el.value.trim():''; }
function pf(id){ return parseFloat(v(id)); }

// ═══════════════════════════════════════════════════════
// CÁLCULO INTEGRAL
// ═══════════════════════════════════════════════════════
function calcIntegralIndef(){
  const fxStr=v('int-indef-fx');
  const res=document.getElementById('res-indef');
  const fn=calcParse(fxStr);
  if(!fn){res.innerHTML=errBox('Función inválida');return;}
  // Antiderivada simbólica básica (regla de potencia, constantes conocidas)
  const antideriv=basicAntideriv(fxStr);
  let html=antideriv?
    resBox('∫ f(x) dx =', antideriv+' + C', 'Verificable derivando el resultado', true):
    resBox('∫ f(x) dx','Usa la Integral Definida para calcular numéricamente','');
  // Siempre dar verificación numérica
  const v0=(fn(1+1e-4,0)-fn(1-1e-4,0))/(2e-4);
  html+=resBox('f(1) para referencia', fN(fn(1,0),6));
  res.innerHTML=html;
}

function calcIntegralDef(){
  const fxStr=v('int-def-fx');
  const a=pf('int-def-a'), b=pf('int-def-b');
  const res=document.getElementById('res-def');
  const fn=calcParse(fxStr);
  if(!fn){res.innerHTML=errBox('Función inválida');return;}
  if(isNaN(a)||isNaN(b)){res.innerHTML=errBox('Ingresa los límites a y b');return;}
  if(a>=b){res.innerHTML=errBox('Se requiere a < b');return;}

  const result=simpsonIntegral(fn,a,b);

  res.innerHTML=
    resBox(`∫ₐᵇ f(x) dx  [${a}, ${b}]`, fN(result,8), 'Simpson 1/3 con n=1000', true)+
    resBox('Valor promedio  f̄ = (1/(b−a))∫f dx', fN(result/(b-a),6))+
    resBox('Longitud del intervalo', fN(b-a,4)+' u');
}

function calcRevolutionVolume(){
  const res=document.getElementById('res-rev');
  const fn=calcParse(v('int-rev-fx'));
  if(!fn){res.innerHTML=errBox('Función inválida');return;}
  const a=pf('int-rev-a'), b=pf('int-rev-b');
  const axis=v('int-rev-axis');
  try{
    const volume=revolutionVolume(fn,a,b,axis);
    const formula=axis==='x' ? 'π∫ₐᵇ [f(x)]² dx' : '2π∫ₐᵇ |x|·|f(x)| dx';
    const method=axis==='x' ? 'Discos alrededor del eje X' : 'Cascarones alrededor del eje Y';
    res.innerHTML=
      resBox('Volumen V',`${fN(volume,8)} u³`,`${method} · Simpson 1/3`,true)+
      resBox('Integral usada',formula,`a = ${a}, b = ${b}`);
  }catch(error){
    res.innerHTML=errBox(error.message);
  }
}

function calcTaylor(){
  const fxStr=v('int-taylor-fx');
  const a=pf('int-taylor-a')||0;
  const nTerms=parseInt(document.getElementById('int-taylor-n')?.value)||5;
  const res=document.getElementById('res-taylor');
  const fn=calcParse(fxStr);
  if(!fn){res.innerHTML=errBox('Función inválida');return;}

  const terms=taylorCoefficients(fn,a,nTerms);
  let poly='';
  for(const {k,coef} of terms){
    const cs=parseFloat(coef.toFixed(5)).toString();
    if(k===0) poly+=cs;
    else if(k===1) poly+=` ${coef>=0?'+':''} ${cs}(x${a!==0?`−${a}`:''})`;
    else poly+=` ${coef>=0?'+':''} ${cs}(x${a!==0?`−${a}`:''})<sup>${k}</sup>`;
  }

  const xtest=a+0.3;
  const freal=fn(xtest,0);
  const fapprox=terms.reduce((s,t)=>s+t.coef*Math.pow(xtest-a,t.k),0);
  res.innerHTML=
    resBox('Serie de Taylor alrededor de a='+a, poly, '')+
    resBox(`Verificación en x=${xtest}`, `f(x) = ${fN(freal,6)}   T(x) = ${fN(fapprox,6)}`,
      `Error = ${fN(Math.abs(freal-fapprox),4)}`);
}

// ═══════════════════════════════════════════════════════
// MULTIVARIABLE
// ═══════════════════════════════════════════════════════
function calcPartial(){
  const fxyStr=v('mul-par-fxy');
  const varN=document.getElementById('mul-par-var').value;
  const ord=parseInt(document.getElementById('mul-par-ord').value);
  const x0=pf('mul-par-x0'), y0=pf('mul-par-y0');
  const res=document.getElementById('res-par');
  const fn=calcParse(fxyStr);
  if(!fn){res.innerHTML=errBox('Función inválida');return;}

  const sym=symbolicDeriv(fxyStr,ord,varN);
  let html=sym?resBox(`∂${ord>1?ord:''}f/∂${varN}${ord>1?ord:''}`,sym):'' ;

  if(!isNaN(x0)&&!isNaN(y0)){
    const v2=partialDerivative(fn,x0,y0,varN,ord);
    html+=resBox(`Valor en (${x0},${y0})`, fN(v2,8), '', true);
  } else {
    html+=resBox('Nota','Ingresa (x₀,y₀) para evaluar en un punto','');
  }
  res.innerHTML=html;
}

function calcGradient(){
  const fxyStr=v('mul-grad-fxy');
  const x0=pf('mul-grad-x0'), y0=pf('mul-grad-y0');
  const res=document.getElementById('res-grad');
  const fn=calcParse(fxyStr);
  if(!fn){res.innerHTML=errBox('Función inválida');return;}
  if(isNaN(x0)||isNaN(y0)){res.innerHTML=errBox('Ingresa el punto (x₀, y₀)');return;}

  const {fx,fy,mag}=gradient2D(fn,x0,y0);
  res.innerHTML=
    resBox('∂f/∂x', fN(fx))+
    resBox('∂f/∂y', fN(fy))+
    resBox('∇f = (∂f/∂x, ∂f/∂y)', `(${fN(fx,4)},  ${fN(fy,4)})`, 'Dirección de máximo crecimiento', true)+
    resBox('|∇f| — magnitud', fN(mag,6))+
    resBox('∇f unitario', mag>1e-10?`(${fN(fx/mag,4)},  ${fN(fy/mag,4)})`:'(0, 0)');
}

function calcDoubleIntegral(){
  const fxyStr=v('mul-dint-fxy');
  const x1=pf('mul-dint-x1'),x2=pf('mul-dint-x2');
  const y1=pf('mul-dint-y1'),y2=pf('mul-dint-y2');
  const res=document.getElementById('res-dint');
  const fn=calcParse(fxyStr);
  if(!fn){res.innerHTML=errBox('Función inválida');return;}
  if([x1,x2,y1,y2].some(isNaN)){res.innerHTML=errBox('Ingresa todos los límites');return;}

  const result=midpointIntegral2D(fn,x1,x2,y1,y2);
  res.innerHTML=
    resBox(`∬ f dx dy — [${x1},${x2}]×[${y1},${y2}]`, fN(result,8), 'Punto medio 100×100', true)+
    resBox('Área de la región', fN((x2-x1)*(y2-y1),4)+' u²')+
    resBox('Valor promedio f̄', fN(result/((x2-x1)*(y2-y1)),6));
}

// ═══════════════════════════════════════════════════════
// EDO
// ═══════════════════════════════════════════════════════
function calcEDOSep(){
  const rhsStr=v('edo-sep-rhs');
  const x0=pf('edo-sep-x0')||0, y0=pf('edo-sep-y0')||1;
  const res=document.getElementById('res-sep');
  const fn=calcParse(rhsStr);
  if(!fn){res.innerHTML=errBox('Función inválida. Usa x e y');return;}
  const pts=rk4((x,y)=>fn(x,y), x0, y0, 0.1, 50);
  const sample=pts.filter((_,i)=>i%10===0).map(p=>`y(${p[0]}) ≈ ${fN(p[1],4)}`).join('<br>');
  res.innerHTML=
    resBox('RK4 — Solución numérica',sample,'dy/dx = '+rhsStr+'  con  y('+x0+')='+y0)+
    resBox('y final  x='+(x0+5).toFixed(2), fN(pts[pts.length-1][1],6),'',true);
}

function calcEDOLinear(){
  const px=calcParse(v('edo-lin-px')), qx=calcParse(v('edo-lin-qx'));
  const x0=pf('edo-lin-x0')||0, y0=pf('edo-lin-y0')||1;
  const res=document.getElementById('res-edolin');
  if(!px||!qx){res.innerHTML=errBox('P(x) o Q(x) inválidos');return;}
  const pts=rk4((x,y)=>qx(x,0)-px(x,0)*y, x0, y0, 0.1, 50);
  const sample=pts.filter((_,i)=>i%10===0).map(p=>`y(${p[0]}) ≈ ${fN(p[1],4)}`).join('<br>');
  res.innerHTML=
    resBox('RK4 — y\' + P(x)y = Q(x)',sample,'y('+x0+')='+y0)+
    resBox('y final  x='+(x0+5).toFixed(2), fN(pts[pts.length-1][1],6),'',true);
}

function calcEDO2nd(){
  const a=pf('edo-2do-a')||1, b=pf('edo-2do-b')||0, c=pf('edo-2do-c')||0;
  const y0=pf('edo-2do-y0')||1, dy0=pf('edo-2do-dy0')||0;
  const res=document.getElementById('res-edo2');
  const roots=characteristicRoots(a,b,c);
  const {disc}=roots;
  let solType,sol;
  if(roots.type==='distinct'){
    const {r1,r2}=roots;
    solType='Raíces reales distintas';
    sol=`y = C₁·e^(${fN(r1,4)}x) + C₂·e^(${fN(r2,4)}x)`;
  } else if(roots.type==='repeated'){
    const {r}=roots;
    solType='Raíz real doble';
    sol=`y = (C₁ + C₂x)·e^(${fN(r,4)}x)`;
  } else {
    const {alpha,beta}=roots;
    solType='Raíces complejas conjugadas';
    sol=`y = e^(${fN(alpha,4)}x)[C₁cos(${fN(beta,4)}x) + C₂sin(${fN(beta,4)}x)]`;
  }
  res.innerHTML=
    resBox('Ecuación característica', `${a}r² + ${b}r + ${c} = 0`)+
    resBox('Discriminante Δ', fN(disc))+
    resBox('Tipo de solución', solType)+
    resBox('Solución general', sol,'C₁,C₂ por condiciones iniciales y(0)='+y0+', y\'(0)='+dy0,true);
}

// ═══════════════════════════════════════════════════════
// CALC INIT
// ═══════════════════════════════════════════════════════
function calcInit(tab='dif'){
  ['dif','int','mul','edo'].forEach(id=>buildKB('calc-kb-'+id));
  initInputTracking();
  calcTab(tab);
}

export {
  calcInit, calcTab, toggleCard, clearCard, kbInsert,
  calcLimit, calcLimitOp, calcDerivative, calcImplicit, calcAnalysis,
  calcIntegralIndef, calcIntegralDef, calcRevolutionVolume, calcTaylor, calcPartial,
  calcGradient, calcDoubleIntegral, calcEDOSep, calcEDOLinear,
  calcEDO2nd, toggleLimOp, toggleApps, setApp,
  appOptimize, appGrowth, appMotion, appTangent, appRelated, clearAppResult,
};
