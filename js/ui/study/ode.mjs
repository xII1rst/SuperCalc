import { affineForcedSystem, familyEquation, homogeneousSecondOrderStudy, odeClassification, polynomialExponentialSecondOrder, sumSubstitution, variationRepeatedReciprocal, variationTangent } from '../../math/ode-study.mjs';
import { bernoulliConstant, bernoulliLinearForcing, exactPolynomialForm, firstOrderExponentialForcing, forcedSecondOrder, inferMonomialFactor, inverseLaplaceQuadratic, inverseLaplaceShiftedPower, laplaceExponentialPlusTime, laplaceRepeatedRootForcing, laplaceSecondOrderHarmonic, laplaceSystem2D, laplaceTable, linearFirstOrder, linearPowerCoefficient, linearSystem2D, logisticGrowth, orthogonalPowerTrajectories, rlCurrent, separablePower, symmetricSystemModes, thermalRelaxation, thirdOrderRepeatedRoot } from '../../math/study-ode.mjs';
import { num, nums, polynomialTerms, read } from './inputs.mjs';

export const fields={
  oclassify:[['equation','Ecuación en x,y; derivadas y\',y\'\',y\'\'\'','(y\'\')^3+2*y\'=x','text']],
  ohomogeneous:[['damping','a en y″+ay′+by=0','-5'],['stiffness','b','6'],['y0','y(0) del ejemplo','1'],['v0','y′(0) del ejemplo','0'],['x','x para evaluar','1']],
  opolyexp:[['damping','a en y″+ay′+by=e^(rx)P(x)','-3'],['stiffness','b','2'],['rate','r','0'],['coefficients','P(x): coeficientes ascendentes','0,4','text'],['y0','y(0)','0'],['v0','y′(0)','0'],['x','x para evaluar','1']],
  ofamily:[['kind','Familia de soluciones','exponential','select','exponential,repeated,circles'],['rate','r en exponenciales','3'],['point','x,y para pendiente de circunferencia','2,1','text']],
  osubstitution:[['a','a en M=a(x+y)+b','1'],['b','b','1'],['c','c en N=c(x+y)+d','2'],['d','d','-1'],['x','Punto x de comprobación','1'],['y','Punto y','2']],
  ovarreciprocal:[['root','r en (D−r)²y=Ae^(rx)/x','1'],['amplitude','A','1'],['c0','C₀ del ejemplo','0'],['c1','C₁ del ejemplo','0'],['x','x≠0','2']],
  ovartan:[['amplitude','A en y″+ω²y=A tan(ωx)','1'],['omega','ω>0','1'],['c0','C₀ del ejemplo','0'],['c1','C₁ del ejemplo','0'],['x','x entre polos de tan','0.5']],
  oforcedsystem:[['matrix','A (a,b,c,d)','3,-1,1,1','text'],['forcingSlope','f₁ en X′=AX+f₁t+f₀','1,0','text'],['forcingConstant','f₀','0,0','text'],['initial','X(0) del ejemplo','0,0','text'],['time','t para evaluar','1']],
  separable:[['a','Coeficiente a','2'],['xp','Potencia p de x','1'],['yp','Potencia q de y','1'],['x0','x inicial','0'],['y0','y inicial (q=0/1 arbitraria; otras q: positiva)','1'],['x','x final','1']],
  linearode:[['p','p constante en y′+py=q','2'],['q','q constante','6'],['x0','x inicial','0'],['y0','y inicial','1'],['x','x final','1']],
  linearvariable:[['a','a en y′+(a/x)y=b·x^m','2'],['b','b','1'],['m','Exponente m','3'],['x0','x inicial ≠0','1'],['y0','y(x₀)','0'],['x','x final ≠0','2']],
  bernoulli:[['p','p en y′+py=qyⁿ','1'],['q','q','1'],['power','n','2'],['x0','x inicial','0'],['y0','y inicial positiva','2'],['x','x final','0.5']],
  bernoullilinear:[['p','p en y′+py=qxy²','1'],['q','q','1'],['constant','Constante C de la solución general','0'],['x','x para evaluar','1']],
  exactode:[['factorMode','Factor','given','select','given,search'],['mterms','M(x,y): coeficiente, potencia x, potencia y; una fila por término','2, 1, 0\n1, 0, 1','textarea'],['nterms','N(x,y): coeficiente, potencia x, potencia y','1, 1, 0\n2, 0, 1','textarea'],['factorX','Exponente a del factor μ = x^a y^b','0'],['factorY','Exponente b','0']],
  logistic:[['rate','Tasa r','1'],['capacity','Capacidad K','10'],['x0','x inicial','0'],['y0','Población inicial positiva','2'],['x','x final','1']],
  cooling:[['ambient','Temperatura ambiente Tₐ','20'],['initialTemperature','T(0)','90'],['observedTemperature','Temperatura observada T(t₁)','60'],['observationTime','t₁ > 0','10'],['time','Tiempo final t ≥ 0','20']],
  rlcircuit:[['inductance','Inductancia L (H)','2'],['resistance','Resistencia R (Ω)','10'],['voltage','Voltaje V (V)','12'],['initialCurrent','i(0) (A)','0'],['time','Tiempo t ≥ 0 (s)','1']],
  orthogonal:[['power','n en y=C·xⁿ (n no nulo)','2'],['x','x de comprobación > 0','1'],['y','y de comprobación no nulo','1']],
  thirdrepeated:[['root','Raíz triple r en (D−r)³y','1'],['amplitude','Amplitud A de e^(rx)','1'],['c0','C₀ para evaluar','0'],['c1','C₁ para evaluar','0'],['c2','C₂ para evaluar','0'],['x','x de evaluación','1']],
  forced:[['damping','Coeficiente a de y′','0'],['stiffness','Coeficiente b de y','1'],['force','Amplitud F','2'],['omega','Frecuencia ω (rad/s)','1'],['y0','y(0)','0'],['v0','y′(0)','0'],['time','Tiempo t','1']],
  systemode:[['matrix','Matriz A: a,b,c,d','0, -1, 1, 0','text'],['initial','Vector inicial u₀,v₀','1, 0','text'],['time','Tiempo t','1.5707963267948966']],
  laplacesystem:[['matrix','Matriz A: a,b,c,d','2, -1, 1, 0','text'],['initial','Vector inicial x₀,y₀','1, 0','text'],['time','Tiempo t','1']],
  eigenmodes:[['diagonal','a en A=[[a,b],[b,a]]','1'],['coupling','b','2'],['initial','Vector inicial x₀,y₀ para evaluar','1, 0','text'],['time','Tiempo t','1']],
  laplace:[['kind','Función','sine','select','one,exponential,sine,cosine,time,timeSquared,timeSine'],['parameter','Parámetro a','2']],
  laplacesum:[['rate','a en e^(at)','2'],['timeCoefficient','b en b·t','3']],
  laplaceinversepower:[['coefficient','C en C/(s+a)ⁿ','6'],['shift','a','0'],['order','Orden n (1–10)','4'],['time','Tiempo t ≥ 0','1']],
  laplaceinversequadratic:[['numeratorSlope','A en As+B','1'],['numeratorConstant','B','3'],['linearCoefficient','p en s²+ps+q','4'],['constantCoefficient','q','13'],['time','Tiempo t ≥ 0','1']],
  laplacefirstorder:[['p','p en y′+py=Ae^(at)','-3'],['amplitude','Amplitud A','1'],['rate','Tasa a','2'],['initialValue','y(0)','1'],['time','Tiempo t ≥ 0','1']],
  laplaceharmonic:[['damping','a en y″+ay′+by','0'],['stiffness','b','4'],['cosineForce','Fc en Fc cos(ωt)','0'],['sineForce','Fs en Fs sen(ωt)','1'],['omega','Frecuencia ω (rad/s)','1'],['y0','y(0)','0'],['v0','y′(0)','0'],['time','Tiempo t ≥ 0','1']],
  laplacerepeated:[['root','Raíz doble r en (D−r)²y','1'],['amplitude','Amplitud A','1'],['power','Potencia m en A·t^m·e^(rt) (0–3)','1'],['y0','y(0)','0'],['v0','y′(0)','0'],['time','Tiempo t ≥ 0','1']],
};

