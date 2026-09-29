import {matGauss} from './algebra/matrix.mjs';

function finite(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new RangeError(`${label} debe ser finito`);
  return value;
}

function count(value, label, limit = 1000) {
  if (!Number.isInteger(value) || value < 1 || value > limit) throw new RangeError(`${label} debe ser entero entre 1 y ${limit}`);
  return value;
}

function evaluate(fn, x, label = 'f(x)') {
  const value = fn(x);
  if (!Number.isFinite(value)) throw new RangeError(`${label} no es finita en x = ${x}`);
  return value;
}

export function numericError(exact, approximate) {
  finite(exact,'Valor exacto');
  finite(approximate,'Aproximación');
  const absolute=Math.abs(exact-approximate);
  return {absolute, relative:exact===0?null:absolute/Math.abs(exact), percent:exact===0?null:100*absolute/Math.abs(exact)};
}

export function significantArithmetic(value, digits) {
  finite(value,'Valor');
  count(digits,'Cifras significativas',15);
  if (value===0) return {chopped:0, rounded:0};
  const shift=digits-1-Math.floor(Math.log10(Math.abs(value)));
  const factor=10**shift;
  const chopped=Math.trunc(value*factor)/factor;
  const rounded=Math.round(Math.abs(value)*factor)*Math.sign(value)/factor;
  return {chopped, rounded};
}

export function bisection(fn, left, right, options = {}) {
  if (typeof fn!=='function') throw new TypeError('f debe ser función');
  finite(left,'Extremo izquierdo'); finite(right,'Extremo derecho');
  if (left>=right) throw new RangeError('Se requiere a < b');
  const fixed=options.iterations!==undefined;
  const limit=fixed?count(options.iterations,'Iteraciones'):count(options.maxIterations??100,'Máximo de iteraciones');
  const tolerance=options.tolerance??1e-8;
  if (!(tolerance>0 && Number.isFinite(tolerance))) throw new RangeError('La tolerancia debe ser positiva');
  let fa=evaluate(fn,left,'f(a)'), fb=evaluate(fn,right,'f(b)');
  if (fa===0) return {status:'converged',root:left,history:[],bound:0};
  if (fb===0) return {status:'converged',root:right,history:[],bound:0};
  if (Math.sign(fa)===Math.sign(fb)) throw new RangeError('f(a) y f(b) deben tener signos opuestos');
  const history=[];
  for (let iteration=1;iteration<=limit;iteration++) {
    const midpoint=left+(right-left)/2;
    const fm=evaluate(fn,midpoint,'f(m)');
    const bound=(right-left)/2;
    history.push({iteration,left,right,midpoint,value:fm,bound});
    if (fm===0 || (!fixed && bound<=tolerance)) return {status:'converged',root:midpoint,history,bound};
    if (Math.sign(fm)===Math.sign(fa)) {left=midpoint;fa=fm;}
    else {right=midpoint;fb=fm;}
  }
  const last=history.at(-1);
  return {status:fixed?'fixed_steps':'max_iterations',root:last.midpoint,history,bound:last.bound};
}

export function newtonTrace(fn, derivative, initial, options = {}) {
  if (typeof fn!=='function' || typeof derivative!=='function') throw new TypeError('f y f′ deben ser funciones');
  finite(initial,'Valor inicial');
  const fixed=options.iterations!==undefined;
  const limit=fixed?count(options.iterations,'Iteraciones'):count(options.maxIterations??100,'Máximo de iteraciones');
  const tolerance=options.tolerance??1e-8;
  if (!(tolerance>0 && Number.isFinite(tolerance))) throw new RangeError('La tolerancia debe ser positiva');
  let x=initial;
  const history=[];
  for (let iteration=1;iteration<=limit;iteration++) {
    const fx=evaluate(fn,x,'f(x)');
    const slope=evaluate(derivative,x,'f′(x)');
    if (Math.abs(slope)<=1e-14) return {status:'zero_derivative',root:x,history};
    const next=x-fx/slope;
    if (!Number.isFinite(next)) return {status:'diverged',root:x,history};
    const residual=evaluate(fn,next,'f(x siguiente)');
    history.push({iteration,x,value:fx,slope,next,residual});
    x=next;
    if (!fixed && Math.abs(next-history.at(-1).x)<=tolerance && Math.abs(residual)<=tolerance) {
      return {status:'converged',root:x,history};
    }
  }
  return {status:fixed?'fixed_steps':'max_iterations',root:x,history};
}

