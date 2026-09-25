import {
  solveFreeInequality, solveQuadraticInequality, solveRationalInequality,
  solveSystemInequality, solveAbsoluteInequality,
} from '../../math/algebra/inequalities.mjs';
import { drawNumberLine } from '../../graphics/analysis.mjs';

// ═══════════════════════════════════════════════════════
// INECUACIONES MODULE v2.0
// ═══════════════════════════════════════════════════════
let ineqType = null;

function ineqSetType(type) {
  ineqType = type;
  document.getElementById('ineq-pick-screen').style.display = 'none';
  const solver = document.getElementById('ineq-solver');
  solver.classList.add('on');
  const titles = {
    libre:    'Expresión libre: f(x) ⊳ g(x)',
    quad:     'Cuadrática: ax² + bx + c ⊳ 0',
    rational: 'Racional: P(x)/Q(x) ⊳ 0',
    system:   'Sistema de Inecuaciones',
    abs:      'Valor Absoluto: |f(x)| ⊳ c',
  };
  document.getElementById('ineq-solver-title').textContent = titles[type]||type;
  buildIneqForm(type);
}

function ineqBack() {
  ineqType = null;
  document.getElementById('ineq-pick-screen').style.display = '';
  document.getElementById('ineq-solver').classList.remove('on');
}

function ineqSymCycle(btnId, symbols) {
  const btn = document.getElementById(btnId);
  const cur = btn.textContent;
  const idx = (symbols.indexOf(cur)+1) % symbols.length;
  btn.textContent = symbols[idx];
}

