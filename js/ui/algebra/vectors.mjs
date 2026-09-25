import { vmag, vdot, vcross, vangle, vproj, combineVectors } from '../../math/algebra/vector.mjs';
import { triangleGeometry } from '../../math/algebra/triangle.mjs';
import { solveVectorEquation, solveUnknownComponents } from '../../math/algebra/vector-equations.mjs';
import { createVectorCanvas } from '../../graphics/vector-canvas.mjs';
import { fDMS, fN as formatDecimal, toFrac, formatMagnitude } from '../../utils/format.mjs';
import { showToast } from '../toast.mjs';
import { resizeCanvasToContainer, observeContainerSize } from '../canvas-size.mjs';

let figureControls;
export function attachFigureControls(controls) { figureControls = controls; }
function setUnkTarget(value) { unkTarget = value; }

// ── PALETTE ───────────────────────────────────────────
const PAL=['var(--gold)','var(--pink)','var(--blue)','var(--orange)','var(--green)','var(--red)','var(--purple)','var(--teal)','var(--al2)','var(--ca2)'];
function vc(i){ return PAL[i%PAL.length]; }
const RC='var(--purple)', SC='var(--green)';

// ── STATE ─────────────────────────────────────────────
let mode=3, fracMode=false, showFigure=false;
let vecs=[];
let palIdx=0;
let nid=0, rV=null, sR=null, unkR=null;
let rotX=22, rotY=-38, scl=1, drag=null, lp=null;
let opS='+', opI=[];
let unkOp='·', unkTarget='0';
let triVecsBackup=null;
let alInitDone=false;
let vectorResizeObserver=null;

// ── FRACTIONS ─────────────────────────────────────────
function fN(value,decimals=6){
  return fracMode?toFrac(value):formatDecimal(value,decimals);
}
function fV(vx,vy,vz){ return mode===3?`(${fN(vx)}, ${fN(vy)}, ${fN(vz)})`:`(${fN(vx)}, ${fN(vy)})`; }

// p.ej. fMag(8.3666...) → "√70"  |  fMag(5) → "5"  |  fMag(√2) → "√2"
function fMag(x){
  return formatMagnitude(x,fN);
}


function toggleSection(el){
  const body=el.nextElementSibling;
  const arrow=el.querySelector('.collapsible-arrow');
  const isOpen=body.style.maxHeight&&body.style.maxHeight!=='0px';
  body.style.maxHeight=isOpen?'0px':(body.scrollHeight+20)+'px';
  if(arrow) arrow.classList.toggle('open',!isOpen);
}
function mathTogSteps(sid,tog){
  const body=document.getElementById(sid);
  if(!body) return;
  const on=!body.classList.contains('on');
  body.classList.toggle('on',on);
  tog.classList.toggle('on',on);
  tog.querySelector('span:last-child').textContent=on?'ocultar pasos':'ver pasos';
  // Expandir el collapsible-body padre si está colapsado
  const cb=body.closest('.collapsible-body');
  if(cb&&on) cb.style.maxHeight=(cb.scrollHeight+body.scrollHeight+40)+'px';
}
function openAllSections(){
  document.querySelectorAll('.collapsible-body').forEach(b=>{b.style.maxHeight=(b.scrollHeight+20)+'px';});
  document.querySelectorAll('.collapsible-arrow').forEach(a=>a.classList.add('open'));
}

function togglePanel(){
  if(window.innerWidth>=700) return; // en desktop el panel siempre visible
  const bot=document.getElementById('bottom');
  const btn=document.getElementById('panel-tog-btn');
  const collapsed=bot.classList.toggle('collapsed');
  btn.classList.toggle('on',!collapsed);
  setTimeout(()=>resize(),50);
}
function toggleFrac(){
  fracMode=!fracMode;
  document.getElementById('frac-tog').classList.toggle('on',fracMode);
  document.getElementById('frac-lbl').textContent=fracMode?'FRAC':'DEC';
  if(document.getElementById('pM').classList.contains('on')) rM();
  if(document.getElementById('pE').classList.contains('on')) rE();
  if(document.getElementById('pI').classList.contains('on')) rI();
  if(document.getElementById('pO').classList.contains('on')) rO();
  rLeg();
}
function toggleFigure(){
  showFigure=!showFigure;
  document.getElementById('fig-tog').classList.toggle('on',showFigure);
  draw();
}

// ── MATH HELPERS ──────────────────────────────────────
function eduHint(t,v){
  if(t==='dot'){if(Math.abs(v)<.001)return'⊥ Ortogonales';return v>0?'↑ Misma dirección':'↓ Dir. opuesta';}
  if(t==='ang'){if(Math.abs(v)<.1)return'∥ Paralelos';if(Math.abs(v-180)<.1)return'∥ Antiparalelos';if(Math.abs(v-90)<.5)return'⊥ Perpendiculares';return'';}
  if(t==='cr'){if(v<.001)return'∥ Paralelos (|cruz|=0)';return'Área paral. = '+fN(v,4);}
  return'';
}

// ── MODE ──────────────────────────────────────────────
function setMode(m){
  mode=m;
  document.getElementById('br2').classList.toggle('on',m===2);
  document.getElementById('br3').classList.toggle('on',m===3);
  rV=null;sR=null;unkR=null;opI=[];
  renderVecs();rM();rO();rE();rI();draw();
}
function resetView(){rotX=22;rotY=-38;scl=1;draw();}
function showTab(t){
  ['V','M','O','E','I','T','F'].forEach((x,i)=>{
    document.querySelectorAll('.tab')[i].classList.toggle('on',x===t);
    document.getElementById('p'+x).classList.toggle('on',x===t);
  });
  if(t==='M')rM();if(t==='O')rO();if(t==='E')rE();if(t==='I')rI();
  if(t==='F')figureControls.figInitPanel();
}

