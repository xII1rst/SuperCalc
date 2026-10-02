import { polynomialPotentialStudy, greenRegionStudy, stokesDiskStudy } from '../math/multivariable-study.mjs';
import { functionAnalysisSvg } from '../graphics/function-analysis.mjs';
import { tangentDifferential, rationalFunctionAnalysis, theoremCheck } from '../math/differential-applications.mjs';
import { calcParse, collectVariables, normalizeExpression } from '../math/expression.mjs';
import { symbolicDeriv, derivativeDetails, implicitCurveAt } from '../math/calculus/derivatives.mjs';
import { computeLimit, calculateLimitOperation } from '../math/calculus/limits.mjs';
import { fmtA, fmtNum, fmtResult } from '../math/calculus/format.mjs';
import { visSubstitute } from '../math/calculus/limit-forms.mjs';
import { basicAntideriv } from '../math/calculus/antiderivative.mjs';
import { rk4Refinement, simpsonIntegral, taylorCoefficients, partialDerivative, gradient2D, midpointIntegral2D, implicitDerivative } from '../math/calculus/numeric.mjs';
import { revolutionVolume, revolutionVolumeBetween, revolutionVolumeAboutLine, parseRevolutionFunction, curveIntersections } from '../math/calculus/revolution.mjs';
import { fN, formatResult } from '../utils/format.mjs';
import {
  optimizeFunction, populationGrowth, motionAt, relatedRates, solveSecondOrderHomogeneous,
  newtonMethod, linearApproximation, meanValueTheorem, rollesTheorem, checkContinuity,
  hyperbolicValues, inverseHyperbolic,
} from '../math/applications.mjs';
import { integrate, definiteIntegral, polynomialRevolutionEvaluation } from '../math/integration.mjs';
import { riemannSum, trapezoidalRule } from '../math/numeric.mjs';
import { geometricSeries, pSeries, ratioTest, nthTermTest, taylorSeries, rootTest, integralTest, alternatingSeries } from '../math/series.mjs';
import {
  areaBetweenCurves, arcLength, surfaceAreaOfRevolution, workVariable, fluidForce, centroidRegion,
} from '../math/integral-applications.mjs';
import { parametricSlope, parametricArcLength, parametricArea, parametricSurfaceArea } from '../math/parametric.mjs';
import { polarToCartesian, cartesianToPolar, polarArea, polarArcLength, polarSlope } from '../math/polar.mjs';
import { parabola, ellipse, hyperbola, circle, conicClassify } from '../math/conics.mjs';
import {
  divergence, curl, gradient3D, isConservative2D, potentialFunction2D,
  lineIntegralScalar, lineIntegralVector, greenLineIntegral,
  fluxDivergenceTheorem, stokesLineIntegral, curvature, unitTangent, unitNormal,
} from '../math/vector-calculus.mjs';
import {
  multivariableLimit, criticalPoints2D, lagrangeMultipliers, directionalDerivative,
  doubleIntegralPolar, tripleIntegral, jacobian2D, centerOfMass2D,
} from '../math/multivariable.mjs';
import * as plotter from './plotter.mjs';
import { renderPreview, sampleFn, sampleParametric, samplePolar } from '../graphics/preview-canvas.mjs';
import { genRevolutionSolid, genRevolutionSolidBetween, recenterSolid, computeSolidExtent } from '../graphics/revolution.mjs';
import { project3D } from '../graphics/projection.mjs';
import { renderFigure } from '../graphics/figures.mjs';
import { readCanvasPalette } from '../graphics/colors.mjs';

// ═══════════════════════════════════════════════════════
// TECLADO — arquitectura correcta
// El input activo se registra con onfocus (no oninput)
// El botón usa pointer events para no robar el foco
// ═══════════════════════════════════════════════════════
let calcActiveInput = null;
let calcCurrentTab  = 'dif';
const trackedCalcInputs = new WeakSet();

// Vista previa 2D en vivo + sólido de revolución 3D interactivo
let revRotX = 22, revRotY = -38, revScl = 1, revFit = 1;
let revSolidPolys = null, revDrag = null, revCanvasInit = false;
let showRevSolid = false;
let previewInitDone = false, previewTimer = null;

function previewCalcExpression(input){
  const destination=document.getElementById(input.dataset.preview);
  if(!destination) return;
  const normalized=normalizeExpression(input.value);
  destination.textContent=normalized?`Entrada interpretada: ${normalized}`
    :'Puedes escribir sen(x²), sin(x^2), π y 2·x.';
}

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
    <div class="calc-kb-group" role="group" aria-label="${g.label}">
      <div class="calc-kb-label" aria-hidden="true">${g.label}</div>
      <div class="calc-kb-btns">
        ${g.btns.map(b=>`
          <button type="button" class="calc-kb-btn" aria-label="${b.name}" title="${b.name}"
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
const CALC_TITLES = {
  dif:'Diferencial', int:'Integral', mul:'Multivariable',
  edo:'Ecuaciones diferenciales', graf:'Graficador', cur:'Curvas',
};

function calcTab(id){
  ['Dif','Int','Mul','Edo','Graf','Cur'].forEach(p=>{
    const el = document.getElementById('calc-p'+p);
    if(el) el.classList.toggle('on', p.toLowerCase()===id);
  });
  calcCurrentTab = id;
  const title = document.getElementById('calc-title');
  if(title) title.textContent = CALC_TITLES[id] || 'Cálculo';
  if(id==='graf') plotter.grafInit();
}

function toggleCard(id){
  const card  = document.getElementById('card-'+id);
  const body  = document.getElementById('body-'+id);
  const arr   = document.getElementById('arr-'+id);
  const isOpen = body.classList.contains('open');

  // Single-open: al abrir una card se cierran las demás del mismo panel
  const scroll = card.closest('.calc-scroll');
  if(scroll){
    scroll.querySelectorAll('.calc-card').forEach(c=>{
      if(c===card) return;
      c.classList.remove('active');
      c.querySelector('.calc-card-body').classList.remove('open');
      c.querySelector('.calc-card-arrow').classList.remove('open');
      c.querySelector('.calc-card-header')?.setAttribute('aria-expanded','false');
    });
  }

  body.classList.toggle('open',  !isOpen);
  arr.classList.toggle('open',   !isOpen);
  card.classList.toggle('active',!isOpen);
  card.querySelector?.('.calc-card-header')?.setAttribute('aria-expanded',String(!isOpen));

  if(!isOpen){
    const cv = body.querySelector('.calc-preview[data-gmode]');
    if(cv) drawPreview(cv);
  }
}

function clearCard(id){
  // Limpiar inputs dentro de body-id
  const body = document.getElementById('body-'+id);
  if(!body) return;
  body.querySelectorAll('.calc-inp').forEach(el=>el.value='');
  if(id==='rev'){
    document.getElementById('int-rev-m').value='1';
    document.getElementById('int-rev-offset').value='0';
    document.getElementById('int-rev-shift').value='2';
  }
  // Limpiar res dentro de body-id
  body.querySelectorAll('[id^="res-"]').forEach(el=>el.innerHTML='');
  body.querySelectorAll('[id^="preview-"]').forEach(el=>el.textContent='');
  // También buscar res específico por convención
  const resMap = {lim:'res-lim',der:'res-der',imp:'res-imp',ana:'res-ana',
    indef:'res-indef',def:'res-def',rev:'res-rev',taylor:'res-taylor',
    par:'res-par',grad:'res-grad',dint:'res-dint',
    sep:'res-sep',edolin:'res-edolin',edo2:'res-edo2'};
  if(resMap[id]) { const r=document.getElementById(resMap[id]); if(r) r.innerHTML=''; }
  const cv = body.querySelector('.calc-preview[data-gmode]');
  if(cv) drawPreview(cv);
  if(id==='rev'){
    revSolidPolys=null;
    drawRevolutionSolid();
  }
}

// ═══════════════════════════════════════════════════════
// PARSER NUMÉRICO
// ═══════════════════════════════════════════════════════
function resultWithFraction(val){
  if (typeof val !== 'string') return val;
  const fraction = /^(-?\d+)\/(\d+)$/.exec(val);
  const numeric = /^-?\d+(?:\.\d+)?$/.test(val);
  if (!fraction && !numeric) return val;
  const value = fraction ? Number(fraction[1]) / Number(fraction[2]) : Number(val);
  if (!Number.isFinite(value)) return val;
  const displayed = formatResult(value, 8);
  return displayed.includes(' → ') || (numeric && displayed === String(Math.round(value))) ? displayed : val;
}
function resBox(label,val,hint='',big=false){
  val = resultWithFraction(val);
  return `<div class="calc-res-box">
    <div class="calc-res-label">${label}</div>
    <div class="calc-res-val${big?' big':''}">${val}</div>
    ${hint?`<div class="calc-res-hint">${hint}</div>`:''}
  </div>`;
}
function errBox(msg){ return `<div class="calc-err">${msg}</div>`; }

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

  // Sustitución simbólica (variables libres o 1^∞)
  const symStep=S.find(s=>s.tipo==='simbolico');
  if(symStep){
    html+=`<div class="lim-step"><div class="lim-step-num">${n++}</div><div class="lim-step-body">
      <div class="lim-step-title">${symStep.detail?'Desarrollo analítico':`Sustitución simbólica ${variable} = ${a}`}</div>
      ${symStep.detail?`<div class="lim-step-hint">${symStep.detail}</div>`:''}
      <div class="lim-step-expr lim-ok">= ${r.value}</div>
    </div></div>`;
  }

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
      const iII=S.find(s=>s.tipo==='indet_inf');
      const numV=i00?fmtNum(i00.faNum,4):'0';
      const denV=i00?fmtNum(i00.faDen,4):'0';
      html+=`<div class="lim-step"><div class="lim-step-num">${n++}</div><div class="lim-step-body">
        <div class="lim-step-title">Sustitución ${variable} = ${a}</div>
        <div class="lim-step-expr">${visSub}</div>
        ${i00?`<div class="lim-step-expr">= ${numV} / ${denV}</div>`:''}
        <div class="lim-step-expr"><span class="lim-warn">${i00?'→ 0/0 Forma indeterminada':iII?'→ ∞/∞ Forma indeterminada':'La sustitución no da un valor finito.'}</span></div>
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

  // L'Hôpital simbólico (derivadas exactas)
  S.filter(s=>s.tipo==='lhopital_simbolico').forEach(lh=>{
    html+=`<div class="lim-step"><div class="lim-step-num">${n++}</div><div class="lim-step-body">
      <div class="lim-step-title">L'Hôpital — simbólico</div>
      ${(lh.derivatives||[]).map(row=>`<div class="lim-step-expr">Orden ${row.order}: N<sup>(${row.order})</sup> = ${row.numerator}, D<sup>(${row.order})</sup> = ${row.denominator}; en ${variable}=${a}: ${fmtNum(row.numeratorAt)}/${fmtNum(row.denominatorAt)}</div>`).join('')}
      <div class="lim-step-expr">lim = <strong class="lim-ok">${lh.result}</strong></div>
    </div></div>`;
  });

  const domain=S.find(s=>s.tipo==='dominio');
  if(domain){
    html+=`<div class="lim-step"><div class="lim-step-num">${n++}</div><div class="lim-step-body">
      <div class="lim-step-title">Dominio real del lado solicitado</div>
      <div class="lim-step-hint">${domain.detail}</div>
    </div></div>`;
  }

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
      html+=`<div class="lim-step"><div class="lim-step-num"><svg class="sc-icon" aria-hidden="true"><use href="#sc-icon-check"></use></svg></div><div class="lim-step-body">
        <div class="lim-step-title">${r.inconclusive?'Muestreo numérico (no es prueba)':'Verificación numérica'}</div>
        <div class="lim-step-expr">${variable}→${a}⁺ ≈ ${fmtNum(lat.vr)} , ${variable}→${a}⁻ ≈ ${fmtNum(lat.vl)}</div>
      </div></div>`;
    }
  }
  html+='</div>';

  // Caja resultado
  const showApprox=r.exact&&r.valueNum&&Math.abs(r.valueNum)>1e-10&&r.tipo!=='directo';
  html+=`<div class="calc-res-box" style="margin-top:8px;${r.exists?'border-color:var(--ca2)':''}">
    <div class="calc-res-label">lim<sub>${variable}→${a}</sub> [ ${fx} ]</div>
    <div class="calc-res-val big">${resultWithFraction(r.value||'No existe')}</div>
    ${showApprox?`<div class="calc-res-hint">≈ ${fN(r.valueNum,8)}</div>`:''}
    ${r.inconclusive&&r.estimate!==null?`<div class="calc-res-hint">Estimación de la muestra: ${fN(r.estimate,8)}</div>`:''}
    <div class="calc-res-hint">${
      r.domainError?r.domainError
      :r.inconclusive?'Los valores muestreados no demuestran el límite.'
      :r.exists
        ?(r.tipo==='directo'?'Sustitución directa'
          :(r.tipo==='simbolico')?'Evaluación simbólica'
          :(r.tipo==='indet_00'||r.tipo==='indet_inf')?'Resuelto por L\u2019H\u00f4pital'
          :'Límite existe')
        :(r.isInfinity?'Límite infinito — la función diverge'
          :'El límite no existe (laterales distintos)')
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
    <div class="calc-res-val big">${resultWithFraction(resStr)}</div>
    <div class="calc-res-hint">${fmtResult(v1)||'?'} ${opSym} ${fmtResult(v2)||'?'} = ${resStr}</div>
    ${reason?`<div class="calc-res-hint">${reason}</div>`:''}
  </div>`;
  res.innerHTML=html;
}