function buildIneqForm(type) {
  const body = document.getElementById('ineq-solver-body');
  if(type==='libre') {
    body.innerHTML = `
      <div class="mat-sec">Inecuación — expresión libre</div>
      <div style="font-size:10px;font-family:'Space Mono',monospace;color:var(--text-muted);margin-bottom:10px">
        Escribe ambos lados como expresiones en x. Ej: (x+3)(x-1) &lt; (x-1)^2+3x
      </div>
      <div class="ineq-libre-row">
        <div class="ineq-libre-grp">
          <label class="ineq-libre-lbl">Lado izquierdo f(x)</label>
          <input class="ineq-inp-libre" id="iq-lhs" placeholder="ej: (x+3)(x-1)"/>
        </div>
        <button class="ineq-sym-btn on" id="iq-sym-libre"
          data-action="ineqSymCycle" data-arg="iq-sym-libre"><</button>
        <div class="ineq-libre-grp">
          <label class="ineq-libre-lbl">Lado derecho g(x)</label>
          <input class="ineq-inp-libre" id="iq-rhs" placeholder="ej: (x-1)^2+3x"/>
        </div>
      </div>
      <button class="ineq-btn" data-action="ineqSolveLibre">Resolver</button>
      <div id="ineq-res"></div>
      <canvas id="ineq-numline" height="72"></canvas>`;
  } else if(type==='quad') {
    body.innerHTML = `
      <div class="mat-sec">Inecuación Cuadrática</div>
      <div style="font-size:10px;font-family:'Space Mono',monospace;color:var(--text-muted);margin-bottom:10px">ax² + bx + c ⊳ 0</div>
      <div class="ineq-row">
        <div class="ineq-inp-grp"><label>a</label><input class="ineq-inp" id="iq-a" value="1" type="number" step="any"></div>
        <span class="ineq-lbl-mid">x² +</span>
        <div class="ineq-inp-grp"><label>b</label><input class="ineq-inp" id="iq-b" value="-3" type="number" step="any"></div>
        <span class="ineq-lbl-mid">x +</span>
        <div class="ineq-inp-grp"><label>c</label><input class="ineq-inp" id="iq-c" value="2" type="number" step="any"></div>
        <button class="ineq-sym-btn on" id="iq-sym" data-action="ineqSymCycle" data-arg="iq-sym">&lt;</button>
        <span class="ineq-lbl-mid">0</span>
      </div>
      <button class="ineq-btn" data-action="ineqSolveQuad">Resolver</button>
      <div id="ineq-res"></div>
      <canvas id="ineq-numline" height="72"></canvas>`;
  } else if(type==='rational') {
    body.innerHTML = `
      <div class="mat-sec">Inecuación Racional</div>
      <div style="font-size:10px;font-family:'Space Mono',monospace;color:var(--text-muted);margin-bottom:10px">
        P(x)/Q(x) ⊳ 0 — tabla de signos automática
      </div>
      <div class="ineq-libre-row">
        <div class="ineq-libre-grp">
          <label class="ineq-libre-lbl">Numerador P(x)</label>
          <input class="ineq-inp-libre" id="iq-rat-num" placeholder="ej: x^2+3x-10"/>
        </div>
        <span class="ineq-lbl-mid" style="padding-top:24px;font-size:18px">/</span>
        <div class="ineq-libre-grp">
          <label class="ineq-libre-lbl">Denominador Q(x)</label>
          <input class="ineq-inp-libre" id="iq-rat-den" placeholder="ej: x^2+x-2"/>
        </div>
        <button class="ineq-sym-btn on" id="iq-rat-sym"
          data-action="ineqSymCycle" data-arg="iq-rat-sym" style="align-self:flex-end;margin-bottom:4px">&lt;</button>
        <span class="ineq-lbl-mid" style="padding-top:24px">0</span>
      </div>
      <button class="ineq-btn" data-action="ineqSolveRational">Tabla de signos</button>
      <div id="ineq-res"></div>
      <canvas id="ineq-numline" height="72"></canvas>`;
  } else if(type==='system') {
    body.innerHTML = `
      <div class="mat-sec">Sistema de Inecuaciones</div>
      <div style="font-size:10px;font-family:'Space Mono',monospace;color:var(--text-muted);margin-bottom:10px">Dos inecuaciones lineales — se calcula la intersección</div>
      <div class="ineq-row" style="margin-bottom:6px">
        <div class="ineq-inp-grp"><label>a₁</label><input class="ineq-inp" id="iq-a1" value="1" type="number" step="any"></div>
        <span class="ineq-lbl-mid">x +</span>
        <div class="ineq-inp-grp"><label>b₁</label><input class="ineq-inp" id="iq-b1" value="-2" type="number" step="any"></div>
        <button class="ineq-sym-btn on" id="iq-s1" data-action="ineqSymCycle" data-arg="iq-s1">&gt;</button>
        <div class="ineq-inp-grp"><label>c₁</label><input class="ineq-inp" id="iq-c1" value="-1" type="number" step="any"></div>
      </div>
      <div class="ineq-row">
        <div class="ineq-inp-grp"><label>a₂</label><input class="ineq-inp" id="iq-a2" value="1" type="number" step="any"></div>
        <span class="ineq-lbl-mid">x +</span>
        <div class="ineq-inp-grp"><label>b₂</label><input class="ineq-inp" id="iq-b2" value="3" type="number" step="any"></div>
        <button class="ineq-sym-btn on" id="iq-s2" data-action="ineqSymCycle" data-arg="iq-s2">&lt;</button>
        <div class="ineq-inp-grp"><label>c₂</label><input class="ineq-inp" id="iq-c2" value="10" type="number" step="any"></div>
      </div>
      <button class="ineq-btn" data-action="ineqSolveSystem">Resolver</button>
      <div id="ineq-res"></div>
      <canvas id="ineq-numline" height="72"></canvas>`;
  } else if(type==='abs') {
    body.innerHTML = `
      <div class="mat-sec">Valor Absoluto</div>
      <div style="font-size:10px;font-family:'Space Mono',monospace;color:var(--text-muted);margin-bottom:10px">|ax + b| ⊳ c</div>
      <div class="ineq-row">
        <span class="ineq-lbl-mid" style="font-size:16px">|</span>
        <div class="ineq-inp-grp"><label>a</label><input class="ineq-inp" id="iq-a" value="2" type="number" step="any"></div>
        <span class="ineq-lbl-mid">x +</span>
        <div class="ineq-inp-grp"><label>b</label><input class="ineq-inp" id="iq-b" value="-1" type="number" step="any"></div>
        <span class="ineq-lbl-mid" style="font-size:16px">|</span>
        <button class="ineq-sym-btn on" id="iq-sym" data-action="ineqSymCycle" data-arg="iq-sym">&lt;</button>
        <div class="ineq-inp-grp"><label>c</label><input class="ineq-inp" id="iq-c" value="5" type="number" step="any"></div>
      </div>
      <button class="ineq-btn" data-action="ineqSolveAbs">Resolver</button>
      <div id="ineq-res"></div>
      <canvas id="ineq-numline" height="72"></canvas>`;
  }
}

