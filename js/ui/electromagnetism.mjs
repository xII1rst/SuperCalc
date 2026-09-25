import { createEmCanvas } from '../graphics/em-canvas.mjs';
import { emFmt } from '../utils/format.mjs';
import * as emMath from '../math/electromagnetism.mjs';
import { emRenderExtra } from './electromagnetism-extra.mjs';
import { resizeCanvasToContainer, observeContainerSize } from './canvas-size.mjs';
export {
  emCalcPotentialEnergy, emCalcCapacitance, emCalcWireField,
  emCalcInductance, emCalcOhm, emCalcRC, emCalcFluxChange,
} from './electromagnetism-extra.mjs';

// ══════════════════════════════════════════════════════
// EM MODULE
// ══════════════════════════════════════════════════════
let emCoord = 'cart';
let emInitDone = false;
let emCanvas, emRenderer;
let emScl = 1, emRotX = 25, emRotY = -35, emDrag = null, emLP = null;
let emObjects = []; // field sources/objects to draw
let emResult = null;
let emResizeObserver=null;

function emInit(){
  if(emInitDone) return;
  emInitDone = true;
  emCanvas = document.getElementById('em-canvas');
  emRenderer = createEmCanvas(emCanvas,()=>({emScl,emRotX,emRotY,emObjects}));
  emResizeObserver=observeContainerSize(document.getElementById('em-cw'),emResizeCanvas);
  emResizeCanvas();
  window.addEventListener('resize', emResizeCanvas);

  // Touch/mouse on EM canvas
  emCanvas.addEventListener('mousedown',e=>{emDrag={x:e.clientX,y:e.clientY,rx:emRotX,ry:emRotY};});
  let emRafPending=false;
  window.addEventListener('mousemove',e=>{
    if(!emDrag)return;
    emRotY=emDrag.ry+(e.clientX-emDrag.x)*.5;
    emRotX=emDrag.rx-(e.clientY-emDrag.y)*.5;
    if(!emRafPending){emRafPending=true;requestAnimationFrame(()=>{emDraw();emRafPending=false;});}
  });
  window.addEventListener('mouseup',()=>{emDrag=null;});
  emCanvas.addEventListener('touchstart',e=>{
    if(e.touches.length===1) emDrag={x:e.touches[0].clientX,y:e.touches[0].clientY,rx:emRotX,ry:emRotY};
    else if(e.touches.length===2){
      const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;
      emLP=Math.sqrt(dx*dx+dy*dy);
    }
  },{passive:true});
  emCanvas.addEventListener('touchmove',e=>{
    e.preventDefault();
    if(e.touches.length===1&&emDrag){
      emRotY=emDrag.ry+(e.touches[0].clientX-emDrag.x)*.5;
      emRotX=emDrag.rx-(e.touches[0].clientY-emDrag.y)*.5;
    } else if(e.touches.length===2&&emLP){
      const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;
      const np=Math.sqrt(dx*dx+dy*dy);
      emScl*=np/emLP; emLP=np;
      emScl=Math.min(Math.max(emScl,.3),5);
    }
    if(!emRafPending){emRafPending=true;requestAnimationFrame(()=>{emDraw();emRafPending=false;});}
  },{passive:false});
  emCanvas.addEventListener('touchend',()=>{emDrag=null;emLP=null;},{passive:true});
  emCanvas.addEventListener('wheel',e=>{
    e.preventDefault();
    emScl*=e.deltaY>0?0.92:1.08;
    emScl=Math.min(Math.max(emScl,.3),5);
    emDraw();
  },{passive:false});

  emForceRenderAllPanels(); // primera carga: renderizar todos los paneles
  // Double resize to ensure canvas fills correctly after mount
  requestAnimationFrame(()=>{
    emResizeCanvas();
    requestAnimationFrame(()=>emResizeCanvas());
  });
}

