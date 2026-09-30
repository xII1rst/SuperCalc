const escapeXml = value => String(value).replace(/[&<>"']/g, char => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;',
}[char]));
const shortLabel=(value,maxLength=10)=>{
  const label=String(value);
  return label.length>maxLength?`${label.slice(0,maxLength-1)}…`:label;
};

// Keep the layout deterministic so the same input gives the same diagram.
export function renderLogicGraph(edges, {directed=false, vertices=[], visited=[], highlightedEdges=[], title='Grafo',caption='Vértices resaltados: visitados; aristas resaltadas: camino, árbol o corte, según el algoritmo.'}={}) {
  const names=[...new Set([...vertices,...edges.flatMap(edge=>edge.slice(0,2))])].sort();
  if (!names.length) return '';
  const positions=new Map(names.map((vertex,index)=>[vertex,{
    x:300+(names.length===1?0:228*Math.cos(-Math.PI/2+2*Math.PI*index/names.length)),
    y:200+(names.length===1?0:130*Math.sin(-Math.PI/2+2*Math.PI*index/names.length)),
  }]));
  const visitedSet=new Set(visited);
  const highlighted=new Set(highlightedEdges.map(([from,to])=>directed?`${from}\u0000${to}`:[from,to].sort().join('\u0000')));
  const edgeKey=(from,to)=>directed?`${from}\u0000${to}`:[from,to].sort().join('\u0000');
  const pairCounts=new Map();
  for (const [from,to] of edges) {
    const key=[from,to].sort().join('\u0000');
    pairCounts.set(key,(pairCounts.get(key)||0)+1);
  }
  const pairIndices=new Map();
  const showWeights=edges.some(edge=>edge.length===3);
  const lines=edges.map(([from,to,weight=1])=>{
    const a=positions.get(from),b=positions.get(to);
    const key=[from,to].sort().join('\u0000'),index=pairIndices.get(key)||0;
    pairIndices.set(key,index+1);
    const offset=(index-(pairCounts.get(key)-1)/2)*24;
    const active=highlighted.has(edgeKey(from,to));
    const color=active?'var(--tool-color)':'var(--text-soft)';
    let path,labelX,labelY;
    if (from===to) {
      const shift=index*15;
      path=`M ${a.x-12} ${a.y-13} C ${a.x-55-shift} ${a.y-70-shift}, ${a.x+55+shift} ${a.y-70-shift}, ${a.x+12} ${a.y-13}`;
      labelX=a.x;labelY=a.y-58-shift;
    } else {
      const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length;
      const side=from<=to?1:-1,px=-uy*side,py=ux*side;
      const x1=a.x+ux*19,y1=a.y+uy*19,x2=b.x-ux*19,y2=b.y-uy*19;
      const mx=(x1+x2)/2,my=(y1+y2)/2;
      path=`M ${x1} ${y1} Q ${mx+px*offset*2} ${my+py*offset*2} ${x2} ${y2}`;
      labelX=mx+px*(offset+10);labelY=my+py*(offset+10);
    }
    const label=showWeights?`<text class="logic-graph-weight" x="${labelX}" y="${labelY}"><title>${escapeXml(weight)}</title>${escapeXml(shortLabel(weight))}</text>`:'';
    return `<path d="${path}" fill="none" stroke="${color}" stroke-width="${active?3:1.5}"${directed?` marker-end="url(#logic-arrow-${active?'active':'base'})"`:''}/>${label}`;
  }).join('');
  const nodes=names.map(vertex=>{
    const {x,y}=positions.get(vertex),active=visitedSet.has(vertex);
    return `<g><title>${escapeXml(vertex)}</title><circle cx="${x}" cy="${y}" r="18" fill="${active?'var(--tool-color)':'var(--chrome)'}" stroke="${active?'var(--tool-color)':'var(--line-medium)'}" stroke-width="2"/><text x="${x}" y="${y+4}" fill="${active?'var(--bg)':'var(--text-strong)'}">${escapeXml(shortLabel(vertex,5))}</text></g>`;
  }).join('');
  return `<figure class="logic-graph-figure"><svg viewBox="0 0 600 400" role="img" aria-label="${escapeXml(title)}"><title>${escapeXml(title)}</title><defs><marker id="logic-arrow-base" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-soft)"/></marker><marker id="logic-arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--tool-color)"/></marker></defs>${lines}${nodes}</svg><figcaption>${escapeXml(caption)}</figcaption></figure>`;
}

export function renderLogicTree(root,{huffman=false,title='Árbol'}={}) {
  let leafCount=0,maxDepth=0;
  const nodes=[],links=[];
  function place(node,depth) {
    if (node===null||node===undefined) return null;
    maxDepth=Math.max(maxDepth,depth);
    const left=place(node.left,depth+1),right=place(node.right,depth+1);
    const position={node,depth,leaf:left===null&&right===null,
      x:left===null&&right===null?leafCount++:(left?.x??right.x)+(right===null||left===null?0:(right.x-left.x)/2)};
    nodes.push(position);
    if(left) links.push({parent:position,child:left,bit:'0'});
    if(right) links.push({parent:position,child:right,bit:'1'});
    return position;
  }
  place(root,0);
  if (!nodes.length) return '';
  const width=Math.max(600,leafCount*76),height=Math.max(140,(maxDepth+1)*72+24);
  const x=position=>leafCount===1?width/2:40+position.x*(width-80)/(leafCount-1);
  const y=position=>42+position.depth*72;
  const edges=links.map(({parent,child,bit})=>{
    const x1=x(parent),y1=y(parent),x2=x(child),y2=y(child);
    return `<line x1="${x1}" y1="${y1+19}" x2="${x2}" y2="${y2-19}" stroke="var(--text-soft)" stroke-width="1.5"/>${huffman?`<text class="logic-tree-bit" x="${(x1+x2)/2+8}" y="${(y1+y2)/2}">${bit}</text>`:''}`;
  }).join('');
  const circles=nodes.map(position=>{
    const node=position.node;
    const label=huffman?(node.symbol===undefined?node.weight:`${node.symbol}:${node.weight}`):node.value;
    return `<g><title>${escapeXml(label)}</title><circle cx="${x(position)}" cy="${y(position)}" r="19" fill="${position.leaf?'var(--tool-color)':'var(--chrome)'}" stroke="var(--tool-color)" stroke-width="2"/><text x="${x(position)}" y="${y(position)+4}" fill="${position.leaf?'var(--bg)':'var(--text-strong)'}">${escapeXml(shortLabel(label,5))}</text></g>`;
  }).join('');
  return `<figure class="logic-graph-figure logic-tree-figure"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(title)}" style="min-width:${width}px"><title>${escapeXml(title)}</title>${edges}${circles}</svg><figcaption>${huffman?'Ramas 0 y 1 forman los códigos; cada nodo muestra su frecuencia.':'Los nodos hoja están resaltados.'}</figcaption></figure>`;
}
