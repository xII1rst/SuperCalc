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
export function linearPowerCoefficient(powerCoefficient,forcingCoefficient,forcingPower,x0,y0,x) {
  [powerCoefficient,forcingCoefficient,forcingPower,y0].forEach((value,i)=>finite(value,`Dato ${i+1}`));
  positive(x0,'x inicial');positive(x,'x final');
  const exponent=powerCoefficient+forcingPower,gamma=exponent+1;
  const integral=gamma===0?Math.log(x/x0):x0**gamma*Math.expm1(gamma*Math.log(x/x0))/gamma;
  const factor0=x0**powerCoefficient,factor=x**powerCoefficient;
  const value=(factor0*y0+forcingCoefficient*integral)/factor;
  const derivative=forcingCoefficient*x**forcingPower-powerCoefficient*value/x;
  if(!Number.isFinite(value)||!Number.isFinite(derivative)) throw new RangeError('Solución fuera del rango numérico');
  const constantValue=gamma===0?factor0*y0-forcingCoefficient*Math.log(x0):
    factor0*y0-forcingCoefficient*x0**gamma/gamma;
  return {value,derivative,integratingFactor:`x^${powerCoefficient}`,integral,
    generalSolution:gamma===0?`y=x^(−${powerCoefficient})[${forcingCoefficient} ln x+C]`:
      `y=(${forcingCoefficient}/${gamma})x^${forcingPower+1}+C x^(−${powerCoefficient})`,
    constantValue:Number.isFinite(constantValue)?constantValue:null,
    solution:`y(x)=x^(−${powerCoefficient})[${factor0*y0}+${forcingCoefficient}·${gamma===0?`ln(x/${x0})`:`(x^${gamma}−${x0}^${gamma})/${gamma}`}]`,
    formula:'(x^a y)′=b x^(a+m); integrar desde x₀ hasta x y dividir por x^a',
    assumption:'y′+(a/x)y=b x^m, x₀>0 y x>0 en la misma rama; condición y(x₀)=y₀'};
}
export function bernoulliLinearForcing(p,q,constant,x) {
  [p,q,constant,x].forEach((value,i)=>finite(value,`Dato ${i+1}`));
  const particular=p===0?-q*x*x/2:q*(x/p+1/p**2);
  const denominator=p===0?constant+particular:constant*Math.exp(p*x)+particular;
  if(!Number.isFinite(denominator)||denominator===0) throw new RangeError('El denominador de esta rama es cero o no finito');
  const value=1/denominator,derivative=q*x*value**2-p*value;
  if(!Number.isFinite(value)||!Number.isFinite(derivative)) throw new RangeError('Solución fuera del rango numérico');
  return {value,derivative,denominator,
    solution:p===0?`y(x)=1/(${constant}−${q}x²/2)`:`y(x)=1/(${constant}e^(${p}x)+${q}(x/${p}+1/${p**2}))`,
    formula:'z=1/y transforma y′+py=qxy² en z′−pz=−qx; además y≡0 es solución',
    assumption:'p y q constantes; esta rama no nula vale solo en intervalos donde el denominador no se anula'};
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
export function exactPolynomialForm(mTerms,nTerms,factorXPower=0,factorYPower=0) {
  if(![factorXPower,factorYPower].every(value=>Number.isInteger(value)&&value>=0&&value<=4))
    throw new RangeError('El factor integrante debe ser x^a y^b con a,b enteros de 0 a 4');
  const polynomial=terms=>{
    if(!Array.isArray(terms)||!terms.length||terms.length>30) throw new RangeError('Introduce de 1 a 30 términos por coeficiente');
    const result=new Map();
    for(const term of terms) {
      if(!Array.isArray(term)||term.length!==3||!Number.isFinite(term[0])||
        !Number.isInteger(term[1])||!Number.isInteger(term[2])||term[1]<0||term[2]<0||term[1]>6||term[2]>6)
        throw new RangeError('Cada término requiere coeficiente y potencias enteras de x,y entre 0 y 6');
      const key=`${term[1]+factorXPower},${term[2]+factorYPower}`;
      result.set(key,(result.get(key)||0)+term[0]);
    }
    return result;
  };
  const m=polynomial(mTerms),n=polynomial(nTerms);
  const derivative=(terms,variable)=>{
    const result=new Map();
    for(const [key,coefficient] of terms) {
      const powers=key.split(',').map(Number),power=powers[variable];
      if(power) {powers[variable]--;const next=powers.join(',');result.set(next,(result.get(next)||0)+coefficient*power);}
    }
    return result;
  };
  const my=derivative(m,1),nx=derivative(n,0);
  const keys=new Set([...my.keys(),...nx.keys()]);
  const mismatch=[...keys].find(key=>Math.abs((my.get(key)||0)-(nx.get(key)||0))>1e-10*Math.max(1e-300,Math.abs(my.get(key)||0),Math.abs(nx.get(key)||0)));
  if(mismatch) throw new RangeError(`La forma no es exacta con ese factor: M_y ≠ N_x en x^${mismatch.split(',')[0]}y^${mismatch.split(',')[1]}`);
  const potential=new Map();
  for(const [key,coefficient] of m) {
    const [px,py]=key.split(',').map(Number),target=`${px+1},${py}`;
    potential.set(target,(potential.get(target)||0)+coefficient/(px+1));
  }
  const potentialY=derivative(potential,1);
  for(const [key,coefficient] of n) {
    const [px,py]=key.split(',').map(Number),remaining=coefficient-(potentialY.get(key)||0);
    if(px===0&&Math.abs(remaining)>1e-10*Math.max(1e-300,Math.abs(coefficient),Math.abs(potentialY.get(key)||0))) {
      const target=`0,${py+1}`;potential.set(target,(potential.get(target)||0)+remaining/(py+1));
    }
  }
  const terms=[...potential].filter(([,coefficient])=>coefficient!==0)
    .map(([key,coefficient])=>({coefficient,powers:key.split(',').map(Number)}))
    .sort((a,b)=>b.powers[0]+b.powers[1]-a.powers[0]-a.powers[1]||b.powers[0]-a.powers[0]);
  const expression=terms.map(({coefficient,powers:[px,py]},i)=>{
    const variables=[px?`x${px===1?'':`^${px}`}`:'',py?`y${py===1?'':`^${py}`}`:''].filter(Boolean).join('·');
    const magnitude=Math.abs(coefficient),number=Math.abs(magnitude-1)<1e-12&&variables?'':String(Number(magnitude.toPrecision(10)));
    return `${coefficient<0?(i?' − ':'−'):(i?' + ':'')}${number}${number&&variables?'·':''}${variables}`;
  }).join('')||'0';
  return {potentialTerms:terms,implicitSolution:`${expression} = C`,factor:factorXPower||factorYPower?`x^${factorXPower} y^${factorYPower}`:'1',
    formula:'μM dx + μN dy = dΨ = 0; comprobar ∂(μM)/∂y = ∂(μN)/∂x; Ψ se obtiene integrando μM en x y completando g(y)',
    assumption:'M y N son polinomios dados como términos; el factor monomial elegido se aplica en un dominio donde está definido; C es constante'};
}
export function logisticGrowth(rate,capacity,x0,y0,x) {
  positive(rate,'Tasa');positive(capacity,'Capacidad');finite(x0,'x inicial');positive(y0,'y inicial');finite(x,'x final');
  const denominator=1+(capacity/y0-1)*Math.exp(-rate*(x-x0));
  if(denominator<=0) throw new RangeError('Solución no positiva o singular');
  const value=capacity/denominator;
  return {value,derivative:rate*value*(1-value/capacity),equilibrium:capacity,
    formula:'y = K/[1+(K/y₀−1)e^(−r(x−x₀))]',assumption:'modelo logístico con r,K constantes'};
}
export function thermalRelaxation(ambient,initial,observed,observationTime,time) {
  [ambient,initial,observed].forEach((value,i)=>finite(value,`Temperatura ${i+1}`));
  positive(observationTime,'Tiempo de observación');
  if(!Number.isFinite(time)||time<0) throw new RangeError('Tiempo final no negativo requerido');
  const difference=initial-ambient,ratio=(observed-ambient)/difference;
  if(difference===0||!Number.isFinite(ratio)||ratio<=0||ratio>1)
    throw new RangeError('Las temperaturas deben estar del mismo lado del ambiente y acercarse a él');
  const rate=Math.log(ratio)/observationTime;
  const value=ambient+difference*Math.exp(rate*time),derivative=rate*(value-ambient);
  return {value,derivative,rate,equilibrium:ambient,timeConstant:rate===0?null:-1/rate,
    expression:`T(t)=${ambient}+(${initial}-${ambient})e^(${rate}t)`,
    formula:'T′=k(T−Tₐ); k=ln[(T(t₁)−Tₐ)/(T₀−Tₐ)]/t₁',
    assumption:'ambiente constante, intercambio pasivo, t≥0; la observación t₁ determina k'};
}
export function rlCurrent(inductance,resistance,voltage,initialCurrent,time) {
  positive(inductance,'Inductancia');positive(resistance,'Resistencia');
  finite(voltage,'Voltaje');finite(initialCurrent,'Corriente inicial');
  if(!Number.isFinite(time)||time<0) throw new RangeError('Tiempo no negativo requerido');
  const steady=voltage/resistance,tau=inductance/resistance;
  const value=steady+(initialCurrent-steady)*Math.exp(-time/tau);
  const derivative=(voltage-resistance*value)/inductance;
  if(!Number.isFinite(value)||!Number.isFinite(derivative)) throw new RangeError('Solución fuera del rango numérico');
  return {value,derivative,equilibrium:steady,timeConstant:tau,
    expression:`i(t)=${steady}+(${initialCurrent}-${steady})e^(−${resistance}/${inductance}·t)`,
    formula:'L i′+R i=V; i∞=V/R y τ=L/R',
    assumption:'circuito RL serie ideal con L,R,V constantes y corriente inicial i(0)'};
}
export function orthogonalPowerTrajectories(power,x,y) {
  finite(power,'Exponente');positive(x,'x de comprobación');finite(y,'y de comprobación');
  if(power===0||y===0) throw new RangeError('Se requiere exponente no nulo y un punto con y≠0 para comprobar pendientes');
  const originalSlope=power*y/x,orthogonalSlope=-x/(power*y);
  return {originalSlope,orthogonalSlope,constant:x*x+power*y*y,
    implicitSolution:`x²+(${power})y²=C`,
    formula:'y=C₀xⁿ ⇒ y′=ny/x; la pendiente ortogonal es −x/(ny); integrar ny dy=−x dx',
    assumption:'x>0 y y≠0 para comparar pendientes; la familia implícita se prolonga donde esté definida'};
}
export function thirdOrderRepeatedRoot(root,amplitude,c0,c1,c2,x) {
  [root,amplitude,c0,c1,c2,x].forEach((value,i)=>finite(value,`Dato ${i+1}`));
  const exp=Math.exp(root*x),u=c0+c1*x+c2*x*x+amplitude*x**3/6;
  const u1=c1+2*c2*x+amplitude*x*x/2,u2=2*c2+amplitude*x;
  const value=exp*u,derivative=exp*(root*u+u1);
  const secondDerivative=exp*(root**2*u+2*root*u1+u2);
  const thirdDerivative=exp*(root**3*u+3*root**2*u1+3*root*u2+amplitude);
  const residual=thirdDerivative-3*root*secondDerivative+3*root**2*derivative-root**3*value-amplitude*exp;
  if([value,derivative,secondDerivative,thirdDerivative,residual].some(item=>!Number.isFinite(item)))
    throw new RangeError('Solución fuera del rango numérico');
  return {value,derivative,secondDerivative,thirdDerivative,residual,
    generalSolution:`y=e^(${root}x)(C₀+C₁x+C₂x²+${amplitude}x³/6)`,
    formula:'(D−r)³[e^(rx)u]=e^(rx)u‴; si (D−r)³y=Ae^(rx), entonces u‴=A',
    assumption:'coeficientes constantes, fuerza A e^(rx), tres constantes libres; C₀,C₁,C₂ de entrada solo evalúan un miembro'};
}
function homogeneousSecondOrder(damping,stiffness,y0,v0,time) {
  const discriminant=damping**2-4*stiffness;
  let value,derivative,regime,constants,expression;
  if(discriminant>1e-12) {
    const r1=(-damping+Math.sqrt(discriminant))/2,r2=(-damping-Math.sqrt(discriminant))/2;
    const c1=(v0-r2*y0)/(r1-r2),c2=y0-c1;
    value=c1*Math.exp(r1*time)+c2*Math.exp(r2*time);
    derivative=r1*c1*Math.exp(r1*time)+r2*c2*Math.exp(r2*time);
    constants=[c1,c2];regime='dos raíces reales';expression=`${c1}e^(${r1}t) + ${c2}e^(${r2}t)`;
  } else if(discriminant>=-1e-12) {
    const r=-damping/2,c1=y0,c2=v0-r*c1,exp=Math.exp(r*time);
    value=(c1+c2*time)*exp;derivative=(c2+r*(c1+c2*time))*exp;
    constants=[c1,c2];regime='raíz doble';expression=`(${c1} + ${c2}t)e^(${r}t)`;
  } else {
    const alpha=-damping/2,beta=Math.sqrt(-discriminant)/2,c1=y0,c2=(v0-alpha*c1)/beta;
    const exp=Math.exp(alpha*time),cos=Math.cos(beta*time),sin=Math.sin(beta*time);
    value=exp*(c1*cos+c2*sin);
    derivative=exp*(alpha*(c1*cos+c2*sin)+beta*(-c1*sin+c2*cos));
    constants=[c1,c2];regime='raíces complejas conjugadas';expression=`e^(${alpha}t)[${c1} cos(${beta}t) + ${c2} sen(${beta}t)]`;
  }
  return {value,derivative,constants,regime,expression};
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
  const solved=homogeneousSecondOrder(damping,stiffness,y0-initialParticular,v0-initialParticularDerivative,time);
  const {value:homogeneous,derivative:homogeneousDerivative,constants,regime}=solved;
  const value=homogeneous+particular,derivative=homogeneousDerivative+particularDerivative;
  if(!Number.isFinite(value)||!Number.isFinite(derivative)) throw new RangeError('Solución no finita');
  return {value,derivative,homogeneous,particular,constants,regime,resonant,
    formula:'y″+a y′+b y=F cos(ωt); y=yh+yp con constantes fijadas por y(0), y′(0)',
    assumption:'coeficientes constantes, forzamiento sinusoidal'};
}
export function laplaceSecondOrderHarmonic(damping,stiffness,cosineForce,sineForce,omega,y0,v0,time) {
  [damping,stiffness,cosineForce,sineForce,y0,v0].forEach((value,i)=>finite(value,`Dato ${i+1}`));
  positive(omega,'Frecuencia');
  if(!Number.isFinite(time)||time<0) throw new RangeError('Tiempo no negativo requerido');
  const gap=stiffness-omega**2,det=gap**2+(damping*omega)**2;
  const resonant=det<1e-24*Math.max(1,stiffness**2,omega**4);
  if(resonant&&(Math.abs(damping)>1e-12||Math.abs(gap)>1e-12)) throw new RangeError('Problema casi resonante mal condicionado');
  let particular,particularDerivative,initialParticular,initialParticularDerivative,particularExpression;
  if(resonant) {
    const sin=Math.sin(omega*time),cos=Math.cos(omega*time),factor=1/(2*omega);
    particular=time*factor*(cosineForce*sin-sineForce*cos);
    particularDerivative=factor*(cosineForce*sin-sineForce*cos)+time/2*(cosineForce*cos+sineForce*sin);
    initialParticular=0;initialParticularDerivative=-sineForce*factor;
    particularExpression=`t/(2·${omega})[${cosineForce} sen(${omega}t) − ${sineForce} cos(${omega}t)]`;
  } else {
    const a=(gap*cosineForce-damping*omega*sineForce)/det;
    const b=(damping*omega*cosineForce+gap*sineForce)/det;
    particular=a*Math.cos(omega*time)+b*Math.sin(omega*time);
    particularDerivative=omega*(-a*Math.sin(omega*time)+b*Math.cos(omega*time));
    initialParticular=a;initialParticularDerivative=omega*b;
    particularExpression=`${a} cos(${omega}t) + ${b} sen(${omega}t)`;
  }
  const solved=homogeneousSecondOrder(damping,stiffness,y0-initialParticular,v0-initialParticularDerivative,time);
  const value=solved.value+particular,derivative=solved.derivative+particularDerivative;
  if(!Number.isFinite(value)||!Number.isFinite(derivative)) throw new RangeError('Solución no finita');
  return {value,derivative,homogeneous:solved.value,particular,constants:solved.constants,regime:solved.regime,resonant,
    expression:`${solved.expression} + ${particularExpression}`,
    transform:`Y(s) = [(${y0})s + (${v0+damping*y0}) + (${cosineForce})s/(s²+${omega**2}) + (${sineForce})${omega}/(s²+${omega**2})]/(s²+(${damping})s+(${stiffness}))`,
    formula:'L{y″+ay′+by}=(s²+as+b)Y−sy₀−v₀−ay₀; forzamiento Fc cos(ωt)+Fs sen(ωt)',
    assumption:'PVI lineal con coeficientes constantes y t≥0; se ajusta la parte homogénea a y(0), y′(0)'};
}
export function laplaceRepeatedRootForcing(root,amplitude,power,y0,v0,time) {
  finite(root,'Raíz');finite(amplitude,'Amplitud');finite(y0,'y(0)');finite(v0,'y′(0)');
  if(!Number.isInteger(power)||power<0||power>3) throw new RangeError('Potencia de t entera entre 0 y 3 requerida');
  if(!Number.isFinite(time)||time<0) throw new RangeError('Tiempo no negativo requerido');
  const denominator=(power+1)*(power+2),linear=v0-root*y0;
  const inner=y0+linear*time+amplitude*time**(power+2)/denominator;
  const exp=Math.exp(root*time),value=exp*inner;
  const derivative=exp*(root*inner+linear+amplitude*time**(power+1)/(power+1));
  if(!Number.isFinite(value)||!Number.isFinite(derivative)) throw new RangeError('Solución no finita');
  let factorial=1;for(let i=2;i<=power;i++) factorial*=i;
  return {value,derivative,particular:exp*amplitude*time**(power+2)/denominator,
    transform:`Y(s) = (${y0})/(s−(${root})) + (${linear})/(s−(${root}))² + (${amplitude*factorial})/(s−(${root}))^${power+3}`,
    expression:`e^(${root}t)[${y0} + (${linear})t + (${amplitude}/${denominator})t^${power+2}]`,
    formula:'(D−r)²y=A t^m e^(rt); y=e^(rt)[y₀+(v₀−ry₀)t+A t^(m+2)/((m+1)(m+2))]',
    assumption:'raíz doble r, potencia m entera de 0 a 3, condiciones iniciales en t=0'};
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
export function laplaceSystem2D(matrix,initial,time) {
  const solved=linearSystem2D(matrix,initial,time);
  const [[a,b],[c,d]]=matrix,[x0,y0]=initial,trace=a+d,determinant=a*d-b*c;
  const mu=trace/2,gap=(a-d)/2,discriminant=gap*gap+b*c;
  const shifted=[gap*x0+b*y0,c*x0-gap*y0];
  const shape=discriminant>1e-14?`cosh(${Math.sqrt(discriminant)}t)·u₀ + senh(${Math.sqrt(discriminant)}t)/${Math.sqrt(discriminant)}·Bu₀`:
    discriminant< -1e-14?`cos(${Math.sqrt(-discriminant)}t)·u₀ + sen(${Math.sqrt(-discriminant)}t)/${Math.sqrt(-discriminant)}·Bu₀`:'u₀+t·Bu₀';
  const denominator=`s²−(${trace})s+(${determinant})`;
  return {...solved,transformX:`((${x0})s+(${b*y0-d*x0}))/(${denominator})`,
    transformY:`((${y0})s+(${c*x0-a*y0}))/(${denominator})`,
    expression:`u(t)=e^(${mu}t)[${shape}], u₀=[${x0},${y0}], Bu₀=[${shifted.join(',')}]`,
    formula:'(sI−A)U(s)=u(0); invertir la matriz 2×2 y luego la transformada de Laplace',
    assumption:'sistema homogéneo 2×2 de coeficientes constantes con estado inicial'};
}
export function symmetricSystemModes(diagonal,coupling,initial,time) {
  finite(diagonal,'Diagonal');finite(coupling,'Acoplamiento');
  if(!Array.isArray(initial)||initial.length!==2||initial.some(value=>!Number.isFinite(value)))
    throw new RangeError('Se requiere vector inicial de dos componentes');
  finite(time,'Tiempo');
  const rates=[diagonal+coupling,diagonal-coupling];
  const coefficients=[(initial[0]+initial[1])/2,(initial[0]-initial[1])/2];
  const plus=coefficients[0]*Math.exp(rates[0]*time),minus=coefficients[1]*Math.exp(rates[1]*time);
  const value=[plus+minus,plus-minus];
  const derivative=[rates[0]*plus+rates[1]*minus,rates[0]*plus-rates[1]*minus];
  if([...value,...derivative].some(item=>!Number.isFinite(item))) throw new RangeError('Solución no finita');
  return {value,derivative,eigenvalues:rates,eigenvectors:[[1,1],[1,-1]],coefficients,
    expression:`u(t)=C₊e^(${rates[0]}t)[1,1]+C₋e^(${rates[1]}t)[1,−1]`,
    formula:'A=[[a,b],[b,a]] tiene autovectores (1,1) y (1,−1), con autovalores a+b y a−b',
    assumption:'matriz real simétrica con diagonales iguales; C₊ y C₋ se fijan con u(0)'};
}
export function laplaceTable(kind,parameter=1) {
  finite(parameter,'Parámetro');
  if(kind==='one') return {transform:'1/s',domain:'s>0'};
  if(kind==='exponential') return {transform:`1/(s−(${parameter}))`,domain:`s>${parameter}`};
  if(kind==='sine') return {transform:`${parameter}/(s²+${parameter**2})`,domain:'s>0'};
  if(kind==='cosine') return {transform:`s/(s²+${parameter**2})`,domain:'s>0'};
  if(kind==='time') return {transform:'1/s²',domain:'s>0'};
  if(kind==='timeSquared') return {transform:'2/s³',domain:'s>0'};
  if(kind==='timeSine') return {transform:`${2*parameter}s/(s²+${parameter**2})²`,domain:'s>0',formula:'L{t sen(at)} = −d/ ds [a/(s²+a²)]'};
  throw new RangeError('Tipo de transformada no soportado');
}
export function laplaceExponentialPlusTime(rate,timeCoefficient) {
  finite(rate,'Tasa exponencial');finite(timeCoefficient,'Coeficiente de t');
  return {transform:`1/(s−(${rate})) + (${timeCoefficient})/s²`,domain:`s>${Math.max(0,rate)}`,
    formula:'L{e^(at)+bt} = 1/(s−a)+b/s², por linealidad'};
}
export function inverseLaplaceShiftedPower(coefficient,shift,order,time) {
  finite(coefficient,'Numerador');finite(shift,'Desplazamiento');
  if(!Number.isInteger(order)||order<1||order>10) throw new RangeError('Orden entero de 1 a 10 requerido');
  if(!Number.isFinite(time)||time<0) throw new RangeError('Tiempo no negativo requerido');
  let factorial=1;for(let k=2;k<order;k++) factorial*=k;
  const value=coefficient*time**(order-1)*Math.exp(-shift*time)/factorial;
  if(!Number.isFinite(value)) throw new RangeError('Resultado fuera del rango numérico');
  return {value,expression:`${coefficient}/${factorial} · t^${order-1} · e^(−${shift}t)`,
    formula:'L⁻¹{C/(s+a)ⁿ} = C t^(n−1)e^(−at)/(n−1)!',assumption:'t ≥ 0; polo real de orden entero'};
}
export function inverseLaplaceQuadratic(numeratorSlope,numeratorConstant,linearCoefficient,constantCoefficient,time) {
  [numeratorSlope,numeratorConstant,linearCoefficient,constantCoefficient].forEach((value,i)=>finite(value,`Coeficiente ${i+1}`));
  if(!Number.isFinite(time)||time<0) throw new RangeError('Tiempo no negativo requerido');
  const shift=linearCoefficient/2,constantShift=numeratorConstant-numeratorSlope*shift;
  const delta=constantCoefficient-shift**2,scale=Math.max(1e-300,Math.abs(constantCoefficient),shift**2);
  let regime,frequency=null,value,expression;
  if(Math.abs(delta)<=1e-12*scale) {
    regime='polo real doble';
    value=Math.exp(-shift*time)*(numeratorSlope+constantShift*time);
    expression=`e^(−${shift}t)[${numeratorSlope} + ${constantShift}t]`;
  } else if(delta>0) {
    regime='par conjugado';frequency=Math.sqrt(delta);
    value=Math.exp(-shift*time)*(numeratorSlope*Math.cos(frequency*time)+constantShift/frequency*Math.sin(frequency*time));
    expression=`e^(−${shift}t)[${numeratorSlope} cos(${frequency}t) + ${constantShift/frequency} sen(${frequency}t)]`;
  } else {
    regime='dos polos reales';frequency=Math.sqrt(-delta);
    value=Math.exp(-shift*time)*(numeratorSlope*Math.cosh(frequency*time)+constantShift/frequency*Math.sinh(frequency*time));
    expression=`e^(−${shift}t)[${numeratorSlope} cosh(${frequency}t) + ${constantShift/frequency} senh(${frequency}t)]`;
  }
  if(!Number.isFinite(value)) throw new RangeError('Resultado fuera del rango numérico');
  return {value,expression,regime,shift,frequency,
    formula:'s²+ps+q=(s+p/2)²+(q−p²/4); As+B=A(s+p/2)+(B−Ap/2)',
    assumption:'transformada racional propia (As+B)/(s²+ps+q), t ≥ 0; se usa desplazamiento en s'};
}
export function firstOrderExponentialForcing(p,amplitude,rate,initialValue,time) {
  [p,amplitude,rate,initialValue].forEach((value,i)=>finite(value,`Dato ${i+1}`));
  if(!Number.isFinite(time)||time<0) throw new RangeError('Tiempo no negativo requerido');
  const gap=p+rate,integral=gap===0?time:Math.expm1(gap*time)/gap;
  const value=Math.exp(-p*time)*(initialValue+amplitude*integral);
  const derivative=-p*value+amplitude*Math.exp(rate*time);
  if(!Number.isFinite(value)||!Number.isFinite(derivative)) throw new RangeError('Solución fuera del rango numérico');
  return {value,derivative,transform:`Y(s) = (${initialValue} + ${amplitude}/(s−(${rate})))/(s+(${p}))`,
    generalSolution:gap===0?`y=e^(−${p}t)(C+${amplitude}t)`:
      `y=C e^(−${p}t)+(${amplitude}/${gap})e^(${rate}t)`,
    constantValue:gap===0?initialValue:initialValue-amplitude/gap,
    expression:gap===0?`e^(−${p}t)(${initialValue} + ${amplitude}t)`:
      `e^(−${p}t)[${initialValue} + ${amplitude}(e^(${gap}t)−1)/(${gap})]`,
    formula:'L{y′+py}= (s+p)Y−y₀; L{A e^(at)}=A/(s−a)',
    assumption:'y′+py=Ae^(at), y(0)=y₀, t≥0; coeficientes constantes'};
}
