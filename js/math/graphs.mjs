function checkedEdges(edges, directed = false) {
  if (!Array.isArray(edges) || edges.length>100 || edges.some(edge=>!Array.isArray(edge)||edge.length<2||edge.length>3
    || typeof edge[0]!=='string'||typeof edge[1]!=='string'||!edge[0]||!edge[1]
    || (edge.length===3 && (!Number.isFinite(edge[2])||edge[2]<0)))) {
    throw new RangeError('Introduce hasta 100 aristas con nombres y pesos no negativos');
  }
  const vertices=[...new Set(edges.flatMap(edge=>edge.slice(0,2)))].sort();
  if (vertices.length>30) throw new RangeError('Máximo 30 vértices');
  const adjacency=new Map(vertices.map(vertex=>[vertex,[]]));
  for (const [from,to,weight=1] of edges) {
    adjacency.get(from).push({to,weight});
    if (!directed) adjacency.get(to).push({to:from,weight});
  }
  for (const neighbors of adjacency.values()) neighbors.sort((a,b)=>a.to.localeCompare(b.to));
  return {vertices,adjacency};
}

export function graphFamilyCounts({edges,vertices,left,right,leaves}) {
  const values=[edges,vertices,left,right,leaves];
  if(values.some(value=>!Number.isSafeInteger(value)||value<0||value>1000000)||
    vertices<1||left<1||right<1||leaves<1) throw new RangeError('Usa cantidades enteras válidas; vértices y hojas deben ser positivos');
  return {
    degreeSum:2*edges,
    completeEdges:vertices*(vertices-1)/2,
    treeEdges:vertices-1,
    bipartiteEdges:left*right,
    fullBinaryNodes:2*leaves-1,
  };
}

export function graphSummary(edges, directed = false) {
  const graph=checkedEdges(edges,directed);
  const matrix=graph.vertices.map(from=>graph.vertices.map(to=>graph.adjacency.get(from).filter(edge=>edge.to===to).length));
  const degrees=Object.fromEntries(graph.vertices.map((vertex,index)=>[vertex,
    directed?{out:matrix[index].reduce((sum,value)=>sum+value,0),in:matrix.reduce((sum,row)=>sum+row[index],0)}
      :matrix[index].reduce((sum,value)=>sum+value,0)]));
  let euler='not_applicable';
  if (!directed && graph.vertices.length) {
    const active=graph.vertices.filter(vertex=>degrees[vertex]>0);
    const reached=active.length?new Set(graphTraversal(edges,active[0],'bfs').order):new Set();
    const connected=active.every(vertex=>reached.has(vertex));
    const odd=active.filter(vertex=>degrees[vertex]%2===1).length;
    euler=connected?(odd===0?'circuit':odd===2?'trail':'none'):'none';
  }
  return {vertices:graph.vertices,matrix,degrees,euler,edgeCount:edges.length};
}

export function graphTraversal(edges,start,method='bfs',directed=false) {
  if (!['bfs','dfs'].includes(method)) throw new RangeError('Recorrido inválido');
  const graph=checkedEdges(edges,directed);
  if (!graph.adjacency.has(start)) throw new RangeError('El inicio no pertenece al grafo');
  const visited=new Set(),order=[],frontier=[start];
  while(frontier.length) {
    const vertex=method==='bfs'?frontier.shift():frontier.pop();
    if (visited.has(vertex)) continue;
    visited.add(vertex);order.push(vertex);
    const neighbors=graph.adjacency.get(vertex).map(edge=>edge.to);
    if (method==='dfs') neighbors.reverse();
    for (const neighbor of neighbors) if (!visited.has(neighbor)) frontier.push(neighbor);
  }
  return {order,unreachable:graph.vertices.filter(vertex=>!visited.has(vertex))};
}

