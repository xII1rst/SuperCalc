import { chainRuleStudy, constrainedQuadraticStudy, curveStudy, differentialStudy, greenRegionStudy, implicitSurfaceStudy, jacobianStudy, lineStudy, planeFromPointNormal, polynomialCriticalStudy, polynomialPotentialStudy } from '../../math/multivariable-study.mjs';
import { constant, coordinateFormula, num, nums, one, read, two } from './inputs.mjs';
import { integrateParametricFlux, integrateParametricSurface, integrateTripleRegion, integrateVariableRegion, laminaProperties, linearObjectiveCylinderPlane, logarithmicRadialHarmonic, minimumNormOnPlane, tangentPlane, trilinearPotentialIntegral } from '../../math/study-calculus.mjs';
import { multivariableLimit } from '../../math/multivariable.mjs';
import { vectorApplications } from '../../math/algebra/linear-spaces.mjs';

// Las tres integrales triples comparten el mismo recorrido; cambia el sistema de coordenadas.
function triple(mode) {
    const coordinates=mode==='triplecart'?'cartesian':mode==='triplecyl'?'cylindrical':'spherical';
    const [outer,middle]=coordinates==='cartesian'?['x','y']:coordinates==='cylindrical'?['r','theta']:['rho','phi'];
    return integrateTripleRegion(
      coordinateFormula('integrand3','x',['x','y','z'],['x','y','z']),coordinates,
      num('outerStart'),num('outerEnd'),
      coordinateFormula('middleLower',outer,[outer],[outer]),coordinateFormula('middleUpper',outer,[outer],[outer]),
      coordinateFormula('innerLower',outer,[outer,middle],[outer,middle]),coordinateFormula('innerUpper',outer,[outer,middle],[outer,middle]),num('n3'));
}

export const fields={
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
};

export const modes={
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
};