function calcDerivative(){
  const fxStr = document.getElementById('dif-der-fx').value.trim();
  const ord   = Number(document.getElementById('dif-der-ord').value);
  const ptStr = document.getElementById('dif-der-pt').value.trim();
  const variable=document.getElementById('dif-der-var')?.value.trim()||'x';
  const res   = document.getElementById('res-der');
  if(!fxStr){res.innerHTML=errBox('Ingresa una función');return;}

  const labels = ['Primera','Segunda','Tercera','Cuarta'];
  const primes = [`f'(${variable})`,`f''(${variable})`,`f'''(${variable})`,`f⁽⁴⁾(${variable})`];
  const details=derivativeDetails(fxStr,ord,variable);
  if(!details){res.innerHTML=errBox('Expresión o variable inválida. Usa funciones con paréntesis y un orden de 1 a 4 (máximo 500 caracteres).');return;}
  let html=resBox(primes[ord-1]+' — derivada simbólica',details.derivative,labels[ord-1]+' derivada',true);
  html+=`<div class="calc-res-box"><div class="calc-res-label">Reglas utilizadas</div><ol>${details.rules.map(rule=>`<li>${rule}</li>`).join('')}</ol>`;
  if(ord>1) html+=`<div class="calc-res-label">Derivaciones sucesivas</div><ol>${details.derivatives.map(row=>`<li>Orden ${row.order}: ${row.expression}</li>`).join('')}</ol>`;
  html+=`<div class="calc-res-label">Condiciones de la fórmula</div>${details.conditions.length?`<ul>${details.conditions.map(condition=>`<li>${condition}</li>`).join('')}</ul>`:'<p>Conserva el dominio real de la función original.</p>'}<div class="calc-res-hint">Son condiciones suficientes de esta fórmula; los puntos de frontera requieren análisis aparte.</div></div>`;
  if(ptStr!==''&&ptStr!=='opcional'){
    const pointFn=collectVariables(ptStr).length===0?calcParse(ptStr):null;
    const x0=pointFn?.(0);
    if(!Number.isFinite(x0)) html+=errBox('El punto debe ser una expresión real constante, como π/6 o sqrt(2).');
    else{
      const evaluation=details.evaluate(x0);
      html+=evaluation.status==='evaluated'
        ? resBox(`${primes[ord-1]} en ${variable} = ${x0}`,formatResult(evaluation.value,8),`Sustituyendo en ${details.derivative}`)
        : errBox(evaluation.reason);
    }
  }
  res.innerHTML=html;
}

function calcImplicit(){
  const fxyStr = document.getElementById('dif-imp-fxy').value.trim();
  const constant=text=>{const s=text.trim();return s&&collectVariables(s).length===0?calcParse(s)?.(0):NaN;};
  const x0 = constant(document.getElementById('dif-imp-x0').value);
  const y0 = constant(document.getElementById('dif-imp-y0').value);
  const rateText=document.getElementById('dif-imp-dxdt')?.value.trim()||'';
  const dxdt=rateText?constant(rateText):null;
  const res = document.getElementById('res-imp');
  if(!fxyStr){res.innerHTML=errBox('Ingresa F(x,y)');return;}
  try{
    const result=implicitCurveAt(fxyStr,x0,y0,{dxdt});
    let html=resBox('Diferenciar F(x,y)=0',`Fₓ = ${result.symbolicFx}; Fᵧ = ${result.symbolicFy}`,
      'Fₓ + Fᵧ·dy/dx = 0; por tanto dy/dx = −Fₓ/Fᵧ cuando Fᵧ≠0.');
    html+=resBox('Verificación del punto',`F(${fN(x0)},${fN(y0)}) = ${fN(result.fval,10)}`,
      `Residuo relativo ${result.residual.toExponential(2)}; tolerancia ${result.tolerance}.`);
    if(['off-curve','singular'].includes(result.status)){
      res.innerHTML=html+errBox(result.reason); return;
    }
    html+=resBox(`∂F/∂x en (${x0},${y0})`,formatResult(result.fx,8));
    html+=resBox(`∂F/∂y en (${x0},${y0})`,formatResult(result.fy,8));
    if(result.status==='vertical') html+=resBox('Tangente vertical',`x = ${fN(x0)}`,'Fᵧ≈0 y Fₓ≠0; dy/dx no es finito.',true);
    else{
      html+=resBox(`dy/dx en (${x0},${y0})`,formatResult(result.slope,8),`−(${fN(result.fx)})/(${fN(result.fy)})`,true);
      html+=resBox('Recta tangente',`y = (${fN(result.slope,8)})x ${result.intercept>=0?'+':'−'} ${fN(Math.abs(result.intercept),8)}`,
        `${fN(result.fx)}·(x−${fN(x0)}) + ${fN(result.fy)}·(y−${fN(y0)}) = 0.`);
    }
    if(result.rates){
      html+=result.rates.status==='evaluated'
        ? resBox('Tasa relacionada dy/dt',formatResult(result.rates.dydt,8),
          `Fₓ·dx/dt + Fᵧ·dy/dt=0: dy/dt = (${fN(result.slope)})·(${fN(dxdt)}). Conserva unidades coherentes de coordenada y tiempo.`)
        : errBox(result.rates.reason);
    }
    res.innerHTML=html+`<div class="calc-res-hint">Hipótesis: ${result.hypotheses}</div>`;
  }catch(error){res.innerHTML=errBox(error.message);}
}

function calcAnalysis(){
  const expression=v('dif-ana-fx'),res=document.getElementById('res-ana');
  const number=value=>value===Infinity?'+∞':value===-Infinity?'−∞':fN(value,8);
  const interval=c=>`(${number(c.left)}, ${number(c.right)}): ${c.trend}`;
  const point=p=>`(${number(p.x)}, ${number(p.value)}): ${p.type||'inflexión'}`;
  try {
    const r=rationalFunctionAnalysis(expression);
    res.innerHTML=resBox('Dominio y simetría',`${r.domain}; ${r.symmetry}`)+
      resBox('Puntos críticos',r.criticalPoints.map(point).join('<br>')||'Sin puntos críticos aislados')+
      resBox('Signos de f′ y monotonía',r.monotonicity.map(interval).join('<br>'))+
      resBox('Signos de f″ y concavidad',r.concavity.map(interval).join('<br>'))+
      resBox('Inflexiones',r.inflections.map(point).join('<br>')||'Ninguna')+
      resBox('Discontinuidades',r.discontinuities.map(p=>`x=${number(p.x)}: ${p.type}; ${p.type==='asíntota vertical'?`límite izquierdo ${number(p.left)}, derecho ${number(p.right)}`:`límite ${number(p.limit)}`}`).join('<br>')||'Ninguna')+
      resBox('Asíntota al infinito',r.asymptote?`${r.asymptoteType}; coeficientes desde constante: [${r.asymptote.map(number).join(', ')}]`:'No aplica a polinomios')+
      resBox('Método y alcance',r.formula+' '+r.assumption)+functionAnalysisSvg(r);
  }catch(error){res.innerHTML=errBox(error.message);}
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
  newton:{
    desc:'Método de Newton-Raphson: x_{n+1} = x_n − f(x_n)/f\'(x_n). Encuentra una raíz de f(x) = 0.',
    fields:[
      {id:'app-newton-fx', label:'f(x) =', ph:'ej: x^2 - 2'},
      {id:'app-newton-x0', label:'x₀ =',   ph:'1', sm:true},
    ],
    btn:'Hallar raíz',
    fn:'appNewton'
  },
  mvt:{
    desc:'Teorema del Valor Medio: existe c en (a,b) con f\'(c) = (f(b)−f(a))/(b−a).',
    fields:[
      {id:'app-mvt-fx', label:'f(x) =', ph:'ej: x^2'},
      {id:'app-mvt-a',  label:'a =',    ph:'0', sm:true},
      {id:'app-mvt-b',  label:'b =',    ph:'2', sm:true},
    ],
    btn:'Aplicar TVM',
    fn:'appMVT'
  },
  cont:{
    desc:'Análisis de continuidad de f en x = a: compara los límites laterales con f(a).',
    fields:[
      {id:'app-cont-fx', label:'f(x) =', ph:'ej: 1/x, (x^2-1)/(x-1)'},
      {id:'app-cont-a',  label:'a =',    ph:'0', sm:true},
    ],
    btn:'Analizar continuidad',
    fn:'appContinuity'
  },
  hip:{
    desc:'Funciones hiperbólicas: sinh, cosh, tanh y sus inversas en x.',
    fields:[
      {id:'app-hip-x', label:'x =', ph:'0', sm:true},
    ],
    btn:'Calcular',
    fn:'appHyperbolic'
  },
};

const APP_PREVIEWS = {
  opt:   { src:'app-opt-fx',   a:'app-opt-a',   b:'app-opt-b' },
  tan:   { src:'app-tan-fx' },
  newton:{ src:'app-newton-fx' },
  mvt:   { src:'app-mvt-fx',   a:'app-mvt-a',   b:'app-mvt-b' },
  cont:  { src:'app-cont-fx' },
  vel:   { src:'app-vel-st',   var:'t' },
};