// ── VECTOR PANEL ──────────────────────────────────────
function renderVecs(){
  let h='';
  vecs.forEach((v,i)=>{
    const c=v.cl;
    const mag2=Math.sqrt(v.vx**2+v.vy**2+(mode===3?v.vz**2:0));
    const zeroWarn=mag2<1e-9?'<span style="font-size:9px;color:var(--red);font-family:Space Mono,monospace;margin-left:auto">|v|=0</span>':'';
    const zf=(l,val,k)=>mode===3?`<div class="inp-group"><label style="color:${c}">${l}</label><input type="number" value="${val}" data-action="uV" data-event="input" data-id="${v.id}" data-key="${k}"/></div>`:'';
    h+=`<div class="vec-card" style="border-left-color:${c}">
      <div class="vec-card-header">
        <div class="vec-color-dot" style="background:${c}"></div>
        <input class="vec-name-input" value="${v.nm}" maxlength="4" data-action="uN" data-event="input" data-id="${v.id}" style="color:${c}"/>
        <button class="badge ${v.on?'badge-on':'badge-off'}" data-action="togV" data-arg="${v.id}" data-arg-type="number">${v.on?'ON':'OFF'}</button>
        ${zeroWarn}
        ${vecs.length>1?`<button class="badge badge-del" data-action="delV" data-arg="${v.id}" data-arg-type="number">✕</button>`:''}
      </div>
      <div class="vec-inputs">
        <div class="inp-group"><label style="color:var(--red)">X</label><input type="number" value="${v.vx}" data-action="uV" data-event="input" data-id="${v.id}" data-key="vx"/></div>
        <div class="inp-group"><label style="color:var(--green)">Y</label><input type="number" value="${v.vy}" data-action="uV" data-event="input" data-id="${v.id}" data-key="vy"/></div>
        ${zf('Z',v.vz,'vz')}
      </div>
    </div>`;
  });
  h+=`<button class="add-vec-btn" data-action="addV">+ Agregar vector</button>`;
  document.getElementById('pV').innerHTML=h;
  rLeg();
}
function uV(id,k,val){const v=vecs.find(v=>v.id===id);if(v)v[k]=parseFloat(val)||0;draw();rLeg();if(document.getElementById('pM').classList.contains('on'))rM();}
function uN(id,val){const v=vecs.find(v=>v.id===id);if(v)v.nm=val||'v';rLeg();if(document.getElementById('pO').classList.contains('on'))rO();if(document.getElementById('pE').classList.contains('on'))rE();if(document.getElementById('pI').classList.contains('on'))rI();}
function togV(id){const v=vecs.find(v=>v.id===id);if(v)v.on=!v.on;renderVecs();draw();if(document.getElementById('pM').classList.contains('on'))rM();}
function delV(id){if(vecs.length<=1){showToast('Al menos 1 vector.','warn');return;}vecs=vecs.filter(v=>v.id!==id);opI=opI.filter(i=>i!==id);renderVecs();draw();rO();rE();rI();}
function addV(){
  const used=vecs.map(v=>v.nm);
  const pool=['C','D','E','F','G','H','P','Q','R','S','T','U','W'];
  const nm=pool.find(n=>!used.includes(n))||'V'+nid;
  vecs.push({id:nid++,on:true,nm,vx:1,vy:1,vz:1,cl:PAL[palIdx++%PAL.length]});
  renderVecs();draw();
}

// ── LEGEND ────────────────────────────────────────────
function rLeg(){
  let h='';
  vecs.filter(v=>v.on).forEach(v=>{
    const c=v.cl;
    const cp=mode===3?`(${v.vx},${v.vy},${v.vz})`:`(${v.vx},${v.vy})`;
    h+=`<div class="leg-item" style="border-left-color:${c}"><div class="leg-dot" style="background:${c}"></div><span class="leg-text">${v.nm} ${cp}</span></div>`;
  });
  if(rV&&!rV.scalar){const cp=fV(rV.vx,rV.vy,rV.vz);h+=`<div class="leg-item" style="border-left-color:${RC}"><div class="leg-dot" style="background:${RC}"></div><span class="leg-text">res ${cp}</span></div>`;}
  if(sR&&!sR.err){const cp=fV(sR.vx,sR.vy,sR.vz);h+=`<div class="leg-item" style="border-left-color:${SC}"><div class="leg-dot" style="background:${SC}"></div><span class="leg-text">${sR.nm} ${cp}</span></div>`;}
  document.getElementById('legend').innerHTML=h;
}

