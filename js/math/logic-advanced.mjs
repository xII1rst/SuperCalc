import { truthTable, argumentValidity, minimizeBoolean, parseProposition, evaluateProposition } from './logic.mjs';
import { calcParse, collectVariables } from './expression.mjs';

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
  const bell=[1n];for(let size=1;size<=n;size++){let choose=1n,value=0n;for(let k=0;k<size;k++){value+=choose*bell[k];choose=choose*BigInt(size-1-k)/BigInt(k+1);}bell.push(value);}
  return {functions,relations,subsets,injective,surjective,cartesianSize:n*m,binaryRelations:2n**BigInt(n*n),reflexiveRelations:2n**BigInt(n*(n-1)),symmetricRelations:2n**BigInt(n*(n+1)/2),equivalenceRelations:bell[n],
    assumption:'funciones A→B; 0⁰=1 para la función vacía; relaciones binarias en A: 2^(n²), reflexivas 2^(n(n−1)), simétricas 2^(n(n+1)/2), equivalencias Bₙ por particiones (número de Bell)'};
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
  const groups=minimized.implicants.map((item,i)=>({name:`G${i+1}`,pattern:item.pattern,indices:cells.flat().filter(cell=>[...item.pattern].every((bit,j)=>bit==='-'||Number(bit)===Number(rowBit(cell.index,width,j)))).map(cell=>cell.index)}));
  cells.flat().forEach(cell=>cell.groups=groups.filter(group=>group.indices.includes(cell.index)).map(group=>group.name));
  return {rows:rows.map(row=>row.toString(2).padStart(rowWidth,'0')),columns:columns.map(column=>column.toString(2).padStart(colWidth,'0')),
    cells,expression:minimized.expression,implicants:minimized.implicants,groups};
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

