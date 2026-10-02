import { collectVariables } from '../../math/expression.mjs';
import { escapeHtml, expression, fN, fail, number, read, rows, show, table, tuple, vector } from './inputs.mjs';
import { finitePrecisionElimination, luSolve, newtonSystem2D } from '../../math/numerical-advanced.mjs';
import { iterativeLinearSystem } from '../../math/numerical-analysis.mjs';
import { newtonSystem, systemStability } from '../../math/numerical-systems.mjs';

export function numCalcLinear() {
  try {
    const A=rows('num-linear-a'), b=vector('num-linear-b');
    if(read('num-linear-method')==='finite-gauss') {
      const options={digits:number('num-finite-digits'),mode:read('num-finite-mode')};
      const plain=finitePrecisionElimination(A,b,{...options,pivoting:false});
      const pivoted=finitePrecisionElimination(A,b,{...options,pivoting:true});
      const reference=luSolve(A,b).solution;
      const summary=result=>[result.pivoting?'Con pivoteo':'Sin pivoteo',result.status==='completed'?tuple(result.solution):`Pivote cero en columna ${result.column+1}`,
        result.status==='completed'?fN(result.residualInfinity):'—',
        result.status==='completed'?fN(Math.max(...result.solution.map((item,i)=>Math.abs(item-reference[i])))):'—'];
      const steps=[...plain.history.map(step=>['Sin pivoteo',step]),...pivoted.history.map(step=>['Con pivoteo',step])];
      show('Gauss con precisión finita',`<p>Referencia en doble precisión ≈ ${tuple(reference)}. Cada operando, producto, resta y cociente se ${options.mode==='chop'?'corta':'redondea'} a ${options.digits} cifras significativas.</p>`+
        table(['Estrategia','Solución','||Ax−b||∞ original','Error máx. vs referencia'],[summary(plain),summary(pivoted)])+
        table(['Estrategia','Paso','Multiplicador','Matriz aumentada tras el paso'],steps.map(([label,step])=>[
          label,step.type==='swap'?`Intercambiar filas ${step.rows[0]+1} y ${step.rows[1]+1}`:`Eliminar fila ${step.row+1} con pivote ${step.column+1}`,
          step.type==='swap'?'—':fN(step.multiplier),step.matrix.map((row,i)=>`[${row.map(fN).join(', ')} | ${fN(step.rhs[i])}]`).join('<br>'),
        ])));
      return;
    }
    if(read('num-linear-method')==='lu') {
      const result=luSolve(A,b);
      show('LU con pivoteo parcial',`<p>PA=LU. det(A) = ${fN(result.determinant)}. Permutación de filas (base 0): ${tuple(result.permutation)}. x = ${tuple(result.solution)}; ||Ax−b||∞ = ${fN(result.residualInfinity)}.</p>
        <p>y de Ly=Pb: ${tuple(result.y)}.</p><p>L:</p>${table(A[0].map((_,i)=>`col ${i+1}`),result.lower.map(tupleRow=>tupleRow.map(fN)))}
        <p>U:</p>${table(A[0].map((_,i)=>`col ${i+1}`),result.upper.map(tupleRow=>tupleRow.map(fN)))}`);
      return;
    }
    const x0=vector('num-linear-x0');
    const fixed=read('num-linear-stop')==='steps';
    const options={method:read('num-linear-method'),stopCriterion:read('num-linear-criterion')||'both',...(fixed?{iterations:number('num-linear-n')}:{tolerance:number('num-linear-tol'),maxIterations:200})};
    if (fixed && options.iterations>200) throw new RangeError('Máximo 200 pasos');
    const result=iterativeLinearSystem(A,b,x0,options);
    show('Sistema iterativo',`<p>Estado: ${result.status}; x = ${tuple(result.solution)}. El residuo es ||Ax−b||∞. Criterio: ${result.stopCriterion==='change'?'solo cambio':'cambio y residuo'}.</p><p>Márgenes de dominancia diagonal: ${tuple(result.dominance)}. ${result.strictlyDominant?'Todos positivos: dominancia estricta, garantiza convergencia de Jacobi y Gauss–Seidel.':'Sin dominancia estricta: esta prueba no garantiza ni descarta convergencia.'}</p>`+
      table(['i','x','Cambio máximo','Residuo'],result.history.map(row=>[row.iteration,tuple(row.vector),fN(row.difference),fN(row.residual)])));
  } catch(error) { fail(error); }
}

