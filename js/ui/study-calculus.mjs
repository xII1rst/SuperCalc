import { calcParse, collectVariables } from '../math/expression.mjs';
import { piecewiseContinuity, parametricDerivatives, implicitSlope, polarAreaBetween, curveArcLength,
  surfaceOfRevolution, integrateVariableRegion, laminaProperties, integrateTripleRegion, integrateParametricSurface,
  integrateParametricFlux, linearObjectiveCylinderPlane, minimumNormOnPlane, logarithmicRadialHarmonic, trilinearPotentialIntegral, tangentPlane, powerSeriesInterval, telescopingOffset } from '../math/study-calculus.mjs';
import { separablePower, linearFirstOrder, linearPowerCoefficient, bernoulliConstant, bernoulliLinearForcing, exactPolynomialForm, logisticGrowth, thermalRelaxation, rlCurrent, orthogonalPowerTrajectories, thirdOrderRepeatedRoot, forcedSecondOrder, linearSystem2D, laplaceSystem2D, symmetricSystemModes,
  laplaceTable, laplaceExponentialPlusTime, inverseLaplaceShiftedPower, inverseLaplaceQuadratic, firstOrderExponentialForcing,
  laplaceSecondOrderHarmonic, laplaceRepeatedRootForcing } from '../math/study-ode.mjs';