function emResizeCanvas(){
  const cw=document.getElementById('em-cw');
  resizeCanvasToContainer(emCanvas,cw,emDraw,window.devicePixelRatio||1);
}

// El renderizador gráfico recibe una instantánea del estado de la interfaz.
function emDraw(){emRenderer?.draw();}
// ── COORD SYSTEM ──────────────────────────────────────
function emSetCoord(c){
  emCoord=c;
  ['cart','cyl','sph'].forEach(id=>{
    document.getElementById('em-'+id).classList.toggle('on',id===c);
  });
  // Solo actualizar labels de coordenadas — no destruir resultados
  emRefreshCoordLabels();
}

function emResetView(){
  emRotX=25; emRotY=-35; emScl=1; emDraw();
}
function emTogglePanel(){
  const bot=document.getElementById('em-bottom');
  const btn=document.getElementById('em-panel-tog-btn');
  const collapsed=bot.classList.toggle('collapsed');
  btn.classList.toggle('on',!collapsed);
  setTimeout(()=>emResizeCanvas(),50);
}

function emShowTab(tab){
  document.querySelectorAll('.em-tab').forEach((t,i)=>{
    const tabs=['coulomb','gauss','potential','lorentz','faraday','maxwell','extra'];
    t.classList.toggle('on',tabs[i]===tab);
  });
  ['Coulomb','Gauss','Potential','Lorentz','Faraday','Maxwell','Extra'].forEach(t=>{
    const p=document.getElementById('em-p'+t);
    if(p) p.classList.toggle('on',t.toLowerCase()===tab);
  });
}

// ── PANEL RENDERERS ───────────────────────────────────
// Renderiza todos los paneles solo si están vacíos (primera carga)
function emRenderAllPanels(){
  if(!document.getElementById('em-pCoulomb')?.innerHTML?.trim()) emRenderCoulomb();
  if(!document.getElementById('em-pGauss')?.innerHTML?.trim())   emRenderGauss();
  if(!document.getElementById('em-pPotential')?.innerHTML?.trim()) emRenderPotential();
  if(!document.getElementById('em-pLorentz')?.innerHTML?.trim()) emRenderLorentz();
  if(!document.getElementById('em-pFaraday')?.innerHTML?.trim()) emRenderFaraday();
  if(!document.getElementById('em-pMaxwell')?.innerHTML?.trim()) emRenderMaxwell();
  if(!document.getElementById('em-pExtra')?.innerHTML?.trim()) emRenderExtra();
}

// Forzar re-render de todos los paneles (solo al abrir el módulo por 1a vez)
function emForceRenderAllPanels(){
  emRenderCoulomb(); emRenderGauss(); emRenderPotential();
  emRenderLorentz(); emRenderFaraday(); emRenderMaxwell();
  emRenderExtra();
}

// Al cambiar coordenadas: solo actualiza labels sin destruir resultados
function emRefreshCoordLabels(){
  const cl = emCoord==='cart'?['x','y','z']:emCoord==='cyl'?['ρ','φ°','z']:['r','θ°','φ°'];
  ['q1','q2'].forEach(qid=>{
    ['x','y','z'].forEach((ax,i)=>{
      const inp=document.getElementById('em-'+qid+ax);
      if(inp?.previousElementSibling) inp.previousElementSibling.textContent=cl[i];
    });
  });
}

