function squareMatrix(matrix) {
  if(!Array.isArray(matrix)||!matrix.length||matrix.length>12||matrix.some(row=>!Array.isArray(row)||row.length!==matrix.length||row.some(value=>!Number.isFinite(value)))) throw new RangeError('Matriz cuadrada finita de orden 1 a 12 requerida');
  return matrix.length;
}
export function luSolve(matrix,vector) {
  const n=squareMatrix(matrix);
  if(!Array.isArray(vector)||vector.length!==n||vector.some(value=>!Number.isFinite(value))) throw new RangeError('Vector b incompatible');
  const upper=matrix.map(row=>row.slice()),lower=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:0));
  const permutation=Array.from({length:n},(_,i)=>i),steps=[];
  for(let k=0;k<n;k++) {
    let pivot=k;
    for(let i=k+1;i<n;i++) if(Math.abs(upper[i][k])>Math.abs(upper[pivot][k])) pivot=i;
    const columnScale=Math.max(...upper.slice(k).map(row=>Math.abs(row[k])));
    if(columnScale===0||Math.abs(upper[pivot][k])<=1e-14*Math.max(1,columnScale)) throw new RangeError('Matriz singular o demasiado mal condicionada');
    if(pivot!==k) {
      [upper[pivot],upper[k]]=[upper[k],upper[pivot]];
      [permutation[pivot],permutation[k]]=[permutation[k],permutation[pivot]];
      for(let j=0;j<k;j++) [lower[pivot][j],lower[k][j]]=[lower[k][j],lower[pivot][j]];
    }
    for(let i=k+1;i<n;i++) {
      const factor=upper[i][k]/upper[k][k];lower[i][k]=factor;upper[i][k]=0;
      for(let j=k+1;j<n;j++) upper[i][j]-=factor*upper[k][j];
    }
    steps.push({column:k,pivotRow:permutation[k],pivotValue:upper[k][k]});
  }
  const permuted=permutation.map(i=>vector[i]),y=Array(n).fill(0),solution=Array(n).fill(0);
  for(let i=0;i<n;i++) y[i]=permuted[i]-lower[i].slice(0,i).reduce((sum,value,j)=>sum+value*y[j],0);
  for(let i=n-1;i>=0;i--) solution[i]=(y[i]-upper[i].slice(i+1).reduce((sum,value,j)=>sum+value*solution[i+1+j],0))/upper[i][i];
  const residual=matrix.map((row,i)=>row.reduce((sum,value,j)=>sum+value*solution[j],0)-vector[i]);
  return {lower,upper,permutation,permuted,y,solution,residual,residualInfinity:Math.max(...residual.map(Math.abs)),steps};
}
function factorIteration(coefficients,r,s) {
  const n=coefficients.length-1,b=Array(n+1).fill(0),dr=Array(n+1).fill(0),ds=Array(n+1).fill(0);
  b[n]=coefficients[n];b[n-1]=coefficients[n-1]+r*b[n];dr[n-1]=b[n];
  for(let i=n-2;i>=0;i--) {
    b[i]=coefficients[i]+r*b[i+1]+s*b[i+2];
    dr[i]=b[i+1]+r*dr[i+1]+s*dr[i+2];
    ds[i]=b[i+2]+r*ds[i+1]+s*ds[i+2];
  }
  const determinant=dr[0]*ds[1]-ds[0]*dr[1];
  if(Math.abs(determinant)<1e-20) return {b,dr,ds,determinant,status:'singular correction'};
  return {b,dr,ds,determinant,deltaR:(-b[0]*ds[1]+ds[0]*b[1])/determinant,
    deltaS:(dr[1]*b[0]-dr[0]*b[1])/determinant};
}
function quadraticRoots(a,b,c) {
  const d=b*b-4*a*c;
  if(d>=0) return [{real:(-b+Math.sqrt(d))/(2*a),imaginary:0},{real:(-b-Math.sqrt(d))/(2*a),imaginary:0}];
  return [{real:-b/(2*a),imaginary:Math.sqrt(-d)/(2*Math.abs(a))},{real:-b/(2*a),imaginary:-Math.sqrt(-d)/(2*Math.abs(a))}];
}
export function bairstow(coefficients,initialR=0,initialS=1,{tolerance=1e-10,maxIterations=100}={}) {
  if(!Array.isArray(coefficients)||coefficients.length<3||coefficients.length>11||coefficients.some(value=>!Number.isFinite(value))||coefficients.at(-1)===0) throw new RangeError('Polinomio de grado 2 a 10 con coeficientes ascendentes');
  if(!Number.isFinite(initialR)||!Number.isFinite(initialS)||!Number.isFinite(tolerance)||tolerance<=0||!Number.isInteger(maxIterations)||maxIterations<1||maxIterations>200) throw new RangeError('Semillas, tolerancia o iteraciones inválidas');
  let working=coefficients.slice(),roots=[],factors=[],history=[];
  while(working.length>3) {
    let r=initialR,s=initialS,converged=false,step;
    for(let iteration=1;iteration<=maxIterations;iteration++) {
      step=factorIteration(working,r,s);
      const scale=Math.max(1,...working.map(Math.abs));
      history.push({degree:working.length-1,iteration,r,s,remainder:[step.b[0],step.b[1]]});
      if(Math.max(Math.abs(step.b[0]),Math.abs(step.b[1]))<=tolerance*scale) {converged=true;break;}
      if(step.status||!Number.isFinite(step.deltaR)||!Number.isFinite(step.deltaS)) break;
      r+=step.deltaR;s+=step.deltaS;
      if(!Number.isFinite(r)||!Number.isFinite(s)||Math.max(Math.abs(r),Math.abs(s))>1e12) break;
    }
    if(!converged) return {status:'not converged',roots,factors,history,remaining:working};
    roots.push(...quadraticRoots(1,-r,-s));factors.push({r,s,remainder:[step.b[0],step.b[1]]});
    working=step.b.slice(2);
  }
  if(working.length===3) roots.push(...quadraticRoots(working[2],working[1],working[0]));
  else roots.push({real:-working[0]/working[1],imaginary:0});
  return {status:'converged',roots,factors,history,remaining:working};
}
function fitNormal(rows,columns) {
  const a=Array.from({length:columns},()=>Array(columns).fill(0)),b=Array(columns).fill(0);
  for(const {features,target} of rows) for(let i=0;i<columns;i++) {
    b[i]+=features[i]*target;
    for(let j=0;j<columns;j++) a[i][j]+=features[i]*features[j];
  }
  return luSolve(a,b).solution;
}
function pointsValid(points,min) {
  if(!Array.isArray(points)||points.length<min||points.length>100||points.some(row=>!Array.isArray(row)||row.length!==2||row.some(value=>!Number.isFinite(value)))) throw new RangeError(`Introduce entre ${min} y 100 puntos (x,y)`);
}
export function exponentialFit(points) {
  pointsValid(points,2);
  if(points.some(([,y])=>y<=0)) throw new RangeError('El ajuste exponencial linealizado requiere y > 0');
  const [lnA,rate]=fitNormal(points.map(([x,y])=>({features:[1,x],target:Math.log(y)})),2);
  const amplitude=Math.exp(lnA),residuals=points.map(([x,y])=>y-amplitude*Math.exp(rate*x));
  return {amplitude,rate,residuals,squaredError:residuals.reduce((sum,r)=>sum+r*r,0),assumption:'mínimos cuadrados sobre ln(y), no sobre y'};
}
export function sinusoidalFit(points,angularFrequency) {
  pointsValid(points,3);
  if(!Number.isFinite(angularFrequency)||angularFrequency<=0) throw new RangeError('Frecuencia angular positiva requerida');
  const [offset,sinCoefficient,cosCoefficient]=fitNormal(points.map(([x,y])=>({features:[1,Math.sin(angularFrequency*x),Math.cos(angularFrequency*x)],target:y})),3);
  const residuals=points.map(([x,y])=>y-offset-sinCoefficient*Math.sin(angularFrequency*x)-cosCoefficient*Math.cos(angularFrequency*x));
  return {offset,sinCoefficient,cosCoefficient,amplitude:Math.hypot(sinCoefficient,cosCoefficient),
    phase:Math.atan2(cosCoefficient,sinCoefficient),residuals,squaredError:residuals.reduce((sum,r)=>sum+r*r,0),
    assumption:'frecuencia angular fijada por el usuario; ajuste lineal de c+a sen(ωx)+b cos(ωx)'};
}
export function linearTestStability(lambda,step,method) {
  if(!Number.isFinite(lambda)||!Number.isFinite(step)||step<=0) throw new RangeError('λ finito y paso positivo requeridos');
  const z=lambda*step;
  if(method==='euler') return {z,amplification:Math.abs(1+z),stable:Math.abs(1+z)<1,criterion:'|1+z| < 1 para y′=λy'};
  if(method==='rk2') {const q=1+z+z*z/2;return {z,amplification:Math.abs(q),stable:Math.abs(q)<1,criterion:'|1+z+z²/2| < 1 para y′=λy'};}
  if(method==='rk4') {const q=1+z+z*z/2+z**3/6+z**4/24;return {z,amplification:Math.abs(q),stable:Math.abs(q)<1,criterion:'|1+z+z²/2+z³/6+z⁴/24| < 1 para y′=λy'};}
  if(method==='ab2') {
    const a=1+1.5*z,d=a*a-2*z;
    const roots=d>=0?[(a+Math.sqrt(d))/2,(a-Math.sqrt(d))/2]:[Math.sqrt(Math.abs(z)/2),Math.sqrt(Math.abs(z)/2)];
    const amplification=Math.max(...roots.map(Math.abs));
    return {z,amplification,stable:amplification<1,criterion:'ambas raíces de ξ²−(1+3z/2)ξ+z/2 dentro del círculo unidad'};
  }
  throw new RangeError('Método no soportado');
}

