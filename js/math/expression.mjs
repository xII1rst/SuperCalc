// Parser numérico compartido por Cálculo y Álgebra.
// Conserva la sintaxis histórica de SuperCalc; úsese sólo con entradas locales.
export function calcParse(expr,varName='x'){
  if(!expr||!expr.trim()) return null;
  if(!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(varName)||
    ['sin','cos','tan','sec','csc','cot','asin','acos','atan','sinh','cosh','tanh','ln','log','sqrt','abs','exp','Math','Infinity','e'].includes(varName)) return null;
  let s=expr.trim();
  s=s.replace(/π/g,'Math.PI');
  s=s.replace(/\bInfinity\b/g,'Infinity');
  s=s.replace(/\^/g,'**');
  s=s.replace(/\bsinh\b/g,'Math.sinh');
  s=s.replace(/\bcosh\b/g,'Math.cosh');
  s=s.replace(/\btanh\b/g,'Math.tanh');
  s=s.replace(/\bsin\b/g,'Math.sin');
  s=s.replace(/\bcos\b/g,'Math.cos');
  s=s.replace(/\btan\b/g,'Math.tan');
  s=s.replace(/\basin\b/g,'Math.asin');
  s=s.replace(/\bacos\b/g,'Math.acos');
  s=s.replace(/\batan\b/g,'Math.atan');
  s=s.replace(/\bln\b/g,'Math.log');
  s=s.replace(/\blog\b/g,'Math.log10');
  s=s.replace(/\bsqrt\b/g,'Math.sqrt');
  s=s.replace(/\babs\b/g,'Math.abs');
  s=s.replace(/(?<![a-zA-Z])e(?![a-zA-Z0-9_])/g,'Math.E');
  s=s.replace(/(\d)([a-df-zA-DF-Z(])/g,'$1*$2');
  s=s.replace(/([a-zA-Z)])(\d)/g,'$1*$2');
  s=s.replace(/\)\(/g,')*(');
  try{
    const fn=new Function(varName,varName==='y'?'x':'y','const sec=_=>1/Math.cos(_),csc=_=>1/Math.sin(_),cot=_=>1/Math.tan(_);return ('+s+');');
    fn(1,1);
    return fn;
  }catch(e){return null;}
}
