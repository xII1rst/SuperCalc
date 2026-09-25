// Cálculos de las aplicaciones de cálculo; no dependen del DOM ni del canvas.
export function optimizeFunction(fn,a,b){
  const h=1e-6, n=2000, dx=(b-a)/n;
  let maxX=a, minX=a, maxV=fn(a,0), minV=fn(a,0);
  const crits=[];
  let prevFp=(fn(a+h,0)-fn(a-h,0))/(2*h);
  for(let i=1;i<=n;i++){
    const x=a+i*dx, fv=fn(x,0);
    if(!isFinite(fv)) continue;
    const fp=(fn(x+h,0)-fn(x-h,0))/(2*h);
    if(prevFp*fp<0) crits.push({x:parseFloat(x.toFixed(5)),y:fv,type:prevFp>0?'MAX':'MIN'});
    if(fv>maxV){maxV=fv;maxX=x;}
    if(fv<minV){minV=fv;minX=x;}
    prevFp=fp;
  }
  return {crits,maxX,minX,maxV,minV};
}

export function populationGrowth(p0,k,t){
  const Pt=p0*Math.exp(k*t);
  return {Pt,dPdt:k*Pt,t2x:k!==0?Math.log(2)/k:Infinity};
}

export function motionAt(fn,t0){
  const h=1e-6;
  const s0=fn(t0,0);
  const vel=(fn(t0+h,0)-fn(t0-h,0))/(2*h);
  const acel=(fn(t0+h,0)-2*fn(t0,0)+fn(t0-h,0))/(h*h);
  return {s0,vel,acel};
}

export function tangentAt(fn,x0){
  const h=1e-6;
  const fx0=fn(x0,0);
  const fpx0=(fn(x0+h,0)-fn(x0-h,0))/(2*h);
  return {fx0,fpx0,b:fx0-fpx0*x0};
}

export function relatedRates(type,r,drdt){
  if(type.includes('Esfera')) return {V:(4/3)*Math.PI*r**3,dVdt:4*Math.PI*r**2*drdt};
  if(type.includes('Cono')) return {V:(1/3)*Math.PI*r**3,dVdt:Math.PI*r**2*drdt};
  return null;
}

export function characteristicRoots(a,b,c){
  const disc=b*b-4*a*c;
  if(disc>1e-10) return {disc,type:'distinct',r1:(-b+Math.sqrt(disc))/(2*a),r2:(-b-Math.sqrt(disc))/(2*a)};
  if(Math.abs(disc)<1e-10) return {disc,type:'repeated',r:-b/(2*a)};
  return {disc,type:'complex',alpha:-b/(2*a),beta:Math.sqrt(-disc)/(2*a)};
}
