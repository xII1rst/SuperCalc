import { calcParse } from '../../math/expression.mjs';
import { curveIntersections, parseRevolutionFunction } from '../../math/calculus/revolution.mjs';
import { readInputNum, readInputValue, readRevolutionParameters, usesRevolutionCoefficients, v } from './results.mjs';
import { renderPreview, sampleFn, sampleParametric, samplePolar } from '../../graphics/preview-canvas.mjs';

export function drawPreview(cv){
  if(!cv) return;
  const mode = cv.dataset.gmode;
  const src = cv.dataset.src || '';
  const a = readInputNum(cv.dataset.a);
  const b = readInputNum(cv.dataset.b);
  let points = [];

  if(mode === 'fn'){
    const isRevolution=Boolean(cv.dataset.secondary);
    const addMode=isRevolution&&v('int-rev-mode')==='add';
    const axisChoice=isRevolution?v('int-rev-axis'):'';
    const shift=readInputNum('int-rev-shift');
    const referenceLine=axisChoice.endsWith('-shift')&&Number.isFinite(shift)
      ? {axis:axisChoice.startsWith('x')?'x':'y',value:shift} : null;
    const revParams=isRevolution ? (addMode ? readRevolutionParameters() : {m:1,b:0}) : null;
    const expression=readInputValue(src);
    const fn = cv.dataset.secondary
      ? (revParams&&(addMode||!usesRevolutionCoefficients(expression))&&parseRevolutionFunction(expression,revParams))
      : calcParse(expression, cv.dataset.var || 'x');
    if(!fn){ renderPreview(cv, []); return; }
    const [x0, x1] = (a < b) ? [a, b] : [-8, 8];
    points = sampleFn(fn, x0, x1);
    if(addMode){
      const secondExpression=readInputValue(cv.dataset.secondary);
      if(secondExpression){
        const gn=parseRevolutionFunction(secondExpression,revParams);
        if(!gn){ renderPreview(cv, points, {referenceLine}); return; }
        const secondPoints=sampleFn(gn,x0,x1);
        renderPreview(cv,points,{
          secondPoints,
          markers:curveIntersections(fn,gn,x0,x1),
          referenceLine,
        });
        return;
      }
    }
    renderPreview(cv,points,{referenceLine});
    return;
  } else if(mode === 'param'){
    const ids = src.split(',');
    const xFn = calcParse(readInputValue(ids[0]), 't');
    const yFn = calcParse(readInputValue(ids[1]), 't');
    if(!xFn || !yFn){ renderPreview(cv, []); return; }
    const [t0, t1] = (a < b) ? [a, b] : [0, 2 * Math.PI];
    points = sampleParametric(xFn, yFn, t0, t1);
  } else if(mode === 'polar'){
    const rFn = calcParse(readInputValue(src), 't');
    if(!rFn){ renderPreview(cv, []); return; }
    const [t0, t1] = (a < b) ? [a, b] : [0, 2 * Math.PI];
    points = samplePolar(rFn, t0, t1);
  } else {
    renderPreview(cv, []);
    return;
  }
  renderPreview(cv, points);
}
