import {
  numericError, significantArithmetic, bisection, newtonTrace, iterativeLinearSystem,
  newtonInterpolation, lagrangeInterpolation, leastSquaresPolynomial, finiteDifference, ivpTrace,
} from '../math/numerical-analysis.mjs';
import { calcParse, normalizeExpression } from '../math/expression.mjs';
import { luSolve, bairstow, exponentialFit, sinusoidalFit, linearTestStability } from '../math/numerical-advanced.mjs';
// Numerical tables keep enough significant digits to inspect each iteration.
const fN = value => Number.isFinite(value) ? (value===0?'0':String(Number(value.toPrecision(10)))) : 'indefinido';
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

const panels = {
  errors: {title:'Errores y cifras', description:'Compara una aproximación con una referencia y simula corte o redondeo a cifras significativas.', action:'numCalcErrors', controls:`
    <label for="num-exact">Valor de referencia</label><input id="num-exact" class="tool-input" type="text" value="3.141592653589793">
    <label for="num-approx">Aproximación</label><input id="num-approx" class="tool-input" type="text" value="3.142857142857143">
    <label for="num-digits">Cifras significativas</label><input id="num-digits" class="tool-input" type="number" min="1" max="15" value="5">`},
  roots: {title:'Raíces por iteración', description:'Bisección requiere cambio de signo. Newton usa la derivada indicada o una diferencia centrada marcada como aproximada.', action:'numCalcRoots', controls:`
    <label for="num-root-method">Método</label><select id="num-root-method" class="tool-input"><option value="bisection">Bisección</option><option value="newton">Newton</option><option value="bairstow">Bairstow polinómico</option></select>
    <label for="num-root-coefficients">Bairstow: coeficientes a₀, a₁, …, aₙ</label><input id="num-root-coefficients" class="tool-input" type="text" value="4, 0, -5, 0, 1">
    <label for="num-root-r">Semilla r</label><input id="num-root-r" class="tool-input" type="number" step="any" value="0">
    <label for="num-root-s">Semilla s</label><input id="num-root-s" class="tool-input" type="number" step="any" value="1">
    <label for="num-root-f">f(x)</label><input id="num-root-f" class="tool-input" type="text" value="x^3-x-2">
    <label for="num-root-df">f′(x) para Newton (opcional)</label><input id="num-root-df" class="tool-input" type="text" placeholder="3x^2-1">
    <label for="num-root-a">a o x₀</label><input id="num-root-a" class="tool-input" type="number" step="any" value="1">
    <label for="num-root-b">b para bisección</label><input id="num-root-b" class="tool-input" type="number" step="any" value="2">
    <label for="num-root-stop">Detener tras</label><select id="num-root-stop" class="tool-input"><option value="steps">N pasos</option><option value="tolerance">Tolerancia</option></select>
    <label for="num-root-n">N pasos (máx. 200)</label><input id="num-root-n" class="tool-input" type="number" min="1" max="200" value="3">
    <label for="num-root-tol">Tolerancia</label><input id="num-root-tol" class="tool-input" type="number" step="any" min="0" value="0.000001">`},
  linear: {title:'Jacobi y Gauss-Seidel', description:'Resuelve Ax=b desde una aproximación inicial y muestra cada iteración, diferencia y residuo.', action:'numCalcLinear', controls:`
    <label for="num-linear-a">Matriz A (una fila por línea)</label><textarea id="num-linear-a" class="tool-textarea" rows="3">4, -1\n-1, 4</textarea>
    <label for="num-linear-b">Vector b</label><input id="num-linear-b" class="tool-input" type="text" value="3, 6">
    <label for="num-linear-x0">Aproximación inicial</label><input id="num-linear-x0" class="tool-input" type="text" value="0, 0">
    <label for="num-linear-method">Método</label><select id="num-linear-method" class="tool-input"><option value="jacobi">Jacobi</option><option value="seidel">Gauss-Seidel</option><option value="lu">LU con pivoteo parcial</option></select>
    <label for="num-linear-stop">Detener tras</label><select id="num-linear-stop" class="tool-input"><option value="steps">N pasos</option><option value="tolerance">Tolerancia</option></select>
    <label for="num-linear-n">N pasos (máx. 200)</label><input id="num-linear-n" class="tool-input" type="number" min="1" max="200" value="2">
    <label for="num-linear-tol">Tolerancia</label><input id="num-linear-tol" class="tool-input" type="number" step="any" min="0" value="0.000001">`},
  interpolation: {title:'Interpolación y ajuste', description:'Introduce puntos distintos (x,y). Compara Lagrange, Newton y mínimos cuadrados polinómicos.', action:'numCalcInterpolation', controls:`
    <label for="num-points">Puntos, uno por línea</label><textarea id="num-points" class="tool-textarea" rows="4">0, 1\n1, 3\n2, 7</textarea>
    <label for="num-interp-method">Método</label><select id="num-interp-method" class="tool-input"><option value="newton">Newton dividido</option><option value="lagrange">Lagrange</option><option value="fit">Mínimos cuadrados</option><option value="exponential">Exponencial linealizado</option><option value="sinusoidal">Sinusoidal con ω fija</option></select>
    <label for="num-fit-omega">ω para ajuste sinusoidal (rad/unidad x)</label><input id="num-fit-omega" class="tool-input" type="number" step="any" value="1">
    <label for="num-interp-x">Evaluar en x</label><input id="num-interp-x" class="tool-input" type="number" step="any" value="1.5">
    <label for="num-fit-degree">Grado para ajuste</label><input id="num-fit-degree" class="tool-input" type="number" min="0" max="5" value="1">`},
  derivative: {title:'Derivación numérica', description:'Aproxima f′(x) con diferencias hacia adelante, atrás, centradas o de cinco puntos.', action:'numCalcDerivative', controls:`
    <label for="num-diff-f">f(x)</label><input id="num-diff-f" class="tool-input" type="text" value="ln(x)">
    <label for="num-diff-x">x</label><input id="num-diff-x" class="tool-input" type="number" step="any" value="2">
    <label for="num-diff-h">Paso h</label><input id="num-diff-h" class="tool-input" type="number" step="any" min="0" value="0.1">
    <label for="num-diff-method">Fórmula</label><select id="num-diff-method" class="tool-input"><option value="forward">Adelante</option><option value="backward">Atrás</option><option value="central">Centrada</option><option value="five">Cinco puntos</option></select>`},
  ode: {title:'PVI numérico', description:'Compara Euler, RK2, RK4 y Adams-Bashforth de dos pasos con arranque RK4 declarado.', action:'numCalcODE', controls:`
    <label for="num-ode-f">y′ = f(x,y)</label><input id="num-ode-f" class="tool-input" type="text" value="x+y">
    <label for="num-ode-x0">x₀</label><input id="num-ode-x0" class="tool-input" type="number" step="any" value="0">
    <label for="num-ode-y0">y₀</label><input id="num-ode-y0" class="tool-input" type="number" step="any" value="1">
    <label for="num-ode-h">Paso h</label><input id="num-ode-h" class="tool-input" type="number" step="any" value="0.1">
    <label for="num-ode-n">Pasos (máx. 500)</label><input id="num-ode-n" class="tool-input" type="number" min="1" max="500" value="2">
    <label for="num-ode-method">Método</label><select id="num-ode-method" class="tool-input"><option value="euler">Euler</option><option value="rk2">RK2 punto medio</option><option value="rk4">RK4</option><option value="ab2">Adams-Bashforth 2</option></select>
    <label for="num-ode-lambda">λ para prueba de estabilidad y′=λy (opcional)</label><input id="num-ode-lambda" class="tool-input" type="number" step="any" placeholder="−1">`},
};

