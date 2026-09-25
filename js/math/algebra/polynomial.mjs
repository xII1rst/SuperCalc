// Álgebra: polinomios compartidos por Funciones e Inecuaciones.
export function quadRoots(a,b,c){
  if(Math.abs(a)<1e-12) return Math.abs(b)<1e-12?[]:[-c/b];
  const d=b*b-4*a*c; if(d<0) return [];
  if(Math.abs(d)<1e-12) return [-b/(2*a)];
  const sq=Math.sqrt(d);
  return [(-b-sq)/(2*a),(-b+sq)/(2*a)].sort((x,y)=>x-y);
}

export function parseSimplePoly(s){
  s=s.trim().replace(/\s+/g,'').replace(/\^/g,'**');
  let a=0,b=0,c=0;
  const ma=s.match(/([+-]?\d*\.?\d*)\*?x\*\*2|([+-]?\d*\.?\d*)\*?x²/);
  if(ma){ const v=(ma[1]||ma[2]||'').replace('**',''); a=(v===''||v==='+')?1:(v==='-'?-1:parseFloat(v)||0); }
  const noX2=s.replace(/[+-]?\d*\.?\d*\*?x\*\*2/g,'').replace(/[+-]?\d*\.?\d*\*?x²/g,'');
  const mb=noX2.match(/([+-]?\d*\.?\d*)\*?x(?!\*\*)(?!\d)/);
  if(mb){ const v=(mb[1]||''); b=(v===''||v==='+')?1:(v==='-'?-1:parseFloat(v)||0); }
  const noX=noX2.replace(/[+-]?\d*\.?\d*\*?x(?!\*\*)(?!\d)/g,'').trim();
  if(noX) c=parseFloat(noX)||0;
  return {a,b,c};
}
