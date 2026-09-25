// Álgebra: términos y progresiones sin dependencia del navegador.
function evalTermN(exprStr, nVal){
  try{
    let code=exprStr.trim()
      .replace(/\^/g,'**')
      .replace(/(\d)n(?![a-zA-Z])/g,'$1*n')
      .replace(/π/g,'Math.PI')
      .replace(/(?<![a-zA-Z\.])ln\b/g,'Math.log')
      .replace(/(?<![a-zA-Z])e(?![a-zA-Z0-9_])/g,'Math.E')
      .replace(/(?<![a-zA-Z])n(?![a-zA-Z])/g,'('+String(nVal)+')');
    // Fix JS: unary minus before ** not allowed
    code=code.replace(/-([()\d.]+)\*\*/g,'(0-$1)**');
    return Function('"use strict"; return ('+code+');')();
  }catch(e){ return NaN; }
}

function seqClassify(terms){
  if(terms.length<2) return '—';
  const diffs=terms.slice(1).map((t,i)=>t-terms[i]);
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
  const an=a1*Math.pow(r,n-1);
  const sn=Math.abs(r-1)<1e-12?a1*n:a1*(1-Math.pow(r,n))/(1-r);
  const sInf=Math.abs(r)<1?a1/(1-r):NaN;
  const terms=Array.from({length:Math.min(n,8)},(_,i)=>a1*Math.pow(r,i));
  return {an,sn,sInf,terms};
}

export { evalTermN, seqClassify, detectProgression, arithmeticProgression, geometricProgression };