function read(id) { return document.getElementById(id).value.trim(); }
function number(id) {
  const value=read(id);
  if (!value || !Number.isFinite(Number(value))) throw new RangeError(`${id}: introduce un número finito`);
  return Number(value);
}
function expression(id, variable='x') {
  const source=read(id);
  const parsed=calcParse(source,variable);
  if (!parsed) throw new RangeError(`${id}: expresión no reconocida`);
  return {parsed, normalized:normalizeExpression(source)};
}
function rows(id) {
  const raw=read(id);
  const lines=raw.split(/[;\n]+/).map(line=>line.trim()).filter(Boolean);
  if (!lines.length || lines.length>20) throw new RangeError(`${id}: introduce entre 1 y 20 filas`);
  const result=lines.map((line,index)=>{
    const parts=line.split(/[,\s]+/).filter(Boolean);
    if (!parts.length || parts.some(part=>!Number.isFinite(Number(part)))) throw new RangeError(`${id}: fila ${index+1} inválida`);
    return parts.map(Number);
  });
  if (result.some(row=>row.length!==result[0].length)) throw new RangeError(`${id}: filas de distinta longitud`);
  return result;
}
function vector(id) {
  const parsed=rows(id);
  if (parsed.length!==1) throw new RangeError(`${id}: usa una sola fila`);
  return parsed[0];
}
const tuple=values=>`[${values.map(value=>fN(value)).join(', ')}]`;
const table=(head,body)=>`<div class="num-table-wrap"><table class="num-table"><thead><tr>${head.map(cell=>`<th>${cell}</th>`).join('')}</tr></thead><tbody>${body.map(row=>`<tr>${row.map(cell=>`<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
function show(title,body) {
  const target=document.getElementById('num-result');
  target.classList.remove('tool-error');
  target.innerHTML=`<div class="tool-result-title">${title}</div>${body}`;
}
function fail(error) {
  const target=document.getElementById('num-result');
  target.textContent=error.message;
  target.classList.add('tool-error');
}

export function numOpenPanel(id) {
  const config=panels[id];
  if (!config) return;
  document.getElementById('num-title').textContent=config.title;
  document.getElementById('num-heading').textContent=config.title;
  document.getElementById('num-description').textContent=config.description;
  document.getElementById('num-content').innerHTML=`<div class="num-controls">${config.controls}</div><div class="tool-actions"><button class="tool-button" data-action="${config.action}">Calcular</button></div><div id="num-result" class="tool-result" aria-live="polite"></div>`;
}

export function numCalcErrors() {
  try {
    const exact=number('num-exact'), approximate=number('num-approx'), digits=number('num-digits');
    const error=numericError(exact,approximate), significant=significantArithmetic(approximate,digits);
    show('Errores y cifras',`<p>|referencia − aproximación| = ${fN(error.absolute)}; error relativo = ${error.relative===null?'indefinido (referencia cero)':fN(error.relative)}.</p>
      <p>Error porcentual = ${error.percent===null?'indefinido':`${fN(error.percent)} %`}.</p>
      <p>Con ${digits} cifras: corte = ${fN(significant.chopped)}; redondeo = ${fN(significant.rounded)}.</p>`);
  } catch(error) { fail(error); }
}

export function numCalcRoots() {
  try {
    const method=read('num-root-method');
    if(method==='bairstow') {
      const coefficients=vector('num-root-coefficients');
      const result=bairstow(coefficients,number('num-root-r'),number('num-root-s'),{
        tolerance:number('num-root-tol'),maxIterations:number('num-root-n')});
      show('Bairstow',`<p>p(x) = Σ aᵢxⁱ, aᵢ = ${tuple(coefficients)}. Factor buscado: x²−rx−s. Estado: ${result.status}.</p>
        <p>Raíces obtenidas: ${result.roots.map(root=>`${fN(root.real)} ${root.imaginary<0?'−':'+'} ${fN(Math.abs(root.imaginary))}i`).join('; ')||'ninguna confirmada'}.</p>`+
        table(['Grado','Paso','r','s','Residuo (b₀,b₁)'],result.history.map(row=>[row.degree,row.iteration,fN(row.r),fN(row.s),tuple(row.remainder)])));
      return;
    }
    const {parsed:f,normalized}=expression('num-root-f');
    const fixed=read('num-root-stop')==='steps';
    const options=fixed?{iterations:number('num-root-n')}:{tolerance:number('num-root-tol'),maxIterations:200};
    if (fixed && options.iterations>200) throw new RangeError('Máximo 200 pasos');
    let result, extra='';
    if (method==='bisection') {
      result=bisection(f,number('num-root-a'),number('num-root-b'),options);
      extra=table(['i','a','b','m','f(m)','cota'],result.history.map(row=>[row.iteration,fN(row.left),fN(row.right),fN(row.midpoint),fN(row.value),fN(row.bound)]));
    } else if (method==='newton') {
      const source=read('num-root-df');
      const derivative=source?expression('num-root-df').parsed:x=>finiteDifference(f,x,1e-5*Math.max(1,Math.abs(x)),'central').value;
      result=newtonTrace(f,derivative,number('num-root-a'),options);
      extra=`<p>f′: ${source?escapeHtml(normalizeExpression(source)):'diferencia centrada numérica'}.</p>`+
        table(['i','xᵢ','f(xᵢ)','f′(xᵢ)','xᵢ₊₁','residuo'],result.history.map(row=>[row.iteration,fN(row.x),fN(row.value),fN(row.slope),fN(row.next),fN(row.residual)]));
    } else throw new RangeError('Método inválido');
    show('Raíces',`<p>Expresión interpretada: ${escapeHtml(normalized)}. Estado: ${result.status}; aproximación = ${fN(result.root)}. ${method==='bisection'?`Cota del último intervalo = ${fN(result.bound)}.`:''}</p>${extra}`);
  } catch(error) { fail(error); }
}

export function numCalcLinear() {
  try {
    const A=rows('num-linear-a'), b=vector('num-linear-b');
    if(read('num-linear-method')==='lu') {
      const result=luSolve(A,b);
      show('LU con pivoteo parcial',`<p>PA=LU. Permutación de filas (base 0): ${tuple(result.permutation)}. x = ${tuple(result.solution)}; ||Ax−b||∞ = ${fN(result.residualInfinity)}.</p>
        <p>y de Ly=Pb: ${tuple(result.y)}.</p><p>L:</p>${table(A[0].map((_,i)=>`col ${i+1}`),result.lower.map(tupleRow=>tupleRow.map(fN)))}
        <p>U:</p>${table(A[0].map((_,i)=>`col ${i+1}`),result.upper.map(tupleRow=>tupleRow.map(fN)))}`);
      return;
    }
    const x0=vector('num-linear-x0');
    const fixed=read('num-linear-stop')==='steps';
    const options={method:read('num-linear-method'),...(fixed?{iterations:number('num-linear-n')}:{tolerance:number('num-linear-tol'),maxIterations:200})};
    if (fixed && options.iterations>200) throw new RangeError('Máximo 200 pasos');
    const result=iterativeLinearSystem(A,b,x0,options);
    show('Sistema iterativo',`<p>Estado: ${result.status}; x = ${tuple(result.solution)}. El residuo es ||Ax−b||∞.</p>`+
      table(['i','x','Cambio máximo','Residuo'],result.history.map(row=>[row.iteration,tuple(row.vector),fN(row.difference),fN(row.residual)])));
  } catch(error) { fail(error); }
}

export function numCalcInterpolation() {
  try {
    const points=rows('num-points');
    const x=number('num-interp-x'), method=read('num-interp-method');
    if (method==='newton') {
      const result=newtonInterpolation(points);
      show('Newton dividido',`<p>p(x) = a₀ + a₁(x−x₀) + a₂(x−x₀)(x−x₁) + …</p><p>Coeficientes: ${tuple(result.coefficients)}; p(${fN(x)}) = ${fN(result.evaluate(x))}.</p>`+
        table(['Orden','Diferencias divididas'],result.columns.map((column,i)=>[i,tuple(column)])));
    } else if (method==='lagrange') {
      const result=lagrangeInterpolation(points,x);
      show('Lagrange',`<p>p(x) = Σ yᵢLᵢ(x), Lᵢ(x) = Πⱼ₍ⱼ≠ᵢ₎(x−xⱼ)/(xᵢ−xⱼ).</p><p>p(${fN(x)}) = ${fN(result.value)}.</p>`+
        table(['i','Lᵢ(x)','yᵢLᵢ(x)'],result.terms.map((term,i)=>[i,fN(term.basis),fN(term.term)])));
    } else if (method==='fit') {
      const result=leastSquaresPolynomial(points,number('num-fit-degree'));
      const value=result.coefficients.reduce((sum,coefficient,i)=>sum+coefficient*x**i,0);
      show('Mínimos cuadrados',`<p>Resolver (XᵀX)c = Xᵀy. Coeficientes en potencias ascendentes: ${tuple(result.coefficients)}.</p><p>p(${fN(x)}) = ${fN(value)}; suma de residuos² = ${fN(result.squaredError)}.</p>`+
        table(['Punto','Residuo y−p(x)'],result.residuals.map((residual,i)=>[i+1,fN(residual)])));
    } else if (method==='exponential') {
      const result=exponentialFit(points),prediction=result.amplitude*Math.exp(result.rate*x);
      show('Ajuste exponencial',`<p>ln y = ln A + bx; A = ${fN(result.amplitude)}, b = ${fN(result.rate)}; y(${fN(x)}) = ${fN(prediction)}.</p>
        <p>${result.assumption}. Suma de residuos² en y = ${fN(result.squaredError)}.</p>`+
        table(['Punto','Residuo y−ŷ'],result.residuals.map((residual,i)=>[i+1,fN(residual)])));
    } else if (method==='sinusoidal') {
      const omega=number('num-fit-omega'),result=sinusoidalFit(points,omega);
      const prediction=result.offset+result.sinCoefficient*Math.sin(omega*x)+result.cosCoefficient*Math.cos(omega*x);
      show('Ajuste sinusoidal',`<p>y = c+a sen(ωx)+b cos(ωx), ω=${fN(omega)}; c=${fN(result.offset)}, a=${fN(result.sinCoefficient)}, b=${fN(result.cosCoefficient)}.</p>
        <p>Amplitud = ${fN(result.amplitude)}, fase = ${fN(result.phase)} rad; y(${fN(x)}) = ${fN(prediction)}; Σresiduo² = ${fN(result.squaredError)}.</p><p>${result.assumption}.</p>`+
        table(['Punto','Residuo y−ŷ'],result.residuals.map((residual,i)=>[i+1,fN(residual)])));
    } else throw new RangeError('Método inválido');
  } catch(error) { fail(error); }
}

export function numCalcDerivative() {
  try {
    const {parsed,normalized}=expression('num-diff-f');
    const x=number('num-diff-x'), h=number('num-diff-h'), method=read('num-diff-method');
    const result=finiteDifference(parsed,x,h,method);
    const half=finiteDifference(parsed,x,h/2,method);
    show('Derivación numérica',`<p>f(x) = ${escapeHtml(normalized)}; método ${method}; f′(${fN(x)}) ≈ ${fN(result.value)} con h = ${fN(h)}.</p><p>Con h/2: ${fN(half.value)}. Diferencia entre refinamientos: ${fN(Math.abs(half.value-result.value))}; no es una cota de error real.</p>`);
  } catch(error) { fail(error); }
}

export function numCalcODE() {
  try {
    const {parsed,normalized}=expression('num-ode-f');
    const x0=number('num-ode-x0'), y0=number('num-ode-y0'), h=number('num-ode-h'), n=number('num-ode-n'), method=read('num-ode-method');
    if (n>500) throw new RangeError('Máximo 500 pasos');
    const result=ivpTrace(parsed,x0,y0,h,n,method);
    const refined=ivpTrace(parsed,x0,y0,h/2,2*n,method);
    if (result.status!=='completed'||refined.status!=='completed') throw new RangeError('La trayectoria diverge o sale del dominio');
    const lambdaRaw=read('num-ode-lambda');
    const stability=lambdaRaw!==''?linearTestStability(number('num-ode-lambda'),Math.abs(h),method):null;
    show('PVI numérico',`<p>y′ = ${escapeHtml(normalized)}, y(${fN(x0)}) = ${fN(y0)}. ${result.startup||''}</p>
      <p>y(${fN(result.final.x)}) ≈ ${fN(result.final.y)}; con h/2 ≈ ${fN(refined.final.y)}. Diferencia: ${fN(Math.abs(refined.final.y-result.final.y))} (estimación de refinamiento, no error exacto).</p>`+
      (stability?`<p>Prueba separada y′=λy: z=${fN(stability.z)}, amplificación=${fN(stability.amplification)}, ${stability.stable?'estable':'inestable'}; ${stability.criterion}. No clasifica automáticamente la EDO introducida.</p>`:'')+
      table(['Paso','x','y'],result.history.map(row=>[row.iteration,fN(row.x),fN(row.y)])));
  } catch(error) { fail(error); }
}
