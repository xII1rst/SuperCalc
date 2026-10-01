const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const f=value=>String(Number(value.toPrecision(5)));
export function studyPlotSvg(series,{title='Curvas',xLabel='x',yLabel='y',field=null}={}){
 if(!Array.isArray(series)||series.length<1||series.length>6||series.some(s=>!Array.isArray(s.points)||s.points.length>1100))throw new RangeError('De 1 a 6 curvas, máximo 1100 puntos cada una.');
 const valid=series.flatMap(s=>s.points).filter(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite));if(valid.length<2)return '<p>No hay suficientes puntos finitos para graficar.</p>';
 let x0=Math.min(...valid.map(p=>p[0])),x1=Math.max(...valid.map(p=>p[0])),y0=Math.min(...valid.map(p=>p[1])),y1=Math.max(...valid.map(p=>p[1]));
 const padX=(x1-x0||Math.max(1,Math.abs(x0)))*.04,padY=(y1-y0||Math.max(1,Math.abs(y0)))*.12;x0-=padX;x1+=padX;y0-=padY;y1+=padY;
 if(![x0,x1,y0,y1,x1-x0,y1-y0].every(Number.isFinite))throw new RangeError('Ventana de gráfica fuera del rango numérico.');
 const W=720,H=330,L=65,R=695,T=30,B=275,px=x=>Math.round((L+(x-x0)/(x1-x0)*(R-L))*100+1e-8)/100,py=y=>Math.round((B-(y-y0)/(y1-y0)*(B-T))*100+1e-8)/100,colors=['var(--graph-curve,#2563eb)','var(--graph-point,#ef4444)','var(--graph-text,#334155)'];
 let directions='';if(typeof field==='function')for(let i=0;i<=16;i++)for(let j=0;j<=8;j++){
  const x=x0+(x1-x0)*i/16,y=y0+(y1-y0)*j/8;let slope;try{slope=field(x,y);}catch{continue;}if(!Number.isFinite(slope))continue;
  // Scale the slope to the displayed axes before normalizing.
  const angle=Math.atan(slope*(B-T)/(y1-y0)*(x1-x0)/(R-L)),dx=7*Math.cos(angle),dy=-7*Math.sin(angle),cx=px(x),cy=py(y);
  directions+=`<line x1="${(cx-dx).toFixed(2)}" y1="${(cy-dy).toFixed(2)}" x2="${(cx+dx).toFixed(2)}" y2="${(cy+dy).toFixed(2)}"/>`;
 }
 const curves=series.map((s,index)=>{
  let paths=[],path='';for(const p of s.points){if(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)){if(path)paths.push(path);path='';continue;}path+=`${path?'L':'M'}${px(p[0]).toFixed(2)},${py(p[1]).toFixed(2)} `;}if(path)paths.push(path);
  return `<g stroke="${colors[index%colors.length]}" fill="none" stroke-width="2" ${index>2?'stroke-dasharray="5 4"':''}>${paths.map(d=>`<path data-series="${index}" d="${d}"/>`).join('')}</g>`;
 }).join('');
 const axes=`${x0<=0&&x1>=0?`<line x1="${px(0)}" x2="${px(0)}" y1="${T}" y2="${B}"/>`:''}${y0<=0&&y1>=0?`<line x1="${L}" x2="${R}" y1="${py(0)}" y2="${py(0)}"/>`:''}<rect x="${L}" y="${T}" width="${R-L}" height="${B-T}"/>`;
 return `<figure class="study-plot"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${escape(title)}" style="width:100%;height:auto;color:var(--graph-text,#334155)"><title>${escape(title)}</title><desc>${escape(`Ventana ${xLabel}: ${f(x0)} a ${f(x1)}; ${yLabel}: ${f(y0)} a ${f(y1)}. Curvas: ${series.map(s=>s.label).join(', ')}.${field?' Segmentos grises: campo direccional evaluado en una malla.':''}`)}</desc><g stroke="currentColor" fill="none" opacity="0.3">${axes}</g><g data-direction-field="true" stroke="currentColor" opacity="0.35">${directions}</g>${curves}<g fill="currentColor" font-size="12"><text x="${L}" y="300">${f(x0)}</text><text x="${R-35}" y="300">${f(x1)}</text><text x="${(L+R)/2}" y="320">${escape(xLabel)}</text><text x="3" y="${T+5}">${f(y1)}</text><text x="3" y="${B}">${f(y0)}</text><text x="${L}" y="20">${escape(yLabel)}</text></g></svg><figcaption>${series.map((s,i)=>`<span style="color:${colors[i%colors.length]}">${escape(s.label)}</span>`).join(' · ')}${field?'. Campo direccional local; se omiten puntos no finitos. La malla no prueba existencia ni certifica todo el dominio.':''}</figcaption></figure>`;
}
