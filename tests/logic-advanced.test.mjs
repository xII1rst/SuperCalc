import test from 'node:test';
import assert from 'node:assert/strict';
import {normalForms,quantifiedRelation,finiteCounting,karnaughMap,nandNetwork,inductionSum} from '../js/math/logic-advanced.mjs';
import {bipartiteMatching,petriReachability} from '../js/math/graphs.mjs';

test('Lógica 21, 26–27 y 41: formas normales, cuantificadores y conteos',()=>{
  const normal=normalForms('p→q');
  assert.deepEqual(normal.minterms,[0,1,3]);
  assert.deepEqual(normal.maxterms,[2]);
  assert.match(normal.cnf,/¬p∨q/);
  const domain=['a','b'],pairs=[['a','a'],['b','b']];
  assert.equal(quantifiedRelation(domain,pairs,'forall','exists').result,true);
  const counter=quantifiedRelation(domain,pairs,'forall','forall');
  assert.equal(counter.result,false);assert.equal(counter.decisive.x,'a');assert.equal(counter.decisive.witness,'b');
  const counts=finiteCounting(2,3);
  assert.equal(counts.functions,9n);assert.equal(counts.relations,64n);assert.equal(counts.injective,6n);assert.equal(counts.surjective,0n);
});

test('Lógica 28–30 y 44–46: Karnaugh, NAND e inducción guiada',()=>{
  const map=karnaughMap(['A','B','C'],[1,3,5,7]);
  assert.equal(map.expression,'C');
  assert.deepEqual(map.columns,['00','01','11','10']);
  const network=nandNetwork(['A','B'],[0,1,3]);
  for(let a=0;a<=1;a++) for(let b=0;b<=1;b++) {
    const values={A:Boolean(a),B:Boolean(b)};
    for(const gate of network.gates) values[gate.output]=!gate.inputs.every(input=>values[input]);
    assert.equal(values[network.output],a===0||b===1);
  }
  const proof=inductionSum('squares',10);
  assert.equal(proof.value,385);assert.equal(proof.value,proof.closedForm);
  assert.match(proof.inductionStep,/F\(k\+1\)/);
});

test('Lógica 47–50: emparejamiento máximo y red de Petri acotada',()=>{
  const match=bipartiteMatching(['a','b','c'],['x','y'],[['a','x'],['b','x'],['b','y'],['c','y']]);
  assert.equal(match.size,2);
  assert.equal(new Set(match.matches.map(pair=>pair[1])).size,2);
  const network=petriReachability([1,0],[{name:'mover',input:[1,0],output:[0,1]}]);
  assert.deepEqual(network.states,[[1,0],[0,1]]);
  assert.equal(network.status,'complete');
  const growing=petriReachability([1],[{name:'duplicar',input:[1],output:[2]}],{maxTokens:3});
  assert.equal(growing.status,'bounded search');
});