function appPreviewHtml(id){
  const pv = APP_PREVIEWS[id];
  if(!pv) return '';
  return `<div class="calc-preview-wrap"><canvas class="calc-preview" data-gmode="fn" data-src="${pv.src}"` +
    (pv.a ? ` data-a="${pv.a}"` : '') +
    (pv.b ? ` data-b="${pv.b}"` : '') +
    (pv.var ? ` data-var="${pv.var}"` : '') +
    `></canvas></div>`;
}

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
      ${appPreviewHtml(id)}
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
  if(!fn||!Number.isFinite(a)||!Number.isFinite(b)||collectVariables(fxStr).some(name=>name!=='x')){appRes(errBox('Usa solo x y extremos finitos'));return;}
  if(!Number.isFinite(a)||!Number.isFinite(b)||a>=b){appRes(errBox('Se requiere intervalo finito a < b'));return;}
  try {
    const r=rationalFunctionAnalysis(fxStr,{start:a,end:b,closedInterval:true});
    if(typeof r.extrema==='string'){appRes(errBox(r.extrema));return;}
    const list=points=>points.map(p=>`x≈${fN(p.x,6)}, f(x)≈${fN(p.value,6)}`).join('<br>');
    appRes(resBox('Todos los candidatos: extremos y f′=0',list(r.extrema.candidates))+
      resBox('Máximo absoluto en ['+a+','+b+']',list(r.extrema.maximum))+
      resBox('Mínimo absoluto en ['+a+','+b+']',list(r.extrema.minimum))+
      resBox('Hipótesis y método',r.assumption));
    return;
  } catch(error) {
    // Otras familias solo pueden producir una estimación de la búsqueda finita.
  }
  const {crits,maxX,minX,maxV,minV}=optimizeFunction(fn,a,b);
  const sym=symbolicDeriv(fxStr,1);
  let html=sym?resBox("f'(x) =",sym):'';
  html+=resBox('Puntos críticos f\'=0 en ['+a+','+b+']',
    crits.length?crits.map(c=>`x≈${c.x} (${c.type}, f≈${fN(c.y)})`).join('<br>'):'Ninguno detectado');
  html+=resBox('Mayor valor estimado en ['+a+','+b+']',`x≈${fN(maxX,4)},  f(x)≈${fN(maxV,6)}`,'')+
        resBox('Menor valor estimado en ['+a+','+b+']',`x≈${fN(minX,4)},  f(x)≈${fN(minV,6)}`,'');
  html+=resBox('Alcance','Búsqueda numérica finita; puede omitir puntos críticos y no prueba extremos globales.');
  appRes(html);
}

function appGrowth(){
  const p0=pf('app-pob-p0'), k=pf('app-pob-k'), t=pf('app-pob-t');
  if([p0,k,t].some(isNaN)){appRes(errBox('Verifica los valores'));return;}
  const {Pt,dPdt,t2x}=populationGrowth(p0,k,t);
  appRes(
    resBox('P(t) = P₀·eᵏᵗ',`P(${t}) = ${fN(p0)} · e^(${k}·${t}) = ${fN(Pt,4)}`,`P₀=${p0}, k=${k}`,true)+
    resBox('Tasa de cambio dP/dt = k·P(t)', formatResult(dPdt,4)+' unidades/tiempo',`Proporcional a la población actual`)+
    resBox('Tiempo de duplicación  t₂ = ln(2)/k', isFinite(t2x)?formatResult(t2x,4)+' unidades de tiempo':'∞ (k=0)')+
    resBox('Verificación: P\'(t)/P(t)', formatResult(k),' = k')
  );
}

function appMotion(){
  const stStr=v('app-vel-st'), t0=pf('app-vel-t0');
  const fn=calcParse(stStr);
  if(!fn||isNaN(t0)){appRes(errBox('Verifica los datos'));return;}
  let motion;
  try{motion=motionAt(fn,t0);}catch(error){appRes(errBox(error.message));return;}
  const {s0,vel,acel}=motion;
  const symV=symbolicDeriv(stStr,1), symA=symbolicDeriv(stStr,2);
  appRes(
    (symV?resBox("v(t) = s'(t) =",symV):'')+
    (symA?resBox("a(t) = s''(t) =",symA):'')+
    resBox(`s(${t0}) — posición`, formatResult(s0,6))+
    resBox(`v(${t0}) — velocidad`, formatResult(vel,6), vel>0?'↑ Movimiento positivo':vel<0?'↓ Movimiento negativo':'En reposo', true)+
    resBox(`a(${t0}) — aceleración`, formatResult(acel,6),
      acel>0?'↑ Acelerando en dir. positiva':acel<0?'↓ Frenando':'Velocidad constante')
  );
}

function appTangent(){
  const fxStr=v('app-tan-fx'), x0=pf('app-tan-x0');
  try {
    const r=tangentDifferential(fxStr,x0);
    const bStr=r.intercept>=0?` + ${fN(r.intercept,4)}`:` - ${fN(Math.abs(r.intercept),4)}`;
    appRes(resBox("f'(x) =",r.derivative)+
      resBox(`f(${x0}) — punto de tangencia`,formatResult(r.point[1],6))+
      resBox(`f'(${x0}) — pendiente`,formatResult(r.slope,6),'Derivada simbólica evaluada en un punto regular')+
      resBox('Ecuación recta tangente',`y = ${fN(r.slope,4)}x${bStr}`,`y − f(x₀) = f'(x₀)·(x − x₀)`,true));
  } catch(error){appRes(errBox(error.message));}
}

function appRelated(){
  const type=document.getElementById('app-rel-type')?.value||'Esfera';
  const r=pf('app-rel-r'), drdt=pf('app-rel-dr');
  if(isNaN(r)||isNaN(drdt)){appRes(errBox('Verifica los valores'));return;}
  if(type.includes('Esfera')){
    const {V,dVdt}=relatedRates(type,r,drdt);
    appRes(
      resBox('Esfera V = (4/3)πr³','','')+
      resBox(`V cuando r=${r}`, formatResult(V,6)+' u³')+
      resBox('dV/dt = 4πr²·(dr/dt)', formatResult(dVdt,6)+' u³/tiempo',
        `4π·${r}²·${drdt} = ${fN(dVdt,4)}`, true)
    );
  } else if(type.includes('Cono')){
    const {V,dVdt}=relatedRates(type,r,drdt);
    appRes(
      resBox('Cono V = (1/3)πr³ (h=r)','','')+
      resBox(`V cuando r=${r}`, formatResult(V,6)+' u³')+
      resBox('dV/dt = πr²·(dr/dt)', formatResult(dVdt,6)+' u³/tiempo','', true)
    );
  } else {
    appRes(resBox('Pitágoras','Selecciona Esfera o Cono para demo completa',''));
  }
}



function appNewton(){
  const fxStr=v('app-newton-fx'), x0=pf('app-newton-x0');
  const fn=calcParse(fxStr);
  if(!fn||isNaN(x0)){appRes(errBox('Verifica los datos'));return;}
  let result;
  try{result=newtonMethod(fn,x0);}catch(error){appRes(errBox(error.message));return;}
  const {root,iterations,converged}=result;
  const last=iterations[iterations.length-1];
  appRes(
    resBox('Raíz de f(x) = 0', formatResult(root,10), converged?'Convergió':'No convergió: prueba otro x₀ (f′ pudo anularse o salir del dominio)', true)+
    resBox('Iteraciones', String(iterations.length), last?`Último paso: x = ${fN(last.xNext,6)}`:'')
  );
}

function appMVT(){
  const fxStr=v('app-mvt-fx'), a=pf('app-mvt-a'), b=pf('app-mvt-b');
  const fn=calcParse(fxStr);
  if(!fn||!Number.isFinite(a)||!Number.isFinite(b)||collectVariables(fxStr).some(name=>name!=='x')){appRes(errBox('Usa solo x y extremos finitos'));return;}
  if(a>=b){appRes(errBox('Se requiere a < b'));return;}
  try {
    const r=theoremCheck(fxStr,a,b);
    appRes(resBox('Pendiente secante (f(b)−f(a))/(b−a)',formatResult(r.slope,6))+
      resBox('Puntos c en (a,b)',r.points.map(c=>`c ≈ ${formatResult(c,6)}`).join(', '),r.allPoints||r.formula,true)+
      resBox('Hipótesis verificadas',r.steps.join('; ')));
    return;
  }catch(error) {
    // Fuera de las familias declaradas no se certifican las hipótesis.
  }
  const {slope,c}=meanValueTheorem(fn,a,b);
  appRes(
    resBox('Pendiente secante (f(b)−f(a))/(b−a)', formatResult(slope,6))+
    resBox('Candidato numérico a f\'(c) = pendiente', Number.isFinite(c)?`c ≈ ${formatResult(c,6)}`:'No encontrado',
      'Hipótesis no verificadas; una muestra no demuestra continuidad o diferenciabilidad.', true)
  );
}

function appContinuity(){
  const fxStr=v('app-cont-fx'), a=pf('app-cont-a');
  const fn=calcParse(fxStr);
  if(!fn||isNaN(a)){appRes(errBox('Verifica los datos'));return;}
  const r=checkContinuity(fn,a);
  const typeMap={removible:'Discontinuidad removible',infinita:'Discontinuidad infinita',salto:'Discontinuidad de salto'};
  appRes(
    resBox(`f(${a})`, Number.isFinite(r.value)?formatResult(r.value,6):'no definida')+
    resBox('Límites laterales', `lim₋ ≈ ${fN(r.leftLimit,4)}   lim₊ ≈ ${fN(r.rightLimit,4)}`)+
    resBox('Conclusión', r.continuous?`Continua en x = ${a}`:(typeMap[r.discontinuityType]||r.discontinuityType), '', true)
  );
}

function appHyperbolic(){
  const x=pf('app-hip-x');
  if(isNaN(x)){appRes(errBox('Ingresa x'));return;}
  const h=hyperbolicValues(x);
  const inv=inverseHyperbolic(x);
  appRes(
    resBox(`sinh(${x})`, formatResult(h.sinh,6))+
    resBox(`cosh(${x})`, formatResult(h.cosh,6))+
    resBox(`tanh(${x})`, formatResult(h.tanh,6))+
    resBox('cosh² − sinh²', formatResult(h.identity,6), 'Identidad fundamental = 1')+
    resBox('Inversas', `asinh=${fN(inv.asinh,4)}, acosh=${Number.isFinite(inv.acosh)?fN(inv.acosh,4):'—'}, atanh=${Number.isFinite(inv.atanh)?fN(inv.atanh,4):'—'}`, Number.isFinite(inv.acosh)&&Number.isFinite(inv.atanh)?'':'— : fuera del dominio (acosh exige x ≥ 1; atanh, |x| < 1).')
  );
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
  // Comparte el motor y el procedimiento con la tarjeta CAS.
  const integral=integrate(fxStr),antideriv=integral.result;
  let html=antideriv?
    resBox('∫ f(x) dx =', antideriv+' + C', 'Verificable derivando el resultado', true):
    resBox('∫ f(x) dx','Usa la Integral Definida para calcular numéricamente','');
  if(integral.steps.length)html+=resBox('Pasos',integral.steps.join('; '));
  if(integral.domain.length)html+=resBox('Condiciones suficientes en cada intervalo',integral.domain.join('; '));
  html+=resBox('f(1) para referencia', formatResult(fn(1,0),6));
  res.innerHTML=html;
}

function pinf(id){
  const s=v(id).replace(/∞/g,'Infinity').replace(/\binf\b/gi,'Infinity');
  if(!s) return NaN;
  return Number(s);
}

