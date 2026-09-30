import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calcParse, symbolicDeriv, derivativeDetails, normalizeExpression, computeLimit, basicAntideriv, rk4, rk4Refinement,
  simpsonIntegral, taylorCoefficients, partialDerivative,
  gradient2D, midpointIntegral2D, implicitDerivative, implicitCurveAt,
  groupPolynomialQuotient, calculateLimitOperation, revolutionVolume,
  revolutionVolumeBetween, revolutionVolumeAboutLine, parseRevolutionFunction, curveIntersections,
} from '../js/math/calculus.mjs';
import { parseGraphCoefficient } from '../js/math/graph-types.mjs';

test('el analizador numérico conserva expresiones habituales', () => {
  assert.equal(calcParse('x^2 + 2x')(3, 0), 15);
  assert.equal(calcParse('sin(π/2)')(0, 0), 1);
  assert.equal(calcParse('x^'), null);
  assert.equal(calcParse('t^2+2t','t')(3,0),15);
  assert.equal(calcParse('x^2+y^2')(3,4),25);
  assert.equal(calcParse('t^2','t;alert(1)'),null);
  assert.equal(normalizeExpression('2·x²−1'),'2*x^2-1');
  assert.ok(Math.abs(calcParse('sen(x²)')(2,0)-Math.sin(4))<1e-12);
  assert.ok(Math.abs(calcParse('ln(x)')(2,0)-Math.log(2))<1e-12);
  assert.ok(Math.abs(calcParse('log(x)')(2,0)-Math.log10(2))<1e-12);
  assert.ok(Math.abs(calcParse('exp(x)')(2,0)-Math.exp(2))<1e-12);
  assert.equal(calcParse('x;globalThis.pwned=1'),null);
  assert.equal(calcParse("'<img src=x>'"),null);
  assert.equal(symbolicDeriv('sen(x²)'),'cos(x^2)*2x');
});

test('el cociente polinómico se agrupa sólo en límites ambiguos',()=>{
  assert.equal(groupPolynomialQuotient('4x^2-9/2x-3'),'(4x^2-9)/(2x-3)');
  assert.equal(groupPolynomialQuotient('1+sin(x)/x'),'1+sin(x)/x');
  assert.equal(calcParse('4x^2-9/2x-3')(2,0),4);
  assert.equal(computeLimit('4x^2-9/2x-3','2','both').valueNum,7);
});

test('derivación simbólica sin acceso al navegador', () => {
  assert.equal(symbolicDeriv('x^2'), '2x');
  assert.equal(symbolicDeriv('sin(x)'), 'cos(x)');
});

test('parser simbólico respeta potencias, signo, variable y entrada completa', () => {
  assert.equal(calcParse(symbolicDeriv('-x^2'))(2),-4);
  assert.equal(calcParse(symbolicDeriv('(-x)^2'))(2),4);
  assert.equal(calcParse(symbolicDeriv('x^2^3'))(2),1024);
  assert.ok(Math.abs(calcParse(symbolicDeriv('e^x^2'))(2)-4*Math.exp(4))<1e-10);
  assert.ok(Math.abs(calcParse(symbolicDeriv('t^t',1,'t'),'t')(2)-4*(Math.log(2)+1))<1e-12);
  assert.equal(calcParse(symbolicDeriv('x^y'))(2,3),12);
  for(const invalid of ['x^','x+','sin(x','x)','x;alert(1)','2..3x']) assert.equal(symbolicDeriv(invalid),null,invalid);
  assert.equal(calcParse('1e-7*x')(2),2e-7);
  assert.equal(calcParse('1E-3*x')(2),0.002);
  const fractional=calcParse(symbolicDeriv('x^(1/7)'))(2);
  assert.ok(Math.abs(fractional-(1/7)*2**(-6/7))<1e-15);
});

test('derivadas de la guía diferencial tienen procedimiento y fórmulas evaluables', () => {
  const cases=[
    ['4x^3-5x^2+7x-2',1,x=>12*x*x-10*x+7],
    ['x^2*sen(x)',1,x=>2*x*Math.sin(x)+x*x*Math.cos(x)],
    ['ln(3x^2+1)',1,x=>6*x/(3*x*x+1)],
    ['(x+1)/(x-1)',1,x=>-2/(x-1)**2],
    ['x^4-3x^2+2',2,x=>12*x*x-6],
    ['exp(5x)*cos(x)',1,x=>Math.exp(5*x)*(5*Math.cos(x)-Math.sin(x))],
    ['x^x',1,x=>x**x*(Math.log(x)+1)],
    ['arctan(x^2)',1,x=>2*x/(1+x**4)],
    ['x^(sen(x))',1,x=>x**Math.sin(x)*(Math.cos(x)*Math.log(x)+Math.sin(x)/x)],
    ['x*exp(2x)',4,x=>Math.exp(2*x)*(16*x+32)],
  ];
  for(const [expression,order,expected] of cases){
    const details=derivativeDetails(expression,order);
    assert.ok(details,expression);
    assert.equal(details.derivatives.length,order);
    assert.ok(details.rules.length>0);
    const formula=calcParse(details.derivative);
    assert.ok(formula,details.derivative);
    for(const x of [0.5,2]){
      const evaluation=details.evaluate(x), reference=expected(x);
      assert.equal(evaluation.status,'evaluated',expression);
      assert.ok(Math.abs(evaluation.value-reference)<=1e-11*Math.max(1,Math.abs(reference)),expression);
      assert.ok(Math.abs(formula(x)-reference)<=1e-11*Math.max(1,Math.abs(reference)),details.derivative);
    }
  }
});