function validateSystem(matrix, rhs, initial) {
  const n=matrix.length;
  if (!n || n>10 || matrix.some(row=>!Array.isArray(row)||row.length!==n||row.some(v=>!Number.isFinite(v)))
      || rhs.length!==n || rhs.some(v=>!Number.isFinite(v))
      || initial.length!==n || initial.some(v=>!Number.isFinite(v))) {
    throw new RangeError('Se requiere sistema cuadrado finito de hasta 10 incógnitas');
  }
  if (matrix.some((row,i)=>row[i]===0)) throw new RangeError('Jacobi/Gauss-Seidel requiere diagonal sin ceros; reordena ecuaciones si procede');
  return n;
}

export function iterativeLinearSystem(matrix, rhs, initial, options = {}) {
  const n=validateSystem(matrix,rhs,initial);
  const method=options.method??'jacobi';
  if (!['jacobi','seidel'].includes(method)) throw new RangeError('Método inválido');
  const fixed=options.iterations!==undefined;
  const limit=fixed?count(options.iterations,'Iteraciones'):count(options.maxIterations??100,'Máximo de iteraciones');
  const tolerance=options.tolerance??1e-8;
  if (!(tolerance>0 && Number.isFinite(tolerance))) throw new RangeError('La tolerancia debe ser positiva');
  let current=[...initial];
  const history=[];
  for (let iteration=1;iteration<=limit;iteration++) {
    const next=[...current];
    for (let row=0;row<n;row++) {
      let sum=rhs[row];
      for (let col=0;col<n;col++) if (col!==row) sum-=matrix[row][col]*(method==='seidel'?next[col]:current[col]);
      next[row]=sum/matrix[row][row];
    }
    if (next.some(v=>!Number.isFinite(v)||Math.abs(v)>1e100)) return {status:'diverged',history,solution:current,method};
    const difference=Math.max(...next.map((value,i)=>Math.abs(value-current[i])));
    const residual=Math.max(...matrix.map((row,i)=>Math.abs(row.reduce((sum,value,j)=>sum+value*next[j],0)-rhs[i])));
    history.push({iteration,vector:[...next],difference,residual});
    current=next;
    if (!fixed && difference<=tolerance && residual<=tolerance) return {status:'converged',history,solution:current,method};
  }
  return {status:fixed?'fixed_steps':'max_iterations',history,solution:current,method};
}

function checkedPoints(points) {
  if (!Array.isArray(points) || !points.length || points.length>20 || points.some(point=>!Array.isArray(point)||point.length!==2||point.some(v=>!Number.isFinite(v)))) {
    throw new RangeError('Introduce entre 1 y 20 puntos (x,y) finitos');
  }
  if (new Set(points.map(point=>point[0])).size!==points.length) throw new RangeError('Los valores x deben ser distintos');
  return points.map(point=>[...point]);
}

export function newtonInterpolation(points) {
  const data=checkedPoints(points);
  const xs=data.map(point=>point[0]);
  const columns=[data.map(point=>point[1])];
  for (let order=1;order<data.length;order++) {
    const previous=columns.at(-1);
    columns.push(previous.slice(1).map((value,i)=>(value-previous[i])/(xs[i+order]-xs[i])));
  }
  const coefficients=columns.map(column=>column[0]);
  const evaluateAt=x=>{
    finite(x,'x');
    let value=coefficients.at(-1);
    for (let i=coefficients.length-2;i>=0;i--) value=coefficients[i]+(x-xs[i])*value;
    return value;
  };
  return {xs,coefficients,columns,evaluate:evaluateAt};
}

export function lagrangeInterpolation(points, x) {
  const data=checkedPoints(points);
  finite(x,'x');
  const terms=data.map(([xi,yi],i)=>{
    let basis=1;
    for (let j=0;j<data.length;j++) if (j!==i) basis*=(x-data[j][0])/(xi-data[j][0]);
    return {basis,term:yi*basis};
  });
  return {value:terms.reduce((sum,item)=>sum+item.term,0),terms};
}

