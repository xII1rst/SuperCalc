import { constant, num, nums, read, two } from './inputs.mjs';
import { cylinderAreaMinimum, exponentialLimitCoefficient, maximalEllipseRectangle, nearestParabolaPoints, polynomialExponentialAnalysis, positiveReciprocalMinimum, rationalFunctionAnalysis, stationarySineCoefficient, symbolicParametricDerivatives, tangentDifferential, theoremCase, theoremCheck } from '../../math/differential-applications.mjs';
import { implicitSlope, piecewiseContinuity } from '../../math/study-calculus.mjs';

export const fields={
  linearization:[['expr','f(x)','sqrt(x^2+1)','text'],['x0','x₀','1'],['increment','dx','0.1']],
  functionanalysis:[['expr','Polinomio o N(x)/D(x), grados ≤4','x/(x^2+1)','text'],['scope','Extremos locales o absolutos en intervalo','locales','select','locales,intervalo'],['start','x inicial de gráfica / intervalo','-6'],['end','x final de gráfica / intervalo','6'],['minimumY','y mínimo de gráfica','-6'],['maximumY','y máximo de gráfica','6']],
  exponentialanalysis:[['expr','P(x) de P(x)e^(kx), grado ≤4','x','text'],['rate','k','-1']],
  theorem:[['expr','f(x): polinomio (grado ≤4), sqrt(x), abs(mx+q), x^(p/q) o c/(mx+q)^k','x^2-4*x+3','text'],['start','a','1'],['end','b','3'],['kind','Teorema','rolle','select','rolle=Rolle,mvt=Valor medio']],
  theoremcases:[['case','Contraejemplo','abs','select','abs=|x| en [−1; 1] · Rolle,cusp=x^(2/3) en [−1; 1] · Rolle,pole=1/x² en [−1; 1] · Rolle,cbrt=x^(1/3) en [−1; 1] · valor medio,jump=Salto en x = 1 · Rolle,ok=x² − 4x + 3 en [1; 3] · Rolle (sí se cumple)']],
  reciprocalminimum:[['a','a en a·x^p+b/x^q','1'],['b','b','128'],['p','p > 0','2'],['q','q > 0','1']],
  ellipserectangle:[['a','Semieje horizontal a','4'],['b','Semieje vertical b','3']],
  cylinderminimum:[['volume','Volumen (cm³)','500'],['lids','Tapas: 1 abierto / 2 cerrado','2','select','2,1']],
  nearestparabola:[['a','a ≠ 0 en y=a·x²','1'],['u','Coordenada u del punto','0'],['v','Coordenada v del punto','3']],
  sineparameter:[['b','B en a·sen x+B·sen(mx)','0.3333333333333333'],['frequency','m > 0','3'],['point','x₀ (rad; admite π)','π/3','text']],
  exponentialparameter:[['target','Valor del límite (e^(kx)−1−kx)/x²','8']],
  continuity:[['segments','Tramos, uno por línea; usa * para productos con parámetros','x^2+k\n3*x-1','textarea'],['cuts','Uniones x, separadas por coma','2','text']],
  parametric:[['xexpr','x(t)','t^2-1','text'],['yexpr','y(t)','t^3+t','text'],['time','t (admite π)','1','text']],
  implicit:[['expr','F(x,y) = 0','x^2+y^2-25','text'],['x','x','3'],['y','y','4'],['step','Paso h','0.00001']],
};

export const modes={
  linearization:['differential','Tangente, diferencial y aproximación','dy=f′(x₀)dx; compara la aproximación lineal con el valor evaluado.'],
  functionanalysis:['differential','Análisis de polinomios y funciones racionales','Dominio, simetría, signos de f′/f″, extremos, inflexiones, asíntotas y gráfica.'],
  exponentialanalysis:['differential','Extremos de P(x)e^(kx)','Clasifica puntos críticos por cambio de signo y muestra f″.'],
  theorem:['differential','Rolle y teorema del valor medio','Verifica continuidad, diferenciabilidad y valores extremos en las familias admitidas.'],
  theoremcases:['differential','Contraejemplos de Rolle y valor medio','Qué pasa cuando falla la continuidad o la derivabilidad: a veces no existe c, y a veces existe igual.'],
  reciprocalminimum:['differential','Mínimo global de a·x^p+b/x^q','Dominio x>0; cambio de signo de f′ y comportamiento en los extremos.'],
  ellipserectangle:['differential','Rectángulo máximo en una elipse','Rectángulo centrado con lados paralelos a los ejes; a,b son semiejes.'],
  cylinderminimum:['differential','Cilindro de área mínima','Elige una o dos tapas; volumen en cm³, radio/altura en cm, área en cm².'],
  nearestparabola:['differential','Puntos más cercanos de una parábola','Compara la distancia de todos los candidatos; conserva mínimos empatados.'],
  sineparameter:['differential','Parámetro para extremo trigonométrico','Resuelve f′(x₀)=0 y clasifica con f″ cuando no es nula.'],
  exponentialparameter:['differential','Parámetro de límite exponencial','Dos aplicaciones de L’Hôpital; incluye todos los valores reales de k.'],
  continuity:['differential','Continuidad por tramos','Iguala los límites laterales en cada unión; parámetros lineales.'],
  parametric:['differential','Derivadas paramétricas','dy/dx = y′(t)/x′(t); d²y/dx² = (x′y″−y′x″)/(x′)³.'],
  implicit:['differential','Derivada implícita','F(x,y)=0; dy/dx = −Fx/Fy cuando Fy≠0.'],
};

export const solvers={
  linearization() { return tangentDifferential(read('expr'),num('x0'),num('increment')); },
  functionanalysis() { return rationalFunctionAnalysis(read('expr'),{start:num('start'),end:num('end'),closedInterval:read('scope')==='intervalo'}); },
  exponentialanalysis() { return polynomialExponentialAnalysis(read('expr'),num('rate')); },
  theorem() { return theoremCheck(read('expr'),num('start'),num('end'),read('kind')); },
  theoremcases() { return theoremCase(read('case')); },
  reciprocalminimum() { return positiveReciprocalMinimum(num('a'),num('b'),num('p'),num('q')); },
  ellipserectangle() { return maximalEllipseRectangle(num('a'),num('b')); },
  cylinderminimum() { return cylinderAreaMinimum(num('volume'),num('lids')); },
  nearestparabola() { return nearestParabolaPoints(num('a'),num('u'),num('v')); },
  sineparameter() { return stationarySineCoefficient(num('b'),num('frequency'),constant('point')); },
  exponentialparameter() { return exponentialLimitCoefficient(num('target')); },
  continuity() { return piecewiseContinuity(read('segments').split(/[\n;]+/).map(text=>text.trim()).filter(Boolean),nums('cuts')); },
  parametric() { return symbolicParametricDerivatives(read('xexpr'),read('yexpr'),constant('time')); },
  implicit() { return implicitSlope(two('expr'),num('x'),num('y'),num('step')); },
};
