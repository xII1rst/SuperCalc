import { baseArithmetic, bitwiseWord, convertBase, signedBinaryAddition, twosComplement } from '../../math/logic.mjs';
import { bigIntegerFromBase, escapeHtml, fail, integer, read, show, table } from './inputs.mjs';

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

export const panels={
  bases:{title:'Bases y bits',description:'Convierte enteros o fracciones, representa complemento a dos y opera palabras binarias de ancho fijo.',action:'logicCalculateBases',controls:`
    <label for="logic-base-mode">Operación</label><select id="logic-base-mode" class="tool-input"><option value="convert">Convertir base</option><option value="arithmetic">Aritmética posicional</option><option value="twos">Complemento a dos</option><option value="add">Suma con signo</option><option value="bits">AND, OR, XOR, NOT</option></select>
    <label for="logic-base-op">Aritmética</label><select id="logic-base-op" class="tool-input"><option value="add">Sumar</option><option value="subtract">Restar</option><option value="multiply">Multiplicar</option><option value="divide">Dividir con residuo</option></select>
    <label for="logic-base-a">Primer valor</label><input id="logic-base-a" class="tool-input" type="text" value="156">
    <label for="logic-base-b">Segundo valor (suma/bit a bit)</label><input id="logic-base-b" class="tool-input" type="text" value="0">
    <label for="logic-base-from">Base de entrada</label><input id="logic-base-from" class="tool-input" type="number" min="2" max="36" value="10">
    <label for="logic-base-to">Base de salida</label><input id="logic-base-to" class="tool-input" type="number" min="2" max="36" value="2">
    <label for="logic-base-width">Ancho de palabra (2–64)</label><input id="logic-base-width" class="tool-input" type="number" min="2" max="64" value="8">`},
};
