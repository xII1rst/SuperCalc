import * as matrixMath from '../../math/algebra/matrix.mjs';
import { formatResult, matFmtNum } from '../../utils/format.mjs';

// ═══════════════════════════════════════════════════════
// MATRICES MODULE
// ═══════════════════════════════════════════════════════
let matCurrentTab = 'ops';

function matTab(id) {
  document.querySelectorAll('.mat-tab').forEach((t,i) => {
    t.classList.toggle('on', ['ops','det','sis','eig','space'][i] === id);
  });
  ['Ops','Det','Sis','Eig','Space'].forEach(p => {
    const el = document.getElementById('mat-p'+p);
    if(el) el.classList.toggle('on', p.toLowerCase() === id);
  });
  matCurrentTab = id;
}

function matInit() {
  matOpsRenderControls();
  matOpsRenderGrids();
  matBuildDet();
  matBuildSis();
  matBuildEig();
  matBuildSpace();
}

// ── Helpers ──
function matGetGrid(prefix, rows, cols) {
  const vals = [];
  for(let r=0;r<rows;r++){
    const row=[];
    for(let c=0;c<cols;c++){
      const el=document.getElementById(`${prefix}-${r}-${c}`);
      row.push(el ? parseFloat(el.value)||0 : 0);
    }
    vals.push(row);
  }
  return vals;
}
function matMakeGrid(prefix, rows, cols, extraClass='') {
  let html=`<div class="mat-grid-wrap"><div class="mat-grid" style="grid-template-columns:repeat(${cols},58px)">`;
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    html+=`<input class="mat-cell ${extraClass}" id="${prefix}-${r}-${c}" value="0" type="number" step="any">`;
  }
  return html+'</div></div>';
}
function matFmtMatrix(M,label='') {
  const rows=M.length,cols=M[0].length;
  let h=label?`<div class="mat-res-lbl">${label}</div>`:'' ;
  h+=`<div class="mat-res-val">`;
  for(let r=0;r<rows;r++){
    h+='[ '+M[r].map(v=>matFmtNum(v).padStart(9)).join('  ')+' ]<br>';
  }
  return h+'</div>';
}

// ── Fracción exacta helpers ──
let sisFracMode=false;
function matSisToggleFrac(){
  sisFracMode=!sisFracMode;
  const tog=document.getElementById('sis-frac-tog');
  const lbl=document.getElementById('sis-frac-lbl');
  if(tog) tog.classList.toggle('on',sisFracMode);
  if(lbl) lbl.textContent=sisFracMode?'FRAC':'DEC';
}
function fStr([n,d],useFrac){
  if(d===0)return'∞';
  const v=n/d;
  if(!useFrac) return formatResult(v,4);
  if(d===1)return`${n}`;
  return`${n}/${d}`;
}
// ── Ops panel — N matrices of arbitrary m×n ──────────
// State: array of matrix definitions {rows, cols, id}
let matOpsState = { op:'add', matrices:[{id:0,rows:2,cols:2},{id:1,rows:2,cols:2}], nextId:2, scalar:1 };

function matOpsRebuild() {
  matOpsState.op = document.getElementById('mat-op').value;
  matOpsRenderControls();
  matOpsRenderGrids();
  document.getElementById('mat-res-ops').innerHTML = '';
}

function matOpsReset() {
  matOpsState = { op: document.getElementById('mat-op').value, matrices:[{id:0,rows:2,cols:2},{id:1,rows:2,cols:2}], nextId:2, scalar:1 };
  matOpsRenderControls();
  matOpsRenderGrids();
  document.getElementById('mat-res-ops').innerHTML = '';
}

