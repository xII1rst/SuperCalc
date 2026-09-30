import {
  convertBase, parseBaseNumber, baseArithmetic, twosComplement, signedBinaryAddition, bitwiseWord,
  truthTable, argumentValidity, finiteSetOperations, relationProperties, minimizeBoolean,
} from '../math/logic.mjs';
import { normalForms, quantifiedRelation, integerQuantifierExample, guidedDisjunctionProof, finiteCounting, karnaughMap, nandNetwork, inductionSum, guidedInduction } from '../math/logic-advanced.mjs';
import {
  graphFamilyCounts, graphSummary, graphTraversal, dijkstra, kruskal, havelHakimi,
  huffman, maxFlow, binaryTreeTraversals, bipartiteMatching, petriReachability,
} from '../math/graphs.mjs';
import { renderLogicGraph, renderLogicTree } from '../graphics/logic-graph.mjs';

const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const panels={
  bases:{title:'Bases y bits',description:'Convierte enteros o fracciones, representa complemento a dos y opera palabras binarias de ancho fijo.',action:'logicCalculateBases',controls:`
    <label for="logic-base-mode">Operación</label><select id="logic-base-mode" class="tool-input"><option value="convert">Convertir base</option><option value="arithmetic">Aritmética posicional</option><option value="twos">Complemento a dos</option><option value="add">Suma con signo</option><option value="bits">AND, OR, XOR, NOT</option></select>
    <label for="logic-base-op">Aritmética</label><select id="logic-base-op" class="tool-input"><option value="add">Sumar</option><option value="subtract">Restar</option><option value="multiply">Multiplicar</option><option value="divide">Dividir con residuo</option></select>
    <label for="logic-base-a">Primer valor</label><input id="logic-base-a" class="tool-input" type="text" value="156">
    <label for="logic-base-b">Segundo valor (suma/bit a bit)</label><input id="logic-base-b" class="tool-input" type="text" value="0">
    <label for="logic-base-from">Base de entrada</label><input id="logic-base-from" class="tool-input" type="number" min="2" max="36" value="10">
    <label for="logic-base-to">Base de salida</label><input id="logic-base-to" class="tool-input" type="number" min="2" max="36" value="2">
    <label for="logic-base-width">Ancho de palabra (2–64)</label><input id="logic-base-width" class="tool-input" type="number" min="2" max="64" value="8">`},
  sets:{title:'Conjuntos y relaciones',description:'Calcula operaciones de conjuntos finitos y prueba reflexividad, simetría y transitividad de una relación.',action:'logicCalculateSets',controls:`
    <label for="logic-set-mode">Operación</label><select id="logic-set-mode" class="tool-input"><option value="sets">Dos conjuntos</option><option value="relation">Relación finita</option><option value="quantified">Cuantificadores sobre R(x,y)</option><option value="integers">Ejemplo x+y=0 sobre ℤ o ℕ</option><option value="count">Conteo de funciones y relaciones</option></select>
    <label for="logic-set-infinite-domain">Dominio del ejemplo</label><select id="logic-set-infinite-domain" class="tool-input"><option value="Z">ℤ (enteros)</option><option value="N">ℕ (naturales)</option></select>
    <label for="logic-set-outer">Cuantificador exterior</label><select id="logic-set-outer" class="tool-input"><option value="forall">∀x</option><option value="exists">∃x</option></select>
    <label for="logic-set-inner">Cuantificador interior</label><select id="logic-set-inner" class="tool-input"><option value="exists">∃y</option><option value="forall">∀y</option></select>
    <label for="logic-set-n">|A| para conteo</label><input id="logic-set-n" class="tool-input" type="number" min="0" max="40" value="2">
    <label for="logic-set-m">|B| para conteo</label><input id="logic-set-m" class="tool-input" type="number" min="0" max="40" value="3">
    <label for="logic-set-a">A o dominio (elementos separados por comas)</label><input id="logic-set-a" class="tool-input" type="text" value="1, 2, 3, 4, 5">
    <label for="logic-set-b">B</label><input id="logic-set-b" class="tool-input" type="text" value="4, 5, 6, 7">
    <label for="logic-set-pairs">Pares de R (uno por línea: a,b)</label><textarea id="logic-set-pairs" class="tool-textarea" rows="4">1,1\n1,2\n2,3</textarea>`},
  propositions:{title:'Proposiciones y argumentos',description:'Genera tablas de verdad o comprueba inferencias mediante todas las asignaciones (hasta seis variables).',action:'logicCalculateProposition',controls:`
    <label for="logic-prop-mode">Operación</label><select id="logic-prop-mode" class="tool-input"><option value="table">Tabla de verdad</option><option value="argument">Validez de argumento</option><option value="proof">Prueba guiada por casos</option><option value="forms">FNC y FND canónicas</option><option value="induction">Inducción guiada</option></select>
    <label for="logic-prop-induction">Identidad para inducción</label><select id="logic-prop-induction" class="tool-input"><option value="natural">1+…+n</option><option value="squares">1²+…+n²</option><option value="cubes">1³+…+n³</option><option value="power2">3ⁿ−1 divisible por 2</option><option value="power7">7ⁿ−1 divisible por 6</option><option value="odds">Suma de impares = n²</option><option value="factorial">n! &gt; 2ⁿ desde n=4</option></select>
    <label for="logic-prop-n">Ejemplo con n</label><input id="logic-prop-n" class="tool-input" type="number" min="1" max="1000" value="10">
    <label for="logic-prop-expression">Expresión</label><input id="logic-prop-expression" class="tool-input" type="text" value="(p→q)↔(¬p∨q)">
    <label for="logic-prop-premises">Premisas, una por línea</label><textarea id="logic-prop-premises" class="tool-textarea" rows="3">p→q\nq→r\n¬r</textarea>
    <label for="logic-prop-conclusion">Conclusión</label><input id="logic-prop-conclusion" class="tool-input" type="text" value="¬p">`},
  boolean:{title:'Simplificación booleana',description:'Encuentra una suma mínima de productos con minitérminos y condiciones indiferentes, hasta cuatro variables.',action:'logicCalculateBoolean',controls:`
    <label for="logic-bool-mode">Vista</label><select id="logic-bool-mode" class="tool-input"><option value="minimal">Implicantes</option><option value="karnaugh">Mapa de Karnaugh</option><option value="nand">Red de compuertas NAND</option></select>
    <label for="logic-bool-names">Variables en orden</label><input id="logic-bool-names" class="tool-input" type="text" value="A, B, C">
    <label for="logic-bool-minterms">Minitérminos Σm</label><input id="logic-bool-minterms" class="tool-input" type="text" value="1, 3, 5, 6, 7">
    <label for="logic-bool-dontcare">Indiferentes d (opcional)</label><input id="logic-bool-dontcare" class="tool-input" type="text" value="">`},
  graphs:{title:'Grafos y árboles',description:'Analiza aristas y recorre paso a paso caminos, árboles mínimos, flujos, grados y códigos.',action:'logicCalculateGraph',controls:`
    <label for="logic-graph-mode">Algoritmo</label><select id="logic-graph-mode" class="tool-input"><option value="summary">Matriz, grados y Euler</option><option value="counts">Conteos de grafos y árboles</option><option value="bfs">BFS</option><option value="dfs">DFS</option><option value="dijkstra">Dijkstra</option><option value="kruskal">Kruskal</option><option value="flow">Flujo máximo y corte</option><option value="havel">Havel-Hakimi</option><option value="huffman">Huffman</option><option value="tree">Recorridos de árbol binario</option><option value="matching">Emparejamiento bipartito</option><option value="petri">Red de Petri acotada</option></select>
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

function read(id) {return document.getElementById(id).value.trim();}
function integer(id) {
  const raw=read(id);
  if (!/^-?\d+$/.test(raw)) throw new RangeError(`${id}: introduce un entero`);
  return Number(raw);
}
function bigIntegerFromBase(id,radix) {
  const value=parseBaseNumber(read(id),radix);
  if (value.denominator!==1n) throw new RangeError('Las operaciones de palabra requieren enteros');
  return value.numerator;
}
function items(id) {return read(id).split(/[,\s]+/).filter(Boolean);}
function ints(id) {
  const raw=read(id);
  if (!raw) return [];
  const values=raw.split(/[,\s]+/).filter(Boolean);
  if (values.some(value=>!/^\d+$/.test(value))) throw new RangeError(`${id}: usa enteros no negativos`);
  return values.map(Number);
}
function graphEdges() {
  const lines=read('logic-graph-edges').split(/[;\n]+/).map(line=>line.trim()).filter(Boolean);
  return lines.map((line,index)=>{
    const parts=line.split(/[,\s]+/).filter(Boolean);
    if (parts.length<2||parts.length>3||parts.slice(0,2).some(name=>!/^[A-Za-z0-9_]+$/.test(name))
      || parts.length===3&&(!Number.isFinite(Number(parts[2]))||Number(parts[2])<0)) {
      throw new RangeError(`Arista ${index+1}: usa origen destino peso no negativo`);
    }
    return [parts[0],parts[1],...(parts.length===3?[Number(parts[2])]:[])];
  });
}
const list=values=>`{${values.map(escapeHtml).join(', ')}}`;
const table=(heads,body)=>`<div class="num-table-wrap"><table class="num-table"><thead><tr>${heads.map(head=>`<th>${escapeHtml(head)}</th>`).join('')}</tr></thead><tbody>${body.map(row=>`<tr>${row.map(value=>`<td>${escapeHtml(value)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
function show(title,html) {
  const target=document.getElementById('logic-result');
  target.classList.remove('tool-error');
  target.innerHTML=`<div class="tool-result-title">${title}</div>${html}`;
}
function fail(error) {
  const target=document.getElementById('logic-result');
  target.textContent=error.message;
  target.classList.add('tool-error');
}

export function logicOpenPanel(id) {
  const config=panels[id];
  if (!config) return;
  document.getElementById('logic-title').textContent=config.title;
  document.getElementById('logic-heading').textContent=config.title;
  document.getElementById('logic-description').textContent=config.description;
  document.getElementById('logic-content').innerHTML=`<div class="num-controls">${config.controls}</div><div class="tool-actions"><button class="tool-button" data-action="${config.action}">Calcular</button></div><div id="logic-result" class="tool-result" aria-live="polite"></div>`;
}

export function logicCalculateBases() {
  try {
    const mode=read('logic-base-mode'),from=integer('logic-base-from'),width=integer('logic-base-width');
    if (mode==='convert') {
      const result=convertBase(read('logic-base-a'),from,integer('logic-base-to'));
      show('Conversión de base',`<p>${escapeHtml(read('logic-base-a'))} en base ${from} = ${escapeHtml(result.text)} en base ${result.toBase}.</p><p>Estado: ${result.status}${result.repeatingAt===null?'':`; período desde la cifra ${result.repeatingAt+1}`}.</p>`);
    } else if (mode==='arithmetic') {
      const result=baseArithmetic(read('logic-base-a'),read('logic-base-b'),from,read('logic-base-op'));
      show('Aritmética posicional',`<p>Resultado en base ${from}: ${escapeHtml(result.result)}${result.remainder===null?'':`; residuo = ${escapeHtml(result.remainder)}`}.</p><p>Resultado decimal: ${result.decimal}.</p>`);
    } else if (mode==='twos') {
      const result=twosComplement(bigIntegerFromBase('logic-base-a',from),width);
      show('Complemento a dos',`<p>${result.value} = ${result.bits} en ${width} bits con signo.</p>`);
    } else if (mode==='add') {
      const result=signedBinaryAddition(bigIntegerFromBase('logic-base-a',from),bigIntegerFromBase('logic-base-b',from),width);
      show('Suma con signo',`<p>${result.first} + ${result.second} = ${result.bits} (valor con signo ${result.signed}).</p><p>Desbordamiento: ${result.overflow?'sí':'no'}; suma matemática = ${result.exact}.</p>`);
    } else if (mode==='bits') {
      const result=bitwiseWord(bigIntegerFromBase('logic-base-a',from),bigIntegerFromBase('logic-base-b',from),width);
      show('Operaciones bit a bit',table(['AND','OR','XOR','NOT primero'],[[result.and,result.or,result.xor,result.notFirst]]));
    } else throw new RangeError('Operación inválida');
  } catch(error) {fail(error);}
}

export function logicCalculateSets() {
  try {
    const domain=items('logic-set-a');
    const mode=read('logic-set-mode');
    if (mode==='integers') {
      const result=integerQuantifierExample(read('logic-set-infinite-domain'));
      show('Cuantificadores sobre conjuntos infinitos',`<p>${escapeHtml(result.convention)}</p>`+
        table(['Enunciado','Valor','Testigo o contraejemplo'],result.rows.map(row=>[row.statement,row.truth?'Verdadero':'Falso',row.reason]))+
        '<p class="tool-note">Son pruebas de este predicado concreto x+y=0, no una enumeración del conjunto infinito.</p>');
    } else if (mode==='sets') {
      const result=finiteSetOperations(domain,items('logic-set-b'));
      show('Operaciones de conjuntos',`<p>A∪B = ${list(result.union)}; A∩B = ${list(result.intersection)}.</p><p>A−B = ${list(result.difference)}; A△B = ${list(result.symmetricDifference)}.</p>`);
    } else if(mode==='count') {
      const result=finiteCounting(integer('logic-set-n'),integer('logic-set-m'));
      show('Conteo finito',`<p>Funciones A→B = ${result.functions}; inyectivas = ${result.injective}; sobreyectivas = ${result.surjective}.</p><p>Relaciones en A×B = ${result.relations}; subconjuntos de A = ${result.subsets}. ${result.assumption}.</p>`);
    } else {
      const pairs=read('logic-set-pairs').split(/[;\n]+/).map(line=>line.trim()).filter(Boolean).map(line=>{
        const parts=line.split(/[,\s]+/).filter(Boolean);
        if (parts.length!==2) throw new RangeError('Cada par debe tener dos elementos');
        return parts;
      });
      if(mode==='quantified') {
        const result=quantifiedRelation(domain,pairs,read('logic-set-outer'),read('logic-set-inner'));
        show('Cuantificadores finitos',`<p>${result.statement}: ${result.result?'verdadero':'falso'} sobre U=${list(domain)}.</p>
          <p>${result.decisive?`Caso decisivo: x=${escapeHtml(result.decisive.x)}${result.decisive.witness===null?'':`, y=${escapeHtml(result.decisive.witness)}`}.`:'Comprueba cada fila del universo.'}</p>`+
          table(['x','Valor interno','Testigo/contraejemplo y'],result.rows.map(row=>[row.x,row.result?'V':'F',row.witness??'—'])));
        return;
      }
      const result=relationProperties(domain,pairs);
      show('Relación finita',`<p>Dominio observado = ${list([...new Set(pairs.map(pair=>pair[0]))])}; rango = ${list(result.range)}.</p>
        <p>Reflexiva: ${result.reflexive?'sí':'no'}; simétrica: ${result.symmetric?'sí':'no'}; transitiva: ${result.transitive?'sí':'no'}.</p>
        <p>${result.equivalence?`Clases: ${result.classes.map(list).join(', ')}.`:'No es relación de equivalencia.'}</p>`+
        table(['',...domain],result.matrix.map((row,i)=>[domain[i],...row])));
    }
  } catch(error) {fail(error);}
}

export function logicCalculateProposition() {
  try {
    const mode=read('logic-prop-mode');
    if (mode==='table') {
      const expression=read('logic-prop-expression'), result=truthTable(expression);
      show('Tabla de verdad',`<p>${escapeHtml(expression)}: ${result.status}; ${result.rows.length} asignaciones.</p>`+
        table([...result.variables,'Resultado'],result.rows.map(row=>[...result.variables.map(variable=>row.values[variable]?'V':'F'),row.result?'V':'F'])));
    } else if(mode==='forms') {
      const result=normalForms(read('logic-prop-expression'));
      show('Formas normales canónicas',`<p>Minitérminos: ${result.minterms.join(', ')||'ninguno'}; maxitérminos: ${result.maxterms.join(', ')||'ninguno'}.</p>
        <p>FND = ${escapeHtml(result.dnf)}.</p><p>FNC = ${escapeHtml(result.cnf)}.</p>`);
    } else if(mode==='induction') {
      const kind=read('logic-prop-induction'),n=integer('logic-prop-n');
      if(['natural','squares','cubes'].includes(kind)) {
        const result=inductionSum(kind,n);
        show('Inducción matemática',`<p>Caso base n=1: izquierda ${result.base.left}, derecha ${result.base.right}.</p>
          <p>${escapeHtml(result.inductionStep)}</p><p>Ejemplo n=${result.n}: suma directa ${result.value}, fórmula ${result.closedForm}.</p><p>${result.warning}</p>`);
      } else {
        const result=guidedInduction(kind,n);
        show('Inducción matemática',`<p>${escapeHtml(result.statement)}.</p><p>Caso base: ${escapeHtml(result.base)}</p>
          <p>Paso inductivo: ${escapeHtml(result.step)}</p><p>${escapeHtml(result.example)}</p>
          <p class="tool-note">El ejemplo numérico ilustra la identidad; la prueba está en el caso base y el paso inductivo.</p>`);
      }
    } else if(mode==='proof') {
      const result=guidedDisjunctionProof();
      show('Prueba formal guiada',`<p>${result.premises.map(escapeHtml).join(', ')} ⊢ ${escapeHtml(result.conclusion)}. ${result.valid?'La tabla de verdad confirma la validez.':'La tabla de verdad encontró un contraejemplo.'}</p>`+
        table(['Paso','Fórmula','Justificación'],result.steps)+
        '<p class="tool-note">Ejemplo fijo de eliminación de la disyunción; cada supuesto se descarga en el paso 10.</p>');
    } else {
      const premises=read('logic-prop-premises').split(/[;\n]+/).map(line=>line.trim()).filter(Boolean);
      const result=argumentValidity(premises,read('logic-prop-conclusion'));
      show('Validez del argumento',`<p>${result.valid?'Válido: ninguna asignación hace verdaderas las premisas y falsa la conclusión.':`Inválido: contraejemplo ${result.variables.map(variable=>`${escapeHtml(variable)}=${result.counterexample[variable]?'V':'F'}`).join(', ')}.`}</p>`);
    }
  } catch(error) {fail(error);}
}

export function logicCalculateBoolean() {
  try {
    const names=items('logic-bool-names'),minterms=ints('logic-bool-minterms'),dontCares=ints('logic-bool-dontcare');
    const mode=read('logic-bool-mode');
    if(mode==='karnaugh') {
      const result=karnaughMap(names,minterms,dontCares);
      show('Mapa de Karnaugh',`<p>Filas y columnas en código Gray; X = indiferente. F = ${escapeHtml(result.expression)}.</p>`+
        table(['',...result.columns],result.cells.map((row,i)=>[result.rows[i],...row.map(cell=>`${cell.value} (m${cell.index})`)])));
      return;
    }
    if(mode==='nand') {
      const result=nandNetwork(names,minterms,dontCares);
      show('Realización NAND',`<p>F = ${escapeHtml(result.expression)}; salida = ${escapeHtml(result.output)}. NAND(x,x) invierte x.</p>`+
        table(['Salida','Entradas','Compuerta'],result.gates.map(gate=>[gate.output,gate.inputs.join(', '),gate.operation])));
      return;
    }
    const result=minimizeBoolean(names,minterms,dontCares);
    show('Suma mínima de productos',`<p>F = ${escapeHtml(result.expression)}.</p>`+
      table(['Implicante','Minitérminos cubiertos'],result.implicants.map(item=>[item.pattern,item.covers.join(', ')])));
  } catch(error) {fail(error);}
}

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
    if (mode==='summary') {
      const result=graphSummary(edges,directed);
      show('Grafo',`<p>Vértices: ${list(result.vertices)}; aristas: ${result.edgeCount}; estado euleriano: ${result.euler}.</p>`+
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
