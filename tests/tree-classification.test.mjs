import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyTree} from '../js/math/graphs.mjs';
test('Árboles: conectividad/ciclos, clasificación enraizada y altura',()=>{
 const r=classifyTree([['A','B'],['A','C'],['B','D'],['B','E'],['C','F'],['C','G']],'A');assert.equal(r.tree,true);assert.equal(r.perfect,true);assert.equal(r.height,2);assert.deepEqual(r.leaves,['D','E','F','G']);
 assert.equal(classifyTree([['A','B'],['A','C'],['A','D']],'A').binary,false);
 assert.equal(classifyTree([['A','B'],['A','C'],['A','D']],'B').binary,true);
 assert.equal(classifyTree([['A','B'],['B','C'],['C','A']],'A').tree,false);
 assert.equal(classifyTree([['A','B'],['C','D']],'A').connected,false);
 assert.equal(classifyTree([['A','B'],['A','B']],'A').tree,false);
 assert.equal(classifyTree([['A','A']],'A').tree,false);
 const single=classifyTree([],'A');assert.equal(single.height,0);assert.equal(single.perfect,true);
});