test('evaluación de derivadas conserva dominio original y fronteras', () => {
  assert.equal(derivativeDetails('(x^2-1)/(x-1)').evaluate(1).status,'invalid');
  assert.equal(derivativeDetails('sqrt(x)').evaluate(0).status,'invalid');
  assert.equal(derivativeDetails('abs(x)').evaluate(0).status,'invalid');
  assert.equal(derivativeDetails('x^x').evaluate(-1).status,'invalid');
  assert.equal(derivativeDetails('tan(x)').evaluate(Math.PI/2).status,'invalid');
  assert.equal(derivativeDetails('x^y').evaluate(2).status,'invalid');
  assert.equal(derivativeDetails('ln(-x)').evaluate(-1).value,-1);
});

test('curvas implícitas dan pendiente, tangente y tasa con punto verificado', () => {
  const circle=implicitCurveAt('x^2+y^2-25',3,4,{dxdt:2});
  assert.equal(circle.status,'regular');
  assert.equal(circle.slope,-0.75);
  assert.equal(circle.rates.dydt,-1.5);
  assert.equal(implicitCurveAt('x^3+y^3-6*x*y',3,3).slope,-1);
  const mixed=implicitCurveAt('x^2+x*y+y^2-7',2,1);
  assert.equal(mixed.slope,-1.25);
  assert.equal(mixed.intercept,3.5);
  assert.equal(mixed.fx,5);
  assert.equal(mixed.fy,4);
});

test('curvas implícitas distinguen punto exterior, vertical y singular', () => {
  assert.equal(implicitCurveAt('x^2+y^2-25',3,3).status,'off-curve');
  assert.equal(implicitCurveAt('1e-12*(x^2+y^2-25)',3,3).status,'off-curve');
  const vertical=implicitCurveAt('x^2+y^2-25',5,0,{dxdt:1});
  assert.equal(vertical.status,'vertical');
  assert.equal(vertical.slope,null);
  assert.equal(vertical.rates.status,'incompatible');
  assert.equal(implicitCurveAt('x^2+y^2-25',5,0,{dxdt:0}).rates.status,'undetermined');
  assert.equal(implicitCurveAt('x^2+y^2',0,0).status,'singular');
  assert.throws(()=>implicitCurveAt('sqrt(x)+y',0,0),/dominio/);
  assert.throws(()=>implicitCurveAt('x+y+z',0,0),/únicamente/);
});

test('límites directos desde el motor matemático', () => {
  const result = computeLimit('x^2', '2', 'ambos');
  assert.equal(result.valueNum, 4);
  assert.equal(result.exists, true);
  assert.equal(result.tipo, 'directo');
  assert.equal(computeLimit('t^2','3','both','t').valueNum,9);
  const difference=calculateLimitOperation(
    {expr:'1/x^2',point:'0',side:'both'},
    {expr:'1/x^2',point:'0',side:'both'},'−');
  assert.equal(difference.valueNum,0);
  assert.match(difference.reason,/expresión conjunta/);
});

test('formas analíticas evitan falsas respuestas por cancelación numérica', () => {
  const rational=computeLimit('(5x^2+3x)/(2x^2-1)','Infinity','both');
  assert.equal(rational.valueNum,2.5);
  assert.equal(rational.value,'5/2');
  assert.match(rational.steps[0].detail,/coeficientes principales/);
  const root=computeLimit('sqrt(x^2+3x)-x','Infinity','both');
  assert.equal(root.valueNum,1.5);
  assert.equal(root.value,'3/2');
  assert.equal(root.tipo,'simbolico');
  assert.match(root.steps[0].detail,/Racionalizar/);
  assert.equal(computeLimit('sqrt(t^2-4t+2)-t','Infinity','both','t').valueNum,-2);
  const cosine=computeLimit('cos(x)^(1/x^2)','0','both');
  assert.ok(Math.abs(cosine.valueNum-Math.exp(-0.5))<1e-12);
  assert.equal(cosine.value,'e^(-1/2)');
  assert.match(cosine.steps[0].detail,/ln\(1\+w\)/);
  assert.ok(Math.abs(computeLimit('cos(2x)^(3/x^2)','0','both').valueNum-Math.exp(-6))<1e-12);
  const sine=computeLimit('1/sin(x)-1/x','0','both');
  assert.equal(sine.valueNum,0);
  assert.equal(sine.tipo,'simbolico');
  assert.match(sine.steps[0].detail,/Unificar/);
});