// ─────────────────────────────────────────────────────
// COULOMB — Ley de Coulomb & Campo Eléctrico
// ─────────────────────────────────────────────────────
function emRenderCoulomb(){
  const p=document.getElementById('em-pCoulomb');
  if(!p)return;
  const coordLabels=emCoord==='cart'?['x','y','z']:emCoord==='cyl'?['ρ','φ°','z']:['r','θ°','φ°'];
  const [l1,l2,l3]=coordLabels;
  p.innerHTML=`
  <div class="em-section-title">Ley de Coulomb — Fuerza entre cargas</div>
  <div class="em-formula">F = k&middot;q<sub>1</sub>&middot;q<sub>2</sub> / r&sup2; &nbsp;|&nbsp; k = 8.9875&times;10&#8313; N&middot;m&sup2;/C&sup2;</div>
  <div class="em-input-row">
    <div class="em-input-group"><label>q₁ (C)</label><input id="em-q1" value="1e-6" placeholder="1e-6"></div>
    <div class="em-input-group"><label>q₂ (C)</label><input id="em-q2" value="-2e-6" placeholder="-2e-6"></div>
  </div>
  <div class="em-section-title" style="margin-top:10px">Posici&oacute;n de q<sub>1</sub> (${l1},${l2},${l3})</div>
  <div class="em-input-row">
    <div class="em-input-group"><label>${l1}</label><input id="em-q1x" value="0"></div>
    <div class="em-input-group"><label>${l2}</label><input id="em-q1y" value="0"></div>
    <div class="em-input-group"><label>${l3}</label><input id="em-q1z" value="0"></div>
  </div>
  <div class="em-section-title">Posici&oacute;n de q<sub>2</sub> (${l1},${l2},${l3})</div>
  <div class="em-input-row">
    <div class="em-input-group"><label>${l1}</label><input id="em-q2x" value="2"></div>
    <div class="em-input-group"><label>${l2}</label><input id="em-q2y" value="1"></div>
    <div class="em-input-group"><label>${l3}</label><input id="em-q2z" value="0"></div>
  </div>
  <button class="em-action-btn" data-action="emCalcCoulomb">Calcular y graficar</button>
  <div id="em-res-coulomb"></div>
  `;
}

function emToCart(a,b,c){
  return emMath.toCartesian(a,b,c,emCoord);
}

