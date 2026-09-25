import test from 'node:test';
import assert from 'node:assert/strict';

import { vmag, vdot, vcross, vangle, vproj, combineVectors } from '../js/math/algebra/vector.mjs';
import { triangleGeometry } from '../js/math/algebra/triangle.mjs';

test('magnitud y producto punto en dos y tres dimensiones', () => {
  assert.equal(vmag({ vx: 3, vy: 4 }, 2), 5);
  assert.equal(vmag({ vx: 2, vy: 3, vz: 6 }, 3), 7);
  assert.equal(vdot({ vx: 1, vy: 2 }, { vx: 3, vy: 4 }, 2), 11);
  assert.equal(vdot({ vx: 1, vy: 2, vz: 3 }, { vx: 4, vy: 5, vz: 6 }, 3), 32);
});

test('producto cruz, ángulo y proyección', () => {
  const x = { vx: 1, vy: 0, vz: 0 };
  const y = { vx: 0, vy: 1, vz: 0 };
  assert.deepEqual(vcross(x, y), { x: 0, y: 0, z: 1 });
  assert.equal(vangle(x, y, 3), 90);
  assert.equal(vangle(x, { vx: 0, vy: 0, vz: 0 }, 3), 0);
  assert.equal(vproj({ vx: 3, vy: 4 }, { vx: 1, vy: 0 }, 2), 3);
});

test('combinaciones vectoriales sin estado de interfaz',()=>{
  const x={vx:1,vy:0,vz:0}, y={vx:0,vy:2,vz:0};
  assert.deepEqual(combineVectors([x,y],'+',3),{vx:1,vy:2,vz:0,scalar:false});
  assert.deepEqual(combineVectors([x,y],'−',3),{vx:1,vy:-2,vz:0,scalar:false});
  assert.deepEqual(combineVectors([x,y],'×',3),{vx:0,vy:0,vz:2,scalar:false});
  assert.deepEqual(combineVectors([x,y],'·',3),{scalar:true,sv:0});
});

test('geometría del triángulo 3D sin DOM', () => {
  const geometry=triangleGeometry(
    {x:0,y:0,z:0}, {x:3,y:0,z:0}, {x:0,y:4,z:0},
  );
  assert.equal(geometry.dPQ,3);
  assert.equal(geometry.dPR,4);
  assert.equal(geometry.dQR,5);
  assert.equal(geometry.area,6);
  assert.equal(geometry.angP,90);
  assert.ok(Math.abs(geometry.sumAng-180)<1e-10);
});