export function finitePrecisionTrace(operands,operations,digits,mode='round') {
  if(!Array.isArray(operands)||operands.length<2||operands.length>30||operands.some(value=>!Number.isFinite(value))||
    !Array.isArray(operations)||operations.length!==operands.length-1||operations.some(value=>!['+','-','*','/'].includes(value))||
    !Number.isInteger(digits)||digits<1||digits>15||!['round','chop'].includes(mode)) throw new RangeError('Operación o precisión inválida');
  const quantize=value=>{
    if(!Number.isFinite(value)) throw new RangeError('Resultado no finito');
    if(value===0) return 0;
    const shift=digits-1-Math.floor(Math.log10(Math.abs(value))),factor=10**shift;
    return (mode==='chop'?Math.trunc(value*factor):Math.round(Math.abs(value)*factor)*Math.sign(value))/factor;
  };
  let exact=operands[0],approximate=quantize(exact);
  const history=[{step:0,operand:operands[0],operation:'inicio',exact,approximate,error:Math.abs(exact-approximate)}];
  for(let i=1;i<operands.length;i++) {
    const other=operands[i],operation=operations[i-1],roundedOther=quantize(other);
    if(operation==='/'&&roundedOther===0) throw new RangeError('División entre cero en aritmética finita');
    const apply=(a,b)=>operation==='+'?a+b:operation==='-'?a-b:operation==='*'?a*b:a/b;
    exact=apply(exact,other);
    if(!Number.isFinite(exact)) throw new RangeError('Referencia no finita');
    approximate=quantize(apply(approximate,roundedOther));
    history.push({step:i,operand:other,roundedOperand:roundedOther,operation,exact,approximate,error:Math.abs(exact-approximate)});
  }
  return {exact,approximate,absoluteError:Math.abs(exact-approximate),history,digits,mode,
    assumption:'referencia calculada en coma flotante JS, no aritmética exacta racional'};
}

