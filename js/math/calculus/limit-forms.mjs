import { astToStr } from './printer.mjs';
import { calcParse, normalizeExpression } from '../expression.mjs';
import { diffAST } from './derivatives.mjs';
import { evalAt, simplify } from './ast.mjs';
import { fmtNum, toExact } from './format.mjs';
import { parseExpr, tokenize } from './parser.mjs';

// Sólo para límites: la notación polinómica a/b+c puede significar
// (polinomio)/(polinomio). Fuera de ese contexto se conserva la precedencia JS.
export function groupPolynomialQuotient(expr,varName='x'){
  if(!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(varName)) return expr;
  const {idx,str}=findTopSlash(expr);
  if(idx<0 || str.indexOf('/',idx+1)!==-1) return expr;
  const numerator=str.slice(0,idx).trim(), denominator=str.slice(idx+1).trim();
  const poly=new RegExp(`^[\\d\\s.+*^${varName}-]+$`);
  if(!poly.test(numerator)||!poly.test(denominator)||
    !/[+-]/.test(denominator.slice(1)) ||
    numerator.startsWith('(')||denominator.startsWith('(')) return expr;
  return `(${numerator})/(${denominator})`;
}

// ═══════════════════════════════════════════════════════
// DERIVACIÓN SIMBÓLICA
// Motor basado en árbol de expresión (parse → diff → simplify → print)
// Cubre: potencias, polinomios, trig, log, exp, productos, cocientes, cadena
// ═══════════════════════════════════════════════════════

// ── Aproximación numérica lateral ──
export function approach(fn,a,dir){
  if(!isFinite(a)){
    const pts=[1e3,1e4,1e5,1e6];
    const v=pts.map(s=>{try{const r=fn(dir>0?s:-s,0);return isFinite(r)?r:null;}catch{return null;}});
    const f=v.filter(x=>x!==null); return f.length?f[f.length-1]:NaN;
  }
  const hs=[1e-3,1e-4,1e-5,1e-6,1e-7,1e-8];
  const v=hs.map(h=>{try{const r=fn(a+dir*h,0);return isFinite(r)?r:null;}catch{return null;}});
  const f=v.filter(x=>x!==null); return f.length?f[f.length-1]:NaN;
}

// ── Derivadas numéricas ──
function nd(fn,a,h=1e-7){ return (fn(a+h,0)-fn(a-h,0))/(2*h); }
function nd2(fn,a,h=1e-6){ return (fn(a+h,0)-2*fn(a,0)+fn(a-h,0))/(h*h); }

// ── Índice de '/' en nivel 0 de paréntesis ──
export function findTopSlash(s){
  // Si la expresión está envuelta en paréntesis externos, quitarlos para buscar el /
  function stripOuter(str){
    str=str.trim();
    if(str[0]!=='(') return str;
    let d=0;
    for(let i=0;i<str.length;i++){
      if(str[i]==='(') d++; else if(str[i]===')') d--;
      if(d===0) return i===str.length-1 ? str.slice(1,-1) : str;
    }
    return str;
  }
  const inner=stripOuter(s);
  // Buscar / en nivel 0 del inner
  let d=0;
  for(let i=0;i<inner.length;i++){
    if(inner[i]==='(') d++; else if(inner[i]===')') d--;
    else if(inner[i]==='/'&&d===0) return {idx:i, str:inner};
  }
  return {idx:-1, str:s};
}

// ── Sustitución visual: reemplaza x por el valor para mostrar pasos ──
export function visSubstitute(fxStr, a, varName='x'){
  let aFmt;
  if(Number.isInteger(a)) aFmt=String(a);
  else if(Math.abs(a-Math.PI)<1e-9)     aFmt='π';
  else if(Math.abs(a-Math.PI/4)<1e-9)   aFmt='π/4';
  else if(Math.abs(a-Math.PI/2)<1e-9)   aFmt='π/2';
  else if(Math.abs(a-2*Math.PI)<1e-9)   aFmt='2π';
  else if(Math.abs(a-Math.E)<1e-9)      aFmt='e';
  else if(Math.abs(a-Math.SQRT2)<1e-9)  aFmt='√2';
  else aFmt=parseFloat(a.toFixed(4)).toString();
  const needsParen=a<0||aFmt.includes('/');
  const aN=needsParen?'('+aFmt+')':aFmt;
  const escaped=varName.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return fxStr.replace(new RegExp(`(?<![a-zA-Z_])${escaped}(?![a-zA-Z0-9_])`,'g'),(match,offset)=>
    /\d/.test(fxStr[offset-1]||'')?'·'+aN:aN);
}


