import { collectVariables } from '../../math/expression.mjs';
import { derivativeIntervalBound, derivativeReference } from '../../math/numerical-study.mjs';
import { escapeHtml, expression, fN, fail, number, read, show } from './inputs.mjs';
import { finiteDifference } from '../../math/numerical-analysis.mjs';
import { minimumSubintervalsForBound, quadratureWithBound } from '../../math/numerical-advanced.mjs';

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

export const panels={
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
};
