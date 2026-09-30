// Álgebra: términos y progresiones sin dependencia del navegador.
import { calcParse, normalizeExpression } from '../expression.mjs';

const IDENTIFIERS=new Set(['n','e','sin','cos','tan','asin','acos','atan','sinh','cosh','tanh','ln','log','sqrt','abs','exp']);

function compileSequenceTerm(exprStr){
  const expression=normalizeExpression(exprStr);
  if(!expression || expression.length>160 || !/^[\w\s.π+\-*/^()]+$/.test(expression) || /\.[a-zA-Z_]/.test(expression)) return null;
  const words=expression.match(/[a-zA-Z][a-zA-Z0-9_]*/g)||[];
  if(words.some(word=>!IDENTIFIERS.has(word))) return null;
  return calcParse(expression,'n');
}

function evalTermN(exprStr,nVal){
  if(!Number.isFinite(nVal) || nVal<=0) return NaN;
  const fn=compileSequenceTerm(exprStr);
  if(!fn) return NaN;
  try { return fn(nVal); } catch { return NaN; }
}

function stripParens(value){
  let s=value.trim();
  while(s.startsWith('(') && s.endsWith(')')){
    let depth=0, closesAtEnd=true;
    for(let i=0;i<s.length;i++){
      if(s[i]==='(') depth++;
      if(s[i]===')') depth--;
      if(depth===0 && i<s.length-1){ closesAtEnd=false; break; }
      if(depth<0) return s;
    }
    if(!closesAtEnd || depth!==0) break;
    s=s.slice(1,-1).trim();
  }
  return s;
}

function topLevelSplit(value,operator){
  let depth=0, index=-1;
  for(let i=0;i<value.length;i++){
    if(value[i]==='(') depth++;
    else if(value[i]===')') depth--;
    else if(value[i]===operator && depth===0){
      if(index!==-1) return null;
      index=i;
    }
    if(depth<0) return null;
  }
  if(depth!==0 || index<=0 || index>=value.length-1) return null;
  return [value.slice(0,index),value.slice(index+1)];
}

// Polinomios escritos como suma de monomios a·n^k, con k entero entre 0 y 8.
function polynomialTerms(value,variable='n'){
  const source=stripParens(value).replace(/\s+/g,'');
  if(!/^[\da-zA-Z.n*^+\-]+$/.test(source) || !source || source.includes('++') || source.includes('--')) return null;
  const chunks=source.match(/[+-]?[^+-]+/g);
  if(!chunks || chunks.join('')!==source) return null;
  const coefficients=new Map();
  for(const chunk of chunks){
    const sign=chunk[0]==='-'?-1:1;
    const body=chunk.replace(/^[+-]/,'');
    const term=new RegExp(String.raw`^(?:(\d+(?:\.\d+)?|\.\d+)\*?)?${variable}(?:\^([0-8]))?$`).exec(body);
    const constant=/^(\d+(?:\.\d+)?|\.\d+)$/.exec(body);
    if(!term && !constant) return null;
    const power=term?Number(term[2]??1):0;
    const coefficient=sign*(term?(term[1]?Number(term[1]):1):Number(constant[1]));
    coefficients.set(power,(coefficients.get(power)||0)+coefficient);
  }
  const degrees=[...coefficients.keys()].filter(k=>coefficients.get(k)!==0);
  const degree=degrees.length?Math.max(...degrees):-1;
  return {degree,leading:degree<0?0:coefficients.get(degree)};
}

function exponentialLimit(expression){
  const split=topLevelSplit(expression,'^');
  if(!split) return null;
  const base=stripParens(split[0]), exponent=stripParens(split[1]);
  const baseMatch=/^1([+-])(.+)$/.exec(base);
  const expMatch=/^(?:(\d+(?:\.\d+)?|\.\d+)\*?)?n$/.exec(exponent);
  if(!baseMatch || !expMatch) return null;
  const fraction=stripParens(baseMatch[2]);
  const fracMatch=/^(\d+(?:\.\d+)?|\.\d+)\/(.+)$/.exec(fraction);
  if(!fracMatch) return null;
  const denominator=stripParens(fracMatch[2]);
  const denMatch=/^(?:(\d+(?:\.\d+)?|\.\d+)\*?)?n$/.exec(denominator);
  if(!denMatch) return null;
  const divisor=Number(denMatch[1]||1);
  if(divisor===0) return null;
  const c=(baseMatch[1]==='-'?-1:1)*Number(fracMatch[1])/divisor;
  const k=Number(expMatch[1]||1);
  const power=c*k;
  if(!Number.isFinite(power) || !Number.isFinite(Math.exp(power))) return null;
  return {status:'demostrado',method:'exponencial',value:Math.exp(power),exact:`e^(${power})`,
    steps:[`La base es 1 + (${c})/n y el exponente es ${k}n.`,
      `ln(aₙ) = ${k}n·ln(1 + (${c})/n) → ${power}, porque ln(1+u)/u → 1.`,
      `Por continuidad de exp, aₙ → e^(${power}).`],
    assumptions:'n entero positivo suficientemente grande para que la base sea positiva.'};
}