function calcIntegralDef(){
  const fxStr=v('int-def-fx');
  const a=pinf('int-def-a'), b=pinf('int-def-b');
  const res=document.getElementById('res-def');
  if(!fxStr){res.innerHTML=errBox('Ingresa una función');return;}
  if(isNaN(a)||isNaN(b)){res.innerHTML=errBox('Ingresa los límites a y b');return;}
  if(a>=b){res.innerHTML=errBox('Se requiere a < b');return;}

  const r=definiteIntegral(fxStr,a,b,'x');
  if(r.error){res.innerHTML=errBox(r.error);return;}

  const bl=x=>fmtA(String(x));
  const label=`∫<sub>${bl(a)}</sub><sup>${bl(b)}</sup> f(x) dx`;

  if(r.diverges){
    res.innerHTML=resBox(label, 'Diverge', 'La integral impropia no converge', true)+resBox('Criterio analítico',r.steps.join('; '));
    return;
  }

  let hint='';
  if(r.improper) hint=r.proof==='analytic'?'Integral impropia · límite analítico':'Estimación impropia · convergencia no demostrada';
  else if(r.technique&&r.technique!=='ninguna') hint='Antiderivada · '+r.technique;
  else hint='Numérico (Simpson)';

  let html=resBox(label, r.value, hint, true);

  const steps=[];
  if(r.antiderivative){
    steps.push(`Antiderivada:  F(x) = ${r.antiderivative}`);
    steps.push(`F(${bl(b)}) − F(${bl(a)}) = ${r.value}`);
  }
  if(r.improper&&r.proof==='numerical') steps.push('Transformación numérica de límite infinito sobre [0,1]');
  if(r.refinementDifference!==null)steps.push(`Diferencia entre mallas: ${r.refinementDifference}; no es cota de error.`);
  if(r.steps&&r.steps.length) steps.push(...r.steps);
  if(steps.length){
    html+=`<div class="calc-res-box"><div class="calc-res-label">Pasos</div><div class="calc-res-hint">${steps.map(s=>String(s).replace(/</g,'&lt;')).join('<br>')}</div></div>`;
  }

  if(Number.isFinite(a)&&Number.isFinite(b)){
    html+=resBox('Valor promedio  f̄ = (1/(b−a))∫f dx', formatResult(r.valueNum/(b-a)))+
          resBox('Longitud del intervalo', formatResult(b-a,4)+' u');
  }
  res.innerHTML=html;
}

function calcIntegralNumeric(){
  const res=document.getElementById('res-def-num');
  const fxStr=v('int-def-fx'), fn=calcParse(fxStr);
  const a=pf('int-def-a'), b=pf('int-def-b');
  const n=v('int-num-n')===''?4:pf('int-num-n');
  const method=document.getElementById('int-num-method').value;
  if(!fn||![a,b].every(Number.isFinite)||a>=b){
    res.innerHTML=errBox('Ingresa f(x) válida y límites finitos con a < b');return;
  }
  if(!Number.isInteger(n)||n<1||n>1000||(method==='simpson'&&n%2!==0)){
    res.innerHTML=errBox('Usa 1–1000 subintervalos; Simpson requiere n par');return;
  }
  try{
    const value=method==='trapezoid'?trapezoidalRule(fn,a,b,n)
      :method==='simpson'?simpsonIntegral(fn,a,b,n)
      :riemannSum(fn,a,b,n,method);
    if(!Number.isFinite(value)) throw new RangeError('La función no es finita en la malla');
    const h=(b-a)/n;
    const formula=method==='right'?'h·Σ f(a+i·h), i=1…n'
      :method==='left'?'h·Σ f(a+i·h), i=0…n−1'
      :method==='midpoint'?'h·Σ f(a+(i+½)·h), i=0…n−1'
      :method==='trapezoid'?'h·[f(a)/2 + Σf(a+i·h) + f(b)/2]'
      :'h/3·[f(a) + 4Σf(x impar) + 2Σf(x par) + f(b)]';
    res.innerHTML=resBox('Aproximación numérica',formatResult(value,8),
      `${formula}; h=(${fN(b,5)}−${fN(a,5)})/${n}=${fN(h,6)}`,true);
    const reference=definiteIntegral(fxStr,a,b);
    if(reference.proof==='antiderivative'&&!reference.error)res.innerHTML+=resBox('Referencia por antiderivada',reference.value)+
      resBox('Error absoluto frente a referencia',formatResult(Math.abs(value-reference.valueNum),10));
    const sampleCount=method==='trapezoid'||method==='simpson'?n+1:n;
    const mesh=Array.from({length:Math.min(sampleCount,40)},(_,i)=>{
      const x=method==='right'?a+(i+1)*h:method==='midpoint'?a+(i+.5)*h:a+i*h;
      return `x=${fN(x,6)}, f(x)=${fN(fn(x,0),6)}`;
    }).join('; ');
    res.innerHTML+=resBox('Malla y valores',mesh+(sampleCount>40?`; … ${sampleCount} puntos en total`:''));
  }catch(e){res.innerHTML=errBox(e.message);}
}

function calcRevolutionVolume(){
  const res=document.getElementById('res-rev');
  revSolidPolys=null;
  drawRevolutionSolid();
  const addMode=v('int-rev-mode')==='add';
  const fx=v('int-rev-fx');
  if(!addMode&&usesRevolutionCoefficients(fx)){
    res.innerHTML=errBox('Para usar m y b, selecciona Agregar función');
    return;
  }
  const parameters=addMode ? readRevolutionParameters() : {m:1,b:0};
  if(!parameters){res.innerHTML=errBox('m y b deben ser números finitos');return;}
  const fn=parseRevolutionFunction(fx,parameters);
  if(!fn){res.innerHTML=errBox('Función inválida');return;}
  const gx=addMode ? v('int-rev-gx') : '';
  if(addMode&&!gx){res.innerHTML=errBox('Ingresa la segunda función g(x)');return;}
  const gn=gx ? parseRevolutionFunction(gx,parameters) : null;
  if(gx&&!gn){res.innerHTML=errBox('Segunda función inválida');return;}
  const a=pf('int-rev-a'), b=pf('int-rev-b');
  const axisChoice=v('int-rev-axis');
  const shifted=axisChoice.endsWith('-shift');
  const axis=axisChoice.startsWith('x')?'x':'y';
  const offset=shifted ? pf('int-rev-shift') : 0;
  try{
    const volume=shifted ? revolutionVolumeAboutLine(fn,gn,a,b,axis,offset)
      : gn ? revolutionVolumeBetween(fn,gn,a,b,axis) : revolutionVolume(fn,a,b,axis);
    const formula=shifted
      ? (axis==='x' ? 'π∫ₓ₀ˣ₁ [R꜀(x)² − r꜀(x)²] dx'
        : `2π∫ₓ₀ˣ₁ |x−c|·|f(x)${gn?' − g(x)':''}| dx`)
      : gn
        ? (axis==='x' ? 'π∫ₓ₀ˣ₁ [R(x)² − r(x)²] dx' : '2π∫ₓ₀ˣ₁ |x|·|f(x) − g(x)| dx')
        : (axis==='x' ? 'π∫ₓ₀ˣ₁ [f(x)]² dx' : '2π∫ₓ₀ˣ₁ |x|·|f(x)| dx');
    const method=shifted ? (axis==='x'?`Discos/arandelas alrededor de y = ${offset}`:`Cascarones alrededor de x = ${offset}`)
      : axis==='x' ? (gn?'Arandelas/discos alrededor del eje X':'Discos alrededor del eje X') : 'Cascarones alrededor del eje Y';
    const radiusHint=axis==='x'&&(gn||shifted)
      ? `x₀ = ${a}, x₁ = ${b}; R = max(|f−c|, |${gn?'g':'0'}−c|), r = min(...) si la región no cruza y = c; si cruza, r = 0. c = ${offset}.`
      : `x₀ = ${a}, x₁ = ${b}${shifted?`; c = ${offset}`:''}`;
    res.innerHTML=
      resBox('Volumen V',`${formatResult(volume,8)} u³`,`${method} · Simpson 1/3`,true)+
      resBox('Integral usada',formula,radiusHint);
    if(addMode&&usesRevolutionCoefficients(`${fx} ${gx}`))
      res.innerHTML+=resBox('Coeficientes sustituidos',`m = ${parameters.m}; b = ${parameters.b}`);
    const normalized=source=>normalizeExpression(source.replace(/^\s*y\s*=\s*/i,'').replace(/\bm\b/g,`(${parameters.m})`).replace(/\bb\b/g,`(${parameters.b})`));
    const symbolic=polynomialRevolutionEvaluation(normalized(fx),gx?normalized(gx):'0',a,b,axis,offset);
    if(symbolic)res.innerHTML+=resBox('Sección simbólica',symbolic.section,symbolic.assumption)+resBox('Primitiva de la sección',symbolic.antiderivative)+resBox('Evaluación simbólica',symbolic.evaluation);
    if(gn){
      const crossings=curveIntersections(fn,gn,a,b);
      if(crossings.length) res.innerHTML+=resBox('Intersecciones en [x₀, x₁]',crossings.map(p=>`(${formatResult(p.x,6)}, ${formatResult(p.y,6)})`).join(' · '));
    }
    const preview=document.querySelector('#body-rev .calc-preview');
    if(preview) drawPreview(preview);
    renderRevolutionSolid(fn, a, b, axis, gn, offset);
  }catch(error){
    res.innerHTML=errBox(error.message);
  }
}

function calcRevolutionModeChanged(){
  const addMode=v('int-rev-mode')==='add';
  for(const id of ['rev-add-fields','rev-legend-g','rev-legend-cross']){
    const element=document.getElementById(id);
    if(element) element.hidden=!addMode;
  }
  const fx=document.getElementById('int-rev-fx');
  if(fx) fx.placeholder=addMode ? 'ej: x², y=-mx+b' : 'ej: x², sqrt(x), y=-2x+1';
  const res=document.getElementById('res-rev');
  if(res) res.innerHTML='';
  revSolidPolys=null;
  drawRevolutionSolid();
  const preview=document.querySelector('#body-rev .calc-preview');
  if(preview) drawPreview(preview);
}

function calcRevolutionAxisChanged(){
  const choice=v('int-rev-axis');
  const shifted=choice.endsWith('-shift');
  const field=document.getElementById('rev-shift-fields');
  if(field) field.hidden=!shifted;
  const hint=document.getElementById('rev-axis-hint');
  if(hint) hint.textContent=choice.startsWith('y')
    ? 'Con cascarones, [x₀, x₁] debe quedar a un solo lado de la recta de giro.'
    : 'Para y = c, se usan discos o arandelas según dónde queden las curvas.';
  const res=document.getElementById('res-rev');
  if(res) res.innerHTML='';
  revSolidPolys=null;
  drawRevolutionSolid();
  const preview=document.querySelector('#body-rev .calc-preview');
  if(preview) drawPreview(preview);
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
    html+=resBox(`Valor en (${x0},${y0})`, formatResult(v2,8), '', true);
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
    resBox('∂f/∂x', formatResult(fx))+
    resBox('∂f/∂y', formatResult(fy))+
    resBox('∇f = (∂f/∂x, ∂f/∂y)', `(${fN(fx,4)},  ${fN(fy,4)})`, 'Dirección de máximo crecimiento', true)+
    resBox('|∇f| — magnitud', formatResult(mag,6))+
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
    resBox(`∬ f dx dy — [${x1},${x2}]×[${y1},${y2}]`, formatResult(result,8), 'Punto medio 100×100', true)+
    resBox('Área de la región', formatResult((x2-x1)*(y2-y1),4)+' u²')+
    resBox('Valor promedio f̄', formatResult(result/((x2-x1)*(y2-y1)),6));
}

