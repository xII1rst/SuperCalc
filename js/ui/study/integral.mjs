import { antiderivativeInitialValue, curveMeasureExpression, firstTaylorTerms, fundamentalIntegralDerivative, polarAreaBetween, powerSeriesInterval, rationalSeriesComparison, sineIntegralLimit, telescopingOffset } from '../../math/study-calculus.mjs';
import { constant, num, one, read } from './inputs.mjs';

export const fields={
  primitivepvi:[['expr','y′=f(x)','6*x^2-2','text'],['x0','x₀','1'],['y0','y(x₀)','4'],['x','x para evaluar','2']],
  tfc:[['expr','Integrando f(t)','sin(t)','text'],['lower','Límite inferior a(x)','0','text'],['upper','Límite superior b(x)','x^2','text'],['x','x para evaluar','1']],
  integrallimit:[['amplitude','A en A·sen(Bt^m)','1'],['rate','B','1'],['power','m entero; divisor x^(m+1)','2']],
  comparisonseries:[['a','A en (An+B)/(n^k+n)','2'],['b','B','1'],['power','k entero','3']],
  taylorterms:[['expr','f(x)','ln(1+x)','text'],['center','Centro c (constante)','0','text'],['terms','Cantidad de términos no nulos','4'],['x','Punto para aproximar','0.1']],
  polararea:[['outer','Radio exterior r(θ)','3*cos(x)','text'],['inner','Radio interior r(θ)','0','text'],['start','θ inicial (rad)','-1.5707963267948966'],['end','θ final (rad)','1.5707963267948966'],['n','Subintervalos pares (4–1000)','400']],
  arc:[['expr','y=f(x)','x^(3/2)','text'],['start','x inicial','0'],['end','x final','4'],['n','Subintervalos pares','400']],
  surface:[['expr','y=f(x), no negativa al girar alrededor de x','x^3','text'],['start','x inicial','0'],['end','x final','1'],['axis','Eje x o y','x','select','x,y'],['n','Subintervalos pares','400']],
  series:[['center','Centro c','2'],['radius','Radio R','2'],['power','Exponente p de nᵖ','2']],
  telescoping:[['offset','Desplazamiento entero k en 1/[n(n+k)]','2']],
};

export const modes={
  primitivepvi:['integral','Antiderivada con condición inicial','y′=f(x), y(x₀)=y₀; C=y₀−F(x₀).'],
  tfc:['integral','Teorema fundamental con límites variables','Derivar una integral usando la regla de la cadena en sus límites.'],
  integrallimit:['integral','Límite de integral de seno por TFC','Familia ∫₀ˣ A·sen(Bt^m)dt dividida por x^(m+1); TFC y L’Hôpital.'],
  comparisonseries:['integral','Serie racional por comparación','Σ(An+B)/(n^k+n), n≥1; comparación explícita con una p-serie.'],
  taylorterms:['integral','Primeros términos de Taylor y aproximación','Elegir términos no nulos y evaluar el polinomio en un punto.'],
  polararea:['integral','Área polar entre curvas','A = ½∫(r exterior²−r interior²)dθ.'],
  arc:['integral','Longitud de arco','L = ∫√(1+f′(x)²)dx.'],
  surface:['integral','Área de superficie de revolución','S = 2π∫radio·√(1+f′²)dx.'],
  series:['integral','Intervalo de serie de potencias','Σₙ₌₁∞((x−c)/R)ⁿ/nᵖ; revisa ambos extremos.'],
  telescoping:['integral','Serie telescópica','1/[n(n+k)] = (1/n−1/(n+k))/k.'],
};

export const solvers={
  primitivepvi() { return antiderivativeInitialValue(read('expr'),num('x0'),num('y0'),num('x')); },
  tfc() { return fundamentalIntegralDerivative(read('expr'),read('lower'),read('upper'),num('x')); },
  integrallimit() { return sineIntegralLimit(num('amplitude'),num('rate'),num('power')); },
  comparisonseries() { return rationalSeriesComparison(num('a'),num('b'),num('power')); },
  taylorterms() { return firstTaylorTerms(read('expr'),constant('center'),num('terms'),num('x')); },
  polararea() { return polarAreaBetween(one('outer'),one('inner'),num('start'),num('end'),num('n')); },
  arc() { return curveMeasureExpression(read('expr'),num('start'),num('end'),'arc','x',num('n')); },
  surface() { return curveMeasureExpression(read('expr'),num('start'),num('end'),'surface',read('axis'),num('n')); },
  series() { return powerSeriesInterval(num('center'),num('radius'),num('power')); },
  telescoping() { return telescopingOffset(num('offset')); },
};