test('límites del banco diferencial con factor común y formas 0/0', () => {
  const cases=[
    ['(x^2-9)/(x-3)','3',6],
    ['sin(4x)/(2x)','0',2],
    ['(1-cos(x))/x^2','0',0.5],
    ['(exp(x)-1-x)/x^2','0',0.5],
  ];
  for(const [expression,point,expected] of cases){
    const result=computeLimit(expression,point,'both');
    assert.equal(result.valueNum,expected,expression);
    assert.equal(result.exists,true,expression);
    assert.ok(result.steps.some(step=>step.tipo==='lhopital_simbolico'),expression);
  }
  const second=computeLimit('(exp(x)-1-x)/x^2','0','both').steps.find(step=>step.tipo==='lhopital_simbolico');
  assert.equal(second.derivatives.length,2);
  assert.equal(second.derivatives[0].numeratorAt,0);
  assert.equal(second.derivatives[1].denominatorAt,2);
});

test('muestrear valores laterales no se presenta como demostración', () => {
  const oscillation=computeLimit('sin(1/x)','0','both');
  assert.equal(oscillation.inconclusive,true);
  assert.equal(oscillation.value,'No demostrado');
  assert.equal(oscillation.exists,null);
  const arithmetic=calculateLimitOperation(
    {expr:'sin(1/x)',point:'0',side:'both'},
    {expr:'x',point:'0',side:'both'},'+');
  assert.ok(Number.isNaN(arithmetic.valueNum));
  assert.match(arithmetic.reason,/estimación numérica/);
});

test('sustitución directa respeta el lado del dominio real', () => {
  const bilateral=computeLimit('sqrt(x)','0','both');
  assert.equal(bilateral.exists,false);
  assert.match(bilateral.domainError,/la izquierda/);
  assert.equal(computeLimit('sqrt(x)','0','right').valueNum,0);
  assert.equal(computeLimit('sqrt(x)','0','right').exists,true);
  assert.match(computeLimit('sqrt(x)','0','left').domainError,/izquierda/);
  const pole=computeLimit('tan(x)','π/2','both');
  assert.equal(pole.value,'No demostrado');
  assert.equal(pole.exists,null);
  assert.match(pole.domainError,/posible polo/);
  assert.equal(computeLimit('sec(2x)','π/4','both').inconclusive,true);
});

test('antiderivada básica e integración RK4', () => {
  assert.equal(basicAntideriv('x'), '(1/2)x^2');
  assert.equal(basicAntideriv('sin(x)'), '-cos(x)');
  assert.deepEqual(rk4(() => 1, 0, 0, 0.1, 2), [[0, 0], [0.1, 0.1], [0.2, 0.2]]);
});

test('RK4 ajusta intervalo, refina la malla y detecta datos inválidos', () => {
  const result=rk4Refinement((x,y)=>y,0,1,1,4);
  assert.equal(result.coarse.length,5);
  assert.equal(result.fine.length,9);
  assert.equal(result.fine.at(-1)[0],1);
  assert.ok(Math.abs(result.fineValue-Math.E)<Math.abs(result.coarseValue-Math.E));
  assert.ok(result.errorEstimate>0);
  assert.throws(()=>rk4Refinement((x,y)=>y,0,1,0,4),RangeError);
  assert.throws(()=>rk4(()=>Infinity,0,1,0.1,2),RangeError);
});

test('integración y derivadas numéricas no requieren navegador', () => {
  assert.ok(Math.abs(simpsonIntegral(x => x*x,0,1)-1/3)<1e-9);
  assert.deepEqual(taylorCoefficients(() => 3,0,2), [{k:0,coef:3}]);
  assert.ok(Math.abs(partialDerivative((x,y)=>x*x+y,3,4,'x',1)-6)<1e-8);
  assert.ok(Math.abs(partialDerivative((x,y)=>x*x+y,3,4,'y',1)-1)<1e-8);
  const grad=gradient2D((x,y)=>x+y,0,0);
  assert.ok(Math.abs(grad.mag-Math.SQRT2)<1e-8);
  assert.ok(Math.abs(midpointIntegral2D((x,y)=>x+y,0,1,0,1)-1)<1e-12);
  const implicit=implicitDerivative(calcParse('x^2+y^2-25'),3,4);
  assert.ok(Math.abs(implicit.fval)<1e-10);
  assert.ok(Math.abs(implicit.slope+0.75)<1e-7);
});