export function resolveIndet(fxStr,a,stepsOut,varName='x'){
  const fn=calcParse(fxStr,varName); if(!fn) return NaN;
  const {idx, str:normStr}=findTopSlash(fxStr);

  if(idx>0){
    const numStr=normStr.slice(0,idx).trim();
    const denStr=normStr.slice(idx+1).trim();
    const fnN=calcParse(numStr,varName), fnD=calcParse(denStr,varName);
    if(!fnN||!fnD) return NaN;

    // L'Hôpital orden 1
    const na_=nd(fnN,a), da_=nd(fnD,a);
    stepsOut.push({tipo:'lhopital',orden:1,numStr,denStr,numDeriv:na_,denDeriv:da_,
      result:Math.abs(da_)>1e-12?na_/da_:NaN});
    if(isFinite(da_)&&Math.abs(da_)>1e-12){
      const r=na_/da_; if(isFinite(r)) return r;
    }
    // L'Hôpital orden 2
    if(Math.abs(na_)<1e-9&&Math.abs(da_)<1e-9){
      const na__=nd2(fnN,a), da__=nd2(fnD,a);
      stepsOut.push({tipo:'lhopital',orden:2,numDeriv:na__,denDeriv:da__,
        result:Math.abs(da__)>1e-12?na__/da__:NaN});
      if(isFinite(da__)&&Math.abs(da__)>1e-12){
        const r=na__/da__; if(isFinite(r)) return r;
      }
    }
    // Cancelación numérica del factor (x-a)
    const qN=(x)=>Math.abs(x-a)<1e-15?nd(fnN,a):fnN(x,0)/(x-a);
    const qD=(x)=>Math.abs(x-a)<1e-15?nd(fnD,a):fnD(x,0)/(x-a);
    const qna=qN(a+1e-7), qda=qD(a+1e-7);
    if(isFinite(qna)&&isFinite(qda)&&Math.abs(qda)>1e-12){
      stepsOut.push({tipo:'cancelacion',qnum:qna,qden:qda,result:qna/qda});
      return qna/qda;
    }
  } else {
    const fp=nd(fn,a);
    stepsOut.push({tipo:'lhopital_simple',fp,result:fp});
    if(isFinite(fp)) return fp;
  }
  const vr=approach(fn,a,1), vl=approach(fn,a,-1);
  if(isFinite(vr)&&isFinite(vl)&&Math.abs(vr-vl)<1e-4) return (vr+vl)/2;
  return NaN;
}

// Constante numérica directa (num o neg·num); null en otro caso.
function constOf(node){
  if(!node) return null;
  if(node.type==='num') return node.val;
  if(node.type==='neg'&&node.arg.type==='num') return -node.arg.val;
  return null;
}

// Determina si node ≈ a·v + b con a,b constantes; null en otro caso.
function linearOfExpr(node, v){
  if(!node) return null;
  switch(node.type){
    case 'num': return {a:0,b:node.val};
    case 'var': return node.val===v?{a:1,b:0}:null;
    case 'neg': { const l=linearOfExpr(node.arg,v); return l?{a:-l.a,b:-l.b}:null; }
    case '+': { const L=linearOfExpr(node.left,v),R=linearOfExpr(node.right,v); return (L&&R)?{a:L.a+R.a,b:L.b+R.b}:null; }
    case '-': { const L=linearOfExpr(node.left,v),R=linearOfExpr(node.right,v); return (L&&R)?{a:L.a-R.a,b:L.b-R.b}:null; }
    case '*': {
      const L=linearOfExpr(node.left,v),R=linearOfExpr(node.right,v);
      if(L&&R){
        if(L.a===0) return {a:L.b*R.a,b:L.b*R.b};
        if(R.a===0) return {a:L.a*R.b,b:L.b*R.b};
      }
      return null;
    }
    default: return null;
  }
}

function expStr(ck){
  if(Math.abs(ck-1)<1e-9) return 'e';
  if(Math.abs(ck+1)<1e-9) return '1/e';
  if(Math.abs(ck-Math.round(ck))<1e-9) return 'e^'+Math.round(ck);
  const neg=ck<0, a=Math.abs(ck);
  for(let d=2;d<=12;d++){
    const n=Math.round(a*d);
    if(Math.abs(n/d-a)<1e-9) return 'e^('+(neg?'-':'')+(n===1?'':n)+'/'+d+')';
  }
  return 'e^('+fmtNum(ck,6)+')';
}