export function dijkstra(edges,start,target,directed=false) {
  const graph=checkedEdges(edges,directed);
  if (!graph.adjacency.has(start)||!graph.adjacency.has(target)) throw new RangeError('Inicio y destino deben pertenecer al grafo');
  const distance=Object.fromEntries(graph.vertices.map(vertex=>[vertex,Infinity]));
  const previous={};
  const visited=new Set(),steps=[];
  distance[start]=0;
  while(visited.size<graph.vertices.length) {
    const vertex=graph.vertices.filter(item=>!visited.has(item)).sort((a,b)=>distance[a]-distance[b]||a.localeCompare(b))[0];
    if (!vertex||!Number.isFinite(distance[vertex])) break;
    visited.add(vertex);
    steps.push({vertex,distance:distance[vertex]});
    for (const edge of graph.adjacency.get(vertex)) {
      const candidate=distance[vertex]+edge.weight;
      if (candidate<distance[edge.to]) {distance[edge.to]=candidate;previous[edge.to]=vertex;}
    }
  }
  if (!Number.isFinite(distance[target])) return {status:'unreachable',distance:Infinity,path:[],steps};
  const path=[];
  for(let vertex=target;vertex!==undefined;vertex=previous[vertex]) path.push(vertex);
  path.reverse();
  return {status:'found',distance:distance[target],path,steps};
}

export function kruskal(edges) {
  const graph=checkedEdges(edges);
  const parent=new Map(graph.vertices.map(vertex=>[vertex,vertex]));
  const find=vertex=>{
    while(parent.get(vertex)!==vertex) {parent.set(vertex,parent.get(parent.get(vertex)));vertex=parent.get(vertex);}
    return vertex;
  };
  const chosen=[],rejected=[];
  const sorted=[...edges].map(([a,b,weight=1])=>[a,b,weight]).sort((a,b)=>a[2]-b[2]||a[0].localeCompare(b[0])||a[1].localeCompare(b[1]));
  for (const edge of sorted) {
    const a=find(edge[0]),b=find(edge[1]);
    if (a===b) rejected.push(edge);
    else {parent.set(a,b);chosen.push(edge);}
  }
  return {status:chosen.length===Math.max(0,graph.vertices.length-1)?'tree':'forest',
    edges:chosen,rejected,weight:chosen.reduce((sum,edge)=>sum+edge[2],0),vertices:graph.vertices};
}

export function havelHakimi(sequence) {
  if (!Array.isArray(sequence)||!sequence.length||sequence.length>30||sequence.some(value=>!Number.isInteger(value)||value<0)) {
    throw new RangeError('Secuencia de grados inválida');
  }
  let degrees=[...sequence];
  const steps=[];
  while(true) {
    degrees.sort((a,b)=>b-a);
    steps.push([...degrees]);
    if (degrees.every(value=>value===0)) return {graphical:true,steps,edges:sequence.reduce((sum,value)=>sum+value,0)/2};
    const head=degrees.shift();
    if (head>degrees.length) return {graphical:false,steps};
    for (let i=0;i<head;i++) degrees[i]--;
    if (degrees.some(value=>value<0)) return {graphical:false,steps};
  }
}

export function huffman(frequencies) {
  const entries=Object.entries(frequencies);
  if (!entries.length||entries.length>32||entries.some(([symbol,value])=>!symbol||!Number.isFinite(value)||value<=0)) {
    throw new RangeError('Frecuencias positivas para 1 a 32 símbolos');
  }
  let sequence=0;
  const queue=entries.map(([symbol,weight])=>({symbol,weight,order:sequence++}));
  const steps=[];
  while(queue.length>1) {
    queue.sort((a,b)=>a.weight-b.weight||a.order-b.order);
    const left=queue.shift(),right=queue.shift();
    steps.push({left:left.symbol??'*',right:right.symbol??'*',weight:left.weight+right.weight});
    queue.push({left,right,weight:left.weight+right.weight,order:sequence++});
  }
  const codes={};
  const walk=(node,code)=>{
    if (node.symbol!==undefined) {codes[node.symbol]=code||'0';return;}
    walk(node.left,code+'0');walk(node.right,code+'1');
  };
  walk(queue[0],'');
  const cost=entries.reduce((sum,[symbol,weight])=>sum+weight*codes[symbol].length,0);
  return {codes,cost,steps,totalWeight:queue[0].weight,tree:queue[0]};
}