export function newtonSystem2D(first,second,initialX,initialY,{iterations=10,tolerance=1e-9}={}) {
  if(typeof first!=='function'||typeof second!=='function'||![initialX,initialY,tolerance].every(Number.isFinite)||tolerance<=0||
    !Number.isInteger(iterations)||iterations<1||iterations>100) throw new RangeError('Funciones, inicio o control inválidos');
  let x=initialX,y=initialY;
  const history=[];
  for(let iteration=1;iteration<=iterations;iteration++) {
    const f=first(x,y),g=second(x,y),h=1e-5*Math.max(1,Math.abs(x),Math.abs(y));
    if(Number.isFinite(f)&&Number.isFinite(g)&&Math.hypot(f,g)<=tolerance) return {status:'converged',x,y,residual:Math.hypot(f,g),history};
    const j11=(first(x+h,y)-first(x-h,y))/(2*h),j12=(first(x,y+h)-first(x,y-h))/(2*h);
    const j21=(second(x+h,y)-second(x-h,y))/(2*h),j22=(second(x,y+h)-second(x,y-h))/(2*h);
    if(![f,g,j11,j12,j21,j22].every(Number.isFinite)) return {status:'domain_error',x,y,history};
    const determinant=j11*j22-j12*j21;
    if(Math.abs(determinant)<1e-12*Math.max(1,Math.abs(j11*j22),Math.abs(j12*j21))) return {status:'singular_jacobian',x,y,history};
    const dx=(f*j22-g*j12)/determinant,dy=(g*j11-f*j21)/determinant;
    const nextX=x-dx,nextY=y-dy;
    if(!Number.isFinite(nextX)||!Number.isFinite(nextY)) return {status:'diverged',x,y,history};
    const residual=Math.hypot(first(nextX,nextY),second(nextX,nextY));
    if(!Number.isFinite(residual)) return {status:'domain_error',x,y,history};
    history.push({iteration,x,y,f,g,jacobian:[[j11,j12],[j21,j22]],nextX,nextY,residual});
    x=nextX;y=nextY;
    if(residual<=tolerance&&Math.hypot(dx,dy)<=tolerance) return {status:'converged',x,y,residual,history};
  }
  return {status:'max_iterations',x,y,residual:history.at(-1)?.residual??null,history};
}

