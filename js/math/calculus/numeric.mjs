export function rk4(fn,x0,y0,h,steps){
  if(typeof fn!=='function'||![x0,y0,h].every(Number.isFinite)||h===0
    ||!Number.isInteger(steps)||steps<1||steps>5000){
    throw new RangeError('Datos de RK4 inválidos');
  }
  let x=x0,y=y0,pts=[[x,y]];
  for(let i=0;i<steps;i++){
    const k1=fn(x,y),k2=fn(x+h/2,y+h/2*k1);
    const k3=fn(x+h/2,y+h/2*k2),k4=fn(x+h,y+h*k3);
    if(![k1,k2,k3,k4].every(Number.isFinite)) throw new RangeError('La derivada no es finita en el intervalo');
    y+=h/6*(k1+2*k2+2*k3+k4); x=x0+(i+1)*h;
    if(!Number.isFinite(y)) throw new RangeError('La solución dejó de ser finita');
    pts.push([x,y]);
  }
  return pts;
}

export function rk4Refinement(fn,x0,y0,xFinal,steps){
  if(!Number.isFinite(xFinal)||xFinal===x0||!Number.isInteger(steps)||steps<1||steps>1000){
    throw new RangeError('Ingresa x final distinto de x₀ y entre 1 y 1000 pasos');
  }
  const h=(xFinal-x0)/steps;
  const coarse=rk4(fn,x0,y0,h,steps);
  const fine=rk4(fn,x0,y0,h/2,2*steps);
  const coarseValue=coarse.at(-1)[1], fineValue=fine.at(-1)[1];
  return {coarse,fine,h,coarseValue,fineValue,errorEstimate:Math.abs(fineValue-coarseValue)/15};
}

// Núcleos numéricos usados por los formularios de integrales y multivariable.
// Reciben funciones y números; no leen inputs ni producen HTML.
export function simpsonIntegral(fn,a,b,n=1000){
  const h=(b-a)/n;
  let s=fn(a,0)+fn(b,0);
  for(let i=1;i<n;i++) s+=(i%2===0?2:4)*fn(a+i*h,0);
  return s*h/3;
}

export function taylorCoefficients(fn,a,nTerms){
  function fact(n){let r=1;for(let i=2;i<=n;i++)r*=i;return r;}
  const h=1e-4, terms=[];
  for(let k=0;k<=Math.min(nTerms,8);k++){
    let dk=0;
    for(let i=0;i<=k;i++){
      let binom=1;
      for(let j=0;j<i;j++) binom=binom*(k-j)/(j+1);
      dk+=((i%2===0?1:-1)*binom*fn(a+(k-i)*h,0));
    }
    dk/=Math.pow(h,k);
    const coef=dk/fact(k);
    if(Math.abs(coef)>=1e-10) terms.push({k,coef});
  }
  return terms;
}

export function partialDerivative(fn,x,y,varName,order,h=1e-6){
  if(varName==='x'){
    if(order===1) return (fn(x+h,y)-fn(x-h,y))/(2*h);
    return (fn(x+h,y)-2*fn(x,y)+fn(x-h,y))/(h*h);
  }
  if(order===1) return (fn(x,y+h)-fn(x,y-h))/(2*h);
  return (fn(x,y+h)-2*fn(x,y)+fn(x,y-h))/(h*h);
}

export function gradient2D(fn,x,y){
  const fx=partialDerivative(fn,x,y,'x',1);
  const fy=partialDerivative(fn,x,y,'y',1);
  return {fx,fy,mag:Math.sqrt(fx*fx+fy*fy)};
}

export function midpointIntegral2D(fn,x1,x2,y1,y2,nx=100,ny=100){
  const hx=(x2-x1)/nx, hy=(y2-y1)/ny;
  let s=0;
  for(let i=0;i<nx;i++) for(let j=0;j<ny;j++)
    s+=fn(x1+(i+.5)*hx,y1+(j+.5)*hy);
  return s*hx*hy;
}

export function implicitDerivative(fn,x,y,h=1e-7){
  const fval=fn(x,y);
  const fx=(fn(x+h,y)-fn(x-h,y))/(2*h);
  const fy=(fn(x,y+h)-fn(x,y-h))/(2*h);
  return {fval,fx,fy,slope:fy!==0?-fx/fy:NaN};
}
