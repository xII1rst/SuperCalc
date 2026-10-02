import { bairstow } from '../../math/numerical-advanced.mjs';
import { bisection, finiteDifference, newtonTrace } from '../../math/numerical-analysis.mjs';
import { bisectionIterationRequirement, convergenceOrderStudy, derivativeReference } from '../../math/numerical-study.mjs';
import { calcParse, normalizeExpression } from '../../math/expression.mjs';
import { escapeHtml, expression, fN, fail, number, read, show, table, tuple, vector } from './inputs.mjs';

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

export const panels={
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
};