export function quadratureWithBound(fn,start,end,subintervals,method,derivativeBound) {
  if(typeof fn!=='function'||!Number.isFinite(start)||!Number.isFinite(end)||start>=end||
    !Number.isInteger(subintervals)||subintervals<2||subintervals>1000||!['trapezoid','simpson'].includes(method)||
    !Number.isFinite(derivativeBound)||derivativeBound<0) throw new RangeError('Intervalo, método o cota inválidos');
  if(method==='simpson'&&subintervals%2) throw new RangeError('Simpson requiere n par');
  const integrate=n=>{
    const h=(end-start)/n;
    let sum=fn(start)+fn(end);
    if(!Number.isFinite(sum)) throw new RangeError('Integrando fuera de dominio');
    for(let i=1;i<n;i++) {const value=fn(start+i*h);if(!Number.isFinite(value)) throw new RangeError('Integrando fuera de dominio');sum+=(method==='trapezoid'?2:i%2?4:2)*value;}
    return sum*h/(method==='trapezoid'?2:3);
  };
  const value=integrate(subintervals),refined=integrate(2*subintervals);
  const bound=method==='trapezoid'?derivativeBound*(end-start)**3/(12*subintervals**2):
    derivativeBound*(end-start)**5/(180*subintervals**4);
  return {value,refined,refinementDifference:Math.abs(refined-value),bound,
    formula:method==='trapezoid'?'|E| ≤ M₂(b−a)³/(12n²)':'|E| ≤ M₄(b−a)⁵/(180n⁴)',
    assumption:`La cota solo vale si el usuario ha establecido |f${method==='trapezoid'?'″':'⁽⁴⁾'}(x)| ≤ M en todo [a,b].`};
}
