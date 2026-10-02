import * as calculus from '../js/math/calculus.mjs';
import * as expression from '../js/math/expression.mjs';
import { goldenSuite } from './helpers/golden.mjs';

goldenSuite({
  label: 'cálculo',
  module: calculus,
  fixtureUrl: new URL('./fixtures/golden/calculus.json', import.meta.url),
  reexports: { calcParse: expression, collectVariables: expression, normalizeExpression: expression },
  exportCount: 38,
});