export const solvers={
  mplane() { return planeFromPointNormal(nums('point'),nums('normal')); },
  mline() { return lineStudy(read('field').split(/[;\n]+/).map(x=>x.trim()).filter(Boolean),read('maps').split(/[;\n]+/).map(x=>x.trim()).filter(Boolean),num('start'),constant('end'),read('type'),num('n')); },
  mvectors() {
    const u=nums('u'),v=nums('v'),result=vectorApplications(u,v),normV=Math.hypot(...v);
    return {...result,normV,angleDegrees:result.norm&&normV?Math.acos(Math.max(-1,Math.min(1,result.dot/(result.norm*normV))))*180/Math.PI:null};
  },
  mdifferential() { return differentialStudy(read('expr'),read('variables').split(/[,\s]+/).filter(Boolean),nums('point'),read('direction')?nums('direction'):null); },
  mlimit() { return multivariableLimit(read('expr'),num('x'),num('y')); },
  mimplicit() { return implicitSurfaceStudy(read('expr'),nums('point')); },
  mchain() { return chainRuleStudy(read('expr'),read('maps').split(/[;\n]+/).map(x=>x.trim()).filter(Boolean),read('variables').split(/[,\s]+/).filter(Boolean),nums('point')); },
  mjacobian() { return jacobianStudy(read('maps').split(/[;\n]+/).map(x=>x.trim()).filter(Boolean),nums('point')); },
  mcurve() { return curveStudy(read('maps').split(/[;\n]+/).map(x=>x.trim()).filter(Boolean),num('time'),num('start'),constant('end'),num('n')); },
  mpotential() { return polynomialPotentialStudy(read('fieldX'),read('fieldY'),nums('from'),nums('to')); },
  mcritical() { return polynomialCriticalStudy(read('expr')); },
  mconstraint() { return constrainedQuadraticStudy(read('expr'),read('constraint'),num('constant')); },
  mgreen() {
    const polar=read('coordinates')==='polar';return greenRegionStudy(read('fieldX'),read('fieldY'),num('start'),constant('end'),
      polar?coordinateFormula('lower','theta',['theta'],['theta']):one('lower'),polar?coordinateFormula('upper','theta',['theta'],['theta']):one('upper'),num('n'),read('coordinates'),read('orientation'));
  },
  mpolar() {
    const f=two('integrand'),lower=coordinateFormula('lower','theta',['theta'],['theta']),upper=coordinateFormula('upper','theta',['theta'],['theta']);
    const integrand=(theta,r)=>{if(r<0)throw new RangeError('Radio negativo');return f(r*Math.cos(theta),r*Math.sin(theta))*r;};
    const result=integrateVariableRegion(integrand,num('start'),constant('end'),lower,upper,num('nx'),num('ny'));
    const coarse=integrateVariableRegion(integrand,num('start'),constant('end'),lower,upper,num('nx')/2,num('ny')/2);
    return {...result,coarse:coarse.value,refinementDifference:Math.abs(result.value-coarse.value),formula:'∫∫ f(r cosθ,r senθ) r dr dθ; jacobiano r'};
  },
  region() { const f=two('integrand'),swapped=read('order')==='dx-dy',lower=swapped?one('lower','y'):one('lower'),upper=swapped?one('upper','y'):one('upper');const result=integrateVariableRegion(swapped?(y,x)=>f(x,y):f,num('start'),num('end'),lower,upper,num('nx'),num('ny'));return {...result,formula:swapped?'∫[ya,yb]∫[xinf(y),xsup(y)] f(x,y) dx dy; jacobiano 1':result.formula+'; jacobiano 1'}; },
  lamina() { return laminaProperties(two('density'),'cartesian',num('start'),num('end'),one('lower'),one('upper'),num('nx'),num('ny')); },
  laminapolar() {
    return laminaProperties(two('density'),'polar',num('start'),constant('end'),
    coordinateFormula('lower','theta',['theta'],['theta']),coordinateFormula('upper','theta',['theta'],['theta']),num('nx'),num('ny'));
  },
  triplecart: triple,
  triplecyl: triple,
  triplesph: triple,
  paramsurface() {
    const x=coordinateFormula('xexpr','u',['u','v'],['u','v']);
    const y=coordinateFormula('yexpr','u',['u','v'],['u','v']);
    const z=coordinateFormula('zexpr','u',['u','v'],['u','v']);
    return integrateParametricSurface((u,v)=>[x(u,v),y(u,v),z(u,v)],
      coordinateFormula('integrand3','x',['x','y','z'],['x','y','z']),
      num('uStart'),constant('uEnd'),num('vStart'),constant('vEnd'),num('n2'));
  },
  paramflux() {
    const x=coordinateFormula('xexpr','u',['u','v'],['u','v']);
    const y=coordinateFormula('yexpr','u',['u','v'],['u','v']);
    const z=coordinateFormula('zexpr','u',['u','v'],['u','v']);
    const fx=coordinateFormula('fieldX','x',['x','y','z'],['x','y','z']);
    const fy=coordinateFormula('fieldY','x',['x','y','z'],['x','y','z']);
    const fz=coordinateFormula('fieldZ','x',['x','y','z'],['x','y','z']);
    return integrateParametricFlux((u,v)=>[x(u,v),y(u,v),z(u,v)],
      (px,py,pz)=>[fx(px,py,pz),fy(px,py,pz),fz(px,py,pz)],
      num('uStart'),constant('uEnd'),num('vStart'),constant('vEnd'),num('n2'),read('orientation'));
  },
  twoconstraints() {
    return linearObjectiveCylinderPlane(num('radiusSquared'),
    [num('planeA'),num('planeB'),num('planeC'),num('planeD')],
    [num('objectiveX'),num('objectiveY'),num('objectiveZ')]);
  },
  planenorm() { return minimumNormOnPlane([num('planeA'),num('planeB'),num('planeC')],num('planeD')); },
  harmoniclog() { return logarithmicRadialHarmonic(num('scale'),num('x'),num('y')); },
  trilinearpath() { return trilinearPotentialIntegral(num('coefficient'),nums('from'),nums('to')); },
  plane() { return tangentPlane(two('expr'),num('x'),num('y'),num('step')); },
};