// ── MATH PANEL ────────────────────────────────────────
function rM(){
  const mc=document.getElementById('pM');
  const act=vecs.filter(v=>v.on);
  if(!act.length){mc.innerHTML='<p style="color:var(--text3);font-size:12px;padding:4px 0">Sin vectores activos.</p>';return;}
  let h='';
  h+=`<div class="section-title">Magnitudes · Ángulos directores</div><div class="math-grid">`;
  act.forEach(v=>{
    const c=v.cl,m=vmag(v,mode);
    const ax=m?Math.acos(Math.max(-1,Math.min(1,v.vx/m)))*180/Math.PI:0;
    const ay=m?Math.acos(Math.max(-1,Math.min(1,v.vy/m)))*180/Math.PI:0;
    const az=mode===3&&m?Math.acos(Math.max(-1,Math.min(1,v.vz/m)))*180/Math.PI:null;
    const ux=m?fN(v.vx/m):'—',uy=m?fN(v.vy/m):'—',uz=mode===3&&m?fN(v.vz/m):'—';
    h+=`<div class="math-card full"><div class="math-label" style="color:${c}">${v.nm}</div>
      <div class="math-value">|${v.nm}| = ${fMag(m)}</div>
      <div class="math-value sm">αx=${fDMS(ax)} αy=${fDMS(ay)}${az!==null?' αz='+fDMS(az):''}</div>
      <div class="math-value sm" style="color:var(--text3)">û = (${ux}, ${uy}${mode===3?', '+uz:''})</div>
    </div>`;
  });
  h+=`</div>`;
  // Multi-vector global stats (3+ vectors)
  if(act.length>=2){
    const sumV={vx:act.reduce((s,v)=>s+v.vx,0),vy:act.reduce((s,v)=>s+v.vy,0),vz:act.reduce((s,v)=>s+v.vz,0)};
    const sumM=vmag(sumV,mode);
    const names=act.map((v,i)=>`<span style="color:${v.cl}">${v.nm}</span>`).join('+');
    h+=`<div class="section-title">Suma de todos los vectores</div>
    <div class="math-grid">
      <div class="math-card full"><div class="math-label">${names}</div>
        <div class="math-value sm">${fV(sumV.vx,sumV.vy,sumV.vz)}</div>
        <div class="math-value">|suma| = ${fMag(sumM)}</div>
      </div>
    </div>`;
  }
  // All pairwise combinations — collapsible
  for(let i=0;i<act.length;i++) for(let j=i+1;j<act.length;j++){
    const a=act[i],b=act[j],ci=a.cl,cj=b.cl;
    const d=vdot(a,b,mode),an=vangle(a,b,mode),pab=vproj(a,b,mode),pba=vproj(b,a,mode);
    const cr=mode===3?vcross(a,b):null,crM=cr?Math.sqrt(cr.x**2+cr.y**2+cr.z**2):0;
    const ma=vmag(a,mode),mb=vmag(b,mode);
    const hint=eduHint('ang',an);

    const dotSteps = mode===3
      ? [`<b>${a.nm}·${b.nm}</b> = (${fN(a.vx)})(${fN(b.vx)}) + (${fN(a.vy)})(${fN(b.vy)}) + (${fN(a.vz)})(${fN(b.vz)})`,
         `= ${fN(a.vx*b.vx)} + ${fN(a.vy*b.vy)} + ${fN(a.vz*b.vz)}`,
         `= <b>${fN(d)}</b>`]
      : [`<b>${a.nm}·${b.nm}</b> = (${fN(a.vx)})(${fN(b.vx)}) + (${fN(a.vy)})(${fN(b.vy)})`,
         `= ${fN(a.vx*b.vx)} + ${fN(a.vy*b.vy)}`,
         `= <b>${fN(d)}</b>`];

    const angSteps = [
      `cos θ = (<b>${a.nm}·${b.nm}</b>) / (|${a.nm}|·|${b.nm}|)`,
      `|${a.nm}| = ${fMag(ma)},  |${b.nm}| = ${fMag(mb)}`,
      `cos θ = ${fN(d,4)} / (${fMag(ma)} × ${fMag(mb)})`,
      `cos θ = ${fN(d,4)} / ${fMag(ma*mb)}`,
      `cos θ = ${fN(ma&&mb?d/(ma*mb):0,6)}`,
      `θ = cos⁻¹(${fN(ma&&mb?d/(ma*mb):0,6)})`,
      `θ = <b>${fDMS(an)}</b>`,
    ];
    const projABSteps = [
      `proy = (<b>${a.nm}·${b.nm}</b>) / |${b.nm}|`,
      `= ${fN(d,4)} / ${fMag(mb)}`,
      `= <b>${fN(pab,4)}</b>`,
    ];
    const projBASteps = [
      `proy = (<b>${a.nm}·${b.nm}</b>) / |${a.nm}|`,
      `= ${fN(d,4)} / ${fMag(ma)}`,
      `= <b>${fN(pba,4)}</b>`,
    ];
    const crossSteps = cr ? [
      `<b>${a.nm}×${b.nm}</b> — regla del determinante 3×3`,
      `i: (${fN(a.vy)})(${fN(b.vz)}) − (${fN(a.vz)})(${fN(b.vy)}) = <b>${fN(cr.x,4)}</b>`,
      `j: (${fN(a.vz)})(${fN(b.vx)}) − (${fN(a.vx)})(${fN(b.vz)}) = <b>${fN(cr.y,4)}</b>`,
      `k: (${fN(a.vx)})(${fN(b.vy)}) − (${fN(a.vy)})(${fN(b.vx)}) = <b>${fN(cr.z,4)}</b>`,
      `resultado = <b>(${fN(cr.x,4)}, ${fN(cr.y,4)}, ${fN(cr.z,4)})</b>`,
      `|${a.nm}×${b.nm}| = ${fMag(crM)}`,
    ] : [];

    const mkCard = (label,value,hint,steps,full=false) => {
      const sid='mst_'+(Math.random().toString(36).slice(2,7));
      return `<div class="math-card${full?' full':''}">
        <div class="math-label">${label}</div>
        <div class="math-value${full?' sm':''}">${value}</div>
        ${hint?`<div class="math-hint">${hint}</div>`:''}
        <div class="math-steps-tog" data-action="mathTogSteps" data-arg="${sid}">
          <span class="tog-arr">▶</span><span>ver pasos</span>
        </div>
        <div class="math-steps-body" id="${sid}">
          ${steps.map(s=>`<div class="math-step-line">${s}</div>`).join('')}
        </div>
      </div>`;
    };

    h+=`<div class="collapsible-header" data-action="toggleSection">
      <div class="section-title" style="margin-bottom:0;border-bottom:none;flex:1">
        <span style="color:${ci}">${a.nm}</span>&nbsp;—&nbsp;<span style="color:${cj}">${b.nm}</span>
        ${hint?`<span style="font-size:9px;color:var(--green);font-style:italic;font-weight:400;margin-left:6px">${hint}</span>`:''}
      </div>
      <span class="collapsible-arrow open">▶</span>
    </div>
    <div class="collapsible-body" style="max-height:9999px">
    <div class="math-grid" style="margin-bottom:10px">
      ${mkCard('Prod. punto',fN(d),eduHint('dot',d),dotSteps)}
      ${mkCard('Ángulo',fDMS(an),'',angSteps)}
      ${mkCard(`Proy ${a.nm}→${b.nm}`,fN(pab),'',projABSteps)}
      ${mkCard(`Proy ${b.nm}→${a.nm}`,fN(pba),'',projBASteps)}
      ${cr?mkCard(`${a.nm}×${b.nm}`,`(${fN(cr.x,2)}, ${fN(cr.y,2)}, ${fN(cr.z,2)})`,eduHint('cr',crM),crossSteps,true):''}
    </div></div>`;
  }
  mc.innerHTML=h;
}