function matOpsRenderControls() {
  const op = matOpsState.op;
  const isSca = op === 'sca';
  const isTra = op === 'tra';
  const isSingle = isSca || isTra;
  // Ensure correct number of matrices
  if (isSingle && matOpsState.matrices.length > 1) matOpsState.matrices = [matOpsState.matrices[0]];
  if (!isSingle && matOpsState.matrices.length < 2) matOpsState.matrices.push({id:matOpsState.nextId++,rows:matOpsState.matrices[0].rows,cols:matOpsState.matrices[0].cols});

  let h = '<div class="mat-row" style="flex-wrap:wrap;gap:6px;margin-bottom:8px">';
  if (isSca) {
    h += `<label>Escalar k:</label><input class="mat-inp wide" id="mat-sca-k" value="${matOpsState.scalar}" type="number" step="any" data-action="matOpsSetScalar" data-event="input">`;
  }
  if (!isSingle) {
    h += `<button class="mat-btn" style="padding:5px 10px;font-size:10px" data-action="matOpsAddMatrix">+ Matriz</button>`;
    if (matOpsState.matrices.length > 2) {
      h += `<button class="mat-btn danger" style="padding:5px 10px;font-size:10px" data-action="matOpsRemoveMatrix">− Última</button>`;
    }
  }
  h += '</div>';
  document.getElementById('mat-ops-controls').innerHTML = h;
}

function matOpsAddMatrix() {
  const last = matOpsState.matrices[matOpsState.matrices.length-1];
  matOpsState.matrices.push({id:matOpsState.nextId++, rows:last.rows, cols:last.cols});
  matOpsRenderGrids();
}

function matOpsRemoveMatrix() {
  if (matOpsState.matrices.length <= 2) return;
  matOpsState.matrices.pop();
  matOpsRenderGrids();
}

function matOpsSizeChange(id, dim, val) {
  const m = matOpsState.matrices.find(m=>m.id===id);
  if (!m) return;
  m[dim] = Math.min(8, Math.max(1, parseInt(val)||1));
  matOpsRenderGrids();
}

function matOpsRenderGrids() {
  const op = matOpsState.op;
  const letters = 'ABCDEFGHIJ';
  let h = '';
  matOpsState.matrices.forEach((m, i) => {
    const lbl = letters[i] || `M${i}`;
    const prefix = `mo-${m.id}`;
    h += `<div style="margin-bottom:12px">
      <div class="mat-sec" style="margin-top:0">${lbl} —
        <input class="mat-inp" style="width:36px;display:inline;padding:2px 4px" value="${m.rows}" min="1" max="8" type="number" data-action="matOpsSizeChange" data-event="change" data-id="${m.id}" data-dimension="rows">
        ×
        <input class="mat-inp" style="width:36px;display:inline;padding:2px 4px" value="${m.cols}" min="1" max="8" type="number" data-action="matOpsSizeChange" data-event="change" data-id="${m.id}" data-dimension="cols">
      </div>`;
    h += matMakeGrid(prefix, m.rows, m.cols);
    h += '</div>';
  });
  document.getElementById('mat-ops-grids').innerHTML = h;
}

function matOpsGetMatrix(m) {
  return matGetGrid(`mo-${m.id}`, m.rows, m.cols);
}

function matCalcOps() {
  const op = matOpsState.op;
  const ms = matOpsState.matrices;
  const letters = 'ABCDEFGHIJ';
  let result, title, err = '';

  if (op === 'sca') {
    const A = matOpsGetMatrix(ms[0]);
    const k = matOpsState.scalar;
    result = matrixMath.matScale(A, k);
    title = `${k} × A`;
  } else if (op === 'tra') {
    const A = matOpsGetMatrix(ms[0]);
    result = matrixMath.matTranspose(A);
    title = 'Aᵀ';
  } else if (op === 'add' || op === 'sub') {
    // Check all same dimensions
    const r0 = ms[0].rows, c0 = ms[0].cols;
    const bad = ms.find(m => m.rows !== r0 || m.cols !== c0);
    if (bad) { err = `Todas las matrices deben ser ${r0}×${c0} para suma/resta.`; }
    else {
      result = matOpsGetMatrix(ms[0]);
      for (let i = 1; i < ms.length; i++) {
        const B = matOpsGetMatrix(ms[i]);
        result = matrixMath.matAdd(result, B, op === 'sub' ? -1 : 1);
      }
      title = ms.map((_,i)=>letters[i]).join(op==='add'?' + ':' − ');
    }
  } else if (op === 'mul') {
    // Chain multiplication — check dimensional compatibility
    result = matOpsGetMatrix(ms[0]);
    for (let i = 1; i < ms.length; i++) {
      const B = matOpsGetMatrix(ms[i]);
      if (result[0].length !== B.length) {
        err = `Columnas de ${letters[i-1]} (${result[0].length}) ≠ filas de ${letters[i]} (${B.length}). Dimensiones incompatibles.`;
        result = null; break;
      }
      result = matrixMath.matMul(result, B);
    }
    if (result) title = ms.map((_,i)=>letters[i]).join(' × ');
  }

  if (err || !result) {
    document.getElementById('mat-res-ops').innerHTML = `<div class="mat-res"><div class="mat-err">${err||'Error en el cálculo.'}</div></div>`;
    return;
  }
  document.getElementById('mat-res-ops').innerHTML = `<div class="mat-res">${matFmtMatrix(result, title)}</div>`;
}

