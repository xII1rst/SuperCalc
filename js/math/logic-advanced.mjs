import { truthTable, minimizeBoolean } from './logic.mjs';

export function normalForms(expression) {
  const {variables,rows,status}=truthTable(expression);
  if(!variables.length) throw new RangeError('Se requiere al menos una variable');
  const minterms=[],maxterms=[];
  rows.forEach((row,index)=>(row.result?minterms:maxterms).push(index));
  const dnf=minterms.length===rows.length?'1':minterms.length===0?'0':minterms.map(index=>
    `(${variables.map((name,j)=>rowBit(index,variables.length,j)?name:`¬${name}`).join('∧')})`).join('∨');
  const cnf=maxterms.length===rows.length?'0':maxterms.length===0?'1':maxterms.map(index=>
    `(${variables.map((name,j)=>rowBit(index,variables.length,j)?`¬${name}`:name).join('∨')})`).join('∧');
  return {variables,minterms,maxterms,dnf,cnf,status};
}
function rowBit(index,width,column) {return Boolean(index&(1<<(width-column-1)));}

export function quantifiedRelation(domain,pairs,outer='forall',inner='exists') {
  if(!Array.isArray(domain)||!domain.length||domain.length>20||new Set(domain).size!==domain.length||
    !['forall','exists'].includes(outer)||!['forall','exists'].includes(inner)) throw new RangeError('Universo o cuantificadores inválidos');
  const members=new Set(domain);
  if(!Array.isArray(pairs)||pairs.some(pair=>!Array.isArray(pair)||pair.length!==2||!members.has(pair[0])||!members.has(pair[1]))) throw new RangeError('La relación debe estar dentro del universo');
  const has=new Set(pairs.map(pair=>JSON.stringify(pair)));
  const rows=domain.map(x=>{
    const truth=domain.map(y=>has.has(JSON.stringify([x,y])));
    const result=inner==='forall'?truth.every(Boolean):truth.some(Boolean);
    const witness=inner==='exists'?(result?domain[truth.indexOf(true)]:null):(result?null:domain[truth.indexOf(false)]);
    return {x,result,witness,truth};
  });
  const result=outer==='forall'?rows.every(row=>row.result):rows.some(row=>row.result);
  const decisive=outer==='forall'?(result?null:rows.find(row=>!row.result)):(result?rows.find(row=>row.result):null);
  return {result,rows,decisive,statement:`${outer==='forall'?'∀':'∃'}x ${inner==='forall'?'∀':'∃'}y R(x,y)`,universe:domain};
}

function nonnegativeInteger(value,name,max=100) {
  if(!Number.isInteger(value)||value<0||value>max) throw new RangeError(`${name}: entero entre 0 y ${max} requerido`);
  return value;
}
export function finiteCounting(domainSize,codomainSize) {
  const n=nonnegativeInteger(domainSize,'Tamaño de dominio',40),m=nonnegativeInteger(codomainSize,'Tamaño de codominio',40);
  let injective=0n;
  if(n<=m) {injective=1n;for(let i=0;i<n;i++) injective*=BigInt(m-i);}
  const functions=BigInt(m)**BigInt(n),relations=2n**BigInt(n*m),subsets=2n**BigInt(n);
  let surjective=0n;
  for(let k=0;k<=m;k++) {
    let choose=1n;
    for(let i=1;i<=k;i++) choose=choose*BigInt(m-i+1)/BigInt(i);
    surjective+=(k%2?-1n:1n)*choose*BigInt(m-k)**BigInt(n);
  }
  return {functions,relations,subsets,injective,surjective,assumption:'funciones A→B; 0⁰=1 para la función vacía'};
}

export function karnaughMap(names,minterms,dontCares=[]) {
  const minimized=minimizeBoolean(names,minterms,dontCares);
  const width=names.length,rowWidth=Math.floor(width/2),colWidth=width-rowWidth;
  const gray=bits=>Array.from({length:2**bits},(_,i)=>i^(i>>1));
  const rows=gray(rowWidth),columns=gray(colWidth);
  const cells=rows.map(row=>columns.map(column=>{
    const index=(row<<colWidth)|column;
    return {index,value:minterms.includes(index)?'1':dontCares.includes(index)?'X':'0'};
  }));
  return {rows:rows.map(row=>row.toString(2).padStart(rowWidth,'0')),columns:columns.map(column=>column.toString(2).padStart(colWidth,'0')),
    cells,expression:minimized.expression,implicants:minimized.implicants};
}

export function nandNetwork(names,minterms,dontCares=[]) {
  const result=minimizeBoolean(names,minterms,dontCares);
  if(result.expression==='0'||result.expression==='1') return {output:result.expression,gates:[],expression:result.expression};
  const gates=[],inverted=new Map(),products=[];
  const invert=name=>{
    if(!inverted.has(name)) {const output=`n${gates.length+1}`;gates.push({output,inputs:[name,name],operation:'NAND'});inverted.set(name,output);}
    return inverted.get(name);
  };
  for(const implicant of result.implicants) {
    const literals=[...implicant.pattern].flatMap((bit,i)=>bit==='-'?[]:[bit==='1'?names[i]:invert(names[i])]);
    if(literals.length===0) return {output:'1',gates:[],expression:'1'};
    if(literals.length===1) products.push(literals[0]);
    else {const output=`n${gates.length+1}`;gates.push({output,inputs:literals,operation:'NAND'});products.push(`¬${output}`);}
  }
  if(products.length===1) {
    const value=products[0];
    if(!value.startsWith('¬')) return {output:value,gates,expression:result.expression};
    const source=value.slice(1),output=`n${gates.length+1}`;
    gates.push({output,inputs:[source,source],operation:'NAND'});
    return {output,gates,expression:result.expression};
  }
  const finalInputs=products.map(value=>{
    if(value.startsWith('¬')) return value.slice(1);
    const output=`n${gates.length+1}`;gates.push({output,inputs:[value,value],operation:'NAND'});return output;
  });
  const output=`n${gates.length+1}`;gates.push({output,inputs:finalInputs,operation:'NAND'});
  return {output,gates,expression:result.expression};
}

export function inductionSum(kind,n) {
  nonnegativeInteger(n,'n',1000);
  if(n===0) throw new RangeError('La inducción comienza en n=1');
  const formulas={natural:k=>k*(k+1)/2,squares:k=>k*(k+1)*(2*k+1)/6,cubes:k=>(k*(k+1)/2)**2};
  if(!Object.hasOwn(formulas,kind)) throw new RangeError('Identidad no soportada');
  const terms={natural:k=>k,squares:k=>k*k,cubes:k=>k**3};
  const steps={natural:'k(k+1)/2 + (k+1) = (k+1)(k+2)/2 = F(k+1)',
    squares:'k(k+1)(2k+1)/6 + (k+1)² = (k+1)(k+2)(2k+3)/6 = F(k+1)',
    cubes:'[k(k+1)/2]² + (k+1)³ = [(k+1)(k+2)/2]² = F(k+1)'};
  const value=Array.from({length:n},(_,i)=>terms[kind](i+1)).reduce((a,b)=>a+b,0);
  return {kind,n,value,closedForm:formulas[kind](n),base:{left:terms[kind](1),right:formulas[kind](1)},
    inductionStep:`Hipótesis: S(k)=F(k). Entonces S(k+1)=F(k)+a(k+1): ${steps[kind]}. Por inducción, vale para todo n≥1.`,
    warning:'La igualdad numérica en n es un ejemplo; la prueba exige el paso algebraico general.'};
}
