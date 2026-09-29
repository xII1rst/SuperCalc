const DIGITS='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function base(value, label='Base') {
  if (!Number.isInteger(value)||value<2||value>36) throw new RangeError(`${label} debe estar entre 2 y 36`);
  return value;
}

export function parseBaseNumber(input, radix) {
  base(radix);
  const text=String(input).trim().toUpperCase();
  if (!/^[+-]?[0-9A-Z]+(?:\.[0-9A-Z]+)?$/.test(text)) throw new RangeError('Número posicional inválido');
  const negative=text.startsWith('-');
  const unsigned=text.replace(/^[+-]/,'');
  const [whole,fraction='']=unsigned.split('.');
  let numerator=0n;
  for (const char of whole+fraction) {
    const digit=DIGITS.indexOf(char);
    if (digit<0||digit>=radix) throw new RangeError(`Dígito ${char} inválido en base ${radix}`);
    numerator=numerator*BigInt(radix)+BigInt(digit);
  }
  const denominator=BigInt(radix)**BigInt(fraction.length);
  return {numerator:negative?-numerator:numerator,denominator};
}

export function convertBase(input, fromBase, toBase, maxFractionDigits=32) {
  base(toBase,'Base destino');
  if (!Number.isInteger(maxFractionDigits)||maxFractionDigits<0||maxFractionDigits>128) throw new RangeError('Máximo de cifras fraccionarias inválido');
  const {numerator,denominator}=parseBaseNumber(input,fromBase);
  let whole=(numerator<0n?-numerator:numerator)/denominator;
  let remainder=(numerator<0n?-numerator:numerator)%denominator;
  let wholeText='';
  do {wholeText=DIGITS[Number(whole%BigInt(toBase))]+wholeText;whole/=BigInt(toBase);} while(whole>0n);
  let fraction='', repeatingAt=null;
  const seen=new Map();
  while(remainder!==0n && fraction.length<maxFractionDigits) {
    if (seen.has(remainder)) {repeatingAt=seen.get(remainder);break;}
    seen.set(remainder,fraction.length);
    remainder*=BigInt(toBase);
    fraction+=DIGITS[Number(remainder/denominator)];
    remainder%=denominator;
  }
  const sign=numerator<0n?'-':'';
  const status=remainder===0n?'exact':repeatingAt!==null?'repeating':'truncated';
  return {text:sign+wholeText+(fraction?'.'+fraction:''),status,repeatingAt,
    numerator,denominator,fromBase,toBase};
}

export function baseArithmetic(first,second,radix,operation) {
  const a=parseBaseNumber(first,radix),b=parseBaseNumber(second,radix);
  if (a.denominator!==1n||b.denominator!==1n) throw new RangeError('Esta aritmética requiere enteros');
  let result,remainder=null;
  if (operation==='add') result=a.numerator+b.numerator;
  else if (operation==='subtract') result=a.numerator-b.numerator;
  else if (operation==='multiply') result=a.numerator*b.numerator;
  else if (operation==='divide') {
    if (b.numerator===0n) throw new RangeError('División entre cero');
    result=a.numerator/b.numerator;
    remainder=a.numerator%b.numerator;
  } else throw new RangeError('Operación aritmética inválida');
  const format=value=>value.toString(radix).toUpperCase();
  return {result:format(result),remainder:remainder===null?null:format(remainder),decimal:result,operation,radix};
}

export function twosComplement(value, width) {
  if (!Number.isInteger(width)||width<2||width>64) throw new RangeError('Ancho entre 2 y 64 bits');
  const number=typeof value==='bigint'?value:BigInt(value);
  const limit=1n<<BigInt(width-1);
  if (number < -limit || number >= limit) throw new RangeError('Valor fuera del rango con signo');
  const mask=(1n<<BigInt(width))-1n;
  return {bits:(number&mask).toString(2).padStart(width,'0'),value:number,width};
}

export function signedBinaryAddition(first,second,width) {
  const a=twosComplement(first,width), b=twosComplement(second,width);
  const sum=a.value+b.value;
  const mask=(1n<<BigInt(width))-1n;
  const encoded=sum&mask;
  const signed=encoded>=(1n<<BigInt(width-1))?encoded-(1n<<BigInt(width)):encoded;
  return {first:a.bits,second:b.bits,bits:encoded.toString(2).padStart(width,'0'),signed,
    overflow:signed!==sum,exact:sum};
}

export function bitwiseWord(first,second,width) {
  if (!Number.isInteger(width)||width<1||width>64) throw new RangeError('Ancho entre 1 y 64 bits');
  const limit=1n<<BigInt(width), a=BigInt(first),b=BigInt(second);
  if (a<0n||b<0n||a>=limit||b>=limit) throw new RangeError('Operandos fuera del ancho');
  const format=value=>value.toString(2).padStart(width,'0');
  return {and:format(a&b),or:format(a|b),xor:format(a^b),notFirst:format((limit-1n)^a)};
}

