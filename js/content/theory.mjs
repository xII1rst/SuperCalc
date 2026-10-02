// Fichas teóricas por unidad del temario (UPC) y mapa de cobertura de cada subtema.
// Sin DOM: la pantalla «Fichas teóricas» las presenta y un guion genera el mapa de cobertura.
//
// Estado de cada subtema:
//   C = cubierto (una herramienta lo calcula con pasos)
//   P = parcial (la herramienta cubre familias declaradas, no el tema completo)
//   F = ficha (se explica aquí; no hay calculadora específica)
//   N = pendiente (ni herramienta ni ficha suficiente)

export { ROUTES } from './theory/helpers.mjs';
import { diferencial } from './theory/diferencial.mjs';
import { integral } from './theory/integral.mjs';
import { multivariable } from './theory/multivariable.mjs';
import { edo } from './theory/edo.mjs';
import { lineal } from './theory/lineal.mjs';
import { numerico } from './theory/numerico.mjs';
import { logica } from './theory/logica.mjs';
import { em } from './theory/em.mjs';
import { mecanica } from './theory/mecanica.mjs';
import { ondas } from './theory/ondas.mjs';

export const THEORY = [diferencial, integral, multivariable, edo, lineal, numerico, logica, em, mecanica, ondas];

export const STATUS = { C: 'Cubierto', P: 'Parcial', F: 'Ficha', N: 'Pendiente' };
export const CARD_KINDS = ['Definición', 'Teorema', 'Fórmula', 'Regla', 'Criterio', 'Método', 'Ejemplo', 'Contraejemplo', 'Error frecuente'];

// Conteo de subtemas por estado, para una materia o para todo el temario.
export function coverageCounts(subjects = THEORY) {
  const counts = { C: 0, P: 0, F: 0, N: 0, total: 0 };
  for (const subject of subjects) for (const unit of subject.units) for (const topic of unit.topics) {
    counts[topic.status]++;
    counts.total++;
  }
  return counts;
}