function matBuildGrids() { matOpsRenderControls(); matOpsRenderGrids(); } // compat alias
function matClearOps() { matOpsReset(); }

// ── Det & Inv panel ──
function matBuildDet() {
  const n=parseInt(document.getElementById('mat-dn')?.value)||2;
  document.getElementById('mat-det-grid').innerHTML=matMakeGrid('md',n,n);
  document.getElementById('mat-res-det').innerHTML='';
}
function matCalcDet() {
  const n=parseInt(document.getElementById('mat-dn').value)||2;
  const M=matGetGrid('md',n,n);
  const d=matrixMath.matDet(M);
  document.getElementById('mat-res-det').innerHTML=`<div class="mat-res">
    <div class="mat-res-lbl">Determinante</div>
    <div class="mat-res-val" style="font-size:20px">${formatResult(d,6)}</div>
    <div class="${Math.abs(d)<1e-10?'mat-err':'mat-ok'}">${Math.abs(d)<1e-10?'Matriz singular (det ≈ 0)':'Matriz invertible'}</div>
  </div>`;
}
function matCalcInv() {
  const n=parseInt(document.getElementById('mat-dn').value)||2;
  const M=matGetGrid('md',n,n);
  const inv=matrixMath.matInv(M);
  if(!inv){
    document.getElementById('mat-res-det').innerHTML=`<div class="mat-res"><div class="mat-err">Matriz singular — no tiene inversa.</div></div>`;
    return;
  }
  document.getElementById('mat-res-det').innerHTML=`<div class="mat-res">${matFmtMatrix(inv,'A⁻¹')}<div class="mat-ok">Verificar: A · A⁻¹ = I</div></div>`;
}
function matClearDet() { document.querySelectorAll('#mat-det-grid .mat-cell').forEach(el=>el.value=0); document.getElementById('mat-res-det').innerHTML=''; }