function ineqShowResult(expr, sol, steps) {
  let out=`<div class="ineq-res">`;
  out+=`<div class="ineq-res-expr">${expr}</div>`;
  steps.forEach(s=>{ out+=`<div class="ineq-res-step">${s}</div>`; });
  if(sol) out+=`<div class="ineq-res-interval">Solución: <strong>${sol}</strong></div>`;
  out+=`</div>`;
  document.getElementById('ineq-res').innerHTML=out;
}

function ineqRenderSolution(result,system=false){
  ineqShowResult(result.expr,result.sol,result.steps);
  const points=result.marks.map((mark,i)=>({
    ...mark,
    colorToken:system?(i===0?'al':'fi'):'ineq-accent',
  }));
  drawNumberLine(document.getElementById('ineq-numline'),points);
}

// ── SOLVER LIBRE — reduce f(x) < g(x) a h(x)=f(x)-g(x) < 0 ──
function ineqSolveLibre(){
  const lhsStr = document.getElementById('iq-lhs').value.trim();
  const rhsStr = document.getElementById('iq-rhs').value.trim();
  const sym    = document.getElementById('iq-sym-libre').textContent;
  if(!lhsStr||!rhsStr){ ineqShowResult('','',['Ingresa ambos lados de la inecuación']); return; }
  ineqRenderSolution(solveFreeInequality(lhsStr,rhsStr,sym));
}

// ── CUADRÁTICA ──
function ineqSolveQuad() {
  const a=parseFloat(document.getElementById('iq-a').value)||1;
  const b=parseFloat(document.getElementById('iq-b').value)||0;
  const c=parseFloat(document.getElementById('iq-c').value)||0;
  const sym=document.getElementById('iq-sym').textContent;
  ineqRenderSolution(solveQuadraticInequality(a,b,c,sym));
}

// ── RACIONAL con tabla de signos ──
function ineqSolveRational(){
  const numStr=document.getElementById('iq-rat-num').value.trim();
  const denStr=document.getElementById('iq-rat-den').value.trim();
  const sym=document.getElementById('iq-rat-sym').textContent;
  if(!numStr||!denStr){ ineqShowResult('','',['Ingresa numerador y denominador']); return; }
  ineqRenderSolution(solveRationalInequality(numStr,denStr,sym));
}

// ── SISTEMA ──
function ineqSolveSystem() {
  const a1=parseFloat(document.getElementById('iq-a1').value)||1;
  const b1=parseFloat(document.getElementById('iq-b1').value)||0;
  const c1=parseFloat(document.getElementById('iq-c1').value)||0;
  const s1=document.getElementById('iq-s1').textContent;
  const a2=parseFloat(document.getElementById('iq-a2').value)||1;
  const b2=parseFloat(document.getElementById('iq-b2').value)||0;
  const c2=parseFloat(document.getElementById('iq-c2').value)||0;
  const s2=document.getElementById('iq-s2').textContent;
  ineqRenderSolution(solveSystemInequality(
    {a:a1,b:b1,c:c1,sym:s1}, {a:a2,b:b2,c:c2,sym:s2},
  ),true);
}

// ── VALOR ABSOLUTO ──
function ineqSolveAbs() {
  const a=parseFloat(document.getElementById('iq-a').value)||1;
  const b=parseFloat(document.getElementById('iq-b').value)||0;
  const c=parseFloat(document.getElementById('iq-c').value)||0;
  const sym=document.getElementById('iq-sym').textContent;
  ineqRenderSolution(solveAbsoluteInequality(a,b,c,sym));
}

export {
  ineqSetType, ineqBack, ineqSymCycle, ineqSolveLibre,
  ineqSolveQuad, ineqSolveRational, ineqSolveSystem, ineqSolveAbs,
};