export function maxFlow(edges,source,sink) {
  const graph=checkedEdges(edges,true);
  if (!graph.vertices.includes(source)||!graph.vertices.includes(sink)||source===sink) throw new RangeError('Fuente y sumidero distintos dentro de la red');
  const capacity=new Map(graph.vertices.map(vertex=>[vertex,new Map()]));
  for (const [from,to,value=1] of edges) capacity.get(from).set(to,(capacity.get(from).get(to)||0)+value);
  const residual=new Map(graph.vertices.map(vertex=>[vertex,new Map()]));
  for (const [from,to,value=1] of edges) {
    residual.get(from).set(to,(residual.get(from).get(to)||0)+value);
    if (!residual.get(to).has(from)) residual.get(to).set(from,0);
  }
  let flow=0;
  const augmentations=[];
  while(true) {
    const parent=new Map([[source,null]]),queue=[source];
    while(queue.length&&!parent.has(sink)) {
      const vertex=queue.shift();
      for (const [neighbor,remaining] of residual.get(vertex)) if (remaining>1e-12&&!parent.has(neighbor)) {
        parent.set(neighbor,vertex);queue.push(neighbor);
      }
    }
    if (!parent.has(sink)) break;
    const path=[];
    let amount=Infinity;
    for(let vertex=sink;vertex!==source;vertex=parent.get(vertex)) {
      const from=parent.get(vertex);path.unshift([from,vertex]);
      amount=Math.min(amount,residual.get(from).get(vertex));
    }
    for (const [from,to] of path) {
      residual.get(from).set(to,residual.get(from).get(to)-amount);
      residual.get(to).set(from,(residual.get(to).get(from)||0)+amount);
    }
    flow+=amount;
    augmentations.push({path:[source,...path.map(edge=>edge[1])],amount});
    if (augmentations.length>1000) throw new RangeError('Demasiados aumentos de flujo');
  }
  const reachable=new Set([source]),queue=[source];
  while(queue.length) {
    const vertex=queue.shift();
    for (const [neighbor,remaining] of residual.get(vertex)) if (remaining>1e-12&&!reachable.has(neighbor)) {
      reachable.add(neighbor);queue.push(neighbor);
    }
  }
  const cut=edges.filter(([from,to])=>reachable.has(from)&&!reachable.has(to));
  const cutCapacity=cut.reduce((sum,[from,to,value=1])=>sum+value,0);
  const residualArcs=[...residual].flatMap(([from,neighbors])=>[...neighbors].map(([to,remaining])=>({
    from,to,remaining:Math.abs(remaining)<1e-12?0:remaining,
  }))).sort((a,b)=>a.from.localeCompare(b.from)||a.to.localeCompare(b.to));
  return {flow,augmentations,cut,cutCapacity,reachable:[...reachable],residualArcs};
}

export function binaryTreeTraversals(root) {
  const preorder=[],inorder=[],postorder=[];
  const seen=new Set();
  function visit(node,depth) {
    if (node===null||node===undefined) return;
    if (typeof node!=='object'||!Object.hasOwn(node,'value')||depth>30||seen.has(node)) throw new RangeError('Árbol binario inválido o cíclico');
    seen.add(node);
    preorder.push(node.value);
    visit(node.left,depth+1);
    inorder.push(node.value);
    visit(node.right,depth+1);
    postorder.push(node.value);
  }
  visit(root,0);
  return {preorder,inorder,postorder};
}

export function bipartiteMatching(left,right,edges) {
  if(!Array.isArray(left)||!Array.isArray(right)||!Array.isArray(edges)||!left.length||!right.length||
    left.length>30||right.length>30||new Set(left).size!==left.length||new Set(right).size!==right.length||
    left.some(name=>typeof name!=='string'||!name)||right.some(name=>typeof name!=='string'||!name)||
    edges.some(edge=>!Array.isArray(edge)||edge.length!==2||!left.includes(edge[0])||!right.includes(edge[1]))) {
    throw new RangeError('Grafo bipartito inválido; declara dos conjuntos de hasta 30 vértices');
  }
  const adjacent=new Map(left.map(name=>[name,edges.filter(edge=>edge[0]===name).map(edge=>edge[1])]));
  const matchRight=new Map(),steps=[];
  function augment(vertex,seen,path) {
    for(const neighbor of adjacent.get(vertex)) {
      if(seen.has(neighbor)) continue;
      seen.add(neighbor);
      const previous=matchRight.get(neighbor);
      if(previous===undefined||augment(previous,seen,[...path,neighbor,previous])) {
        matchRight.set(neighbor,vertex);
        steps.push({left:vertex,right:neighbor,reassigned:previous??null});
        return true;
      }
    }
    return false;
  }
  for(const vertex of left) augment(vertex,new Set(),[vertex]);
  const matches=[...matchRight].map(([r,l])=>[l,r]).sort((a,b)=>left.indexOf(a[0])-left.indexOf(b[0]));
  return {size:matches.length,matches,unmatchedLeft:left.filter(name=>!matches.some(([l])=>l===name)),
    unmatchedRight:right.filter(name=>!matchRight.has(name)),steps};
}