// ── OPS PANEL ─────────────────────────────────────────
function rO(){
  const p=document.getElementById('pO');
  const sb=vecs.map((v,i)=>{const c=v.cl,sel=opI.includes(v.id);return`<button class="ops-vec-btn ${sel?'on':''}" style="${sel?`color:${c};border-color:${c}`:''}" data-action="tO" data-arg="${v.id}" data-arg-type="number">${v.nm}</button>`;}).join('');
  const ob=['+','−','×','·'].map(o=>`<button class="op-btn ${opS===o?'on':''}" data-action="sO" data-arg="${o}">${o}</button>`).join('');
  let rh='';
  if(rV){
    if(rV.scalar){rh=`<div class="result-box"><div class="result-title">⟶ Resultado escalar</div><div class="result-val">${fN(rV.sv,4)}</div><div class="result-sub">Valor escalar — no se grafica</div></div>`;}
    else{const m=vmag(rV,mode);const cp=fV(rV.vx,rV.vy,rV.vz);rh=`<div class="result-box"><div class="result-title">⟶ Resultado vector</div><div class="result-val">${cp}</div><div class="result-sub">|res| = ${fMag(m)}</div></div><button class="add-vec-btn" style="border-style:solid;border-color:${RC};color:${RC};margin-top:0" data-action="saveR">+ Guardar como vector</button>`;}
  }
  p.innerHTML=`<div class="section-title">Selecciona vectores</div>
    <div class="ops-vec-btns">${sb}</div>
    <div class="section-title">Operación</div>
    <div class="op-btns">${ob}</div>
    `+(() => {
    const selNames = opI.map(id=>{const v=vecs.find(v=>v.id===id);return v?v.nm:'?';});
    let expr = '';
    if(selNames.length>=2){
      if(opS==='+') expr=selNames.join(' + ');
      else if(opS==='−') expr=selNames.join(' − ');
      else if(opS==='×') expr=selNames.join(' × ');
      else if(opS==='·') expr=selNames.join(' · ');
      expr = '<div style="font-family:Space Mono,monospace;font-size:12px;color:var(--text2);background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:8px 12px;margin-bottom:10px;text-align:center">'+expr+' = ?</div>';
    }
    return expr;
  })()+`<button class="action-btn" data-action="compute">Calcular y graficar</button>${rh}`;
}
function tO(id){const i=opI.indexOf(id);i>=0?opI.splice(i,1):opI.push(id);rO();}
function sO(o){opS=o;rO();}
function compute(){
  if(opI.length<2){showToast('Selecciona al menos 2 vectores.','warn');return;}
  const sel=opI.map(id=>vecs.find(v=>v.id===id)).filter(Boolean);
  if(opS==='×'&&mode===2){showToast('Cruz solo en R³.','warn');return;}
  if((opS==='×'||opS==='·')&&sel.length!==2){showToast('Exactamente 2 vectores.','warn');return;}
  rV=combineVectors(sel,opS,mode);
  rO();rLeg();draw();
}
function saveR(){if(!rV||rV.scalar)return;const used=vecs.map(v=>v.nm);const nm=['R','S','T','P','Q'].find(n=>!used.includes(n))||'R'+nid;vecs.push({id:nid++,on:true,nm,...rV,cl:PAL[palIdx++%PAL.length]});rV=null;renderVecs();rO();draw();}