export function numCalcSystem2D() {
  try {
    const firstSource=read('num-system-f'),secondSource=read('num-system-g');
    if([...collectVariables(firstSource),...collectVariables(secondSource)].some(name=>!['x','y'].includes(name)))
      throw new RangeError('Usa solo las variables x e y');
    const {parsed:first,normalized:firstText}=expression('num-system-f');
    const {parsed:second,normalized:secondText}=expression('num-system-g');
    const result=newtonSystem2D(first,second,number('num-system-x0'),number('num-system-y0'),{
      iterations:number('num-system-n'),tolerance:number('num-system-tol'),
    });
    const status={converged:'Convergió',max_iterations:'Límite de iteraciones',singular_jacobian:'Jacobiano singular',domain_error:'Fuera de dominio',diverged:'Divergió'}[result.status]||result.status;
    show('Newton para sistemas 2×2',`<p>F(x,y) = ${escapeHtml(firstText)}; G(x,y) = ${escapeHtml(secondText)}.</p>
      <p>${status}. Aproximación (x,y) = (${fN(result.x)}, ${fN(result.y)}); residuo ||(F,G)||₂ = ${fN(result.residual)}. El jacobiano usa diferencias centradas.</p>`+
      table(['i','xᵢ','yᵢ','F','G','det J','xᵢ₊₁','yᵢ₊₁','Residuo'],result.history.map(row=>[
        row.iteration,fN(row.x),fN(row.y),fN(row.f),fN(row.g),
        fN(row.jacobian[0][0]*row.jacobian[1][1]-row.jacobian[0][1]*row.jacobian[1][0]),
        fN(row.nextX),fN(row.nextY),fN(row.residual),
      ])));
  } catch(error) { fail(error); }
}

export function numCalcSystem(){
 try{
  const variables=read('num-system-vars').split(',').map(v=>v.trim()),expressions=read('num-system-expressions').split(/\n|;/).map(v=>v.trim()).filter(Boolean);
  const result=newtonSystem(expressions,variables,vector('num-system-initial'),{iterations:number('num-system-iterations'),tolerance:number('num-system-tolerance')});
  const status={converged:'Convergió',max_iterations:'Límite de iteraciones',singular_jacobian:'Jacobiano singular o mal condicionado',domain_error:'Fuera del dominio',diverged:'Divergió'}[result.status];
  show('Newton para sistemas',`<p>${status}. Variables ${escapeHtml(variables.join(','))}: ${tuple(result.solution)}; residuo ∞=${fN(result.residual)}; tolerancia=${fN(number('num-system-tolerance'))}.</p><p>El residuo verifica las ecuaciones originales. No garantiza encontrar todas las raíces.</p>`+table(variables.map(v=>'∂/∂'+escapeHtml(v)),result.jacobianFormulas.map(row=>row.map(escapeHtml)))+table(['i','Punto','F','Δ','Punto siguiente','||Δ||∞'],result.history.map(r=>[r.iteration,tuple(r.point),tuple(r.values),tuple(r.step),tuple(r.next),fN(r.stepNorm)])));
 }catch(error){fail(error);}
}
export function numCalcSystemStability(){
 try{
  const r=systemStability(rows('num-stability-matrix'),number('num-stability-step'),read('num-stability-method')),status={stable:'Estable asintóticamente',unstable:'Inestable',boundary:'En la frontera; sin estabilidad asintótica',inconclusive:'Inconcluso: certificado no obtenido'}[r.status];
  show('Estabilidad del sistema constante',`<p>${status}. ${escapeHtml(r.criterion)}</p><p>${escapeHtml(r.assumption)}</p><p>${r.spectralRadius===null?'':`Radio espectral = ${fN(r.spectralRadius)}.`} ${r.certificatePower===null?'':`||R^${r.certificatePower}||∞ &lt; 1; ρ(R) ≤ ${fN(r.bound)}.`}</p><p>Matriz de amplificación R:</p>`+table(r.amplification[0].map((_,i)=>String(i+1)),r.amplification.map(row=>row.map(fN)))+table(['k','||R^k||∞'],r.history.map(row=>[row.power,fN(row.norm)])));
 }catch(error){fail(error);}
}

