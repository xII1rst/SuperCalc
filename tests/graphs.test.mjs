import test from 'node:test';
import assert from 'node:assert/strict';
import {
  graphSummary, graphTraversal, dijkstra, kruskal, havelHakimi,
  huffman, maxFlow, binaryTreeTraversals,
} from '../js/math/graphs.mjs';

test('Lógica 31–33: grados, Euler, recorridos y camino mínimo',()=>{
  const edges=[['A','B'],['A','C'],['B','C'],['C','D'],['D','E']];
  const summary=graphSummary(edges);
  assert.deepEqual(summary.degrees,{A:2,B:2,C:3,D:2,E:1});
  assert.equal(summary.euler,'trail');
  assert.deepEqual(graphTraversal(edges,'A','bfs').order,['A','B','C','D','E']);
  assert.deepEqual(graphTraversal(edges,'A','dfs').order,['A','B','C','D','E']);
  const weighted=[['A','B',4],['A','C',2],['B','C',1],['B','D',5],['C','D',8],['C','E',10],['D','E',2]];
  const shortest=dijkstra(weighted,'A','E');
  assert.equal(shortest.distance,10);
  assert.deepEqual(shortest.path,['A','C','B','D','E']);
  assert.equal(dijkstra([['A','B',1],['C','D',1]],'A','D').status,'unreachable');
});

test('Lógica 47 y 49: Kruskal y Havel-Hakimi',()=>{
  const edges=[['A','B',7],['A','D',5],['B','C',8],['B','D',9],['B','E',7],['C','E',5],['D','E',15],['D','F',6],['E','F',8],['E','G',9],['F','G',11]];
  const result=kruskal(edges);
  assert.equal(result.status,'tree');
  assert.equal(result.weight,39);
  assert.equal(result.edges.length,6);
  assert.equal(havelHakimi([4,3,3,2,2]).graphical,true);
  assert.equal(havelHakimi([4,4,1,1]).graphical,false);
});

test('Lógica 48 y 50: flujo/corte y Huffman validado por prefijos y costo',()=>{
  const network=[['s','a',10],['s','b',5],['a','b',15],['a','t',5],['b','t',10]];
  const result=maxFlow(network,'s','t');
  assert.equal(result.flow,15);
  assert.equal(result.cutCapacity,15);
  const frequencies={a:45,b:13,c:12,d:16,e:9,f:5};
  const codes=huffman(frequencies);
  assert.equal(codes.cost,224);
  for (const [a,code] of Object.entries(codes.codes)) for (const [b,other] of Object.entries(codes.codes)) {
    if (a!==b) assert.equal(other.startsWith(code),false);
  }
});

test('Lógica 34: recorridos de árbol binario',()=>{
  const tree={value:8,left:{value:3,left:{value:1},right:{value:6,left:{value:4},right:{value:7}}},right:{value:10,right:{value:14,left:{value:13}}}};
  const result=binaryTreeTraversals(tree);
  assert.deepEqual(result.preorder,[8,3,1,6,4,7,10,14,13]);
  assert.deepEqual(result.inorder,[1,3,4,6,7,8,10,13,14]);
  assert.deepEqual(result.postorder,[1,4,7,6,3,13,14,10,8]);
});
