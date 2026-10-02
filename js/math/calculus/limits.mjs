import { analyticLimitForms, approach, findTopSlash, groupPolynomialQuotient, lHopitalSymbolic, nearTrigPole, oneInfinity, rationalPole, resolveIndet, visSubstitute } from './limit-forms.mjs';
import { astToStr, collectTerms } from './printer.mjs';
import { calcParse, collectVariables } from '../expression.mjs';
import { evalA, parseExpr, tokenize } from './parser.mjs';
import { evalAST, evalAt, hasVar, simplify, substAST } from './ast.mjs';
import { fmtA, fmtNum, fmtResult, toExact } from './format.mjs';
import { polynomialQuotientLimit } from '../algebra/sequences.mjs';

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