export function interpolationErrorStudy(points,x,derivativeBound,referenceFn=null) {
  const data=checkedPoints(points);
  finite(x,'x');
  finite(derivativeBound,'Cota de la derivada');
  if(derivativeBound<0) throw new RangeError('La cota de la derivada debe ser no negativa');
  if(referenceFn!==null&&typeof referenceFn!=='function') throw new TypeError('Función de referencia inválida');
  if(referenceFn) for(const [node,value] of data) {
    const expected=evaluate(referenceFn,node,'f(xᵢ)');
    if(Math.abs(expected-value)>1e-8*Math.max(1,Math.abs(expected),Math.abs(value)))
      throw new RangeError('Los valores de los nodos no coinciden con la función de referencia');
  }
  const approximation=lagrangeInterpolation(data,x).value;
  const factors=data.map(([node])=>x-node);
  let factorial=1,product=1;
  for(let i=0;i<data.length;i++) { factorial*=i+1;product*=Math.abs(factors[i]); }
  const bound=derivativeBound*product/factorial;
  if(!Number.isFinite(bound)||!Number.isFinite(approximation)) throw new RangeError('La interpolación excede el rango numérico');
  const reference=referenceFn?evaluate(referenceFn,x,'f(x)'):null;
  return {approximation,bound,factors,factorial,reference,
    actualError:reference===null?null:Math.abs(reference-approximation),
    assumption:`La cota requiere |f⁽${data.length}⁾(t)| ≤ M en el intervalo que contiene todos los nodos y x.`};
}

export function leastSquaresPolynomial(points, degree) {
  const data=checkedPoints(points);
  if (!Number.isInteger(degree)||degree<0||degree>5||degree>=data.length) throw new RangeError('Grado entero entre 0 y 5, menor que la cantidad de puntos');
  const n=degree+1;
  const normal=Array.from({length:n},(_,row)=>Array.from({length:n},(_,col)=>data.reduce((sum,[x])=>sum+x**(row+col),0)));
  const rhs=Array.from({length:n},(_,row)=>data.reduce((sum,[x,y])=>sum+y*x**row,0));
  const solution=matGauss(normal,rhs);
  if (solution.status!=='unique') throw new RangeError('Ajuste singular o mal condicionado');
  const coefficients=solution.particular;
  const residuals=data.map(([x,y])=>y-coefficients.reduce((sum,value,i)=>sum+value*x**i,0));
  return {coefficients,residuals,squaredError:residuals.reduce((sum,value)=>sum+value*value,0),normal,rhs};
}

export function finiteDifference(fn, x, h, method = 'central') {
  if (typeof fn!=='function') throw new TypeError('f debe ser función');
  finite(x,'x'); finite(h,'h');
  if (h<=0) throw new RangeError('h debe ser positivo');
  const f=point=>evaluate(fn,point);
  const formulas={
    forward:()=>(f(x+h)-f(x))/h,
    backward:()=>(f(x)-f(x-h))/h,
    central:()=>(f(x+h)-f(x-h))/(2*h),
    five:()=>(f(x-2*h)-8*f(x-h)+8*f(x+h)-f(x+2*h))/(12*h),
  };
  if (!formulas[method]) throw new RangeError('Método de diferencia inválido');
  return {value:formulas[method](),method,h};
}

function ivpStep(fn, method, x, y, h, previousSlope) {
  const slope=(atX,atY)=>{
    const value=fn(atX,atY);
    if (!Number.isFinite(value)) throw new RangeError(`y′ no es finita en (${atX}, ${atY})`);
    return value;
  };
  const k1=slope(x,y);
  if (method==='euler') return {next:y+h*k1,slope:k1};
  if (method==='rk2') {
    const k2=slope(x+h/2,y+h*k1/2);
    return {next:y+h*k2,slope:k1};
  }
  if (method==='ab2' && previousSlope!==null) return {next:y+h*(3*k1-previousSlope)/2,slope:k1};
  const k2=slope(x+h/2,y+h*k1/2);
  const k3=slope(x+h/2,y+h*k2/2);
  const k4=slope(x+h,y+h*k3);
  return {next:y+h*(k1+2*k2+2*k3+k4)/6,slope:k1};
}

export function ivpTrace(fn, x0, y0, h, steps, method = 'rk4') {
  if (typeof fn!=='function') throw new TypeError('y′ debe ser función');
  finite(x0,'x inicial');finite(y0,'y inicial');finite(h,'Paso');
  if (h===0) throw new RangeError('El paso no puede ser cero');
  count(steps,'Pasos',2000);
  if (!['euler','rk2','rk4','ab2'].includes(method)) throw new RangeError('Método de PVI inválido');
  const history=[{iteration:0,x:x0,y:y0}];
  let x=x0,y=y0, previousSlope=null;
  for (let iteration=1;iteration<=steps;iteration++) {
    const result=ivpStep(fn,method,x,y,h,previousSlope);
    previousSlope=result.slope;
    x=x0+iteration*h;
    y=result.next;
    if (!Number.isFinite(y)) return {status:'diverged',history,method,step:h};
    history.push({iteration,x,y});
  }
  return {status:'completed',history,method,step:h,final:{x,y},startup:method==='ab2'?'RK4 en el primer paso':null};
}