export const panels={
  system: {title:'Newton para 2–6 incógnitas',description:'Jacobiano simbólico y corrección JΔ=−F con pivoteo. Convergencia local desde una semilla; residuo y parada explícitos.',action:'numCalcSystem',controls:`
    <label for="num-system-vars">Variables en orden (x,y,z,u,v,w)</label><input id="num-system-vars" class="tool-input" value="x,y,z">
    <label for="num-system-expressions">Fᵢ=0, una expresión por línea (máx. 300 caracteres)</label><textarea id="num-system-expressions" class="tool-textarea" rows="4">x^2+y^2+z^2-3
x-y
y-z</textarea>
    <label for="num-system-initial">Semilla en ese orden</label><input id="num-system-initial" class="tool-input" value="1.2,0.9,0.8">
    <label for="num-system-iterations">Máximo de iteraciones (1–100)</label><input id="num-system-iterations" class="tool-input" type="number" min="1" max="100" value="30">
    <label for="num-system-tolerance">Tolerancia de residuo ∞</label><input id="num-system-tolerance" class="tool-input" type="number" step="any" value="1e-9">`},
  stability: {title:'Estabilidad de sistemas constantes',description:'X′=AX, orden 1–6. Matriz de amplificación y certificado suficiente por norma; fuera del certificado se declara inconcluso.',action:'numCalcSystemStability',controls:`
    <label for="num-stability-matrix">A, una fila por línea</label><textarea id="num-stability-matrix" class="tool-textarea" rows="4">-2,1
0,-1</textarea>
    <label for="num-stability-step">h&gt;0</label><input id="num-stability-step" class="tool-input" type="number" step="any" value="0.2">
    <label for="num-stability-method">Método</label><select id="num-stability-method" class="tool-input"><option value="euler">Euler</option><option value="rk2">RK2</option><option value="rk4">RK4</option><option value="ab2">AB2</option></select>`},
  linear: {title:'Jacobi y Gauss-Seidel', description:'Resuelve Ax=b desde una aproximación inicial y muestra cada iteración, diferencia y residuo.', action:'numCalcLinear', controls:`
    <label for="num-linear-a">Matriz A (una fila por línea)</label><textarea id="num-linear-a" class="tool-textarea" rows="3">4, -1\n-1, 4</textarea>
    <label for="num-linear-b">Vector b</label><input id="num-linear-b" class="tool-input" type="text" value="3, 6">
    <label for="num-linear-x0">Aproximación inicial</label><input id="num-linear-x0" class="tool-input" type="text" value="0, 0">
    <label for="num-linear-method">Método</label><select id="num-linear-method" class="tool-input"><option value="jacobi">Jacobi</option><option value="seidel">Gauss-Seidel</option><option value="lu">LU con pivoteo parcial</option><option value="finite-gauss">Gauss de precisión finita: comparar pivoteo</option></select>
    <label for="num-finite-digits">Cifras significativas para Gauss</label><input id="num-finite-digits" class="tool-input" type="number" min="2" max="15" value="4">
    <label for="num-finite-mode">Regla para Gauss</label><select id="num-finite-mode" class="tool-input"><option value="round">Redondeo</option><option value="chop">Corte</option></select>
    <label for="num-linear-stop">Detener tras</label><select id="num-linear-stop" class="tool-input"><option value="steps">N pasos</option><option value="tolerance">Tolerancia</option></select>
    <label for="num-linear-n">N pasos (máx. 200)</label><input id="num-linear-n" class="tool-input" type="number" min="1" max="200" value="2">
    <label for="num-linear-criterion">Criterio al usar tolerancia</label><select id="num-linear-criterion" class="tool-input"><option value="both">Cambio y residuo</option><option value="change">Solo cambio ||xᵢ₊₁−xᵢ||∞</option></select>
    <label for="num-linear-tol">Tolerancia</label><input id="num-linear-tol" class="tool-input" type="number" step="any" min="0" value="0.000001">`},
  system2d: {title:'Newton para sistemas 2×2', description:'Resuelve F(x,y)=0 y G(x,y)=0 desde una semilla; muestra el jacobiano numérico, las iteraciones y el residuo.', action:'numCalcSystem2D', controls:`
    <label for="num-system-f">F(x,y)</label><input id="num-system-f" class="tool-input" type="text" value="x^2+y^2-5">
    <label for="num-system-g">G(x,y)</label><input id="num-system-g" class="tool-input" type="text" value="x-y-1">
    <label for="num-system-x0">x₀</label><input id="num-system-x0" class="tool-input" type="number" step="any" value="2.1">
    <label for="num-system-y0">y₀</label><input id="num-system-y0" class="tool-input" type="number" step="any" value="0.9">
    <label for="num-system-n">Máximo de iteraciones (1–100)</label><input id="num-system-n" class="tool-input" type="number" min="1" max="100" value="10">
    <label for="num-system-tol">Tolerancia de residuo/paso</label><input id="num-system-tol" class="tool-input" type="number" step="any" min="0" value="0.000000001">`},
};