// ═══════════════════════════════════════════════════════
// CÁLCULO VECTORIAL Y MULTIVARIABLE (nuevas tarjetas)
// ═══════════════════════════════════════════════════════
function calcGrad3D(){
  const fxyz=v('vec-grad-fxyz');
  const x=pf('vec-grad-x'), y=pf('vec-grad-y'), z=pf('vec-grad-z');
  const res=document.getElementById('res-vecgrad');
  if(!fxyz){res.innerHTML=errBox('Ingresa f(x,y,z)');return;}
  if(isNaN(x)||isNaN(y)||isNaN(z)){res.innerHTML=errBox('Ingresa el punto (x, y, z)');return;}
  try{
    const g=gradient3D(fxyz,x,y,z);
    res.innerHTML=
      resBox('∂f/∂x', formatResult(g.x,6))+
      resBox('∂f/∂y', formatResult(g.y,6))+
      resBox('∂f/∂z', formatResult(g.z,6))+
      resBox('∇f =', `(${fN(g.x,4)}, ${fN(g.y,4)}, ${fN(g.z,4)})`, 'Gradiente 3D', true);
  }catch(e){ res.innerHTML=errBox(e.message); }
}

function calcDirectional(){
  const fxy=v('vec-dir-fxy');
  const x0=pf('vec-dir-x0'), y0=pf('vec-dir-y0');
  const dx=pf('vec-dir-dx'), dy=pf('vec-dir-dy');
  const res=document.getElementById('res-vecdir');
  if(!fxy){res.innerHTML=errBox('Ingresa f(x,y)');return;}
  if([x0,y0,dx,dy].some(isNaN)){res.innerHTML=errBox('Ingresa el punto y la dirección');return;}
  if(dx===0&&dy===0){res.innerHTML=errBox('La dirección no puede ser (0,0)');return;}
  try{
    const v=directionalDerivative(fxy,x0,y0,{x:dx,y:dy});
    res.innerHTML=resBox('D_u f', formatResult(v,8), `en dirección (${dx}, ${dy})`, true);
  }catch(e){ res.innerHTML=errBox(e.message); }
}

function calcCurvature(){
  const x=v('vec-cur-x'), y=v('vec-cur-y');
  const t=pf('vec-cur-t');
  const res=document.getElementById('res-veccur');
  if(!x||!y){res.innerHTML=errBox('Ingresa x(t) y y(t)');return;}
  if(isNaN(t)){res.innerHTML=errBox('Ingresa el parámetro t');return;}
  try{
    const k=curvature(x,y,t);
    const T=unitTangent(x,y,t);
    const N=unitNormal(x,y,t);
    res.innerHTML=
      resBox('Curvatura κ', formatResult(k,8), '', true)+
      resBox('Tangente unitaria T', `(${fN(T.x,4)}, ${fN(T.y,4)})`)+
      resBox('Normal unitaria N', `(${fN(N.x,4)}, ${fN(N.y,4)})`);
  }catch(e){ res.innerHTML=errBox(e.message); }
}

function calcDivCurl(){
  const fx=v('vec-fx'), fy=v('vec-fy'), fz=v('vec-fz');
  const x=pf('vec-px'), y=pf('vec-py'), z=pf('vec-pz');
  const res=document.getElementById('res-divcurl');
  if(!fx||!fy||!fz){res.innerHTML=errBox('Ingresa Fx, Fy y Fz');return;}
  if(isNaN(x)||isNaN(y)||isNaN(z)){res.innerHTML=errBox('Ingresa el punto (x, y, z)');return;}
  try{
    const d=divergence(fx,fy,fz,x,y,z);
    const c=curl(fx,fy,fz,x,y,z);
    res.innerHTML=
      resBox('Divergencia ∇·F', formatResult(d,8), '', true)+
      resBox('Rotacional ∇×F', `(${fN(c.x,4)}, ${fN(c.y,4)}, ${fN(c.z,4)})`);
  }catch(e){ res.innerHTML=errBox(e.message); }
}

function calcConservative(){
  const fx=v('cons-fx'), fy=v('cons-fy');
  const x0=pf('cons-x0'), y0=pf('cons-y0');
  const res=document.getElementById('res-cons');
  if(!fx||!fy){res.innerHTML=errBox('Ingresa Fx y Fy');return;}
  try{
    let proof;
    try { proof=polynomialPotentialStudy(fx,fy,[0,0],[Number.isFinite(x0)?x0:0,Number.isFinite(y0)?y0:0]); }
    catch(error){
      res.innerHTML=resBox('¿Conservativo?','No demostrado',error.message+'; una igualdad de parciales en un punto no demuestra que el campo tenga potencial global.');return;
    }
    let html=resBox('¿Conservativo?',proof.conservative?'Sí':'No',proof.proof,true);
    html+=resBox('Qₓ−Pᵧ',proof.curl,'Identidad de coeficientes, no muestra en un punto');
    if(proof.conservative)html+=resBox('Potencial Φ(x,y)',proof.potential+' + C')+resBox(`Φ(${x0},${y0})−Φ(0,0)`,formatResult(proof.value,8));
    res.innerHTML=html;
  }catch(e){ res.innerHTML=errBox(e.message); }
}

function calcLineIntegral(){
  const fs=v('li-s-f'), xs=v('li-s-x'), ys=v('li-s-y');
  const st0=pf('li-s-t0'), st1=pf('li-s-t1');
  const fx=v('li-v-fx'), fy=v('li-v-fy'), xv=v('li-v-x'), yv=v('li-v-y');
  const vt0=pf('li-v-t0'), vt1=pf('li-v-t1');
  const res=document.getElementById('res-lineint');
  let html='';
  if(fs&&xs&&ys&&!isNaN(st0)&&!isNaN(st1)){
    try{
      html+=resBox('∫_C f ds (escalar)', formatResult(lineIntegralScalar(fs,xs,ys,st0,st1),8),
        `f=${fs}, C: (${xs}, ${ys})`, true);
    }catch(e){ html+=errBox('Escalar: '+e.message); }
  }
  if(fx&&fy&&xv&&yv&&!isNaN(vt0)&&!isNaN(vt1)){
    try{
      html+=resBox('∫_C F·dr (vectorial)', formatResult(lineIntegralVector(fx,fy,xv,yv,vt0,vt1),8),
        `F=(${fx}, ${fy})`, true);
    }catch(e){ html+=errBox('Vectorial: '+e.message); }
  }
  if(!html) html=errBox('Completa la integral escalar o la vectorial');
  res.innerHTML=html;
}

function calcTheorems(){
  const p=v('th-p'), q=v('th-q');
  const x1=pf('th-x1'), x2=pf('th-x2'), y1=pf('th-y1'), y2=pf('th-y2');
  const fx=v('th-fx'), fy=v('th-fy'), fz=v('th-fz'), R=pf('th-r');
  const res=document.getElementById('res-theorems');
  let html='';
  if(p&&q&&![x1,x2,y1,y2].some(isNaN)){
    try{
      const green=greenRegionStudy(p,q,x1,x2,()=>y1,()=>y2,120);
      const gauss=greenRegionStudy(`-(${q})`,p,x1,x2,()=>y1,()=>y2,120);
      html+=resBox('Green ∮ P dx + Q dy',formatResult(green.value,8),`Rectángulo; borde positivo antihorario. Qₓ−Pᵧ=${green.curl}. ${green.assumption} Diferencia entre mallas=${formatResult(green.refinementDifference,8)}.`,true);
      html+=resBox('Flujo (Gauss 2D)',formatResult(gauss.value,8),'Normal exterior; ∇·F='+gauss.curl);
    }catch(e){ html+=errBox('Green: '+e.message); }
  }
  if(fx&&fy&&fz&&!isNaN(R)&&R>0){
    try{
      const solved=stokesDiskStudy([fx,fy,fz],R);
      html+=resBox('Stokes sobre disco de radio R',formatResult(solved.value,8),`${solved.orientation}. ${solved.formula} ${solved.assumption} Integral de borde=${formatResult(solved.lineIntegral,8)}; diferencia borde/superficie=${formatResult(solved.agreementDifference,8)}.`,true);
    }catch(e){ html+=errBox('Stokes: '+e.message); }
  }
  if(!html) html=errBox('Completa Green (P,Q,región) o Stokes (F,R)');
  res.innerHTML=html;
}

function calcMvLimit(){
  const fxy=v('mvlim-fxy');
  const x0=pf('mvlim-x0'), y0=pf('mvlim-y0');
  const res=document.getElementById('res-mvlim');
  if(!fxy){res.innerHTML=errBox('Ingresa f(x,y)');return;}
  if(isNaN(x0)||isNaN(y0)){res.innerHTML=errBox('Ingresa el punto (x₀, y₀)');return;}
  try{
    const r=multivariableLimit(fxy,x0,y0);
    const answer=r.status==='proved'?fmtA(String(r.value))
      :r.status==='disproved'?'No existe':'Indeterminado con este método';
    const hint=r.status==='proved'?(r.proof||'Sustitución directa en una expresión continua en el punto')
      :r.status==='disproved'?'Dos trayectorias tienen límites distintos'
      :'Un número finito de trayectorias coincidentes no demuestra el límite';
    let html=resBox('Límite',answer,hint,true);
    html+=`<div class="calc-res-box"><div class="calc-res-label">Trayectorias</div><div class="calc-res-hint">${r.paths.map(p=>`${p.name}: ${p.formalValue!==null?fmtA(String(p.formalValue))+' (analítico)':p.value===null?'—':fN(p.value,4)+' (muestra)'}`).join('<br>')}</div></div>`;
    res.innerHTML=html;
  }catch(e){ res.innerHTML=errBox(e.message); }
}

function calcExtrema(){
  const fxy=v('extr-fxy');
  const x1=pf('extr-x1'), x2=pf('extr-x2'), y1=pf('extr-y1'), y2=pf('extr-y2');
  const g=v('extr-g'), c=pf('extr-c');
  const res=document.getElementById('res-extr');
  if(!fxy){res.innerHTML=errBox('Ingresa f(x,y)');return;}
  if([x1,x2,y1,y2].some(isNaN)){res.innerHTML=errBox('Ingresa la región de búsqueda');return;}
  let html=resBox('Alcance','Búsqueda numérica en la ventana: candidatos verificados, sin garantizar que sean todos.');
  try{
    const pts=criticalPoints2D(fxy,x1,x2,y1,y2);
    html+=pts.length
      ? `<div class="calc-res-box"><div class="calc-res-label">Puntos críticos</div><div class="calc-res-hint">${pts.map(p=>`(${fN(p.x,4)}, ${fN(p.y,4)}) — ${p.type} (D=${fN(p.D,4)})`).join('<br>')}</div></div>`
      : resBox('Puntos críticos','No se hallaron en la región','');
  }catch(e){ html+=errBox(e.message); }
  if(g&&!isNaN(c)){
    try{
      const sols=lagrangeMultipliers(fxy,g,c,x1,x2,y1,y2);
      html+=`<div class="calc-res-box"><div class="calc-res-label">Lagrange ∇f=λ∇g, g=${c}</div><div class="calc-res-hint">${sols.length?sols.map(s=>`(${fN(s.x,4)}, ${fN(s.y,4)}) — λ=${fN(s.lambda,4)}`).join('<br>'):'Sin soluciones'}</div></div>`;
    }catch(e){ html+=errBox('Lagrange: '+e.message); }
  }
  res.innerHTML=html;
}

