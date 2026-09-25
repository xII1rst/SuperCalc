import { matFmtNum } from '../../utils/format.mjs';
import { quadRoots, parseSimplePoly } from './polynomial.mjs';

function flipSym(s){ return {'>':'<','<':'>','≥':'≤','≤':'≥'}[s]||s; }
function checkIneq(a,sym,b){ return {'>':a>b,'<':a<b,'≥':a>=b,'≤':a<=b}[sym]; }

function ineqLinearBound(a,b,c,sym){
  const rhs=c-b; let x=rhs/(a||1), s=sym;
  if(a<0) s=flipSym(sym);
  return {val:x,sym:s};
}

function ineqIntersect(s1,s2){
  const bounds=[s1,s2];
  const lower=bounds.filter(bound=>bound.sym==='>'||bound.sym==='≥');
  const upper=bounds.filter(bound=>bound.sym==='<'||bound.sym==='≤');
  const lo=lower.length?Math.max(...lower.map(bound=>bound.val)):-Infinity;
  const hi=upper.length?Math.min(...upper.map(bound=>bound.val)):Infinity;
  const loClosed=lower.filter(bound=>bound.val===lo).every(bound=>bound.sym==='≥');
  const hiClosed=upper.filter(bound=>bound.val===hi).every(bound=>bound.sym==='≤');
  if(lo>hi || (lo===hi && !(loClosed&&hiClosed))) return null;
  const loS=isFinite(lo)?matFmtNum(lo):'-∞', hiS=isFinite(hi)?matFmtNum(hi):'+∞';
  const loBr=isFinite(lo)&&loClosed?'[':'(';
  const hiBr=isFinite(hi)&&hiClosed?']':')';
  return `${loBr}${loS}, ${hiS}${hiBr}`;
}

