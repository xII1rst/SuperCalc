import { collectVariables } from '../../math/expression.mjs';
import { derivativeIntervalBound, expandedInterpolation } from '../../math/numerical-study.mjs';
import { escapeHtml, expression, fN, fail, number, read, rows, show, table, tuple } from './inputs.mjs';
import { exponentialFit, sinusoidalFit } from '../../math/numerical-advanced.mjs';
import { interpolationErrorStudy, lagrangeInterpolation, leastSquaresPolynomial } from '../../math/numerical-analysis.mjs';

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

export const panels={
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
};
