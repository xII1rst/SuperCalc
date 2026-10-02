import { studyPlotSvg } from '../graphics/study-plot.mjs';
import { odeClassification, homogeneousSecondOrderStudy, polynomialExponentialSecondOrder, variationRepeatedReciprocal, variationTangent, familyEquation, sumSubstitution, affineForcedSystem } from '../math/ode-study.mjs';
import { planeFromPointNormal, lineStudy, differentialStudy, implicitSurfaceStudy, chainRuleStudy, jacobianStudy, curveStudy, polynomialPotentialStudy, polynomialCriticalStudy, constrainedQuadraticStudy, greenRegionStudy } from '../math/multivariable-study.mjs';
import { multivariableLimit } from '../math/multivariable.mjs';
import { vectorApplications } from '../math/algebra/linear-spaces.mjs';
import { theoremCase, theoremCurve, tangentDifferential, symbolicParametricDerivatives, rationalFunctionAnalysis, polynomialExponentialAnalysis, positiveReciprocalMinimum, maximalEllipseRectangle, cylinderAreaMinimum, nearestParabolaPoints, stationarySineCoefficient, exponentialLimitCoefficient, theoremCheck } from '../math/differential-applications.mjs';
import { functionAnalysisSvg } from '../graphics/function-analysis.mjs';
import { calcParse, collectVariables, normalizeExpression } from '../math/expression.mjs';
import { piecewiseContinuity, implicitSlope, polarAreaBetween, curveArcLength,
  surfaceOfRevolution, curveMeasureExpression, antiderivativeInitialValue, fundamentalIntegralDerivative, sineIntegralLimit, rationalSeriesComparison, firstTaylorTerms,
  integrateVariableRegion, laminaProperties, integrateTripleRegion, integrateParametricSurface,
  integrateParametricFlux, linearObjectiveCylinderPlane, minimumNormOnPlane, logarithmicRadialHarmonic, trilinearPotentialIntegral, tangentPlane, powerSeriesInterval, telescopingOffset } from '../math/study-calculus.mjs';
import { separablePower, linearFirstOrder, linearPowerCoefficient, bernoulliConstant, bernoulliLinearForcing, exactPolynomialForm, inferMonomialFactor, logisticGrowth, thermalRelaxation, rlCurrent, orthogonalPowerTrajectories, thirdOrderRepeatedRoot, forcedSecondOrder, linearSystem2D, laplaceSystem2D, symmetricSystemModes,
  laplaceTable, laplaceExponentialPlusTime, inverseLaplaceShiftedPower, inverseLaplaceQuadratic, firstOrderExponentialForcing,
  laplaceSecondOrderHarmonic, laplaceRepeatedRootForcing } from '../math/study-ode.mjs';