function calcMvIntegral(){
  const res=document.getElementById('res-mvint');
  let html='';
  // Doble polar
  const fp=v('mvint-pf');
  const pr1=pf('mvint-pr1'), pr2=pf('mvint-pr2'), pt1=pf('mvint-pt1'), pt2=pf('mvint-pt2');
  if(fp&&![pr1,pr2,pt1,pt2].some(isNaN)){
    try{
      html+=resBox('∬ f dA (polar)', formatResult(doubleIntegralPolar(fp,pr1,pr2,pt1,pt2),8),
        `r∈[${pr1},${pr2}], θ∈[${pt1},${pt2}]`, true);
    }catch(e){ html+=errBox('Polar: '+e.message); }
  }
  // Triple
  const ft=v('mvint-tf');
  const tx1=pf('mvint-tx1'),tx2=pf('mvint-tx2'),ty1=pf('mvint-ty1'),ty2=pf('mvint-ty2'),tz1=pf('mvint-tz1'),tz2=pf('mvint-tz2');
  if(ft&&![tx1,tx2,ty1,ty2,tz1,tz2].some(isNaN)){
    try{
      html+=resBox('∭ f dV (triple)', formatResult(tripleIntegral(ft,tx1,tx2,ty1,ty2,tz1,tz2),8),
        `caja [${tx1},${tx2}]×[${ty1},${ty2}]×[${tz1},${tz2}]`, true);
    }catch(e){ html+=errBox('Triple: '+e.message); }
  }
  // Jacobiano
  const jx=v('mvint-jx'), jy=v('mvint-jy'), ju=pf('mvint-ju'), jv=pf('mvint-jv');
  if(jx&&jy&&!isNaN(ju)&&!isNaN(jv)){
    try{
      html+=resBox('Jacobiano ∂(x,y)/∂(u,v)', formatResult(jacobian2D(jx,jy,ju,jv),8),
        `en (u,v)=(${ju},${jv})`, true);
    }catch(e){ html+=errBox('Jacobiano: '+e.message); }
  }
  // Centro de masa
  const cf=v('mvint-cf');
  const cx1=pf('mvint-cx1'),cx2=pf('mvint-cx2'),cy1=pf('mvint-cy1'),cy2=pf('mvint-cy2');
  if(cf&&![cx1,cx2,cy1,cy2].some(isNaN)){
    try{
      const c=centerOfMass2D(cf,cx1,cx2,cy1,cy2);
      html+=resBox('Centro de masa (x̄,ȳ)', `(${fN(c.x,4)}, ${fN(c.y,4)})`, `masa = ${fN(c.mass,6)}`, true);
    }catch(e){ html+=errBox('Centro de masa: '+e.message); }
  }
  if(!html) html=errBox('Completa una de las integrales');
  res.innerHTML=html;
}

// ═══════════════════════════════════════════════════════
// EDO
// ═══════════════════════════════════════════════════════
function edoNumericResult(fn,prefix,title,description){
  const read=(suffix,defaultValue)=>v(`${prefix}-${suffix}`)===''?defaultValue:pf(`${prefix}-${suffix}`);
  const x0=read('x0',0), y0=read('y0',1);
  const xFinal=read('xfinal',x0+5), steps=read('steps',50);
  if(![x0,y0,xFinal].every(Number.isFinite)||!Number.isInteger(steps)||steps<1||steps>1000){
    throw new RangeError('Ingresa condiciones finitas y entre 1 y 1000 pasos');
  }
  const result=rk4Refinement(fn,x0,y0,xFinal,steps);
  const interval=Math.max(1,Math.ceil(steps/5));
  const sample=result.coarse.filter((_,i)=>i%interval===0||i===steps)
    .map(p=>`y(${fN(p[0],4)}) ≈ ${fN(p[1],6)}`).join('<br>');
  return resBox(title,sample,description)+
    resBox(`y(${fN(xFinal,4)}) ≈`,formatResult(result.fineValue,8),
      `h=${fN(result.h,6)}, ${steps} pasos; refinado con ${2*steps} pasos`,true)+
    resBox('Comparación de mallas',`|y₂ₙ − yₙ| = ${formatResult(Math.abs(result.fineValue-result.coarseValue),8)}`,
      `Estimación de error RK4 ≈ ${formatResult(result.errorEstimate,8)} (si rige el orden 4)`);
}

function calcEDOSep(){
  const rhsStr=v('edo-sep-rhs');
  const res=document.getElementById('res-sep');
  const fn=calcParse(rhsStr);
  if(!fn){res.innerHTML=errBox('Función inválida. Usa x e y');return;}
  try{
    res.innerHTML=edoNumericResult((x,y)=>fn(x,y),'edo-sep','RK4 — Solución numérica',`dy/dx = ${rhsStr}`);
  }catch(e){res.innerHTML=errBox(e.message);}
}

function calcEDOLinear(){
  const px=calcParse(v('edo-lin-px')), qx=calcParse(v('edo-lin-qx'));
  const res=document.getElementById('res-edolin');
  if(!px||!qx){res.innerHTML=errBox('P(x) o Q(x) inválidos');return;}
  try{
    res.innerHTML=edoNumericResult((x,y)=>qx(x,0)-px(x,0)*y,'edo-lin',
      'RK4 — y\' + P(x)y = Q(x)',`P(x)=${v('edo-lin-px')}, Q(x)=${v('edo-lin-qx')}`);
  }catch(e){res.innerHTML=errBox(e.message);}
}

function calcEDO2nd(){
  const read=(id,defaultValue)=>v(id)===''?defaultValue:pf(id);
  const a=read('edo-2do-a',1), b=read('edo-2do-b',0), c=read('edo-2do-c',0);
  const y0=read('edo-2do-y0',1), dy0=read('edo-2do-dy0',0);
  const res=document.getElementById('res-edo2');
  let solution;
  try{ solution=solveSecondOrderHomogeneous(a,b,c,y0,dy0); }
  catch(e){ res.innerHTML=errBox(e.message); return; }
  const {roots,c1,c2}=solution;
  const {disc}=roots;
  let solType,sol,particular,constants;
  if(roots.type==='distinct'){
    const {r1,r2}=roots;
    solType='Raíces reales distintas';
    sol=`y = C₁·e^(${fN(r1,4)}x) + C₂·e^(${fN(r2,4)}x)`;
    particular=`y = ${fN(c1,6)}·e^(${fN(r1,4)}x) + ${fN(c2,6)}·e^(${fN(r2,4)}x)`;
    constants=`C₁ = [y'(0) − r₂y(0)]/(r₁ − r₂) = ${fN(c1,6)}<br>C₂ = y(0) − C₁ = ${fN(c2,6)}`;
  } else if(roots.type==='repeated'){
    const {r}=roots;
    solType='Raíz real doble';
    sol=`y = (C₁ + C₂x)·e^(${fN(r,4)}x)`;
    particular=`y = (${fN(c1,6)} + ${fN(c2,6)}x)·e^(${fN(r,4)}x)`;
    constants=`C₁ = y(0) = ${fN(c1,6)}<br>C₂ = y'(0) − r·y(0) = ${fN(c2,6)}`;
  } else {
    const {alpha,beta}=roots;
    solType='Raíces complejas conjugadas';
    sol=`y = e^(${fN(alpha,4)}x)[C₁cos(${fN(beta,4)}x) + C₂sin(${fN(beta,4)}x)]`;
    particular=`y = e^(${fN(alpha,4)}x)[${fN(c1,6)}cos(${fN(beta,4)}x) + ${fN(c2,6)}sin(${fN(beta,4)}x)]`;
    constants=`C₁ = y(0) = ${fN(c1,6)}<br>C₂ = [y'(0) − α·y(0)]/β = ${fN(c2,6)}`;
  }
  res.innerHTML=
    resBox('Ecuación característica', `${a}r² + ${b}r + ${c} = 0`)+
    resBox('Discriminante Δ', formatResult(disc))+
    resBox('Tipo de solución', solType)+
    resBox('Solución general', sol)+
    resBox('Condiciones iniciales', constants,`y(0)=${y0}; y'(0)=${dy0}`)+
    resBox('Solución del ejercicio',particular,'Constantes sustituidas',true);
}

// ═══════════════════════════════════════════════════════
// INTEGRACIÓN SIMBÓLICA (CAS), SERIES Y APLICACIONES
// ═══════════════════════════════════════════════════════
function calcIntegrateCAS(){
  const fxStr=v('int-cas-fx');
  const res=document.getElementById('res-cas');
  if(!fxStr){res.innerHTML=errBox('Ingresa una función');return;}
  const r=integrate(fxStr,'x');
  if(!r||!r.result){res.innerHTML=errBox('No se pudo integrar simbólicamente');return;}
  let html=resBox('∫ f(x) dx =', r.result+' + C', 'Técnica: '+r.technique, true);
  if(r.steps&&r.steps.length){
    html+=`<div class="calc-res-box"><div class="calc-res-label">Pasos</div><div class="calc-res-hint">${r.steps.map(s=>String(s).replace(/</g,'&lt;')).join('<br>')}</div></div>`;
  }
  if(r.domain?.length)html+=resBox('Condiciones suficientes en cada intervalo',r.domain.join('; '));
  res.innerHTML=html;
}

// Muestra solo los campos de la prueba elegida y ajusta sus etiquetas.
function seriesTypeChanged(){
  const type=document.getElementById('series-type')?.value||'geo';
  document.querySelectorAll?.('#body-series [data-series]').forEach(row=>{row.hidden=!row.dataset.series.split(' ').includes(type);});
  const term=document.getElementById('series-term-lbl'), from=document.getElementById('series-N-lbl'), input=document.getElementById('series-term');
  if(term) term.textContent=type==='alt'?'bₙ =':type==='integral'?'f(n) =':'aₙ =';
  if(input) input.placeholder=type==='alt'?'ej: 1/n  (serie Σ(−1)^(n+1)·bₙ)':type==='integral'?'ej: 1/(n*ln(n)^2)':type==='root'?'ej: (n/(2n+1))^n':'ej: 1/2^n';
  if(from) from.textContent=type==='alt'?'términos N =':'desde n =';
}

const escSeries=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const seriesSteps=steps=>steps.length?`<div class="calc-res-hint">${steps.map(step=>`• ${escSeries(step)}`).join('<br>')}</div>`:'';
const proofNote=proof=>proof==='analytic'?'Familia analítica: conclusión demostrada.':proof==='analytic-sampled-hypotheses'?'Límite demostrado; positividad y decrecimiento comprobados solo por muestreo.':proof==='sampled'?'Conclusión apoyada en muestreo: no es una demostración.':'La familia de esta expresión no permite concluir con este criterio.';

function seriesVerdict(c){
  if(c==='converge') return 'Converge';
  if(c==='diverge') return 'Diverge';
  if(c==='inconcluso') return 'Inconcluso (la prueba no decide)';
  if(c==='posible convergencia') return 'Posible convergencia';
  if(c==='converge absolutamente') return 'Converge absolutamente';
  if(c==='converge condicionalmente') return 'Converge condicionalmente';
  return c;
}