// ── ECUACIÓN SOLVER ───────────────────────────────────
function rE(){
  const p=document.getElementById('pE');
  const vn=vecs.map(v=>`<span style="color:${v.cl}">${v.nm}</span>`).join(', ');
  const ex=vecs.length>=2?`${vecs[0].nm}+2${vecs[1].nm}-x=4(x-${vecs[0].nm})`:'A+2B-x=4(x-A)';
  let sh='';
  if(sR){
    if(sR.err){sh=`<div class="error-box">⚠ ${sR.err}</div>`;}
    else{const cp=fV(sR.vx,sR.vy,sR.vz);const m=vmag({vx:sR.vx,vy:sR.vy,vz:sR.vz||0},mode);
      sh=`<div class="solve-result"><div class="solve-title">✓ ${sR.nm} resuelto</div>
        ${sR.steps.map(s=>`<div class="solve-step"><b>›</b> ${s}</div>`).join('')}
        <div class="solve-final">${sR.nm} = ${cp}</div>
        <div class="solve-mag">|${sR.nm}| = ${fMag(m)}</div></div>
        <button class="add-vec-btn" style="border-style:solid;border-color:${SC};color:${SC};margin-top:0" data-action="saveSol">+ Graficar ${sR.nm}</button>`;}
  }
  p.innerHTML=`<div class="solver-desc">Vectores: ${vn}<br/>Escribe una ecuación vectorial y despeja la incógnita.<br/>Ejemplo: <strong>${ex}</strong></div>
    <div class="eq-row"><span class="eq-label">Incógnita:</span><input class="eq-input" id="iu" value="x" maxlength="4" style="max-width:80px"/></div>
    <input class="eq-input" id="ie" placeholder="${ex}" style="width:100%;margin-bottom:8px"/>
    <button class="action-btn" data-action="runSolve">Resolver y graficar</button>${sh}`;
}
function runSolve(){const eq=document.getElementById('ie').value.trim();const unk=document.getElementById('iu').value.trim();if(!eq||!unk){showToast('Completa ecuación e incógnita.','warn');return;}const r=solveVectorEquation(eq,unk,vecs,mode,fN);if(r.err){sR={err:r.err};rE();return;}sR={nm:unk,steps:r.steps,vx:r.res.vx,vy:r.res.vy,vz:r.res.vz||0};rE();rLeg();draw();}
function saveSol(){if(!sR||sR.err)return;const used=vecs.map(v=>v.nm);const nm=!used.includes(sR.nm)?sR.nm:(['R','S','T'].find(n=>!used.includes(n))||'S'+nid);vecs.push({id:nid++,on:true,nm,vx:sR.vx,vy:sR.vy,vz:sR.vz||0,cl:PAL[palIdx++%PAL.length]});sR=null;renderVecs();rE();draw();}

// ── INCÓGNITA (componente desconocida) ────────────────
// Resuelve: operación(A,B) = target  donde A o B tienen componentes con variables
// Variables como "x","k" en componentes, resuelve la(s) variable(s)
let unkVecs=[
  {nm:'A',comps:['3','5','0']},
  {nm:'B',comps:['5','x','0']},
];

function rI(){
  const p=document.getElementById('pI');
  const ops=['·','|A|','|B|','+','-'];
  const opBtns=ops.map(o=>`<button class="unk-op-btn ${unkOp===o?'on':''}" data-action="setUnkOp" data-arg="${o}">${o}</button>`).join('');
  let vecRows='';
  unkVecs.forEach((v,i)=>{
    const compsCount=mode===3?3:2;
    const labels=['X','Y','Z'];
    const colors=['var(--red)','var(--green)','var(--blue)'];
    let compInputs='';
    for(let c=0;c<compsCount;c++){
      compInputs+=`<div class="unk-comp-group">
        <span class="unk-comp-lbl" style="color:${colors[c]}">${labels[c]}</span>
        <input class="unk-comp" value="${v.comps[c]||'0'}" placeholder="${labels[c].toLowerCase()}" data-action="updUnkVec" data-event="input" data-index="${i}" data-component="${c}" title="Número o variable (ej: x, 2k)"/>
      </div>`;
    }
    const canDel=unkVecs.length>1;
    vecRows+=`<div class="unk-vec-item">
      <div class="unk-vec-name" style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <input style="background:none;border:none;border-bottom:2px solid var(--blue);color:var(--blue);font-family:'Space Mono',monospace;font-size:14px;font-weight:700;width:44px;outline:none;text-align:center;padding:1px 2px" value="${v.nm}" data-action="updUnkName" data-event="input" data-index="${i}"/>
        <span style="font-size:10px;color:var(--text3);font-family:'Space Mono',monospace">vector ${i+1}</span>
        ${canDel?`<button class="badge badge-del" data-action="delUnkVec" data-arg="${i}" data-arg-type="number" style="margin-left:auto">✕</button>`:''}
      </div>
      <div class="unk-comp-row">${compInputs}</div>
    </div>`;
  });
  let resHtml='';
  if(unkR){
    if(unkR.err){resHtml=`<div class="error-box">⚠ ${unkR.err}</div>`;}
    else{
      const steps=unkR.steps.map(s=>`<div class="solve-step"><b>›</b> ${s}</div>`).join('');
      resHtml=`<div class="unk-result-box"><div class="unk-result-title">✓ Solución</div>${steps}
        ${Object.entries(unkR.vars).map(([k,v])=>`<div class="unk-result-val">${k} = ${fN(v,6)}</div>`).join('')}
        <div class="unk-result-check" id="unk-check">${unkR.check}</div>
      </div>`;
    }
  }
  p.innerHTML=`<div class="solver-desc" style="border-left:3px solid var(--blue)">
      Define vectores con <strong>componentes numéricas o variables</strong> (ej: x, k, t).<br/>
      Selecciona la operación y el resultado esperado para resolver.<br/>
      Ejemplo: <strong>A(3,5) · B(5,x) = 0</strong> → x = −3
    </div>
    <div class="section-title">Vectores con incógnita</div>
    <div class="unk-vec-row">${vecRows}</div>
    <button class="add-vec-btn" style="margin-bottom:10px" data-action="addUnkVec">+ Agregar vector</button>
    <div class="section-title">Operación y resultado esperado</div>
    <div class="unk-op-row">${opBtns}
      <span style="font-size:11px;color:var(--text3);font-family:'Space Mono',monospace">=</span>
      <input class="unk-result-input" id="unk-target" value="${unkTarget}" placeholder="0" data-action="setUnkTarget" data-event="input"/>
    </div>
    <button class="action-btn blue" data-action="runUnkSolve">Resolver incógnita</button>
    ${resHtml}`;
}
function setUnkOp(o){unkOp=o;rI();}
function updUnkVec(i,c,val){unkVecs[i].comps[c]=val;unkR=null;}
function updUnkName(i,val){unkVecs[i].nm=val||'A';}
function addUnkVec(){unkVecs.push({nm:String.fromCharCode(65+unkVecs.length),comps:['0','0','0']});unkR=null;rI();}
function delUnkVec(i){if(unkVecs.length<=1)return;unkVecs.splice(i,1);unkR=null;rI();}

