import { newtonSystem, systemStability } from '../math/numerical-systems.mjs';
import { studyPlotSvg } from '../graphics/study-plot.mjs';
import { derivativeIntervalBound, taylorErrorStudy, bisectionIterationRequirement, expandedInterpolation, convergenceOrderStudy, derivativeReference } from '../math/numerical-study.mjs';
import {
  numericError, significantArithmetic, bisection, newtonTrace, iterativeLinearSystem,
  newtonInterpolation, lagrangeInterpolation, interpolationErrorStudy, leastSquaresPolynomial, finiteDifference, ivpTrace,
} from '../math/numerical-analysis.mjs';
import { calcParse, collectVariables, normalizeExpression } from '../math/expression.mjs';
import {
  luSolve, finitePrecisionElimination, bairstow, exponentialFit, sinusoidalFit, linearTestStability,
  finitePrecisionTrace, newtonSystem2D, quadratureWithBound, minimumSubintervalsForBound,
} from '../math/numerical-advanced.mjs';
// Numerical tables keep enough significant digits to inspect each iteration.
const fN = value => Number.isFinite(value) ? (value===0?'0':String(Number(value.toPrecision(10)))) : 'indefinido';
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

const panels = {
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
  taylor: {title:'Taylor y cota de error', description:'Polinomio centrado y resto de Lagrange. Cotas conservadoras por intervalos para familias admitidas; no se usan muestras como prueba.', action:'numCalcTaylor', controls:`
    <label for="num-taylor-f">f(x)</label><input id="num-taylor-f" class="tool-input" value="exp(x)">
    <label for="num-taylor-center">Centro a</label><input id="num-taylor-center" class="tool-input" type="number" step="any" value="0">
    <label for="num-taylor-x">Evaluar en x</label><input id="num-taylor-x" class="tool-input" type="number" step="any" value="0.5">
    <label for="num-taylor-degree">Grado (0–6)</label><input id="num-taylor-degree" class="tool-input" type="number" min="0" max="6" value="3">`},
  errors: {title:'Errores y cifras', description:'Compara una aproximación con una referencia y simula corte o redondeo a cifras significativas.', action:'numCalcErrors', controls:`
    <label for="num-exact">Valor de referencia</label><input id="num-exact" class="tool-input" type="text" value="3.141592653589793">
    <label for="num-approx">Aproximación</label><input id="num-approx" class="tool-input" type="text" value="3.142857142857143">
    <label for="num-digits">Cifras significativas</label><input id="num-digits" class="tool-input" type="number" min="1" max="15" value="5">`},
  precision: {title:'Precisión finita por operación', description:'Redondea o corta operandos y cada resultado intermedio. La referencia usa números de JavaScript, no aritmética racional exacta.', action:'numCalcPrecision', controls:`
    <label for="num-precision-values">Operandos en orden (2–30, separados por coma)</label><input id="num-precision-values" class="tool-input" type="text" value="10000, 3.14159, 10000">
    <label for="num-precision-ops">Operaciones entre operandos</label><input id="num-precision-ops" class="tool-input" type="text" value="+, -">
    <label for="num-precision-digits">Cifras significativas</label><input id="num-precision-digits" class="tool-input" type="number" min="1" max="15" value="4">
    <label for="num-precision-mode">Regla</label><select id="num-precision-mode" class="tool-input"><option value="round">Redondear</option><option value="chop">Cortar</option></select>`},
  roots: {title:'Raíces por iteración', description:'Bisección requiere cambio de signo. Newton usa la derivada indicada o una diferencia centrada marcada como aproximada.', action:'numCalcRoots', controls:`
    <label for="num-root-method">Método</label><select id="num-root-method" class="tool-input"><option value="bisection">Bisección</option><option value="newton">Newton</option><option value="bairstow">Bairstow polinómico</option><option value="count">Número de pasos de bisección</option></select>
    <label for="num-root-coefficients">Bairstow: coeficientes a₀, a₁, …, aₙ</label><input id="num-root-coefficients" class="tool-input" type="text" value="4, 0, -5, 0, 1">
    <label for="num-root-r">Semilla r</label><input id="num-root-r" class="tool-input" type="number" step="any" value="0">
    <label for="num-root-s">Semilla s</label><input id="num-root-s" class="tool-input" type="number" step="any" value="1">
    <label for="num-root-f">f(x)</label><input id="num-root-f" class="tool-input" type="text" value="x^3-x-2">
    <label for="num-root-df">f′(x) para Newton (opcional)</label><input id="num-root-df" class="tool-input" type="text" placeholder="3x^2-1">
    <label for="num-root-a">a o x₀</label><input id="num-root-a" class="tool-input" type="number" step="any" value="1">
    <label for="num-root-b">b para bisección</label><input id="num-root-b" class="tool-input" type="number" step="any" value="2">
    <label for="num-root-stop">Detener tras</label><select id="num-root-stop" class="tool-input"><option value="steps">N pasos</option><option value="tolerance">Tolerancia</option></select>
    <label for="num-root-n">N pasos (máx. 200)</label><input id="num-root-n" class="tool-input" type="number" min="1" max="200" value="3">
    <label for="num-root-tol">Tolerancia</label><input id="num-root-tol" class="tool-input" type="number" step="any" min="0" value="0.000001">
    <label for="num-root-reference">Raíz de referencia para estudiar orden (opcional)</label><input id="num-root-reference" class="tool-input" type="text" placeholder="1.4142135623730951">`},
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
  interpolation: {title:'Interpolación y ajuste', description:'Introduce puntos distintos (x,y). Compara Lagrange, Newton y mínimos cuadrados polinómicos.', action:'numCalcInterpolation', controls:`
    <label for="num-points">Puntos, uno por línea</label><textarea id="num-points" class="tool-textarea" rows="4">0, 1\n1, 3\n2, 7</textarea>
    <label for="num-interp-method">Método</label><select id="num-interp-method" class="tool-input"><option value="newton">Newton dividido</option><option value="lagrange">Lagrange</option><option value="error">Error de interpolación</option><option value="fit">Mínimos cuadrados</option><option value="exponential">Exponencial linealizado</option><option value="sinusoidal">Sinusoidal con ω fija</option></select>
    <label for="num-fit-offset">Término constante sinusoidal</label><select id="num-fit-offset" class="tool-input"><option value="yes">Ajustar constante</option><option value="no">Constante cero</option></select>
    <label for="num-fit-omega">ω para ajuste sinusoidal (rad/unidad x)</label><input id="num-fit-omega" class="tool-input" type="number" step="any" value="1">
    <label for="num-interp-x">Evaluar en x</label><input id="num-interp-x" class="tool-input" type="number" step="any" value="1.5">
    <label for="num-fit-degree">Grado para ajuste</label><input id="num-fit-degree" class="tool-input" type="number" min="0" max="5" value="1">
    <label for="num-interp-reference">f(x) de referencia para error real (opcional)</label><input id="num-interp-reference" class="tool-input" type="text" placeholder="ln(x)">
    <label for="num-interp-bound-mode">Origen de M</label><select id="num-interp-bound-mode" class="tool-input"><option value="given">Cota proporcionada</option><option value="auto">Derivar cota desde f(x)</option></select>
    <label for="num-interp-bound">M: cota de |f⁽ⁿ⁾| entre los nodos y x</label><input id="num-interp-bound" class="tool-input" type="number" min="0" step="any" value="2">`},
  derivative: {title:'Derivación numérica', description:'Aproxima f′(x) con diferencias hacia adelante, atrás, centradas o de cinco puntos.', action:'numCalcDerivative', controls:`
    <label for="num-diff-f">f(x)</label><input id="num-diff-f" class="tool-input" type="text" value="ln(x)">
    <label for="num-diff-x">x</label><input id="num-diff-x" class="tool-input" type="number" step="any" value="2">
    <label for="num-diff-h">Paso h</label><input id="num-diff-h" class="tool-input" type="number" step="any" min="0" value="0.1">
    <label for="num-diff-method">Fórmula</label><select id="num-diff-method" class="tool-input"><option value="forward">Adelante</option><option value="backward">Atrás</option><option value="central">Centrada</option><option value="five">Cinco puntos</option></select>`},
  quadrature: {title:'Cuadratura con cota', description:'Trapecio o Simpson con una cota teórica basada en un límite de derivada que tú proporcionas para todo el intervalo.', action:'numCalcQuadrature', controls:`
    <label for="num-quad-f">f(x)</label><input id="num-quad-f" class="tool-input" type="text" value="sin(x)">
    <label for="num-quad-a">Inicio a</label><input id="num-quad-a" class="tool-input" type="number" step="any" value="0">
    <label for="num-quad-b">Fin b</label><input id="num-quad-b" class="tool-input" type="number" step="any" value="3.141592653589793">
    <label for="num-quad-mode">Calcular con</label><select id="num-quad-mode" class="tool-input"><option value="subintervals">n subintervalos</option><option value="target">Error objetivo</option></select>
    <label for="num-quad-n">Subintervalos n (1–1000; par en Simpson)</label><input id="num-quad-n" class="tool-input" type="number" min="1" max="1000" value="10">
    <label for="num-quad-target">Error objetivo ε (usa la cota teórica)</label><input id="num-quad-target" class="tool-input" type="number" min="0" step="any" value="0.000001">
    <label for="num-quad-method">Método</label><select id="num-quad-method" class="tool-input"><option value="simpson">Simpson</option><option value="trapezoid">Trapecio</option></select>
    <label for="num-quad-bound-mode">Origen de M</label><select id="num-quad-bound-mode" class="tool-input"><option value="given">Cota proporcionada</option><option value="auto">Derivar cota desde f(x)</option></select>
    <label for="num-quad-reference">Integral de referencia (opcional)</label><input id="num-quad-reference" class="tool-input" type="text" placeholder="2">
    <label for="num-quad-bound">M₄ (Simpson) o M₂ (trapecio): cota de |derivada| en [a,b]</label><input id="num-quad-bound" class="tool-input" type="number" step="any" min="0" value="1">`},
  ode: {title:'PVI numérico', description:'Compara Euler, RK2, RK4 y Adams-Bashforth de dos pasos con arranque RK4 declarado.', action:'numCalcODE', controls:`
    <label for="num-ode-f">y′ = f(x,y)</label><input id="num-ode-f" class="tool-input" type="text" value="x+y">
    <label for="num-ode-x0">x₀</label><input id="num-ode-x0" class="tool-input" type="number" step="any" value="0">
    <label for="num-ode-y0">y₀</label><input id="num-ode-y0" class="tool-input" type="number" step="any" value="1">
    <label for="num-ode-h">Paso h</label><input id="num-ode-h" class="tool-input" type="number" step="any" value="0.1">
    <label for="num-ode-n">Pasos (máx. 500)</label><input id="num-ode-n" class="tool-input" type="number" min="1" max="500" value="2">
    <label for="num-ode-method">Método</label><select id="num-ode-method" class="tool-input"><option value="euler">Euler</option><option value="rk2">RK2 punto medio</option><option value="rk4">RK4</option><option value="ab2">Adams-Bashforth 2</option><option value="compare">Comparar los cuatro</option></select>
    <label for="num-ode-startup">Arranque de Adams-Bashforth 2</label><select id="num-ode-startup" class="tool-input"><option value="rk4">RK4</option><option value="rk2">RK2 punto medio</option></select>
    <label for="num-ode-reference">Solución y(x) de referencia (opcional)</label><input id="num-ode-reference" class="tool-input" type="text" placeholder="exp(x)">
    <label for="num-ode-lambda">λ &lt; 0 para prueba separada de estabilidad y′=λy (opcional)</label><input id="num-ode-lambda" class="tool-input" type="number" step="any" placeholder="−1">`},
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
  document.getElementById('num-content').innerHTML=`<div class="num-controls" data-action="numPreviewInputs" data-event="input" data-arg="${id}">${config.controls}</div><div id="num-preview" class="calc-res-hint" aria-live="polite"></div><div class="tool-actions"><button class="tool-button" data-action="${config.action}">Calcular</button></div><div id="num-result" class="tool-result" aria-live="polite"></div>`;
  numPreviewInputs(id);
}

