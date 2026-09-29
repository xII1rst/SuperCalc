import test from 'node:test';
import assert from 'node:assert/strict';
import {
  lineFromPoints, lineFromPointDirection, planeFromPointNormal, planeFromThreePoints,
  planeFromCoefficients, intersectLinePlane, intersectPlanes, intersectLines,
  pointPlaneDistance, planeAngle,
} from '../js/math/algebra/geometry.mjs';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} ≠ ${expected}`);
const closeVector = (actual, expected) => actual.forEach((value, index) => close(value, expected[index]));

test('Álgebra 3 y 4: recta por dos puntos y plano por punto y normal', () => {
  const line = lineFromPoints([1,2,3],[4,0,5]);
  assert.deepEqual(line, {point:[1,2,3], direction:[3,-2,2]});
  assert.deepEqual(planeFromPointNormal([1,2,3],[2,-1,4]), {normal:[2,-1,4], constant:12});
  assert.deepEqual(planeFromThreePoints([1,0,0],[0,1,0],[0,0,1]), {normal:[1,1,1], constant:1});
});

test('Álgebra 18–20: distancia, corte recta–plano y ángulo entre planos', () => {
  close(pointPlaneDistance([1,2,3], planeFromCoefficients([2,-1,2],4)).distance, 2/3);
  const cut = intersectLinePlane(
    lineFromPointDirection([1,0,2],[1,1,-1]),
    planeFromCoefficients([1,2,1],7),
  );
  assert.equal(cut.status, 'point');
  close(cut.parameter, 2);
  closeVector(cut.point,[3,2,0]);
  close(planeAngle(planeFromCoefficients([1,1,1],3),planeFromCoefficients([2,-1,1],5)).degrees,
    Math.acos(2/Math.sqrt(18))*180/Math.PI);
});

test('Álgebra 49: recta común satisface ambos planos en más de un punto', () => {
  const first = planeFromCoefficients([1,1,1],3);
  const second = planeFromCoefficients([2,-1,1],0);
  const result = intersectPlanes(first,second);
  assert.equal(result.status,'line');
  for (const t of [0,1,-2]) {
    const x = result.point.map((value,i)=>value+t*result.direction[i]);
    close(x.reduce((sum,value,i)=>sum+first.normal[i]*value,0),first.constant);
    close(x.reduce((sum,value,i)=>sum+second.normal[i]*value,0),second.constant);
  }
});

test('casos degenerados y posiciones relativas no se presentan como corte único', () => {
  const plane = planeFromCoefficients([0,0,1],2);
  assert.equal(intersectLinePlane(lineFromPointDirection([0,0,2],[1,0,0]),plane).status,'coincident');
  assert.equal(intersectLinePlane(lineFromPointDirection([0,0,3],[1,0,0]),plane).status,'parallel');
  assert.equal(intersectPlanes(plane,planeFromCoefficients([0,0,2],4)).status,'coincident');
  assert.equal(intersectPlanes(plane,planeFromCoefficients([0,0,2],6)).status,'parallel');
  assert.equal(intersectLines(lineFromPointDirection([0,0,0],[1,0,0]),lineFromPointDirection([0,1,1],[0,1,0])).status,'skew');
  assert.equal(intersectLines(lineFromPointDirection([0,0,0],[1,0,0]),lineFromPointDirection([1,0,0],[2,0,0])).status,'coincident');
  assert.equal(intersectLines(lineFromPointDirection([0,0,0],[1,0,0]),lineFromPointDirection([0,1,0],[2,0,0])).status,'parallel');
  assert.throws(()=>lineFromPoints([1,2,3],[1,2,3]),RangeError);
  assert.throws(()=>planeFromThreePoints([0,0,0],[1,1,1],[2,2,2]),RangeError);
  assert.throws(()=>planeFromCoefficients([0,0,0],1),RangeError);
});