// lim_{v→∞} (1 + c/v)^(k·v) = e^(c·k)
export function oneInfinity(fxStr, varName, a){
  if(isFinite(a)) return null;
  let ast;
  try { ast = parseExpr(tokenize(groupPolynomialQuotient(fxStr,varName))); } catch { return null; }
  if(!ast || ast.type!=='^') return null;
  const base=ast.left, exp=ast.right;
  const cOver=(node)=>{
    node=simplify(node);
    if(node.type==='/'){ const nc=constOf(node.left); if(nc!==null && node.right.type==='var' && node.right.val===varName) return nc; }
    if(node.type==='^' && node.left.type==='var' && node.left.val===varName && node.right.type==='num' && node.right.val===-1) return 1;
    if(node.type==='*'){
      const isInv=(n)=>n&&n.type==='^'&&n.left&&n.left.type==='var'&&n.left.val===varName&&n.right&&n.right.type==='num'&&n.right.val===-1;
      if(isInv(node.left)){ const r=constOf(node.right); if(r!==null) return r; }
      if(isInv(node.right)){ const l=constOf(node.left); if(l!==null) return l; }
    }
    return null;
  };
  let c=null;
  if(base.type==='+'){
    if(base.left.type==='num' && Math.abs(base.left.val-1)<1e-12) c=cOver(base.right);
    if(c===null && base.right.type==='num' && Math.abs(base.right.val-1)<1e-12) c=cOver(base.left);
  }
  if(c===null) return null;
  const lin=linearOfExpr(exp, varName);
  if(!lin || lin.b!==0 || lin.a===0) return null;
  const ck=c*lin.a;
  if(!isFinite(ck)) return null;
  return { value: expStr(ck), valueNum: Math.exp(ck) };
}

// Dos formas que pierden precisión por cancelación al muestrear: una raíz
// racionalizable en +∞ y una potencia con base que tiende a 1 en cero.
export function analyticLimitForms(fxStr,a,varName){
  const s=normalizeExpression(fxStr).replace(/\s+/g,'');
  const v=varName;
  const numeric=String.raw`\d+(?:\.\d+)?`;
  if(a===Infinity){
    const root=new RegExp(String.raw`^sqrt\(${v}\^2([+-](?:${numeric})?\*?${v})?([+-]${numeric})?\)-${v}$`).exec(s);
    if(root){
      const raw=root[1]?.slice(0,-v.length).replace('*','')||'';
      const coefficient=raw==='+'?1:raw==='-'?-1:Number(raw||0);
      const valueNum=coefficient/2;
      const value=toExact(valueNum)||fmtNum(valueNum,8);
      const constant=Number(root[2]||0);
      const signed=n=>n>=0?`+${n}`:String(n);
      const radicand=`${v}²${coefficient?signed(coefficient)+v:''}${constant?signed(constant):''}`;
      const numerator=`${coefficient}${v}${constant?signed(constant):''}`;
      const scaledNumerator=`${coefficient}${constant?signed(constant)+`/${v}`:''}`;
      const scaledRoot=`1${coefficient?signed(coefficient)+`/${v}`:''}${constant?signed(constant)+`/${v}²`:''}`;
      return {value,valueNum,detail:
        `Racionalizar: sqrt(${radicand})−${v} = (${numerator})/(sqrt(${radicand})+${v}). `+
        `Como ${v}→+∞, dividir por ${v}>0 da (${scaledNumerator})/(sqrt(${scaledRoot})+1) → ${coefficient}/2 = ${value}.`};
    }
  }
  if(a===0){
    if(new RegExp(String.raw`^1/sin\(${v}\)-1/${v}$`).test(s)){
      return {value:'0',valueNum:0,detail:
        `Unificar: 1/sin(${v})−1/${v} = (${v}−sin(${v}))/(${v}·sin(${v})). `+
        `Como sin(${v})=${v}−${v}³/6+O(${v}⁵), el numerador es O(${v}³) y el denominador es ${v}²+O(${v}⁴); el cociente tiende a 0.`};
    }
    const cosine=new RegExp(String.raw`^cos\(((?:[+-]?${numeric}\*?)?)${v}\)\^\(([+-]?${numeric})\/${v}\^2\)$`).exec(s);
    if(cosine){
      const k=cosine[1]?Number(cosine[1].replace('*','')):1;
      const power=-Number(cosine[2])*k*k/2;
      const valueNum=Math.exp(power);
      if(!Number.isFinite(valueNum)) return null;
      const value=`e^(${toExact(power)||fmtNum(power,8)})`;
      const argument=k===1?v:k===-1?`-${v}`:`${k}${v}`;
      return {value,valueNum,detail:
        `Cerca de 0, cos(${argument})>0. Como cos(u)=1−u²/2+o(u²) y ln(1+w)=w+o(w), `+
        `ln(cos(${argument})^(${cosine[2]}/${v}²)) → ${toExact(power)||fmtNum(power,8)}. `+
        `Por continuidad de exp, el límite es ${value}.`};
    }
  }
  return null;
}

