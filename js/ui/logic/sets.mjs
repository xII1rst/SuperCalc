import { affinePowerComposition, finiteCounting, integerQuantifierExample, quantifiedPredicate, quantifiedRelation, setCardinality } from '../../math/logic-advanced.mjs';
import { escapeHtml, fail, integer, ints, items, list, read, show, table } from './inputs.mjs';
import { finiteSetOperations, relationProperties } from '../../math/logic.mjs';

export function logicCalculateSets() {
  try {
    const domain=items('logic-set-a');
    const mode=read('logic-set-mode');
    if(mode==='cardinality'){
      const result=setCardinality(ints('logic-set-sizes'),ints('logic-set-intersections'),integer('logic-set-triple'),read('logic-set-universe')?integer('logic-set-universe'):null);
      show('Cardinalidades',`<p>${result.formula}. Unión = ${result.union}; complemento = ${result.complement===null?'universo no dado':result.complement}.</p><p>Regiones disjuntas verificadas: ${result.atoms.join(', ')}.</p>`);return;
    }
    if(mode==='predicate'){
      const universe=domain.map(Number);if(domain.some(x=>x===''||!Number.isFinite(Number(x))))throw new RangeError('Universo numérico requerido');
      const result=quantifiedPredicate(universe,read('logic-set-predicate'));
      show('Predicado en universo finito',`<p>U=${list(domain)}; P(x)=${escapeHtml(read('logic-set-predicate'))}.</p><p>∀x P(x): ${result.universal?'verdadero':'falso'}; ∃x P(x): ${result.existential?'verdadero':'falso'}.</p><p>Testigo: ${result.witness??'ninguno'}; contraejemplo: ${result.counterexample??'ninguno'}. ${result.negations}</p>`+table(['x','Izquierda','Derecha','P(x)'],result.rows.map(r=>[r.x,r.left,r.right,r.truth?'V':'F'])));return;
    }
    if(mode==='composition'){
      const numeric=id=>{const raw=read(id);if(!raw||!Number.isFinite(Number(raw)))throw new RangeError('Coeficiente finito requerido');return Number(raw);};
      const result=affinePowerComposition(numeric('logic-set-slope'),numeric('logic-set-intercept'),integer('logic-set-power'));
      show('Composición e inversa',`<p>g∘f = ${escapeHtml(result.gAfterF)}; f∘g = ${escapeHtml(result.fAfterG)}; f⁻¹ = ${escapeHtml(result.inverse)}.</p><p>${result.proof}</p>`);return;
    }
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
      show('Conteo finito',`<p>Funciones A→B = ${result.functions}; inyectivas = ${result.injective}; sobreyectivas = ${result.surjective}.</p><p>Relaciones en A×B = ${result.relations}; subconjuntos de A = ${result.subsets}; |A×B| = ${result.cartesianSize}.</p><p>Relaciones binarias en A = ${result.binaryRelations}; reflexivas = ${result.reflexiveRelations}; simétricas = ${result.symmetricRelations}; equivalencias = ${result.equivalenceRelations}. ${result.assumption}.</p>`);
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
        table(['',...domain],result.matrix.map((row,i)=>[domain[i],...row]))+table(['Propiedad fallida','Contraejemplo'],Object.entries(result.counterexamples).filter(([,value])=>value!==null).map(([key,value])=>[key,list(value)])));
    }
  } catch(error) {fail(error);}
}

export const panels={
  sets:{title:'Conjuntos y relaciones',description:'Calcula operaciones de conjuntos finitos y prueba reflexividad, simetría y transitividad de una relación.',action:'logicCalculateSets',controls:`
    <label for="logic-set-mode">Operación</label><select id="logic-set-mode" class="tool-input"><option value="cardinality">Cardinalidades e inclusión-exclusión</option><option value="predicate">Predicado en universo finito</option><option value="composition">Composición e inversa: ax+b y xⁿ</option><option value="sets">Dos conjuntos</option><option value="relation">Relación finita</option><option value="quantified">Cuantificadores sobre R(x,y)</option><option value="integers">Ejemplo x+y=0 sobre ℤ o ℕ</option><option value="count">Conteo de funciones y relaciones</option></select>
    <label for="logic-set-sizes">Cardinalidades A,B o A,B,C</label><input id="logic-set-sizes" class="tool-input" value="30,25">
    <label for="logic-set-intersections">Intersecciones AB o AB,AC,BC</label><input id="logic-set-intersections" class="tool-input" value="10">
    <label for="logic-set-triple">Intersección ABC (0 para dos conjuntos)</label><input id="logic-set-triple" class="tool-input" type="number" min="0" value="0">
    <label for="logic-set-universe">Cardinalidad del universo (opcional)</label><input id="logic-set-universe" class="tool-input" type="text" value="60">
    <label for="logic-set-predicate">P(x), comparación en x</label><input id="logic-set-predicate" class="tool-input" value="x^2&lt;10">
    <label for="logic-set-slope">a en f(x)=ax+b</label><input id="logic-set-slope" class="tool-input" type="number" step="any" value="2">
    <label for="logic-set-intercept">b</label><input id="logic-set-intercept" class="tool-input" type="number" step="any" value="1">
    <label for="logic-set-power">n en g(x)=xⁿ</label><input id="logic-set-power" class="tool-input" type="number" value="2">
    <label for="logic-set-infinite-domain">Dominio del ejemplo</label><select id="logic-set-infinite-domain" class="tool-input"><option value="Z">ℤ (enteros)</option><option value="N">ℕ (naturales)</option></select>
    <label for="logic-set-outer">Cuantificador exterior</label><select id="logic-set-outer" class="tool-input"><option value="forall">∀x</option><option value="exists">∃x</option></select>
    <label for="logic-set-inner">Cuantificador interior</label><select id="logic-set-inner" class="tool-input"><option value="exists">∃y</option><option value="forall">∀y</option></select>
    <label for="logic-set-n">|A| para conteo</label><input id="logic-set-n" class="tool-input" type="number" min="0" max="40" value="2">
    <label for="logic-set-m">|B| para conteo</label><input id="logic-set-m" class="tool-input" type="number" min="0" max="40" value="3">
    <label for="logic-set-a">A o dominio (elementos separados por comas)</label><input id="logic-set-a" class="tool-input" type="text" value="1, 2, 3, 4, 5">
    <label for="logic-set-b">B</label><input id="logic-set-b" class="tool-input" type="text" value="4, 5, 6, 7">
    <label for="logic-set-pairs">Pares de R (uno por línea: a,b)</label><textarea id="logic-set-pairs" class="tool-textarea" rows="4">1,1\n1,2\n2,3</textarea>`},
};