export const modes={
  oclassify:['ode','Clasificador de orden, grado y linealidad','Clasificación de la forma escrita; grado solo cuando es polinómica en las derivadas.'],
  ohomogeneous:['ode','Segundo orden homogéneo con familia y PVI','Polinomio característico, solución general y condiciones iniciales sustituidas.'],
  opolyexp:['ode','Coeficientes indeterminados: e^(rx)P(x)','Grado≤4, resonancia de multiplicidad 0,1,2 y verificación de iniciales/residuo.'],
  ofamily:['ode','EDO desde una familia','Exponencial, raíz doble o circunferencias: derivar y eliminar constantes con alcance visible.'],
  osubstitution:['ode','Forma reducible por u=x+y','M=a(x+y)+b,N=c(x+y)+d; solución implícita y equilibrio conservado.'],
  ovarreciprocal:['ode','Variación de parámetros: Ae^(rx)/x','Base fundamental, Wronskiano, integrales y rama x≠0.'],
  ovartan:['ode','Variación de parámetros: tan(ωx)','Base seno/coseno, Wronskiano y particular en intervalos sin polos.'],
  oforcedsystem:['ode','Sistema 2×2 con fuerza afín y eliminación','Particular por coeficientes, solución general y PVI por matriz exponencial.'],
  separable:['ode','EDO separable potencia','y′=a xᵖyᑫ; se sigue la rama positiva.'],
  linearode:['ode','EDO lineal de primer orden','y′+p y=q con p,q constantes.'],
  linearvariable:['ode','EDO lineal con coeficiente a/x','y′+(a/x)y=b x^m, rama sin x=0; factor integrante μ=x^a y condición inicial en x₀≠0.'],
  bernoulli:['ode','EDO de Bernoulli','y′+p y=q yⁿ; z=y^(1−n).'],
  bernoullilinear:['ode','Bernoulli con fuerza q·x','y′+py=qxy²; z=1/y produce z′−pz=−qx. Muestra la familia no nula y recuerda y≡0.'],
  exactode:['ode','EDO exacta polinómica','M(x,y)dx+N(x,y)dy=0. Introduce los monomios y, si se conoce, μ=x^a y^b.'],
  logistic:['ode','Crecimiento logístico','y′=r y(1−y/K).'],
  cooling:['ode','Enfriamiento de Newton','T′=k(T−Tₐ); deduce k de una observación y predice otra temperatura.'],
  rlcircuit:['ode','Circuito RL como PVI','L i′+R i=V; muestra corriente, valor límite y constante de tiempo.'],
  orthogonal:['ode','Trayectorias ortogonales de y=Cxⁿ','La familia ortogonal satisface x²+n y²=C; compara pendientes en un punto regular.'],
  thirdrepeated:['ode','Tercer orden con raíz triple','(D−r)³y=Ae^(rx); usa y=e^(rx)u y resuelve u‴=A.'],
  forced:['ode','Segundo orden forzado','y″+a y′+b y=F cos(ωt) con condiciones iniciales.'],
  systemode:['ode','Sistema lineal 2×2','u′=Au con A constante.'],
  laplacesystem:['ode','Sistema 2×2 por Laplace','(sI−A)U(s)=u₀; presenta ambas transformadas y la solución temporal.'],
  eigenmodes:['ode','Sistema simétrico por modos propios','A=[[a,b],[b,a]]; autovalores a±b y autovectores (1,±1).'],
  laplace:['ode','Tabla de Laplace','Transformadas básicas bajo el semiplano de convergencia indicado.'],
  laplacesum:['ode','Laplace de exponencial más término lineal','L{e^(at)+bt}=1/(s−a)+b/s².'],
  laplaceinversepower:['ode','Laplace inversa de polo repetido','L⁻¹{C/(s+a)ⁿ}=Ct^(n−1)e^(−at)/(n−1)!; t≥0.'],
  laplaceinversequadratic:['ode','Laplace inversa de cuadrática','Completa el cuadrado y aplica el desplazamiento en s.'],
  laplacefirstorder:['ode','PVI lineal con fuerza exponencial por Laplace','(s+p)Y(s)−y₀=A/(s−a); despeja Y e invierte.'],
  laplaceharmonic:['ode','PVI de segundo orden con seno y coseno','Transforma el PVI, separa la respuesta libre y la forzada y ajusta las condiciones iniciales.'],
  laplacerepeated:['ode','PVI con raíz doble y fuerza t^m e^(rt)','(D−r)²y=A t^m e^(rt); la fuerza resuena con la raíz doble.'],
};

