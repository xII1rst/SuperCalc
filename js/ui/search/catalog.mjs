import { SUBMOD_CONFIG, cardsOf } from '../navigation/catalog.mjs';
import { modes as differential } from '../study/differential.mjs';
import { modes as integral } from '../study/integral.mjs';
import { modes as multivariable } from '../study/multivariable.mjs';
import { modes as ode } from '../study/ode.mjs';
import { modes as electrostatics } from '../electromagnetism/electrostatics.mjs';
import { modes as circuits } from '../electromagnetism/circuits.mjs';
import { modes as magnetism } from '../electromagnetism/magnetism.mjs';
import { modes as forces } from '../mechanics/forces.mjs';
import { modes as motion } from '../mechanics/motion.mjs';
import { modes as collisions } from '../mechanics/collisions.mjs';
import { modes as rotation } from '../mechanics/rotation.mjs';
import { modes as oscillations } from '../waves/oscillations.mjs';
import { modes as mechanical } from '../waves/mechanical.mjs';
import { modes as optics } from '../waves/optics.mjs';

const plainText = value => value.replace(/<[^>]*>/g, '');
const physics = new Set(['fi', 'em', 'mech', 'waves']);
const keywords = {
  stats: 'media mediana moda varianza desviación estándar percentiles mean median variance',
  mat: 'matrix determinant inverse eigenvalues determinante inversa autovalores',
  'calc-graf': 'plot graph graficar función',
  'calc-dif': 'derivative limit derivar derivada límite',
  'calc-int': 'integrate antiderivative integral integration',
  'num-ode': 'Runge Kutta RK4 RK2 Euler Adams Bashforth',
  'num-quadrature': 'trapecio Simpson integración numérica',
  'mech-motion': 'MRU MRUA velocidad aceleración',
  'mech-projectile': 'projectile lanzamiento parábola',
  'prob-coin': 'moneda binomial coin',
  'exp-pi': 'pi dígitos cifras decimales',
};

export const defaultToolIds = ['calc-dif', 'calc-int', 'mat', 'vectors', 'stats', 'num-roots', 'mech-projectile', 'prob-coin'];

// Los nombres, descripciones y destinos vienen del menú y de los registros reales.
export function buildToolCatalog() {
  const entries = [];
  for (const parent of Object.keys(SUBMOD_CONFIG)) {
    for (const card of cardsOf(parent)) {
      const subject = physics.has(parent) ? 'Física' : 'Matemáticas';
      const section = plainText(SUBMOD_CONFIG[parent].title);
      entries.push({
        id: card.id, title: card.name, description: card.desc,
        path: subject === section ? subject : `${subject} / ${section}`,
        route: `#/${parent}/${card.id}`, icon: card.icon,
        keywords: `${card.id.replaceAll('-', ' ')} ${keywords[card.id] || ''}`,
      });
    }
  }
  const families = [
    { prefix: 'study', select: 'study-mode', action: 'studySelect', modes: [differential, integral, multivariable, ode] },
    { prefix: 'emplus', select: 'emplus-mode', action: 'emPlusSelect', modes: [electrostatics, circuits, magnetism] },
    { prefix: 'mechplus', select: 'mechplus-mode', action: 'mechPlusSelect', modes: [forces, motion, collisions, rotation] },
    { prefix: 'waves', select: 'waves-mode', action: 'wavesSelect', modes: [oscillations, mechanical, optics] },
  ];
  for (const family of families) {
    for (const modes of family.modes) for (const [value, config] of Object.entries(modes)) {
      const [group, title, description] = Array.isArray(config) ? config : [config.group, config.name, ''];
      const owner = entries.find(entry => entry.id === `${family.prefix}-${group}`);
      entries.push({
        id: `${family.prefix}:${value}`, title, description: description || owner.description,
        path: `${owner.path} / ${owner.title}`, route: owner.route, icon: owner.icon,
        keywords: value.replace(/([a-z])([A-Z])/g, '$1 $2'),
        selection: { select: family.select, value, action: family.action },
      });
    }
  }
  return entries;
}