export function petriReachability(initial,transitions,{maxStates=300,maxTokens=20}={}) {
  if(!Array.isArray(initial)||!initial.length||initial.length>8||initial.some(value=>!Number.isInteger(value)||value<0)||
    !Array.isArray(transitions)||!transitions.length||transitions.length>20||
    transitions.some(item=>typeof item.name!=='string'||!item.name||!Array.isArray(item.input)||!Array.isArray(item.output)||
      item.input.length!==initial.length||item.output.length!==initial.length||
      [...item.input,...item.output].some(value=>!Number.isInteger(value)||value<0))||
    !Number.isInteger(maxStates)||maxStates<1||maxStates>1000||!Number.isInteger(maxTokens)||maxTokens<1||maxTokens>100) {
    throw new RangeError('Red de Petri inválida o fuera de límites');
  }
  const states=[initial.slice()],seen=new Map([[initial.join(','),0]]),arcs=[];
  let truncated=false;
  for(let cursor=0;cursor<states.length;cursor++) {
    const marking=states[cursor];
    for(const transition of transitions) {
      if(transition.input.some((need,i)=>marking[i]<need)) continue;
      const next=marking.map((tokens,i)=>tokens-transition.input[i]+transition.output[i]);
      if(next.some(tokens=>tokens>maxTokens)) {truncated=true;continue;}
      const key=next.join(',');
      if(!seen.has(key)) {
        if(states.length>=maxStates) {truncated=true;continue;}
        seen.set(key,states.length);states.push(next);
      }
      arcs.push({from:cursor,to:seen.get(key),transition:transition.name});
    }
  }
  return {states,arcs,status:truncated?'bounded search':'complete',maxStates,maxTokens};
}

export function classifyTree(edges,root){
 const {vertices,adjacency}=checkedEdges(edges,false);
 if(typeof root!=='string'||!root.trim())throw new RangeError('Raíz con nombre requerida.');
 if(!vertices.length)vertices.push(root),adjacency.set(root,[]);
 if(!adjacency.has(root))throw new RangeError('La raíz no pertenece al grafo.');
 const reached=new Set([root]),queue=[root],parent=new Map([[root,null]]),depth=new Map([[root,0]]),children=new Map(vertices.map(v=>[v,[]]));
 for(let i=0;i<queue.length;i++)for(const{to}of adjacency.get(queue[i]))if(!reached.has(to)){reached.add(to);queue.push(to);parent.set(to,queue[i]);depth.set(to,depth.get(queue[i])+1);children.get(queue[i]).push(to);}
 const connected=reached.size===vertices.length,tree=connected&&edges.length===vertices.length-1;
 if(!tree)return {tree:false,connected,vertices,unreachable:vertices.filter(v=>!reached.has(v)),reason:!connected?'Grafo desconectado.':'Conectado, pero |E|≠|V|−1: contiene un ciclo (incluidos lazos o aristas paralelas).',proof:'Un multigrafo no dirigido conectado es árbol si y solo si tiene |V|−1 aristas.'};
 const leaves=vertices.filter(v=>children.get(v).length===0),binary=vertices.every(v=>children.get(v).length<=2),full=binary&&vertices.every(v=>[0,2].includes(children.get(v).length)),height=Math.max(...depth.values()),perfect=full&&leaves.every(v=>depth.get(v)===height);
 return {tree:true,connected:true,root,vertices,height,leaves,binary,full,perfect,breadthFirst:queue,
  rows:vertices.map(v=>({vertex:v,parent:parent.get(v),depth:depth.get(v),children:children.get(v)})),proof:'Conectividad por BFS y |E|=|V|−1; camino único. Árbol binario: ≤2 hijos; lleno: 0 o 2; perfecto: lleno y todas las hojas a la misma profundidad.',assumption:'Grafo no dirigido; altura en aristas. La clasificación binaria depende de la raíz. Sin orden izquierda/derecha no se decide la propiedad de árbol completo.'};
}