function squeezeTrigLimit(split){
  if(!split) return null;
  const numerator=stripParens(split[0]);
  let depth=0, separator=-1;
  for(let i=1;i<numerator.length;i++){
    if(numerator[i]==='(') depth++;
    else if(numerator[i]===')') depth--;
    else if(depth===0 && (numerator[i]==='+' || numerator[i]==='-')) separator=i;
  }
  if(separator<1) return null;
  const polynomial=polynomialTerms(numerator.slice(0,separator));
  const denominator=polynomialTerms(split[1]);
  const trig=/^([+-])(?:(\d+(?:\.\d+)?|\.\d+)\*?)?(sin|cos)\(n\)$/.exec(numerator.slice(separator));
  if(!polynomial || !denominator || denominator.degree!==1 || polynomial.degree>1 || !trig) return null;
  const coefficient=(trig[1]==='-'?-1:1)*Number(trig[2]||1);
  const lead=polynomial.degree===1?polynomial.leading:0;
  const value=lead/denominator.leading;
  if(!Number.isFinite(value)) return null;
  const denText=stripParens(split[1]);
  return {status:'demostrado',method:'encaje',value,exact:String(value),
    steps:[`Separar el término racional lineal y el término ${trig[3]}(n).`,
      `Como −1 ≤ ${trig[3]}(n) ≤ 1, |${coefficient}·${trig[3]}(n)/(${denText})| ≤ ${Math.abs(coefficient)}/|${denText}| → 0.`,
      `El cociente de los términos lineales tiende a ${lead}/${denominator.leading} = ${value}; por el teorema del encaje, aₙ → ${value}.`],
    assumptions:'n entero positivo; el denominador lineal no es cero para n suficientemente grande.'};
}

export function polynomialQuotientLimit(exprStr,variable='n'){
  if(!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(variable)) return {status:'invalido',reason:'Variable inválida.'};
  const expression=stripParens(normalizeExpression(exprStr).replace(/\s+/g,''));
  const split=topLevelSplit(expression,'/');
  if(split && [split[0],split[1]].some(part=>!part.startsWith('(') && /[+-]/.test(part.slice(1)))){
    return {status:'no-soportado',reason:'Agrupa con paréntesis el numerador y el denominador completos.'};
  }
  const numerator=polynomialTerms(split?split[0]:expression,variable);
  const denominator=split?polynomialTerms(split[1],variable):{degree:0,leading:1};
  if(!numerator || !denominator) return {status:'no-soportado',reason:'La muestra de términos no demuestra el límite de esta expresión.'};
  if(denominator.degree<0) return {status:'invalido',reason:'El denominador es el polinomio cero.'};
  const difference=numerator.degree-denominator.degree;
  const ratio=numerator.leading/denominator.leading;
  const value=numerator.degree<0 || difference<0?0:difference===0?ratio:(ratio>0?Infinity:-Infinity);
  const exact=Number.isFinite(value)?String(value):value>0?'+∞':'−∞';
  const lead=numerator.degree<0?'0':`${numerator.leading}${variable}^${numerator.degree}`;
  const denLead=`${denominator.leading}${variable}^${denominator.degree}`;
  return {status:'demostrado',method:'polinomios',value,exact,
    steps:[`Grados: numerador ${numerator.degree<0?'cero':numerator.degree}; denominador ${denominator.degree}.`,
      `Para ${variable} grande y positivo, los términos dominantes son ${lead} y ${denLead}.`,
      difference===0?`Los grados son iguales: el límite es el cociente de coeficientes principales, ${numerator.leading}/${denominator.leading} = ${exact}.`:
        difference<0?`El denominador tiene mayor grado: el cociente tiende a 0.`:
          `El numerador tiene mayor grado: el cociente crece como (${ratio})${variable}^${difference} y tiende a ${exact}.`],
    assumptions:`${variable} tiende a +∞; el denominador debe ser distinto de cero. Sus posibles raíces aisladas no afectan el límite.`};
}