function runUnkSolve(){
  unkR=solveUnknownComponents(unkVecs,unkOp,unkTarget,mode,fN);
  rI();
}

// ── CANVAS ────────────────────────────────────────────
const cv=document.getElementById('c');
const {draw}=createVectorCanvas(cv,()=>({vecs,mode,rV,sR,scl,showFigure,rotX,rotY}));
// ── RESIZE & INPUT ────────────────────────────────────
function resize(){
  const w=document.getElementById('cw');
  resizeCanvasToContainer(cv,w,draw,window.devicePixelRatio||1);
}
cv.addEventListener('mousedown',e=>{drag={x:e.clientX,y:e.clientY,rx:rotX,ry:rotY};});
window.addEventListener('mousemove',e=>{if(!drag)return;if(mode===3){rotY=drag.ry+(e.clientX-drag.x)*.5;rotX=drag.rx-(e.clientY-drag.y)*.5;}draw();});
window.addEventListener('mouseup',()=>{drag=null;});
cv.addEventListener('touchstart',e=>{
  if(e.touches.length===1) drag={x:e.touches[0].clientX,y:e.touches[0].clientY,rx:rotX,ry:rotY};
  else if(e.touches.length===2){const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;lp=Math.sqrt(dx*dx+dy*dy);}
  e.preventDefault();},{passive:false});
cv.addEventListener('touchmove',e=>{
  if(e.touches.length===1&&drag){if(mode===3){rotY=drag.ry+(e.touches[0].clientX-drag.x)*.5;rotX=drag.rx-(e.touches[0].clientY-drag.y)*.5;}draw();}
  else if(e.touches.length===2&&lp){const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;const d=Math.sqrt(dx*dx+dy*dy);scl=Math.min(Math.max(scl*(d/lp),.3),5);lp=d;draw();}
  e.preventDefault();},{passive:false});
cv.addEventListener('touchend',()=>{drag=null;lp=null;});
window.addEventListener('resize',resize);
cv.addEventListener('wheel',e=>{
  e.preventDefault();
  const delta=e.deltaY>0?0.92:1.08;
  scl=Math.min(Math.max(scl*delta,.3),5);
  draw();
},{passive:false});

// AL vectors init — called when module opens
function initVectorsApp(){
  if(!alInitDone){
    alInitDone=true;
    vecs=[]; palIdx=0; nid=0;
    renderVecs();
  }
  if(!vectorResizeObserver){
    vectorResizeObserver=observeContainerSize(document.getElementById('cw'),resize);
  }
  // Double resize to ensure canvas fills correctly after mount
  setTimeout(()=>{ resize(); }, 30);
  setTimeout(()=>{ resize(); draw(); }, 120);
}

// ═══════════════════════════════════════════════════════
// TRIÁNGULO 3D
// ═══════════════════════════════════════════════════════

function triGet(id){ return parseFloat(document.getElementById(id).value)||0; }

// ══════════════════════════════════════════════════════
function triClear(){
  document.getElementById('tri-res').innerHTML='';
  ['px','py','pz','qx','qy','qz','rx','ry','rz'].forEach(k=>{
    const el=document.getElementById('tri-'+k);
    if(el) el.value='0';
  });
}

