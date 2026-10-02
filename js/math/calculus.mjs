import { calcParse, collectVariables, normalizeExpression } from './expression.mjs';
import { polynomialQuotientLimit } from './algebra/sequences.mjs';
export { calcParse, collectVariables, normalizeExpression } from './expression.mjs';

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
      if(isConst(exp,varName)){
        const numericExponent=!hasVar(exp);
        const n = numericExponent?evalAST(exp):null;
        if(numericExponent&&n===0) return {type:'num',val:0};
        return simplify({type:'*',
          left:{type:'*',left:numericExponent?{type:'num',val:n}:exp,
            right:{type:'^',left:base,right:numericExponent?{type:'num',val:n-1}:{type:'-',left:exp,right:{type:'num',val:1}}}},
          right:diffAST(base,varName)});
      }
      // Si la base es constante a^u → a^u * ln(a) * u'
      if(isConst(base,varName)){
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
      if(v===Math.PI) return 'π';
      if(v===Math.E) return 'e';
      if(Number.isInteger(v)) return String(v);
      // Mostrar como fracción si es racional simple
      return String(v);
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
      // Conservar 2x para monomios; separar los demás factores explícitamente.
      if(node.left.type==='num' && (node.right.type==='var'||
        (node.right.type==='^'&&node.right.left.type==='var'&&node.right.right.type==='num')))
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
      const lStr = (node.left.type!=='num'&&node.left.type!=='var')||
        (node.left.type==='num'&&node.left.val<0) ? `(${l})` : l;
      const rStr=node.right.type==='num'||node.right.type==='var'?r:`(${r})`;
      return `${lStr}^${rStr}`;
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
    if(!String(exprStr||'').trim()||String(exprStr).length>500||!Number.isInteger(order)||order<1||order>6||
      !calcParse('1',varName)) return null;
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

// Procedimiento y condiciones suficientes de la fórmula, sin afirmar un
// dominio completo en puntos de frontera o parámetros sin valores.
export function derivativeDetails(exprStr,order=1,varName='x'){
  if(!String(exprStr||'').trim()||String(exprStr).length>500||!Number.isInteger(order)||order<1||order>4||
    !calcParse('1',varName)) return null;
  try{
    const source=parseExpr(tokenize(exprStr));
    const rules=new Set(), constraints=new Map(), derivatives=[];
    const condition=(node,kind)=>{
      const expression=astToStr(node);
      const suffix={positive:' > 0',nonzero:' ≠ 0',nonnegative:' ≥ 0',unit:' ∈ [−1,1]',trigNonzero:' ≠ 0'}[kind];
      if(!hasVar(node)){
        const value=evalAST(node);
        if(check(value,kind)) return;
      }
      constraints.set(kind+expression,{node,kind,label:expression+suffix});
    };
    const inspect=(node,recordRules=false)=>{
      if(!node) return;
      if(recordRules){
        const basic={'+':'Suma: (u+v)′ = u′+v′.','-':'Resta: (u−v)′ = u′−v′.',
          '*':'Producto: (uv)′ = u′v+uv′.','/':'Cociente: (u/v)′ = (u′v−uv′)/v².'};
        if(basic[node.type]) rules.add(basic[node.type]);
        if(node.type==='^') rules.add(isConst(node.right,varName)
          ? 'Potencia y cadena: (uᵐ)′ = m·uᵐ⁻¹·u′.'
          : 'Potencia variable: (uᵛ)′ = uᵛ·(v′·ln(u)+v·u′/u), con u>0.');
        if(node.type==='fn'){
          const formulas={sin:'(sen u)′ = cos(u)·u′',cos:'(cos u)′ = −sen(u)·u′',
            exp:'(eᵘ)′ = eᵘ·u′',ln:'(ln u)′ = u′/u',log:'(log₁₀ u)′ = u′/(u·ln 10)',
            atan:'(arctan u)′ = u′/(1+u²)',sqrt:'(√u)′ = u′/(2√u)'};
          rules.add(formulas[node.fn]||`Cadena para ${node.fn}: (g(u))′ = g′(u)·u′.`);
        }
      }
      if(node.type==='/') condition(node.right,'nonzero');
      if(node.type==='^'){
        if(hasVar(node.right)||!Number.isInteger(evalAST(node.right))) condition(node.left,'positive');
        else if(evalAST(node.right)<0) condition(node.left,'nonzero');
      }
      if(node.type==='fn'){
        if(['ln','log'].includes(node.fn)) condition(node.arg,'positive');
        if(node.fn==='sqrt') condition(node.arg,'nonnegative');
        if(['asin','acos'].includes(node.fn)) condition(node.arg,'unit');
        if(node.fn==='abs'&&recordRules) condition(node.arg,'nonzero');
        if(['tan','sec','cot','csc'].includes(node.fn)) condition({type:'fn',fn:['tan','sec'].includes(node.fn)?'cos':'sin',arg:node.arg},'trigNonzero');
      }
      inspect(node.left,recordRules); inspect(node.right,recordRules); inspect(node.arg,recordRules);
    };
    const check=(value,kind)=>Number.isFinite(value)&&
      (kind==='positive'?value>0:kind==='nonzero'?value!==0:kind==='nonnegative'?value>=0:
        kind==='trigNonzero'?Math.abs(value)>1e-12:Math.abs(value)<=1);
    inspect(source,true);
    let current=source;
    for(let k=1;k<=order;k++){
      current=simplify(collectTerms(simplify(diffAST(current,varName))));
      inspect(current);
      derivatives.push({order:k,expression:astToStr(current)});
    }
    const evaluateAST=(node,point)=>{
      const substituted=substAST(node,varName,{type:'num',val:point});
      return hasVar(substituted)?null:evalAST(substituted);
    };
    return {status:'symbolic',expression:normalizeExpression(exprStr),derivative:derivatives.at(-1).expression,
      derivatives,rules:rules.size?[...rules]:['Constante: C′ = 0.'],conditions:[...constraints.values()].map(item=>item.label),
      evaluate(point){
        if(!Number.isFinite(point)) return {status:'invalid',reason:'El punto debe ser real y finito.'};
        const value=evaluateAST(source,point);
        if(value===null) return {status:'invalid',reason:'Faltan valores para los parámetros de la expresión.'};
        if(!Number.isFinite(value)) return {status:'invalid',reason:'La función original no está definida en el punto.'};
        for(const item of constraints.values()){
          const result=evaluateAST(item.node,point);
          if(result===null||!check(result,item.kind)) return {status:'invalid',reason:`No se cumple la condición ${item.label} en el punto; las fronteras requieren análisis aparte.`};
        }
        const derivative=evaluateAST(current,point);
        return Number.isFinite(derivative)?{status:'evaluated',value:derivative,functionValue:value}:
          {status:'invalid',reason:'La fórmula de la derivada no tiene un valor real finito en el punto.'};
      }};
  }catch{return null;}
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
  // e y potencias enteras de e
  if(Math.abs(v-Math.E)<1e-7) return 'e';
  if(Math.abs(v+Math.E)<1e-7) return '-e';
  if(v>0){
    const lne=Math.log(v);
    if(isFinite(lne)){
      const k=Math.round(lne);
      if(k!==0&&Math.abs(lne-k)<1e-6){
        if(k===1) return 'e';
        if(k===-1) return '1/e';
        return 'e^'+k;
      }
    }
  }
  // √π
  if(Math.abs(v-Math.sqrt(Math.PI))<1e-7) return '√π';
  if(Math.abs(v+Math.sqrt(Math.PI))<1e-7) return '-√π';
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

// ── LÍMITES SIMBÓLICOS ──
// Sustituye varName por valueNode dentro del AST (inmutable).
function substAST(node, varName, valueNode){
  if(!node) return {type:'num',val:0};
  switch(node.type){
    case 'var': return node.val===varName ? valueNode : node;
    case 'num': return node;
    case 'fn': return {type:'fn', fn:node.fn, arg:substAST(node.arg,varName,valueNode)};
    case 'neg': return {type:'neg', arg:substAST(node.arg,varName,valueNode)};
    default: return {type:node.type, left:substAST(node.left,varName,valueNode), right:substAST(node.right,varName,valueNode)};
  }
}

// ¿Queda alguna variable libre en el AST?
function hasVar(node){
  if(!node) return false;
  if(node.type==='var') return true;
  if(node.type==='fn') return hasVar(node.arg);
  if(node.type==='neg') return hasVar(node.arg);
  return hasVar(node.left) || hasVar(node.right);
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

// Evalúa node en varName=a; null si quedan variables libres.
function evalAt(node, varName, a){
  const sub = substAST(node, varName, {type:'num',val:a});
  const s = simplify(sub);
  if(hasVar(s)) return null;
  return evalAST(s);
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
function oneInfinity(fxStr, varName, a){
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
function analyticLimitForms(fxStr,a,varName){
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

function nearTrigPole(fxStr,a,varName){
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
function lHopitalSymbolic(numAST, denAST, varName, a){
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

// Límite simbólico: sustitución con variables libres, L'Hôpital exacto y 1^∞.
// Devuelve {value, valueNum, symbolic, method} o null si no procede.
export function symbolicLimit(fxStr, aStr, varName='x'){
  try{
    const a=evalA(aStr);
    if(isNaN(a)) return null;
    const norm=groupPolynomialQuotient(fxStr,varName);
    const freeVars=collectVariables(fxStr).filter(v=>v!==varName);

    if(!isFinite(a) && freeVars.length===0){
      const oi=oneInfinity(norm, varName, a);
      if(oi) return { value: oi.value, valueNum: oi.valueNum, symbolic:false, method:'1inf' };
    }

    const ast=parseExpr(tokenize(norm));

    if(freeVars.length>0){
      const sub=substAST(ast, varName, {type:'num',val:a});
      const s=simplify(collectTerms(simplify(sub)));
      return { value: astToStr(s), valueNum: null, symbolic:true, method:'sustitucion' };
    }

    let numAST=ast, denAST=null, nv=null, dv=null;
    if(ast.type==='/'){ numAST=ast.left; denAST=ast.right; }
    if(denAST){
      nv=evalAt(numAST, varName, a);
      dv=evalAt(denAST, varName, a);
    }
    const isZZ=denAST && nv!==null && dv!==null && Math.abs(nv)<1e-9 && Math.abs(dv)<1e-9;
    const isII=denAST && nv!==null && dv!==null && !isFinite(nv) && !isFinite(dv);
    if(isZZ || isII){
      const r=lHopitalSymbolic(numAST, denAST, varName, a);
      if(r===null) return null;
      return { value: toExact(r.value)||fmtNum(r.value,8), valueNum:r.value,
        symbolic:false, method:'lhopital', derivatives:r.derivatives };
    }

    const sub=substAST(ast, varName, {type:'num',val:a});
    const s=simplify(collectTerms(simplify(sub)));
    if(hasVar(s)) return null;
    const v=evalAST(s);
    if(!isFinite(v)) return null;
    return { value: toExact(v)||fmtNum(v,8), valueNum: v, symbolic:false, method:'directo' };
  }catch(e){ return null; }
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
function rationalPole(fxStr,a,varName){
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

  const freeVars=collectVariables(fxStr).filter(v=>v!==varName);

  // Variables libres: emitir resultado simbólico (p. ej. lim_{x→2} 12x²−y = 48−y).
  if(freeVars.length>0){
    const sym=symbolicLimit(fxStr,aStr,varName);
    if(sym){
      r.value=sym.value; r.valueNum=sym.valueNum===null?NaN:sym.valueNum;
      r.exact=null; r.exists=true; r.tipo='simbolico'; r.symbolic=true;
      steps.push({tipo:'simbolico',aDisplay:fmtA(aStr),result:sym.value});
      return r;
    }
  }

  // Forma 1^∞ en el infinito (p. ej. (1+1/x)^x → e).
  if(!isFinite(a) && freeVars.length===0){
    const oi=oneInfinity(normalizedFx,varName,a);
    if(oi){
      r.value=oi.value; r.valueNum=oi.valueNum; r.exact=oi.value; r.exists=true;
      r.tipo='directo'; r.vr=oi.valueNum; r.vl=oi.valueNum;
      steps.push({tipo:'simbolico',aDisplay:fmtA(aStr),detail:'Forma 1^∞ → e^(c·k)',result:oi.value});
      return r;
    }
  }

  if(a===Infinity && freeVars.length===0){
    const polynomial=polynomialQuotientLimit(normalizedFx,varName);
    if(polynomial.status==='demostrado'){
      const valueNum=polynomial.value;
      r.value=Number.isFinite(valueNum)?toExact(valueNum)||polynomial.exact:polynomial.exact;
      r.valueNum=valueNum; r.exact=r.value; r.exists=Number.isFinite(valueNum);
      r.isInfinity=!r.exists; r.tipo='simbolico'; r.vr=valueNum; r.vl=valueNum;
      steps.push({tipo:'simbolico',aDisplay:fmtA(aStr),
        detail:`${polynomial.steps.join(' ')} ${polynomial.assumptions}`,result:r.value});
      return r;
    }
  }

  if(freeVars.length===0){
    const analytic=analyticLimitForms(normalizedFx,a,varName);
    if(analytic){
      r.value=analytic.value; r.valueNum=analytic.valueNum; r.exact=analytic.value;
      r.exists=true; r.tipo='simbolico'; r.vr=analytic.valueNum; r.vl=analytic.valueNum;
      steps.push({tipo:'simbolico',aDisplay:fmtA(aStr),detail:analytic.detail,result:analytic.value});
      return r;
    }
  }

  if(freeVars.length===0){
    const pole=nearTrigPole(normalizedFx,a,varName);
    if(pole){
      r.value='No demostrado'; r.valueNum=NaN; r.exists=null; r.inconclusive=true;
      r.estimate=null; r.tipo='numerico';
      r.domainError=`${pole} tiene un posible polo en el punto indicado; la sustitución numérica no demuestra un límite.`;
      steps.push({tipo:'dominio',detail:r.domainError});
      return r;
    }
  }

  if(freeVars.length===0){
    const pole=rationalPole(normalizedFx,a,varName);
    if(pole){
      const show=v=>v>0?'+∞':'−∞',pick=side==='right'?pole.right:side==='left'?pole.left:pole.right===pole.left?pole.right:null;
      r.exists=false;r.exact=null;r.tipo='infinito';r.vr=pole.right;r.vl=pole.left;
      r.isInfinity=pick!==null;r.valueNum=pick===null?NaN:pick;r.value=pick===null?'No existe':show(pick);
      steps.push({tipo:'simbolico',aDisplay:fmtA(aStr),detail:`El denominador se anula en ${varName} = ${fmtA(aStr)} con multiplicidad ${pole.m} y el numerador no: los límites laterales son ${show(pole.left)} (izquierda) y ${show(pole.right)} (derecha).${side==='both'&&pick===null?' Al ser distintos, el límite bilateral no existe.':''}`,result:r.value});
      return r;
    }
    // Sin puntos del dominio a ningún lado: no hay límite que estudiar.
    const outside=[1e-2,1e-4,1e-6].every(h=>!Number.isFinite(fn(a+h))&&!Number.isFinite(fn(a-h)));
    if(outside&&Number.isFinite(a)){
      r.value='No existe';r.valueNum=NaN;r.exists=false;r.exact=null;r.tipo='dominio';
      r.domainError=`${varName} = ${fmtA(aStr)} está fuera del dominio de f: no hay puntos cercanos donde evaluarla.`;
      steps.push({tipo:'dominio',detail:r.domainError});
      return r;
    }
  }

  // Sustitución directa
  let direct=null;
  if(isFinite(a)){ try{ const v=fn(a,0); if(isFinite(v)) direct=v; }catch(e){} }
  const _visDirect=isFinite(a)?visSubstitute(normalizedFx,a,varName):null;
  steps.push({tipo:'sustitucion',aDisplay:fmtA(aStr),direct,visSub:_visDirect});

  if(direct!==null){
    const h=Math.max(1e-6,Math.abs(a)*1e-6);
    const defined=sign=>[h,h/10,h/100].some(delta=>{
      try{return Number.isFinite(fn(a+sign*delta,0));}catch{return false;}
    });
    const leftDefined=defined(-1), rightDefined=defined(1);
    const missing=side==='left'?!leftDefined:side==='right'?!rightDefined:!leftDefined||!rightDefined;
    if(missing){
      const direction=!leftDefined&&!rightDefined?'ambos lados':!leftDefined?'la izquierda':'la derecha';
      r.exists=false; r.tipo='dominio'; r.value='Sin límite real por el lado solicitado';
      r.domainError=`La función no tiene valores reales cercanos por ${direction}; el valor en ${varName}=${fmtA(aStr)} no prueba un límite ${side==='both'?'bilateral':'lateral'}.`;
      steps.push({tipo:'dominio',detail:r.domainError});
      return r;
    }
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
  let resolved=NaN, analyticProof=false;
  if(r.isIndet){
    const sym=symbolicLimit(fxStr,aStr,varName);
    if(sym && !sym.symbolic && sym.valueNum!==null && isFinite(sym.valueNum)){
      resolved=sym.valueNum;
      analyticProof=true;
      steps.push({tipo:'lhopital_simbolico',result:sym.value,derivatives:sym.derivatives});
    } else {
      resolved=resolveIndet(normalizedFx,a,steps,varName);
    }
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
  if(!analyticProof){
    r.inconclusive=true;
    r.estimate=Number.isFinite(r.valueNum)?r.valueNum:null;
    if(r.estimate===null) r.valueNum=NaN;
    r.value='No demostrado'; r.exists=null; r.exact=null; r.isInfinity=false;
    r.tipo='numerico';
  }
  return r;
}

// Calcula la operación como un límite conjunto cuando la aritmética de
// límites separados produce una indeterminación; nunca reduce ∞−∞ a NaN mudo.
export function calculateLimitOperation(left,right,operation){
  const first=computeLimit(left.expr,left.point,left.side,left.variable||'x');
  const second=computeLimit(right.expr,right.point,right.side,right.variable||'x');
  const result={first,second,valueNum:NaN,reason:''};
  if(first.error||second.error) return result;
  const samePoint=first.a===second.a&&left.side===right.side&&(left.variable||'x')===(right.variable||'x');
  if(operation==='−'&&samePoint&&left.expr.trim()===right.expr.trim()){
    const fn=calcParse(left.expr,left.variable||'x');
    const a=first.a, h=Number.isFinite(a)?Math.max(1e-4,Math.abs(a)*1e-4):1e4;
    const probes=left.side==='left'?[a-h]:left.side==='right'?[a+h]:
      a===Infinity?[h]:a===-Infinity?[-h]:[a-h,a+h];
    if(fn && probes.every(x=>{try{return Number.isFinite(fn(x,0));}catch{return false;}})){
      result.valueNum=0;
      result.reason='Identidad algebraica de la expresión conjunta: f−f=0 donde f está definida.';
      return result;
    }
  }
  if(first.inconclusive||second.inconclusive){
    result.reason='Algún límite solo tiene una estimación numérica; la operación no queda demostrada.';
    return result;
  }
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
  if(typeof fn!=='function'||![x0,y0,h].every(Number.isFinite)||h===0
    ||!Number.isInteger(steps)||steps<1||steps>5000){
    throw new RangeError('Datos de RK4 inválidos');
  }
  let x=x0,y=y0,pts=[[x,y]];
  for(let i=0;i<steps;i++){
    const k1=fn(x,y),k2=fn(x+h/2,y+h/2*k1);
    const k3=fn(x+h/2,y+h/2*k2),k4=fn(x+h,y+h*k3);
    if(![k1,k2,k3,k4].every(Number.isFinite)) throw new RangeError('La derivada no es finita en el intervalo');
    y+=h/6*(k1+2*k2+2*k3+k4); x=x0+(i+1)*h;
    if(!Number.isFinite(y)) throw new RangeError('La solución dejó de ser finita');
    pts.push([x,y]);
  }
  return pts;
}

export function rk4Refinement(fn,x0,y0,xFinal,steps){
  if(!Number.isFinite(xFinal)||xFinal===x0||!Number.isInteger(steps)||steps<1||steps>1000){
    throw new RangeError('Ingresa x final distinto de x₀ y entre 1 y 1000 pasos');
  }
  const h=(xFinal-x0)/steps;
  const coarse=rk4(fn,x0,y0,h,steps);
  const fine=rk4(fn,x0,y0,h/2,2*steps);
  const coarseValue=coarse.at(-1)[1], fineValue=fine.at(-1)[1];
  return {coarse,fine,h,coarseValue,fineValue,errorEstimate:Math.abs(fineValue-coarseValue)/15};
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

// Región entre dos curvas. En el eje X, una sección que cruza y=0 forma
// un disco; si ambas curvas están del mismo lado forma una arandela.
export function revolutionVolumeBetween(fn,gn,a,b,axis='x',n=1000){
  if(typeof fn!=='function'||typeof gn!=='function')
    throw new TypeError('Ingresa dos funciones válidas');
  if(!Number.isFinite(a)||!Number.isFinite(b)||a>=b)
    throw new RangeError('Se requieren límites finitos con a < b');
  if(axis!=='x'&&axis!=='y') throw new RangeError('El eje debe ser X o Y');
  if(!Number.isInteger(n)||n<2||n%2!==0)
    throw new RangeError('El número de subintervalos debe ser par y positivo');
  if(axis==='y'&&a<0&&b>0)
    throw new RangeError('Para el eje Y, el intervalo no puede cruzar x = 0');

  const section=x=>{
    const f=fn(x,0), g=gn(x,0);
    if(!Number.isFinite(f)||!Number.isFinite(g))
      throw new RangeError('Las funciones deben ser finitas en todo el intervalo');
    let area;
    if(axis==='x'){
      const outer=Math.max(Math.abs(f),Math.abs(g));
      const inner=f*g<=0 ? 0 : Math.min(Math.abs(f),Math.abs(g));
      area=Math.PI*(outer*outer-inner*inner);
    }else{
      area=2*Math.PI*Math.abs(x)*Math.abs(f-g);
    }
    if(!Number.isFinite(area)) throw new RangeError('El volumen excede el rango numérico');
    return area;
  };
  const volume=simpsonIntegral(section,a,b,n);
  if(!Number.isFinite(volume)) throw new RangeError('No se pudo calcular un volumen finito');
  return volume;
}

// Gira la región entre f y g (o el eje X si g es null) alrededor de y=c o x=c.
// Los cascarones solo se aceptan cuando el intervalo está a un lado de x=c.
export function revolutionVolumeAboutLine(fn,gn,a,b,axis='x',offset=0,n=1000){
  if(typeof fn!=='function'||(gn!==null&&typeof gn!=='function'))
    throw new TypeError('Ingresa funciones válidas');
  if(!Number.isFinite(a)||!Number.isFinite(b)||a>=b)
    throw new RangeError('Se requieren límites finitos con a < b');
  if(axis!=='x'&&axis!=='y') throw new RangeError('El eje debe ser X o Y');
  if(!Number.isFinite(offset)) throw new RangeError('El desplazamiento del eje debe ser finito');
  if(!Number.isInteger(n)||n<2||n%2!==0)
    throw new RangeError('El número de subintervalos debe ser par y positivo');
  if(axis==='y'&&a<offset&&b>offset)
    throw new RangeError('Para cascarones, el intervalo no puede cruzar el eje de giro x = c');

  const section=x=>{
    const f=fn(x,0),g=gn?gn(x,0):0;
    if(!Number.isFinite(f)||!Number.isFinite(g))
      throw new RangeError('Las funciones deben ser finitas en todo el intervalo');
    let area;
    if(axis==='x'){
      const first=f-offset,second=g-offset;
      const outer=Math.max(Math.abs(first),Math.abs(second));
      const inner=first*second<=0 ? 0 : Math.min(Math.abs(first),Math.abs(second));
      area=Math.PI*(outer*outer-inner*inner);
    }else{
      area=2*Math.PI*Math.abs(x-offset)*Math.abs(f-g);
    }
    if(!Number.isFinite(area)) throw new RangeError('El volumen excede el rango numérico');
    return area;
  };
  const volume=simpsonIntegral(section,a,b,n);
  if(!Number.isFinite(volume)) throw new RangeError('No se pudo calcular un volumen finito');
  return volume;
}

// Acepta f(x), y=f(x) y formas lineales como y=-mx+b.
// Los coeficientes se fijan antes de evaluar para mantener una función de x.
export function parseRevolutionFunction(expression,{m=1,b=0}={}){
  if(!Number.isFinite(m)||!Number.isFinite(b)) return null;
  let source=String(expression||'').trim()
    .replace(/^(?:y|f\(x\)|g\(x\))\s*=\s*/i,'')
    .replace(/\bmx\b/g,'m*x')
    .replace(/\bm\s+x\b/g,'m*x');
  if(collectVariables(source).some(name=>!['x','m','b'].includes(name))) return null;
  source=source.replace(/\b[mb]\b/g,name=>`(${name==='m'?m:b})`);
  return calcParse(source);
}

export function curveIntersections(fn,gn,a,b,steps=512){
  if(typeof fn!=='function'||typeof gn!=='function'||!Number.isFinite(a)||!Number.isFinite(b)||a>=b)
    return [];
  const roots=[];
  const gap=(b-a)/steps;
  const difference=x=>fn(x,0)-gn(x,0);
  const add=x=>{
    const y=fn(x,0), other=gn(x,0);
    if(!Number.isFinite(y)||!Number.isFinite(other)||
       Math.abs(y-other)>1e-7*Math.max(1,Math.abs(y),Math.abs(other))||
       roots.some(root=>Math.abs(root.x-x)<gap*0.1)) return;
    roots.push({x,y});
  };
  let previous=difference(a);
  for(let i=1;i<=steps;i++){
    const left=a+(i-1)*gap, right=i===steps?b:a+i*gap;
    const current=difference(right);
    if(Number.isFinite(previous)&&Number.isFinite(current)){
      if(previous===0&&current!==0) add(left);
      if(current===0&&previous!==0) add(right);
      if(previous*current<0){
        let lo=left, hi=right, loValue=previous;
        for(let j=0;j<45;j++){
          const mid=(lo+hi)/2, value=difference(mid);
          if(!Number.isFinite(value)) break;
          if(value===0){lo=hi=mid;break;}
          if(Math.sign(value)===Math.sign(loValue)){lo=mid;loValue=value;}
          else hi=mid;
        }
        add((lo+hi)/2);
      }
    }
    previous=current;
  }
  return roots;
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

export function implicitCurveAt(expression,x,y,{dxdt=null}={}){
  if(![x,y].every(Number.isFinite)||dxdt!==null&&!Number.isFinite(dxdt)) throw new RangeError('Ingresa coordenadas y tasa reales finitas.');
  if(String(expression||'').length>500||collectVariables(expression).some(v=>!['x','y'].includes(v))) throw new RangeError('Usa únicamente x e y (máximo 500 caracteres).');
  let source;
  try{source=parseExpr(tokenize(expression));}catch{throw new RangeError('Expresión F(x,y) inválida.');}
  const fxAST=simplify(collectTerms(simplify(diffAST(source,'x'))));
  const fyAST=simplify(collectTerms(simplify(diffAST(source,'y'))));
  const evaluate=node=>evalAST(substAST(substAST(node,'x',{type:'num',val:x}),'y',{type:'num',val:y}));
  const fval=evaluate(source), fx=evaluate(fxAST), fy=evaluate(fyAST);
  if(![fval,fx,fy].every(Number.isFinite)) throw new RangeError('La función o sus parciales no tienen valor real finito en el punto; revisa el dominio.');
  const scale=Math.max(Math.abs(fval),Math.abs(fx)*Math.max(1,Math.abs(x)),Math.abs(fy)*Math.max(1,Math.abs(y)));
  const residual=scale===0?0:Math.abs(fval)/scale;
  const result={fval,fx,fy,residual,tolerance:1e-9,symbolicFx:astToStr(fxAST),symbolicFy:astToStr(fyAST),
    hypotheses:'F debe ser diferenciable cerca del punto. Para y(x), se requiere Fᵧ≠0; la tangente usa Fₓ(x−x₀)+Fᵧ(y−y₀)=0.'};
  if(residual>result.tolerance) return {...result,status:'off-curve',reason:'El punto no satisface F(x,y)=0 dentro de la tolerancia relativa.'};
  const gradientScale=Math.max(Math.abs(fx),Math.abs(fy));
  if(gradientScale===0) return {...result,status:'singular',reason:'Fₓ=Fᵧ=0: la linealización no determina una tangente única.'};
  const vertical=Math.abs(fy)<=1e-12*gradientScale;
  result.status=vertical?'vertical':'regular';
  result.slope=vertical?null:-fx/fy;
  result.intercept=vertical?null:y-result.slope*x;
  if(dxdt!==null){
    result.rates=vertical
      ? dxdt===0?{status:'undetermined',reason:'Con dx/dt=0, esta ecuación no determina dy/dt.'}:
        {status:'incompatible',reason:'Fₓ·dx/dt≠0 y Fᵧ≈0: la tasa dada no satisface la relación diferenciada.'}
      : {status:'evaluated',dxdt,dydt:result.slope*dxdt};
  }
  return result;
}

// AST internals shared with the symbolic integration engine.
export { tokenize, parseExpr, simplify, astToStr, collectTerms, evalAST, diffAST, isConst, substAST, toExact };