test('volúmenes de revolución por discos y cascarones', () => {
  assert.ok(Math.abs(revolutionVolume(x=>x,0,1,'x')-Math.PI/3)<1e-9);
  assert.ok(Math.abs(revolutionVolume(x=>x,0,1,'y')-2*Math.PI/3)<1e-9);
  assert.ok(Math.abs(revolutionVolume(x=>-x,0,1,'y')-2*Math.PI/3)<1e-9);
  assert.ok(Math.abs(revolutionVolume(()=>1,-1,0,'y')-Math.PI)<1e-9);
  assert.ok(Math.abs(revolutionVolume(()=>2,0,1,'x')-4*Math.PI)<1e-9);
  assert.throws(()=>revolutionVolume(x=>x,-1,1,'y'),/no puede cruzar/);
  assert.throws(()=>revolutionVolume(()=>Infinity,0,1,'x'),/no es finita/);
  assert.throws(()=>revolutionVolume(x=>x,1,0,'x'),/a < b/);
  assert.throws(()=>revolutionVolume(x=>x,0,1,'z'),/eje/);
  assert.throws(()=>revolutionVolume(x=>x,0,1,'x',3),/par/);
});

test('volumen entre dos curvas con arandelas, discos y cascarones', () => {
  const square=x=>x*x, root=Math.sqrt;
  assert.ok(Math.abs(revolutionVolumeBetween(square,root,0,1,'x')-3*Math.PI/10)<1e-8);
  assert.ok(Math.abs(revolutionVolumeBetween(square,root,0,1,'y')-3*Math.PI/10)<1e-7);
  assert.ok(Math.abs(revolutionVolumeBetween(()=>3,()=>1,0,1,'x')-8*Math.PI)<1e-9);
  assert.ok(Math.abs(revolutionVolumeBetween(()=>2,()=>-1,0,1,'x')-4*Math.PI)<1e-9);
  assert.ok(Math.abs(revolutionVolumeBetween(x=>x,x=>1-x,0,1,'x')-Math.PI/2)<1e-7);
  assert.throws(()=>revolutionVolumeBetween(square,root,-1,1,'x'),/finitas/);
  assert.throws(()=>revolutionVolumeBetween(square,root,-1,1,'y'),/no puede cruzar/);
});

test('volumen admite y=-mx+b con coeficientes numéricos', () => {
  const line=parseRevolutionFunction('y=-mx+b',{m:1,b:2});
  assert.equal(line(0),2);
  assert.equal(line(1),1);
  assert.equal(parseRevolutionFunction('f(x)=x^2')(3),9);
  assert.equal(parseRevolutionFunction('y=-m*x+b',{m:2,b:1})(3),-5);
  assert.equal(parseRevolutionFunction('y=-mx+z',{m:1,b:2}),null);
  assert.ok(Math.abs(revolutionVolumeBetween(line,()=>1,0,1,'x')-4*Math.PI/3)<1e-8);
});

test('volumen alrededor de rectas desplazadas', () => {
  assert.ok(Math.abs(revolutionVolumeAboutLine(x=>x,x=>x*x,0,1,'x',2)-8*Math.PI/15)<1e-8);
  assert.ok(Math.abs(revolutionVolumeAboutLine(x=>x,null,0,1,'x',2)-5*Math.PI/3)<1e-8);
  assert.ok(Math.abs(revolutionVolumeAboutLine(x=>x,()=>0,0,1,'y',-1)-5*Math.PI/3)<1e-8);
  assert.throws(()=>revolutionVolumeAboutLine(x=>x,()=>0,0,2,'y',1),/no puede cruzar/);
  assert.throws(()=>revolutionVolumeAboutLine(x=>x,()=>0,0,1,'x',NaN),/finito/);
});

test('las intersecciones de x² y √x incluyen ambos extremos del intervalo', () => {
  const crossings=curveIntersections(x=>x*x,Math.sqrt,0,1);
  assert.deepEqual(crossings,[{x:0,y:0},{x:1,y:1}]);
  const middle=curveIntersections(x=>x,x=>1-x,0,1);
  assert.equal(middle.length,1);
  assert.ok(Math.abs(middle[0].x-0.5)<1e-10);
});

test('coeficientes del graficador sin estado del canvas', () => {
  assert.equal(parseGraphCoefficient('2^3'),8);
  assert.equal(parseGraphCoefficient('π'),Math.PI);
  assert.ok(Number.isNaN(parseGraphCoefficient('x+1')));
});