function calcSeries(){
  const type=document.getElementById('series-type')?.value||'geo';
  const res=document.getElementById('res-series');
  let html='';
  if(type==='geo'){
    const a1=pf('series-a1'), r=pf('series-r');
    if(isNaN(a1)||isNaN(r)){res.innerHTML=errBox('Ingresa a₁ y r');return;}
    const g=geometricSeries(a1,r);
    html=resBox('Serie geométrica Σ a₁·r^(n−1)',
      g.converges?`Converge — suma = ${fN(g.sum,8)}`:'Diverge (|r| ≥ 1)',
      `a₁ = ${a1},  r = ${r}`, true);
  } else if(type==='p'){
    const p=pf('series-p');
    if(isNaN(p)){res.innerHTML=errBox('Ingresa p');return;}
    const s=pSeries(p);
    html=resBox('p-serie Σ 1/n^p', s.converges?'Converge (p > 1)':'Diverge (p ≤ 1)', `p = ${p}`, true);
  } else if(type==='ratio'){
    const term=v('series-term');
    if(!term){res.innerHTML=errBox('Ingresa el término aₙ');return;}
    const r=ratioTest(term);
    html=resBox('Prueba de la razón', seriesVerdict(r.conclusion), r.proof==='analytic'?`L = lim |aₙ₊₁/aₙ| = ${fN(r.L,6)}; familia analítica admitida`:`Cociente muestreado ≈ ${fN(r.sampleRatio,6)}; no demuestra el límite`, true);
  } else if(type==='root'){
    const term=v('series-term');
    if(!term){res.innerHTML=errBox('Ingresa el término aₙ');return;}
    const r=rootTest(term);
    html=resBox('Prueba de la raíz', seriesVerdict(r.conclusion), r.proof==='analytic'?`L = lím |aₙ|^(1/n) = ${r.L===Infinity?'∞':fN(r.L,6)}${r.L===1?'; L = 1 no decide: usa otro criterio':''}. ${proofNote(r.proof)}`:`Raíz muestreada ≈ ${fN(r.sampleRoot,6)}; no demuestra el límite.`, true);
  } else if(type==='integral'){
    const term=v('series-term'), start=parseInt(document.getElementById('series-N')?.value)||1;
    if(!term){res.innerHTML=errBox('Ingresa f(n)');return;}
    const r=integralTest(term,start);
    html=resBox('Prueba de la integral', seriesVerdict(r.conclusion), [r.family?`Familia: ${escSeries(r.family)}.`:'', r.antiderivative?`Primitiva F(x) = ${escSeries(r.antiderivative)}.`:'', proofNote(r.proof)].filter(Boolean).join(' '), true)
      +(r.hypothesis?`<div class="calc-res-hint">Hipótesis: ${escSeries(r.hypothesis)}</div>`:'')+seriesSteps(r.steps);
  } else if(type==='alt'){
    const term=v('series-term'), N=parseInt(document.getElementById('series-N')?.value)||10;
    if(!term){res.innerHTML=errBox('Ingresa bₙ > 0 de Σ(−1)^(n+1)·bₙ');return;}
    const r=alternatingSeries(term,N);
    html=resBox('Serie alternante Σ(−1)^(n+1)·bₙ', seriesVerdict(r.conclusion), [proofNote(r.proof)].filter(Boolean).join(' '), true)+seriesSteps(r.steps);
  } else if(type==='nth'){
    const term=v('series-term');
    if(!term){res.innerHTML=errBox('Ingresa el término aₙ');return;}
    const r=nthTermTest(term);
    html=resBox('Prueba del término n-ésimo', seriesVerdict(r.conclusion),r.proof==='analytic'?`lim aₙ = ${fN(r.limit,6)}; límite analítico. Límite 0 no prueba convergencia de la serie.`:`Término muestreado ≈ ${fN(r.sampleTerm,6)}; no demuestra el límite`, true);
  } else if(type==='taylor'){
    const fx=v('series-fx'), a=pf('series-a')||0;
    const n=parseInt(document.getElementById('series-n')?.value)||5;
    if(!fx){res.innerHTML=errBox('Ingresa f(x)');return;}
    const t=taylorSeries(fx,a,n);
    if(!t){res.innerHTML=errBox('No se pudo expandir la serie');return;}
    html=resBox(`Taylor de orden ${n} alrededor de a=${a}`, t.polynomial, 'Desarrollo simbólico', true);
  }
  res.innerHTML=html;
}

function calcIntegralApp(){
  const type=document.getElementById('intapp-type')?.value||'area';
  const res=document.getElementById('res-intapp');
  const fx=v('intapp-fx'), a=pf('intapp-a'), b=pf('intapp-b');
  let html='';
  try{
    if(type==='area'){
      const gx=v('intapp-gx');
      const f=calcParse(fx), g=calcParse(gx);
      if(!f||!g||isNaN(a)||isNaN(b)){res.innerHTML=errBox('Ingresa f(x), g(x), a y b');return;}
      html=resBox('Área entre curvas ∫(f−g)dx', `${formatResult(areaBetweenCurves(f,g,a,b),8)} u²`, `[${a}, ${b}]`, true);
    } else if(type==='arc'||type==='surface'||type==='centroid'){
      const f=calcParse(fx);
      if(!f||isNaN(a)||isNaN(b)){res.innerHTML=errBox('Ingresa f(x), a y b');return;}
      if(type==='arc') html=resBox('Longitud de arco ∫√(1+f\'²)dx', `${formatResult(arcLength(f,a,b),8)} u`, `[${a}, ${b}]`, true);
      else if(type==='surface') html=resBox('Superficie de revolución (eje X)', `${formatResult(surfaceAreaOfRevolution(f,a,b),8)} u²`, `[${a}, ${b}]`, true);
      else { const c=centroidRegion(f,a,b); html=resBox('Centroide (x̄, ȳ)', `(${fN(c.xbar,6)}, ${fN(c.ybar,6)})`, `Área = ${fN(c.area,6)} u²`, true); }
    } else if(type==='work'){
      const f=calcParse(fx);
      if(!f||isNaN(a)||isNaN(b)){res.innerHTML=errBox('Ingresa F(x), a y b');return;}
      html=resBox('Trabajo W = ∫F(x)dx', `${formatResult(workVariable(f,a,b),8)} J`, `[${a}, ${b}]`, true);
    } else if(type==='fluid'){
      const rho=pf('intapp-rho'), depth=v('intapp-depth'), width=v('intapp-width');
      const h=calcParse(depth), w=calcParse(width);
      if(!h||!w||isNaN(a)||isNaN(b)||isNaN(rho)){res.innerHTML=errBox('Ingresa ρ, h(x), w(x), a y b');return;}
      html=resBox('Fuerza hidrostática F = ρ∫h·w dx', `${formatResult(fluidForce(rho,h,w,a,b),8)} N`, `ρ = ${rho}`, true);
    }
  }catch(e){res.innerHTML=errBox(e.message);return;}
  res.innerHTML=html;
}

// ═══════════════════════════════════════════════════════
// CURVAS PARAMÉTRICAS, POLARES Y CÓNICAS
// ═══════════════════════════════════════════════════════
function calcParametric(){
  const xExpr=v('par-x'), yExpr=v('par-y');
  const op=document.getElementById('par-op')?.value||'slope';
  const res=document.getElementById('res-param');
  if(!xExpr||!yExpr){res.innerHTML=errBox('Ingresa x(t) y y(t)');return;}
  if(op==='slope'){
    const t0=pf('par-t0');
    if(isNaN(t0)){res.innerHTML=errBox('Ingresa t₀');return;}
    try{
      const s=parametricSlope(xExpr,yExpr,t0);
      const slopeStr=!isFinite(s.slope)?(s.slope>0?'+∞ (tangente vertical)':'−∞ (tangente vertical)'):fN(s.slope,6);
      res.innerHTML=
        resBox('dx/dt', formatResult(s.dxdt,6))+
        resBox('dy/dt', formatResult(s.dydt,6))+
        resBox('dy/dx = (dy/dt)/(dx/dt)', slopeStr, '', true);
    }catch(e){res.innerHTML=errBox(e.message);}
    return;
  }
  const a=pf('par-a'), b=pf('par-b');
  if(isNaN(a)||isNaN(b)){res.innerHTML=errBox('Ingresa a y b');return;}
  try{
    let r,label,unit;
    if(op==='arc'){r=parametricArcLength(xExpr,yExpr,a,b);label='Longitud de arco L';unit='u';}
    else if(op==='area'){r=parametricArea(xExpr,yExpr,a,b);label='Área bajo la curva';unit='u²';}
    else {r=parametricSurfaceArea(xExpr,yExpr,a,b);label='Superficie de revolución (eje X)';unit='u²';}
    res.innerHTML=resBox(label, `${formatResult(r,8)} ${unit}`, `[${a}, ${b}]`, true);
  }catch(e){res.innerHTML=errBox(e.message);}
}

function calcPolar(){
  const op=document.getElementById('polar-op')?.value||'area';
  const res=document.getElementById('res-polar');
  const rExpr=v('polar-r');
  if(op==='convert'){
    const px=pf('polar-x'), py=pf('polar-y');
    if(!isNaN(px)&&!isNaN(py)){
      const {r,theta}=cartesianToPolar(px,py);
      res.innerHTML=resBox(`(x,y)=(${px},${py}) → polar`, `r = ${fN(r,6)},  θ = ${fN(theta,6)} rad`, '', true);
    } else {
      res.innerHTML=resBox('Conversión cartesiana → polar','Ingresa x e y para convertir','');
    }
    return;
  }
  if(!rExpr){res.innerHTML=errBox('Ingresa r(θ) usando t como ángulo');return;}
  if(op==='slope'){
    const theta=pf('polar-t0');
    if(isNaN(theta)){res.innerHTML=errBox('Ingresa θ');return;}
    try{
      const s=polarSlope(rExpr,theta);
      res.innerHTML=
        resBox('r(θ)', formatResult(s.r,6))+
        resBox("r'(θ)", formatResult(s.drdt,6))+
        resBox('dy/dx de la tangente', isFinite(s.slope)?formatResult(s.slope,6):'indefinida', '', true);
    }catch(e){res.innerHTML=errBox(e.message);}
    return;
  }
  const a=pf('polar-a'), b=pf('polar-b');
  if(isNaN(a)||isNaN(b)){res.innerHTML=errBox('Ingresa los límites a y b');return;}
  try{
    const r=op==='area'?polarArea(rExpr,a,b):polarArcLength(rExpr,a,b);
    const label=op==='area'?'Área polar A':'Longitud de arco L';
    const unit=op==='area'?'u²':'u';
    res.innerHTML=resBox(label, `${formatResult(r,8)} ${unit}`, `θ ∈ [${a}, ${b}]`, true);
  }catch(e){res.innerHTML=errBox(e.message);}
}

