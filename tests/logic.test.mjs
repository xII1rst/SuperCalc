import test from 'node:test';
import assert from 'node:assert/strict';
import {
  convertBase, baseArithmetic, twosComplement, signedBinaryAddition, bitwiseWord, truthTable,
  argumentValidity, finiteSetOperations, relationProperties, minimizeBoolean,
} from '../js/math/logic.mjs';

test('Lógica 1–6 y 18: conversiones enteras y fraccionarias',()=>{
  assert.equal(convertBase('156',10,2).text,'10011100');
  assert.equal(convertBase('10110101',2,10).text,'181');
  assert.equal(convertBase('A3F',16,10).text,'2623');
  assert.equal(convertBase('725',8,2).text,'111010101');
  assert.equal(convertBase('0.6875',10,2).text,'0.1011');
  assert.equal(convertBase('101.011',2,10).text,'5.375');
  assert.equal(baseArithmetic('1101','1011',2,'add').result,'11000');
  assert.equal(baseArithmetic('1010','101',2,'multiply').result,'110010');
  assert.equal(baseArithmetic('3B7','1F9',16,'subtract').result,'1BE');
  assert.deepEqual([baseArithmetic('11101','101',2,'divide').result,baseArithmetic('11101','101',2,'divide').remainder],['101','100']);
  assert.equal(convertBase('0.1',10,2,8).status,'repeating');
  assert.throws(()=>convertBase('19',8,2),RangeError);
});

test('Lógica 35 y 36: complemento a dos, suma con overflow y operaciones bit a bit',()=>{
  assert.equal(twosComplement(-45,8).bits,'11010011');
  const sum=signedBinaryAddition(100,-45,8);
  assert.equal(sum.bits,'00110111');
  assert.equal(sum.signed,55n);
  assert.equal(sum.overflow,false);
  assert.equal(signedBinaryAddition(100,60,8).overflow,true);
  const bits=bitwiseWord(0xB7,0x5C,8);
  assert.deepEqual(bits,{and:'00010100',or:'11111111',xor:'11101011',notFirst:'01001000'});
});

test('Lógica 9, 10, 24, 25 y 40: tablas, tautologías y contraejemplos',()=>{
  const table=truthTable('p ∧ ¬q');
  assert.equal(table.rows.length,4);
  assert.equal(table.rows.filter(row=>row.result).length,1);
  assert.equal(truthTable('(p→q) ↔ (¬p∨q)').status,'tautology');
  assert.equal(truthTable('[(p→q)∧(q→r)]→(p→r)'.replaceAll('[','(').replaceAll(']',')')).status,'tautology');
  assert.equal(argumentValidity(['p→q','q→r','¬r'],'¬p').valid,true);
  const invalid=argumentValidity(['p→q'],'p');
  assert.equal(invalid.valid,false);
  assert.deepEqual(invalid.counterexample,{p:false,q:false});
  assert.equal(argumentValidity(['p→q','r→s','p∨r'],'q∨s').valid,true);
  assert.throws(()=>truthTable('p && q'),RangeError);
});

test('Lógica 7, 17 y 21: conjuntos y relación de equivalencia',()=>{
  assert.deepEqual(finiteSetOperations([1,2,3,4,5],[4,5,6,7]),{
    union:[1,2,3,4,5,6,7],intersection:[4,5],difference:[1,2,3],symmetricDifference:[1,2,3,6,7],
  });
  const pairs=[];
  for (let a=1;a<=4;a++) for (let b=1;b<=4;b++) if ((a+b)%2===0) pairs.push([a,b]);
  const result=relationProperties([1,2,3,4],pairs);
  assert.equal(result.equivalence,true);
  assert.deepEqual(result.classes,[[1,3],[2,4]]);
  assert.deepEqual(relationProperties([1,2,3],[[1,1],[1,2],[2,3]]).range,[1,2,3]);
});

test('Lógica 28, 29 y 45: minimización con y sin condiciones indiferentes',()=>{
  assert.equal(minimizeBoolean(['A','B','C'],[1,3,5,7]).expression,'C');
  const result=minimizeBoolean(['A','B','C'],[1,3,5,6,7]);
  assert.equal(new Set(result.expression.split(' + ')).size,2);
  assert.ok(result.expression.includes('C'));
  assert.ok(result.expression.includes('AB'));
  const withDontCares=minimizeBoolean(['A','B','C','D'],[1,3,7,11,15],[0,2,5]);
  assert.ok(withDontCares.implicants.length>0);
  assert.throws(()=>minimizeBoolean(['A','B'],[1,1]),RangeError);
});
