// Motor de integración simbólica sobre el AST compartido de calculus.mjs.
// Sin DOM ni navegador. Cubre: regla de la potencia, tabla básica, sustitución u,
// por partes, integrales trigonométricas, fracciones parciales y formas cuadráticas
// (sustitución trigonométrica). Devuelve la antiderivada como cadena legible.

export { prettyCoeff } from './integration/format.mjs';
export { partialFractions } from './integration/partial-fractions.mjs';
export { integrate } from './integration/engine.mjs';
export { improperIntegral } from './integration/improper.mjs';
export { definiteIntegral } from './integration/definite.mjs';
export { polynomialRevolutionEvaluation } from './integration/revolution.mjs';
