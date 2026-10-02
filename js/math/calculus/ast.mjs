export function isConst(node, varName='x'){
  if(!node) return true;
  if(node.type==='num') return true;
  if(node.type==='var') return node.val!==varName;
  if(node.type==='fn') return isConst(node.arg,varName);
  if(node.type==='neg') return isConst(node.arg,varName);
  return isConst(node.left,varName)&&isConst(node.right,varName);
}

export function evalAST(node){
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
export function simplify(node){
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

// ── LÍMITES SIMBÓLICOS ──
// Sustituye varName por valueNode dentro del AST (inmutable).
export function substAST(node, varName, valueNode){
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
export function hasVar(node){
  if(!node) return false;
  if(node.type==='var') return true;
  if(node.type==='fn') return hasVar(node.arg);
  if(node.type==='neg') return hasVar(node.arg);
  return hasVar(node.left) || hasVar(node.right);
}

// Evalúa node en varName=a; null si quedan variables libres.
export function evalAt(node, varName, a){
  const sub = substAST(node, varName, {type:'num',val:a});
  const s = simplify(sub);
  if(hasVar(s)) return null;
  return evalAST(s);
}
