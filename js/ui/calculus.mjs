import { buildKB, initEnterKey, initInputTracking } from './calculus/keyboard.mjs';
import { calcTab } from './calculus/cards.mjs';
import { initLivePreviews } from './calculus/previews.mjs';
export { kbInsert } from './calculus/keyboard.mjs';
export { previewCalcExpression, calcTab, toggleCard, clearCard } from './calculus/cards.mjs';
export { calcLimit, calcLimitOp, toggleLimOp, calcDerivative, calcImplicit, calcAnalysis } from './calculus/differential.mjs';
export { toggleApps, setApp, clearAppResult, appOptimize, appGrowth, appMotion, appTangent, appRelated, appNewton, appMVT, appContinuity, appHyperbolic } from './calculus/applications.mjs';
export { calcIntegralIndef, calcIntegralDef, calcIntegralNumeric, calcIntegrateCAS, calcIntegralApp } from './calculus/integral.mjs';
export { calcTaylor, seriesTypeChanged, calcSeries } from './calculus/series.mjs';
export { calcPartial, calcGradient, calcDoubleIntegral, calcGrad3D, calcDirectional, calcCurvature, calcDivCurl, calcConservative, calcLineIntegral, calcTheorems, calcMvLimit, calcExtrema, calcMvIntegral } from './calculus/multivariable.mjs';
export { calcEDOSep, calcEDOLinear, calcEDO2nd } from './calculus/ode.mjs';
export { calcParametric, calcPolar, calcConics } from './calculus/curves.mjs';
export { calcRevolutionVolume, calcRevolutionModeChanged, calcRevolutionAxisChanged, toggleRevSolid } from './calculus/revolution.mjs';

export function calcInit(tab='dif'){
  ['dif','int','mul','edo'].forEach(id=>buildKB('calc-kb-'+id));
  initInputTracking();
  initEnterKey();
  initLivePreviews();
  calcTab(tab);
}
