// Coeficientes: números, e, π y operaciones simples sin variables.
export function parseGraphCoefficient(str){
  if(!str||str.trim()==='') return NaN;
  const expression=str.trim()
    .replace(/π/g,String(Math.PI))
    .replace(/\bpi\b/gi,String(Math.PI))
    .replace(/\be\b/g,String(Math.E))
    .replace(/\^/g,'**');
  try{
    const value=Function('"use strict"; return ('+expression+')')();
    return Number.isFinite(value)?value:NaN;
  }catch(e){return NaN;}
}

const coefficient=parseGraphCoefficient;

const n=(values,key)=>typeof values[key]==='number'?values[key]:coefficient(values[key]);
export function parseGraphValues(type,raw){
  const definition=GRAPH_TYPES[type];
  if(!definition) return null;
  const values=Object.fromEntries(definition.coefs.map(field=>[field.id,coefficient(raw[field.id])]));
  return Object.values(values).every(Number.isFinite)?values:null;
}
const field=(id,label,value)=>({id,label,placeholder:value,default:value});
const steps=(formula,substitution,result)=>[
  `<span class="gs-op">${formula}</span>`,
  `<span class="gs-op">${substitution}</span>`,
  `<span class="gs-y">y = ${result}</span>`,
];

// Contrato común: metadatos de formulario, vista previa, evaluador y pasos.
// No depende del DOM ni del canvas.
export const GRAPH_TYPES={
  lin:{
    title:'Coeficientes — Lineal',coefs:[field('gm','m =','1'),field('gb','b =','0')],
    preview:v=>`y = ${v.gm}x + ${v.gb}`,
    eval:(x,v)=>n(v,'gm')*x+n(v,'gb'),
    steps:(x,v,y)=>steps('y = mx + b',`y = ${n(v,'gm')}·(${x}) + ${n(v,'gb')}`,y),
  },
  quad:{
    title:'Coeficientes — Cuadrática',coefs:[field('ga','a =','1'),field('gb','b =','0'),field('gc','c =','0')],
    preview:v=>`y = ${v.ga}x² + ${v.gb}x + ${v.gc}`,
    eval:(x,v)=>n(v,'ga')*x*x+n(v,'gb')*x+n(v,'gc'),
    steps:(x,v,y)=>steps('y = ax² + bx + c',`y = ${n(v,'ga')}·(${x})² + ${n(v,'gb')}·(${x}) + ${n(v,'gc')}`,y),
  },
  abs:{
    title:'Coeficientes — Valor Absoluto',coefs:[field('ga','a =','1'),field('gh','h =','0'),field('gk','k =','0')],
    preview:v=>`y = ${v.ga}|x + ${v.gh}| + ${v.gk}`,
    eval:(x,v)=>n(v,'ga')*Math.abs(x+n(v,'gh'))+n(v,'gk'),
    steps:(x,v,y)=>steps('y = a|x + h| + k',`y = ${n(v,'ga')}·|${x} + ${n(v,'gh')}| + ${n(v,'gk')}`,y),
  },
  exp:{
    title:'Coeficientes — Exponencial',coefs:[field('ga','a =','1'),field('gbas','b =','2')],
    preview:v=>`y = ${v.ga}·${v.gbas}ˣ`,
    eval:(x,v)=>n(v,'gbas')>0?n(v,'ga')*Math.pow(n(v,'gbas'),x):NaN,
    steps:(x,v,y)=>steps('y = a·bˣ',`y = ${n(v,'ga')}·${n(v,'gbas')}^(${x})`,y),
  },
  raiz:{
    title:'Coeficientes — Raíz Cuadrada',coefs:[field('ga','a =','1'),field('gh','h =','0'),field('gk','k =','0')],
    preview:v=>`y = ${v.ga}·√(x + ${v.gh}) + ${v.gk}`,
    eval:(x,v)=>x+n(v,'gh')>=0?n(v,'ga')*Math.sqrt(x+n(v,'gh'))+n(v,'gk'):NaN,
    steps:(x,v,y)=>steps('y = a√(x + h) + k',`y = ${n(v,'ga')}·√(${x} + ${n(v,'gh')}) + ${n(v,'gk')}`,y),
  },
  log:{
    title:'Coeficientes — Logarítmica',coefs:[field('ga','a =','1'),field('gbas','base =','10'),field('gc','c =','1'),field('gd','d =','0')],
    preview:v=>`y = ${v.ga}·log_${v.gbas}(${v.gc}x + ${v.gd})`,
    eval:(x,v)=>{
      const base=n(v,'gbas'),argument=n(v,'gc')*x+n(v,'gd');
      return base>0&&base!==1&&argument>0?n(v,'ga')*Math.log(argument)/Math.log(base):NaN;
    },
    steps:(x,v,y)=>steps('y = a·log_b(cx + d)',`y = ${n(v,'ga')}·log_${n(v,'gbas')}(${n(v,'gc')}·${x} + ${n(v,'gd')})`,y),
  },
  racional:{
    title:'Coeficientes — Racional',coefs:[field('ga','a =','1'),field('gb','b =','0'),field('gc','c =','1'),field('gd','d =','0')],
    preview:v=>`y = (${v.ga}x + ${v.gb}) / (${v.gc}x + ${v.gd})`,
    eval:(x,v)=>{
      const denominator=n(v,'gc')*x+n(v,'gd');
      return Math.abs(denominator)>1e-12?(n(v,'ga')*x+n(v,'gb'))/denominator:NaN;
    },
    steps:(x,v,y)=>steps('y = (ax + b)/(cx + d)',`y = (${n(v,'ga')}·${x} + ${n(v,'gb')}) / (${n(v,'gc')}·${x} + ${n(v,'gd')})`,y),
  },
};