export function numCalcErrors() {
  try {
    const exact=number('num-exact'), approximate=number('num-approx'), digits=number('num-digits');
    const error=numericError(exact,approximate), significant=significantArithmetic(approximate,digits);
    show('Errores y cifras',`<p>|referencia − aproximación| = ${fN(error.absolute)}; error relativo = ${error.relative===null?'indefinido (referencia cero)':fN(error.relative)}.</p>
      <p>Error porcentual = ${error.percent===null?'indefinido':`${fN(error.percent)} %`}.</p>
      <p>Con ${digits} cifras: corte = ${fN(significant.chopped)}; redondeo = ${fN(significant.rounded)}.</p>
      ${table(['Regla','Error absoluto contra referencia','Error relativo'],[...['chopped','rounded'].map(key=>{const e=numericError(exact,significant[key]);return [key==='chopped'?'Corte':'Redondeo',fN(e.absolute),e.relative===null?'indefinido':fN(e.relative)];})])}`);
  } catch(error) { fail(error); }
}

export function numCalcPrecision() {
  try {
    const raw=read('num-precision-values').split(/[,;\s]+/).filter(Boolean);
    if(raw.length<2||raw.length>30||raw.some(value=>!Number.isFinite(Number(value))))
      throw new RangeError('Introduce entre 2 y 30 operandos numéricos');
    const operands=raw.map(Number);
    const operations=read('num-precision-ops').split(/[,;\s]+/).filter(Boolean);
    const result=finitePrecisionTrace(operands,operations,number('num-precision-digits'),read('num-precision-mode'));
    show('Precisión finita por operación',`<p>Referencia JS = ${fN(result.exact)}; resultado simulado = ${fN(result.approximate)}; error absoluto = ${fN(result.absoluteError)}.</p>
      <p>${result.digits} cifras, regla: ${result.mode==='round'?'redondeo':'corte'}. ${result.assumption}.</p>`+
      table(['Paso','Operación','Operando','Operando cuantizado','Referencia','Simulado','Error'],result.history.map(row=>[
        row.step,row.operation,fN(row.operand),row.roundedOperand===undefined?'—':fN(row.roundedOperand),fN(row.exact),fN(row.approximate),fN(row.error),
      ])));
  } catch(error) { fail(error); }
}

