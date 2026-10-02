import { analyticImproper, improperIntegral, interiorSingularities } from './improper.mjs';
import { calcParse, collectVariables } from '../expression.mjs';
import { evalAST, simplify, substAST } from '../calculus/ast.mjs';
import { fmtNum, toExact } from '../calculus/format.mjs';
import { fn, sub } from './ast-tools.mjs';
import { integrate } from './engine.mjs';
import { parseExpr, tokenize } from '../calculus/parser.mjs';
import { simpsonIntegral } from '../calculus/numeric.mjs';

// Evalúa un AST sustituyendo varName por un valor numérico.
function evalAt(node, varName, val) {
  const sub = substAST(node, varName, { type: 'num', val });
  return evalAST(simplify(sub));
}

export function definiteIntegral(fxStr, a, b, varName = 'x') {
  const out = {
    value: null, valueNum: null, exact: null, antiderivative: null,
    technique: null, steps: [], improper: false, diverges: false, proof:'none', refinementDifference:null,
  };
  if (!fxStr || !fxStr.trim()) { out.error = 'Ingresa una función'; return out; }
  a = Number(a); b = Number(b);
  if(Number.isNaN(a)||Number.isNaN(b)||a>=b){out.error='Se requieren límites reales con a < b';return out;}
  let source;
  try {
    if(fxStr.length>500||collectVariables(fxStr).some(name=>name!==varName))throw new RangeError('Una sola variable y máximo 500 caracteres.');
    source=parseExpr(tokenize(fxStr));
    const poles=interiorSingularities(source,a,b,varName);
    if(poles.length){out.error=`Singularidad interior en ${poles.join(', ')}: separa el intervalo y analiza los límites laterales; no se usa valor principal.`;return out;}
  }catch(error){out.error=error.message;return out;}
  const parsed=calcParse(fxStr,varName);
  if(!parsed){out.error='Función inválida';return out;}
  const singularA=Number.isFinite(a)&&!Number.isFinite(parsed(a,0)),singularB=Number.isFinite(b)&&!Number.isFinite(parsed(b,0));
  const improper=!Number.isFinite(a)||!Number.isFinite(b)||singularA||singularB;
  if(improper) {
    out.improper=true;
    const analytic=analyticImproper(source,a,b,varName);
    if(analytic) {
      out.proof='analytic';out.steps=analytic.steps;out.technique='límite analítico';
      if(analytic.diverges){out.diverges=true;out.value='Diverge';return out;}
      if(!Number.isFinite(analytic.value)){out.error='Resultado fuera del rango numérico';return out;}
      out.valueNum=analytic.value;out.exact=toExact(analytic.value);out.value=out.exact||fmtNum(analytic.value,8);return out;
    }
    if(singularA||singularB){out.error='Integral impropia en un extremo: esta familia requiere análisis lateral no disponible.';return out;}
  }

  if (!isFinite(a) || !isFinite(b)) {
    out.improper = true;
    const fn = calcParse(fxStr, varName);
    if (!fn) { out.error = 'Función inválida'; return out; }
    const v = improperIntegral(fn, a, b);
    if (v === null) { out.error='Transformación numérica no finita; convergencia no demostrada'; return out; }
    out.valueNum = v;
    out.value = fmtNum(v, 8);
    const coarse=improperIntegral(fn,a,b,{n:5000});
    out.refinementDifference=coarse===null?null:Math.abs(v-coarse);
    out.proof='numerical';out.steps.push('Transformación numérica en intervalo infinito; la diferencia entre mallas no demuestra convergencia ni es cota de error.');
    return out;
  }

  const ia = integrate(fxStr, varName);
  // Control del dominio muestreado, también antes de F(b)−F(a).
  for(let i=1;i<1000;i++)if(!Number.isFinite(parsed(a+(b-a)*i/1000,0))) {out.error='La función original sale del dominio real dentro del intervalo';return out;}
  if (ia.ast) {
    out.antiderivative = ia.result;
    out.technique = ia.technique;
    out.steps = ia.steps.slice();
    const Fb = evalAt(ia.ast, varName, b);
    const Fa = evalAt(ia.ast, varName, a);
    if (Fb !== null && Fa !== null && isFinite(Fb) && isFinite(Fa)) {
      const v = Fb - Fa;
      out.valueNum = v;
      out.proof='antiderivative';
      out.exact = toExact(v);
      out.value = out.exact || fmtNum(v, 8);
      return out;
    }
  }

  const fn = calcParse(fxStr, varName);
  if (!fn) { out.error = 'Función inválida'; return out; }
  const v = simpsonIntegral(fn, a, b);
  if(!Number.isFinite(v)){out.error='La integral numérica no es finita; revisa dominio y singularidades';return out;}
  out.valueNum = v;
  out.proof='numerical';out.refinementDifference=Math.abs(v-simpsonIntegral(fn,a,b,500));
  out.value = fmtNum(v, 8);
  out.steps.push('Simpson numérico; comprobar el dominio completo. La diferencia entre mallas no certifica el error.');
  return out;
}