function calcConics(){
  const type=document.getElementById('conic-type')?.value||'parabola';
  const res=document.getElementById('res-conic');
  let html='';
  if(type==='classify'){
    const A=pf('conic-A'), B=pf('conic-B'), C=pf('conic-C');
    if([A,B,C].some(isNaN)){res.innerHTML=errBox('Ingresa A, B y C');return;}
    const c=conicClassify(A,B,C);
    const names={circle:'Circunferencia',ellipse:'Elipse',hyperbola:'Hipérbola',parabola:'Parábola'};
    html=resBox('Discriminante B²−4AC', formatResult(c.discriminant,6))+
      resBox('Tipo de cónica', names[c.type]||c.type, '', true);
    res.innerHTML=html; return;
  }
  const h=pf('conic-h'), k=pf('conic-k'), p1=pf('conic-p1'), p2=pf('conic-p2');
  if([h,k,p1].some(isNaN)){res.innerHTML=errBox('Ingresa los parámetros');return;}
  if(type==='parabola'){
    const o=document.getElementById('conic-axis')?.value||'y';
    const c=parabola(h,k,p1,o==='y');
    html=resBox('Vértice', `(${h}, ${k})`)+
      resBox('Foco', `(${c.focus.x}, ${c.focus.y})`)+
      resBox('Directriz', c.directrixY!==null?`y = ${fN(c.directrixY,4)}`:`x = ${fN(c.directrixX,4)}`)+
      resBox('Lado recto', formatResult(c.latusRectum,4), `Abre ${c.opens}`, true);
  } else if(type==='ellipse'){
    const c=ellipse(h,k,p1,p2,true);
    html=resBox('Centro', `(${h}, ${k})`)+
      resBox('Semiejes a, b', `${fN(c.a,4)}, ${fN(c.b,4)}`)+
      resBox('Focos', c.foci.map(f=>`(${f.x}, ${f.y})`).join('  ,  '))+
      resBox('Excentricidad e = c/a', formatResult(c.eccentricity,6), '', true);
  } else if(type==='hyperbola'){
    const c=hyperbola(h,k,p1,p2,true);
    html=resBox('Centro', `(${h}, ${k})`)+
      resBox('Focos', c.foci.map(f=>`(${f.x}, ${f.y})`).join('  ,  '))+
      resBox('Asíntotas', c.asymptotes.map(a=>`y = ${fN(a.slope,4)}x ${a.intercept>=0?'+':'−'} ${fN(Math.abs(a.intercept),4)}`).join('<br>'))+
      resBox('Excentricidad', formatResult(c.eccentricity,6), '', true);
  }
  res.innerHTML=html;
}

// ═══════════════════════════════════════════════════════
// VISTA PREVIA 2D EN VIVO
// ═══════════════════════════════════════════════════════
function initLivePreviews(){
  if(previewInitDone) return;
  previewInitDone = true;
  const app = document.getElementById('calc-app');
  if(!app) return;
  app.addEventListener('input', handlePreviewInput);
  app.addEventListener('change', handlePreviewInput);
}

function handlePreviewInput(e){
  const t = e.target;
  const root = t?.closest?.('.calc-card-body, .app-form');
  if(root?.id==='body-rev'){
    revSolidPolys=null;
    drawRevolutionSolid();
  }
  const cv = root?.querySelector?.('.calc-preview[data-gmode]');
  if(cv) schedulePreview(cv);
}

function schedulePreview(cv){
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => drawPreview(cv), 250);
}

function readInputValue(id){
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function readInputNum(id){
  const el = document.getElementById(id);
  const v = el ? parseFloat(el.value) : NaN;
  return Number.isFinite(v) ? v : NaN;
}

function readRevolutionParameters(){
  const mText=readInputValue('int-rev-m'), bText=readInputValue('int-rev-offset');
  const m=mText===''?1:Number(mText), b=bText===''?0:Number(bText);
  return Number.isFinite(m)&&Number.isFinite(b) ? {m,b} : null;
}

function usesRevolutionCoefficients(expression){
  return /\b(?:mx|m|b)\b/.test(expression);
}

function drawPreview(cv){
  if(!cv) return;
  const mode = cv.dataset.gmode;
  const src = cv.dataset.src || '';
  const a = readInputNum(cv.dataset.a);
  const b = readInputNum(cv.dataset.b);
  let points = [];

  if(mode === 'fn'){
    const isRevolution=Boolean(cv.dataset.secondary);
    const addMode=isRevolution&&v('int-rev-mode')==='add';
    const axisChoice=isRevolution?v('int-rev-axis'):'';
    const shift=readInputNum('int-rev-shift');
    const referenceLine=axisChoice.endsWith('-shift')&&Number.isFinite(shift)
      ? {axis:axisChoice.startsWith('x')?'x':'y',value:shift} : null;
    const revParams=isRevolution ? (addMode ? readRevolutionParameters() : {m:1,b:0}) : null;
    const expression=readInputValue(src);
    const fn = cv.dataset.secondary
      ? (revParams&&(addMode||!usesRevolutionCoefficients(expression))&&parseRevolutionFunction(expression,revParams))
      : calcParse(expression, cv.dataset.var || 'x');
    if(!fn){ renderPreview(cv, []); return; }
    const [x0, x1] = (a < b) ? [a, b] : [-8, 8];
    points = sampleFn(fn, x0, x1);
    if(addMode){
      const secondExpression=readInputValue(cv.dataset.secondary);
      if(secondExpression){
        const gn=parseRevolutionFunction(secondExpression,revParams);
        if(!gn){ renderPreview(cv, points, {referenceLine}); return; }
        const secondPoints=sampleFn(gn,x0,x1);
        renderPreview(cv,points,{
          secondPoints,
          markers:curveIntersections(fn,gn,x0,x1),
          referenceLine,
        });
        return;
      }
    }
    renderPreview(cv,points,{referenceLine});
    return;
  } else if(mode === 'param'){
    const ids = src.split(',');
    const xFn = calcParse(readInputValue(ids[0]), 't');
    const yFn = calcParse(readInputValue(ids[1]), 't');
    if(!xFn || !yFn){ renderPreview(cv, []); return; }
    const [t0, t1] = (a < b) ? [a, b] : [0, 2 * Math.PI];
    points = sampleParametric(xFn, yFn, t0, t1);
  } else if(mode === 'polar'){
    const rFn = calcParse(readInputValue(src), 't');
    if(!rFn){ renderPreview(cv, []); return; }
    const [t0, t1] = (a < b) ? [a, b] : [0, 2 * Math.PI];
    points = samplePolar(rFn, t0, t1);
  } else {
    renderPreview(cv, []);
    return;
  }
  renderPreview(cv, points);
}

// ═══════════════════════════════════════════════════════
// SÓLIDO DE REVOLUCIÓN 3D INTERACTIVO
// ═══════════════════════════════════════════════════════
function initRevolutionCanvas(){
  if(revCanvasInit) return;
  revCanvasInit = true;
  const cv = document.getElementById('rev-solid');
  if(!cv) return;

  cv.addEventListener('pointerdown', e => {
    revDrag = { x: e.clientX, y: e.clientY };
    cv.setPointerCapture?.(e.pointerId);
  });
  cv.addEventListener('pointermove', e => {
    if(!revDrag) return;
    const dx = e.clientX - revDrag.x, dy = e.clientY - revDrag.y;
    revDrag = { x: e.clientX, y: e.clientY };
    revRotY += dx * 0.5;
    revRotX += dy * 0.5;
    drawRevolutionSolid();
  });
  cv.addEventListener('pointerup', e => {
    revDrag = null;
    cv.releasePointerCapture?.(e.pointerId);
  });
  cv.addEventListener('pointercancel', () => { revDrag = null; });
  cv.addEventListener('wheel', e => {
    e.preventDefault();
    revScl *= (e.deltaY < 0 ? 1.1 : 0.9);
    revScl = Math.max(0.2, Math.min(20, revScl));
    drawRevolutionSolid();
  }, { passive: false });
}

function drawRevolutionSolid(){
  const cv = document.getElementById('rev-solid');
  if(!cv) return;
  if(!showRevSolid || !revSolidPolys){
    const ctx = cv.getContext && cv.getContext('2d');
    if(ctx) ctx.clearRect(0, 0, cv.width, cv.height);
    return;
  }
  const W = cv.clientWidth || cv.offsetWidth || 300;
  const H = cv.clientHeight || cv.offsetHeight || 240;
  const dpr = globalThis.devicePixelRatio || 1;
  cv.width = Math.max(1, Math.floor(W * dpr));
  cv.height = Math.max(1, Math.floor(H * dpr));
  const ctx = cv.getContext && cv.getContext('2d');
  if(!ctx) return;

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const s = Math.min(W, H) / 22 * revScl * revFit;
  const projectFn = (x, y, z) => project3D(x, y, z, {
    rotX: revRotX, rotY: revRotY, scale: s, cx: W / 2, cy: H / 2,
  });
  renderFigure(ctx, projectFn, {
    polys: revSolidPolys,
    color: readCanvasPalette()('graph-curve2'),
    opacity: 60,
  });
  ctx.restore();
}

function renderRevolutionSolid(fn, a, b, axis, gn=null, offset=0){
  try{
    revSolidPolys = recenterSolid(gn||offset!==0
      ? genRevolutionSolidBetween(fn,gn||(()=>0),a,b,axis,{offset})
      : genRevolutionSolid(fn, a, b, axis));
    const ext = computeSolidExtent(revSolidPolys);
    revFit = ext.maxR > 0 ? 9 / ext.maxR : 1;
    initRevolutionCanvas();
    drawRevolutionSolid();
  }catch(_e){
    // La vista 3D es un extra visual; nunca debe tumbar el resultado numérico.
  }
}

function toggleRevSolid(){
  showRevSolid = !showRevSolid;
  const tog = document.getElementById('rev-fig-tog');
  if(tog) {
    tog.classList.toggle('on', showRevSolid);
    tog.setAttribute('aria-pressed', String(showRevSolid));
  }
  const wrap = document.getElementById('rev-canvas-wrap');
  if(wrap) wrap.style.display = showRevSolid ? '' : 'none';
  drawRevolutionSolid();
}

// ═══════════════════════════════════════════════════════
// CALC INIT
// ═══════════════════════════════════════════════════════
let enterKeyBound = false;
function initEnterKey(){
  if(enterKeyBound) return;
  enterKeyBound = true;
  document.addEventListener('keydown', e => {
    if(e.key !== 'Enter' || e.isComposing) return;
    const inp = e.target;
    if(!inp || !inp.classList || !inp.classList.contains('calc-inp')) return;
    const card = inp.closest ? inp.closest('.calc-card') : null;
    if(!card) return;
    const btn = card.querySelector('.calc-btn:not(.sec)');
    if(btn){ e.preventDefault(); btn.click(); }
  });
}

function calcInit(tab='dif'){
  ['dif','int','mul','edo'].forEach(id=>buildKB('calc-kb-'+id));
  initInputTracking();
  initEnterKey();
  initLivePreviews();
  calcTab(tab);
}

export {
  previewCalcExpression,
  calcInit, calcTab, toggleCard, clearCard, kbInsert, seriesTypeChanged,
  calcLimit, calcLimitOp, calcDerivative, calcImplicit, calcAnalysis,
  calcIntegralIndef, calcIntegralDef, calcIntegralNumeric, calcRevolutionVolume, calcRevolutionModeChanged, calcRevolutionAxisChanged, calcTaylor, calcPartial,
  calcGradient, calcDoubleIntegral, calcEDOSep, calcEDOLinear,
  calcEDO2nd, toggleLimOp, toggleApps, setApp,
  appOptimize, appGrowth, appMotion, appTangent, appRelated, clearAppResult,
  appNewton, appMVT, appContinuity, appHyperbolic,
  calcIntegrateCAS, calcSeries, calcIntegralApp,
  calcParametric, calcPolar, calcConics,
  toggleRevSolid, calcGrad3D, calcDirectional, calcCurvature,
  calcDivCurl, calcConservative, calcLineIntegral, calcTheorems,
  calcMvLimit, calcExtrema, calcMvIntegral,
};
