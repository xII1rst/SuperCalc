// SuperCalc v1.0.0 — Application Logic
import * as matrixUI from './js/ui/algebra/matrix.mjs';
import * as ineqUI from './js/ui/algebra/inequalities.mjs';
import * as functionsUI from './js/ui/algebra/functions.mjs';
import * as sequencesUI from './js/ui/algebra/sequences.mjs';
import * as calculusUI from './js/ui/calculus.mjs';
import * as emUI from './js/ui/electromagnetism.mjs';
import * as vectorsUI from './js/ui/algebra/vectors.mjs';
import { createNavigation } from './js/ui/navigation.mjs';
import { createFigureControls } from './js/ui/figure-controls.mjs';
import * as plotter from './js/ui/plotter.mjs';
import './js/ui/branding.mjs';
import { installApp, dismissInstall, reloadApp } from './js/offline.mjs';
import { bindActions } from './js/ui/events.mjs';
import { initTheme, toggleTheme } from './js/ui/theme.mjs';
import { redrawAnalysisCanvases } from './js/graphics/analysis.mjs';

// Las acciones del HTML se resuelven dentro del módulo, sin publicar manejadores en window.
const figureControls = createFigureControls({ draw: vectorsUI.draw, emDraw: emUI.emDraw });
vectorsUI.attachFigureControls(figureControls);
const navigation = createNavigation({
  initVectorsApp: vectorsUI.initVectorsApp,
  emInit: emUI.emInit, emResizeCanvas: emUI.emResizeCanvas,
  calcInit: calculusUI.calcInit,
  fnBack: functionsUI.fnBack, seqSetMode: sequencesUI.seqSetMode,
});
export const actions = {
  ...navigation,
  ...matrixUI,
  ...ineqUI,
  ...functionsUI,
  ...sequencesUI,
  ...calculusUI,
  ...emUI,
  ...vectorsUI,
  ...plotter,
  ...figureControls,
  installApp, dismissInstall, reloadApp, toggleTheme,
};
bindActions(document,actions);
document.addEventListener('supercalc:themechange', () => {
  if (document.getElementById('app')?.style.display === 'flex') vectorsUI.draw();
  if (document.getElementById('em-app')?.classList.contains('visible')) emUI.emDraw();
  plotter.grafUpdate();
  redrawAnalysisCanvases();
});
initTheme();