export function setCardinality(sizes,pairIntersections,triple=0,universe=null){
  if(!Array.isArray(sizes)||![2,3].includes(sizes.length)||!Array.isArray(pairIntersections)||pairIntersections.length!==(sizes.length===2?1:3)||[...sizes,...pairIntersections,triple,...(universe===null?[]:[universe])].some(v=>!Number.isSafeInteger(v)||v<0))throw new RangeError('Cardinalidades enteras no negativas para dos o tres conjuntos');
  if(sizes.length===2&&triple!==0)throw new RangeError('Dos conjuntos no tienen intersección triple');
  const atoms=sizes.length===2?[sizes[0]-pairIntersections[0],sizes[1]-pairIntersections[0],pairIntersections[0]]:
    [sizes[0]-pairIntersections[0]-pairIntersections[1]+triple,sizes[1]-pairIntersections[0]-pairIntersections[2]+triple,sizes[2]-pairIntersections[1]-pairIntersections[2]+triple,...pairIntersections.map(v=>v-triple),triple];
  if(atoms.some(v=>v<0))throw new RangeError('Intersecciones incompatibles: alguna región disjunta tiene cardinalidad negativa');
  const union=sizes.reduce((s,v)=>s+v,0)-pairIntersections.reduce((s,v)=>s+v,0)+triple;
  if(universe!==null&&union>universe)throw new RangeError('La unión supera el universo');
  return {union,complement:universe===null?null:universe-union,atoms,formula:sizes.length===2?'|A∪B|=|A|+|B|−|A∩B|':'|A∪B∪C|=|A|+|B|+|C|−|AB|−|AC|−|BC|+|ABC|'};
}
export function quantifiedPredicate(domain,expression){
  if(!Array.isArray(domain)||!domain.length||domain.length>40||new Set(domain).size!==domain.length||domain.some(v=>!Number.isFinite(v))||typeof expression!=='string'||expression.length>200)throw new RangeError('Universo finito no vacío y predicado simple');
  const match=/^(.+?)\s*(<=|>=|!=|=|<|>|≤|≥|≠)\s*(.+)$/.exec(expression);
  if(!match||[...collectVariables(match[1]),...collectVariables(match[3])].some(v=>v!=='x'))throw new RangeError('Predicado: dos expresiones en x separadas por <,≤,=,≠,≥,>');
  const left=calcParse(match[1]),right=calcParse(match[3]);if(!left||!right)throw new RangeError('Predicado no evaluable');
  const op=match[2],rows=domain.map(x=>{const a=left(x),b=right(x);if(![a,b].every(Number.isFinite))throw new RangeError('Predicado fuera de dominio');const truth=op==='<'?a<b:op==='>'?a>b:['<=','≤'].includes(op)?a<=b:['>=','≥'].includes(op)?a>=b:['!=','≠'].includes(op)?a!==b:a===b;return {x,left:a,right:b,truth};});
  return {rows,universal:rows.every(r=>r.truth),existential:rows.some(r=>r.truth),witness:rows.find(r=>r.truth)?.x??null,counterexample:rows.find(r=>!r.truth)?.x??null,
    negations:'¬∀x P(x) ⇔ ∃x ¬P(x); ¬∃x P(x) ⇔ ∀x ¬P(x). El alcance es exclusivamente el universo finito indicado.'};
}
export function affinePowerComposition(a,b,power){
  if(![a,b].every(Number.isFinite)||a===0||!Number.isInteger(power)||power<1||power>6)throw new RangeError('f(x)=ax+b con a≠0 y g(x)=xⁿ, n=1–6');
  return {gAfterF:`((${a})x+(${b}))^${power}`,fAfterG:`(${a})x^${power}+(${b})`,inverse:`(x−(${b}))/(${a})`,
    proof:'g∘f=g(f(x)); f∘g=f(g(x)). y=ax+b ⇒ x=(y−b)/a; ambos lados de f⁻¹∘f y f∘f⁻¹ son la identidad en ℝ.'};
}
export function guidedNegations(){
  return {deMorgan:'¬(p∧q) ⇔ ¬p∨¬q; ¬(p∨q) ⇔ ¬p∧¬q.',negationOfNegatedConjunction:'La negación de toda la fórmula ¬(p∧q) es p∧q (doble negación).',
    quantified:'¬∀x(x>2) ⇔ ∃x(x≤2), sobre el mismo universo.',proof:'De Morgan se comprueba en las cuatro asignaciones; negar ∀ exige un contraejemplo. El universo y alcance del cuantificador se conservan.'};
}
export function norNetwork(names,minterms,dontCares=[]){
  minimizeBoolean(names,minterms,dontCares); // Validate before enumerating.
  // Minimize the complement, then apply De Morgan to get a product of sums.
  const complement=Array.from({length:2**names.length},(_,i)=>i).filter(i=>!minterms.includes(i)&&!dontCares.includes(i));
  const result=minimizeBoolean(names,complement,dontCares);
  if(result.expression==='0'||result.expression==='1')return {output:result.expression==='0'?'1':'0',gates:[],expression:result.expression==='0'?'1':'0'};
  const gates=[],inverted=new Map(),products=[];
  const gate=inputs=>{const output=`n${gates.length+1}`;gates.push({output,inputs,operation:'NOR'});return output;};
  const invert=name=>{if(!inverted.has(name))inverted.set(name,gate([name,name]));return inverted.get(name);};
  const clauses=[];
  for(const item of result.implicants){
    const literals=[...item.pattern].flatMap((bit,i)=>bit==='-'?[]:[bit==='0'?names[i]:invert(names[i])]);
    clauses.push(`(${[...item.pattern].flatMap((bit,i)=>bit==='-'?[]:[bit==='0'?names[i]:`¬${names[i]}`]).join('∨')})`);
    if(result.implicants.length===1&&literals.length===1)return {output:literals[0],gates,expression:clauses[0]};
    if(literals.length===1)products.push(invert(literals[0]));else products.push(gate(literals));
  }
  const output=products.length===1?invert(products[0]):gate(products);
  return {output,gates,expression:clauses.join('∧'),assumption:'Compuertas NOR con tantas entradas como muestra la tabla; se comparten inversores. Constantes 0/1 y cables no cuentan como compuertas.'};
}
export function booleanMinterms(names,kind,indices=[],expression=''){
  minimizeBoolean(names,indices,[]);
  if(kind==='minterms')return indices;
  if(kind==='maxterms')return Array.from({length:2**names.length},(_,i)=>i).filter(i=>!indices.includes(i));
  if(kind!=='formula'||truthTable(expression).variables.some(v=>!names.includes(v)))throw new RangeError('Fórmula usa variables fuera del orden declarado');
  const tree=parseProposition(expression);
  return Array.from({length:2**names.length},(_,i)=>i).filter(i=>evaluateProposition(tree,Object.fromEntries(names.map((name,j)=>[name,rowBit(i,names.length,j)]))));
}