const fields={
  oclassify:[['equation','Ecuación en x,y; derivadas y\',y\'\',y\'\'\'','(y\'\')^3+2*y\'=x','text']],
  ohomogeneous:[['damping','a en y″+ay′+by=0','-5'],['stiffness','b','6'],['y0','y(0) del ejemplo','1'],['v0','y′(0) del ejemplo','0'],['x','x para evaluar','1']],
  opolyexp:[['damping','a en y″+ay′+by=e^(rx)P(x)','-3'],['stiffness','b','2'],['rate','r','0'],['coefficients','P(x): coeficientes ascendentes','0,4','text'],['y0','y(0)','0'],['v0','y′(0)','0'],['x','x para evaluar','1']],
  ofamily:[['kind','Familia de soluciones','exponential','select','exponential,repeated,circles'],['rate','r en exponenciales','3'],['point','x,y para pendiente de circunferencia','2,1','text']],
  osubstitution:[['a','a en M=a(x+y)+b','1'],['b','b','1'],['c','c en N=c(x+y)+d','2'],['d','d','-1'],['x','Punto x de comprobación','1'],['y','Punto y','2']],
  ovarreciprocal:[['root','r en (D−r)²y=Ae^(rx)/x','1'],['amplitude','A','1'],['c0','C₀ del ejemplo','0'],['c1','C₁ del ejemplo','0'],['x','x≠0','2']],
  ovartan:[['amplitude','A en y″+ω²y=A tan(ωx)','1'],['omega','ω>0','1'],['c0','C₀ del ejemplo','0'],['c1','C₁ del ejemplo','0'],['x','x entre polos de tan','0.5']],
  oforcedsystem:[['matrix','A (a,b,c,d)','3,-1,1,1','text'],['forcingSlope','f₁ en X′=AX+f₁t+f₀','1,0','text'],['forcingConstant','f₀','0,0','text'],['initial','X(0) del ejemplo','0,0','text'],['time','t para evaluar','1']],
  mplane:[['point','Punto del plano','1,0,2','text'],['normal','Normal no nula','2,-1,3','text']],
  mline:[['field','Escalar f o componentes Fx,Fy,Fz, una por línea','x^2+y^2','textarea'],['maps','x(t),y(t),z(t), una por línea','2*cos(t)\n2*sin(t)\n0','textarea'],['type','Tipo','scalar','select','scalar,vector'],['start','t inicial','0'],['end','t final','2*π','text'],['n','Subintervalos pares','200']],
  mvectors:[['u','Vector u (3 componentes)','1,2,3','text'],['v','Vector v','4,-1,2','text']],
  mdifferential:[['expr','f(x,y,z)','x^2+y^2+z^2','text'],['variables','Variables en orden','x,y,z','text'],['point','Punto en ese orden','1,2,2','text'],['direction','Dirección (opcional)','1,0,0','text']],
  mlimit:[['expr','f(x,y)','x^2*y/(x^2+y^2)','text'],['x','x₀','0'],['y','y₀','0']],
  mimplicit:[['expr','F(x,y,z)=0','x^2+2*y^2+3*z^2-21','text'],['point','Punto de la superficie','4,-1,1','text']],
  mchain:[['expr','w(x,y,z)','x^2+y*z','text'],['maps','x,y,z: una expresión por línea','u*v\nu+v\nu-v','textarea'],['variables','Parámetros en orden','u,v','text'],['point','Punto de parámetros','1,2','text']],
  mjacobian:[['maps','x(u,v), y(u,v): una por línea','u^2-v^2\n2*u*v','textarea'],['point','Punto u,v','1,2','text']],
  mcurve:[['maps','x(t),y(t),z(t): una por línea','cos(t)\nsin(t)\nt','textarea'],['time','t para velocidad y aceleración','1'],['start','t inicial','0'],['end','t final','2*π','text'],['n','Subintervalos pares','200']],
  mpotential:[['fieldX','P(x,y)','2*x*y','text'],['fieldY','Q(x,y)','x^2','text'],['from','Punto inicial','0,0','text'],['to','Punto final','1,2','text']],
  mcritical:[['expr','Cuadrática o a(x³+y³)−3bxy+C','x^3-3*x*y+y^3','text']],
  mconstraint:[['expr','Objetivo cuadrático f(x,y)','x*y','text'],['constraint','Restricción g(x,y)=c: recta o círculo','x+2*y','text'],['constant','c','8']],
  mgreen:[['fieldX','P(x,y)','-y','text'],['fieldY','Q(x,y)','x','text'],['coordinates','Región cartesiana / polar','polar','select','cartesian,polar'],['lower','y inferior(x) / r inferior(theta)','0','text'],['upper','y superior(x) / r superior(theta)','3','text'],['start','x / theta inicial','0'],['end','x / theta final','2*π','text'],['orientation','Borde: positive antihorario / negative horario','positive','select','positive,negative'],['n','Malla par (4–400)','200']],
  mpolar:[['integrand','f(x,y)','exp(-(x^2+y^2))','text'],['lower','r inferior(theta)','0','text'],['upper','r superior(theta)','2','text'],['start','theta inicial','0'],['end','theta final','2*π','text'],['nx','Malla angular','200'],['ny','Malla radial','200']],
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
  primitivepvi:[['expr','y′=f(x)','6*x^2-2','text'],['x0','x₀','1'],['y0','y(x₀)','4'],['x','x para evaluar','2']],
  tfc:[['expr','Integrando f(t)','sin(t)','text'],['lower','Límite inferior a(x)','0','text'],['upper','Límite superior b(x)','x^2','text'],['x','x para evaluar','1']],
  integrallimit:[['amplitude','A en A·sen(Bt^m)','1'],['rate','B','1'],['power','m entero; divisor x^(m+1)','2']],
  comparisonseries:[['a','A en (An+B)/(n^k+n)','2'],['b','B','1'],['power','k entero','3']],
  taylorterms:[['expr','f(x)','ln(1+x)','text'],['center','Centro c (constante)','0','text'],['terms','Cantidad de términos no nulos','4'],['x','Punto para aproximar','0.1']],
  continuity:[['segments','Tramos, uno por línea; usa * para productos con parámetros','x^2+k\n3*x-1','textarea'],['cuts','Uniones x, separadas por coma','2','text']],
  parametric:[['xexpr','x(t)','t^2-1','text'],['yexpr','y(t)','t^3+t','text'],['time','t (admite π)','1','text']],
  implicit:[['expr','F(x,y) = 0','x^2+y^2-25','text'],['x','x','3'],['y','y','4'],['step','Paso h','0.00001']],
  polararea:[['outer','Radio exterior r(θ)','3*cos(x)','text'],['inner','Radio interior r(θ)','0','text'],['start','θ inicial (rad)','-1.5707963267948966'],['end','θ final (rad)','1.5707963267948966'],['n','Subintervalos pares (4–1000)','400']],
  arc:[['expr','y=f(x)','x^(3/2)','text'],['start','x inicial','0'],['end','x final','4'],['n','Subintervalos pares','400']],
  surface:[['expr','y=f(x), no negativa al girar alrededor de x','x^3','text'],['start','x inicial','0'],['end','x final','1'],['axis','Eje x o y','x','select','x,y'],['n','Subintervalos pares','400']],
  series:[['center','Centro c','2'],['radius','Radio R','2'],['power','Exponente p de nᵖ','2']],
  telescoping:[['offset','Desplazamiento entero k en 1/[n(n+k)]','2']],
  region:[['order','Orden de integración','dy-dx','select','dy-dx,dx-dy'],['integrand','f(x,y)','x*y','text'],['lower','Límite interior inferior (y(x) o x(y))','x^2','text'],['upper','Límite interior superior (y(x) o x(y))','x','text'],['start','Coordenada exterior inicial','0'],['end','Coordenada exterior final','1'],['nx','Divisiones en x (2–400)','80'],['ny','Divisiones en y (2–400)','80']],
  lamina:[['density','Densidad ρ(x,y) (masa/área)','x+y','text'],['lower','y inferior(x)','0','text'],['upper','y superior(x)','1-x','text'],['start','x inicial','0'],['end','x final','1'],['nx','Divisiones en x (4–400)','120'],['ny','Divisiones en y (4–400)','120']],
  laminapolar:[['density','Densidad ρ(x,y) (masa/área)','1','text'],['lower','r inferior(θ)','0','text'],['upper','r superior(θ)','2','text'],['start','θ inicial (rad)','0'],['end','θ final (rad)','2*π','text'],['nx','Divisiones en θ (4–400)','120'],['ny','Divisiones en r (4–400)','120']],
  triplecart:[['integrand3','f(x,y,z)','z','text'],['outerStart','x inicial','0'],['outerEnd','x final','1'],['middleLower','y inferior(x)','0','text'],['middleUpper','y superior(x)','1-x','text'],['innerLower','z inferior(x,y)','0','text'],['innerUpper','z superior(x,y)','1-x-y','text'],['n3','n Simpson (8–60, múltiplo de 4)','20']],
  triplecyl:[['integrand3','f(x,y,z)','1','text'],['outerStart','r inicial','0'],['outerEnd','r final','2'],['middleLower','θ inferior(r)','0','text'],['middleUpper','θ superior(r)','2*π','text'],['innerLower','z inferior(r,theta)','0','text'],['innerUpper','z superior(r,theta)','r^2','text'],['n3','n Simpson (8–60, múltiplo de 4)','20']],
  triplesph:[['integrand3','f(x,y,z)','1','text'],['outerStart','ρ inicial','0'],['outerEnd','ρ final','3'],['middleLower','φ inferior(rho)','0','text'],['middleUpper','φ superior(rho)','π','text'],['innerLower','θ inferior(rho,phi)','0','text'],['innerUpper','θ superior(rho,phi)','2*π','text'],['n3','n Simpson (8–60, múltiplo de 4)','20']],
  paramsurface:[['xexpr','x(u,v)','u*cos(v)','text'],['yexpr','y(u,v)','u*sin(v)','text'],['zexpr','z(u,v)','u^2','text'],['integrand3','f(x,y,z); 1 para área','1','text'],['uStart','u inicial','0'],['uEnd','u final','2','text'],['vStart','v inicial','0'],['vEnd','v final','2*π','text'],['n2','n Simpson (8–80, múltiplo de 4)','40']],
  paramflux:[['xexpr','x(u,v)','sin(u)*cos(v)','text'],['yexpr','y(u,v)','sin(u)*sin(v)','text'],['zexpr','z(u,v)','cos(u)','text'],['fieldX','Fx(x,y,z)','x','text'],['fieldY','Fy(x,y,z)','y','text'],['fieldZ','Fz(x,y,z)','z','text'],['uStart','u inicial','0'],['uEnd','u final','π','text'],['vStart','v inicial','0'],['vEnd','v final','2*π','text'],['orientation','Orientación','uv','select','uv,vu'],['n2','n Simpson (8–80, múltiplo de 4)','40']],
  twoconstraints:[['radiusSquared','R² en x²+y²=R²','2'],['planeA','a en ax+by+cz=d','1'],['planeB','b','0'],['planeC','c (no nulo)','1'],['planeD','d','1'],['objectiveX','p en f=px+qy+sz','1'],['objectiveY','q','1'],['objectiveZ','s','1']],
  planenorm:[['planeA','a en ax+by+cz=d','1'],['planeB','b','1'],['planeC','c','1'],['planeD','d','3']],
  harmoniclog:[['scale','k en u=k ln√(x²+y²)','1'],['x','x fuera del origen','1'],['y','y','2']],
  trilinearpath:[['coefficient','k en F=(k yz,k xz,k xy)','1'],['from','Punto inicial x,y,z','1, 1, 1','text'],['to','Punto final x,y,z','2, 3, 4','text']],
  plane:[['expr','z=f(x,y)','x^2+y^2','text'],['x','x','1'],['y','y','1'],['step','Paso h','0.00001']],
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
const modes={
  oclassify:['ode','Clasificador de orden, grado y linealidad','Clasificación de la forma escrita; grado solo cuando es polinómica en las derivadas.'],
  ohomogeneous:['ode','Segundo orden homogéneo con familia y PVI','Polinomio característico, solución general y condiciones iniciales sustituidas.'],
  opolyexp:['ode','Coeficientes indeterminados: e^(rx)P(x)','Grado≤4, resonancia de multiplicidad 0,1,2 y verificación de iniciales/residuo.'],
  ofamily:['ode','EDO desde una familia','Exponencial, raíz doble o circunferencias: derivar y eliminar constantes con alcance visible.'],
  osubstitution:['ode','Forma reducible por u=x+y','M=a(x+y)+b,N=c(x+y)+d; solución implícita y equilibrio conservado.'],
  ovarreciprocal:['ode','Variación de parámetros: Ae^(rx)/x','Base fundamental, Wronskiano, integrales y rama x≠0.'],
  ovartan:['ode','Variación de parámetros: tan(ωx)','Base seno/coseno, Wronskiano y particular en intervalos sin polos.'],
  oforcedsystem:['ode','Sistema 2×2 con fuerza afín y eliminación','Particular por coeficientes, solución general y PVI por matriz exponencial.'],
  mplane:['multivariable','Plano por punto y normal','Ecuación cartesiana desde los datos originales.'],
  mline:['multivariable','Integral de línea escalar/vectorial','Curva en 3D, orientación por parametrización y derivadas simbólicas.'],
  mvectors:['multivariable','Productos y ángulo de vectores','Producto escalar, vectorial y norma; tres componentes.'],
  mdifferential:['multivariable','Parciales, gradiente y Hessiano','Derivadas simbólicas, valor en el punto y dirección normalizada de crecimiento.'],
  mlimit:['multivariable','Límites multivariables con alcance explícito','Sustitución continua, refutación por caminos distintos o encaje radial en familias admitidas.'],
  mimplicit:['multivariable','Superficie implícita: plano y derivadas','Comprueba pertenencia y gradiente no nulo antes del plano tangente.'],
  mchain:['multivariable','Regla de la cadena','Introduce las funciones interiores y sus parámetros; muestra todos los factores.'],
  mjacobian:['multivariable','Jacobiano simbólico','Matriz de parciales, determinante y valor en el punto.'],
  mcurve:['multivariable','Curva espacial: velocidad, aceleración y longitud','Derivadas simbólicas y longitud numérica con comparación de mallas.'],
  mpotential:['multivariable','Potencial de campo polinómico','Identidad de coeficientes en todo ℝ²; incluye hipótesis del teorema fundamental.'],
  mcritical:['multivariable','Puntos críticos en familias polinómicas','Cuadráticas no degeneradas y a(x³+y³)−3bxy+C: lista completa, Hessiano y prueba.'],
  mconstraint:['multivariable','Lagrange para cuadrática con recta/círculo','Extremos globales en las familias admitidas; incluye empates y ausencia del otro extremo.'],
  mgreen:['multivariable','Green en región variable o polar','Campo polinómico, orientación del borde explícita y comparación de mallas.'],
  mpolar:['multivariable','Integral doble polar','Cambio x=r cosθ,y=r senθ; incluir jacobiano r y revisar límites.'],
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
  primitivepvi:['integral','Antiderivada con condición inicial','y′=f(x), y(x₀)=y₀; C=y₀−F(x₀).'],
  tfc:['integral','Teorema fundamental con límites variables','Derivar una integral usando la regla de la cadena en sus límites.'],
  integrallimit:['integral','Límite de integral de seno por TFC','Familia ∫₀ˣ A·sen(Bt^m)dt dividida por x^(m+1); TFC y L’Hôpital.'],
  comparisonseries:['integral','Serie racional por comparación','Σ(An+B)/(n^k+n), n≥1; comparación explícita con una p-serie.'],
  taylorterms:['integral','Primeros términos de Taylor y aproximación','Elegir términos no nulos y evaluar el polinomio en un punto.'],
  continuity:['differential','Continuidad por tramos','Iguala los límites laterales en cada unión; parámetros lineales.'],
  parametric:['differential','Derivadas paramétricas','dy/dx = y′(t)/x′(t); d²y/dx² = (x′y″−y′x″)/(x′)³.'],
  implicit:['differential','Derivada implícita','F(x,y)=0; dy/dx = −Fx/Fy cuando Fy≠0.'],
  polararea:['integral','Área polar entre curvas','A = ½∫(r exterior²−r interior²)dθ.'],
  arc:['integral','Longitud de arco','L = ∫√(1+f′(x)²)dx.'],
  surface:['integral','Área de superficie de revolución','S = 2π∫radio·√(1+f′²)dx.'],
  series:['integral','Intervalo de serie de potencias','Σₙ₌₁∞((x−c)/R)ⁿ/nᵖ; revisa ambos extremos.'],
  telescoping:['integral','Serie telescópica','1/[n(n+k)] = (1/n−1/(n+k))/k.'],
  region:['multivariable','Integral doble en región variable','∫[xa,xb]∫[yinf(x),ysup(x)] f(x,y)dy dx por puntos medios.'],
  lamina:['multivariable','Lámina: masa, centro e inercia en región y(x)','M = ∫ρ dA; (x̄,ȳ) = (∫xρ dA,∫yρ dA)/M; Iz = ∫(x²+y²)ρ dA.'],
  laminapolar:['multivariable','Lámina polar: masa, centro e inercia','dA = r dr dθ; Iz = ∫r²ρ dA.'],
  triplecart:['multivariable','Integral triple cartesiana','Límites x, y(x), z(x,y); Simpson anidado.'],
  triplecyl:['multivariable','Integral triple cilíndrica','x=r cosθ, y=r senθ; jacobiano r.'],
  triplesph:['multivariable','Integral triple esférica','x=ρ senφ cosθ, y=ρ senφ senθ, z=ρ cosφ; jacobiano ρ² senφ.'],
  paramsurface:['multivariable','Integral sobre superficie paramétrica','∫∫ f(r(u,v)) |rᵤ×rᵥ| du dv; usa f=1 para área.'],
  paramflux:['multivariable','Flujo por superficie orientada','Φ = ∫∫ F(r(u,v)) · (rᵤ×rᵥ) du dv; invertir orientación cambia el signo.'],
  twoconstraints:['multivariable','Extremos con cilindro y plano','Objetivo lineal f=px+qy+sz sujeto a x²+y²=R² y ax+by+cz=d.'],
  planenorm:['multivariable','Mínimo de norma cuadrática sobre plano','Minimiza x²+y²+z² bajo ax+by+cz=d mediante multiplicador y proyección.'],
  harmoniclog:['multivariable','Función radial armónica','Comprueba Δ(k ln r)=0 fuera del origen mediante las dos segundas derivadas.'],
  trilinearpath:['multivariable','Integral de campo conservativo trilineal','F=∇(kxyz); la integral de línea depende solo de los extremos.'],
  plane:['multivariable','Plano tangente','z=f(a,b)+fx(a,b)(x−a)+fy(a,b)(y−b).'],
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
const groups={differential:'Aplicaciones diferenciales',integral:'Aplicaciones integrales',multivariable:'Regiones y superficies',ode:'Métodos de EDO'};
const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const read=key=>document.getElementById(`study-${key}`).value.trim();
function num(key) {const raw=read(key);if(raw===''||!Number.isFinite(Number(raw))) throw new RangeError(`${key}: número finito requerido`);return Number(raw);}
function constant(key) {
  const raw=read(key);
  if(collectVariables(raw).length) throw new RangeError(`${key}: usa una constante numérica`);
  const fn=calcParse(raw),result=fn?fn(0):NaN;
  if(!Number.isFinite(result)) throw new RangeError(`${key}: constante inválida`);
  return result;
}
function one(key,variable='x') {
  const source=read(key),vars=collectVariables(source).filter(name=>name!==variable);
  if(vars.length) throw new RangeError(`${key}: usa solo ${variable}`);
  const fn=calcParse(source,variable);
  if(!fn) throw new RangeError(`${key}: expresión no reconocida`);
  return fn;
}
function two(key) {
  const source=read(key),vars=collectVariables(source).filter(name=>name!=='x');
  if(vars.some(name=>name!=='y')) throw new RangeError(`${key}: usa solo x e y`);
  const fn=calcParse(source,'x');
  if(!fn) throw new RangeError(`${key}: expresión no reconocida`);
  return vars.length?fn:(x,y)=>fn(x);
}
function coordinateFormula(key,first,allowed,argumentsInOrder) {
  const source=read(key),variables=collectVariables(source);
  if(variables.some(name=>!allowed.includes(name))) throw new RangeError(`${key}: usa solo ${allowed.join(', ')}`);
  const parsed=calcParse(source,first);
  if(!parsed) throw new RangeError(`${key}: expresión no reconocida`);
  const extra=variables.filter(name=>name!==first);
  return (...values)=>{
    const scope=Object.fromEntries(argumentsInOrder.map((name,i)=>[name,values[i]]));
    return parsed(scope[first],...extra.map(name=>scope[name]));
  };
}
function nums(key) {
  const list=read(key).split(/[,\s]+/).filter(Boolean).map(Number);
  if(!list.length||list.some(value=>!Number.isFinite(value))) throw new RangeError(`${key}: lista numérica inválida`);
  return list;
}
function polynomialTerms(key) {
  const lines=read(key).split(/[\n;]+/).map(line=>line.trim()).filter(Boolean);
  if(!lines.length||lines.length>30) throw new RangeError(`${key}: introduce de 1 a 30 términos`);
  return lines.map(line=>{
    const values=line.split(/[,\s]+/).filter(Boolean).map(Number);
    if(values.length!==3||values.some(value=>!Number.isFinite(value))) throw new RangeError(`${key}: usa coeficiente, potencia x, potencia y`);
    return values;
  });
}
function solve(mode) {
  if(mode==='oclassify')return odeClassification(read('equation'));
  if(mode==='ohomogeneous')return homogeneousSecondOrderStudy(num('damping'),num('stiffness'),num('y0'),num('v0'),num('x'));
  if(mode==='opolyexp')return polynomialExponentialSecondOrder(num('damping'),num('stiffness'),num('rate'),nums('coefficients'),num('y0'),num('v0'),num('x'));
  if(mode==='ofamily')return familyEquation(read('kind'),num('rate'),nums('point'));
  if(mode==='osubstitution')return sumSubstitution(num('a'),num('b'),num('c'),num('d'),num('x'),num('y'));
  if(mode==='ovarreciprocal')return variationRepeatedReciprocal(num('root'),num('amplitude'),num('c0'),num('c1'),num('x'));
  if(mode==='ovartan')return variationTangent(num('amplitude'),num('omega'),num('c0'),num('c1'),num('x'));
  if(mode==='oforcedsystem'){
    const a=nums('matrix');if(a.length!==4)throw new RangeError('Matriz de cuatro componentes');
    return affineForcedSystem([a.slice(0,2),a.slice(2)],nums('forcingSlope'),nums('forcingConstant'),nums('initial'),num('time'));
  }

  if(mode==='mplane')return planeFromPointNormal(nums('point'),nums('normal'));
  if(mode==='mline')return lineStudy(read('field').split(/[;\n]+/).map(x=>x.trim()).filter(Boolean),read('maps').split(/[;\n]+/).map(x=>x.trim()).filter(Boolean),num('start'),constant('end'),read('type'),num('n'));
  if(mode==='mvectors'){
    const u=nums('u'),v=nums('v'),result=vectorApplications(u,v),normV=Math.hypot(...v);
    return {...result,normV,angleDegrees:result.norm&&normV?Math.acos(Math.max(-1,Math.min(1,result.dot/(result.norm*normV))))*180/Math.PI:null};
  }
  if(mode==='mdifferential')return differentialStudy(read('expr'),read('variables').split(/[,\s]+/).filter(Boolean),nums('point'),read('direction')?nums('direction'):null);
  if(mode==='mlimit')return multivariableLimit(read('expr'),num('x'),num('y'));
  if(mode==='mimplicit')return implicitSurfaceStudy(read('expr'),nums('point'));
  if(mode==='mchain')return chainRuleStudy(read('expr'),read('maps').split(/[;\n]+/).map(x=>x.trim()).filter(Boolean),read('variables').split(/[,\s]+/).filter(Boolean),nums('point'));
  if(mode==='mjacobian')return jacobianStudy(read('maps').split(/[;\n]+/).map(x=>x.trim()).filter(Boolean),nums('point'));
  if(mode==='mcurve')return curveStudy(read('maps').split(/[;\n]+/).map(x=>x.trim()).filter(Boolean),num('time'),num('start'),constant('end'),num('n'));
  if(mode==='mpotential')return polynomialPotentialStudy(read('fieldX'),read('fieldY'),nums('from'),nums('to'));
  if(mode==='mcritical')return polynomialCriticalStudy(read('expr'));
  if(mode==='mconstraint')return constrainedQuadraticStudy(read('expr'),read('constraint'),num('constant'));
  if(mode==='mgreen'){
    const polar=read('coordinates')==='polar';return greenRegionStudy(read('fieldX'),read('fieldY'),num('start'),constant('end'),
      polar?coordinateFormula('lower','theta',['theta'],['theta']):one('lower'),polar?coordinateFormula('upper','theta',['theta'],['theta']):one('upper'),num('n'),read('coordinates'),read('orientation'));
  }
  if(mode==='mpolar'){
    const f=two('integrand'),lower=coordinateFormula('lower','theta',['theta'],['theta']),upper=coordinateFormula('upper','theta',['theta'],['theta']);
    const integrand=(theta,r)=>{if(r<0)throw new RangeError('Radio negativo');return f(r*Math.cos(theta),r*Math.sin(theta))*r;};
    const result=integrateVariableRegion(integrand,num('start'),constant('end'),lower,upper,num('nx'),num('ny'));
    const coarse=integrateVariableRegion(integrand,num('start'),constant('end'),lower,upper,num('nx')/2,num('ny')/2);
    return {...result,coarse:coarse.value,refinementDifference:Math.abs(result.value-coarse.value),formula:'∫∫ f(r cosθ,r senθ) r dr dθ; jacobiano r'};
  }

  if(mode==='linearization')return tangentDifferential(read('expr'),num('x0'),num('increment'));
  if(mode==='functionanalysis')return rationalFunctionAnalysis(read('expr'),{start:num('start'),end:num('end'),closedInterval:read('scope')==='intervalo'});
  if(mode==='exponentialanalysis')return polynomialExponentialAnalysis(read('expr'),num('rate'));
  if(mode==='theorem')return theoremCheck(read('expr'),num('start'),num('end'),read('kind'));
  if(mode==='theoremcases')return theoremCase(read('case'));
  if(mode==='reciprocalminimum')return positiveReciprocalMinimum(num('a'),num('b'),num('p'),num('q'));
  if(mode==='ellipserectangle')return maximalEllipseRectangle(num('a'),num('b'));
  if(mode==='cylinderminimum')return cylinderAreaMinimum(num('volume'),num('lids'));
  if(mode==='nearestparabola')return nearestParabolaPoints(num('a'),num('u'),num('v'));
  if(mode==='sineparameter')return stationarySineCoefficient(num('b'),num('frequency'),constant('point'));
  if(mode==='exponentialparameter')return exponentialLimitCoefficient(num('target'));
  if(mode==='primitivepvi')return antiderivativeInitialValue(read('expr'),num('x0'),num('y0'),num('x'));
  if(mode==='tfc')return fundamentalIntegralDerivative(read('expr'),read('lower'),read('upper'),num('x'));
  if(mode==='integrallimit')return sineIntegralLimit(num('amplitude'),num('rate'),num('power'));
  if(mode==='comparisonseries')return rationalSeriesComparison(num('a'),num('b'),num('power'));
  if(mode==='taylorterms')return firstTaylorTerms(read('expr'),constant('center'),num('terms'),num('x'));
  if(mode==='continuity') return piecewiseContinuity(read('segments').split(/[\n;]+/).map(text=>text.trim()).filter(Boolean),nums('cuts'));
  if(mode==='parametric')return symbolicParametricDerivatives(read('xexpr'),read('yexpr'),constant('time'));
  if(mode==='implicit') return implicitSlope(two('expr'),num('x'),num('y'),num('step'));
  if(mode==='polararea') return polarAreaBetween(one('outer'),one('inner'),num('start'),num('end'),num('n'));
  if(mode==='arc') return curveMeasureExpression(read('expr'),num('start'),num('end'),'arc','x',num('n'));
  if(mode==='surface') return curveMeasureExpression(read('expr'),num('start'),num('end'),'surface',read('axis'),num('n'));
  if(mode==='series') return powerSeriesInterval(num('center'),num('radius'),num('power'));
  if(mode==='telescoping') return telescopingOffset(num('offset'));
  if(mode==='region'){const f=two('integrand'),swapped=read('order')==='dx-dy',lower=swapped?one('lower','y'):one('lower'),upper=swapped?one('upper','y'):one('upper');const result=integrateVariableRegion(swapped?(y,x)=>f(x,y):f,num('start'),num('end'),lower,upper,num('nx'),num('ny'));return {...result,formula:swapped?'∫[ya,yb]∫[xinf(y),xsup(y)] f(x,y) dx dy; jacobiano 1':result.formula+'; jacobiano 1'};}
  if(mode==='lamina') return laminaProperties(two('density'),'cartesian',num('start'),num('end'),one('lower'),one('upper'),num('nx'),num('ny'));
  if(mode==='laminapolar') return laminaProperties(two('density'),'polar',num('start'),constant('end'),
    coordinateFormula('lower','theta',['theta'],['theta']),coordinateFormula('upper','theta',['theta'],['theta']),num('nx'),num('ny'));
  if(mode.startsWith('triple')) {
    const coordinates=mode==='triplecart'?'cartesian':mode==='triplecyl'?'cylindrical':'spherical';
    const [outer,middle]=coordinates==='cartesian'?['x','y']:coordinates==='cylindrical'?['r','theta']:['rho','phi'];
    return integrateTripleRegion(
      coordinateFormula('integrand3','x',['x','y','z'],['x','y','z']),coordinates,
      num('outerStart'),num('outerEnd'),
      coordinateFormula('middleLower',outer,[outer],[outer]),coordinateFormula('middleUpper',outer,[outer],[outer]),
      coordinateFormula('innerLower',outer,[outer,middle],[outer,middle]),coordinateFormula('innerUpper',outer,[outer,middle],[outer,middle]),num('n3'));
  }
  if(mode==='paramsurface') {
    const x=coordinateFormula('xexpr','u',['u','v'],['u','v']);
    const y=coordinateFormula('yexpr','u',['u','v'],['u','v']);
    const z=coordinateFormula('zexpr','u',['u','v'],['u','v']);
    return integrateParametricSurface((u,v)=>[x(u,v),y(u,v),z(u,v)],
      coordinateFormula('integrand3','x',['x','y','z'],['x','y','z']),
      num('uStart'),constant('uEnd'),num('vStart'),constant('vEnd'),num('n2'));
  }
  if(mode==='paramflux') {
    const x=coordinateFormula('xexpr','u',['u','v'],['u','v']);
    const y=coordinateFormula('yexpr','u',['u','v'],['u','v']);
    const z=coordinateFormula('zexpr','u',['u','v'],['u','v']);
    const fx=coordinateFormula('fieldX','x',['x','y','z'],['x','y','z']);
    const fy=coordinateFormula('fieldY','x',['x','y','z'],['x','y','z']);
    const fz=coordinateFormula('fieldZ','x',['x','y','z'],['x','y','z']);
    return integrateParametricFlux((u,v)=>[x(u,v),y(u,v),z(u,v)],
      (px,py,pz)=>[fx(px,py,pz),fy(px,py,pz),fz(px,py,pz)],
      num('uStart'),constant('uEnd'),num('vStart'),constant('vEnd'),num('n2'),read('orientation'));
  }
  if(mode==='twoconstraints') return linearObjectiveCylinderPlane(num('radiusSquared'),
    [num('planeA'),num('planeB'),num('planeC'),num('planeD')],
    [num('objectiveX'),num('objectiveY'),num('objectiveZ')]);
  if(mode==='planenorm') return minimumNormOnPlane([num('planeA'),num('planeB'),num('planeC')],num('planeD'));
  if(mode==='harmoniclog') return logarithmicRadialHarmonic(num('scale'),num('x'),num('y'));
  if(mode==='trilinearpath') return trilinearPotentialIntegral(num('coefficient'),nums('from'),nums('to'));
  if(mode==='plane') return tangentPlane(two('expr'),num('x'),num('y'),num('step'));
  if(mode==='separable') return separablePower(num('a'),num('xp'),num('yp'),num('x0'),num('y0'),num('x'));
  if(mode==='linearode') return linearFirstOrder(num('p'),num('q'),num('x0'),num('y0'),num('x'));
  if(mode==='linearvariable') return linearPowerCoefficient(num('a'),num('b'),num('m'),num('x0'),num('y0'),num('x'));
  if(mode==='bernoulli') return bernoulliConstant(num('p'),num('q'),num('power'),num('x0'),num('y0'),num('x'));
  if(mode==='bernoullilinear') return bernoulliLinearForcing(num('p'),num('q'),num('constant'),num('x'));
  if(mode==='exactode'&&read('factorMode')==='search') return inferMonomialFactor(polynomialTerms('mterms'),polynomialTerms('nterms'));
  if(mode==='exactode') return exactPolynomialForm(polynomialTerms('mterms'),polynomialTerms('nterms'),num('factorX'),num('factorY'));
  if(mode==='logistic') return logisticGrowth(num('rate'),num('capacity'),num('x0'),num('y0'),num('x'));
  if(mode==='cooling') return thermalRelaxation(num('ambient'),num('initialTemperature'),num('observedTemperature'),num('observationTime'),num('time'));
  if(mode==='rlcircuit') return rlCurrent(num('inductance'),num('resistance'),num('voltage'),num('initialCurrent'),num('time'));
  if(mode==='orthogonal') return orthogonalPowerTrajectories(num('power'),num('x'),num('y'));
  if(mode==='thirdrepeated') return thirdOrderRepeatedRoot(num('root'),num('amplitude'),num('c0'),num('c1'),num('c2'),num('x'));
  if(mode==='forced') return forcedSecondOrder(num('damping'),num('stiffness'),num('force'),num('omega'),num('y0'),num('v0'),num('time'));
  if(mode==='systemode') {
    const values=nums('matrix'),initial=nums('initial');
    if(values.length!==4||initial.length!==2) throw new RangeError('Matriz de 4 y vector de 2 números requeridos');
    return linearSystem2D([[values[0],values[1]],[values[2],values[3]]],initial,num('time'));
  }
  if(mode==='laplacesystem') {
    const values=nums('matrix'),initial=nums('initial');
    if(values.length!==4||initial.length!==2) throw new RangeError('Matriz de 4 y vector de 2 números requeridos');
    return laplaceSystem2D([[values[0],values[1]],[values[2],values[3]]],initial,num('time'));
  }
  if(mode==='eigenmodes') {
    const initial=nums('initial');
    return symmetricSystemModes(num('diagonal'),num('coupling'),initial,num('time'));
  }
  if(mode==='laplace') return laplaceTable(read('kind'),num('parameter'));
  if(mode==='laplacesum') return laplaceExponentialPlusTime(num('rate'),num('timeCoefficient'));
  if(mode==='laplaceinversepower') return inverseLaplaceShiftedPower(num('coefficient'),num('shift'),num('order'),num('time'));
  if(mode==='laplaceinversequadratic') return inverseLaplaceQuadratic(num('numeratorSlope'),num('numeratorConstant'),num('linearCoefficient'),num('constantCoefficient'),num('time'));
  if(mode==='laplacefirstorder') return firstOrderExponentialForcing(num('p'),num('amplitude'),num('rate'),num('initialValue'),num('time'));
  if(mode==='laplaceharmonic') return laplaceSecondOrderHarmonic(num('damping'),num('stiffness'),num('cosineForce'),num('sineForce'),num('omega'),num('y0'),num('v0'),num('time'));
  if(mode==='laplacerepeated') return laplaceRepeatedRootForcing(num('root'),num('amplitude'),num('power'),num('y0'),num('v0'),num('time'));
  throw new RangeError('Operación no disponible');
}
const labels={caso:'Caso',failure:'Hipótesis que falla',conclusionHolds:'¿Existe c?',lesson:'Lección',converges:'converge',absolute:'absoluta',parameters:'Parámetros',status:'Estado',values:'Valores particulares',freeParameters:'Parámetros libres',nullspace:'Direcciones libres',equations:'Ecuaciones en las uniones',checks:'Comprobación izquierda/derecha',assumption:'Hipótesis',x:'x',y:'y',dxdt:'dx/dt',dydt:'dy/dt',d2xdt2:'d²x/dt²',d2ydt2:'d²y/dt²',dydx:'dy/dx',d2ydx2:'d²y/dx²',step:'Paso h',residual:'F(x,y)',fx:'Fx',fy:'Fy',slope:'dy/dx',area:'Área',length:'Longitud',subintervals:'Subintervalos',formula:'Fórmula',radius:'Radio',openInterval:'Intervalo abierto',leftEndpoint:'Extremo izquierdo',rightEndpoint:'Extremo derecho',sum:'Suma',decomposition:'Descomposición',value:'Valor',coarse:'Malla n/2',refinementDifference:'Diferencia entre mallas',nx:'Divisiones en x',ny:'Divisiones en y',point:'Punto',gradient:'Gradiente',normal:'Normal',derivative:'Derivada',equilibrium:'Equilibrio',integralXPower:'Integral de xᵖ',transformed:'Variable transformada',homogeneous:'Parte homogénea',particular:'Solución particular',constants:'Constantes',regime:'Régimen',resonant:'Resonancia',matrixExponential:'e^(At)',transform:'Transformada',domain:'Dominio'};
Object.assign(labels,{mass:'Masa',centerX:'Centro de masa x̄',centerY:'Centro de masa ȳ',firstMomentX:'Momento ∫x dm',firstMomentY:'Momento ∫y dm',inertiaX:'Momento Ix = ∫y² dm',inertiaY:'Momento Iy = ∫x² dm',inertiaZ:'Momento Iz = ∫(x²+y²) dm',coarseMass:'Masa con malla gruesa',massRefinementDifference:'Diferencia de masa entre mallas',inertiaRefinementDifference:'Diferencia de Iz entre mallas'});
Object.assign(labels,{flux:'Flujo orientado',orientation:'Orientación',minimum:'Mínimo global',maximum:'Máximo global'});
Object.assign(labels,{laplacian:'Laplaciano Δu',secondDerivatives:'Derivadas uxx, uyy',fromPotential:'Potencial inicial',toPotential:'Potencial final',lineIntegral:'Integral de línea',curl:'Rotacional'});
Object.assign(labels,{potentialTerms:'Términos del potencial Ψ',implicitSolution:'Solución implícita',factor:'Factor integrante aplicado'});
Object.assign(labels,{expression:'Solución en tiempo',shift:'Desplazamiento p/2',frequency:'Frecuencia (rad/s)'});
Object.assign(labels,{solution:'Solución y(x)',constantValue:'C desde la condición inicial',integratingFactor:'Factor integrante',integral:'Integral de la fuerza transformada',denominator:'Denominador de la rama'});
Object.assign(labels,{rate:'Constante k',timeConstant:'Constante de tiempo'});
Object.assign(labels,{originalSlope:'Pendiente original',orthogonalSlope:'Pendiente ortogonal',constant:'Constante C en el punto',secondDerivative:'Segunda derivada',thirdDerivative:'Tercera derivada'});
Object.assign(labels,{transformX:'Transformada X(s)',transformY:'Transformada Y(s)',eigenvalues:'Autovalores',eigenvectors:'Autovectores',coefficients:'Coeficientes modales'});
Object.assign(labels,{initialValue:'Verificación y(x₀)',steps:'Pasos',derivativeFormula:'Fórmula de la derivada',upperTerm:'Término del límite superior',lowerTerm:'Término del límite inferior',limit:'Límite',comparisonPower:'Exponente de comparación',bound:'Desigualdad',polynomial:'Polinomio',terms:'Términos: orden y coeficiente',reference:'Valor de f en el punto',absoluteError:'Error absoluto en el punto'});
Object.assign(labels,{intercept:'Intersección con eje y',tangent:'Recta tangente',differential:'Diferencial dy',approximation:'Aproximación lineal',exact:'Valor evaluado',actualChange:'Cambio real Δy',firstDerivatives:'Derivadas x′, y′',criticalPoints:'Puntos críticos',monotonicity:'Signos de f′ y monotonía',concavity:'Signos de f″ y concavidad',inflections:'Inflexiones',discontinuities:'Discontinuidades y límites laterales',excluded:'Puntos excluidos',symmetry:'Simetría',asymptote:'Asíntota: coeficientes desde término constante',asymptoteType:'Tipo de asíntota',extrema:'Comparación de extremos',candidates:'Todos los candidatos',points:'Puntos solución',coefficient:'Coeficiente a',coefficients:'Coeficientes',type:'Clasificación',before:'Signo a la izquierda',after:'Signo a la derecha',left:'Extremo izquierdo / límite izquierdo',right:'Extremo derecho / límite derecho',sign:'Signo',trend:'Comportamiento',distanceSquared:'Distancia²',distance:'Distancia mínima',width:'Ancho',height:'Altura',maximumArea:'Área máxima',minimumArea:'Área mínima',vertex:'Vértice',fa:'f(a)',fb:'f(b)',allPoints:'Conjunto solución'});
Object.assign(labels,{order:'Orden',degree:'Grado',linear:'Lineal',characteristic:'Ecuación característica',generalSolution:'Familia general',initialCheck:'Comprobación de condiciones iniciales',resonanceOrder:'Multiplicidad de resonancia',particularCoefficients:'Coeficientes de la particular',particularExpression:'Expresión de la particular',steps:'Pasos',equation:'Ecuación',family:'Familia',u:'u=x+y',elimination:'EDO por eliminación',particularSlope:'Pendiente de la particular',particularConstant:'Constante de la particular',constant:'Constante',partials:'Derivadas parciales',hessianFormulas:'Fórmulas del Hessiano',hessian:'Hessiano',maximumRate:'Tasa máxima',maximumDirection:'Dirección de crecimiento máximo',unitDirection:'Dirección unitaria',directionalDerivative:'Derivada direccional',dzdx:'∂z/∂x',dzdy:'∂z/∂y',outerPartials:'Parciales de la función exterior',outerGradient:'Gradiente exterior',jacobianFormulas:'Fórmulas del Jacobiano',jacobian:'Jacobiano',derivatives:'Derivadas por cadena',formulas:'Fórmulas',matrix:'Matriz',determinant:'Determinante',absoluteJacobian:'Valor absoluto del Jacobiano',position:'Posición',velocity:'Velocidad',acceleration:'Aceleración',velocityFormulas:'Derivadas de velocidad',accelerationFormulas:'Derivadas de aceleración',proof:'Justificación',conservative:'Campo conservativo',potential:'Potencial',curl:'Qₓ−Pᵧ',plane:'Plano tangente',lambda:'Multiplicador λ',otherExtreme:'Otro extremo',dot:'Producto escalar',cross:'Producto vectorial',norm:'Norma de u',normU:'Norma de u',normV:'Norma de v',angleDegrees:'Ángulo (grados)'});
const differentialModes=new Set(['theoremcases','oclassify','ohomogeneous','opolyexp','ofamily','osubstitution','ovarreciprocal','ovartan','oforcedsystem','mplane','mline','mvectors','mdifferential','mlimit','mimplicit','mchain','mjacobian','mcurve','mpotential','mcritical','mconstraint','mgreen','mpolar','linearization','functionanalysis','exponentialanalysis','theorem','reciprocalminimum','ellipserectangle','cylinderminimum','nearestparabola','sineparameter','exponentialparameter','parametric']);
const differentialFmt=value=>value===Infinity?'+∞':value===-Infinity?'−∞':value===null?'no aplica':
  Array.isArray(value)?(value.length&&value.every(item=>typeof item==='string')?value.join(' '):`[${value.map(differentialFmt).join(', ')}]`):value&&typeof value==='object'?Object.entries(value).map(([key,item])=>`${labels[key]||key}: ${differentialFmt(item)}`).join('; '):fmt(value);
const fmt=value=>value===null?'sin solución':typeof value==='boolean'?(value?'sí':'no'):typeof value==='number'?(Number.isFinite(value)?String(Number(value.toPrecision(10))):'indefinido'):
  Array.isArray(value)?(value.length&&value.every(item=>typeof item==='string')?value.join(' '):`[${value.map(fmt).join(', ')}]`):typeof value==='object'?Object.entries(value).map(([key,item])=>`${labels[key]||key}: ${fmt(item)}`).join('; '):String(value);
export function studyOpenPanel(group) {
  if(!groups[group]) return;
  document.getElementById('study-title').textContent=groups[group];
  document.getElementById('study-heading').textContent=groups[group];
  document.getElementById('study-mode').innerHTML=Object.entries(modes).filter(([,config])=>config[0]===group)
    .map(([key,config])=>`<option value="${key}">${config[1]}</option>`).join('');
  studySelect();
}
export function studySelect() {
  const mode=document.getElementById('study-mode').value;
  if(!fields[mode]) return;
  document.getElementById('study-fields').innerHTML=fields[mode].map(([key,label,defaultValue,type,options])=>
    `<label class="linear-field" for="study-${key}"><span>${label}</span>${type==='textarea'?`<textarea id="study-${key}" class="tool-textarea" rows="4">${defaultValue}</textarea>`:
      type==='select'?`<select id="study-${key}" class="tool-input">${options.split(',').map(option=>{const cut=option.indexOf('='),value=cut<0?option:option.slice(0,cut),text=cut<0?option:option.slice(cut+1);return `<option value="${value}">${text}</option>`;}).join('')}</select>`:
        `<input id="study-${key}" class="tool-input" type="${type==='text'?'text':'number'}" step="any" value="${defaultValue}">`}</label>`).join('');
  document.getElementById('study-result').textContent='';
  studyPreviewInputs();
}
export function studyCalculate() {
  const mode=document.getElementById('study-mode').value,target=document.getElementById('study-result');
  try {
    const data=solve(mode),format=differentialModes.has(mode)?differentialFmt:fmt;
    const graph=mode==='functionanalysis'?functionAnalysisSvg(data,{start:num('start'),end:num('end'),minimum:num('minimumY'),maximum:num('maximumY')}):mode==='theorem'||mode==='theoremcases'?theoremPlot(mode,data):studyRegionPlot(mode);
    target.classList.remove('tool-error');
    target.innerHTML=`<div class="tool-result-title">${modes[mode][1]}</div><p>${modes[mode][2]}</p><dl class="mechplus-results">${Object.entries(data).map(([key,value])=>`<dt>${key==='expression'&&mode==='functionanalysis'?'Función':key==='slope'&&mode.startsWith('theorem')?'Pendiente de la secante':labels[key]||escapeHtml(key)}</dt><dd>${escapeHtml(format(value))}</dd>`).join('')}</dl>${graph}`;
  } catch(error) {target.classList.add('tool-error');target.textContent=error.message;}
}

// f en [a,b], la secante y las tangentes en los c hallados.
function theoremPlot(mode,data){
  const id=mode==='theoremcases'?read('case'):null;let curve;
  try{curve=theoremCurve(id,id?null:read('expr'),id?null:num('start'),id?null:num('end'));}catch{return '';}
  const series=curve.pieces.map((points,i)=>({label:i?'f(x), otro tramo':'f(x)',points}));
  if(curve.dots.length)series.push({label:'Valor aislado f(1) = 0',points:curve.dots});
  const fa=Number(data.fa),fb=Number(data.fb),slope=Number(data.slope);
  if(Number.isFinite(fa)&&Number.isFinite(fb))series.push({label:'Secante',points:[[curve.start,fa],[curve.end,fb]]});
  if(Number.isFinite(slope)&&curve.f)for(const c of (Array.isArray(data.points)?data.points:[]).slice(0,2)){const y=curve.f(c),w=(curve.end-curve.start)*.16;series.push({label:`Tangente en c = ${fmt(c)}`,points:[[c-w,y-slope*w],[c+w,y+slope*w]]});}
  return studyPlotSvg(series.slice(0,6),{title:'f, secante y tangentes en c'});
}

function studyRegionPlot(mode){
 const cartesian=['region','lamina'].includes(mode)||mode==='mgreen'&&read('coordinates')==='cartesian',polar=['mpolar','laminapolar'].includes(mode)||mode==='mgreen'&&read('coordinates')==='polar';
 if(!cartesian&&!polar)return '';
 const a=constant('start'),b=constant('end'),lo=polar?coordinateFormula('lower','theta',['theta'],['theta']):one('lower',mode==='region'&&read('order')==='dx-dy'?'y':'x'),hi=polar?coordinateFormula('upper','theta',['theta'],['theta']):one('upper',mode==='region'&&read('order')==='dx-dy'?'y':'x'),n=100;
 const point=(t,r)=>polar?[r*Math.cos(t),r*Math.sin(t)]:mode==='region'&&read('order')==='dx-dy'?[r,t]:[t,r];
 const upper=Array.from({length:n+1},(_,i)=>{const t=a+(b-a)*i/n;return point(t,hi(t));}),lower=Array.from({length:n+1},(_,i)=>{const t=b-(b-a)*i/n;return point(t,lo(t));});
 const points=cartesian?[...lower.slice().reverse(),...upper.slice().reverse()]:[...upper,...lower];points.push(points[0]);if(mode==='mgreen'&&read('orientation')==='negative')points.reverse();
 return studyPlotSvg([{label:polar?'Frontera polar; dA=r dr dθ':mode==='region'&&read('order')==='dx-dy'?'Frontera cartesiana; dA=dx dy':'Frontera cartesiana; dA=dy dx',points}],{title:'Región de integración en el plano xy',xLabel:'x',yLabel:'y'});
}

export function studyPreviewInputs(){
 const config=fields[document.getElementById('study-mode').value];if(!config)return;
 const expressionKeys=new Set(['expr','equation','maps','field','fieldX','fieldY','fieldZ','integrand','integrand3','density','lower','upper','middleLower','middleUpper','innerLower','innerUpper','xexpr','yexpr','zexpr','outer','inner','segments']);
 const entries=config.filter(([key])=>expressionKeys.has(key)).map(([key,label])=>{const source=read(key),variables=collectVariables(source);return `${escapeHtml(label)}: <code>${escapeHtml(normalizeExpression(source))}</code>${variables.length?` (variables: ${escapeHtml(variables.join(', '))})`:''}`;});
 const target=document.getElementById('study-preview');if(target)target.innerHTML=entries.length?`<details><summary>Entrada normalizada</summary>${entries.map(line=>`<p>${line}</p>`).join('')}<p>Las condiciones de dominio y el alcance se comprueban al calcular.</p></details>`:'';
}
