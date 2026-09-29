// Parser numérico compartido por Cálculo y Álgebra.
// Conserva la sintaxis histórica de SuperCalc; úsese sólo con entradas locales.
const RESERVED=['sin','cos','tan','sec','csc','cot','asin','acos','atan','sinh','cosh','tanh','ln','log','sqrt','abs','exp','Math','Infinity','e'];

const SUPERSCRIPTS={ '⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-' };
export function normalizeExpression(expr){
  return String(expr||'').trim()
    .replace(/−/g,'-').replace(/[·×]/g,'*').replace(/÷/g,'/')
    .replace(/\bsen\b/gi,'sin').replace(/\barctan\b/gi,'atan')
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g,run=>'^'+[...run].map(c=>SUPERSCRIPTS[c]).join(''));
}

// Extrae los identificadores libres (no funciones ni constantes) de una expresión.
export function collectVariables(expr){
  if(!expr) return [];
  expr=normalizeExpression(expr);
  const reserved=new Set(RESERVED);
  const vars=[], seen=new Set();
  const re=/[a-zA-Z][a-zA-Z0-9_]*/g;
  let m;
  while((m=re.exec(expr))!==null){
    const w=m[0];
    if(reserved.has(w)||seen.has(w)) continue;
    seen.add(w); vars.push(w);
  }
  return vars;
}

export function calcParse(expr,varName='x'){
  if(!expr||!expr.trim()) return null;
  if(!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(varName)||RESERVED.includes(varName)) return null;
  let s=normalizeExpression(expr);
  const variables=collectVariables(s).filter(v=>v!==varName);
  s=s.replace(/π/g,'Math.PI');
  s=s.replace(/\bInfinity\b/g,'Infinity');
  // JS prohíbe un signo unario como operando izquierdo de '**' (-x**2 es SyntaxError).
  // Reescribimos -x^2 → -(x^2) respetando la semántica matemática (^ liga antes que el signo).
  s=s.replace(/(^|[^\w.)])([-+])([A-Za-z_]\w*|[0-9]+(?:\.[0-9]+)?)\s*\^\s*([A-Za-z_]\w*|[0-9]+(?:\.[0-9]+)?)/g,'$1$2($3**$4)');
  s=s.replace(/\^/g,'**');
  // Apply implicit multiplication before replacing function names with Math.*;
  // otherwise "log10(" and other generated identifiers are corrupted.
  s=s.replace(/(\d)([a-df-zA-DF-Z])/g,'$1*$2');
  s=s.replace(/\b([a-zA-Z])(\d)/g,'$1*$2');
  s=s.replace(/\)(\d)/g,')*$1');
  s=s.replace(/(?<![A-Za-z_0-9])(\d+(?:\.\d+)?)\(/g,'$1*(');
  s=s.replace(/\)\(/g,')*(');
  if (!/^[\w\s.+\-*/(),]+$/.test(s)) return null;
  s=s.replace(/\bsinh\b/g,'Math.sinh');
  s=s.replace(/\bcosh\b/g,'Math.cosh');
  s=s.replace(/\btanh\b/g,'Math.tanh');
  s=s.replace(/\bsin\b/g,'Math.sin');
  s=s.replace(/\bcos\b/g,'Math.cos');
  s=s.replace(/\btan\b/g,'Math.tan');
  s=s.replace(/\basin\b/g,'Math.asin');
  s=s.replace(/\bacos\b/g,'Math.acos');
  s=s.replace(/\batan\b/g,'Math.atan');
  s=s.replace(/\blog\b/g,'Math.log10');
  s=s.replace(/\bln\b/g,'Math.log');
  s=s.replace(/\bexp\b/g,'Math.exp');
  s=s.replace(/\bsqrt\b/g,'Math.sqrt');
  s=s.replace(/\babs\b/g,'Math.abs');
  s=s.replace(/(?<![a-zA-Z])e(?![a-zA-Z0-9_])/g,'Math.E');
  try{
    const vars=[varName, ...variables];
    const fn=new Function(...vars,'const sec=_=>1/Math.cos(_),csc=_=>1/Math.sin(_),cot=_=>1/Math.tan(_);return ('+s+');');
    fn(...vars.map(()=>1));
    return fn;
  }catch(e){return null;}
}