export function nearTrigPole(fxStr,a,varName){
  if(!Number.isFinite(a)) return null;
  const calls=normalizeExpression(fxStr).matchAll(/\b(tan|sec|cot|csc)\(([^()]*)\)/g);
  for(const match of calls){
    const argument=calcParse(match[2],varName);
    if(!argument) continue;
    let angle;
    try{angle=argument(a,0);}catch{continue;}
    if(!Number.isFinite(angle)) continue;
    const denominator=match[1]==='tan'||match[1]==='sec'?Math.cos(angle):Math.sin(angle);
    if(Math.abs(denominator)<1e-10) return match[1];
  }
  return null;
}

// L'Hôpital simbólico para 0/0 y ∞/∞; devuelve valor numérico exacto o null.
export function lHopitalSymbolic(numAST, denAST, varName, a){
  let num=numAST, den=denAST;
  const derivatives=[];
  for(let order=1; order<=4; order++){
    num=simplify(diffAST(num, varName));
    den=simplify(diffAST(den, varName));
    const nv=evalAt(num, varName, a);
    const dv=evalAt(den, varName, a);
    if(nv===null || dv===null) return null;
    derivatives.push({order,numerator:astToStr(num),denominator:astToStr(den),numeratorAt:nv,denominatorAt:dv});
    if(Math.abs(dv)>1e-12 && isFinite(nv) && isFinite(dv)){
      const r=nv/dv;
      if(isFinite(r)) return {value:r,derivatives};
    }
    if(!(Math.abs(nv)<1e-9 && Math.abs(dv)<1e-9)) return null;
  }
  return null;
}

// ── COMPUTE LIMIT ──
// Polo de un cociente de polinomios: D(a) = 0 y N(a) ≠ 0 dan límites laterales infinitos.
function astPolynomial(node,v){
  if(node.type==='num')return [node.val];
  if(node.type==='var')return node.val===v?[0,1]:null;
  if(node.type==='neg'){const p=astPolynomial(node.arg,v);return p&&p.map(c=>-c);}
  if(node.type==='+'||node.type==='-'||node.type==='*'){
    const a=astPolynomial(node.left,v),b=astPolynomial(node.right,v);if(!a||!b)return null;
    if(node.type==='*'){const out=Array(a.length+b.length-1).fill(0);a.forEach((x,i)=>b.forEach((y,j)=>{out[i+j]+=x*y;}));return out;}
    return Array.from({length:Math.max(a.length,b.length)},(_,i)=>(a[i]||0)+(node.type==='+'?1:-1)*(b[i]||0));
  }
  if(node.type==='/'&&node.right.type==='num'&&node.right.val!==0){const a=astPolynomial(node.left,v);return a&&a.map(c=>c/node.right.val);}
  if(node.type==='^'&&node.right.type==='num'&&Number.isInteger(node.right.val)&&node.right.val>=0&&node.right.val<=12){
    const base=astPolynomial(node.left,v);if(!base)return null;let out=[1];
    for(let i=0;i<node.right.val;i++){const next=Array(out.length+base.length-1).fill(0);out.forEach((x,k)=>base.forEach((y,j)=>{next[k+j]+=x*y;}));out=next;}
    return out;
  }
  return null;
}
const polyAt=(p,x)=>p.reduceRight((sum,c)=>sum*x+c,0);
export function rationalPole(fxStr,a,varName){
  if(!Number.isFinite(a))return null;
  let ast;try{ast=parseExpr(tokenize(fxStr));}catch{return null;}
  if(ast.type!=='/')return null;
  const N=astPolynomial(ast.left,varName),D=astPolynomial(ast.right,varName);
  if(!N||!D)return null;
  const scale=Math.max(1,...D.map(Math.abs));
  if(Math.abs(polyAt(D,a))>1e-12*scale||Math.abs(polyAt(N,a))<=1e-12*Math.max(1,...N.map(Math.abs)))return null;
  // Multiplicidad m de a en D por división sintética.
  let q=D.slice(),m=0;
  while(q.length>1&&Math.abs(polyAt(q,a))<=1e-9*Math.max(1,...q.map(Math.abs))&&m<12){
    const out=Array(q.length-1).fill(0);let carry=0;
    for(let i=q.length-1;i>=1;i--){carry=q[i]+carry*a;out[i-1]=carry;}
    q=out;m++;
  }
  const lead=polyAt(N,a)/polyAt(q,a);
  if(!Number.isFinite(lead)||lead===0)return null;
  const right=Math.sign(lead)*Infinity,left=(m%2?-1:1)*right;
  return {m,right,left,lead};
}
