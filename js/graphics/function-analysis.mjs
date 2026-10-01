import { calcParse } from '../math/expression.mjs';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=value=>String(Number(value.toPrecision(6)));
// Segmentos separados por cada discontinuidad; no unir ramas a través de polos.
export function functionAnalysisSvg(data,{start=-6,end=6,minimum=-6,maximum=6}={}) {
  if(![start,end,minimum,maximum].every(Number.isFinite)||start>=end||minimum>=maximum||!Number.isFinite(end-start)||!Number.isFinite(maximum-minimum))throw new RangeError('Ventana de gráfica inválida.');
  const f=calcParse(data.expression);if(!f)throw new RangeError('Función de gráfica inválida.');
  const W=720,H=300,L=52,R=W-20,T=25,B=H-40;
  const px=x=>L+(x-start)/(end-start)*(R-L),py=y=>B-(y-minimum)/(maximum-minimum)*(B-T);
  const paths=[],cuts=[start,...data.excluded.filter(x=>x>start&&x<end),end];
  for(let segment=1;segment<cuts.length;segment++) {
    const a=cuts[segment-1],b=cuts[segment],edge=(b-a)/100000,points=180;
    let path='';
    for(let i=0;i<=points;i++) {
      const x=a+edge+(b-a-2*edge)*i/points,y=f(x,0);
      if(!Number.isFinite(y)||y<minimum||y>maximum){if(path){paths.push(path);path='';}continue;}
      path+=`${path?'L':'M'}${px(x).toFixed(2)},${py(y).toFixed(2)} `;
    }
    if(path)paths.push(path);
  }
  const axes=[];
  if(start<=0&&end>=0)axes.push(`<line x1="${px(0)}" x2="${px(0)}" y1="${T}" y2="${B}"/>`);
  if(minimum<=0&&maximum>=0)axes.push(`<line x1="${L}" x2="${R}" y1="${py(0)}" y2="${py(0)}"/>`);
  const poles=data.discontinuities.filter(p=>p.type==='asíntota vertical'&&p.x>start&&p.x<end).map(p=>`<line data-asymptote="vertical" x1="${px(p.x)}" x2="${px(p.x)}" y1="${T}" y2="${B}"/>`).join('');
  const rawAsymptote=data.asymptote?.length<=2?Array.from({length:2},(_,i)=>{const x=i?end:start,y=data.asymptote[0]+(data.asymptote[1]||0)*x;return `${i?'L':'M'}${px(x)},${py(y)}`;}).join(' '):'';
  const asymptote=/NaN|Infinity/.test(rawAsymptote)?'':rawAsymptote;
  const markers=[...data.criticalPoints,...data.inflections].filter(p=>p.x>=start&&p.x<=end&&p.value>=minimum&&p.value<=maximum).map(p=>`<circle cx="${px(p.x)}" cy="${py(p.value)}" r="4"><title>${escape(`(${number(p.x)}, ${number(p.value)}) ${p.type||'inflexión'}`)}</title></circle>`).join('');
  const holes=data.discontinuities.filter(p=>p.type==='hueco removible'&&p.x>=start&&p.x<=end&&p.limit>=minimum&&p.limit<=maximum).map(p=>`<circle data-hole="true" cx="${px(p.x)}" cy="${py(p.limit)}" r="5" fill="var(--graph-bg,#fff)" stroke="currentColor"/>`).join('');
  return `<figure class="function-analysis-graph"><svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="function-analysis-title function-analysis-desc" style="width:100%;height:auto;color:var(--graph-text,#334155)"><title id="function-analysis-title">${escape('Gráfica de '+data.expression)}</title><desc id="function-analysis-desc">${escape(`Ventana x entre ${start} y ${end}, y entre ${minimum} y ${maximum}. Ramas separadas en discontinuidades; puntos críticos e inflexiones señalados. Los valores y signos se presentan en la tabla.`)}</desc><defs><clipPath id="function-analysis-clip"><rect x="${L}" y="${T}" width="${R-L}" height="${B-T}"/></clipPath></defs><g stroke="currentColor" opacity="0.35" fill="none">${axes.join('')}<rect x="${L}" y="${T}" width="${R-L}" height="${B-T}"/></g><g clip-path="url(#function-analysis-clip)"><g stroke="currentColor" fill="none" stroke-dasharray="6 5" opacity="0.7">${poles}${asymptote?`<path data-asymptote="infinity" d="${asymptote}"/>`:''}</g><g stroke="var(--graph-curve,#2563eb)" stroke-width="2" fill="none">${paths.map(d=>`<path data-curve="true" d="${d}"/>`).join('')}</g><g fill="var(--graph-point,#ef4444)">${markers}</g>${holes}</g><g fill="currentColor" font-size="12"><text x="${L}" y="${H-12}">${number(start)}</text><text x="${R-8}" y="${H-12}">${number(end)}</text><text x="${(L+R)/2}" y="${H-12}">x</text><text x="6" y="${T+6}">${number(maximum)}</text><text x="6" y="${B}">${number(minimum)}</text><text x="${L}" y="16">f(x)</text></g></svg><figcaption>Ventana acotada; líneas discontinuas: asíntotas. Los cortes de la curva respetan las discontinuidades.</figcaption></figure>`;
}