// ── Sistemas panel ──
function matBuildSis() {
  const m=Math.min(6,Math.max(1,parseInt(document.getElementById('mat-sm')?.value)||2));
  const n=Math.min(6,Math.max(1,parseInt(document.getElementById('mat-sn')?.value)||2));
  document.getElementById('mat-sm').value=m;
  document.getElementById('mat-sn').value=n;
  let html=`<div class="mat-grid-wrap"><div class="mat-grid" style="grid-template-columns:repeat(${n+1},58px)">`;
  for(let r=0;r<m;r++){
    for(let c=0;c<n;c++) html+=`<input class="mat-cell" id="ms-${r}-${c}" value="0" type="number" step="any">`;
    html+=`<input class="mat-cell rhs" id="ms-${r}-${n}" value="0" type="number" step="any">`;
  }
  html+='</div></div>';
  html+=`<div style="font-size:9px;font-family:'Space Mono',monospace;color:var(--text-muted);margin-bottom:8px">La última columna (dorada) es el vector b</div>`;
  document.getElementById('mat-sis-grid').innerHTML=html;
  document.getElementById('mat-res-sis').innerHTML='';
}
function matCalcSis() {
  const m=parseInt(document.getElementById('mat-sm').value)||2;
  const n=parseInt(document.getElementById('mat-sn').value)||2;
  const A=[],b=[];
  for(let r=0;r<m;r++){
    A.push(Array.from({length:n},(_,c)=>parseFloat(document.getElementById(`ms-${r}-${c}`)?.value||0)));
    b.push(parseFloat(document.getElementById(`ms-${r}-${n}`)?.value||0));
  }
  const met=document.getElementById('mat-smet').value;
  let html='<div class="mat-res">';
  if(met==='gauss'){
    const {sol,steps,status,rankA,rankAug,particular,nullspace,free,rref}=matrixMath.matGauss(A,b);
    html+=`<div class="mat-res-lbl">Gauss-Jordan — pasos:</div>`;
    steps.forEach(s=>{
      html+=`<div class="mat-step">${s}</div>`;
    });
    html+=matFmtMatrix(rref,'Forma escalonada reducida [A | b]');
    html+=`<div class="mat-res-lbl">rango(A) = ${rankA}; rango([A|b]) = ${rankAug}</div>`;
    const display=value=>sisFracMode?fStr(matrixMath.toFrac2(value),true):formatResult(value,4);
    if(status==='inconsistent'){
      html+=`<div class="mat-err">Sin solución: rango(A) &lt; rango([A|b]).</div>`;
    } else if(status==='infinite'){
      html+=`<div class="mat-res-lbl" style="margin-top:8px">Infinitas soluciones (${free.length} variable${free.length===1?'':'s'} libre${free.length===1?'':'s'}):</div>`;
      html+=`<div class="mat-res-val">x = [${particular.map(display).join(', ')}]`;
      nullspace.forEach((vector,i)=>{
        html+=` + t${i+1}[${vector.map(display).join(', ')}]`;
      });
      html+='</div>';
      html+=`<div class="mat-res-lbl">${free.map((col,i)=>`t${i+1} = x${col+1}`).join('; ')}</div>`;
    } else {
      html+=`<div class="mat-res-lbl" style="margin-top:8px">Solución:</div><div class="mat-res-val">`;
      sol.forEach((v,i)=>{ html+=`x<sub>${i+1}</sub> = ${fStr(v,sisFracMode)}<br>`; });
      html+='</div>';
    }
  } else {
    const sol=m===n?matrixMath.matCramer(A,b):null;
    if(!sol){ html+=`<div class="mat-err">Cramer requiere una matriz cuadrada con det(A) ≠ 0.</div>`; }
    else {
      html+=`<div class="mat-res-lbl">Cramer — det(A) = ${matFmtNum(matrixMath.matDet(A))}</div>`;
      html+=`<div class="mat-res-val">`;
      sol.forEach((v,i)=>{ html+=`x<sub>${i+1}</sub> = ${sisFracMode?fStr(matrixMath.toFrac2(v),true):formatResult(v,4)}<br>`; });
      html+='</div>';
    }
  }
  html+='</div>';
  document.getElementById('mat-res-sis').innerHTML=html;
}
function matClearSis() { document.querySelectorAll('#mat-sis-grid .mat-cell').forEach(el=>el.value=0); document.getElementById('mat-res-sis').innerHTML=''; }

// ── Eigenvalores panel ──
function matBuildEig() {
  const n=parseInt(document.getElementById('mat-en')?.value)||2;
  document.getElementById('mat-eig-grid').innerHTML=matMakeGrid('me',n,n);
  document.getElementById('mat-res-eig').innerHTML='';
}
function matCalcEig() {
  const n=parseInt(document.getElementById('mat-en').value)||2;
  const M=matGetGrid('me',n,n);
  const pairs=matrixMath.matEigenAll(M);
  let html='<div class="mat-res"><div class="mat-res-lbl">Valores y vectores propios reales</div>';
  pairs.forEach(({lam,vec,residual,iterations,converged,method},i)=>{
    html+=`<div class="mat-eigen-pair">
      <div class="mat-eigen-lbl">&lambda;<sub>${i+1}</sub></div>
      <div class="mat-eigen-val">${matFmtNum(lam,5)} ${converged?'':'(sin convergencia)'}</div>
      <div class="mat-eigen-vec">v = [ ${vec.map(v=>matFmtNum(v,4)).join(',  ')} ]</div>
      <div class="mat-eigen-vec">||Av − λv|| = ${formatResult(residual,7)}; ${method||'iteración potencia'}; ${iterations} iteraciones</div>
    </div>`;
  });
  if(pairs.message) html+=`<div class="mat-err">${pairs.message}</div>`;
  html+='</div>';
  document.getElementById('mat-res-eig').innerHTML=html;
}
function matClearEig() { document.querySelectorAll('#mat-eig-grid .mat-cell').forEach(el=>el.value=0); document.getElementById('mat-res-eig').innerHTML=''; }

