import { truthTable, argumentValidity, minimizeBoolean } from './logic.mjs';

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

export function integerQuantifierExample(domain) {
  if(!['Z','N'].includes(domain)) throw new RangeError('Elige ℤ o ℕ');
  const integers=domain==='Z';
  return {domain,convention:integers?'ℤ contiene todos los enteros.':'ℕ={0,1,2,…}; si ℕ empieza en 1, las conclusiones siguen iguales.',
    rows:[
      {statement:'∀x∃y (x+y=0)',truth:integers,
        reason:integers?'Para cada x∈ℤ, el testigo y=−x pertenece a ℤ.':'Contraejemplo x=1: para todo y∈ℕ, 1+y>0.'},
      {statement:'∃y∀x (x+y=0)',truth:false,
        reason:integers?'Para cualquier y∈ℤ, x=1−y da x+y=1, así que ningún y sirve.':'Para cualquier y∈ℕ, x=1 da x+y≥1, así que ningún y sirve.'},
      {statement:'¬∀x∃y (x+y=0) ⇔ ∃x∀y (x+y≠0)',truth:!integers,
        reason:integers?'Es falsa: dado x, elegir y=−x produce suma cero.':'Es verdadera: x=1 funciona para todos los y∈ℕ.'},
      {statement:'¬∃y∀x (x+y=0) ⇔ ∀y∃x (x+y≠0)',truth:true,
        reason:integers?'Es verdadera: dado y, elegir x=1−y produce suma 1.':'Es verdadera: para todo y∈ℕ sirve x=1.'},
    ]};
}

export function guidedDisjunctionProof() {
  const premises=['p→q','r→s','p∨r'],conclusion='q∨s';
  const validity=argumentValidity(premises,conclusion);
  return {premises,conclusion,valid:validity.valid,
    steps:[
      ['1','p→q','Premisa'],['2','r→s','Premisa'],['3','p∨r','Premisa'],
      ['4','p','Supuesto: primera rama'],['5','q','→E, 1 y 4'],['6','q∨s','∨I, 5'],
      ['7','r','Supuesto: segunda rama'],['8','s','→E, 2 y 7'],['9','q∨s','∨I, 8'],
      ['10','q∨s','∨E, 3 y ramas 4–6, 7–9'],
    ]};
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

export function guidedInduction(kind,n) {
  nonnegativeInteger(n,'n',1000);
  if(!['power2','power7','odds','factorial'].includes(kind)) throw new RangeError('Identidad no soportada');
  const start=kind==='factorial'?4:1;
  if(n<start) throw new RangeError(`La prueba de este caso comienza en n=${start}`);
  if(kind==='power2'||kind==='power7') {
    const base=kind==='power2'?3:7,divisor=base-1;
    const value=BigInt(base)**BigInt(n)-1n;
    return {kind,n,start,statement:`${base}ⁿ−1 es divisible por ${divisor} para n≥1`,
      base:`n=1: ${base}−1=${divisor}, múltiplo de ${divisor}.`,
      step:`Si ${base}ᵏ−1=${divisor}m para algún entero m, entonces ${base}^(k+1)−1 = ${base}(${base}ᵏ−1)+${divisor} = ${divisor}(${base}m+1). Por inducción, vale para todo n≥1.`,
      example:`n=${n}: residuo al dividir ${base}ⁿ−1 entre ${divisor} = ${value%BigInt(divisor)}.`};
  }
  if(kind==='odds') return {kind,n,start,statement:'1+3+⋯+(2n−1)=n² para n≥1',
    base:'n=1: 1=1².',
    step:'Si S(k)=k², entonces S(k+1)=k²+[2(k+1)−1]=k²+2k+1=(k+1)². Por inducción, vale para todo n≥1.',
    example:`n=${n}: suma de impares = ${n*n}; fórmula n² = ${n*n}.`};
  let factorial=1n;
  for(let k=2;k<=n;k++) factorial*=BigInt(k);
  return {kind,n,start,statement:'n! > 2ⁿ para n≥4',
    base:'n=4: 4!=24 > 16=2⁴.',
    step:'Si k! > 2ᵏ y k≥4, entonces (k+1)!=(k+1)k! > (k+1)2ᵏ > 2·2ᵏ=2^(k+1), porque k+1≥5>2. Por inducción, vale para todo n≥4.',
    example:`n=${n}: n! > 2ⁿ es ${factorial>2n**BigInt(n)?'verdadero':'falso'}.`};
}
