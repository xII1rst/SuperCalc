import { normalizeExpression } from '../expression.mjs';

// --- Tokenizer ---
export function tokenize(expr){
  expr = normalizeExpression(expr)
    .replace(/\*\*/g,'^')
    .replace(/π/g,'3.14159265358979')
    // Superíndices Unicode → ^n
    .replace(/⁰/g,'^0').replace(/¹/g,'^1').replace(/²/g,'^2').replace(/³/g,'^3')
    .replace(/⁴/g,'^4').replace(/⁵/g,'^5').replace(/⁶/g,'^6').replace(/⁷/g,'^7')
    .replace(/⁸/g,'^8').replace(/⁹/g,'^9')
    ;

  const raw = [];
  let i = 0;
  while(i < expr.length){
    const c = expr[i];
    if(/\s/.test(c)){i++;continue;}
    if(/\d/.test(c)||c==='.'){
      const number=/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(expr.slice(i));
      if(!number || !Number.isFinite(Number(number[0]))) throw new SyntaxError('Número inválido');
      i+=number[0].length;
      if(expr[i]==='.') throw new SyntaxError('Número inválido');
      raw.push({type:'num',val:Number(number[0])});
      continue;
    }
    if(/[a-zA-Z]/.test(c)){
      let word='';
      while(i<expr.length&&/[a-zA-Z0-9]/.test(expr[i])) word+=expr[i++];
      if(['sin','cos','tan','sec','csc','cot','asin','acos','atan','sinh','cosh','tanh','ln','log','sqrt','abs','exp'].includes(word))
        raw.push({type:'fn',val:word});
      else if(word==='e') raw.push({type:'num',val:Math.E});
      else raw.push({type:'var',val:word});
      continue;
    }
    if(!'+-*/^()'.includes(c)) throw new SyntaxError('Carácter no admitido');
    raw.push({type:'op',val:c});
    i++;
  }
  // Insertar '*' implícito: num/var/) seguido de num/var/fn/(
  const tokens = [];
  for(let j=0;j<raw.length;j++){
    tokens.push(raw[j]);
    const cur = raw[j], nxt = raw[j+1];
    if(!nxt) continue;
    const curIsVal = cur.type==='num'||cur.type==='var'||(cur.type==='op'&&cur.val===')');
    const nxtIsVal = nxt.type==='num'||nxt.type==='var'||nxt.type==='fn'||(nxt.type==='op'&&nxt.val==='(');
    if(curIsVal && nxtIsVal) tokens.push({type:'op',val:'*'});
  }
  return tokens;
}

// --- Parser recursivo descendente → AST ---
export function parseExpr(tokens){
  let pos = 0;
  function peek(){ return tokens[pos]; }
  function consume(){ return tokens[pos++]; }

  function parseAddSub(){
    let left = parseMulDiv();
    while(pos<tokens.length&&peek().type==='op'&&(peek().val==='+'||peek().val==='-')){
      const op = consume().val;
      const right = parseMulDiv();
      left = {type:op, left, right};
    }
    return left;
  }
  function parseMulDiv(){
    let left = parseUnary();
    while(pos<tokens.length&&peek().type==='op'&&(peek().val==='*'||peek().val==='/')){
      const op = consume().val;
      const right = parseUnary();
      left = {type:op, left, right};
    }
    return left;
  }
  function parsePow(){
    let base = parsePrimary();
    if(pos<tokens.length&&peek().type==='op'&&peek().val==='^'){
      consume();
      const exp = parseUnary();
      base = base.type==='num'&&base.val===Math.E
        ? {type:'fn',fn:'exp',arg:exp}
        : {type:'^', left:base, right:exp};
    }
    return base;
  }
  function parseUnary(){
    if(pos<tokens.length&&peek().type==='op'&&peek().val==='-'){
      consume();
      return {type:'neg', arg:parseUnary()};
    }
    if(pos<tokens.length&&peek().type==='op'&&peek().val==='+'){
      consume();
      return parseUnary();
    }
    return parsePow();
  }
  function parsePrimary(){
    const t = peek();
    if(!t) throw new SyntaxError('Falta un operando');
    if(t.type==='num'){ consume(); return {type:'num',val:t.val}; }
    if(t.type==='var'){ consume(); return {type:'var',val:t.val}; }
    if(t.type==='fn'){
      const fn = consume().val;
      if(peek()?.val!=='(') throw new SyntaxError('La función necesita paréntesis');
      consume();
      const arg = parseAddSub();
      if(peek()?.val!==')') throw new SyntaxError('Falta cerrar paréntesis');
      consume();
      return {type:'fn', fn, arg};
    }
    if(t.type==='op'&&t.val==='('){
      consume();
      const inner = parseAddSub();
      if(peek()?.val!==')') throw new SyntaxError('Falta cerrar paréntesis');
      consume();
      return inner;
    }
    throw new SyntaxError('Operando inválido');
  }
  const result=parseAddSub();
  if(pos!==tokens.length) throw new SyntaxError('Expresión incompleta');
  return result;
}

// ── evalA: parsea 'a' como expresión (π/4, ln(2), sqrt(2), etc.) ──
export function evalA(aStr){
  if(!aStr||!aStr.trim()) return NaN;
  const s=aStr.trim();
  if(s==='∞'||s==='Infinity'||s==='+∞') return Infinity;
  if(s==='-∞'||s==='-Infinity') return -Infinity;
  try{
    const code=s
      .replace(/π/g,'Math.PI').replace(/\^/g,'**')
      .replace(/⁰/g,'**0').replace(/¹/g,'**1').replace(/²/g,'**2').replace(/³/g,'**3')
      .replace(/⁴/g,'**4').replace(/⁵/g,'**5').replace(/⁶/g,'**6').replace(/⁷/g,'**7')
      .replace(/⁸/g,'**8').replace(/⁹/g,'**9')
      .replace(/\bln\b/g,'Math.log').replace(/\bsqrt\b/g,'Math.sqrt')
      .replace(/\bsin\b/g,'Math.sin').replace(/\bcos\b/g,'Math.cos')
      .replace(/\btan\b/g,'Math.tan').replace(/\babs\b/g,'Math.abs')
      .replace(/(?<![a-zA-Z])e(?![a-zA-Z0-9_])/g,'Math.E')
      .replace(/(\d)([a-df-zA-DF-Z(])/g,'$1*$2').replace(/\)\(/g,')*(');
    const v=Function('"use strict"; return ('+code+');')();
    return (typeof v==='number')?v:NaN;
  }catch(e){ return NaN; }
}
