import { calcParse, collectVariables } from '../expression.mjs';
import { simpsonIntegral } from './numeric.mjs';

// Región comprendida entre y=f(x), y=0, x=a y x=b.
// Eje X: discos. Eje Y: cascarones; el intervalo debe quedar a un solo lado
// del eje para no contar dos veces el mismo volumen al rotar.
export function revolutionVolume(fn,a,b,axis='x',n=1000){
  if(typeof fn!=='function') throw new TypeError('Ingresa una función válida');
  if(!Number.isFinite(a)||!Number.isFinite(b)||a>=b)
    throw new RangeError('Se requieren límites finitos con a < b');
  if(axis!=='x'&&axis!=='y') throw new RangeError('El eje debe ser X o Y');
  if(!Number.isInteger(n)||n<2||n%2!==0)
    throw new RangeError('El número de subintervalos debe ser par y positivo');
  if(axis==='y'&&a<0&&b>0)
    throw new RangeError('Para el eje Y, el intervalo no puede cruzar x = 0');

  const section=x=>{
    const height=fn(x,0);
    if(!Number.isFinite(height)) throw new RangeError('La función no es finita en el intervalo');
    const area=axis==='x' ? Math.PI*height*height : 2*Math.PI*Math.abs(x)*Math.abs(height);
    if(!Number.isFinite(area)) throw new RangeError('El volumen excede el rango numérico');
    return area;
  };
  const volume=simpsonIntegral(section,a,b,n);
  if(!Number.isFinite(volume)) throw new RangeError('No se pudo calcular un volumen finito');
  return volume;
}

// Región entre dos curvas. En el eje X, una sección que cruza y=0 forma
// un disco; si ambas curvas están del mismo lado forma una arandela.
export function revolutionVolumeBetween(fn,gn,a,b,axis='x',n=1000){
  if(typeof fn!=='function'||typeof gn!=='function')
    throw new TypeError('Ingresa dos funciones válidas');
  if(!Number.isFinite(a)||!Number.isFinite(b)||a>=b)
    throw new RangeError('Se requieren límites finitos con a < b');
  if(axis!=='x'&&axis!=='y') throw new RangeError('El eje debe ser X o Y');
  if(!Number.isInteger(n)||n<2||n%2!==0)
    throw new RangeError('El número de subintervalos debe ser par y positivo');
  if(axis==='y'&&a<0&&b>0)
    throw new RangeError('Para el eje Y, el intervalo no puede cruzar x = 0');

  const section=x=>{
    const f=fn(x,0), g=gn(x,0);
    if(!Number.isFinite(f)||!Number.isFinite(g))
      throw new RangeError('Las funciones deben ser finitas en todo el intervalo');
    let area;
    if(axis==='x'){
      const outer=Math.max(Math.abs(f),Math.abs(g));
      const inner=f*g<=0 ? 0 : Math.min(Math.abs(f),Math.abs(g));
      area=Math.PI*(outer*outer-inner*inner);
    }else{
      area=2*Math.PI*Math.abs(x)*Math.abs(f-g);
    }
    if(!Number.isFinite(area)) throw new RangeError('El volumen excede el rango numérico');
    return area;
  };
  const volume=simpsonIntegral(section,a,b,n);
  if(!Number.isFinite(volume)) throw new RangeError('No se pudo calcular un volumen finito');
  return volume;
}

// Gira la región entre f y g (o el eje X si g es null) alrededor de y=c o x=c.
// Los cascarones solo se aceptan cuando el intervalo está a un lado de x=c.
export function revolutionVolumeAboutLine(fn,gn,a,b,axis='x',offset=0,n=1000){
  if(typeof fn!=='function'||(gn!==null&&typeof gn!=='function'))
    throw new TypeError('Ingresa funciones válidas');
  if(!Number.isFinite(a)||!Number.isFinite(b)||a>=b)
    throw new RangeError('Se requieren límites finitos con a < b');
  if(axis!=='x'&&axis!=='y') throw new RangeError('El eje debe ser X o Y');
  if(!Number.isFinite(offset)) throw new RangeError('El desplazamiento del eje debe ser finito');
  if(!Number.isInteger(n)||n<2||n%2!==0)
    throw new RangeError('El número de subintervalos debe ser par y positivo');
  if(axis==='y'&&a<offset&&b>offset)
    throw new RangeError('Para cascarones, el intervalo no puede cruzar el eje de giro x = c');

  const section=x=>{
    const f=fn(x,0),g=gn?gn(x,0):0;
    if(!Number.isFinite(f)||!Number.isFinite(g))
      throw new RangeError('Las funciones deben ser finitas en todo el intervalo');
    let area;
    if(axis==='x'){
      const first=f-offset,second=g-offset;
      const outer=Math.max(Math.abs(first),Math.abs(second));
      const inner=first*second<=0 ? 0 : Math.min(Math.abs(first),Math.abs(second));
      area=Math.PI*(outer*outer-inner*inner);
    }else{
      area=2*Math.PI*Math.abs(x-offset)*Math.abs(f-g);
    }
    if(!Number.isFinite(area)) throw new RangeError('El volumen excede el rango numérico');
    return area;
  };
  const volume=simpsonIntegral(section,a,b,n);
  if(!Number.isFinite(volume)) throw new RangeError('No se pudo calcular un volumen finito');
  return volume;
}

// Acepta f(x), y=f(x) y formas lineales como y=-mx+b.
// Los coeficientes se fijan antes de evaluar para mantener una función de x.
export function parseRevolutionFunction(expression,{m=1,b=0}={}){
  if(!Number.isFinite(m)||!Number.isFinite(b)) return null;
  let source=String(expression||'').trim()
    .replace(/^(?:y|f\(x\)|g\(x\))\s*=\s*/i,'')
    .replace(/\bmx\b/g,'m*x')
    .replace(/\bm\s+x\b/g,'m*x');
  if(collectVariables(source).some(name=>!['x','m','b'].includes(name))) return null;
  source=source.replace(/\b[mb]\b/g,name=>`(${name==='m'?m:b})`);
  return calcParse(source);
}

export function curveIntersections(fn,gn,a,b,steps=512){
  if(typeof fn!=='function'||typeof gn!=='function'||!Number.isFinite(a)||!Number.isFinite(b)||a>=b)
    return [];
  const roots=[];
  const gap=(b-a)/steps;
  const difference=x=>fn(x,0)-gn(x,0);
  const add=x=>{
    const y=fn(x,0), other=gn(x,0);
    if(!Number.isFinite(y)||!Number.isFinite(other)||
       Math.abs(y-other)>1e-7*Math.max(1,Math.abs(y),Math.abs(other))||
       roots.some(root=>Math.abs(root.x-x)<gap*0.1)) return;
    roots.push({x,y});
  };
  let previous=difference(a);
  for(let i=1;i<=steps;i++){
    const left=a+(i-1)*gap, right=i===steps?b:a+i*gap;
    const current=difference(right);
    if(Number.isFinite(previous)&&Number.isFinite(current)){
      if(previous===0&&current!==0) add(left);
      if(current===0&&previous!==0) add(right);
      if(previous*current<0){
        let lo=left, hi=right, loValue=previous;
        for(let j=0;j<45;j++){
          const mid=(lo+hi)/2, value=difference(mid);
          if(!Number.isFinite(value)) break;
          if(value===0){lo=hi=mid;break;}
          if(Math.sign(value)===Math.sign(loValue)){lo=mid;loValue=value;}
          else hi=mid;
        }
        add((lo+hi)/2);
      }
    }
    previous=current;
  }
  return roots;
}
