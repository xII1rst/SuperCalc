import { calcParse, collectVariables } from '../math/expression.mjs';
import { piecewiseContinuity, parametricDerivatives, implicitSlope, polarAreaBetween, curveArcLength,
  surfaceOfRevolution, integrateVariableRegion, integrateTripleRegion, integrateParametricSurface, tangentPlane, powerSeriesInterval, telescopingOffset } from '../math/study-calculus.mjs';
import { separablePower, linearFirstOrder, bernoulliConstant, logisticGrowth, forcedSecondOrder, linearSystem2D, laplaceTable } from '../math/study-ode.mjs';

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
  triplecart:[['integrand3','f(x,y,z)','z','text'],['outerStart','x inicial','0'],['outerEnd','x final','1'],['middleLower','y inferior(x)','0','text'],['middleUpper','y superior(x)','1-x','text'],['innerLower','z inferior(x,y)','0','text'],['innerUpper','z superior(x,y)','1-x-y','text'],['n3','n Simpson (8–60, múltiplo de 4)','20']],
  triplecyl:[['integrand3','f(x,y,z)','1','text'],['outerStart','r inicial','0'],['outerEnd','r final','2'],['middleLower','θ inferior(r)','0','text'],['middleUpper','θ superior(r)','2*π','text'],['innerLower','z inferior(r,theta)','0','text'],['innerUpper','z superior(r,theta)','r^2','text'],['n3','n Simpson (8–60, múltiplo de 4)','20']],
  triplesph:[['integrand3','f(x,y,z)','1','text'],['outerStart','ρ inicial','0'],['outerEnd','ρ final','3'],['middleLower','φ inferior(rho)','0','text'],['middleUpper','φ superior(rho)','π','text'],['innerLower','θ inferior(rho,phi)','0','text'],['innerUpper','θ superior(rho,phi)','2*π','text'],['n3','n Simpson (8–60, múltiplo de 4)','20']],
  paramsurface:[['xexpr','x(u,v)','u*cos(v)','text'],['yexpr','y(u,v)','u*sin(v)','text'],['zexpr','z(u,v)','u^2','text'],['integrand3','f(x,y,z); 1 para área','1','text'],['uStart','u inicial','0'],['uEnd','u final','2','text'],['vStart','v inicial','0'],['vEnd','v final','2*π','text'],['n2','n Simpson (8–80, múltiplo de 4)','40']],
  plane:[['expr','z=f(x,y)','x^2+y^2','text'],['x','x','1'],['y','y','1'],['step','Paso h','0.00001']],
  separable:[['a','Coeficiente a','2'],['xp','Potencia p de x','1'],['yp','Potencia q de y','1'],['x0','x inicial','0'],['y0','y inicial positiva','1'],['x','x final','1']],
  linearode:[['p','p constante en y′+py=q','2'],['q','q constante','6'],['x0','x inicial','0'],['y0','y inicial','1'],['x','x final','1']],
  bernoulli:[['p','p en y′+py=qyⁿ','1'],['q','q','1'],['power','n','2'],['x0','x inicial','0'],['y0','y inicial positiva','2'],['x','x final','0.5']],
  logistic:[['rate','Tasa r','1'],['capacity','Capacidad K','10'],['x0','x inicial','0'],['y0','Población inicial positiva','2'],['x','x final','1']],
  forced:[['damping','Coeficiente a de y′','0'],['stiffness','Coeficiente b de y','1'],['force','Amplitud F','2'],['omega','Frecuencia ω (rad/s)','1'],['y0','y(0)','0'],['v0','y′(0)','0'],['time','Tiempo t','1']],
  systemode:[['matrix','Matriz A: a,b,c,d','0, -1, 1, 0','text'],['initial','Vector inicial u₀,v₀','1, 0','text'],['time','Tiempo t','1.5707963267948966']],
  laplace:[['kind','Función','sine','select','one,exponential,sine,cosine,time'],['parameter','Parámetro a','2']],
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
  triplecart:['multivariable','Integral triple cartesiana','Límites x, y(x), z(x,y); Simpson anidado.'],
  triplecyl:['multivariable','Integral triple cilíndrica','x=r cosθ, y=r senθ; jacobiano r.'],
  triplesph:['multivariable','Integral triple esférica','x=ρ senφ cosθ, y=ρ senφ senθ, z=ρ cosφ; jacobiano ρ² senφ.'],
  paramsurface:['multivariable','Integral sobre superficie paramétrica','∫∫ f(r(u,v)) |rᵤ×rᵥ| du dv; usa f=1 para área.'],
  plane:['multivariable','Plano tangente','z=f(a,b)+fx(a,b)(x−a)+fy(a,b)(y−b).'],
  separable:['ode','EDO separable potencia','y′=a xᵖyᑫ; se sigue la rama positiva.'],
  linearode:['ode','EDO lineal de primer orden','y′+p y=q con p,q constantes.'],
  bernoulli:['ode','EDO de Bernoulli','y′+p y=q yⁿ; z=y^(1−n).'],
  logistic:['ode','Crecimiento logístico','y′=r y(1−y/K).'],
  forced:['ode','Segundo orden forzado','y″+a y′+b y=F cos(ωt) con condiciones iniciales.'],
  systemode:['ode','Sistema lineal 2×2','u′=Au con A constante.'],
  laplace:['ode','Tabla de Laplace','Transformadas básicas bajo el semiplano de convergencia indicado.'],
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
  if(mode==='plane') return tangentPlane(two('expr'),num('x'),num('y'),num('step'));
  if(mode==='separable') return separablePower(num('a'),num('xp'),num('yp'),num('x0'),num('y0'),num('x'));
  if(mode==='linearode') return linearFirstOrder(num('p'),num('q'),num('x0'),num('y0'),num('x'));
  if(mode==='bernoulli') return bernoulliConstant(num('p'),num('q'),num('power'),num('x0'),num('y0'),num('x'));
  if(mode==='logistic') return logisticGrowth(num('rate'),num('capacity'),num('x0'),num('y0'),num('x'));
  if(mode==='forced') return forcedSecondOrder(num('damping'),num('stiffness'),num('force'),num('omega'),num('y0'),num('v0'),num('time'));
  if(mode==='systemode') {
    const values=nums('matrix'),initial=nums('initial');
    if(values.length!==4||initial.length!==2) throw new RangeError('Matriz de 4 y vector de 2 números requeridos');
    return linearSystem2D([[values[0],values[1]],[values[2],values[3]]],initial,num('time'));
  }
  if(mode==='laplace') return laplaceTable(read('kind'),num('parameter'));
  throw new RangeError('Operación no disponible');
}
const labels={parameters:'Parámetros',status:'Estado',values:'Valores particulares',freeParameters:'Parámetros libres',nullspace:'Direcciones libres',equations:'Ecuaciones en las uniones',checks:'Comprobación izquierda/derecha',assumption:'Hipótesis',x:'x',y:'y',dxdt:'dx/dt',dydt:'dy/dt',d2xdt2:'d²x/dt²',d2ydt2:'d²y/dt²',dydx:'dy/dx',d2ydx2:'d²y/dx²',step:'Paso h',residual:'F(x,y)',fx:'Fx',fy:'Fy',slope:'dy/dx',area:'Área',length:'Longitud',subintervals:'Subintervalos',formula:'Fórmula',radius:'Radio',openInterval:'Intervalo abierto',leftEndpoint:'Extremo izquierdo',rightEndpoint:'Extremo derecho',sum:'Suma',decomposition:'Descomposición',value:'Valor',coarse:'Malla n/2',refinementDifference:'Diferencia entre mallas',nx:'Divisiones en x',ny:'Divisiones en y',point:'Punto',gradient:'Gradiente',normal:'Normal',derivative:'Derivada',equilibrium:'Equilibrio',integralXPower:'Integral de xᵖ',transformed:'Variable transformada',homogeneous:'Parte homogénea',particular:'Solución particular',constants:'Constantes',regime:'Régimen',resonant:'Resonancia',matrixExponential:'e^(At)',transform:'Transformada',domain:'Dominio'};
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
