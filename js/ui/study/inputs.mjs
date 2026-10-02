import { calcParse, collectVariables } from '../../math/expression.mjs';

export const read=key=>document.getElementById(`study-${key}`).value.trim();
export function num(key) {const raw=read(key);if(raw===''||!Number.isFinite(Number(raw))) throw new RangeError(`${key}: número finito requerido`);return Number(raw);}
export function constant(key) {
  const raw=read(key);
  if(collectVariables(raw).length) throw new RangeError(`${key}: usa una constante numérica`);
  const fn=calcParse(raw),result=fn?fn(0):NaN;
  if(!Number.isFinite(result)) throw new RangeError(`${key}: constante inválida`);
  return result;
}
export function one(key,variable='x') {
  const source=read(key),vars=collectVariables(source).filter(name=>name!==variable);
  if(vars.length) throw new RangeError(`${key}: usa solo ${variable}`);
  const fn=calcParse(source,variable);
  if(!fn) throw new RangeError(`${key}: expresión no reconocida`);
  return fn;
}
export function two(key) {
  const source=read(key),vars=collectVariables(source).filter(name=>name!=='x');
  if(vars.some(name=>name!=='y')) throw new RangeError(`${key}: usa solo x e y`);
  const fn=calcParse(source,'x');
  if(!fn) throw new RangeError(`${key}: expresión no reconocida`);
  return vars.length?fn:(x,y)=>fn(x);
}
export function coordinateFormula(key,first,allowed,argumentsInOrder) {
  const source=read(key),variables=collectVariables(source);
  if(variables.some(name=>!allowed.includes(name))) throw new RangeError(`${key}: usa solo ${allowed.join(', ')}`);
  const parsed=calcParse(source,first);
  if(!parsed) throw new RangeError(`${key}: expresión no reconocida`);
  const extra=variables.filter(name=>name!==first);
  return (...values)=>{
    const scope=Object.fromEntries(argumentsInOrder.map((name,i)=>[name,values[i]]));
    return parsed(scope[first],...extra.map(name=>scope[name]));
  };
}
export function nums(key) {
  const list=read(key).split(/[,\s]+/).filter(Boolean).map(Number);
  if(!list.length||list.some(value=>!Number.isFinite(value))) throw new RangeError(`${key}: lista numérica inválida`);
  return list;
}
export function polynomialTerms(key) {
  const lines=read(key).split(/[\n;]+/).map(line=>line.trim()).filter(Boolean);
  if(!lines.length||lines.length>30) throw new RangeError(`${key}: introduce de 1 a 30 términos`);
  return lines.map(line=>{
    const values=line.split(/[,\s]+/).filter(Boolean).map(Number);
    if(values.length!==3||values.some(value=>!Number.isFinite(value))) throw new RangeError(`${key}: usa coeficiente, potencia x, potencia y`);
    return values;
  });
}