export function numCalcRoots() {
  try {
    const method=read('num-root-method');
    if(method==='count') {
      const result=bisectionIterationRequirement(number('num-root-a'),number('num-root-b'),number('num-root-tol'));
      show('Pasos de bisección',`<p>N mínimo = ${result.iterations}; cota = ${fN(result.bound)}.</p><p>${result.formula}</p>`);return;
    }
    if(method==='bairstow') {
      const coefficients=vector('num-root-coefficients');
      const result=bairstow(coefficients,number('num-root-r'),number('num-root-s'),{
        tolerance:number('num-root-tol'),maxIterations:number('num-root-n')});
      show('Bairstow',`<p>p(x) = Σ aᵢxⁱ, aᵢ = ${tuple(coefficients)}. Factor buscado: x²−rx−s. Estado: ${result.status}.</p>
        <p>Raíces obtenidas: ${result.roots.map(root=>`${fN(root.real)} ${root.imaginary<0?'−':'+'} ${fN(Math.abs(root.imaginary))}i`).join('; ')||'ninguna confirmada'}.</p>`+
        table(['Grado','Paso','r','s','Residuo (b₀,b₁)','Δr','Δs','r siguiente','s siguiente'],result.history.map(row=>[row.degree,row.iteration,fN(row.r),fN(row.s),tuple(row.remainder),fN(row.deltaR),fN(row.deltaS),fN(row.nextR),fN(row.nextS)]))+ (result.candidate?`<p>Factor candidato tras los pasos: x²−(${fN(result.candidate.r)})x−(${fN(result.candidate.s)}); residuo = ${tuple(result.candidate.remainder)}. No convergió; no se confirma la deflación ni sus raíces.</p>`:''));
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
      let symbolic=null;try{symbolic=derivativeReference(read('num-root-f'),number('num-root-a')).expression;}catch{}
      const derivative=source?expression('num-root-df').parsed:symbolic?calcParse(symbolic):x=>finiteDifference(f,x,1e-5*Math.max(1,Math.abs(x)),'central').value;
      result=newtonTrace(f,derivative,number('num-root-a'),options);
      extra=`<p>f′: ${source?escapeHtml(normalizeExpression(source)):symbolic?escapeHtml(symbolic)+' (simbólica)':'diferencia centrada numérica'}.</p>`+
        table(['i','xᵢ','f(xᵢ)','f′(xᵢ)','xᵢ₊₁','residuo'],result.history.map(row=>[row.iteration,fN(row.x),fN(row.value),fN(row.slope),fN(row.next),fN(row.residual)]));
    } else throw new RangeError('Método inválido');
    if(method==='newton'&&read('num-root-reference')&&result.history.length>=2){
      const order=convergenceOrderStudy([number('num-root-a'),...result.history.map(r=>r.next)],number('num-root-reference'));
      extra+=`<p>Orden observado contra referencia suministrada; no prueba convergencia. Ratios inestables al llegar a precisión de máquina.</p>`+table(['i','Error','eᵢ₊₁/eᵢ','eᵢ₊₁/eᵢ²','Orden observado'],order.map(r=>[r.iteration,fN(r.error),r.linearRatio===null?'—':fN(r.linearRatio),r.quadraticRatio===null?'—':fN(r.quadraticRatio),r.observedOrder===null?'—':fN(r.observedOrder)]));
    }
    show('Raíces',`<p>Expresión interpretada: ${escapeHtml(normalized)}. Estado: ${result.status}; aproximación = ${fN(result.root)}. ${method==='bisection'?`Cota del último intervalo = ${fN(result.bound)}.`:''}</p>${extra}`);
  } catch(error) { fail(error); }
}

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

