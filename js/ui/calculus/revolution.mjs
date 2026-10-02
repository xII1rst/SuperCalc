import { computeSolidExtent, genRevolutionSolid, genRevolutionSolidBetween, recenterSolid } from '../../graphics/revolution.mjs';
import { curveIntersections, parseRevolutionFunction, revolutionVolume, revolutionVolumeAboutLine, revolutionVolumeBetween } from '../../math/calculus/revolution.mjs';
import { drawPreview } from './preview-renderer.mjs';
import { errBox, pf, readRevolutionParameters, resBox, usesRevolutionCoefficients, v } from './results.mjs';
import { formatResult } from '../../utils/format.mjs';
import { normalizeExpression } from '../../math/expression.mjs';
import { polynomialRevolutionEvaluation } from '../../math/integration/revolution.mjs';
import { project3D } from '../../graphics/projection.mjs';
import { readCanvasPalette } from '../../graphics/colors.mjs';
import { renderFigure } from '../../graphics/figures.mjs';

// Vista previa 2D en vivo + sólido de revolución 3D interactivo
let revRotX = 22, revRotY = -38, revScl = 1, revFit = 1;
export let revSolidPolys = null, revDrag = null, revCanvasInit = false;
let showRevSolid = false;
export function calcRevolutionVolume(){
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

export function calcRevolutionModeChanged(){
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

export function calcRevolutionAxisChanged(){
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

export function clearRevolutionSolid(){ revSolidPolys = null; }

export function drawRevolutionSolid(){
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

export function toggleRevSolid(){
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
