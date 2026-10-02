import { astToStr, collectTerms } from './printer.mjs';
import { calcParse, collectVariables, normalizeExpression } from '../expression.mjs';
import { evalAST, hasVar, isConst, simplify, substAST } from './ast.mjs';
import { parseExpr, tokenize } from './parser.mjs';

// --- Diferenciación simbólica del AST ---
export function diffAST(node, varName='x'){
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