export function numCalcInterpolation() {
  try {
    const points=rows('num-points');
    const x=number('num-interp-x'), method=read('num-interp-method');
    if (method==='newton') {
      const result=expandedInterpolation(points);
      show('Newton dividido',`<p>p(x) = a₀ + a₁(x−x₀) + a₂(x−x₀)(x−x₁) + …</p><p>Coeficientes en potencias ascendentes de x: ${tuple(result.powerCoefficients)}.</p><p>Coeficientes: ${tuple(result.coefficients)}; p(${fN(x)}) = ${fN(result.evaluate(x))}.</p>`+
        table(['Orden','Diferencias divididas'],result.columns.map((column,i)=>[i,tuple(column)])));
    } else if (method==='lagrange') {
      const result=lagrangeInterpolation(points,x),expanded=expandedInterpolation(points);
      show('Lagrange',`<p>Coeficientes en potencias ascendentes de x: ${tuple(expanded.powerCoefficients)}.</p><p>p(x) = Σ yᵢLᵢ(x), Lᵢ(x) = Πⱼ₍ⱼ≠ᵢ₎(x−xⱼ)/(xᵢ−xⱼ).</p><p>p(${fN(x)}) = ${fN(result.value)}.</p>`+
        table(['i','Lᵢ(x)','yᵢLᵢ(x)'],result.terms.map((term,i)=>[i,fN(term.basis),fN(term.term)])));
    } else if (method==='error') {
      const source=read('num-interp-reference');
      if(source&&collectVariables(source).some(name=>name!=='x')) throw new RangeError('La referencia solo puede usar x');
      const referenceFn=source?expression('num-interp-reference').parsed:null;
      const automatic=read('num-interp-bound-mode')==='auto'?derivativeIntervalBound(source,Math.min(x,...points.map(p=>p[0])),Math.max(x,...points.map(p=>p[0])),points.length):null;
      const result=interpolationErrorStudy(points,x,automatic?automatic.bound:number('num-interp-bound'),referenceFn);
      show('Error de interpolación',`<p>p(${fN(x)}) = ${fN(result.approximation)}; cota teórica ≤ ${fN(result.bound)}.</p>
        <p>|f⁽ⁿ⁾(t)| ≤ M; |f(x)−p(x)| ≤ M·|Π(x−xᵢ)|/n!, con n=${points.length}, n!=${fN(result.factorial)}. ${automatic?escapeHtml(automatic.derivative)+'; M = '+fN(automatic.bound)+'. '+automatic.proof:result.assumption}</p>
        <p>${result.reference===null?'Ingresa f(x) para comparar con el error real.':`f(${fN(x)}) = ${fN(result.reference)}; error real = ${fN(result.actualError)}.`}</p>`+
        table(['Nodo i','x−xᵢ'],result.factors.map((factor,i)=>[i,fN(factor)])));
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
      const omega=number('num-fit-omega'),result=sinusoidalFit(points,omega,{includeOffset:read('num-fit-offset')!=='no'});
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
    let reference='';try{const exact=derivativeReference(read('num-diff-f'),x);reference=`<p>Referencia simbólica f′(x) = ${escapeHtml(exact.expression)}; f′(${fN(x)}) = ${fN(exact.value)}; error real = ${fN(Math.abs(result.value-exact.value))}.</p>`;}catch{}
    show('Derivación numérica',`<p>f(x) = ${escapeHtml(normalized)}; método ${method}; f′(${fN(x)}) ≈ ${fN(result.value)} con h = ${fN(h)}.</p><p>Con h/2: ${fN(half.value)}. Diferencia entre refinamientos: ${fN(Math.abs(half.value-result.value))}; no es una cota de error real.</p>${reference}`);
  } catch(error) { fail(error); }
}

export function numCalcQuadrature() {
  try {
    const source=read('num-quad-f');
    if(collectVariables(source).some(name=>name!=='x')) throw new RangeError('Usa solo la variable x');
    const {parsed,normalized}=expression('num-quad-f');
    const a=number('num-quad-a'), b=number('num-quad-b');
    const method=read('num-quad-method');
    const automatic=read('num-quad-bound-mode')==='auto'?derivativeIntervalBound(source,a,b,method==='simpson'?4:2):null;
    const bound=automatic?automatic.bound:number('num-quad-bound');
    const targetMode=read('num-quad-mode')==='target';
    const requirement=targetMode?minimumSubintervalsForBound(a,b,method,bound,number('num-quad-target')):null;
    const n=requirement?requirement.subintervals:number('num-quad-n');
    const result=quadratureWithBound(parsed,a,b,n,method,bound);
    show('Cuadratura con cota',`${requirement?`<p>n mínimo dentro del límite de la herramienta: ${n}; ${requirement.formula}, con ε = ${fN(requirement.targetError)}.</p>`:''}
      <p>f(x) = ${escapeHtml(normalized)}, intervalo [${fN(a)}, ${fN(b)}], n = ${n}. ${method==='simpson'?'Simpson':'Trapecio'} = ${fN(result.value)}; con 2n = ${fN(result.refined)}.</p>
      <p>Diferencia entre refinamientos = ${fN(result.refinementDifference)}. Cota teórica para n: ${result.formula} = ${fN(result.bound)}.</p>
      <p>${automatic?escapeHtml(automatic.derivative)+'; M = '+fN(bound)+'. '+automatic.proof:result.assumption} La diferencia entre refinamientos no demuestra esta cota.</p>
      ${read('num-quad-reference')?`<p>Referencia suministrada = ${fN(number('num-quad-reference'))}; error real = ${fN(Math.abs(result.value-number('num-quad-reference')))}.</p>`:''}`);
  } catch(error) { fail(error); }
}

export function numCalcODE() {
  try {
    const {parsed,normalized}=expression('num-ode-f');
    const x0=number('num-ode-x0'), y0=number('num-ode-y0'), h=number('num-ode-h'), n=number('num-ode-n'), method=read('num-ode-method'),startup=read('num-ode-startup');
    if (n>500) throw new RangeError('Máximo 500 pasos');
    const referenceSource=read('num-ode-reference');
    if(referenceSource&&collectVariables(referenceSource).some(name=>name!=='x')) throw new RangeError('La referencia solo puede usar x');
    const referenceFn=referenceSource?expression('num-ode-reference').parsed:null;
    if(referenceFn){
      const initialReference=referenceFn(x0);
      if(!Number.isFinite(initialReference)||Math.abs(initialReference-y0)>1e-8*Math.max(1,Math.abs(y0)))
        throw new RangeError('La solución de referencia no satisface el valor inicial');
    }
    const lambdaRaw=read('num-ode-lambda');
    if(lambdaRaw!==''&&(number('num-ode-lambda')>=0||h<=0))
      throw new RangeError('Para esta prueba de estabilidad absoluta usa λ < 0 y h > 0');
    if(method==='compare') {
      const finalX=x0+n*h;
      const exact=referenceFn?referenceFn(finalX):null;
      if(referenceFn&&!Number.isFinite(exact)) throw new RangeError('Referencia fuera de dominio en el punto final');
      const methods=['euler','rk2','rk4','ab2'];
      const plotSeries=[];
      const rows=methods.map(name=>{
        const coarse=ivpTrace(parsed,x0,y0,h,n,name,{startup}),fine=ivpTrace(parsed,x0,y0,h/2,2*n,name,{startup});
        if(coarse.status!=='completed'||fine.status!=='completed') throw new RangeError('La trayectoria diverge o sale del dominio');
        plotSeries.push({label:name,points:coarse.history.map(row=>[row.x,row.y])});
        const stability=lambdaRaw!==''?linearTestStability(number('num-ode-lambda'),Math.abs(h),name):null;
        return [name,fN(coarse.final.y),fN(fine.final.y),fN(Math.abs(fine.final.y-coarse.final.y)),
          exact===null?'—':fN(Math.abs(exact-coarse.final.y)),stability===null?'—':stability.stable?'estable':'inestable'];
      });
      show('Comparación de PVI',`<p>y′ = ${escapeHtml(normalized)}, y(${fN(x0)}) = ${fN(y0)}, x final = ${fN(finalX)}.
        ${exact===null?'Ingresa una solución de referencia para ver el error real.':`Referencia y(${fN(finalX)}) = ${fN(exact)}.`}</p>
        <p>Adams–Bashforth 2 arranca con ${startup.toUpperCase()}. La diferencia h frente a h/2 no es una cota de error. La diferencia contra la referencia es error real solo si esa expresión resuelve la PVI. La columna de estabilidad solo analiza el problema test y′=λy.</p>`+
        table(['Método','y con h','y con h/2','Diferencia','Dif. con referencia','Estabilidad test'],rows)+studyPlotSvg(plotSeries,{title:'Comparación de soluciones numéricas',field:parsed}));
      return;
    }
    const result=ivpTrace(parsed,x0,y0,h,n,method,{startup});
    const refined=ivpTrace(parsed,x0,y0,h/2,2*n,method,{startup});
    if (result.status!=='completed'||refined.status!=='completed') throw new RangeError('La trayectoria diverge o sale del dominio');
    const stability=lambdaRaw!==''?linearTestStability(number('num-ode-lambda'),Math.abs(h),method):null;
    const reference=referenceFn?referenceFn(result.final.x):null;
    if(referenceFn&&!Number.isFinite(reference)) throw new RangeError('Referencia fuera de dominio en el punto final');
    show('PVI numérico',`<p>y′ = ${escapeHtml(normalized)}, y(${fN(x0)}) = ${fN(y0)}. ${result.startup||''}</p>
      <p>y(${fN(result.final.x)}) ≈ ${fN(result.final.y)}; con h/2 ≈ ${fN(refined.final.y)}. Diferencia: ${fN(Math.abs(refined.final.y-result.final.y))} (estimación de refinamiento, no error exacto).</p>`+
      (reference===null?'':`<p>Referencia = ${fN(reference)}; diferencia = ${fN(Math.abs(reference-result.final.y))}. Es error real si la expresión de referencia resuelve la PVI.</p>`)+
      (stability?`<p>Prueba separada y′=λy: z=${fN(stability.z)}, amplificación=${fN(stability.amplification)}, ${stability.stable?'estable':'inestable'}; ${stability.criterion}. No clasifica automáticamente la EDO introducida.</p>`:'')+
      table(['Paso','x','y'],result.history.map(row=>[row.iteration,fN(row.x),fN(row.y)]))+studyPlotSvg([{label:method+' h',points:result.history.map(row=>[row.x,row.y])},{label:method+' h/2',points:refined.history.map(row=>[row.x,row.y])},...(referenceFn?[{label:'Referencia suministrada',points:refined.history.map(row=>[row.x,referenceFn(row.x)])}]:[])],{title:'Solución aproximada y campo direccional',field:parsed}));
  } catch(error) { fail(error); }
}

export function numCalcTaylor() {
  try {
    const center=number('num-taylor-center'),x=number('num-taylor-x'),degree=number('num-taylor-degree');
    const result=taylorErrorStudy(read('num-taylor-f'),center,x,degree);
    show('Taylor y resto de Lagrange',`<p>P(x) = Σ cᵢ(x−a)ⁱ; a = ${fN(center)}. Coeficientes ascendentes: ${tuple(result.coefficients)}.</p>
      <p>P(${fN(x)}) = ${fN(result.approximation)}; f(${fN(x)}) = ${fN(result.reference)}; error real = ${fN(result.actualError)}; cota ≤ ${fN(result.errorBound)}.</p>
      <p>${result.formula}. Derivada de orden ${degree+1}: ${escapeHtml(result.derivative)}; M = ${fN(result.bound)}. ${result.proof}</p>`+
      table(['i','cᵢ','cᵢ(x−a)ⁱ'],result.coefficients.map((c,i)=>[i,fN(c),fN(result.terms[i])])));
  }catch(error){fail(error);}
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

export function numPreviewInputs(panel){
 const target=document.getElementById('num-preview'),config=panels[panel];if(!target||!config)return;
 const ids=[...config.controls.matchAll(/id="([^"]+)"/g)].map(m=>m[1]).filter(id=>/-(f|g|df|expressions|function|reference)$/.test(id));
 const entries=ids.map(id=>{const source=read(id);return source?`<p><code>${escapeHtml(normalizeExpression(source))}</code> · variables: ${escapeHtml(collectVariables(source).join(', ')||'constante')}</p>`:'';}).filter(Boolean);
 target.innerHTML=entries.length?`<details><summary>Entrada normalizada</summary>${entries.join('')}<p>Se verifican sintaxis, variables y dominio al calcular.</p></details>`:'';
}
