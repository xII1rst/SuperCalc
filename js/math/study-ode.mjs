function finite(value,label) {if(!Number.isFinite(value)) throw new RangeError(`${label}: valor finito requerido`);return value;}
function positive(value,label) {finite(value,label);if(value<=0) throw new RangeError(`${label}: debe ser positivo`);return value;}
function integralPower(power,from,to) {
  finite(power,'Exponente');finite(from,'x inicial');finite(to,'x final');
  if(power===-1) {if(from===0||to===0||Math.sign(from)!==Math.sign(to)) throw new RangeError('∫1/x cruza una singularidad');return Math.log(Math.abs(to/from));}
  if((from<0||to<0)&&!Number.isInteger(power+1)) throw new RangeError('Potencia no entera sobre x negativo fuera del dominio real');
  return (to**(power+1)-from**(power+1))/(power+1);
}
export function separablePower(coefficient,xPower,yPower,x0,y0,x) {
  finite(coefficient,'Coeficiente');finite(yPower,'Exponente de y');finite(x0,'x inicial');positive(y0,'y inicial');finite(x,'x final');
  const area=integralPower(xPower,x0,x);
  let value;
  if(yPower===1) value=y0*Math.exp(coefficient*area);
  else {
    const transformed=y0**(1-yPower)+(1-yPower)*coefficient*area;
    if(transformed<=0) throw new RangeError('La rama positiva termina antes de x final');
    value=transformed**(1/(1-yPower));
  }
  if(!Number.isFinite(value)) throw new RangeError('Solución fuera de rango');
  return {value,derivative:coefficient*x**xPower*value**yPower,integralXPower:area,
    formula:yPower===1?'y = y₀ exp[a∫xᵖdx]':'y^(1−q) = y₀^(1−q)+(1−q)a∫xᵖdx',
    assumption:'se sigue la rama positiva desde y₀>0; no se cruza una singularidad'};
}
export function linearFirstOrder(p,q,x0,y0,x) {
  finite(p,'p');finite(q,'q');finite(x0,'x inicial');finite(y0,'y inicial');finite(x,'x final');
  const time=x-x0,value=p===0?y0+q*time:q/p+(y0-q/p)*Math.exp(-p*time);
  return {value,derivative:q-p*value,equilibrium:p===0?null:q/p,
    formula:p===0?'y = y₀+q(x−x₀)':'y = q/p + (y₀−q/p)e^(−p(x−x₀))',assumption:'p y q constantes en y′+p y=q'};
}
export function bernoulliConstant(p,q,n,x0,y0,x) {
  finite(p,'p');finite(q,'q');finite(n,'n');finite(x0,'x inicial');positive(y0,'y inicial');finite(x,'x final');
  if(n===1) throw new RangeError('n=1 es lineal; usa la herramienta lineal');
  const transform=linearFirstOrder((1-n)*p,(1-n)*q,x0,y0**(1-n),x);
  if(transform.value<=0) throw new RangeError('La rama positiva termina antes de x final');
  const value=transform.value**(1/(1-n));
  return {value,derivative:q*value**n-p*value,transformed:transform.value,
    formula:'z=y^(1−n); z′+(1−n)pz=(1−n)q',assumption:'solución positiva; coeficientes constantes'};
}
export function logisticGrowth(rate,capacity,x0,y0,x) {
  positive(rate,'Tasa');positive(capacity,'Capacidad');finite(x0,'x inicial');positive(y0,'y inicial');finite(x,'x final');
  const denominator=1+(capacity/y0-1)*Math.exp(-rate*(x-x0));
  if(denominator<=0) throw new RangeError('Solución no positiva o singular');
  const value=capacity/denominator;
  return {value,derivative:rate*value*(1-value/capacity),equilibrium:capacity,
    formula:'y = K/[1+(K/y₀−1)e^(−r(x−x₀))]',assumption:'modelo logístico con r,K constantes'};
}
export function forcedSecondOrder(damping,stiffness,forcing,omega,y0,v0,time) {
  finite(damping,'Coeficiente de y′');finite(stiffness,'Coeficiente de y');finite(forcing,'Amplitud forzante');positive(omega,'Frecuencia motriz');
  finite(y0,'y(0)');finite(v0,'y′(0)');finite(time,'Tiempo');
  const det=(stiffness-omega**2)**2+(damping*omega)**2;
  const resonant=det<1e-24*Math.max(1,stiffness**2,omega**4);
  if(resonant&&(Math.abs(damping)>1e-12||Math.abs(stiffness-omega**2)>1e-12)) throw new RangeError('Problema casi resonante mal condicionado');
  const A=resonant?0:forcing*(stiffness-omega**2)/det,B=resonant?0:forcing*damping*omega/det;
  const particular=resonant?forcing/(2*omega)*time*Math.sin(omega*time):A*Math.cos(omega*time)+B*Math.sin(omega*time);
  const particularDerivative=resonant?forcing/(2*omega)*(Math.sin(omega*time)+omega*time*Math.cos(omega*time)):
    -A*omega*Math.sin(omega*time)+B*omega*Math.cos(omega*time);
  const initialParticular=resonant?0:A,initialParticularDerivative=resonant?0:B*omega;
  const h0=y0-initialParticular,hv0=v0-initialParticularDerivative;
  const discriminant=damping**2-4*stiffness;
  let homogeneous,homogeneousDerivative,regime,constants;
  if(discriminant>1e-12) {
    const r1=(-damping+Math.sqrt(discriminant))/2,r2=(-damping-Math.sqrt(discriminant))/2;
    const c1=(hv0-r2*h0)/(r1-r2),c2=h0-c1;
    homogeneous=c1*Math.exp(r1*time)+c2*Math.exp(r2*time);
    homogeneousDerivative=r1*c1*Math.exp(r1*time)+r2*c2*Math.exp(r2*time);
    constants=[c1,c2];regime='dos raíces reales';
  } else if(discriminant>=-1e-12) {
    const r=-damping/2,c1=h0,c2=hv0-r*c1,exp=Math.exp(r*time);
    homogeneous=(c1+c2*time)*exp;homogeneousDerivative=(c2+r*(c1+c2*time))*exp;
    constants=[c1,c2];regime='raíz doble';
  } else {
    const alpha=-damping/2,beta=Math.sqrt(-discriminant)/2,c1=h0,c2=(hv0-alpha*c1)/beta;
    const exp=Math.exp(alpha*time),cos=Math.cos(beta*time),sin=Math.sin(beta*time);
    homogeneous=exp*(c1*cos+c2*sin);
    homogeneousDerivative=exp*(alpha*(c1*cos+c2*sin)+beta*(-c1*sin+c2*cos));
    constants=[c1,c2];regime='raíces complejas conjugadas';
  }
  const value=homogeneous+particular,derivative=homogeneousDerivative+particularDerivative;
  if(!Number.isFinite(value)||!Number.isFinite(derivative)) throw new RangeError('Solución no finita');
  return {value,derivative,homogeneous,particular,constants,regime,resonant,
    formula:'y″+a y′+b y=F cos(ωt); y=yh+yp con constantes fijadas por y(0), y′(0)',
    assumption:'coeficientes constantes, forzamiento sinusoidal'};
}
export function linearSystem2D(matrix,initial,time) {
  if(!Array.isArray(matrix)||matrix.length!==2||matrix.some(row=>!Array.isArray(row)||row.length!==2||row.some(value=>!Number.isFinite(value)))||
    !Array.isArray(initial)||initial.length!==2||initial.some(value=>!Number.isFinite(value))) throw new RangeError('Sistema 2×2 y estado inicial requeridos');
  finite(time,'Tiempo');
  const [[a,b],[c,d]]=matrix,mu=(a+d)/2,delta=(a-d)/2,disc=delta**2+b*c;
  let factor,scalar,regime;
  if(disc>1e-14) {const root=Math.sqrt(disc);factor=Math.sinh(root*time)/root;scalar=Math.cosh(root*time);regime='autovalores reales';}
  else if(disc< -1e-14) {const root=Math.sqrt(-disc);factor=Math.sin(root*time)/root;scalar=Math.cos(root*time);regime='autovalores complejos';}
  else {factor=time;scalar=1;regime='autovalor repetido';}
  const scale=Math.exp(mu*time),matrixExponential=[[scale*(scalar+factor*delta),scale*factor*b],[scale*factor*c,scale*(scalar-factor*delta)]];
  const value=matrixExponential.map(row=>row[0]*initial[0]+row[1]*initial[1]);
  if(value.some(item=>!Number.isFinite(item))) throw new RangeError('Solución no finita');
  const derivative=matrix.map(row=>row[0]*value[0]+row[1]*value[1]);
  return {value,derivative,matrixExponential,regime,formula:'u(t)=e^(At)u(0)',assumption:'sistema lineal homogéneo 2×2 de coeficientes constantes'};
}
export function laplaceTable(kind,parameter=1) {
  finite(parameter,'Parámetro');
  if(kind==='one') return {transform:'1/s',domain:'s>0'};
  if(kind==='exponential') return {transform:`1/(s−(${parameter}))`,domain:`s>${parameter}`};
  if(kind==='sine') return {transform:`${parameter}/(s²+${parameter**2})`,domain:'s>0'};
  if(kind==='cosine') return {transform:`s/(s²+${parameter**2})`,domain:'s>0'};
  if(kind==='time') return {transform:'1/s²',domain:'s>0'};
  throw new RangeError('Tipo de transformada no soportado');
}