export const solvers={
  oclassify() { return odeClassification(read('equation')); },
  ohomogeneous() { return homogeneousSecondOrderStudy(num('damping'),num('stiffness'),num('y0'),num('v0'),num('x')); },
  opolyexp() { return polynomialExponentialSecondOrder(num('damping'),num('stiffness'),num('rate'),nums('coefficients'),num('y0'),num('v0'),num('x')); },
  ofamily() { return familyEquation(read('kind'),num('rate'),nums('point')); },
  osubstitution() { return sumSubstitution(num('a'),num('b'),num('c'),num('d'),num('x'),num('y')); },
  ovarreciprocal() { return variationRepeatedReciprocal(num('root'),num('amplitude'),num('c0'),num('c1'),num('x')); },
  ovartan() { return variationTangent(num('amplitude'),num('omega'),num('c0'),num('c1'),num('x')); },
  oforcedsystem() {
    const a=nums('matrix');if(a.length!==4)throw new RangeError('Matriz de cuatro componentes');
    return affineForcedSystem([a.slice(0,2),a.slice(2)],nums('forcingSlope'),nums('forcingConstant'),nums('initial'),num('time'));
  },
  separable() { return separablePower(num('a'),num('xp'),num('yp'),num('x0'),num('y0'),num('x')); },
  linearode() { return linearFirstOrder(num('p'),num('q'),num('x0'),num('y0'),num('x')); },
  linearvariable() { return linearPowerCoefficient(num('a'),num('b'),num('m'),num('x0'),num('y0'),num('x')); },
  bernoulli() { return bernoulliConstant(num('p'),num('q'),num('power'),num('x0'),num('y0'),num('x')); },
  bernoullilinear() { return bernoulliLinearForcing(num('p'),num('q'),num('constant'),num('x')); },
  exactode() {
    if(read('factorMode')==='search') return inferMonomialFactor(polynomialTerms('mterms'),polynomialTerms('nterms'));
    return exactPolynomialForm(polynomialTerms('mterms'),polynomialTerms('nterms'),num('factorX'),num('factorY'));
  },
  logistic() { return logisticGrowth(num('rate'),num('capacity'),num('x0'),num('y0'),num('x')); },
  cooling() { return thermalRelaxation(num('ambient'),num('initialTemperature'),num('observedTemperature'),num('observationTime'),num('time')); },
  rlcircuit() { return rlCurrent(num('inductance'),num('resistance'),num('voltage'),num('initialCurrent'),num('time')); },
  orthogonal() { return orthogonalPowerTrajectories(num('power'),num('x'),num('y')); },
  thirdrepeated() { return thirdOrderRepeatedRoot(num('root'),num('amplitude'),num('c0'),num('c1'),num('c2'),num('x')); },
  forced() { return forcedSecondOrder(num('damping'),num('stiffness'),num('force'),num('omega'),num('y0'),num('v0'),num('time')); },
  systemode() {
    const values=nums('matrix'),initial=nums('initial');
    if(values.length!==4||initial.length!==2) throw new RangeError('Matriz de 4 y vector de 2 números requeridos');
    return linearSystem2D([[values[0],values[1]],[values[2],values[3]]],initial,num('time'));
  },
  laplacesystem() {
    const values=nums('matrix'),initial=nums('initial');
    if(values.length!==4||initial.length!==2) throw new RangeError('Matriz de 4 y vector de 2 números requeridos');
    return laplaceSystem2D([[values[0],values[1]],[values[2],values[3]]],initial,num('time'));
  },
  eigenmodes() {
    const initial=nums('initial');
    return symmetricSystemModes(num('diagonal'),num('coupling'),initial,num('time'));
  },
  laplace() { return laplaceTable(read('kind'),num('parameter')); },
  laplacesum() { return laplaceExponentialPlusTime(num('rate'),num('timeCoefficient')); },
  laplaceinversepower() { return inverseLaplaceShiftedPower(num('coefficient'),num('shift'),num('order'),num('time')); },
  laplaceinversequadratic() { return inverseLaplaceQuadratic(num('numeratorSlope'),num('numeratorConstant'),num('linearCoefficient'),num('constantCoefficient'),num('time')); },
  laplacefirstorder() { return firstOrderExponentialForcing(num('p'),num('amplitude'),num('rate'),num('initialValue'),num('time')); },
  laplaceharmonic() { return laplaceSecondOrderHarmonic(num('damping'),num('stiffness'),num('cosineForce'),num('sineForce'),num('omega'),num('y0'),num('v0'),num('time')); },
  laplacerepeated() { return laplaceRepeatedRootForcing(num('root'),num('amplitude'),num('power'),num('y0'),num('v0'),num('time')); },
};
