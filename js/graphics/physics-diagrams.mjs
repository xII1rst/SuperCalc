const escape=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>String(Number(v.toPrecision(5)));
const point=n=>Math.round(n*100+1e-8)/100;
const line=(x1,y1,x2,y2)=>`<line x1="${point(x1)}" y1="${point(y1)}" x2="${point(x2)}" y2="${point(y2)}"/>`;
const body=(x,y,label)=>`<rect x="${x-22}" y="${y-15}" width="44" height="30" rx="4" fill="var(--graph-bg,#fff)" stroke="currentColor"/><text x="${x}" y="${y+4}" text-anchor="middle" fill="currentColor">${escape(label)}</text>`;
function figure(title,content,caption){return `<figure class="physics-diagram"><svg viewBox="0 0 660 380" role="img" aria-label="${escape(title)}" style="width:100%;height:auto;color:var(--graph-text,#334155)"><title>${escape(title)}</title><desc>${escape(caption)}</desc><defs><marker id="physics-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="context-stroke"/></marker></defs><g font-size="12">${content}</g></svg><figcaption>${escape(caption)}</figcaption></figure>`;}
export function forceDiagram(title,vectors,{background='',unit='N',caption='Flechas de fuerza; una escala común para las magnitudes.'}={}){
 if(!Array.isArray(vectors)||vectors.length>24||vectors.some(v=>![...v.origin,...v.vector].every(Number.isFinite)))throw new RangeError('Diagrama de hasta 24 vectores finitos.');
 const largest=Math.max(1e-300,...vectors.map(v=>Math.hypot(...v.vector))),scale=95/largest;
 const arrows=vectors.map((v,i)=>{const[x,y]=v.origin,[vx,vy]=v.vector,size=Math.hypot(vx,vy);if(size===0)return '';
  const dx=vx*scale,dy=-vy*scale,color=i%2?'var(--graph-point,#ef4444)':'var(--graph-curve,#2563eb)';return `<g stroke="${color}" fill="${color}">${line(x,y,x+dx,y+dy).replace('/>',' stroke-width="2" marker-end="url(#physics-arrow)"/>')}<text x="${point(x+dx+5)}" y="${point(y+dy+(dy<0?-5:16))}" stroke="none">${escape(v.label)}${v.showMagnitude===false?'':` = ${fmt(size)} ${escape(unit)}`}</text></g>`;
 }).join('');return figure(title,background+arrows,caption);
}
// Triángulo de impedancia: R en el eje real, X desde el extremo de R y Z como hipotenusa.
export function impedanceDiagram(resistance,reactance){
 if(![resistance,reactance].every(Number.isFinite)||resistance<0)throw new RangeError('Impedancia con R ≥ 0 y X finita.');
 const W=440,H=250,left=70,maxW=280,maxH=150,impedance=Math.hypot(resistance,reactance);
 if(impedance===0)throw new RangeError('Impedancia nula: no hay triángulo que dibujar.');
 const scale=Math.min(resistance>0?maxW/resistance:Infinity,reactance!==0?maxH/Math.abs(reactance):Infinity);
 const dx=resistance*scale,dy=-reactance*scale,oy=reactance>=0?H-50:50,ox=left,tx=ox+dx,ty=oy+dy;
 const angle=Math.atan2(reactance,resistance),deg=angle*180/Math.PI,arc=Math.min(42,Math.max(18,dx*.35));
 const ax=ox+arc*Math.cos(angle),ay=oy-arc*Math.sin(angle),sweep=reactance>=0?0:1;
 const blue='var(--graph-curve,#2563eb)',orange='var(--graph-point,#ef4444)',text='currentColor';
 const arrow=(x1,y1,x2,y2,color,dash='')=>`<g stroke="${color}" fill="${color}">${line(x1,y1,x2,y2).replace('/>',` stroke-width="2.4"${dash} marker-end="url(#physics-arrow)"/>`)}</g>`;
 const label=(x,y,content,color,anchor='middle')=>`<text x="${point(x)}" y="${point(y)}" text-anchor="${anchor}" fill="${color}" stroke="var(--graph-bg,#fff)" stroke-width="4" paint-order="stroke">${content}</text>`;
 // Normal a Z que apunta fuera del triángulo (lejos del vértice (tx, oy)).
 const mx=(ox+tx)/2,my=(oy+ty)/2,len=Math.hypot(tx-ox,ty-oy);
 let nx=-(ty-oy)/len,ny=(tx-ox)/len;
 if(nx*(tx-mx)+ny*(oy-my)>0){nx=-nx;ny=-ny;}
 const content=`<g stroke="${text}" opacity=".35">${line(30,oy,W-20,oy)}${line(ox,15,ox,H-15)}</g>`
  +`<text x="${W-24}" y="${point(oy-8)}" text-anchor="end" fill="${text}" opacity=".7">Re</text><text x="${ox+8}" y="24" fill="${text}" opacity=".7">Im</text>`
  +arrow(ox,oy,tx,oy,blue)+arrow(tx,oy,tx,ty,orange,' stroke-dasharray="6 4"')+arrow(ox,oy,tx,ty,blue)
  +(reactance!==0&&resistance>0?`<path d="M${point(ox+arc)} ${point(oy)} A${point(arc)} ${point(arc)} 0 0 ${sweep} ${point(ax)} ${point(ay)}" fill="none" stroke="${text}" opacity=".7"/>`
   +label(ox+(arc+16)*Math.cos(angle/2),oy-(arc+16)*Math.sin(angle/2)+4,`φ = ${escape(fmt(deg))}°`,text,'start'):'')
  +label(ox+dx/2,oy+(reactance>=0?20:-10),`R = ${escape(fmt(resistance))} Ω`,blue)
  +(reactance!==0?label(tx+10,oy+dy/2+4,`X = ${escape(fmt(reactance))} Ω`,orange,'start'):'')
  +label(mx+nx*12,my+ny*12+4,`|Z| = ${escape(fmt(impedance))} Ω`,blue,'end');
 return `<figure class="physics-diagram"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Triángulo de impedancia" style="width:100%;max-width:560px;height:auto;color:var(--graph-text,#334155)"><title>Triángulo de impedancia</title><desc>R = ${escape(fmt(resistance))} Ω, X = ${escape(fmt(reactance))} Ω, |Z| = ${escape(fmt(impedance))} Ω, φ = ${escape(fmt(deg))}°</desc><defs><marker id="physics-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="context-stroke"/></marker></defs><g font-size="13">${content}</g></svg><figcaption>Plano complejo: R en el eje real y X = X_L − X_C en el imaginario. X positiva es inductiva; negativa, capacitiva. φ = arg(Z) es el desfase del voltaje respecto a la corriente.</figcaption></figure>`;
}
export function mechanicsDiagram(mode,input,data){
 const v=(label,origin,vector,showMagnitude=true)=>({label,origin,vector,showMagnitude}),g=input.gravity||9.80665;
 if(mode==='cables'){
  const a=input.left*Math.PI/180,b=input.right*Math.PI/180;
  return forceDiagram('Equilibrio de cables',[v('T₁',[315,205],[-data.leftTension*Math.cos(a),data.leftTension*Math.sin(a)]),v('T₂',[345,205],[data.rightTension*Math.cos(b),data.rightTension*Math.sin(b)]),v('Peso',[330,220],[0,-input.weight])],{background:body(330,215,'carga'),caption:'Ejes +x hacia la derecha, +y hacia arriba. ΣFx=0 y ΣFy=0; tensiones desde la carga hacia los soportes.'});
 }
 if(mode==='incline'||mode==='rolling'){
  const a=input.angle*Math.PI/180,c=Math.cos(a),s=Math.sin(a),origin=[320,185],weight=input.mass*g;
  const bg=`<g stroke="currentColor" fill="none">${line(origin[0]-190*c,origin[1]-190*s,origin[0]+190*c,origin[1]+190*s)}</g>${body(...origin,mode==='rolling'?'cuerpo':'m')}`;
  return forceDiagram('Fuerzas en plano inclinado',[v('mg',[310,195],[0,-weight]),v('N',[330,170],[data.normal*s,data.normal*c]),v(mode==='rolling'?'f estática':'f cinética',[300,170],[-data.friction*c,data.friction*s])],{background:bg,caption:`Descenso hacia la derecha; normal perpendicular al plano y fricción hacia arriba del plano. θ=${fmt(input.angle)}°. ${mode==='rolling'?'Rodadura sin deslizamiento.':'La fricción cinética presupone movimiento descendente; si a≤0, desde reposo se analiza fricción estática.'}`});
 }
 if(mode==='atwood')return forceDiagram('Máquina de Atwood con polea',[v('T₁',[270,195],[0,data.tensionOne]),v('m₁g',[300,215],[0,-input.m1*g]),v('T₂',[385,195],[0,data.tensionTwo]),v('m₂g',[415,215],[0,-input.m2*g])],{background:`<g stroke="currentColor" fill="none"><circle cx="342" cy="65" r="58"/>${line(284,65,284,205)}${line(400,65,400,205)}</g>${body(285,210,'m₁')}${body(400,210,'m₂')}`,caption:'Fuerzas sobre cada masa. Con inercia de polea T₁ y T₂ pueden diferir; sentido positivo: m₁ desciende y m₂ asciende.'});
 if(mode==='table')return forceDiagram('Masa sobre mesa y masa colgante',[v('N',[205,135],[0,data.normal]),v('m₁g',[230,155],[0,-input.m1*g]),v('T₁',[240,140],[data.tensionOne,0]),v('f',[190,145],[-data.friction,0]),v('T₂',[465,215],[0,data.tensionTwo]),v('m₂g',[490,235],[0,-input.m2*g])],{background:`<g stroke="currentColor" fill="none">${line(130,162,460,162)}${line(230,140,477,140)}${line(477,140,477,220)}<circle cx="460" cy="145" r="17"/></g>${body(220,145,'m₁')}${body(478,230,'m₂')}`,caption:'Cuerda/polea ideales; se supone m₂ descendiendo. ΣFx₁=T−f=m₁a; m₂g−T=m₂a. Si a≤0, revisar el arranque desde reposo.'});
 if(mode==='beam'){
  const x=p=>100+460*p/input.length,vectors=[v('R izquierda',[100,230],[0,data.left]),v('R derecha',[560,230],[0,data.right]),v('Peso viga',[330,230],[0,-input.weight]),...input.loads.slice(0,8).map(([weight,position],i)=>v(`Carga ${i+1}`,[x(position),200],[0,-weight]))];
  return forceDiagram('Equilibrio de viga',vectors,{background:`<g stroke="currentColor" stroke-width="5">${line(100,220,560,220)}</g>`,caption:`Posiciones a escala sobre una viga de L=${fmt(input.length)} m; hasta ocho cargas puntuales y peso en el centro. La tabla usa todas las cargas. Reacción negativa requiere sujeción.`});
 }
 if(mode==='bank'){
  const a=data.angleDegrees*Math.PI/180;return forceDiagram('Peralte a la velocidad de diseño',[v('N',[330,180],[-Math.tan(a),1],false),v('mg',[350,195],[0,-1],false)],{background:body(340,185,'auto'),unit:'',caption:`Direcciones en la sección transversal al centro de la curva (izquierda). A la velocidad de diseño: Ncosθ=mg, Nsenθ=mv²/r; θ=${fmt(data.angleDegrees)}°. La fricción modifica la rapidez máxima indicada en la tabla.`});
 }
 if(mode==='forces')return forceDiagram('Componentes de fuerzas aplicadas',input.rows.slice(0,8).map(([fx,fy],i)=>v(`F${i+1}`,[100+(i%4)*150,110+Math.floor(i/4)*150],[fx,fy])),{caption:'Componentes cartesianas con escala común. Hasta ocho fuerzas. Los puntos de aplicación y sus torques están en la tabla; el diagrama no representa sus posiciones.'});
 return '';
}
export function circuitDiagram(nodeCount,resistors,sources=[],voltages=[]){
 if(!Number.isInteger(nodeCount)||nodeCount<2||nodeCount>12||resistors.length+sources.length>24)return '<p>Esquema disponible hasta 12 nodos y 24 ramas; la tabla conserva el circuito completo.</p>';
 const position=Array.from({length:nodeCount},(_,i)=>[330+210*Math.cos(-Math.PI/2+2*Math.PI*i/nodeCount),190+130*Math.sin(-Math.PI/2+2*Math.PI*i/nodeCount)]);
 const edges=[...resistors.map(row=>({row,kind:'R'})),...sources.map(row=>({row,kind:'V'}))],pairCounts=new Map(),pairIndex=new Map();for(const{row:[a,b]}of edges){const key=[a,b].sort().join(',');pairCounts.set(key,(pairCounts.get(key)||0)+1);}
 const branches=edges.map(({row:[a,b,value],kind})=>{
  if(!position[a]||!position[b]||!Number.isFinite(value))throw new RangeError('Rama inválida para el esquema.');const A=position[a],B=position[b],key=[a,b].sort().join(','),index=pairIndex.get(key)||0;pairIndex.set(key,index+1);
  const angle=Math.atan2(B[1]-A[1],B[0]-A[0])*180/Math.PI,len=Math.hypot(B[0]-A[0],B[1]-A[1]),offset=(index-(pairCounts.get(key)-1)/2)*45;
  const symbol=kind==='R'?'<path d="M-22,0 L-16,-8 L-8,8 L0,-8 L8,8 L16,-8 L22,0" fill="none"/>':'<circle r="17" fill="var(--graph-bg,#fff)"/><text x="-12" y="4" stroke="none" fill="currentColor">+</text><text x="5" y="4" stroke="none" fill="currentColor">−</text>';
  return `<g transform="translate(${(A[0]+B[0])/2},${(A[1]+B[1])/2}) rotate(${angle})" stroke="currentColor"><path d="M${-len/2+19},0 L-40,${offset} L-22,${offset} M22,${offset} L40,${offset} L${len/2-19},0" fill="none"/><g transform="translate(0,${offset})">${symbol}</g></g><text x="${(A[0]+B[0])/2}" y="${(A[1]+B[1])/2+offset-25}" text-anchor="middle" fill="currentColor">${escape(kind==='R'?`R${a}–${b}=${fmt(value)} Ω`:`V${a}−V${b}=${fmt(value)} V`)}</text>`;
 }).join('');
 const nodes=position.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="19" fill="var(--graph-bg,#fff)" stroke="currentColor"/><text x="${x}" y="${y+4}" text-anchor="middle" fill="currentColor">${i}</text>${Number.isFinite(voltages[i])?`<text x="${x}" y="${y+35}" text-anchor="middle" fill="currentColor">${fmt(voltages[i])} V</text>`:''}${i===0&&voltages[0]===0?`<g stroke="currentColor">${line(x,y+45,x,y+52)}${line(x-12,y+52,x+12,y+52)}${line(x-8,y+57,x+8,y+57)}${line(x-4,y+62,x+4,y+62)}</g>`:''}`).join('');
 return figure('Conexiones y polaridades del circuito',branches+nodes,'Nodos numerados; 0 es referencia. Resistores rotulados en Ω; fuente orientada de a (+) hacia b (−), V(a)−V(b) igual al valor escrito. Esquema de conexiones, sin escala física.');
}

export function potentialMapSvg(data){
 const {grid,width,height,nx,ny}=data,values=grid.flat();if(values.some(v=>!Number.isFinite(v)))throw new RangeError('Mapa de potencial no finito.');
 const minimum=Math.min(...values),maximum=Math.max(...values),span=maximum-minimum||1,W=660,H=390,L=70,R=590,T=25,B=320;
 const cells=grid.flatMap((row,j)=>row.map((v,i)=>{const x=L+(R-L)*i/nx,y=B-(B-T)*j/ny,color=`hsl(${240-240*(v-minimum)/span},65%,50%)`;return `<rect x="${Math.max(L,x-(R-L)/nx/2)}" y="${Math.max(T,y-(B-T)/ny/2)}" width="${(R-L)/nx}" height="${(B-T)/ny}" fill="${color}"><title>(${fmt(width*i/nx)} m,${fmt(height*j/ny)} m): ${fmt(v)} V</title></rect>`;})).join('');
 return `<figure class="physics-diagram"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Mapa de potencial eléctrico en el rectángulo" style="width:100%;height:auto;color:var(--graph-text,#334155)"><title>Potencial V(x,y), malla ${nx}×${ny}</title><desc>Azul: mínimo ${fmt(minimum)} V; rojo: máximo ${fmt(maximum)} V. Dimensiones ${fmt(width)} m por ${fmt(height)} m. Valores de la malla disponibles en la tabla.</desc><defs><clipPath id="potential-map-clip"><rect x="${L}" y="${T}" width="${R-L}" height="${B-T}"/></clipPath></defs><g clip-path="url(#potential-map-clip)">${cells}</g><rect x="${L}" y="${T}" width="${R-L}" height="${B-T}" fill="none" stroke="currentColor"/><g fill="currentColor" font-size="12"><text x="${L}" y="345">0</text><text x="${R-20}" y="345">${fmt(width)} m</text><text x="10" y="${T}">${fmt(height)} m</text><text x="10" y="${B}">0</text><text x="${L}" y="375">Azul: ${fmt(minimum)} V · Rojo: ${fmt(maximum)} V</text></g></svg><figcaption>Potencial en nodos de una malla; el mapa no representa una solución continua exacta.</figcaption></figure>`;
}
