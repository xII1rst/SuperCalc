import { atwood, averagePower, beamReactions, forceSystem2D, inclinedPlane, polarForce, potentialEquilibria, springLaunch, standardInertia, tablePulley, twoCableEquilibrium, vectorPair, workByForce } from '../../math/mechanics-advanced.mjs';
import { num, rows, singleRow } from './units.mjs';

export const fields={
  vectors:[['first','Vector A: x,y,z','3,-2,4','text'],['second','Vector B: x,y,z','1,5,-2','text']],
  polar:[['weight','Magnitud de fuerza (N)','50'],['angle','Ángulo desde +x (°)','37']],
  work:[['weight','Fuerza (N)','30'],['distance','Desplazamiento (m)','5'],['angle','Ángulo fuerza-desplazamiento (°)','60']],
  power:[['energy','Trabajo (J)','5000'],['time','Intervalo (s)','20']],
  table:[['m1','Masa sobre mesa (kg)','4'],['m2','Masa colgante (kg)','6'],['friction','Coeficiente de fricción cinética','0.1']],
  spring:[['stiffness','Constante k (N/m)','200'],['distance','Compresión (m)','0.1'],['mass','Masa lanzada (kg)','0.5']],
  potential:[['coefficients','a,b,c,d en U(x)=ax³+bx²+cx+d (J, x en m)','1,-6,9,0','text']],
  forces:[['rows','Fuerzas: Fx, Fy, x, y; una por línea','3, 4, 0, 0\n-1, 2, 2, 0','textarea']],
  cables:[['weight','Peso (N)','100'],['left','Ángulo cable izquierdo desde horizontal (°)','30'],['right','Ángulo derecho (°)','45']],
  beam:[['length','Longitud de viga (m)','4'],['weight','Peso de la viga (N)','20'],['loads','Cargas: peso (N), posición (m); una por línea','40, 1\n60, 3','textarea']],
  incline:[['mass','Masa (kg)','5'],['angle','Ángulo (°)','30'],['friction','Coeficiente de fricción cinética','0.1'],['distance','Distancia recorrida (m)','2']],
  atwood:[['m1','Masa 1 (kg)','5'],['m2','Masa 2 (kg)','3'],['inertia','Inercia I (kg·m², o masa de disco)','0'],['pulleyMass','Masa de polea disco (kg, deja I vacía)',''],['radius','Radio de polea (m), si tiene inercia','0.2']],
};

export const modes={
  vectors:['forces','Operaciones vectoriales 3D','A±B; A·B; A×B; cos θ=(A·B)/(|A||B|); área=|A×B|'],
  polar:['forces','Componentes de fuerza','Fx=F cos θ; Fy=F sen θ'],
  work:['forces','Trabajo de fuerza constante','W=F d cos θ'],
  power:['forces','Potencia media','P=W/Δt'],
  table:['forces','Mesa y masa colgante','a=(m₂g−μm₁g)/(m₁+m₂); T=m₁a+μm₁g=m₂(g−a)'],
  spring:['forces','Lanzamiento desde resorte','½kx²=½mv²'],
  potential:['forces','Equilibrio desde potencial cúbico','F=−U′; equilibrio si U′=0; mínimo estable, máximo inestable'],
  forces:['forces','Sistema de fuerzas 2D','R = ΣF; τ₀ = Σ[(x−x₀)Fy − (y−y₀)Fx]'],
  cables:['forces','Dos cables en equilibrio','ΣFx = 0; ΣFy = 0; T₁ = W cos β / sen(α+β)'],
  beam:['forces','Reacciones en viga','R₁+R₂ = Wtotal; R₂L = Wviga L/2 + ΣWᵢxᵢ'],
  incline:['forces','Plano inclinado con fricción','N = mg cos θ; a = g(sen θ−μ cos θ)'],
  atwood:['forces','Máquina de Atwood y polea','a = (m₁−m₂)g/(m₁+m₂+I/R²)'],
};

export const solvers={
  vectors() { return vectorPair(singleRow('first',3),singleRow('second',3)); },
  polar() { return polarForce(num('weight'),num('angle')); },
  work() { return workByForce(num('weight'),num('distance'),num('angle')); },
  power() { return averagePower(num('energy'),num('time')); },
  table() { return tablePulley(num('m1'),num('m2'),num('friction')); },
  spring() { return springLaunch(num('stiffness'),num('distance'),num('mass')); },
  potential() { return potentialEquilibria(singleRow('coefficients',4)); },
  forces() { return forceSystem2D(rows('rows',4).map(([fx,fy,x,y])=>({force:[fx,fy],point:[x,y]}))); },
  cables() { return twoCableEquilibrium(num('weight'),num('left'),num('right')); },
  beam() { return beamReactions(num('length'),num('weight'),rows('loads',2).map(([weight,position])=>({weight,position}))); },
  incline() { return inclinedPlane(num('mass'),num('angle'),num('friction'),num('distance')); },
  atwood() {
    const mass=num('pulleyMass',true),inertia=num('inertia',true),radius=num('radius');
    if(mass!==null&&inertia!==null)throw new RangeError('Introduce inercia o masa de polea, solo una.');
    const I=mass===null?(inertia??0):standardInertia('disk',mass,radius).inertia;
    return {...atwood(num('m1'),num('m2'),undefined,I,radius),inertia:I,assumption:'Cuerda inextensible sin deslizamiento; polea disco si se suministra su masa.'};
  },
};