function triCalc(){
  const P={x:triGet('tri-px'),y:triGet('tri-py'),z:triGet('tri-pz')};
  const Q={x:triGet('tri-qx'),y:triGet('tri-qy'),z:triGet('tri-qz')};
  const R={x:triGet('tri-rx'),y:triGet('tri-ry'),z:triGet('tri-rz')};

  const {
    PQ, QR, PR, QP, RP, RQ, dPQ, dQR, dPR,
    angP, angQ, angR, sumAng,
    cr, crossMag, area, dotPQPR, dotQPQR, dotRPRQ,
  }=triangleGeometry(P,Q,R);
  const fmt=v=>fN(v,4);

  // ── Construir HTML de resultados ──
  const mkStepCard=(title,color,steps)=>`
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:11px 13px;margin-bottom:8px">
      <div style="font-family:'Space Grotesk',sans-serif;font-size:11px;font-weight:700;color:${color};margin-bottom:8px;letter-spacing:.04em">${title}</div>
      ${steps.map(s=>`<div style="font-family:'Space Mono',monospace;font-size:10px;color:var(--text-soft);line-height:1.9;padding:1px 0">${s}</div>`).join('')}
    </div>`;

  const mkResult=(label,value,color='var(--accent)')=>`
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:9px 12px;flex:1;min-width:0">
      <div style="font-family:'Space Mono',monospace;font-size:8px;color:var(--text3);letter-spacing:.08em;text-transform:uppercase;margin-bottom:3px">${label}</div>
      <div style="font-family:'Space Mono',monospace;font-size:13px;color:${color};font-weight:700">${value}</div>
    </div>`;

  // Pasos lado PQ
  const stepsPQ=[
    `<b style="color:var(--gold)">PQ</b> = Q − P`,
    `= (${Q.x}−${P.x}, ${Q.y}−${P.y}, ${Q.z}−${P.z})`,
    `= <b>(${fmt(PQ.x)}, ${fmt(PQ.y)}, ${fmt(PQ.z)})</b>`,
    `|<b>PQ</b>| = √(${fmt(PQ.x)}² + ${fmt(PQ.y)}² + ${fmt(PQ.z)}²)`,
    `= √(${fmt(PQ.x**2)} + ${fmt(PQ.y**2)} + ${fmt(PQ.z**2)})`,
    `= √${fmt(PQ.x**2+PQ.y**2+PQ.z**2)} = <b>${fMag(dPQ)}</b>`,
  ];
  const stepsQR=[
    `<b style="color:var(--blue)">QR</b> = R − Q`,
    `= (${R.x}−${Q.x}, ${R.y}−${Q.y}, ${R.z}−${Q.z})`,
    `= <b>(${fmt(QR.x)}, ${fmt(QR.y)}, ${fmt(QR.z)})</b>`,
    `|<b>QR</b>| = √(${fmt(QR.x)}² + ${fmt(QR.y)}² + ${fmt(QR.z)}²)`,
    `= √${fmt(QR.x**2+QR.y**2+QR.z**2)} = <b>${fMag(dQR)}</b>`,
  ];
  const stepsPR=[
    `<b style="color:var(--green)">PR</b> = R − P`,
    `= (${R.x}−${P.x}, ${R.y}−${P.y}, ${R.z}−${P.z})`,
    `= <b>(${fmt(PR.x)}, ${fmt(PR.y)}, ${fmt(PR.z)})</b>`,
    `|<b>PR</b>| = √(${fmt(PR.x)}² + ${fmt(PR.y)}² + ${fmt(PR.z)}²)`,
    `= √${fmt(PR.x**2+PR.y**2+PR.z**2)} = <b>${fMag(dPR)}</b>`,
  ];

  // Pasos ángulo P
  const stepsAngP=[
    `cos P = (<b>PQ · PR</b>) / (|PQ|·|PR|)`,
    `<b>PQ · PR</b> = (${fmt(PQ.x)})(${fmt(PR.x)}) + (${fmt(PQ.y)})(${fmt(PR.y)}) + (${fmt(PQ.z)})(${fmt(PR.z)})`,
    `= ${fmt(PQ.x*PR.x)} + ${fmt(PQ.y*PR.y)} + ${fmt(PQ.z*PR.z)} = <b>${fmt(dotPQPR)}</b>`,
    `cos P = ${fmt(dotPQPR)} / (${fmt(dPQ)} × ${fmt(dPR)})`,
    `cos P = ${fmt(dotPQPR)} / ${fmt(dPQ*dPR)} = ${fmt(dotPQPR/(dPQ*dPR))}`,
    `P = cos⁻¹(${fmt(dotPQPR/(dPQ*dPR))}) = <b>${fDMS(angP)}</b>`,
  ];
  const stepsAngQ=[
    `cos Q = (<b>QP · QR</b>) / (|QP|·|QR|)`,
    `<b>QP · QR</b> = (${fmt(QP.x)})(${fmt(QR.x)}) + (${fmt(QP.y)})(${fmt(QR.y)}) + (${fmt(QP.z)})(${fmt(QR.z)})`,
    `= ${fmt(QP.x*QR.x)} + ${fmt(QP.y*QR.y)} + ${fmt(QP.z*QR.z)} = <b>${fmt(dotQPQR)}</b>`,
    `cos Q = ${fmt(dotQPQR)} / (${fmt(dPQ)} × ${fmt(dQR)})`,
    `cos Q = ${fmt(dotQPQR)} / ${fmt(dPQ*dQR)} = ${fmt(dotQPQR/(dPQ*dQR))}`,
    `Q = cos⁻¹(${fmt(dotQPQR/(dPQ*dQR))}) = <b>${fDMS(angQ)}</b>`,
  ];
  const stepsAngR=[
    `cos R = (<b>RP · RQ</b>) / (|RP|·|RQ|)`,
    `<b>RP · RQ</b> = (${fmt(RP.x)})(${fmt(RQ.x)}) + (${fmt(RP.y)})(${fmt(RQ.y)}) + (${fmt(RP.z)})(${fmt(RQ.z)})`,
    `= ${fmt(RP.x*RQ.x)} + ${fmt(RP.y*RQ.y)} + ${fmt(RP.z*RQ.z)} = <b>${fmt(dotRPRQ)}</b>`,
    `cos R = ${fmt(dotRPRQ)} / (${fmt(dPR)} × ${fmt(dQR)})`,
    `cos R = ${fmt(dotRPRQ)} / ${fmt(dPR*dQR)} = ${fmt(dotRPRQ/(dPR*dQR))}`,
    `R = cos⁻¹(${fmt(dotRPRQ/(dPR*dQR))}) = <b>${fDMS(angR)}</b>`,
  ];

  // Pasos área
  const stepsArea=[
    `<b>PQ × PR</b> — producto vectorial`,
    `i: (${fmt(PQ.y)})(${fmt(PR.z)}) − (${fmt(PQ.z)})(${fmt(PR.y)}) = <b>${fmt(cr.x)}</b>`,
    `j: (${fmt(PQ.z)})(${fmt(PR.x)}) − (${fmt(PQ.x)})(${fmt(PR.z)}) = <b>${fmt(cr.y)}</b>`,
    `k: (${fmt(PQ.x)})(${fmt(PR.y)}) − (${fmt(PQ.y)})(${fmt(PR.x)}) = <b>${fmt(cr.z)}</b>`,
    `|<b>PQ × PR</b>| = √(${fmt(cr.x)}² + ${fmt(cr.y)}² + ${fmt(cr.z)}²) = ${fMag(crossMag)}`,
    `Área = |PQ × PR| / 2 = ${fmt(crossMag)} / 2 = <b>${fMag(area)}</b>`,
  ];

  const verif=Math.abs(sumAng-180)<0.01
    ?`<span style="color:var(--green)">✓ ${fDMS(angP)} + ${fDMS(angQ)} + ${fDMS(angR)} = ${fmt(sumAng)}° ≈ 180°</span>`
    :`<span style="color:var(--red)">⚠ Suma = ${fmt(sumAng)}° (revisar datos)</span>`;

  document.getElementById('tri-res').innerHTML=`
    <!-- Resumen superior -->
    <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">
      ${mkResult('Lado PQ', fMag(dPQ), 'var(--gold)')}
      ${mkResult('Lado QR', fMag(dQR), 'var(--blue)')}
      ${mkResult('Lado PR', fMag(dPR), 'var(--green)')}
    </div>
    <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">
      ${mkResult('Ángulo P', fDMS(angP), 'var(--gold)')}
      ${mkResult('Ángulo Q', fDMS(angQ), 'var(--blue)')}
      ${mkResult('Ángulo R', fDMS(angR), 'var(--green)')}
    </div>
    <div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap">
      ${mkResult('Perímetro', fMag(dPQ+dQR+dPR))}
      ${mkResult('Área', fMag(area))}
    </div>
    <div style="font-family:'Space Mono',monospace;font-size:9px;margin-bottom:14px;padding:7px 12px;background:var(--surface2);border-radius:8px;border:1px solid var(--border)">${verif}</div>

    <!-- Pasos colapsables -->
    <div class="section-title" style="margin-bottom:8px">A) Lados del triángulo</div>
    ${mkStepCard('Lado PQ = Q − P', 'var(--gold)', stepsPQ)}
    ${mkStepCard('Lado QR = R − Q', 'var(--blue)', stepsQR)}
    ${mkStepCard('Lado PR = R − P', 'var(--green)', stepsPR)}

    <div class="section-title" style="margin-top:14px;margin-bottom:8px">C) Ángulos internos</div>
    ${mkStepCard('Ángulo en P', 'var(--gold)', stepsAngP)}
    ${mkStepCard('Ángulo en Q', 'var(--blue)', stepsAngQ)}
    ${mkStepCard('Ángulo en R', 'var(--green)', stepsAngR)}

    <div class="section-title" style="margin-top:14px;margin-bottom:8px">Área del triángulo</div>
    ${mkStepCard('Producto vectorial PQ × PR', 'var(--al2)', stepsArea)}
  `;

  // ── Graficar en el canvas 3D ──
  // Añadir los 3 puntos como vectores temporales y dibujar
  triDrawCanvas(P, Q, R);
}

