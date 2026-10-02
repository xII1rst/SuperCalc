import { binaryTreeTraversals, bipartiteMatching, classifyTree, dijkstra, graphFamilyCounts, graphSummary, graphTraversal, havelHakimi, huffman, kruskal, maxFlow, petriReachability } from '../../math/graphs.mjs';
import { escapeHtml, fail, graphEdges, integer, ints, items, list, read, show, table } from './inputs.mjs';
import { renderLogicGraph, renderLogicTree } from '../../graphics/logic-graph.mjs';

export function logicCalculateGraph() {
  try {
    const mode=read('logic-graph-mode');
    if(mode==='counts') {
      const input={edges:integer('logic-graph-count-edges'),vertices:integer('logic-graph-count-vertices'),
        left:integer('logic-graph-count-left'),right:integer('logic-graph-count-right'),leaves:integer('logic-graph-count-leaves')};
      const result=graphFamilyCounts(input);
      show('Conteos de grafos y árboles',table(['Caso','Fórmula','Resultado'],[
        [`Suma de grados con ${input.edges} aristas`,'2E',result.degreeSum],
        [`Aristas de K${input.vertices}`,'n(n−1)/2',result.completeEdges],
        [`Aristas de un árbol con ${input.vertices} vértices`,'n−1',result.treeEdges],
        [`Aristas de K${input.left},${input.right}`,'m·n',result.bipartiteEdges],
        [`Nodos de árbol binario lleno con ${input.leaves} hojas`,'2L−1',result.fullBinaryNodes],
      ])+'<p class="tool-note">El último conteo supone que todo nodo interno tiene exactamente dos hijos; también vale para un árbol perfecto.</p>');
      return;
    }
    if(mode==='petri') {
      const initial=ints('logic-graph-marking'),transitions=JSON.parse(read('logic-graph-transitions'));
      const result=petriReachability(initial,transitions);
      const visibleCount=Math.min(result.states.length,12);
      const arcs=result.arcs.filter(arc=>arc.from<visibleCount&&arc.to<visibleCount).slice(0,24);
      const diagram=renderLogicGraph(arcs.map(arc=>[`M${arc.from}`,`M${arc.to}`,arc.transition]),{
        directed:true,vertices:result.states.slice(0,visibleCount).map((_,index)=>`M${index}`),
        title:'Red de alcanzabilidad de Petri',
        caption:`Mᵢ identifica el marcado de la tabla. Se dibujan ${visibleCount} de ${result.states.length} estados y ${arcs.length} de ${result.arcs.length} transiciones.`,
      });
      show('Red de Petri acotada',`<p>Estados alcanzados: ${result.states.length}; búsqueda ${result.status}. Límites: ${result.maxTokens} fichas por lugar y ${result.maxStates} estados.</p>`+
        diagram+
        table(['Estado','Marcado'],result.states.map((state,i)=>[`M${i}`,state.join(', ')]))+
        table(['Origen','Transición','Destino'],result.arcs.map(arc=>[`M${arc.from}`,arc.transition,`M${arc.to}`])));
      return;
    }
    if(mode==='matching') {
      const left=items('logic-graph-left'),right=items('logic-graph-right');
      const edges=graphEdges().map(edge=>edge.slice(0,2));
      const result=bipartiteMatching(left,right,edges);
      const diagram=left.length+right.length<=24?renderLogicGraph(edges,{
        vertices:[...left,...right],highlightedEdges:result.matches,title:'Emparejamiento bipartito',
        caption:'Aristas resaltadas: parejas elegidas. Los conjuntos izquierdo y derecho se declaran en el formulario.',
      }):'<p class="tool-note">Diagrama disponible hasta 24 vértices; la tabla conserva el resultado completo.</p>';
      show('Emparejamiento bipartito',`<p>Tamaño máximo = ${result.size}; sin pareja a la izquierda: ${list(result.unmatchedLeft)}.</p>`+
        diagram+
        table(['Izquierda','Derecha'],result.matches));
      return;
    }
    if (mode==='havel') {
      const result=havelHakimi(ints('logic-graph-sequence'));
      show('Havel-Hakimi',`<p>${result.graphical?'La secuencia es gráfica.':'La secuencia no es gráfica.'}</p>`+
        table(['Paso','Grados restantes'],result.steps.map((step,i)=>[i,step.join(', ')])));
      return;
    }
    if (mode==='huffman') {
      const lines=read('logic-graph-sequence').split(/[,;\n]+/).map(line=>line.trim()).filter(Boolean);
      const frequencies={};
      for (const line of lines) {
        const match=/^([A-Za-z0-9_]+)\s*[: ]\s*(\d+(?:\.\d+)?)$/.exec(line);
        if (!match) throw new RangeError('Frecuencias: usa a 45, b 13, ...');
        frequencies[match[1]]=Number(match[2]);
      }
      const result=huffman(frequencies);
      show('Huffman',`<p>Costo total = ${result.cost} bits para las frecuencias dadas.</p>`+
        (Object.keys(result.codes).length<=16?renderLogicTree(result.tree,{huffman:true,title:'Árbol de Huffman'}):'<p class="tool-note">Diagrama disponible hasta 16 símbolos; la tabla conserva todos los códigos.</p>')+
        table(['Símbolo','Frecuencia','Código'],Object.entries(result.codes).map(([symbol,code])=>[symbol,frequencies[symbol],code])));
      return;
    }
    if (mode==='tree') {
      const root=JSON.parse(read('logic-graph-tree'));
      const result=binaryTreeTraversals(root);
      show('Recorridos de árbol',`<p>Preorden: ${list(result.preorder)}; inorden: ${list(result.inorder)}; postorden: ${list(result.postorder)}.</p>`+
        (result.preorder.length<=31?renderLogicTree(root,{title:'Árbol binario'}):'<p class="tool-note">Diagrama disponible hasta 31 nodos; los recorridos conservan el resultado completo.</p>'));
      return;
    }
    const edges=graphEdges(),start=read('logic-graph-start'),target=read('logic-graph-target');
    const directed=read('logic-graph-directed')==='directed';
    if(mode==='classifytree'){
      if(directed)throw new RangeError('La clasificación requiere un grafo no dirigido.');
      const r=classifyTree(edges,start);show('Clasificación de árbol',`<p>${r.tree?`Árbol; raíz ${escapeHtml(r.root)}, altura ${r.height} aristas. Binario: ${r.binary?'sí':'no'}; lleno: ${r.full?'sí':'no'}; perfecto: ${r.perfect?'sí':'no'}. Hojas: ${list(r.leaves)}.`:`No es árbol: ${escapeHtml(r.reason)}`}</p><p>${escapeHtml(r.proof)}</p>${r.assumption?`<p>${escapeHtml(r.assumption)}</p>`:''}`+renderLogicGraph(edges,{vertices:r.vertices,title:'Árbol/grafo de entrada'})+(r.rows?table(['Vértice','Padre','Profundidad','Hijos'],r.rows.map(row=>[row.vertex,row.parent??'raíz',row.depth,list(row.children)])):''));return;
    }
    if (mode==='summary') {
      const result=graphSummary(edges,directed);
      show('Grafo',`<p>Vértices: ${list(result.vertices)}; aristas: ${result.edgeCount}; estado euleriano: ${result.euler} (${({circuit:'circuito cerrado: euleriano',trail:'camino abierto; no es euleriano cerrado',none:'sin camino euleriano',not_applicable:'criterio de Euler no aplicado a grafos dirigidos'})[result.euler]}).</p>`+
        renderLogicGraph(edges,{directed,title:'Grafo de entrada'})+
        table(['',...result.vertices],result.matrix.map((row,i)=>[result.vertices[i],...row]))+
        table(['Vértice','Grado'],result.vertices.map(vertex=>[vertex,JSON.stringify(result.degrees[vertex])])));
    } else if (mode==='bfs'||mode==='dfs') {
      const result=graphTraversal(edges,start,mode,directed);
      show(mode.toUpperCase(),`<p>Orden: ${list(result.order)}. Sin alcanzar: ${list(result.unreachable)}.</p>`+
        renderLogicGraph(edges,{directed,visited:result.order,title:`Recorrido ${mode.toUpperCase()}`})+
        table(['Paso','Vértice visitado'],result.order.map((vertex,index)=>[index+1,vertex])));
    } else if (mode==='dijkstra') {
      const result=dijkstra(edges,start,target,directed);
      show('Dijkstra',`<p>${result.status==='found'?`Distancia mínima = ${result.distance}; camino ${result.path.map(escapeHtml).join(' → ')}.`:'No hay camino entre los vértices.'}</p>`+
        renderLogicGraph(edges,{directed,visited:result.steps.map(step=>step.vertex),highlightedEdges:result.path.slice(1).map((vertex,index)=>[result.path[index],vertex]),title:'Dijkstra: vértices fijados y camino mínimo'})+
        table(['Vértice fijado','Distancia'],result.steps.map(step=>[step.vertex,step.distance])));
    } else if (mode==='kruskal') {
      const result=kruskal(edges);
      show('Kruskal',`<p>Estado: ${result.status}; peso total = ${result.weight}.</p>`+
        renderLogicGraph(edges,{highlightedEdges:result.edges,title:'Kruskal: aristas elegidas',caption:'Aristas resaltadas: árbol o bosque de expansión mínimo.'})+
        table(['Origen','Destino','Peso'],result.edges));
    } else if (mode==='flow') {
      const result=maxFlow(edges,start,target);
      show('Flujo máximo',`<p>Las aristas se interpretan como dirigidas. Flujo máximo = ${result.flow}; capacidad del corte mínimo = ${result.cutCapacity}.</p>`+
        renderLogicGraph(edges,{directed:true,visited:result.reachable,highlightedEdges:result.cut,title:'Flujo máximo: lado alcanzable y corte mínimo',caption:'Vértices resaltados: alcanzables desde la fuente en la red residual final. Aristas resaltadas: corte mínimo.'})+
        table(['Camino aumentante','Cantidad'],result.augmentations.map(step=>[step.path.join(' → '),step.amount]))+
        table(['Arista del corte','Capacidad'],result.cut.map(([a,b,value=1])=>[`${a} → ${b}`,value]))+
        '<p>Capacidad residual final (incluye arcos inversos):</p>'+
        table(['Desde','Hasta','Capacidad residual'],result.residualArcs.map(arc=>[arc.from,arc.to,arc.remaining])));
    } else throw new RangeError('Algoritmo inválido');
  } catch(error) {fail(error);}
}

