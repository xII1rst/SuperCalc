import { argumentValidity, truthTable } from '../../math/logic.mjs';
import { escapeHtml, fail, integer, read, show, table } from './inputs.mjs';
import { guidedDisjunctionProof, guidedInduction, guidedNegations, inductionSum, normalForms } from '../../math/logic-advanced.mjs';

export function logicCalculateProposition() {
  try {
    const mode=read('logic-prop-mode');
    if(mode==='negations'){
      const result=guidedNegations();show('Negaciones y alcance',`<p>${result.deMorgan}</p><p>${result.negationOfNegatedConjunction}</p><p>${escapeHtml(result.quantified)}</p><p>${result.proof}</p>`);return;
    }
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

export const panels={
  propositions:{title:'Proposiciones y argumentos',description:'Genera tablas de verdad o comprueba inferencias mediante todas las asignaciones (hasta seis variables).',action:'logicCalculateProposition',controls:`
    <label for="logic-prop-mode">Operación</label><select id="logic-prop-mode" class="tool-input"><option value="negations">De Morgan y negación de cuantificadores</option><option value="table">Tabla de verdad</option><option value="argument">Validez de argumento</option><option value="proof">Prueba guiada por casos</option><option value="forms">FNC y FND canónicas</option><option value="induction">Inducción guiada</option></select>
    <label for="logic-prop-induction">Identidad para inducción</label><select id="logic-prop-induction" class="tool-input"><option value="natural">1+…+n</option><option value="squares">1²+…+n²</option><option value="cubes">1³+…+n³</option><option value="power2">3ⁿ−1 divisible por 2</option><option value="power7">7ⁿ−1 divisible por 6</option><option value="odds">Suma de impares = n²</option><option value="factorial">n! &gt; 2ⁿ desde n=4</option></select>
    <label for="logic-prop-n">Ejemplo con n</label><input id="logic-prop-n" class="tool-input" type="number" min="1" max="1000" value="10">
    <label for="logic-prop-expression">Expresión</label><input id="logic-prop-expression" class="tool-input" type="text" value="(p→q)↔(¬p∨q)">
    <label for="logic-prop-premises">Premisas, una por línea</label><textarea id="logic-prop-premises" class="tool-textarea" rows="3">p→q\nq→r\n¬r</textarea>
    <label for="logic-prop-conclusion">Conclusión</label><input id="logic-prop-conclusion" class="tool-input" type="text" value="¬p">`},
};