function triDrawCanvas(P, Q, R){
  // Guardar vecs del usuario para poder restaurarlos
  if(!triVecsBackup) triVecsBackup = vecs.map(v=>({...v}));

  // Asignar los 3 puntos como vectores
  vecs = [
    {id:901,on:true,nm:'P',vx:P.x,vy:P.y,vz:P.z,cl:'var(--gold)'},
    {id:902,on:true,nm:'Q',vx:Q.x,vy:Q.y,vz:Q.z,cl:'var(--blue)'},
    {id:903,on:true,nm:'R',vx:R.x,vy:R.y,vz:R.z,cl:'var(--green)'},
  ];

  // Asegurarse de estar en R³
  if(mode!==3){ mode=3; }

  // Renderizar y dibujar — con delay para que el canvas esté visible
  showTab('V');
  setTimeout(()=>{
    renderVecs();
    rLeg();
    draw();
    // Añadir botón de retorno en el panel de vectores
    const pV = document.getElementById('pV');
    if(pV && !document.getElementById('tri-restore-btn')){
      const btn = document.createElement('button');
      btn.id = 'tri-restore-btn';
      btn.textContent = '← Restaurar mis vectores';
      btn.style.cssText = 'margin:8px 14px;padding:7px 14px;background:none;border:1px solid var(--border);border-radius:8px;color:var(--text3);font-family:Space Mono,monospace;font-size:10px;cursor:pointer;display:block;width:calc(100% - 28px)';
      btn.onclick = ()=>{
        vecs = triVecsBackup || vecs;
        triVecsBackup = null;
        renderVecs(); rLeg(); draw();
        btn.remove();
        showTab('T');
      };
      pV.insertBefore(btn, pV.firstChild);
    }
    // Volver a mostrar resultados
    setTimeout(()=>showTab('T'), 80);
  }, 60);
}

export {
  initVectorsApp, draw, addUnkVec, addV, delUnkVec, delV,
  resetView, runSolve, runUnkSolve, sO, saveR, saveSol,
  setMode, setUnkOp, setUnkTarget, showTab, tO, togV,
  toggleFigure, toggleFrac, togglePanel, toggleSection,
  uN, uV, updUnkName, updUnkVec, triCalc, triClear,
  compute, mathTogSteps,
};