export const panels={
  graphs:{title:'Grafos y árboles',description:'Analiza aristas y recorre paso a paso caminos, árboles mínimos, flujos, grados y códigos.',action:'logicCalculateGraph',controls:`
    <label for="logic-graph-mode">Algoritmo</label><select id="logic-graph-mode" class="tool-input"><option value="summary">Matriz, grados y Euler</option><option value="counts">Conteos de grafos y árboles</option><option value="bfs">BFS</option><option value="dfs">DFS</option><option value="dijkstra">Dijkstra</option><option value="kruskal">Kruskal</option><option value="flow">Flujo máximo y corte</option><option value="havel">Havel-Hakimi</option><option value="huffman">Huffman</option><option value="classifytree">Clasificar árbol enraizado</option><option value="tree">Recorridos de árbol binario</option><option value="matching">Emparejamiento bipartito</option><option value="petri">Red de Petri acotada</option></select>
    <label for="logic-graph-count-edges">Aristas de un grafo</label><input id="logic-graph-count-edges" class="tool-input" type="number" min="0" max="1000000" value="7">
    <label for="logic-graph-count-vertices">Vértices (Kₙ y árbol)</label><input id="logic-graph-count-vertices" class="tool-input" type="number" min="1" max="1000000" value="6">
    <label for="logic-graph-count-left">Vértices de la primera parte de Kₘ,ₙ</label><input id="logic-graph-count-left" class="tool-input" type="number" min="1" max="1000000" value="3">
    <label for="logic-graph-count-right">Vértices de la segunda parte de Kₘ,ₙ</label><input id="logic-graph-count-right" class="tool-input" type="number" min="1" max="1000000" value="4">
    <label for="logic-graph-count-leaves">Hojas de árbol binario lleno</label><input id="logic-graph-count-leaves" class="tool-input" type="number" min="1" max="1000000" value="8">
    <label for="logic-graph-left">Conjunto izquierdo para emparejamiento</label><input id="logic-graph-left" class="tool-input" type="text" value="A, B, C">
    <label for="logic-graph-right">Conjunto derecho para emparejamiento</label><input id="logic-graph-right" class="tool-input" type="text" value="X, Y">
    <label for="logic-graph-marking">Marcado inicial (fichas por lugar)</label><input id="logic-graph-marking" class="tool-input" type="text" value="1, 0">
    <label for="logic-graph-transitions">Transiciones JSON: name, input, output</label><textarea id="logic-graph-transitions" class="tool-textarea" rows="3">[{"name":"mover","input":[1,0],"output":[0,1]}]</textarea>
    <label for="logic-graph-edges">Aristas: origen destino peso (una por línea)</label><textarea id="logic-graph-edges" class="tool-textarea" rows="6">A B 4\nA C 2\nB C 1\nB D 5\nC D 8\nC E 10\nD E 2</textarea>
    <label for="logic-graph-start">Inicio/fuente</label><input id="logic-graph-start" class="tool-input" type="text" value="A">
    <label for="logic-graph-target">Destino/sumidero</label><input id="logic-graph-target" class="tool-input" type="text" value="E">
    <label for="logic-graph-directed">Dirección</label><select id="logic-graph-directed" class="tool-input"><option value="undirected">No dirigido</option><option value="directed">Dirigido</option></select>
    <label for="logic-graph-sequence">Secuencia de grados / frecuencias (a 45, b 13...)</label><input id="logic-graph-sequence" class="tool-input" type="text" value="4, 3, 3, 2, 2">
    <label for="logic-graph-tree">Árbol JSON (value,left,right)</label><textarea id="logic-graph-tree" class="tool-textarea" rows="3">{"value":8,"left":{"value":3},"right":{"value":10}}</textarea>`},
};
