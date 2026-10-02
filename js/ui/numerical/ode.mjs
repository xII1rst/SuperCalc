import { collectVariables } from '../../math/expression.mjs';
import { escapeHtml, expression, fN, fail, number, read, rows, show, table } from './inputs.mjs';
import { ivpTrace } from '../../math/numerical-analysis.mjs';
import { linearTestStability } from '../../math/numerical-advanced.mjs';
import { studyPlotSvg } from '../../graphics/study-plot.mjs';

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

export const panels={
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
