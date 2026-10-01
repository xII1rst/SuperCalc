import test from 'node:test';
import assert from 'node:assert/strict';
import * as N from '../js/math/numerical-analysis.mjs';
import * as A from '../js/math/numerical-advanced.mjs';
import * as S from '../js/math/numerical-study.mjs';
const near=(x,y,t=1e-9)=>assert.ok(Math.abs(x-y)<=t*Math.max(1,Math.abs(y)),`${x} ≠ ${y}`);
const vector=(x,y,t)=>{assert.equal(x.length,y.length);x.forEach((v,i)=>near(v,y[i],t));};
const linearA=[[10,1,-1],[1,10,1],[-1,1,10]],linearB=[11,12,10];
const cube=x=>x**3-x-2,gaussian=x=>Math.exp(-x*x);
const p=(points)=>S.expandedInterpolation(points);
const quad=(fn,n,method,a=0,b=1)=>A.quadratureWithBound(fn,a,b,n,method,1000);
const tests=[
  ()=>{const r=N.numericError(Math.PI,22/7);near(r.absolute,0.0012644892673496777);near(r.relative,0.0004024994347707008);},
  ()=>{const r=N.significantArithmetic(2.718281828,5);near(r.rounded,2.7183);near(N.numericError(2.718281828,r.rounded).absolute,0.000018172);},
  ()=>{near(A.finitePrecisionTrace([12.34,.05678],['+'],4,'chop').approximate,12.39);near(A.finitePrecisionTrace([12.34,.05678],['+'],4).approximate,12.4);},
  ()=>vector(N.bisection(cube,1,2,{iterations:3}).history.map(r=>r.midpoint),[1.5,1.75,1.625]),
  ()=>{const r=S.bisectionIterationRequirement(1,2,1e-4);assert.equal(r.iterations,14);near(r.bound,1/16384);},
  ()=>vector(N.newtonTrace(x=>x*x-2,x=>2*x,1.5,{iterations:2}).history.map(r=>r.next),[17/12,577/408]),
  ()=>vector(N.newtonTrace(x=>Math.cos(x)-x,x=>-Math.sin(x)-1,.5,{iterations:2}).history.map(r=>r.next),[.7552224171056364,.7391416661498792]),
  ()=>{const r=A.finitePrecisionElimination([[2,3],[4,-1]],[8,2],{digits:15});vector(r.solution,[1,2]);near(r.history[0].multiplier,2);},
  ()=>vector(N.iterativeLinearSystem([[4,-1],[-1,4]],[3,6],[0,0],{iterations:2}).solution,[1.125,1.6875]),
  ()=>{near(N.lagrangeInterpolation([[1,2],[3,8]],2).value,5);vector(p([[1,2],[3,8]]).powerCoefficients,[-1,3]);},
  ()=>{const r=p([[0,1],[1,3],[2,7]]);vector(r.coefficients,[1,2,1]);vector(r.powerCoefficients,[1,1,1]);vector(r.columns[1],[2,4]);},
  ()=>vector(N.leastSquaresPolynomial([[1,2],[2,3],[3,5],[4,4]],1).coefficients,[1.5,.8]),
  ()=>{near(N.finiteDifference(Math.exp,0,.1,'forward').value,1.0517091807564771);near(N.finiteDifference(Math.exp,0,.1).value,1.001667500198441);},
  ()=>{const r=quad(x=>x*x,1,'trapezoid',0,2);near(r.value,4);near(Math.abs(r.value-8/3),4/3);},
  ()=>near(quad(Math.sin,2,'simpson',0,Math.PI).value,2*Math.PI/3),
  ()=>vector(N.ivpTrace((x,y)=>x+y,0,1,.1,2,'euler').history.map(r=>r.y),[1,1.1,1.22]),
  ()=>{const r=S.taylorErrorStudy('exp(x)',0,.5,3);near(r.approximation,79/48);near(r.errorBound,Math.exp(.5)/384);assert.ok(r.actualError<r.errorBound);},
  ()=>{const r=S.taylorErrorStudy('sin(x)',0,.3,5);vector(r.coefficients,[0,1,0,-1/6,0,1/120]);near(r.approximation,.29552025);near(r.errorBound,.3**6/720);assert.ok(r.actualError<r.errorBound);},
  ()=>vector(N.bisection(x=>Math.exp(-x)-x,0,1,{iterations:5}).history.map(r=>r.midpoint),[.5,.75,.625,.5625,.59375]),
  ()=>near(N.newtonTrace(x=>x**3-2*x-5,x=>3*x*x-2,2,{iterations:3}).root,2.094551481698199),
  ()=>{const r=A.bairstow([-2,2,-1,1],.5,-1,{maxIterations:1});vector(r.history[0].remainder,[-1.125,.75]);near(r.history[0].nextR,-4);near(r.history[0].nextS,-1.75);assert.equal(r.status,'not converged');},
  ()=>{const r=A.luSolve([[2,1,1],[4,3,3],[8,7,9]],[4,10,24]);vector(r.solution,[1,1,1]);near(r.determinant,4);near(r.residualInfinity,0);},
  ()=>{vector(A.finitePrecisionElimination([[.0003,3],[1,1]],[2.0001,1]).solution,[0,.6666]);vector(A.finitePrecisionElimination([[.0003,3],[1,1]],[2.0001,1],{pivoting:true}).solution,[.3333,.6667]);},
  ()=>vector(N.iterativeLinearSystem(linearA,linearB,[0,0,0],{iterations:3}).solution,[1.1,.993,1.009]),
  ()=>vector(N.iterativeLinearSystem(linearA,linearB,[0,0,0],{method:'seidel',iterations:3}).solution,[1.1019241,.98880449,1.011311961]),
  ()=>{const r=A.newtonSystem2D((x,y)=>x*x+y*y-4,(x,y)=>x*y-1,2,.5,{iterations:1});vector([r.x,r.y],[29/15,31/60]);},
  ()=>{const r=p([[0,1],[1,3],[2,2],[3,5]]);vector(r.powerCoefficients,[1,35/6,-5,7/6]);near(r.evaluate(1.5),2.4375);},
  ()=>{const r=p([[1,0],[2,.6931],[3,1.0986],[4,1.3863]]);vector(r.coefficients,[0,.6931,-.1438,.0283]);near(r.evaluate(2.5),.9211875);},
  ()=>vector(N.leastSquaresPolynomial([[-2,4.1],[-1,1.2],[0,.1],[1,.9],[2,4.2]],2).coefficients,[2/35,-.01,143/140]),
  ()=>{const r=A.sinusoidalFit([[0,3.1],[Math.PI/2,1.9],[Math.PI,.9],[3*Math.PI/2,2.1]],1);vector([r.offset,r.cosCoefficient,r.sinCoefficient],[2,1.1,-.1]);},
  ()=>{const three=N.finiteDifference(Math.log,2,.1).value,five=N.finiteDifference(Math.log,2,.1,'five').value;near(three,.5004172927849135);near(five,.49999747749475854);assert.ok(Math.abs(five-.5)<Math.abs(three-.5));},
  ()=>near(quad(gaussian,4,'trapezoid').value,.7429840978003812),
  ()=>near(quad(gaussian,4,'simpson').value,.7468553797909873),
  ()=>{near(N.ivpTrace((x,y)=>y-x*x+1,0,.5,.2,2,'euler').final.y,1.152);near(N.ivpTrace((x,y)=>y-x*x+1,0,.5,.2,1,'rk4').final.y,.8292933333333333);},
  ()=>{const M=S.derivativeIntervalBound('exp(x)',0,1,4);near(M.bound,Math.E);assert.equal(A.minimumSubintervalsForBound(0,1,'trapezoid',M.bound,1e-6).subintervals,476);assert.equal(A.minimumSubintervalsForBound(0,1,'simpson',M.bound,1e-6).subintervals,12);},
  ()=>{const r=S.derivativeIntervalBound('ln(x)',1,3,4);near(r.bound,6);assert.equal(A.minimumSubintervalsForBound(1,3,'simpson',r.bound,1e-8).subintervals,102);},
  ()=>{const r=N.newtonTrace(x=>x*x-2,x=>2*x,1,{iterations:4});vector(r.history.map(r=>r.next),[3/2,17/12,577/408,665857/470832]);const order=S.convergenceOrderStudy([1,...r.history.map(r=>r.next)],Math.SQRT2);near(order[3].quadraticRatio,204/577,5e-5);assert.ok(order[3].observedOrder>1.99);},
  ()=>{const r=A.bairstow([2,-6,7,-4,1],1.5,-1.5,{maxIterations:3});assert.equal(r.history.length,3);assert.equal(r.status,'not converged');assert.equal(r.roots.length,0);const full=A.bairstow([2,-6,7,-4,1],1.5,-1.5,{maxIterations:200,tolerance:1e-13});assert.equal(full.status,'converged');full.roots.forEach(z=>near(z.real,1,2e-6));vector(full.roots.map(z=>Math.abs(z.imaginary)).sort((a,b)=>a-b),[0,0,1,1],2e-6);},
  ()=>{const matrix=[[3,-1,2],[1,4,-1],[2,1,5]],r=A.luSolve(matrix,[4,3,8]);near(r.determinant,56);vector(r.solution,[7/8,45/56,61/56]);vector(A.luSolve(matrix,[1,0,0]).solution,[3/8,-1/8,-1/8]);},
  ()=>{const r=N.iterativeLinearSystem([[4,1,1],[1,5,2],[1,2,6]],[6,8,9],[0,0,0],{method:'seidel',tolerance:.01,stopCriterion:'change'});assert.equal(r.history.length,5);vector(r.dominance,[2,2,3]);vector(r.solution,[.9997160132137346,1.0000323953510803,1.0000365326806842]);},
  ()=>{const r=A.newtonSystem2D((x,y)=>x*x+y*y-4,(x,y)=>x*x-y-1,1.5,1.5,{iterations:2});vector([r.x,r.y],[1.5175021650133838,1.302801724137931]);},
  ()=>{const points=[1,2,3].map(x=>[x,Math.log(x)]),M=S.derivativeIntervalBound('ln(x)',1,3,3);near(M.bound,2);const r=N.interpolationErrorStudy(points,2.5,M.bound,Math.log);near(r.bound,.125);near(r.actualError,Math.abs(Math.log(2.5)-.75*Math.log(2)-.375*Math.log(3)));},
  ()=>{const r=p([[0,1],[1,2],[2,9],[3,28],[4,65]]);vector(r.coefficients,[1,1,3,1,0]);vector(r.powerCoefficients,[1,0,0,1,0]);near(r.evaluate(2.5),16.625);},
  ()=>{const ys=[2.1,3.3,5.4,8.9],logs=ys.map(Math.log),rate=(-1.5*logs[0]-.5*logs[1]+.5*logs[2]+1.5*logs[3])/5,amplitude=Math.exp(logs.reduce((s,v)=>s+v,0)/4-1.5*rate);const r=A.exponentialFit(ys.map((y,x)=>[x,y]));near(r.rate,rate);near(r.amplitude,amplitude);},
  ()=>{const r=A.sinusoidalFit([[0,1.1],[.25,.9],[.5,-1.05],[.75,-.95]],2*Math.PI,{includeOffset:false});vector([r.offset,r.cosCoefficient,r.sinCoefficient],[0,1.075,.925]);},
  ()=>{const r=N.ivpTrace((x,y)=>-2*y+x,0,1,.1,2,'rk4');vector(r.history.map(r=>r.y),[1,.8234166666666667,.6879053388888889]);assert.ok(Math.abs(r.final.y-(.1-.25+1.25*Math.exp(-.4)))<1e-5);},
  ()=>vector(N.ivpTrace((x,y)=>x-y,0,1,.1,4,'ab2',{startup:'rk2'}).history.map(r=>r.y),[1,.91,.8385,.783225,.74266625]),
  ()=>{const vals=['euler','rk2','rk4'].map(method=>N.ivpTrace((x,y)=>y,0,1,.25,4,method).final.y);vector(vals,[1.25**4,1.28125**4,(1+.25+.25**2/2+.25**3/6+.25**4/24)**4]);assert.ok(Math.abs(vals[2]-Math.E)<Math.abs(vals[1]-Math.E));},
  ()=>{[.1,.05,.02].forEach((h,i)=>{near(N.ivpTrace((x,y)=>-30*y,0,1,h,5,'euler').final.y,[-32,-.03125,.01024][i]);assert.equal(A.linearTestStability(-30,h,'euler').stable,i>0);});},
  ()=>{const fn=x=>x**3-6*x*x+11*x-6.1,newton=N.newtonTrace(fn,x=>3*x*x-12*x+11,3.5,{tolerance:1e-6}),bisect=N.bisection(fn,2.5,3.5,{tolerance:1e-6});near(newton.root,3.0466805318046,1e-6);near(bisect.root,newton.root,1e-6);assert.equal(newton.history.length,5);assert.equal(bisect.history.length,20);},
];
assert.equal(tests.length,50);
tests.forEach((run,i)=>test(`Análisis numérico ${i+1}: referencia independiente del enunciado`,run));
test('Cotas: rechazar polos y logaritmos sin dominio aunque una simplificación cancele',()=>{
  assert.throws(()=>S.derivativeIntervalBound('x/x',-1,1,2),/cero/);
  assert.throws(()=>S.derivativeIntervalBound('ln(x)',0,1,2),/no soportada/);
  assert.throws(()=>S.taylorErrorStudy('tan(x)',0,2,3),/no soportada/);
  assert.equal(S.bisectionIterationRequirement(0,1,.25).iterations,3);
});
test('Pivotes, raíces y orden: errores explícitos y sin certificación por muestras',()=>{
  assert.throws(()=>A.luSolve([[1,1],[2,2]],[1,2]),/singular/);
  assert.throws(()=>S.expandedInterpolation([[1,2],[1,3]]),/distintos/);
  assert.equal(N.newtonTrace(x=>x*x+1,x=>2*x,0,{iterations:2}).status,'zero_derivative');
  assert.equal(S.convergenceOrderStudy([1,1,1],1)[1].observedOrder,null);
});
