import { escapeHtml, fN, fail, number, read, show, table, tuple } from './inputs.mjs';
import { finitePrecisionTrace } from '../../math/numerical-advanced.mjs';
import { numericError, significantArithmetic } from '../../math/numerical-analysis.mjs';
import { taylorErrorStudy } from '../../math/numerical-study.mjs';

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

export const panels={
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
};