function ineqEval(exprStr, x){
  try{
    const code=exprStr.trim()
      .replace(/\^/g,'**')
      .replace(/π/g,'Math.PI')
      .replace(/\bsqrt\b/g,'Math.sqrt')
      .replace(/\babs\b/g,'Math.abs')
      .replace(/(?<![a-zA-Z\.])ln\b/g,'Math.log')
      .replace(/(?<![a-zA-Z])e(?![a-zA-Z0-9_])/g,'Math.E')
      .replace(/(\d)\s*\(/g,'$1*(')
      .replace(/\)\s*\(/g,')*(')
      .replace(/(\d)x/g,'$1*x')
      .replace(/\bx\b/g,'('+x+')');
    return Function('"use strict"; return ('+code+');')();
  }catch(e){ return NaN; }
}

function signTableSolve(numRoots, denRoots, numLead, denLead, sym){
  const crits=[...numRoots.map(v=>({v,type:'N'})),...denRoots.map(v=>({v,type:'D'}))]
    .sort((a,b)=>a.v-b.v)
    .filter((c,i,arr)=>i===0||Math.abs(c.v-arr[i-1].v)>1e-9);

  const allPts=[-Infinity,...crits.map(c=>c.v),Infinity];
  const solParts=[];
  const closed=(sym==='≤'||sym==='≥');
  const denSet=new Set(denRoots.map(r=>matFmtNum(r)));

  for(let i=0;i<allPts.length-1;i++){
    const lo=allPts[i], hi=allPts[i+1];
    const mid=isFinite(lo)&&isFinite(hi)?(lo+hi)/2:isFinite(lo)?lo+1:isFinite(hi)?hi-1:0;
    let sn=numLead>0?1:-1; numRoots.forEach(r=>{ if(mid<r) sn*=-1; });
    let sd=denLead>0?1:-1; denRoots.forEach(r=>{ if(mid<r) sd*=-1; });
    const sc=sn*sd;
    if(checkIneq(sc,sym,0)){
      const isLoNum=isFinite(lo)&&!denSet.has(matFmtNum(lo));
      const isHiNum=isFinite(hi)&&!denSet.has(matFmtNum(hi));
      const lBr=isFinite(lo)?(closed&&isLoNum?'[':'('):'(';
      const rBr=isFinite(hi)?(closed&&isHiNum?']':')'):')';
      solParts.push(lBr+(isFinite(lo)?matFmtNum(lo):'-∞')+', '+(isFinite(hi)?matFmtNum(hi):'+∞')+rBr);
    }
  }
  return solParts.length?solParts.join(' ∪ '):'∅ (sin solución)';
}

function solveFreeInequality(lhsStr,rhsStr,sym){
  const steps=[
    `Inecuación: ${lhsStr} ${sym} ${rhsStr}`,
    `Pasando todo al lado izquierdo: h(x) = (${lhsStr}) − (${rhsStr}) ${sym} 0`,
  ];
  const N=2000, a=-20, b=20, dx=(b-a)/N;
  const hx=x=>{ const l=ineqEval(lhsStr,x), r=ineqEval(rhsStr,x); return isFinite(l)&&isFinite(r)?l-r:NaN; };
  const roots=[];
  let prev=hx(a);
  for(let i=1;i<=N;i++){
    const x=a+i*dx, cur=hx(x);
    if(isFinite(cur)&&Math.abs(cur)<1e-10&&isFinite(prev)&&Math.abs(prev)>=1e-10
      &&!roots.some(r=>Math.abs(r-x)<1e-6)) roots.push(x);
    if(isFinite(prev)&&isFinite(cur)&&prev*cur<0){
      let lo=x-dx, hi=x, fl=prev;
      for(let j=0;j<30;j++){
        const mid=(lo+hi)/2, fm=hx(mid);
        if(!isFinite(fm)) break;
        if(fl*fm<=0) hi=mid; else { lo=mid; fl=fm; }
      }
      const root=(lo+hi)/2;
      if(!roots.some(r=>Math.abs(r-root)<1e-6)) roots.push(root);
    }
    prev=cur;
  }
  roots.sort((x,y)=>x-y);
  steps.push(`Raíces de h(x): ${roots.length?roots.map(r=>matFmtNum(r)).join(', '):'ninguna en [-20, 20]'}`);
  const allPts=[-Infinity,...roots,Infinity], solParts=[];
  for(let i=0;i<allPts.length-1;i++){
    const lo=allPts[i], hi=allPts[i+1];
    const mid=isFinite(lo)&&isFinite(hi)?(lo+hi)/2:isFinite(lo)?lo+1:isFinite(hi)?hi-1:0;
    const val=hx(mid);
    if(!isFinite(val)||!checkIneq(val,sym,0)) continue;
    const closed=(sym==='≤'||sym==='≥');
    const lBr=isFinite(lo)?(closed?'[':'('):'(';
    const rBr=isFinite(hi)?(closed?']':')'):')';
    const lStr=isFinite(lo)?matFmtNum(lo):'-∞';
    const rStr=isFinite(hi)?matFmtNum(hi):'+∞';
    solParts.push(lBr+lStr+', '+rStr+rBr);
  }
  const sol=solParts.length?solParts.join(' ∪ '):'∅ (sin solución en [-20, 20])';
  steps.push('Evaluando signo de h(x) en cada intervalo...');
  return {expr:`${lhsStr} ${sym} ${rhsStr}`,sol,steps,marks:roots.map(val=>({val,sym:'root'}))};
}

function solveQuadraticInequality(a,b,c,sym){
  const disc=b*b-4*a*c;
  const steps=[`${a}x² + ${b}x + ${c} ${sym} 0`, `Discriminante: Δ = b²−4ac = ${matFmtNum(disc)}`];
  let sol, roots=[];
  if(disc<0){
    const alwaysPos=a>0;
    if((sym==='>'||sym==='≥')===alwaysPos){ sol='x ∈ ℝ'; steps.push('Δ<0 — parábola siempre '+(a>0?'positiva':'negativa')+' → toda la recta'); }
    else { sol='∅ (sin solución)'; steps.push('Δ<0 — parábola siempre '+(a>0?'positiva':'negativa')+' → no cumple'); }
  } else if(Math.abs(disc)<1e-12){
    const r=-b/(2*a); roots=[r];
    steps.push(`Raíz doble: x = ${matFmtNum(r)}`);
    const wantsPositive=sym==='>'||sym==='≥';
    const strict=sym==='<'||sym==='>';
    if(wantsPositive===(a>0)) sol=strict?`x ∈ ℝ \\ {${matFmtNum(r)}}`:'x ∈ ℝ';
    else sol=strict?'∅ (sin solución)':`x = ${matFmtNum(r)}`;
  } else {
    const r1=(-b-Math.sqrt(disc))/(2*a), r2=(-b+Math.sqrt(disc))/(2*a);
    const lo=Math.min(r1,r2), hi=Math.max(r1,r2);
    roots=[lo,hi];
    steps.push(`Raíces: x₁ = ${matFmtNum(lo)},  x₂ = ${matFmtNum(hi)}`);
    const inside=(sym==='<'||sym==='≤');
    const closed=(sym==='≤'||sym==='≥');
    if((a>0&&inside)||(a<0&&!inside)){
      sol=`${closed?'[':'('}${matFmtNum(lo)}, ${matFmtNum(hi)}${closed?']':')'}`;
      steps.push(`a${a>0?'>':'<'}0 → solución interior`);
    } else {
      sol=`(-∞, ${matFmtNum(lo)}${closed?']':')'} ∪ ${closed?'[':'('}${matFmtNum(hi)}, +∞)`;
      steps.push(`a${a>0?'>':'<'}0 → solución exterior`);
    }
  }
  return {expr:`${a}x² + ${b}x + ${c} ${sym} 0`,sol,steps,marks:roots.map(val=>({val,sym:'root'}))};
}

function solveRationalInequality(numStr,denStr,sym){
  const num=parseSimplePoly(numStr), den=parseSimplePoly(denStr);
  const numRoots=quadRoots(num.a,num.b,num.c);
  const denRoots=quadRoots(den.a,den.b,den.c);
  const numLead=num.a||num.b||1, denLead=den.a||den.b||1;
  const steps=[
    `Inecuación: (${numStr}) / (${denStr}) ${sym} 0`,
    `Raíces del num: ${numRoots.length?numRoots.map(matFmtNum).join(', '):'ninguna real'}`,
    `Raíces del den (excluidas): ${denRoots.length?denRoots.map(matFmtNum).join(', '):'ninguna'}`,
    'Tabla de signos por intervalos:',
  ];
  const allCrits=[...numRoots.map(v=>({v,t:'N'})),...denRoots.map(v=>({v,t:'D'}))]
    .sort((a,b)=>a.v-b.v);
  if(allCrits.length){
    const allPts=[-Infinity,...allCrits.map(c=>c.v),Infinity];
    for(let i=0;i<allPts.length-1;i++){
      const lo=allPts[i],hi=allPts[i+1];
      const mid=isFinite(lo)&&isFinite(hi)?(lo+hi)/2:isFinite(lo)?lo+1:hi-1;
      let sn=numLead>0?1:-1; numRoots.forEach(r=>{ if(mid<r) sn*=-1; });
      let sd=denLead>0?1:-1; denRoots.forEach(r=>{ if(mid<r) sd*=-1; });
      const sc=sn*sd;
      const lbl=isFinite(lo)?matFmtNum(lo):'-∞';
      const sat=checkIneq(sc,sym,0);
      steps.push(`  (${lbl}, ${isFinite(hi)?matFmtNum(hi):'+∞'}) → signo = ${sc>0?'+':'−'} → ${sat?'✓':'✗'}`);
    }
  }
  const sol=signTableSolve(numRoots,denRoots,numLead,denLead,sym);
  return {expr:`(${numStr}) / (${denStr}) ${sym} 0`,sol,steps,
    marks:[...numRoots,...denRoots].map(val=>({val,sym:'root'}))};
}

function solveSystemInequality(first,second){
  const {a:a1,b:b1,c:c1,sym:s1}=first, {a:a2,b:b2,c:c2,sym:s2}=second;
  const steps=[`I₁: ${a1}x + ${b1} ${s1} ${c1}`, `I₂: ${a2}x + ${b2} ${s2} ${c2}`];
  const r1=ineqLinearBound(a1,b1,c1,s1), r2=ineqLinearBound(a2,b2,c2,s2);
  steps.push(`I₁ → x ${r1.sym} ${matFmtNum(r1.val)}`);
  steps.push(`I₂ → x ${r2.sym} ${matFmtNum(r2.val)}`);
  const sol=ineqIntersect(r1,r2)||'∅ (intersección vacía — sin solución)';
  steps.push(`Intersección: ${sol}`);
  return {expr:'Sistema',sol,steps,marks:[r1,r2]};
}

function solveAbsoluteInequality(a,b,c,sym){
  const steps=[`|${a}x + ${b}| ${sym} ${c}`], roots=[];
  let sol;
  if(c<0&&(sym==='<'||sym==='≤')){ sol='∅ (sin solución — |·| ≥ 0)'; steps.push('|·| nunca es negativo'); }
  else if(c<0&&(sym==='>'||sym==='≥')){ sol='x ∈ ℝ'; steps.push('|·| ≥ 0 > c siempre verdadero'); }
  else {
    const r1=(-b+c)/a, r2=(-b-c)/a;
    const lo=Math.min(r1,r2), hi=Math.max(r1,r2);
    roots.push(r1,r2);
    const closed=(sym==='≤'||sym==='≥');
    if(sym==='<'||sym==='≤'){
      steps.push(`−${c} ${flipSym(sym)} ${a}x + ${b} ${sym} ${c}`);
      steps.push(`Raíces: ${matFmtNum(lo)}, ${matFmtNum(hi)}`);
      sol=`${closed?'[':'('}${matFmtNum(lo)}, ${matFmtNum(hi)}${closed?']':')'}`;
    } else {
      steps.push(`${a}x + ${b} ${sym} ${c}  ó  ${a}x + ${b} ${flipSym(sym)} −${c}`);
      steps.push(`Raíces: ${matFmtNum(lo)}, ${matFmtNum(hi)}`);
      sol=`(-∞, ${matFmtNum(lo)}${closed?']':')'} ∪ ${closed?'[':'('}${matFmtNum(hi)}, +∞)`;
    }
  }
  return {expr:`|${a}x + ${b}| ${sym} ${c}`,sol,steps,marks:roots.map(val=>({val,sym:'root'}))};
}

export {
  flipSym, checkIneq, ineqLinearBound, ineqIntersect, ineqEval, signTableSolve,
  solveFreeInequality, solveQuadraticInequality, solveRationalInequality,
  solveSystemInequality, solveAbsoluteInequality,
};
