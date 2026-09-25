import { analyzeFunction } from '../../math/algebra/functions.mjs';
import { drawFunctionGraph } from '../../graphics/analysis.mjs';

// ═══════════════════════════════════════════════════════
// FUNCIONES — DOMINIO, RANGO Y GRÁFICA
// ═══════════════════════════════════════════════════════
let fnType=null;

function fnSetType(type){
  fnType=type;
  document.getElementById('fn-pick-screen').style.display='none';
  const solver=document.getElementById('fn-solver');
  solver.style.display='';
  const titles={
    lineal:'f(x) = ax + b',cuad:'f(x) = ax² + bx + c',
    raiz:'f(x) = √(ax + b)',abs:'f(x) = a|x + b| + c',
    log:'f(x) = a·log_b(cx + d)',exp:'f(x) = a·b^(cx + d)',
    parteEntera:'f(x) = a·⌊bx + c⌋',racional:'f(x) = P(x) / Q(x)',
  };
  document.getElementById('fn-solver-title').textContent=titles[type]||type;
  const templates={
    lineal:`<div class="calc-field-row"><label>a</label><input class="calc-inp calc-inp-sm" id="fn-a" value="1"/><label>b</label><input class="calc-inp calc-inp-sm" id="fn-b" value="0"/></div>`,
    cuad:`<div class="calc-field-row"><label>a</label><input class="calc-inp calc-inp-sm" id="fn-a" value="1"/><label>b</label><input class="calc-inp calc-inp-sm" id="fn-b" value="0"/><label>c</label><input class="calc-inp calc-inp-sm" id="fn-c" value="0"/></div>`,
    raiz:`<div class="calc-field-row"><label>a</label><input class="calc-inp calc-inp-sm" id="fn-a" value="1"/><label>b</label><input class="calc-inp calc-inp-sm" id="fn-b" value="0"/></div><div style="font-size:9px;color:var(--text3);margin:4px 0">f(x) = √(a·x + b)</div>`,
    abs:`<div class="calc-field-row"><label>a</label><input class="calc-inp calc-inp-sm" id="fn-a" value="1"/><label>b</label><input class="calc-inp calc-inp-sm" id="fn-b" value="0"/><label>c</label><input class="calc-inp calc-inp-sm" id="fn-c" value="0"/></div>`,
    log:`<div class="calc-field-row"><label>a</label><input class="calc-inp calc-inp-sm" id="fn-a" value="1"/><label>base b</label><input class="calc-inp calc-inp-sm" id="fn-b" value="10"/><label>c</label><input class="calc-inp calc-inp-sm" id="fn-c" value="1"/><label>d</label><input class="calc-inp calc-inp-sm" id="fn-d" value="0"/></div><div style="font-size:9px;color:var(--text3);margin:4px 0">f(x) = a·log_b(c·x + d)</div>`,
    exp:`<div class="calc-field-row"><label>a</label><input class="calc-inp calc-inp-sm" id="fn-a" value="1"/><label>b</label><input class="calc-inp calc-inp-sm" id="fn-b" value="2"/><label>c</label><input class="calc-inp calc-inp-sm" id="fn-c" value="1"/><label>d</label><input class="calc-inp calc-inp-sm" id="fn-d" value="0"/></div><div style="font-size:9px;color:var(--text3);margin:4px 0">f(x) = a·b^(c·x + d)</div>`,
    parteEntera:`<div class="calc-field-row"><label>a</label><input class="calc-inp calc-inp-sm" id="fn-a" value="1"/><label>b</label><input class="calc-inp calc-inp-sm" id="fn-b" value="1"/><label>c</label><input class="calc-inp calc-inp-sm" id="fn-c" value="0"/></div><div style="font-size:9px;color:var(--text3);margin:4px 0">f(x) = a·⌊b·x + c⌋</div>`,
    racional:`<div class="calc-field-row"><label>P(x)</label><input class="calc-inp" id="fn-num" placeholder="ej: x^2-1"/></div><div class="calc-field-row"><label>Q(x)</label><input class="calc-inp" id="fn-den" placeholder="ej: x-2"/></div>`,
  };
  document.getElementById('fn-form').innerHTML=templates[type]||'';
}
function fnBack(){
  fnType=null;
  document.getElementById('fn-pick-screen').style.display='';
  document.getElementById('fn-solver').style.display='none';
}
function fnV(id){ return parseFloat(document.getElementById(id)?.value)||0; }

function fnAnalyze(){
  const res=document.getElementById('fn-result');
  const a=fnV('fn-a'),b=fnV('fn-b'),c=fnV('fn-c'),d=fnV('fn-d');
  const numStr=(document.getElementById('fn-num')||{value:''}).value.trim();
  const denStr=(document.getElementById('fn-den')||{value:''}).value.trim();
  const {domain,range,formula,steps,pts}=analyzeFunction(fnType,{a,b,c,d,numStr,denStr});

  fnDrawGraph(pts,formula);
  let html=`<div class="fn-result-wrap">`;
  html+=`<div class="fn-formula">${formula}</div>`;
  html+=`<div class="fn-prop-row"><span class="fn-prop-label">Dominio</span><span class="fn-prop-val">${domain}</span></div>`;
  html+=`<div class="fn-prop-row"><span class="fn-prop-label">Rango</span><span class="fn-prop-val">${range}</span></div>`;
  if(steps.length) html+=`<div class="fn-steps-list">${steps.map(s=>`<div class="fn-step">${s}</div>`).join('')}</div>`;
  html+=`<canvas id="fn-graph-canvas" width="320" height="160" style="width:100%;border-radius:8px;background:var(--chrome);margin-top:8px;display:block"></canvas>`;
  html+=`</div>`;
  res.innerHTML=html;
  setTimeout(()=>fnDrawGraph(pts,formula),50);
}

function fnDrawGraph(pts,label){
  const canvas=document.getElementById('fn-graph-canvas');
  drawFunctionGraph(canvas,pts);
}

export { fnSetType, fnBack, fnAnalyze };