function matBuildSpace() {
  const rows=Math.min(6,Math.max(1,parseInt(document.getElementById('mat-space-m').value)||2));
  const cols=Math.min(6,Math.max(1,parseInt(document.getElementById('mat-space-n').value)||3));
  document.getElementById('mat-space-m').value=rows;
  document.getElementById('mat-space-n').value=cols;
  document.getElementById('mat-space-grid').innerHTML=matMakeGrid('sp',rows,cols);
  document.getElementById('mat-res-space').innerHTML='';
}

function matCalcSpace() {
  const target=document.getElementById('mat-res-space');
  try {
    const rows=Number(document.getElementById('mat-space-m').value);
    const cols=Number(document.getElementById('mat-space-n').value);
    const A=Array.from({length:rows},(_,r)=>Array.from({length:cols},(_,c)=>{
      const raw=document.getElementById(`sp-${r}-${c}`)?.value.trim();
      if(!raw || !Number.isFinite(Number(raw))) throw new RangeError(`Entrada inválida en fila ${r+1}, columna ${c+1}`);
      return Number(raw);
    }));
    const result=matrixMath.matSpace(A);
    const vector=v=>`[${v.map(value=>formatResult(value,4)).join(', ')}]`;
    let html='<div class="mat-res">';
    html+=`<div class="mat-res-lbl">Transformación A: ℝ<sup>${cols}</sup> → ℝ<sup>${rows}</sup></div>`;
    html+=`<div class="mat-res-lbl">Gauss-Jordan — pasos:</div>`;
    result.steps.forEach(step=>{html+=`<div class="mat-step">${step}</div>`;});
    html+=matFmtMatrix(result.rref,'RREF de A');
    html+=`<div class="mat-step">rango(A) = ${result.rank}; nulidad(A) = ${result.nullity}; ${result.rank} + ${result.nullity} = ${cols} columnas.</div>`;
    html+=`<div class="mat-res-lbl">Columnas pivote originales: ${result.pivots.length?result.pivots.map(i=>i+1).join(', '):'ninguna'}</div>`;
    html+=`<div class="mat-res-val">Base de la imagen: ${result.columnBasis.length?result.columnBasis.map(vector).join(', '):'{0}'}</div>`;
    html+=`<div class="mat-res-val">Base del núcleo: ${result.kernelBasis.length?result.kernelBasis.map(vector).join(', '):'{0}'}</div>`;
    html+=`<div class="mat-res-val">Base del espacio fila: ${result.rowBasis.length?result.rowBasis.map(vector).join(', '):'{0}'}</div>`;
    html+='<div class="mat-res-lbl">Una base de {0} es el conjunto vacío. Las bases de la imagen se toman de A original.</div></div>';
    target.innerHTML=html;
  } catch(error) {
    target.innerHTML=`<div class="mat-res"><div class="mat-err">${error.message}</div></div>`;
  }
}

function matOpsSetScalar(value) {
  matOpsState.scalar = parseFloat(value) || 1;
}

export {
  matInit, matTab, matOpsRebuild, matOpsReset, matOpsAddMatrix,
  matOpsRemoveMatrix, matOpsSizeChange, matOpsSetScalar, matCalcOps,
  matBuildDet, matCalcDet, matCalcInv, matClearDet,
  matBuildSis, matCalcSis, matClearSis, matBuildEig, matCalcEig,
  matClearEig, matBuildSpace, matCalcSpace, matSisToggleFrac, matBuildGrids, matClearOps,
};
