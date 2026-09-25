import { calcParse } from '../expression.mjs';
import { quadRoots, parseSimplePoly } from './polynomial.mjs';

function fnF(v,dp){ return isNaN(v)?'?':Number.isInteger(v)?String(v):parseFloat(v.toFixed(dp||6)).toString(); }

// Devuelve el análisis y los puntos de la gráfica; la interfaz solo los presenta.
export function analyzeFunction(fnType,{a=0,b=0,c=0,d=0,numStr='',denStr=''}={}){
  let domain='',range='',formula='',steps=[],pts=[];

  if(fnType==='lineal'){
    formula=`f(x) = ${a===1?'':(a===-1?'−':fnF(a)+'·')}x ${b>=0?'+ '+fnF(b):'− '+fnF(Math.abs(b))}`;
    domain='(-∞, +∞)'; range=Math.abs(a)<1e-12?`{${fnF(b)}}`:'(-∞, +∞)';
    steps.push('Función lineal — dominio siempre ℝ.');
    if(Math.abs(a)>1e-12){ steps.push(`Cero: x = ${fnF(-b/a)}`); }
    else steps.push('a = 0 → función constante, rango puntual.');
    for(let x=-5;x<=5;x++) pts.push({x,y:a*x+b});
  }
  else if(fnType==='cuad'){
    const vx=-b/(2*a||1e-12), vy=a*vx*vx+b*vx+c;
    formula=`f(x) = ${fnF(a)}x² + ${fnF(b)}x + ${fnF(c)}`;
    domain='(-∞, +∞)';
    range=a>0?`[${fnF(vy)}, +∞)`:`(-∞, ${fnF(vy)}]`;
    steps.push(`Vértice: (${fnF(vx,4)}, ${fnF(vy,4)})`);
    steps.push(a>0?'Parábola ↑ → mínimo en vértice':'Parábola ↓ → máximo en vértice');
    const disc=b*b-4*a*c;
    if(disc>0){ const sq=Math.sqrt(disc); steps.push(`Raíces: x = ${fnF((-b-sq)/(2*a),4)}, x = ${fnF((-b+sq)/(2*a),4)}`); }
    else if(Math.abs(disc)<1e-12) steps.push(`Raíz doble: x = ${fnF(vx,4)}`);
    else steps.push('Sin raíces reales (Δ < 0)');
    for(let x=vx-5;x<=vx+5;x+=0.2) pts.push({x,y:a*x*x+b*x+c});
  }
  else if(fnType==='raiz'){
    formula=`f(x) = √(${fnF(a)}x + ${fnF(b)})`;
    const xMin=-b/(a||1e-12);
    steps.push(`Condición: ${fnF(a)}x + ${fnF(b)} ≥ 0`);
    if(a>0){ domain=`[${fnF(xMin)}, +∞)`; range='[0, +∞)'; steps.push(`x ≥ ${fnF(xMin)}`); }
    else if(a<0){ domain=`(-∞, ${fnF(xMin)}]`; range='[0, +∞)'; steps.push(`x ≤ ${fnF(xMin)}`); }
    else { domain=b>=0?'(-∞,+∞)':'∅'; range=b>=0?'[0,+∞)':'∅'; }
    for(let x=xMin;x<=xMin+10;x+=0.1){ const v=a*x+b; if(v>=0) pts.push({x,y:Math.sqrt(v)}); }
  }
  else if(fnType==='abs'){
    formula=`f(x) = ${fnF(a)}|x + ${fnF(b)}| + ${fnF(c)}`;
    domain='(-∞, +∞)';
    range=a>0?`[${fnF(c)}, +∞)`:`(-∞, ${fnF(c)}]`;
    steps.push(`Vértice: (${fnF(-b)}, ${fnF(c)})`);
    steps.push(a>0?'a > 0 → mínimo':'a < 0 → máximo');
    for(let x=-6;x<=6;x+=0.2) pts.push({x,y:a*Math.abs(x+b)+c});
  }
  else if(fnType==='log'){
    const base=b<=0||b===1?10:b;
    formula=`f(x) = ${fnF(a)}·log_${fnF(base)}(${fnF(c)}x + ${fnF(d)})`;
    const xMin=-d/(c||1e-12);
    steps.push(`Arg > 0: ${fnF(c)}x + ${fnF(d)} > 0`);
    domain=c>0?`(${fnF(xMin)}, +∞)`:c<0?`(-∞, ${fnF(xMin)})`:d>0?'(-∞,+∞)':'∅';
    range='(-∞, +∞)';
    const logB=Math.log(base);
    for(let x=xMin+0.01;x<=xMin+12;x+=0.15){ const arg=c*x+d; if(arg>0) pts.push({x,y:a*Math.log(arg)/logB}); }
  }
  else if(fnType==='exp'){
    const base=b<=0?2:b;
    formula=`f(x) = ${fnF(a)}·${fnF(base)}^(${fnF(c)}x + ${fnF(d)})`;
    domain='(-∞, +∞)'; range=a>0?'(0, +∞)':'(-∞, 0)';
    steps.push('Exponencial — dominio ℝ.');
    steps.push(`Asíntota horizontal: y = 0${a>0?' por abajo':' por arriba'}`);
    for(let x=-4;x<=4;x+=0.2) pts.push({x,y:a*Math.pow(base,c*x+d)});
  }
  else if(fnType==='parteEntera'){
    formula=`f(x) = ${fnF(a)}·⌊${fnF(b)}x + ${fnF(c)}⌋`;
    domain='(-∞, +∞)'; range='ℤ (enteros)';
    steps.push('Dominio ℝ, rango subconjunto de ℤ.');
    for(let x=-5;x<=5;x+=0.05) pts.push({x,y:a*Math.floor(b*x+c)});
  }
  else if(fnType==='racional'){
    formula=`f(x) = (${numStr}) / (${denStr})`;
    const dp=parseSimplePoly(denStr);
    const excl=dp.a!==0?quadRoots(dp.a,dp.b,dp.c):(Math.abs(dp.b)>1e-12?[-dp.c/dp.b]:[]);
    if(!excl.length) domain='(-∞, +∞)';
    else if(excl.length===1) domain=`(-∞, ${fnF(excl[0])}) ∪ (${fnF(excl[0])}, +∞)`;
    else domain=`(-∞,${fnF(excl[0])})∪(${fnF(excl[0])},${fnF(excl[1])})∪(${fnF(excl[1])},+∞)`;
    range='(análisis completo por álgebra)';
    excl.forEach(r=>steps.push(`Q(${fnF(r)}) = 0 → x = ${fnF(r)} excluido`));
    const fn=calcParse(`(${numStr})/(${denStr})`);
    if(fn) for(let x=-8;x<=8;x+=0.05){ const y=fn(x,0); if(isFinite(y)&&Math.abs(y)<60) pts.push({x,y}); }
  }

  return {domain,range,formula,steps,pts};
}