function emCalcCoulomb(){
  const q1=parseFloat(document.getElementById('em-q1').value)||0;
  const q2=parseFloat(document.getElementById('em-q2').value)||0;

  const [x1,y1,z1]=emToCart(
    parseFloat(document.getElementById('em-q1x').value)||0,
    parseFloat(document.getElementById('em-q1y').value)||0,
    parseFloat(document.getElementById('em-q1z').value)||0
  );
  const [x2,y2,z2]=emToCart(
    parseFloat(document.getElementById('em-q2x').value)||0,
    parseFloat(document.getElementById('em-q2y').value)||0,
    parseFloat(document.getElementById('em-q2z').value)||0
  );

  // Validar que las cargas no estén en el mismo punto
  const result=emMath.coulomb(q1,q2,[x1,y1,z1],[x2,y2,z2]);
  if(!result){
    document.getElementById('em-res-coulomb').innerHTML=
      '<div class="em-result-hint" style="color:var(--red);margin-top:10px">⚠ Las posiciones de q₁ y q₂ son iguales — la distancia es indefinida.</div>';
    return;
  }

  const {dist,F,sign,attract,ux,uy,uz,fSign,E,eDir}=result;

  // Escala visual: normalizar a longitud 2.5 unidades en canvas
  const sc=2.5;
  emObjects=[
    {type:'charge',x:x1,y:y1,z:z1,q:q1,label:'q₁'},
    {type:'charge',x:x2,y:y2,z:z2,q:q2,label:'q₂'},
    // Vector fuerza sobre q2
    {type:'vector',ox:x2,oy:y2,oz:z2,
      vx:fSign*ux*sc, vy:fSign*uy*sc, vz:fSign*uz*sc,
      color:'var(--orange)',label:'F'},
    // Campo eléctrico en q2 (dirección desde q1)
    {type:'vector',ox:x2,oy:y2,oz:z2,
      vx:eDir*ux*sc*0.6, vy:eDir*uy*sc*0.6, vz:eDir*uz*sc*0.6,
      color:'var(--gold)',label:'E'},
  ];
  emDraw();

  document.getElementById('em-res-coulomb').innerHTML=`
  <div class="em-math-grid" style="margin-top:10px">
    <div class="em-math-card full">
      <div class="em-math-label">Fuerza de Coulomb</div>
      <div class="em-math-value big">${emFmt(F)} N</div>
      <div class="em-result-hint">${sign} — ${attract?'Las cargas se atraen':'Las cargas se repelen'}</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">Distancia r (calculada)</div>
      <div class="em-math-value">${emFmt(dist)} m</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">Campo E en q₂</div>
      <div class="em-math-value">${emFmt(E)} N/C</div>
    </div>
    <div class="em-math-card full">
      <div class="em-math-label">Vector unitario r̂ (q₁→q₂)</div>
      <div class="em-math-value sm">(${emFmt(ux,3)}, ${emFmt(uy,3)}, ${emFmt(uz,3)})</div>
    </div>
    <div class="em-math-card full">
      <div class="em-math-label">Vector fuerza F⃗ sobre q₂</div>
      <div class="em-math-value sm">${emFmt(fSign*F*ux)} x̂ + ${emFmt(fSign*F*uy)} ŷ + ${emFmt(fSign*F*uz)} ẑ N</div>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────────────
// GAUSS
// ─────────────────────────────────────────────────────
function emRenderGauss(){
  const p=document.getElementById('em-pGauss');
  if(!p)return;
  p.innerHTML=`
  <div class="em-section-title">Ley de Gauss — Flujo Eléctrico</div>
  <div class="em-formula">&oint; E&middot;dA = Q<sub>enc</sub>/&epsilon;<sub>0</sub> &nbsp;|&nbsp; &epsilon;<sub>0</sub> = 8.854&times;10<sup>&minus;12</sup> F/m</div>
  <div class="em-section-title" style="margin-top:8px">Geometría de la superficie gaussiana</div>
  <div class="em-input-row">
    <div class="em-input-group">
      <label>Geometría</label>
      <select id="em-gauss-geo" style="background:var(--surface3);border:1px solid var(--border);border-radius:6px;color:var(--text1);font-family:Space Mono,monospace;font-size:11px;padding:7px 8px;width:100%">
        <option value="sphere">Esfera</option>
        <option value="cylinder">Cilindro</option>
        <option value="plane">Plano infinito</option>
      </select>
    </div>
    <div class="em-input-group"><label>Q_enc (C)</label><input id="em-qenc" value="1e-9"></div>
  </div>
  <div class="em-input-row">
    <div class="em-input-group"><label>r o d (m)</label><input id="em-gauss-r" value="0.1"></div>
    <div class="em-input-group"><label>L (m) — cilindro</label><input id="em-gauss-L" value="1"></div>
  </div>
  <button class="em-action-btn" data-action="emCalcGauss">Calcular flujo y campo</button>
  <div id="em-res-gauss"></div>`;
}

function emCalcGauss(){
  const geo=document.getElementById('em-gauss-geo').value;
  const Q=parseFloat(document.getElementById('em-qenc').value)||0;
  const r=parseFloat(document.getElementById('em-gauss-r').value)||0.1;
  const L=parseFloat(document.getElementById('em-gauss-L').value)||1;

  const {E,flux,area}=emMath.gauss(geo,Q,r,L);
  let note='';

  if(geo==='sphere'){
    note = 'E radial: E⃗ = (Q/4πε₀r²) r̂';
    emObjects=[{type:'charge',x:0,y:0,z:0,q:Q,label:'Q'}];
    // Draw radial field arrows
    [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].forEach(([dx,dy,dz])=>{
      const s=Q>0?1:-1;
      emObjects.push({type:'vector',ox:s*dx*r*3,oy:s*dy*r*3,oz:s*dz*r*3,vx:s*dx*2,vy:s*dy*2,vz:s*dz*2,color:'var(--orange)',label:''});
    });
  } else if(geo==='cylinder'){
    note = 'E radial: E⃗ = (lambda/2πε₀ρ) ρ̂  |  lambda = Q/L';
    emObjects=[{type:'charge',x:0,y:0,z:0,q:Q,label:'Q'}];
  } else {
    // infinite plane: σ = Q/A (we treat r as half-spacing)
    note = 'E uniforme: E⃗ = σ/2ε₀  (σ = densidad superficial)';
    emObjects=[];
  }

  emDraw();
  document.getElementById('em-res-gauss').innerHTML=`
  <div class="em-math-grid" style="margin-top:10px">
    <div class="em-math-card full">
      <div class="em-math-label">Flujo total Φ_E</div>
      <div class="em-math-value big">${emFmt(flux)} N·m²/C</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">Campo E</div>
      <div class="em-math-value">${emFmt(E)} N/C</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">Área gaussiana</div>
      <div class="em-math-value">${emFmt(area)} m²</div>
    </div>
    <div class="em-math-card full">
      <div class="em-math-label">Expresión del campo</div>
      <div class="em-result-hint">${note}</div>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────────────
// POTENCIAL ELÉCTRICO
// ─────────────────────────────────────────────────────
function emRenderPotential(){
  const p=document.getElementById('em-pPotential');
  if(!p)return;
  p.innerHTML=`
  <div class="em-section-title">Potencial Eléctrico</div>
  <div class="em-formula">V = k&middot;Q/r &nbsp;|&nbsp; &Delta;V = V<sub>B</sub> &minus; V<sub>A</sub> &nbsp;|&nbsp; W = q&middot;&Delta;V</div>
  <div class="em-input-row">
    <div class="em-input-group"><label>Q (C)</label><input id="em-vQ" value="1e-6"></div>
    <div class="em-input-group"><label>r_A (m)</label><input id="em-vra" value="0.1"></div>
    <div class="em-input-group"><label>r_B (m)</label><input id="em-vrb" value="0.3"></div>
  </div>
  <div class="em-input-row">
    <div class="em-input-group"><label>q prueba (C)</label><input id="em-vq" value="1e-9"></div>
  </div>
  <button class="em-action-btn" data-action="emCalcPotential">Calcular</button>
  <div id="em-res-potential"></div>`;
}

function emCalcPotential(){
  const Q=parseFloat(document.getElementById('em-vQ').value)||0;
  const rA=parseFloat(document.getElementById('em-vra').value)||0.1;
  const rB=parseFloat(document.getElementById('em-vrb').value)||0.3;
  const q=parseFloat(document.getElementById('em-vq').value)||1e-9;

  const {VA,VB,dV,W,E_A,E_B}=emMath.potential(Q,rA,rB,q);

  emObjects=[{type:'charge',x:0,y:0,z:0,q:Q,label:'Q'}];
  // Show points A and B
  emObjects.push({type:'vector',ox:rA,oy:0,oz:0,vx:0.01,vy:0,vz:0,color:'var(--green)',label:'A'});
  emObjects.push({type:'vector',ox:rB,oy:0,oz:0,vx:0.01,vy:0,vz:0,color:'var(--orange)',label:'B'});
  emDraw();

  document.getElementById('em-res-potential').innerHTML=`
  <div class="em-math-grid" style="margin-top:10px">
    <div class="em-math-card">
      <div class="em-math-label">V en A (r=${rA}m)</div>
      <div class="em-math-value">${emFmt(VA)} V</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">V en B (r=${rB}m)</div>
      <div class="em-math-value">${emFmt(VB)} V</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">ΔV = V_B - V_A</div>
      <div class="em-math-value">${emFmt(dV)} V</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">Trabajo W = q·ΔV</div>
      <div class="em-math-value">${emFmt(W)} J</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">E en A</div>
      <div class="em-math-value">${emFmt(E_A)} N/C</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">E en B</div>
      <div class="em-math-value">${emFmt(E_B)} N/C</div>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────────────
// FUERZA DE LORENTZ
// ─────────────────────────────────────────────────────
function emRenderLorentz(){
  const p=document.getElementById('em-pLorentz');
  if(!p)return;
  p.innerHTML=`
  <div class="em-section-title">Fuerza de Lorentz</div>
  <div class="em-formula"><b>F</b> = q(<b>E</b> + <b>v</b> &times; <b>B</b>)</div>
  <div class="em-section-title" style="margin-top:8px">Carga y velocidad</div>
  <div class="em-input-row">
    <div class="em-input-group"><label>q (C)</label><input id="em-lq" value="1.6e-19"></div>
  </div>
  <div class="em-input-row">
    <div class="em-input-group"><label>vx (m/s)</label><input id="em-lvx" value="1e6"></div>
    <div class="em-input-group"><label>vy</label><input id="em-lvy" value="0"></div>
    <div class="em-input-group"><label>vz</label><input id="em-lvz" value="0"></div>
  </div>
  <div class="em-section-title">Campo eléctrico E⃗ (N/C)</div>
  <div class="em-input-row">
    <div class="em-input-group"><label>Ex</label><input id="em-lex" value="0"></div>
    <div class="em-input-group"><label>Ey</label><input id="em-ley" value="1e4"></div>
    <div class="em-input-group"><label>Ez</label><input id="em-lez" value="0"></div>
  </div>
  <div class="em-section-title">Campo magnético B⃗ (T)</div>
  <div class="em-input-row">
    <div class="em-input-group"><label>Bx</label><input id="em-lbx" value="0"></div>
    <div class="em-input-group"><label>By</label><input id="em-lby" value="0"></div>
    <div class="em-input-group"><label>Bz</label><input id="em-lbz" value="0.5"></div>
  </div>
  <button class="em-action-btn" data-action="emCalcLorentz">Calcular fuerza</button>
  <div id="em-res-lorentz"></div>`;
}

function emCalcLorentz(){
  const q=parseFloat(document.getElementById('em-lq').value)||0;
  const vx=parseFloat(document.getElementById('em-lvx').value)||0;
  const vy=parseFloat(document.getElementById('em-lvy').value)||0;
  const vz=parseFloat(document.getElementById('em-lvz').value)||0;
  const Ex=parseFloat(document.getElementById('em-lex').value)||0;
  const Ey=parseFloat(document.getElementById('em-ley').value)||0;
  const Ez=parseFloat(document.getElementById('em-lez').value)||0;
  const Bx=parseFloat(document.getElementById('em-lbx').value)||0;
  const By=parseFloat(document.getElementById('em-lby').value)||0;
  const Bz=parseFloat(document.getElementById('em-lbz').value)||0;

  const {cxB,cyB,czB,Fx,Fy,Fz,Fmag,vmag,Emag,Bmag}=emMath.lorentz(
    q,[vx,vy,vz],[Ex,Ey,Ez],[Bx,By,Bz]
  );

  // Escala visual: cada vector se normaliza a 2.5 unidades para que siempre sea visible
  function scaleVec(x,y,z,len=2.5){
    const m=Math.sqrt(x*x+y*y+z*z);
    if(m<1e-30) return {vx:0,vy:0,vz:0};
    return {vx:x/m*len, vy:y/m*len, vz:z/m*len};
  }
  const sv=scaleVec(vx,vy,vz), sE=scaleVec(Ex,Ey,Ez), sB=scaleVec(Bx,By,Bz), sF=scaleVec(Fx,Fy,Fz);
  emObjects=[];
  if(vmag>1e-30)  emObjects.push({type:'vector',ox:0,oy:0,oz:0,...sv,color:'var(--green)',label:'v⃗'});
  if(Emag>1e-30)  emObjects.push({type:'vector',ox:0,oy:0,oz:0,...sE,color:'var(--gold)',label:'E'});
  if(Bmag>1e-30)  emObjects.push({type:'vector',ox:0,oy:0,oz:0,...sB,color:'var(--blue)',label:'B'});
  if(Fmag>1e-30)  emObjects.push({type:'vector',ox:0,oy:0,oz:0,...sF,color:'var(--red)',label:'F⃗'});
  emDraw();

  document.getElementById('em-res-lorentz').innerHTML=`
  <div class="em-math-grid" style="margin-top:10px">
    <div class="em-math-card full">
      <div class="em-math-label">Fuerza total F⃗ = q(E⃗ + v⃗×B⃗)</div>
      <div class="em-math-value sm">(${emFmt(Fx)}, ${emFmt(Fy)}, ${emFmt(Fz)}) N</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">|F⃗|</div>
      <div class="em-math-value">${emFmt(Fmag)} N</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">v⃗ × B⃗</div>
      <div class="em-math-value sm">(${emFmt(cxB,3)}, ${emFmt(cyB,3)}, ${emFmt(czB,3)})</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">F_eléctrica = qE</div>
      <div class="em-math-value">${emFmt(q*Emag)} N</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">F_magnética = q|v×B|</div>
      <div class="em-math-value">${emFmt(q*Math.sqrt(cxB**2+cyB**2+czB**2))} N</div>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────────────
// FARADAY — Inducción electromagnética
// ─────────────────────────────────────────────────────
function emRenderFaraday(){
  const p=document.getElementById('em-pFaraday');
  if(!p)return;
  p.innerHTML=`
  <div class="em-section-title">Ley de Faraday — Inducción</div>
  <div class="em-formula">&varepsilon; = &minus;d&Phi;<sub>B</sub>/dt &nbsp;|&nbsp; &Phi;<sub>B</sub> = B&middot;A&middot;cos(&theta;)</div>
  <div class="em-input-row">
    <div class="em-input-group"><label>B (T)</label><input id="em-fb" value="0.5"></div>
    <div class="em-input-group"><label>A (m²)</label><input id="em-fa" value="0.01"></div>
    <div class="em-input-group"><label>θ (°)</label><input id="em-ftheta" value="0"></div>
  </div>
  <div class="em-input-row">
    <div class="em-input-group"><label>dB/dt (T/s)</label><input id="em-fdbdt" value="2"></div>
    <div class="em-input-group"><label>N vueltas</label><input id="em-fn" value="100"></div>
  </div>
  <button class="em-action-btn" data-action="emCalcFaraday">Calcular FEM</button>
  <div id="em-res-faraday"></div>`;
}

function emCalcFaraday(){
  const B=parseFloat(document.getElementById('em-fb').value)||0;
  const A=parseFloat(document.getElementById('em-fa').value)||0;
  const th=parseFloat(document.getElementById('em-ftheta').value)||0;
  const dBdt=parseFloat(document.getElementById('em-fdbdt').value)||0;
  const N=parseFloat(document.getElementById('em-fn').value)||1;

  const {thRad,flux,dFluxDt,emf}=emMath.faraday(B,A,th,dBdt,N);

  // Vector B on canvas
  emObjects=[
    {type:'vector',ox:0,oy:0,oz:0,vx:0,vy:B*3,vz:0,color:'var(--blue)',label:'B'},
  ];
  emDraw();

  document.getElementById('em-res-faraday').innerHTML=`
  <div class="em-math-grid" style="margin-top:10px">
    <div class="em-math-card">
      <div class="em-math-label">Flujo Φ_B</div>
      <div class="em-math-value">${emFmt(flux)} Wb</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">dΦ_B/dt</div>
      <div class="em-math-value">${emFmt(dFluxDt)} Wb/s</div>
    </div>
    <div class="em-math-card full">
      <div class="em-math-label">FEM inducida ε = −N·dΦ/dt</div>
      <div class="em-math-value big">${emFmt(emf)} V</div>
      <div class="em-result-hint">${emf>0?'Dirección: positiva (Lenz)':'Dirección: negativa (Lenz)'}</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">N vueltas</div>
      <div class="em-math-value">${N}</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">cos(θ)</div>
      <div class="em-math-value">${emFmt(Math.cos(thRad),4)}</div>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────────────
// MAXWELL — Las 4 ecuaciones
// ─────────────────────────────────────────────────────
function emRenderMaxwell(){
  const p=document.getElementById('em-pMaxwell');
  if(!p)return;
  p.innerHTML=`
  <div class="em-section-title">Ecuaciones de Maxwell</div>
  <div class="em-formula" style="line-height:2">
    &nabla;&middot;E = &rho;/&epsilon;<sub>0</sub> &nbsp;&nbsp;&nbsp;(Gauss el&eacute;ctrico)<br>
    &nabla;&middot;B = 0 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(Gauss magn&eacute;tico)<br>
    &nabla;&times;E = &minus;&part;B/&part;t &nbsp;(Faraday)<br>
    &nabla;&times;B = &mu;<sub>0</sub>J + &mu;<sub>0</sub>&epsilon;<sub>0</sub>&part;E/&part;t &nbsp;(Amp&egrave;re-Maxwell)
  </div>
  <div class="em-section-title" style="margin-top:8px">Onda electromagnética en el vacío</div>
  <div class="em-formula">c = 1/&radic;(&mu;<sub>0</sub>&epsilon;<sub>0</sub>) &nbsp;|&nbsp; E = c&middot;B &nbsp;|&nbsp; <b>S</b> = (1/&mu;<sub>0</sub>) <b>E</b>&times;<b>B</b></div>
  <div class="em-input-row">
    <div class="em-input-group"><label>E₀ (N/C)</label><input id="em-mE0" value="1000"></div>
    <div class="em-input-group"><label>f (Hz)</label><input id="em-mf" value="1e9"></div>
  </div>
  <button class="em-action-btn" data-action="emCalcMaxwell">Calcular onda EM</button>
  <div id="em-res-maxwell"></div>`;
}

function emCalcMaxwell(){
  const E0=parseFloat(document.getElementById('em-mE0').value)||1000;
  const f=parseFloat(document.getElementById('em-mf').value)||1e9;

  const {c,B0,lambda,k,S,uE,uB}=emMath.maxwell(E0,f);

  // Draw E and B vectors orthogonal
  emObjects=[
    {type:'vector',ox:0,oy:0,oz:0,vx:0,vy:3,vz:0,color:'var(--gold)',label:'E'},
    {type:'vector',ox:0,oy:0,oz:0,vx:0,vy:0,vz:3,color:'var(--blue)',label:'B'},
    {type:'vector',ox:0,oy:0,oz:0,vx:3,vy:0,vz:0,color:'var(--red)',label:'S'},
  ];
  emDraw();

  document.getElementById('em-res-maxwell').innerHTML=`
  <div class="em-math-grid" style="margin-top:10px">
    <div class="em-math-card">
      <div class="em-math-label">c = 1/&radic;(&mu;0&epsilon;0)</div>
      <div class="em-math-value">${emFmt(c,0)} m/s</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">B0 = E0/c</div>
      <div class="em-math-value">${emFmt(B0)} T</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">Long. de onda &lambda;</div>
      <div class="em-math-value">${emFmt(lambda)} m</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">Poynting |S|</div>
      <div class="em-math-value">${emFmt(S)} W/m&sup2;</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">u_E (densidad)</div>
      <div class="em-math-value">${emFmt(uE)} J/m&sup3;</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">u_B (densidad)</div>
      <div class="em-math-value">${emFmt(uB)} J/m&sup3;</div>
    </div>
    <div class="em-math-card full">
      <div class="em-math-label">k = &omega;/c (n&uacute;m. de onda)</div>
      <div class="em-math-value">${emFmt(k)} rad/m</div>
    </div>
  </div>`;
}

export {
  emInit, emResizeCanvas, emDraw, emSetCoord, emResetView,
  emTogglePanel, emShowTab, emCalcCoulomb, emCalcGauss,
  emCalcPotential, emCalcLorentz, emCalcFaraday, emCalcMaxwell,
};