function tokenize(expression) {
  const source=String(expression).trim();
  const tokens=[];
  const pattern=/\s*(<->|↔|->|→|[()!~¬&∧·|∨+^⊕']|[A-Za-z][A-Za-z0-9_]*)/gy;
  let position=0;
  while(position<source.length) {
    pattern.lastIndex=position;
    const match=pattern.exec(source);
    if (!match) throw new RangeError(`Símbolo no reconocido cerca de: ${source.slice(position,position+10)}`);
    tokens.push(match[1]);
    position=pattern.lastIndex;
  }
  return tokens;
}

const OPERATORS={
  '&':{name:'and',priority:4},'∧':{name:'and',priority:4},'·':{name:'and',priority:4},
  '^':{name:'xor',priority:3},'⊕':{name:'xor',priority:3},
  '|':{name:'or',priority:2},'∨':{name:'or',priority:2},'+':{name:'or',priority:2},
  '->':{name:'implies',priority:1},'→':{name:'implies',priority:1},
  '<->':{name:'iff',priority:0},'↔':{name:'iff',priority:0},
};

export function parseProposition(expression) {
  const tokens=tokenize(expression);
  if (!tokens.length) throw new RangeError('Introduce una proposición');
  let index=0;
  function primary() {
    const token=tokens[index++];
    if (['!','~','¬'].includes(token)) return {type:'not',child:primary()};
    let node;
    if (token==='(') {
      node=parse(0);
      if (tokens[index++]!==')') throw new RangeError('Paréntesis sin cerrar');
    } else if (/^[A-Za-z][A-Za-z0-9_]*$/.test(token||'')) node={type:'variable',name:token};
    else throw new RangeError('Se esperaba una variable o paréntesis');
    while(tokens[index]==="'") {index++;node={type:'not',child:node};}
    return node;
  }
  function parse(minimum) {
    let left=primary();
    while(index<tokens.length) {
      const op=OPERATORS[tokens[index]];
      if (!op||op.priority<minimum) break;
      index++;
      const right=parse(op.priority+(op.name==='implies'?0:1));
      left={type:op.name,left,right};
    }
    return left;
  }
  const tree=parse(0);
  if (index!==tokens.length) throw new RangeError('Expresión proposicional incompleta');
  return tree;
}

function propositionVariables(tree, output=new Set()) {
  if (tree.type==='variable') output.add(tree.name);
  else if (tree.type==='not') propositionVariables(tree.child,output);
  else {propositionVariables(tree.left,output);propositionVariables(tree.right,output);}
  return output;
}

export function evaluateProposition(tree, values) {
  if (tree.type==='variable') {
    if (!Object.hasOwn(values,tree.name)) throw new RangeError(`Falta ${tree.name}`);
    return Boolean(values[tree.name]);
  }
  if (tree.type==='not') return !evaluateProposition(tree.child,values);
  const a=evaluateProposition(tree.left,values), b=evaluateProposition(tree.right,values);
  switch(tree.type) {
    case 'and':return a&&b;
    case 'or':return a||b;
    case 'xor':return a!==b;
    case 'implies':return !a||b;
    case 'iff':return a===b;
    default:throw new RangeError('Operador desconocido');
  }
}

export function truthTable(expression) {
  const tree=parseProposition(expression);
  const variables=[...propositionVariables(tree)].sort();
  if (variables.length>6) throw new RangeError('Máximo 6 variables (64 filas)');
  const rows=Array.from({length:2**variables.length},(_,number)=>{
    const values=Object.fromEntries(variables.map((variable,index)=>[variable,Boolean((number>>(variables.length-index-1))&1)]));
    return {values,result:evaluateProposition(tree,values)};
  });
  return {variables,rows,status:rows.every(row=>row.result)?'tautology':rows.every(row=>!row.result)?'contradiction':'contingent'};
}

export function argumentValidity(premises,conclusion) {
  if (!Array.isArray(premises)||!premises.length) throw new RangeError('Introduce al menos una premisa');
  const trees=premises.map(parseProposition), end=parseProposition(conclusion);
  const variables=[...trees.reduce((set,tree)=>propositionVariables(tree,set),propositionVariables(end))].sort();
  if (variables.length>6) throw new RangeError('Máximo 6 variables');
  for (let number=0;number<2**variables.length;number++) {
    const values=Object.fromEntries(variables.map((variable,index)=>[variable,Boolean((number>>(variables.length-index-1))&1)]));
    if (trees.every(tree=>evaluateProposition(tree,values))&&!evaluateProposition(end,values)) {
      return {valid:false,counterexample:values,variables};
    }
  }
  return {valid:true,counterexample:null,variables};
}

export function finiteSetOperations(first,second) {
  const A=new Set(first),B=new Set(second);
  return {union:[...new Set([...A,...B])],intersection:[...A].filter(value=>B.has(value)),
    difference:[...A].filter(value=>!B.has(value)),symmetricDifference:[...new Set([...A,...B])].filter(value=>A.has(value)!==B.has(value))};
}

export function relationProperties(domain,pairs) {
  const values=[...new Set(domain)];
  const members=new Set(values);
  if (!values.length||pairs.some(pair=>!Array.isArray(pair)||pair.length!==2||!members.has(pair[0])||!members.has(pair[1]))) {
    throw new RangeError('Relación fuera del dominio');
  }
  const has=new Set(pairs.map(([a,b])=>JSON.stringify([a,b])));
  const related=(a,b)=>has.has(JSON.stringify([a,b]));
  const reflexive=values.every(value=>related(value,value));
  const symmetric=pairs.every(([a,b])=>related(b,a));
  const transitive=pairs.every(([a,b])=>pairs.every(([c,d])=>b!==c||related(a,d)));
  const equivalence=reflexive&&symmetric&&transitive;
  const classes=equivalence?values.reduce((output,value)=>{
    if (!output.some(group=>group.includes(value))) output.push(values.filter(other=>related(value,other)));
    return output;
  },[]):[];
  return {domain:values,range:[...new Set(pairs.map(pair=>pair[1]))],reflexive,symmetric,transitive,equivalence,classes,
    matrix:values.map(a=>values.map(b=>related(a,b)?1:0))};
}

function validateMinterms(names,minterms,dontCares) {
  if (!Array.isArray(names)||names.length<1||names.length>4||new Set(names).size!==names.length||names.some(name=>!/^[A-Za-z]$/.test(name))) {
    throw new RangeError('Usa entre 1 y 4 variables de una letra');
  }
  const limit=2**names.length;
  const all=[...minterms,...dontCares];
  if (all.some(value=>!Number.isInteger(value)||value<0||value>=limit)||new Set(all).size!==all.length) throw new RangeError('Minitérminos repetidos o fuera de rango');
}

export function minimizeBoolean(names,minterms,dontCares=[]) {
  validateMinterms(names,minterms,dontCares);
  const width=names.length;
  if (!minterms.length) return {expression:'0',implicants:[]};
  let current=[...minterms,...dontCares].map(value=>({pattern:value.toString(2).padStart(width,'0'),covers:new Set([value])}));
  const primes=new Map();
  while(current.length) {
    const used=new Set(),next=new Map();
    for(let i=0;i<current.length;i++) for(let j=i+1;j<current.length;j++) {
      const a=current[i].pattern,b=current[j].pattern;
      const differences=[...a].map((char,k)=>char===b[k]?-1:k).filter(k=>k>=0);
      if (differences.length!==1||a[differences[0]]==='-'||b[differences[0]]==='-') continue;
      used.add(i);used.add(j);
      const pattern=a.slice(0,differences[0])+'-'+a.slice(differences[0]+1);
      const covers=new Set([...current[i].covers,...current[j].covers]);
      if (next.has(pattern)) covers.forEach(value=>next.get(pattern).covers.add(value));
      else next.set(pattern,{pattern,covers});
    }
    current.forEach((item,index)=>{if(!used.has(index)) primes.set(item.pattern,item);});
    current=[...next.values()];
  }
  const candidates=[...primes.values()].map(item=>({pattern:item.pattern,covers:minterms.filter(value=>[...item.pattern].every((char,index)=>char==='-'||Number(char)===((value>>(width-index-1))&1)))}))
    .filter(item=>item.covers.length);
  let best=null;
  for (let mask=1;mask<2**candidates.length;mask++) {
    const selected=candidates.filter((_,i)=>(mask>>i)&1);
    const covered=new Set(selected.flatMap(item=>item.covers));
    if (covered.size!==minterms.length) continue;
    const cost=selected.reduce((sum,item)=>sum+[...item.pattern].filter(char=>char!=='-').length,0);
    if (!best||selected.length<best.selected.length||selected.length===best.selected.length&&cost<best.cost) best={selected,cost};
  }
  if (!best) throw new RangeError('No se pudo cubrir la función');
  const expression=best.selected.map(item=>[...item.pattern].map((char,index)=>char==='-'?'':char==='1'?names[index]:`${names[index]}'`).join('')||'1').join(' + ');
  return {expression,implicants:best.selected};
}
