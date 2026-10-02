import { astToPoly, polyAdd, polyEval, polyMul, polyScale, polySub, polyToAst } from './polynomials.mjs';
import { definiteIntegral } from './definite.mjs';
import { parseExpr, tokenize } from '../calculus/parser.mjs';
import { pretty } from './format.mjs';

// Certifica el signo de cuadráticas con extremos y vértice; evita inferir la
// sección simbólica del giro a partir de muestras.
export function polynomialRevolutionEvaluation(first,second,a,b,axis='x',offset=0) {
  if(!Number.isFinite(a)||!Number.isFinite(b)||a>=b||!Number.isFinite(offset)||!['x','y'].includes(axis))return null;
  let f,g;
  try {f=astToPoly(parseExpr(tokenize(first)),'x');g=astToPoly(parseExpr(tokenize(second||'0')),'x');}catch{return null;}
  if(!f||!g||f.length>3||g.length>3)return null;
  const sign=p=>{
    const points=[a,b];if(p.length===3&&p[2]!==0){const vertex=-p[1]/(2*p[2]);if(vertex>a&&vertex<b)points.push(vertex);}
    const values=points.map(x=>polyEval(p,x));
    if(values.some(value=>!Number.isFinite(value)))return 0;
    return Math.min(...values)>=0?1:Math.max(...values)<=0?-1:0;
  };
  let section;
  if(axis==='y') {
    const radius=[-offset,1],height=polySub(f,g),sr=sign(radius),sh=sign(height);
    if(!sr||!sh)return null;
    section=polyScale(polyMul(radius,height),2*sr*sh);
  }else {
    const F=polySub(f,[offset]),G=polySub(g,[offset]),sF=sign(F),sG=sign(G);
    const differenceSign=sign(polySub(F,G)),sumSign=sign(polyAdd(F,G));
    if(!sF||!sG||!differenceSign||!sumSign)return null;
    const fOuter=differenceSign*sumSign>=0,outer=fOuter?F:G,inner=fOuter?G:F;
    section=sF*sG<0?polyMul(outer,outer):polySub(polyMul(outer,outer),polyMul(inner,inner));
  }
  const expression=pretty(polyToAst(section,'x'),'x'),result=definiteIntegral(expression,a,b);
  if(!result.antiderivative||!Number.isFinite(result.valueNum))return null;
  return {section:`π·(${expression})`,antiderivative:`π·(${result.antiderivative})`,value:Math.PI*result.valueNum,
    evaluation:`π·[F(${b})−F(${a})] = π·(${result.value})`,
    assumption:'Funciones polinómicas hasta grado 2; signos de radios/altura verificados en extremos y vértices del intervalo.'};
}
