import { collectVariables, normalizeExpression } from '../math/expression.mjs';
import { constant, coordinateFormula, num, one, read } from './study/inputs.mjs';
import { theoremCurve } from '../math/differential-applications.mjs';
import { functionAnalysisSvg } from '../graphics/function-analysis.mjs';
import { studyPlotSvg } from '../graphics/study-plot.mjs';
import * as differential from './study/differential.mjs';
import * as integral from './study/integral.mjs';
import * as multivariable from './study/multivariable.mjs';
import * as ode from './study/ode.mjs';

const families=[differential, integral, multivariable, ode];
const fields=Object.assign({},...families.map(family=>family.fields));
const modes=Object.assign({},...families.map(family=>family.modes));
const solvers=Object.assign({},...families.map(family=>family.solvers));

const groups={differential:'Aplicaciones diferenciales',integral:'Aplicaciones integrales',multivariable:'Regiones y superficies',ode:'Métodos de EDO'};
const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function solve(mode) {
  if(!Object.hasOwn(solvers, mode)) throw new RangeError('Operación no disponible');
  return solvers[mode](mode);
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
