import * as integration from '../js/math/integration.mjs';
import { goldenSuite } from './helpers/golden.mjs';

goldenSuite({
  label: 'integración',
  module: integration,
  fixtureUrl: new URL('./fixtures/golden/integration.json', import.meta.url),
  exportCount: 6,
});
