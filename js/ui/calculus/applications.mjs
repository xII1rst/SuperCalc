import { setCalcActiveInput } from './keyboard.mjs';
import { calcParse, collectVariables } from '../../math/expression.mjs';
import { checkContinuity, hyperbolicValues, inverseHyperbolic, meanValueTheorem, motionAt, newtonMethod, optimizeFunction, populationGrowth, relatedRates } from '../../math/applications.mjs';
import { errBox, pf, resBox, v } from './results.mjs';
import { fN, formatResult } from '../../utils/format.mjs';
import { rationalFunctionAnalysis, tangentDifferential, theoremCheck } from '../../math/differential-applications.mjs';
import { symbolicDeriv } from '../../math/calculus/derivatives.mjs';

// ═══════════════════════════════════════════════════════
// APLICACIONES DE DERIVADAS
// ═══════════════════════════════════════════════════════
let currentApp = 'opt';
let appsVisible = false;

export function toggleApps(){
  appsVisible=!appsVisible;
  document.getElementById('apps-panel').style.display=appsVisible?'block':'none';
  if(appsVisible) setApp('opt');
}

export function setApp(id){
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
    inp.addEventListener('focus',()=>{ setCalcActiveInput(inp); });
  });
}

function appRes(html){ document.getElementById('app-res').innerHTML=html; }
export function clearAppResult(){ appRes(''); }

export function appOptimize(){
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

export function appGrowth(){
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

export function appMotion(){
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

export function appTangent(){
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

export function appRelated(){
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



export function appNewton(){
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

export function appMVT(){
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

export function appContinuity(){
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

export function appHyperbolic(){
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
