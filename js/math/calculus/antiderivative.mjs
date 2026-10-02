export function basicAntideriv(expr){
  const mono=/^(-?\d*\.?\d*)\*?x\^(-?\d+\.?\d*)$/.exec(expr.trim());
  if(mono){
    const a=parseFloat(mono[1]||'1')||1, n=parseFloat(mono[2]);
    if(n===-1) return `${a===1?'':a}ln|x|`;
    const coef=a/(n+1);
    const cStr=parseFloat(coef.toFixed(6)).toString();
    return `${cStr}x^${n+1}`;
  }
  if(expr.trim()==='x') return '(1/2)x^2';
  if(expr.trim()==='1') return 'x';
  if(expr.trim()==='sin(x)') return '-cos(x)';
  if(expr.trim()==='cos(x)') return 'sin(x)';
  if(expr.trim()==='e^(x)'||expr.trim()==='e^x') return 'e^x';
  if(expr.trim()==='1/x') return 'ln|x|';
  return null;
}
