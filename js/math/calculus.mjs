import { calcParse } from './expression.mjs';
export { calcParse } from './expression.mjs';

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

// --- Tokenizer ---
function tokenize(expr){
  expr = expr.trim()
    .replace(/\*\*/g,'^')
    .replace(/π/g,'3.14159265358979')
    // Superíndices Unicode → ^n
    .replace(/⁰/g,'^0').replace(/¹/g,'^1').replace(/²/g,'^2').replace(/³/g,'^3')
    .replace(/⁴/g,'^4').replace(/⁵/g,'^5').replace(/⁶/g,'^6').replace(/⁷/g,'^7')
    .replace(/⁸/g,'^8').replace(/⁹/g,'^9')
    // e^x  →  exp(x)
    .replace(/\be\^(\()/g,'exp(')
    .replace(/\be\^([a-zA-Z0-9_.]+)/g,'exp($1)')
    ;

  const raw = [];
  let i = 0;
  while(i < expr.length){
    const c = expr[i];
    if(/\s/.test(c)){i++;continue;}
    if(/\d/.test(c)||c==='.'){
      let num='';
      while(i<expr.length&&(/\d/.test(expr[i])||expr[i]==='.')) num+=expr[i++];
      raw.push({type:'num',val:parseFloat(num)});
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
    if('+-*/^()'.includes(c)) raw.push({type:'op',val:c});
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
function parseExpr(tokens){
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
    let left = parsePow();
    while(pos<tokens.length&&peek().type==='op'&&(peek().val==='*'||peek().val==='/')){
      const op = consume().val;
      const right = parsePow();
      left = {type:op, left, right};
    }
    return left;
  }
  function parsePow(){
    let base = parseUnary();
    if(pos<tokens.length&&peek().type==='op'&&peek().val==='^'){
      consume();
      const exp = parseUnary();
      base = {type:'^', left:base, right:exp};
    }
    return base;
  }
  function parseUnary(){
    if(pos<tokens.length&&peek().type==='op'&&peek().val==='-'){
      consume();
      return {type:'neg', arg:parseUnary()};
    }
    return parsePrimary();
  }
  function parsePrimary(){
    const t = peek();
    if(!t) return {type:'num',val:0};
    if(t.type==='num'){ consume(); return {type:'num',val:t.val}; }
    if(t.type==='var'){ consume(); return {type:'var',val:t.val}; }
    if(t.type==='fn'){
      const fn = consume().val;
      // expect '('
      if(pos<tokens.length&&peek().val==='(') consume();
      const arg = parseAddSub();
      if(pos<tokens.length&&peek().val===')') consume();
      return {type:'fn', fn, arg};
    }
    if(t.type==='op'&&t.val==='('){
      consume();
      const inner = parseAddSub();
      if(pos<tokens.length&&peek().val===')') consume();
      return inner;
    }
    return {type:'num',val:0};
  }
  return parseAddSub();
}

// --- Diferenciación simbólica del AST ---
function diffAST(node, varName='x'){
  if(!node) return {type:'num',val:0};
  switch(node.type){
    case 'num': return {type:'num',val:0};
    case 'var': return {type:'num',val:node.val===varName?1:0};
    case 'neg': return {type:'neg',arg:diffAST(node.arg,varName)};
    case '+': return {type:'+',left:diffAST(node.left,varName),right:diffAST(node.right,varName)};
    case '-': return {type:'-',left:diffAST(node.left,varName),right:diffAST(node.right,varName)};
    case '*': return {type:'+',
      left:{type:'*',left:diffAST(node.left,varName),right:node.right},
      right:{type:'*',left:node.left,right:diffAST(node.right,varName)}};
    case '/': return {type:'/',
      left:{type:'-',
        left:{type:'*',left:diffAST(node.left,varName),right:node.right},
        right:{type:'*',left:node.left,right:diffAST(node.right,varName)}},
      right:{type:'^',left:node.right,right:{type:'num',val:2}}};
    case '^': {
      const base = node.left, exp = node.right;
      // Caso especial: base es e (Math.E) → d/dx[e^u] = e^u * u'
      if(base.type==='num'&&Math.abs(base.val-Math.E)<1e-6){
        return simplify({type:'*', left:node, right:diffAST(exp,varName)});
      }
      // Si el exponente es constante → n*base^(n-1) * base'
      if(isConst(exp)){
        const n = evalAST(exp);
        if(n===0) return {type:'num',val:0};
        return simplify({type:'*',
          left:{type:'*',left:{type:'num',val:n},
            right:{type:'^',left:base,right:{type:'num',val:n-1}}},
          right:diffAST(base,varName)});
      }
      // Si la base es constante a^u → a^u * ln(a) * u'
      if(isConst(base)){
        return simplify({type:'*',
          left:{type:'*',
            left:node,
            right:{type:'fn',fn:'ln',arg:base}},
          right:diffAST(exp,varName)});
      }
      // General
      return simplify({type:'*',
        left:node,
        right:{type:'+',
          left:{type:'*',left:diffAST(exp,varName),right:{type:'fn',fn:'ln',arg:base}},
          right:{type:'*',left:exp,right:{type:'/',
            left:diffAST(base,varName),right:base}}}});
    }
    case 'fn': {
      const u = node.arg, du = diffAST(u,varName);
      switch(node.fn){
        case 'sin': return simplify({type:'*',left:{type:'fn',fn:'cos',arg:u},right:du});
        case 'cos': return simplify({type:'*',left:{type:'neg',arg:{type:'fn',fn:'sin',arg:u}},right:du});
        case 'tan': return simplify({type:'*',
          left:{type:'/',left:{type:'num',val:1},
            right:{type:'^',left:{type:'fn',fn:'cos',arg:u},right:{type:'num',val:2}}},
          right:du});
        case 'sec': return simplify({type:'*',
          left:{type:'*',left:{type:'fn',fn:'sec',arg:u},right:{type:'fn',fn:'tan',arg:u}},
          right:du});
        case 'csc': return simplify({type:'*',
          left:{type:'neg',arg:{type:'*',left:{type:'fn',fn:'csc',arg:u},right:{type:'fn',fn:'cot',arg:u}}},
          right:du});
        case 'cot': return simplify({type:'*',
          left:{type:'neg',arg:{type:'/',left:{type:'num',val:1},
            right:{type:'^',left:{type:'fn',fn:'sin',arg:u},right:{type:'num',val:2}}}},
          right:du});
        case 'sinh': return simplify({type:'*',left:{type:'fn',fn:'cosh',arg:u},right:du});
        case 'cosh': return simplify({type:'*',left:{type:'fn',fn:'sinh',arg:u},right:du});
        case 'tanh': return simplify({type:'*',
          left:{type:'/',left:{type:'num',val:1},
            right:{type:'^',left:{type:'fn',fn:'cosh',arg:u},right:{type:'num',val:2}}},
          right:du});
        case 'asin': return simplify({type:'*',
          left:{type:'/',left:{type:'num',val:1},
            right:{type:'fn',fn:'sqrt',arg:{type:'-',
              left:{type:'num',val:1},right:{type:'^',left:u,right:{type:'num',val:2}}}}},
          right:du});
        case 'acos': return simplify({type:'*',
          left:{type:'neg',arg:{type:'/',left:{type:'num',val:1},
            right:{type:'fn',fn:'sqrt',arg:{type:'-',
              left:{type:'num',val:1},right:{type:'^',left:u,right:{type:'num',val:2}}}}}},
          right:du});
        case 'atan': return simplify({type:'*',
          left:{type:'/',left:{type:'num',val:1},
            right:{type:'+',left:{type:'num',val:1},
              right:{type:'^',left:u,right:{type:'num',val:2}}}},
          right:du});
        case 'ln': return simplify({type:'*',left:{type:'/',left:{type:'num',val:1},right:u},right:du});
        case 'log': return simplify({type:'*',
          left:{type:'/',left:{type:'num',val:1},
            right:{type:'*',left:{type:'num',val:Math.LN10},right:u}},
          right:du});
        case 'sqrt': return simplify({type:'*',
          left:{type:'/',left:{type:'num',val:1},
            right:{type:'*',left:{type:'num',val:2},right:{type:'fn',fn:'sqrt',arg:u}}},
          right:du});
        case 'abs': return simplify({type:'*',
          left:{type:'/',left:u,right:{type:'fn',fn:'abs',arg:u}},
          right:du});
        case 'exp': return simplify({type:'*',left:node,right:du});
        default: return {type:'num',val:0};
      }
    }
    default: return {type:'num',val:0};
  }
}

function isConst(node, varName='x'){
  if(!node) return true;
  if(node.type==='num') return true;
  if(node.type==='var') return node.val!==varName;
  if(node.type==='fn') return isConst(node.arg,varName);
  if(node.type==='neg') return isConst(node.arg,varName);
  return isConst(node.left,varName)&&isConst(node.right,varName);
}

function evalAST(node){
  if(!node) return 0;
  switch(node.type){
    case 'num': return node.val;
    case 'neg': return -evalAST(node.arg);
    case '+': return evalAST(node.left)+evalAST(node.right);
    case '-': return evalAST(node.left)-evalAST(node.right);
    case '*': return evalAST(node.left)*evalAST(node.right);
    case '/': return evalAST(node.left)/evalAST(node.right);
    case '^': return Math.pow(evalAST(node.left),evalAST(node.right));
    case 'fn': {
      const v=evalAST(node.arg);
      const fns={sin:Math.sin,cos:Math.cos,tan:Math.tan,asin:Math.asin,acos:Math.acos,
        atan:Math.atan,ln:Math.log,log:Math.log10,sqrt:Math.sqrt,abs:Math.abs,exp:Math.exp,
        sec:x=>1/Math.cos(x),csc:x=>1/Math.sin(x),cot:x=>1/Math.tan(x),
        sinh:Math.sinh,cosh:Math.cosh,tanh:Math.tanh};
      return (fns[node.fn]||((x)=>x))(v);
    }
    default: return 0;
  }
}

// --- Simplificación algebraica del AST ---
function simplify(node){
  if(!node) return {type:'num',val:0};
  // Simplificar hijos primero
  if(node.left) node={...node,left:simplify(node.left)};
  if(node.right) node={...node,right:simplify(node.right)};
  if(node.arg) node={...node,arg:simplify(node.arg)};

  switch(node.type){
    case '*':
      // 0 * anything = 0
      if((node.left.type==='num'&&node.left.val===0)||
         (node.right.type==='num'&&node.right.val===0))
        return {type:'num',val:0};
      // 1 * anything = anything
      if(node.left.type==='num'&&node.left.val===1) return node.right;
      if(node.right.type==='num'&&node.right.val===1) return node.left;
      // (-1) * x
      if(node.left.type==='num'&&node.left.val===-1)
        return {type:'neg',arg:node.right};
      // num * num
      if(node.left.type==='num'&&node.right.type==='num')
        return {type:'num',val:node.left.val*node.right.val};
      // FIX: colapsar num*(num*expr) → (n1*n2)*expr
      if(node.left.type==='num'&&node.right.type==='*'&&node.right.left.type==='num')
        return simplify({type:'*',
          left:{type:'num',val:node.left.val*node.right.left.val},
          right:node.right.right});
      // FIX: colapsar (num*expr)*num → (n1*n2)*expr
      if(node.right.type==='num'&&node.left.type==='*'&&node.left.left.type==='num')
        return simplify({type:'*',
          left:{type:'num',val:node.right.val*node.left.left.val},
          right:node.left.right});
      break;
    case '+':
      if(node.left.type==='num'&&node.left.val===0) return node.right;
      if(node.right.type==='num'&&node.right.val===0) return node.left;
      if(node.left.type==='num'&&node.right.type==='num')
        return {type:'num',val:node.left.val+node.right.val};
      break;
    case '-':
      if(node.right.type==='num'&&node.right.val===0) return node.left;
      if(node.left.type==='num'&&node.left.val===0)
        return {type:'neg',arg:node.right};
      if(node.left.type==='num'&&node.right.type==='num')
        return {type:'num',val:node.left.val-node.right.val};
      break;
    case '/':
      if(node.right.type==='num'&&node.right.val===1) return node.left;
      if(node.left.type==='num'&&node.left.val===0) return {type:'num',val:0};
      if(node.left.type==='num'&&node.right.type==='num')
        return {type:'num',val:node.left.val/node.right.val};
      break;
    case '^':
      if(node.right.type==='num'&&node.right.val===1) return node.left;
      if(node.right.type==='num'&&node.right.val===0) return {type:'num',val:1};
      if(node.left.type==='num'&&node.right.type==='num')
        return {type:'num',val:Math.pow(node.left.val,node.right.val)};
      break;
    case 'neg':
      if(node.arg.type==='num') return {type:'num',val:-node.arg.val};
      if(node.arg.type==='neg') return node.arg.arg;
      break;
  }
  return node;
}

// --- AST a string legible ---
function astToStr(node, parentPrec=0){
  if(!node) return '0';
  const PREC = {'+':1,'-':1,'*':2,'/':2,'^':3,'neg':4};
  switch(node.type){
    case 'num': {
      const v = node.val;
      if(Math.abs(v-Math.PI)<1e-6) return 'π';
      if(Math.abs(v-Math.E)<1e-6) return 'e';
      if(Number.isInteger(v)) return String(v);
      // Mostrar como fracción si es racional simple
      const rounded = parseFloat(v.toFixed(6));
      return String(rounded);
    }
    case 'var': return node.val;
    case 'neg': {
      const inner = astToStr(node.arg, PREC['neg']);
      return node.arg.type==='num'||node.arg.type==='var' ? '-'+inner : '-('+inner+')';
    }
    case 'fn':
      if(node.fn==='exp') return `e^(${astToStr(node.arg)})`;
      return `${node.fn}(${astToStr(node.arg)})`;
    case '+': {
      const l=astToStr(node.left,1), r=astToStr(node.right,1);
      // Si right empieza con - no poner +
      if(r.startsWith('-')) return `${l} ${r}`;
      return `${l} + ${r}`;
    }
    case '-': {
      const l=astToStr(node.left,1), r=astToStr(node.right,1);
      const rStr = node.right.type==='+'||node.right.type==='-' ? `(${r})` : r;
      return `${l} - ${rStr}`;
    }
    case '*': {
      const l=astToStr(node.left,2), r=astToStr(node.right,2);
      const lStr = node.left.type==='+'||node.left.type==='-' ? `(${l})` : l;
      const rStr = node.right.type==='+'||node.right.type==='-' ? `(${r})` : r;
      // Omitir * antes de letra: 2*x → 2x, 2*sin → 2sin
      if(rStr[0]&&/[a-zA-Z(]/.test(rStr[0])&&!lStr.includes('/'))
        return `${lStr}${rStr}`;
      return `${lStr}*${rStr}`;
    }
    case '/': {
      const l=astToStr(node.left,2), r=astToStr(node.right,2);
      const lStr = node.left.type==='+'||node.left.type==='-' ? `(${l})` : l;
      const rStr = (node.right.type==='+'||node.right.type==='-'||node.right.type==='*'||node.right.type==='/') ? `(${r})` : r;
      return `${lStr}/${rStr}`;
    }
    case '^': {
      const l=astToStr(node.left,3), r=astToStr(node.right,3);
      const lStr = (node.left.type!=='num'&&node.left.type!=='var') ? `(${l})` : l;
      return `${lStr}^${r}`;
    }
    default: return '?';
  }
}

// Recolectar y combinar términos similares del AST (suma/resta de monomios)
// Convierte el AST a lista de {coef, base_str} y reconstruye
function collectTerms(ast){
  // Extraer lista plana de sumandos del AST
  function flatten(node, sign=1){
    if(!node) return [];
    if(node.type==='+') return [...flatten(node.left,sign),...flatten(node.right,sign)];
    if(node.type==='-') return [...flatten(node.left,sign),...flatten(node.right,-sign)];
    if(node.type==='neg') return flatten(node.arg,-sign);
    // término individual: extraer coeficiente y base
    return [{sign, node}];
  }
  // Normalizar un término a {coef:number, key:string, node}
  function termKey(sign, node){
    // num * expr  o  expr solo
    if(node.type==='*'&&node.left.type==='num')
      return {coef:sign*node.left.val, key:astToStr(node.right), rest:node.right};
    if(node.type==='num')
      return {coef:sign*node.val, key:'__const__', rest:null};
    if(node.type==='neg'&&node.arg.type==='num')
      return {coef:-sign*node.arg.val, key:'__const__', rest:null};
    return {coef:sign*1, key:astToStr(node), rest:node};
  }

  const terms = flatten(ast);
  const map = new Map();
  const order = [];
  terms.forEach(({sign,node})=>{
    const {coef,key,rest} = termKey(sign,node);
    if(map.has(key)){
      map.get(key).coef += coef;
    } else {
      map.set(key, {coef, rest, key});
      order.push(key);
    }
  });

  // Reconstruir AST desde la lista combinada
  let result = null;
  order.forEach(key=>{
    const {coef, rest} = map.get(key);
    if(Math.abs(coef)<1e-10) return;
    const absCoef = Math.abs(coef);
    const isNeg   = coef < 0;

    // Construir el término positivo
    let posTerm;
    if(key==='__const__')     posTerm = {type:'num', val:absCoef};
    else if(absCoef===1)      posTerm = rest;
    else                      posTerm = {type:'*', left:{type:'num',val:absCoef}, right:rest};

    if(result===null){
      result = isNeg ? {type:'neg', arg:posTerm} : posTerm;
    } else if(isNeg){
      result = {type:'-', left:result, right:posTerm};
    } else {
      result = {type:'+', left:result, right:posTerm};
    }
  });
  return result||{type:'num',val:0};
}

export function symbolicDeriv(exprStr, order=1, varName='x'){
  try{
    const tokens = tokenize(exprStr);
    let ast = parseExpr(tokens);
    for(let i=0;i<order;i++){
      ast = simplify(diffAST(ast, varName));
      ast = collectTerms(ast);   // combinar términos similares
      ast = simplify(ast);       // simplificar de nuevo tras combinar
    }
    return astToStr(ast);
  } catch(e){
    return null;
  }
}

// ═══════════════════════════════════════════════════════
// CÁLCULO DIFERENCIAL
// ═══════════════════════════════════════════════════════

// ── evalA: parsea 'a' como expresión (π/4, ln(2), sqrt(2), etc.) ──
function evalA(aStr){
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

// ── Aproximación numérica lateral ──
function approach(fn,a,dir){
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

// ── Resultado exacto: fracción / constante ──
function toExact(v){
  if(!isFinite(v)) return v>0?'+∞':'-∞';
  if(Math.abs(v)<1e-10) return '0';
  if(Math.abs(v)>1e12) return v>0?'+∞':'-∞';
  if(Math.abs(v-Math.round(v))<1e-8) return String(Math.round(v));
  const neg=v<0; const av=Math.abs(v);
  for(let d=2;d<=200;d++){
    const n=Math.round(av*d);
    if(n>0&&Math.abs(n/d-av)<5e-8) return (neg?'-':'')+n+'/'+d;
  }
  for(let d=1;d<=16;d++){
    const n=Math.round(v*d/Math.PI);
    if(n!==0&&Math.abs(n*Math.PI/d-v)<1e-7){
      const ns=Math.abs(n)===1?(n<0?'-':''):(n+'');
      return ns+'π'+(d===1?'':'/'+d);
    }
  }
  for(let r=2;r<=15;r++){
    const sq=Math.sqrt(r);
    for(let d=1;d<=30;d++){
      const n=Math.round(av*d/sq);
      if(n>0&&Math.abs(n*sq/d-av)<5e-8){
        const ns=n===1?'':(n+'');
        return (neg?'-':'')+ns+'√'+r+(d===1?'':'/'+d);
      }
    }
  }
  return null;
}

export function fmtResult(v){
  if(v===null||v===undefined||isNaN(v)) return null;
  if(!isFinite(v)) return v>0?'+∞':'-∞';
  if(Math.abs(v)>1e12) return v>0?'+∞':'-∞';
  const ex=toExact(v); if(ex) return ex;
  return parseFloat(v.toFixed(8)).toString();
}

export function fmtNum(v,dp=6){
  if(v===null||v===undefined||isNaN(v)) return 'indef.';
  if(!isFinite(v)) return v>0?'+∞':'-∞';
  if(Math.abs(v)<1e-10) return '0';
  if(Math.abs(v)>1e12) return v>0?'+∞':'-∞';
  return parseFloat(v.toFixed(dp)).toString();
}

export function fmtA(s){ return (s||'').trim().replace('Infinity','∞').replace('-Infinity','-∞'); }

// ── Índice de '/' en nivel 0 de paréntesis ──
function findTopSlash(s){
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


function resolveIndet(fxStr,a,stepsOut,varName='x'){
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

// ── COMPUTE LIMIT ──
export function computeLimit(fxStr,aStr,side,varName='x'){
  const steps=[]; const r={steps,fxStr,aStr,side,varName};
  const a=evalA(aStr); r.a=a;
  if(isNaN(a)){
    r.error=aStr.trim()?
      'No se pudo evaluar "'+aStr+'". Usa: 0, π/4, ln(2), sqrt(2), 2π…':
      'Ingresa el valor de '+varName+' → a';
    return r;
  }
  const normalizedFx=groupPolynomialQuotient(fxStr,varName);
  const fn=calcParse(normalizedFx,varName);
  if(!fn){ r.error='Función inválida. Ej: sin('+varName+')/'+varName+', ('+varName+'^2-4)/('+varName+'-2)'; return r; }

  // Sustitución directa
  let direct=null;
  if(isFinite(a)){ try{ const v=fn(a,0); if(isFinite(v)) direct=v; }catch(e){} }
  const _visDirect=isFinite(a)?visSubstitute(normalizedFx,a,varName):null;
  steps.push({tipo:'sustitucion',aDisplay:fmtA(aStr),direct,visSub:_visDirect});

  if(direct!==null){
    const ex=toExact(direct);
    r.value=ex||fmtNum(direct,8); r.valueNum=direct;
    r.exact=ex; r.exists=true; r.tipo='directo';
    r.vr=direct; r.vl=direct; return r;
  }

  // Detectar indeterminación
  const {idx, str:normFx}=findTopSlash(normalizedFx);
  let isZZ=false, isII=false, faNum=NaN, faDen=NaN;
  let numStr='', denStr='';
  if(idx>0&&isFinite(a)){
    numStr=normFx.slice(0,idx).trim();
    denStr=normFx.slice(idx+1).trim();
    const fnN=calcParse(numStr,varName);
    const fnD=calcParse(denStr,varName);
    if(fnN&&fnD){
      faNum=fnN(a,0); faDen=fnD(a,0);
      isZZ=Math.abs(faNum)<1e-9&&Math.abs(faDen)<1e-9;
      isII=!isFinite(faNum)&&!isFinite(faDen);
    }
  }
  // Sustitución visual
  const visSub = idx>0
    ? visSubstitute(numStr,a,varName)+' / '+visSubstitute(denStr,a,varName)
    : visSubstitute(normalizedFx,a,varName);
  // Guardar numStr/denStr en el step de sustitución para los pasos
  if(steps.length>0) steps[0].visSub=visSub;
  if(steps.length>0) steps[0].numStr=numStr;
  if(steps.length>0) steps[0].denStr=denStr;
  if(steps.length>0&&faNum!==undefined) steps[0].faNum=faNum;
  if(steps.length>0&&faDen!==undefined) steps[0].faDen=faDen;

  if(isZZ) steps.push({tipo:'indet_00',faNum,faDen,numStr,denStr,visSub});
  else if(isII) steps.push({tipo:'indet_inf',faNum,faDen});
  r.isIndet=isZZ||isII;

  // Laterales
  const vr=approach(fn,a,1), vl=approach(fn,a,-1);
  r.vrRaw=vr; r.vlRaw=vl;
  steps.push({tipo:'laterales',vr,vl,aDisplay:fmtA(aStr)});

  // Resolver
  let resolved=NaN;
  if(r.isIndet){
    resolved=resolveIndet(normalizedFx,a,steps,varName);
  } else if(isFinite(vr)&&isFinite(vl)&&Math.abs(vr-vl)<5e-5){
    resolved=(vr+vl)/2;
  } else if(side==='right') resolved=vr;
  else if(side==='left')  resolved=vl;

  r.vr=isNaN(resolved)?vr:resolved;
  r.vl=isNaN(resolved)?vl:resolved;

  const pick=(u)=>{ r.exists=isFinite(u); r.valueNum=u;
    r.value=fmtResult(u)||'No existe'; r.exact=toExact(u)||null; };

  if(side==='right')     pick(isNaN(resolved)?vr:resolved);
  else if(side==='left') pick(isNaN(resolved)?vl:resolved);
  else {
    const ev=!isNaN(resolved)?resolved:(isFinite(vr)&&isFinite(vl)&&Math.abs(vr-vl)<5e-5?(vr+vl)/2:NaN);
    if(!isNaN(ev)) pick(ev);
    else if(!isFinite(vr)||!isFinite(vl)){
      const inf=!isFinite(vr)?vr:vl;
      r.exists=false; r.valueNum=inf;
      r.value=fmtResult(inf)||'+∞'; r.exact=null; r.isInfinity=true;
    } else {
      r.exists=false; r.value='No existe'; r.exact=null;
      steps.push({tipo:'no_existe',vr,vl});
    }
  }
  r.tipo=isZZ?'indet_00':isII?'indet_inf':(!isFinite(vr)||!isFinite(vl)?'infinito':'lateral');
  return r;
}

// Calcula la operación como un límite conjunto cuando la aritmética de
// límites separados produce una indeterminación; nunca reduce ∞−∞ a NaN mudo.
export function calculateLimitOperation(left,right,operation){
  const first=computeLimit(left.expr,left.point,left.side,left.variable||'x');
  const second=computeLimit(right.expr,right.point,right.side,right.variable||'x');
  const result={first,second,valueNum:NaN,reason:''};
  if(first.error||second.error) return result;
  const extended=r=>r.isInfinity||/[∞]/.test(r.value||'')
    ? Math.sign(r.valueNum||1)*Infinity : r.valueNum;
  const a=extended(first), b=extended(second);
  const subtractIndeterminate=operation==='−'&&!Number.isFinite(a)&&!Number.isFinite(b)&&Math.sign(a)===Math.sign(b);
  const addIndeterminate=operation==='+'&&!Number.isFinite(a)&&!Number.isFinite(b)&&Math.sign(a)!==Math.sign(b);
  if(subtractIndeterminate||addIndeterminate){
    if(first.a===second.a&&left.side===right.side&&(left.variable||'x')===(right.variable||'x')){
      const symbol=operation==='−'?'-':'+';
      const combined=computeLimit(`(${left.expr})${symbol}(${right.expr})`,left.point,left.side,left.variable||'x');
      if(!combined.error&&combined.exists&&Number.isFinite(combined.valueNum)){
        result.valueNum=combined.valueNum;
        result.reason='Indeterminación resuelta evaluando el límite de la expresión conjunta.';
        return result;
      }
    }
    result.reason='Forma indeterminada: reescribe las funciones como una sola expresión.';
    return result;
  }
  if(operation==='+') result.valueNum=a+b;
  else if(operation==='−') result.valueNum=a-b;
  else if(operation==='*') result.valueNum=a*b;
  else if(operation==='/'&&b!==0) result.valueNum=a/b;
  if(Number.isNaN(result.valueNum)) result.reason='Operación indeterminada.';
  return result;
}

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

export function rk4(fn,x0,y0,h,steps){
  let x=x0,y=y0,pts=[[x,y]];
  for(let i=0;i<steps;i++){
    const k1=fn(x,y),k2=fn(x+h/2,y+h/2*k1);
    const k3=fn(x+h/2,y+h/2*k2),k4=fn(x+h,y+h*k3);
    y+=h/6*(k1+2*k2+2*k3+k4); x+=h;
    if(!isFinite(y)) break;
    pts.push([parseFloat(x.toFixed(4)),parseFloat(y.toFixed(6))]);
  }
  return pts;
}

// Núcleos numéricos usados por los formularios de integrales y multivariable.
// Reciben funciones y números; no leen inputs ni producen HTML.
export function simpsonIntegral(fn,a,b,n=1000){
  const h=(b-a)/n;
  let s=fn(a,0)+fn(b,0);
  for(let i=1;i<n;i++) s+=(i%2===0?2:4)*fn(a+i*h,0);
  return s*h/3;
}

// Región comprendida entre y=f(x), y=0, x=a y x=b.
// Eje X: discos. Eje Y: cascarones; el intervalo debe quedar a un solo lado
// del eje para no contar dos veces el mismo volumen al rotar.
export function revolutionVolume(fn,a,b,axis='x',n=1000){
  if(typeof fn!=='function') throw new TypeError('Ingresa una función válida');
  if(!Number.isFinite(a)||!Number.isFinite(b)||a>=b)
    throw new RangeError('Se requieren límites finitos con a < b');
  if(axis!=='x'&&axis!=='y') throw new RangeError('El eje debe ser X o Y');
  if(!Number.isInteger(n)||n<2||n%2!==0)
    throw new RangeError('El número de subintervalos debe ser par y positivo');
  if(axis==='y'&&a<0&&b>0)
    throw new RangeError('Para el eje Y, el intervalo no puede cruzar x = 0');

  const section=x=>{
    const height=fn(x,0);
    if(!Number.isFinite(height)) throw new RangeError('La función no es finita en el intervalo');
    const area=axis==='x' ? Math.PI*height*height : 2*Math.PI*Math.abs(x)*Math.abs(height);
    if(!Number.isFinite(area)) throw new RangeError('El volumen excede el rango numérico');
    return area;
  };
  const volume=simpsonIntegral(section,a,b,n);
  if(!Number.isFinite(volume)) throw new RangeError('No se pudo calcular un volumen finito');
  return volume;
}

export function taylorCoefficients(fn,a,nTerms){
  function fact(n){let r=1;for(let i=2;i<=n;i++)r*=i;return r;}
  const h=1e-4, terms=[];
  for(let k=0;k<=Math.min(nTerms,8);k++){
    let dk=0;
    for(let i=0;i<=k;i++){
      let binom=1;
      for(let j=0;j<i;j++) binom=binom*(k-j)/(j+1);
      dk+=((i%2===0?1:-1)*binom*fn(a+(k-i)*h,0));
    }
    dk/=Math.pow(h,k);
    const coef=dk/fact(k);
    if(Math.abs(coef)>=1e-10) terms.push({k,coef});
  }
  return terms;
}

export function partialDerivative(fn,x,y,varName,order,h=1e-6){
  if(varName==='x'){
    if(order===1) return (fn(x+h,y)-fn(x-h,y))/(2*h);
    return (fn(x+h,y)-2*fn(x,y)+fn(x-h,y))/(h*h);
  }
  if(order===1) return (fn(x,y+h)-fn(x,y-h))/(2*h);
  return (fn(x,y+h)-2*fn(x,y)+fn(x,y-h))/(h*h);
}

export function gradient2D(fn,x,y){
  const fx=partialDerivative(fn,x,y,'x',1);
  const fy=partialDerivative(fn,x,y,'y',1);
  return {fx,fy,mag:Math.sqrt(fx*fx+fy*fy)};
}

export function midpointIntegral2D(fn,x1,x2,y1,y2,nx=100,ny=100){
  const hx=(x2-x1)/nx, hy=(y2-y1)/ny;
  let s=0;
  for(let i=0;i<nx;i++) for(let j=0;j<ny;j++)
    s+=fn(x1+(i+.5)*hx,y1+(j+.5)*hy);
  return s*hx*hy;
}

export function implicitDerivative(fn,x,y,h=1e-7){
  const fval=fn(x,y);
  const fx=(fn(x+h,y)-fn(x-h,y))/(2*h);
  const fy=(fn(x,y+h)-fn(x,y-h))/(2*h);
  return {fval,fx,fy,slope:fy!==0?-fx/fy:NaN};
}

// AST internals shared with the symbolic integration engine.
export { tokenize, parseExpr, simplify, astToStr, collectTerms, evalAST, diffAST, isConst };
