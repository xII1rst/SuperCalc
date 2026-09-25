import { fN } from '../../utils/format.mjs';

function parseLinearExpression(expr,unknown,known,component){
  let e=expr.replace(/\s/g,'');
  e=e.replace(/([^+\-\(])\-/g,'$1+-');
  if(e.startsWith('-')) e='0+'+e;
  const tokens=[];
  let depth=0,current='';
  for(const ch of e){
    if(ch==='(') depth++;
    else if(ch===')') depth--;
    if(ch==='+'&&depth===0){ tokens.push(current); current=''; }
    else current+=ch;
  }
  if(current) tokens.push(current);
  let coef=0,cst=0;
  for(const token of tokens.filter(Boolean)){
    const term=token.trim();
    if(!term) continue;
    const group=term.match(/^([+\-]?\d*\.?\d*)\*?\((.+)\)$/);
    if(group){
      const scalar=group[1]===''||group[1]==='+'?1:group[1]==='-'?-1:parseFloat(group[1]);
      const inner=parseLinearExpression(group[2],unknown,known,component);
      coef+=scalar*inner.coef; cst+=scalar*inner.cst;
      continue;
    }
    let sign=1,rest=term;
    if(rest.startsWith('-')){sign=-1;rest=rest.slice(1);}
    else if(rest.startsWith('+')) rest=rest.slice(1);
    const scalarMatch=rest.match(/^(\d+\.?\d*)\*?(.+)$/);
    let scalar=1,name='';
    if(scalarMatch){scalar=parseFloat(scalarMatch[1]);name=scalarMatch[2];}
    else name=rest;
    scalar*=sign;
    name=name.toLowerCase().replace('*','');
    if(name===unknown.toLowerCase()){coef+=scalar;continue;}
    if(known[name]){cst+=scalar*(known[name][component]||0);continue;}
    const number=parseFloat(name);
    if(!isNaN(number)){cst+=scalar*number;continue;}
    throw new Error('No reconozco "'+name+'"');
  }
  return {coef,cst};
}

export function solveVectorEquation(eqStr,unknownName,vectors,dimension,format=fN){
  const parts=eqStr.replace(/\s/g,'').toLowerCase().split('=');
  if(parts.length!==2) return {err:'Necesita exactamente un ='};
  const known={};
  vectors.forEach(v=>{known[v.nm.toLowerCase()]={vx:v.vx,vy:v.vy,vz:v.vz};});
  const unknown=unknownName.toLowerCase();
  if(known[unknown]) return {err:'"'+unknownName+'" ya es un vector conocido.'};
  const components=dimension===3?['vx','vy','vz']:['vx','vy'];
  const res={},steps=[];
  for(const component of components){
    const label=component==='vx'?'x':component==='vy'?'y':'z';
    try{
      const left=parseLinearExpression(parts[0],unknown,known,component);
      const right=parseLinearExpression(parts[1],unknown,known,component);
      const a=left.coef-right.coef,b=right.cst-left.cst;
      if(Math.abs(a)<1e-12){
        return {err:Math.abs(b)<1e-12?label+': infinitas soluciones':label+': sin solución'};
      }
      res[component]=b/a;
      steps.push(label+': '+format(a,3)+'·'+unknownName+' = '+format(b,3)+'  →  '+unknownName+label+' = '+format(b/a,4));
    }catch(error){return {err:'Error en '+label+': '+error.message};}
  }
  if(dimension===2) res.vz=0;
  return {res,steps};
}

export function parseVectorComponent(str,varSet){
  if(!str||str==='') return {coef:0,const:0,varName:null};
  const number=parseFloat(str);
  if(!isNaN(number)&&str.match(/^[\-+]?\d*\.?\d+$/)) return {coef:0,const:number,varName:null};
  const match=str.match(/^([+\-]?\d*\.?\d*)\*?([a-zA-Z]\w*)$/);
  if(match){
    const coef=match[1]===''||match[1]==='+'?1:match[1]==='-'?-1:parseFloat(match[1]);
    const varName=match[2];
    varSet.add(varName);
    return {coef,const:0,varName};
  }
  throw new Error('Componente no reconocida: "'+str+'". Usa número o variable (ej: x, 2k, -3t)');
}

export function solveUnknownComponents(vectors,operation,targetValue,dimension,format=fN){
  const target=parseFloat(targetValue);
  if(!isFinite(target)) return {err:'Ingresa un resultado numérico válido.'};
  const count=dimension===3?3:2;
  const names=new Set();
  let parsed;
  try{
    parsed=vectors.map(vector=>({
      nm:vector.nm,
      comps:vector.comps.slice(0,count).map(str=>parseVectorComponent(str.trim(),names)),
    }));
  }catch(error){return {err:error.message};}
  const vars=[...names];
  if(vars.length===0) return {err:'No hay incógnitas. Escribe una variable (ej: x) en alguna componente.'};
  if(vars.length>1) return {err:'Una sola ecuación escalar no determina varias incógnitas. Usa una variable.'};
  const variable=vars[0];
  if(operation==='·'){
    if(parsed.length<2) return {err:'Necesitas al menos 2 vectores para producto punto.'};
    const A=parsed[0],B=parsed[1];
    let coefficient=0,constant=0;
    for(let i=0;i<count;i++){
      const a=A.comps[i],b=B.comps[i];
      if(a.coef!==0&&b.coef!==0){
        return {err:'La incógnita aparece en ambos vectores en la misma componente (ecuación cuadrática). Coloca x solo en uno de los dos vectores.'};
      }
      coefficient+=a.coef*b.const+b.coef*a.const;
      constant+=a.const*b.const;
    }
    if(Math.abs(coefficient)<1e-12) return {err:'Coeficiente de '+variable+' = 0, ecuación sin solución única.'};
    const value=(target-constant)/coefficient;
    const resolved={ [variable]:value };
    const evaluate=component=>component.coef*value+component.const;
    const check=A.comps.reduce((sum,component,i)=>sum+evaluate(component)*evaluate(B.comps[i]),0);
    return {
      vars:resolved,
      steps:[
        `Producto punto: ${format(coefficient,4)}·${variable} + ${format(constant,4)} = ${format(target,4)}`,
        `${format(coefficient,4)}·${variable} = ${format(target-constant,4)}  →  ${variable} = ${format(value,6)}`,
      ],
      check:`Verificación: ${A.nm}·${B.nm} = ${format(check,6)} (esperado: ${format(target,4)})`,
    };
  }
  if(operation==='|A|'||operation==='|B|'){
    const V=parsed[operation==='|A|'?0:1];
    if(!V) return {err:'Vector no definido.'};
    if(target<0) return {err:'La magnitud no puede ser negativa.'};
    let A2=0,B2=0,C2=0;
    for(const component of V.comps){
      A2+=component.coef**2;
      B2+=2*component.coef*component.const;
      C2+=component.const**2;
    }
    C2-=target**2;
    if(Math.abs(A2)<1e-12) return {err:'La variable no afecta la magnitud.'};
    const disc=B2**2-4*A2*C2;
    if(disc<0) return {err:'No existe solución real (discriminante negativo).'};
    const first=(-B2+Math.sqrt(disc))/(2*A2),second=(-B2-Math.sqrt(disc))/(2*A2);
    const unique=Math.abs(first-second)<1e-9;
    const steps=unique
      ? [`${variable} = ${format(first,6)}`]
      : [`${variable} = ${format(first,6)} ó ${variable} = ${format(second,6)} (dos soluciones — se usa la primera)`];
    const magnitude=Math.sqrt(V.comps.reduce((sum,component)=>{
      const value=component.coef*first+component.const;
      return sum+value*value;
    },0));
    return {
      vars:{[variable]:first},steps,
      check:`|${V.nm}| con ${variable}=${format(first,4)}: ${format(magnitude,6)} (esperado: ${format(target,4)})`,
    };
  }
  return {err:'Para suma/resta define la ecuación completa en la pestaña Ecuación. Aquí usa · o magnitud.'};
}
