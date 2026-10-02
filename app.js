// SuperCalc v1.0 — Application Logic
import * as matrixUI from './js/ui/algebra/matrix.mjs';
import * as geometryUI from './js/ui/algebra/geometry.mjs';
import * as linearUI from './js/ui/algebra/linear-spaces.mjs';
import * as numericalUI from './js/ui/numerical-analysis.mjs';
import * as logicUI from './js/ui/logic.mjs';
import * as wavesUI from './js/ui/waves.mjs';
import * as ineqUI from './js/ui/algebra/inequalities.mjs';
import * as functionsUI from './js/ui/algebra/functions.mjs';
import * as sequencesUI from './js/ui/algebra/sequences.mjs';
import * as calculusUI from './js/ui/calculus.mjs';
import * as studyCalculusUI from './js/ui/study-calculus.mjs';
import * as emUI from './js/ui/electromagnetism.mjs';
import * as emAdvancedUI from './js/ui/electromagnetism-advanced.mjs';
import * as vectorsUI from './js/ui/algebra/vectors.mjs';
import * as statisticsUI from './js/ui/statistics.mjs';
import * as probabilityUI from './js/ui/probability.mjs';
import * as experimentsUI from './js/ui/experiments.mjs';
import * as mechanicsUI from './js/ui/mechanics.mjs';
import * as mechanicsAdvancedUI from './js/ui/mechanics-advanced.mjs';
import * as theoryUI from './js/ui/theory.mjs';
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
  emPlusOpenPanel: emAdvancedUI.emPlusOpenPanel,
  calcInit: calculusUI.calcInit,
  studyOpenPanel: studyCalculusUI.studyOpenPanel,
  geomInit: geometryUI.geomInit,
  linearInit: linearUI.linearInit,
  numOpenPanel: numericalUI.numOpenPanel,
  logicOpenPanel: logicUI.logicOpenPanel,
  wavesOpenPanel: wavesUI.wavesOpenPanel,
  fnBack: functionsUI.fnBack, seqSetMode: sequencesUI.seqSetMode,
  mechOpenPanel: mechanicsUI.mechOpenPanel,
  mechPlusOpenPanel: mechanicsAdvancedUI.mechPlusOpenPanel,
  probOpenPanel: probabilityUI.probOpenPanel,
  expOpenPanel: experimentsUI.expOpenPanel,
  theoryOpen: theoryUI.theoryOpen,
});
export const actions = {
  ...navigation,
  ...matrixUI,
  ...geometryUI,
  ...linearUI,
  ...numericalUI,
  ...logicUI,
  ...wavesUI,
  ...ineqUI,
  ...functionsUI,
  ...sequencesUI,
  ...calculusUI,
  ...studyCalculusUI,
  ...emUI,
  ...emAdvancedUI,
  ...vectorsUI,
  ...statisticsUI,
  ...probabilityUI,
  ...experimentsUI,
  ...mechanicsUI,
  ...mechanicsAdvancedUI,
  ...theoryUI,
  ...plotter,
  ...figureControls,
  installApp, dismissInstall, reloadApp, toggleTheme,
};
bindActions(document,actions);
mechanicsUI.mechInitialize();
document.addEventListener('supercalc:themechange', () => {
  if (document.getElementById('app')?.style.display === 'flex') vectorsUI.draw();
  if (document.getElementById('em-app')?.classList.contains('visible')) emUI.emDraw();
  plotter.grafUpdate();
  redrawAnalysisCanvases();
  mechanicsUI.mechRedrawTrajectory();
  wavesUI.wavesRedraw();
});
initTheme();