const fields={
  continuity:[['segments','Tramos, uno por línea; usa * para productos con parámetros','x^2+k\n3*x-1','textarea'],['cuts','Uniones x, separadas por coma','2','text']],
  parametric:[['xexpr','x(t)','t^2-1','text'],['yexpr','y(t)','t^3+t','text'],['time','t','1'],['step','Paso h','0.0001']],
  implicit:[['expr','F(x,y) = 0','x^2+y^2-25','text'],['x','x','3'],['y','y','4'],['step','Paso h','0.00001']],
  polararea:[['outer','Radio exterior r(θ)','3*cos(x)','text'],['inner','Radio interior r(θ)','0','text'],['start','θ inicial (rad)','-1.5707963267948966'],['end','θ final (rad)','1.5707963267948966'],['n','Subintervalos pares (4–1000)','400']],
  arc:[['expr','y=f(x)','x^(3/2)','text'],['start','x inicial','0'],['end','x final','4'],['n','Subintervalos pares','400']],
  surface:[['expr','y=f(x), no negativa al girar alrededor de x','x^3','text'],['start','x inicial','0'],['end','x final','1'],['axis','Eje x o y','x','select','x,y'],['n','Subintervalos pares','400']],
  series:[['center','Centro c','2'],['radius','Radio R','2'],['power','Exponente p de nᵖ','2']],
  telescoping:[['offset','Desplazamiento entero k en 1/[n(n+k)]','2']],
  region:[['integrand','f(x,y)','x*y','text'],['lower','y inferior(x)','x^2','text'],['upper','y superior(x)','x','text'],['start','x inicial','0'],['end','x final','1'],['nx','Divisiones en x (2–400)','80'],['ny','Divisiones en y (2–400)','80']],
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
  separable:[['a','Coeficiente a','2'],['xp','Potencia p de x','1'],['yp','Potencia q de y','1'],['x0','x inicial','0'],['y0','y inicial positiva','1'],['x','x final','1']],
  linearode:[['p','p constante en y′+py=q','2'],['q','q constante','6'],['x0','x inicial','0'],['y0','y inicial','1'],['x','x final','1']],
  linearvariable:[['a','a en y′+(a/x)y=b·x^m','2'],['b','b','1'],['m','Exponente m','3'],['x0','x inicial > 0','1'],['y0','y(x₀)','0'],['x','x final > 0','2']],
  bernoulli:[['p','p en y′+py=qyⁿ','1'],['q','q','1'],['power','n','2'],['x0','x inicial','0'],['y0','y inicial positiva','2'],['x','x final','0.5']],
  bernoullilinear:[['p','p en y′+py=qxy²','1'],['q','q','1'],['constant','Constante C de la solución general','0'],['x','x para evaluar','1']],
  exactode:[['mterms','M(x,y): coeficiente, potencia x, potencia y; una fila por término','2, 1, 0\n1, 0, 1','textarea'],['nterms','N(x,y): coeficiente, potencia x, potencia y','1, 1, 0\n2, 0, 1','textarea'],['factorX','Exponente a del factor μ = x^a y^b','0'],['factorY','Exponente b','0']],
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
  linearvariable:['ode','EDO lineal con coeficiente a/x','y′+(a/x)y=b x^m, x>0; factor integrante μ=x^a y condición inicial en x₀>0.'],
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
  if(mode==='continuity') return piecewiseContinuity(read('segments').split(/[\n;]+/).map(text=>text.trim()).filter(Boolean),nums('cuts'));
  if(mode==='parametric') return parametricDerivatives(one('xexpr','t'),one('yexpr','t'),num('time'),num('step'));
  if(mode==='implicit') return implicitSlope(two('expr'),num('x'),num('y'),num('step'));
  if(mode==='polararea') return polarAreaBetween(one('outer'),one('inner'),num('start'),num('end'),num('n'));
  if(mode==='arc') return curveArcLength(one('expr'),num('start'),num('end'),num('n'));
  if(mode==='surface') return surfaceOfRevolution(one('expr'),num('start'),num('end'),read('axis'),num('n'));
  if(mode==='series') return powerSeriesInterval(num('center'),num('radius'),num('power'));
  if(mode==='telescoping') return telescopingOffset(num('offset'));
  if(mode==='region') return integrateVariableRegion(two('integrand'),num('start'),num('end'),one('lower'),one('upper'),num('nx'),num('ny'));
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
const labels={parameters:'Parámetros',status:'Estado',values:'Valores particulares',freeParameters:'Parámetros libres',nullspace:'Direcciones libres',equations:'Ecuaciones en las uniones',checks:'Comprobación izquierda/derecha',assumption:'Hipótesis',x:'x',y:'y',dxdt:'dx/dt',dydt:'dy/dt',d2xdt2:'d²x/dt²',d2ydt2:'d²y/dt²',dydx:'dy/dx',d2ydx2:'d²y/dx²',step:'Paso h',residual:'F(x,y)',fx:'Fx',fy:'Fy',slope:'dy/dx',area:'Área',length:'Longitud',subintervals:'Subintervalos',formula:'Fórmula',radius:'Radio',openInterval:'Intervalo abierto',leftEndpoint:'Extremo izquierdo',rightEndpoint:'Extremo derecho',sum:'Suma',decomposition:'Descomposición',value:'Valor',coarse:'Malla n/2',refinementDifference:'Diferencia entre mallas',nx:'Divisiones en x',ny:'Divisiones en y',point:'Punto',gradient:'Gradiente',normal:'Normal',derivative:'Derivada',equilibrium:'Equilibrio',integralXPower:'Integral de xᵖ',transformed:'Variable transformada',homogeneous:'Parte homogénea',particular:'Solución particular',constants:'Constantes',regime:'Régimen',resonant:'Resonancia',matrixExponential:'e^(At)',transform:'Transformada',domain:'Dominio'};
Object.assign(labels,{mass:'Masa',centerX:'Centro de masa x̄',centerY:'Centro de masa ȳ',firstMomentX:'Momento ∫x dm',firstMomentY:'Momento ∫y dm',inertiaX:'Momento Ix = ∫y² dm',inertiaY:'Momento Iy = ∫x² dm',inertiaZ:'Momento Iz = ∫(x²+y²) dm',coarseMass:'Masa con malla gruesa',massRefinementDifference:'Diferencia de masa entre mallas',inertiaRefinementDifference:'Diferencia de Iz entre mallas'});
Object.assign(labels,{flux:'Flujo orientado',orientation:'Orientación',minimum:'Mínimo global',maximum:'Máximo global'});
Object.assign(labels,{laplacian:'Laplaciano Δu',secondDerivatives:'Derivadas uxx, uyy',fromPotential:'Potencial inicial',toPotential:'Potencial final',lineIntegral:'Integral de línea',curl:'Rotacional'});
Object.assign(labels,{potentialTerms:'Términos del potencial Ψ',implicitSolution:'Solución implícita',factor:'Factor integrante aplicado'});
Object.assign(labels,{expression:'Solución en tiempo',shift:'Desplazamiento p/2',frequency:'Frecuencia (rad/s)'});
Object.assign(labels,{solution:'Solución y(x)',generalSolution:'Familia general',constantValue:'C desde la condición inicial',integratingFactor:'Factor integrante',integral:'Integral de la fuerza transformada',denominator:'Denominador de la rama'});
Object.assign(labels,{rate:'Constante k',timeConstant:'Constante de tiempo'});
Object.assign(labels,{originalSlope:'Pendiente original',orthogonalSlope:'Pendiente ortogonal',constant:'Constante C en el punto',secondDerivative:'Segunda derivada',thirdDerivative:'Tercera derivada'});
Object.assign(labels,{transformX:'Transformada X(s)',transformY:'Transformada Y(s)',eigenvalues:'Autovalores',eigenvectors:'Autovectores',coefficients:'Coeficientes modales'});
const fmt=value=>value===null?'sin solución':typeof value==='number'?(Number.isFinite(value)?String(Number(value.toPrecision(10))):'indefinido'):
  Array.isArray(value)?`[${value.map(fmt).join(', ')}]`:typeof value==='object'?Object.entries(value).map(([key,item])=>`${key}: ${fmt(item)}`).join('; '):String(value);
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
      type==='select'?`<select id="study-${key}" class="tool-input">${options.split(',').map(option=>`<option value="${option}">${option}</option>`).join('')}</select>`:
        `<input id="study-${key}" class="tool-input" type="${type==='text'?'text':'number'}" step="any" value="${defaultValue}">`}</label>`).join('');
  document.getElementById('study-result').textContent='';
}
export function studyCalculate() {
  const mode=document.getElementById('study-mode').value,target=document.getElementById('study-result');
  try {
    const data=solve(mode);
    target.classList.remove('tool-error');
    target.innerHTML=`<div class="tool-result-title">${modes[mode][1]}</div><p>${modes[mode][2]}</p><dl class="mechplus-results">${Object.entries(data).map(([key,value])=>`<dt>${labels[key]||escapeHtml(key)}</dt><dd>${escapeHtml(fmt(value))}</dd>`).join('')}</dl>`;
  } catch(error) {target.classList.add('tool-error');target.textContent=error.message;}
}
