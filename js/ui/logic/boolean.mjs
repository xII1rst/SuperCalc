import { booleanMinterms, karnaughMap, nandNetwork, norNetwork } from '../../math/logic-advanced.mjs';
import { escapeHtml, fail, ints, items, read, show, table } from './inputs.mjs';
import { minimizeBoolean } from '../../math/logic.mjs';
import { renderLogicGraph } from '../../graphics/logic-graph.mjs';

export function logicCalculateBoolean() {
  try {
    const names=items('logic-bool-names'),source=read('logic-bool-source');
    const minterms=booleanMinterms(names,['maxterms','formula'].includes(source)?source:'minterms',source==='formula'?[]:ints('logic-bool-minterms'),read('logic-bool-expression')),dontCares=ints('logic-bool-dontcare');
    const mode=read('logic-bool-mode');
    if(mode==='karnaugh') {
      const result=karnaughMap(names,minterms,dontCares);
      show('Mapa de Karnaugh',`<p>Filas y columnas en código Gray; X = indiferente. F = ${escapeHtml(result.expression)}.</p>`+
        table(['',...result.columns],result.cells.map((row,i)=>[result.rows[i],...row.map(cell=>`${cell.value} (m${cell.index}) ${cell.groups.join(', ')}`)]))+table(['Grupo','Patrón','Celdas (incluye X)'],result.groups.map(group=>[group.name,group.pattern,group.indices.join(', ')])));
      return;
    }
    if(mode==='nand'||mode==='nor') {
      const result=mode==='nand'?nandNetwork(names,minterms,dontCares):norNetwork(names,minterms,dontCares);
      const gateName=mode.toUpperCase();
      show(`Realización ${gateName}`,`<p>F = ${escapeHtml(result.expression)}; salida = ${escapeHtml(result.output)}. ${gateName}(x,x) invierte x; compuertas = ${result.gates.length}.</p><p>Se comparten inversores. El número cuenta compuertas con las entradas indicadas; constantes y cables no cuentan. Σm = ${minterms.join(', ')}.</p>`+
        renderLogicGraph(result.gates.flatMap(gate=>gate.inputs.map(input=>[input,gate.output,gate.operation])),{directed:true,vertices:names,title:`Red de ${gateName}: conexiones`,caption:`Cada nodo nᵢ aplica ${gateName} a sus entradas; salida ${result.output}.`})+
        table(['Salida','Entradas','Compuerta'],result.gates.map(gate=>[gate.output,gate.inputs.join(', '),gate.operation])));
      return;
    }
    const result=minimizeBoolean(names,minterms,dontCares);
    show('Suma mínima de productos',`<p>F = ${escapeHtml(result.expression)}.</p>`+
      table(['Implicante','Minitérminos cubiertos'],result.implicants.map(item=>[item.pattern,item.covers.join(', ')])));
  } catch(error) {fail(error);}
}

export const panels={
  boolean:{title:'Simplificación booleana',description:'Encuentra una suma mínima de productos con minitérminos y condiciones indiferentes, hasta cuatro variables.',action:'logicCalculateBoolean',controls:`
    <label for="logic-bool-mode">Vista</label><select id="logic-bool-mode" class="tool-input"><option value="minimal">Implicantes</option><option value="karnaugh">Mapa de Karnaugh</option><option value="nand">Red de compuertas NAND</option><option value="nor">Red de compuertas NOR</option></select>
    <label for="logic-bool-source">Entrada</label><select id="logic-bool-source" class="tool-input"><option value="minterms">Σm: minitérminos</option><option value="maxterms">ΠM: maxitérminos</option><option value="formula">Fórmula proposicional</option></select>
    <label for="logic-bool-expression">Fórmula (∧,∨,¬ o apóstrofe)</label><input id="logic-bool-expression" class="tool-input" value="(A∨B)∧(¬A∨C)">
    <label for="logic-bool-names">Variables en orden</label><input id="logic-bool-names" class="tool-input" type="text" value="A, B, C">
    <label for="logic-bool-minterms">Índices Σm o ΠM según entrada</label><input id="logic-bool-minterms" class="tool-input" type="text" value="1, 3, 5, 6, 7">
    <label for="logic-bool-dontcare">Indiferentes d (opcional)</label><input id="logic-bool-dontcare" class="tool-input" type="text" value="">`},
};
