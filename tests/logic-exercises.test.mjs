import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../js/math/logic.mjs';
import * as A from '../js/math/logic-advanced.mjs';
import * as G from '../js/math/graphs.mjs';
const plain=[['A','B'],['A','C'],['B','C'],['C','D'],['D','E']];
const weighted=[['A','B',4],['A','C',2],['B','C',1],['B','D',5],['C','D',8],['C','E',10],['D','E',2]];
const mst=[['A','B',7],['A','D',5],['B','C',8],['B','D',9],['B','E',7],['C','E',5],['D','E',15],['D','F',6],['E','F',8],['E','G',9],['F','G',11]];
const tree={value:8,left:{value:3,left:{value:1},right:{value:6,left:{value:4},right:{value:7}}},right:{value:10,right:{value:14,left:{value:13}}}};
const parityPairs=[];for(let x=1;x<=4;x++)for(let y=1;y<=4;y++)if((x+y)%2===0)parityPairs.push([x,y]);
function checkBoolean(names,ones,dont=[]){const r=L.minimizeBoolean(names,ones,dont);for(let i=0;i<2**names.length;i++){if(dont.includes(i))continue;const value=r.implicants.some(p=>[...p.pattern].every((bit,j)=>bit==='-'||Number(bit)===((i>>(names.length-j-1))&1)));assert.equal(value,ones.includes(i),`minterm ${i}`);}return r;}
function checkNetwork(names,ones,network,dont=[]){for(let i=0;i<2**names.length;i++){if(dont.includes(i))continue;const values={'0':false,'1':true,...Object.fromEntries(names.map((v,j)=>[v,Boolean((i>>(names.length-j-1))&1)]))};for(const gate of network.gates){assert.ok(gate.inputs.every(k=>Object.hasOwn(values,k)));values[gate.output]=gate.operation==='NAND'?!gate.inputs.every(k=>values[k]):!gate.inputs.some(k=>values[k]);}assert.equal(values[network.output],ones.includes(i),`assignment ${i}`);}}
const cases=[
 ()=>assert.equal(L.convertBase('156',10,2).text,'10011100'),
 ()=>assert.equal(L.convertBase('10110101',2,10).text,'181'),
 ()=>assert.equal(L.convertBase('A3F',16,10).text,'2623'),
 ()=>assert.equal(L.convertBase('725',8,2).text,'111010101'),
 ()=>assert.equal(L.baseArithmetic('1101','1011',2,'add').result,'11000'),
 ()=>assert.equal(L.baseArithmetic('1010','101',2,'multiply').result,'110010'),
 ()=>assert.deepEqual(L.finiteSetOperations([1,2,3,4,5],[4,5,6,7]),{union:[1,2,3,4,5,6,7],intersection:[4,5],difference:[1,2,3],symmetricDifference:[1,2,3,6,7]}),
 ()=>{assert.equal(A.finiteCounting(6,0).subsets,64n);assert.equal(A.finiteCounting(4,5).cartesianSize,20);},
 ()=>assert.deepEqual(L.truthTable('p∧¬q').rows.map(r=>r.result),[false,false,true,false]),
 ()=>assert.equal(L.truthTable('(p→q)↔(¬p∨q)').status,'tautology'),
 ()=>{assert.equal(L.truthTable('¬(p∧q)↔(¬p∨¬q)').status,'tautology');assert.match(A.guidedNegations().quantified,/∃x\(x≤2\)/);},
 ()=>{const r=A.quantifiedPredicate([1,2,3,4],'x^2<10');assert.equal(r.universal,false);assert.equal(r.existential,true);assert.equal(r.counterexample,4);assert.equal(r.witness,1);},
 ()=>assert.equal(checkBoolean(['A','B'],[2,3]).expression,'A'),
 ()=>assert.deepEqual(L.truthTable('A∧B∨¬A').rows.map(r=>r.result),[true,true,false,true]),
 ()=>{const r=G.graphFamilyCounts({edges:7,vertices:6,left:1,right:1,leaves:1});assert.equal(r.degreeSum,14);assert.equal(r.completeEdges,15);},
 ()=>{const r=G.graphFamilyCounts({edges:0,vertices:15,left:1,right:1,leaves:8});assert.equal(r.treeEdges,14);assert.equal(r.fullBinaryNodes,15);},
 ()=>{const r=L.relationProperties([1,2,3],[[1,1],[1,2],[2,3]]);assert.deepEqual(r.observedDomain,[1,2]);assert.deepEqual(r.range,[1,2,3]);},
 ()=>{assert.equal(L.convertBase('0.6875',10,2).text,'0.1011');assert.equal(L.convertBase('101.011',2,10).text,'5.375');},
 ()=>assert.equal(L.baseArithmetic('3B7','1F9',16,'subtract').result,'1BE'),
 ()=>{const r=L.baseArithmetic('11101','101',2,'divide');assert.equal(r.result,'101');assert.equal(r.remainder,'100');},
 ()=>{const r=L.relationProperties([1,2,3,4],parityPairs);assert.equal(r.equivalence,true);assert.deepEqual(r.classes,[[1,3],[2,4]]);assert.deepEqual(r.matrix,[[1,0,1,0],[0,1,0,1],[1,0,1,0],[0,1,0,1]]);},
 ()=>{const r=A.affinePowerComposition(2,1,2);assert.equal(r.gAfterF,'((2)x+(1))^2');assert.equal(r.fAfterG,'(2)x^2+(1)');assert.equal(r.inverse,'(x−(1))/(2)');},
 ()=>assert.deepEqual([A.setCardinality([30,25],[10],0,60).union,A.setCardinality([30,25],[10],0,60).complement],[45,15]),
 ()=>assert.equal(L.truthTable('((p→q)∧(q→r))→(p→r)').status,'tautology'),
 ()=>assert.equal(L.argumentValidity(['p→q','q→r','¬r'],'¬p').valid,true),
 ()=>{const r=A.inductionSum('squares',10);assert.equal(r.value,385);assert.match(r.inductionStep,/\(k\+1\)\(k\+2\)\(2k\+3\)\/6/);},
 ()=>assert.match(A.guidedInduction('power2',5).step,/2\(3m\+1\)/),
 ()=>{const r=A.karnaughMap(['A','B','C'],[1,3,5,7]);assert.equal(r.expression,'C');assert.equal(r.groups.length,1);assert.deepEqual(r.groups[0].indices.slice().sort((a,b)=>a-b),[1,3,5,7]);},
 ()=>assert.equal(checkBoolean(['A','B','C'],[1,3,5,6,7]).implicants.length,2),
 ()=>{const terms=A.booleanMinterms(['A','B','C'],'maxterms',[0,2,4]);assert.deepEqual(terms,[1,3,5,6,7]);assert.equal(checkBoolean(['A','B','C'],terms).implicants.length,2);},
 ()=>{const r=G.graphSummary(plain);assert.deepEqual(r.degrees,{A:2,B:2,C:3,D:2,E:1});assert.equal(r.euler,'trail');assert.equal(G.graphTraversal(plain,'A').order.length,5);},
 ()=>{assert.deepEqual(G.graphTraversal(plain,'A','bfs').order,['A','B','C','D','E']);assert.deepEqual(G.graphTraversal(plain,'A','dfs').order,['A','B','C','D','E']);},
 ()=>{const r=G.dijkstra(weighted,'A','E');assert.equal(r.distance,10);assert.deepEqual(r.path,['A','C','B','D','E']);},
 ()=>{const r=G.binaryTreeTraversals(tree);assert.deepEqual(r.preorder,[8,3,1,6,4,7,10,14,13]);assert.deepEqual(r.inorder,[1,3,4,6,7,8,10,13,14]);assert.deepEqual(r.postorder,[1,4,7,6,3,13,14,10,8]);},
 ()=>{assert.equal(L.twosComplement(-45,8).bits,'11010011');assert.equal(L.signedBinaryAddition(100,-45,8).bits,'00110111');},
 ()=>assert.deepEqual(L.bitwiseWord(0xB7,0x5C,8),{and:'00010100',or:'11111111',xor:'11101011',notFirst:'01001000'}),
 ()=>assert.equal(A.setCardinality([50,40,30],[15,10,12],5).union,88),
 ()=>{const r=A.finiteCounting(4,4);assert.equal(r.binaryRelations,65536n);assert.equal(r.reflexiveRelations,4096n);assert.equal(r.symmetricRelations,1024n);assert.equal(r.equivalenceRelations,15n);},
 ()=>{assert.equal(A.finiteCounting(4,7).injective,840n);assert.equal(A.finiteCounting(5,3).surjective,150n);},
 ()=>{const r=A.guidedDisjunctionProof();assert.equal(r.valid,true);assert.equal(r.steps.at(-1)[2],'∨E, 3 y ramas 4–6, 7–9');},
 ()=>{assert.deepEqual(A.integerQuantifierExample('Z').rows.map(r=>r.truth),[true,false,false,true]);assert.deepEqual(A.integerQuantifierExample('N').rows.map(r=>r.truth),[false,false,true,true]);},
 ()=>{assert.match(A.guidedInduction('power7',5).step,/6\(7m\+1\)/);assert.match(A.guidedInduction('odds',5).step,/\(k\+1\)²/);},
 ()=>{const r=A.guidedInduction('factorial',4);assert.match(r.base,/24 > 16/);assert.match(r.step,/k\+1≥5>2/);},
 ()=>{const r=checkBoolean(['A','B','C','D'],[0,1,2,5,8,9,10]);assert.deepEqual(r.implicants.map(p=>p.pattern).sort(),['-0-0','-00-','0-01'].sort());},
 ()=>assert.equal(checkBoolean(['A','B','C','D'],[1,3,7,11,15],[0,2,5]).implicants.length,2),
 ()=>{const terms=A.booleanMinterms(['A','B','C'],'formula',[],'(A∨B)∧(¬A∨C)');assert.deepEqual(terms,[2,3,5,7]);const r=A.nandNetwork(['A','B','C'],terms);assert.equal(r.gates.length,4);checkNetwork(['A','B','C'],terms,r);},
 ()=>{const r=G.kruskal(mst);assert.equal(r.weight,39);assert.equal(r.edges.length,6);},
 ()=>{const r=G.maxFlow([['s','a',10],['s','b',5],['a','b',15],['a','t',5],['b','t',10]],'s','t');assert.equal(r.flow,15);assert.equal(r.cutCapacity,15);},
 ()=>{assert.equal(G.havelHakimi([4,3,3,2,2]).graphical,true);assert.equal(G.graphFamilyCounts({edges:0,vertices:1,left:3,right:4,leaves:1}).bipartiteEdges,12);},
 ()=>{const r=G.huffman({a:45,b:13,c:12,d:16,e:9,f:5});assert.equal(r.cost,224);assert.deepEqual(Object.fromEntries(Object.entries(r.codes).map(([key,code])=>[key,code.length])),{a:1,b:3,c:3,d:3,e:4,f:4});},
];
assert.equal(cases.length,50);cases.forEach((run,i)=>test(`Lógica ${i+1}: referencia independiente del enunciado`,run));
test('NOR: todas las funciones de dos variables y condiciones indiferentes de cuatro',()=>{
 for(let mask=0;mask<16;mask++){const terms=[0,1,2,3].filter(i=>mask&(1<<i));checkNetwork(['A','B'],terms,A.norNetwork(['A','B'],terms));}
 const names=['A','B','C','D'],terms=[1,3,7,11,15],dont=[0,2,5];checkNetwork(names,terms,A.norNetwork(names,terms,dont),dont);
});
test('Contraejemplos concretos de relación y cardinalidades imposibles',()=>{
 const r=L.relationProperties([1,2,3],[[1,1],[1,2],[2,3]]);assert.deepEqual(r.counterexamples,{reflexive:[2,2],symmetric:[1,2],transitive:[1,2,3]});
 assert.throws(()=>A.setCardinality([2,2],[3]),/negativa/);assert.throws(()=>A.setCardinality([30,25],[10],0,40),/universo/);
 assert.throws(()=>A.quantifiedPredicate([0],'1/x>2'),/dominio/);assert.throws(()=>A.affinePowerComposition(0,1,2),/a≠0/);
});
test('Algoritmos: contraejemplo de argumento, camino ausente, overflow y K-map sin cubrir ceros',()=>{
 assert.equal(L.argumentValidity(['p→q'],'q').valid,false);assert.equal(G.dijkstra([['A','B',1],['C','D',1]],'A','D').status,'unreachable');
 assert.equal(L.signedBinaryAddition(100,60,8).overflow,true);
 const map=A.karnaughMap(['A','B','C','D'],[1,3,7,11,15],[0,2,5]);for(const group of map.groups){assert.equal(group.indices.length&(group.indices.length-1),0);assert.ok(group.indices.every(i=>[1,3,7,11,15,0,2,5].includes(i)));}
});