export function sequenceLimit(exprStr){
  if(!compileSequenceTerm(exprStr)) return {status:'invalido',reason:'Expresión inválida o con variables/funciones no admitidas.'};
  const expression=stripParens(normalizeExpression(exprStr).replace(/\s+/g,''));
  const exponential=exponentialLimit(expression);
  if(exponential) return exponential;
  const split=topLevelSplit(expression,'/');
  const polynomial=polynomialQuotientLimit(expression);
  if(polynomial.reason==='Agrupa con paréntesis el numerador y el denominador completos.') return polynomial;
  const squeeze=squeezeTrigLimit(split);
  if(squeeze) return squeeze;
  if(polynomial.status==='demostrado') polynomial.assumptions='n entero positivo; el denominador debe ser distinto de cero. Sus posibles raíces aisladas no afectan el límite.';
  return polynomial;
}

export function radicalRecurrence(c,a1,count=6){
  if(!Number.isFinite(c)||c<=0||c>1e6||!Number.isFinite(a1)||a1<0||a1>1e9||
    !Number.isInteger(count)||count<1||count>20){
    return {status:'invalido',reason:'Usa c en (0, 10⁶], a₁ en [0, 10⁹] y entre 1 y 20 términos.'};
  }
  const limit=(1+Math.sqrt(1+4*c))/2;
  const direction=a1<limit?'creciente':a1>limit?'decreciente':'constante';
  const terms=[a1];
  for(let i=1;i<count;i++) terms.push(Math.sqrt(c+terms.at(-1)));
  return {status:'demostrado',limit,direction,terms,
    steps:[`Si L = √(${c} + L), entonces L² − L − ${c} = 0. La única raíz no negativa es L = (1 + √(1 + 4·${c}))/2 = ${limit}.`,
      `f(x)=√(${c}+x) es creciente para x≥0 y f(L)=L. Además f(x)≥x si 0≤x≤L, y f(x)≤x si x≥L.`,
      a1<limit?`Como a₁=${a1}<L, por inducción 0≤aₙ≤L y aₙ₊₁≥aₙ: la sucesión es creciente y acotada.`:
        a1>limit?`Como a₁=${a1}>L, por inducción aₙ≥L y aₙ₊₁≤aₙ: la sucesión es decreciente y acotada.`:
          `Como a₁=L, todos los términos son L.`,
      `Por convergencia monótona y continuidad de f, el límite satisface L=f(L); por unicidad no negativa, es ${limit}.`],
    assumptions:'c>0, a₁≥0 y raíz cuadrada principal. La conclusión vale para cualquier cantidad de términos mostrados.'};
}

function seqClassify(terms){
  if(terms.length<2) return '—';
  if(terms.some(t=>!Number.isFinite(t))) return 'No determinada: hay términos no finitos';
  const diffs=terms.slice(1).map((t,i)=>t-terms[i]);
  if(diffs.every(d=>Math.abs(d)<1e-9)) return 'Constante';
  const altSign=terms.every((t,i)=>i===0||t*terms[i-1]<0);
  if(diffs.every(d=>d>1e-9)) return 'Creciente';
  if(diffs.every(d=>d<-1e-9)) return 'Decreciente';
  if(altSign) return 'Alternante';
  return 'No monótona';
}

function detectProgression(terms){
  if(terms.length<2) return null;
  const diffs=terms.slice(1).map((t,i)=>t-terms[i]);
  const d0=diffs[0];
  if(diffs.every(d=>Math.abs(d-d0)<1e-6)) return {kind:'pa',value:d0};
  const ratios=terms.slice(1).map((t,i)=>Math.abs(terms[i])>1e-12?t/terms[i]:NaN);
  const r0=ratios[0];
  if(ratios.every(r=>isFinite(r)&&Math.abs(r-r0)<1e-6)) return {kind:'pg',value:r0};
  return null;
}

function arithmeticProgression(a1,d,n){
  const an=a1+(n-1)*d, sn=n*(a1+an)/2;
  const terms=Array.from({length:Math.min(n,8)},(_,i)=>a1+i*d);
  return {an,sn,terms};
}

function geometricProgression(a1,r,n){
  if(a1===0) return {an:0,sn:0,sInf:0,terms:Array.from({length:Math.min(n,8)},()=>0)};
  const an=a1*Math.pow(r,n-1);
  const sn=Math.abs(r-1)<1e-12?a1*n:a1*(1-Math.pow(r,n))/(1-r);
  const sInf=a1===0?0:Math.abs(r)<1?a1/(1-r):NaN;
  const terms=Array.from({length:Math.min(n,8)},(_,i)=>a1*Math.pow(r,i));
  return {an,sn,sInf,terms};
}

export { compileSequenceTerm, evalTermN, seqClassify, detectProgression, arithmeticProgression, geometricProgression };
