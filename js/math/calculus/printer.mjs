// --- AST a string legible ---
export function astToStr(node, parentPrec=0){
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
export function collectTerms(ast){
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
