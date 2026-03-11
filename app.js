// SuperCalc v4.0.0 — Application Logic



// ── SERVICE WORKER (GitHub Pages) ───────────────────
let deferredPrompt=null;
if('serviceWorker' in navigator){
  const swCode=[
    "const CACHE='supercalc-4.0.0';",
    "const PRECACHE=['./','./index.html','./style.css','./app.js','https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap'];",
    "self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(PRECACHE.map(url=>c.add(new Request(url,{cache:'reload'})).catch(()=>{})))).then(()=>self.skipWaiting()));});",
    "self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});",
    "self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(cached=>{if(cached)return cached;return fetch(e.request).then(res=>{if(res&&res.status===200){const cl=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cl));}return res;}).catch(()=>caches.match(e.request));}));});"
  ].join('\n');
  const swBlob=new Blob([swCode],{type:'application/javascript'});
  const swUrl=URL.createObjectURL(swBlob);
  navigator.serviceWorker.register(swUrl,{scope:'./'}).then(reg=>{
    URL.revokeObjectURL(swUrl);
    reg.addEventListener('updatefound',()=>{
      const nw=reg.installing;
      nw.addEventListener('statechange',()=>{
        if(nw.state==='installed'&&navigator.serviceWorker.controller) showUpdateBanner();
      });
    });
  }).catch(()=>{});
}

window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault(); deferredPrompt=e; showInstallBanner();
});
window.addEventListener('appinstalled',()=>{const b=document.getElementById('install-banner');if(b)b.remove();});

function showInstallBanner(){
  if(document.getElementById('install-banner'))return;
  const b=document.createElement('div');
  b.id='install-banner';
  b.style.cssText='position:fixed;bottom:0;left:0;right:0;background:#0f1729;border-top:2px solid #f0c040;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px;z-index:9999;font-family:Space Grotesk,sans-serif;box-shadow:0 -4px 20px rgba(0,0,0,.5)';
  b.innerHTML='<div style="font-size:13px;color:#e2eaf8;font-weight:600">📲 Añadir <span style="color:#a594ff">SuperCalc</span> a inicio</div><div style="display:flex;gap:8px"><button onclick="installApp()" style="padding:7px 16px;background:#f0c040;color:#0a0f1a;border:none;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer">Instalar</button><button onclick="dismissInstall()" style="padding:7px 12px;background:none;border:1px solid #1e3356;color:#8ba3cc;border-radius:8px;font-size:12px;cursor:pointer">Ahora no</button></div>';
  document.body.appendChild(b);
}
function installApp(){if(!deferredPrompt)return;deferredPrompt.prompt();deferredPrompt.userChoice.then(()=>{
  deferredPrompt=null;dismissInstall();});
}
function dismissInstall(){const b=document.getElementById('install-banner');if(b)b.remove();}

// ── PALETTE ───────────────────────────────────────────
// ── PWA MANIFEST (SuperCalc branding) ──────────────
(()=>{
  const sz=512,cv2=document.createElement('canvas');
  cv2.width=sz;cv2.height=sz;
  const cx=cv2.getContext('2d');
  const g=cx.createLinearGradient(0,0,sz,sz);
  g.addColorStop(0,'#0d0b1f');g.addColorStop(1,'#1a1040');
  cx.fillStyle=g;
  if(cx.roundRect){cx.beginPath();cx.roundRect(0,0,sz,sz,sz*.2);cx.fill();}
  else{cx.fillRect(0,0,sz,sz);}
  const gr=cx.createRadialGradient(sz*.5,sz*.45,0,sz*.5,sz*.45,sz*.45);
  gr.addColorStop(0,'rgba(124,106,247,.4)');gr.addColorStop(1,'rgba(124,106,247,0)');
  cx.fillStyle=gr;cx.beginPath();cx.arc(sz*.5,sz*.45,sz*.45,0,Math.PI*2);cx.fill();
  cx.font='bold 300px Georgia,serif';
  cx.textAlign='center';cx.textBaseline='middle';
  cx.fillStyle='#a594ff';cx.shadowColor='#7c6af7';cx.shadowBlur=40;
  cx.fillText('Σ',sz*.5,sz*.52);cx.shadowBlur=0;
  const icon=cv2.toDataURL('image/png');
  const m={name:'SuperCalc',short_name:'SuperCalc',start_url:location.pathname,
    display:'standalone',background_color:'#080c14',theme_color:'#7c6af7',
    icons:[{src:icon,sizes:'192x192',type:'image/png'},{src:icon,sizes:'512x512',type:'image/png'}]};
  const b=new Blob([JSON.stringify(m)],{type:'application/manifest+json'});
  const l=document.createElement('link');l.rel='manifest';l.href=URL.createObjectURL(b);
  document.head.appendChild(l);
})();


const PAL=['#f0c040','#ff6eb4','#4da6ff','#ff8c42','#2dd4a0','#ff5572','#b084fc','#34d4c8','#facc15','#a3e635'];
function vc(i){ return PAL[i%PAL.length]; }
const RC='#b084fc', SC='#2dd4a0';

// ── STATE ─────────────────────────────────────────────
let mode=3, fracMode=false, showFigure=false;
let vecs=[];
let palIdx=0;
let nid=0, rV=null, sR=null, unkR=null;
let rotX=22, rotY=-38, scl=1, drag=null, lp=null;
let opS='+', opI=[];
let unkOp='·', unkTarget='0';

// ── FRACTIONS ─────────────────────────────────────────
function gcd(a,b){a=Math.abs(Math.round(a));b=Math.abs(Math.round(b));while(b){let t=b;b=a%b;a=t;}return a||1;}
function toFrac(x){
  if(!isFinite(x)||isNaN(x)) return '—';
  if(Math.abs(x)<1e-9) return '0';
  const sign=x<0?'-':''; x=Math.abs(x);
  let bN=Math.round(x),bD=1,bE=Math.abs(x-bN);
  for(let d=2;d<=500;d++){const n=Math.round(x*d),e=Math.abs(x-n/d);if(e<bE){bE=e;bN=n;bD=d;if(e<1e-9)break;}}
  if(bE>5e-4) return sign+x.toFixed(4);
  const g=gcd(bN,bD),n2=bN/g,d2=bD/g;
  return d2===1?sign+n2:sign+n2+'/'+d2;
}
function fN(x,dec=4){
  if(fracMode) return toFrac(x);
  if(isNaN(x)||!isFinite(x)) return '—';
  return x.toFixed(dec);
}
function fV(vx,vy,vz){ return mode===3?`(${fN(vx)}, ${fN(vy)}, ${fN(vz)})`:`(${fN(vx)}, ${fN(vy)})`; }


function toggleSection(el){
  const body=el.nextElementSibling;
  const arrow=el.querySelector('.collapsible-arrow');
  const isOpen=body.style.maxHeight&&body.style.maxHeight!=='0px';
  body.style.maxHeight=isOpen?'0px':(body.scrollHeight+20)+'px';
  if(arrow) arrow.classList.toggle('open',!isOpen);
}
function openAllSections(){
  document.querySelectorAll('.collapsible-body').forEach(b=>{b.style.maxHeight=(b.scrollHeight+20)+'px';});
  document.querySelectorAll('.collapsible-arrow').forEach(a=>a.classList.add('open'));
}

function togglePanel(){
  const bot=document.getElementById('bottom');
  const wrap=document.getElementById('panel-tog-wrap');
  const btn=document.getElementById('panel-tog-btn');
  const collapsed=bot.classList.toggle('collapsed');
  btn.classList.toggle('on',!collapsed);
  setTimeout(()=>resize(),50);
}
function toggleFrac(){
  fracMode=!fracMode;
  document.getElementById('frac-tog').classList.toggle('on',fracMode);
  document.getElementById('frac-lbl').textContent=fracMode?'FRAC':'DEC';
  if(document.getElementById('pM').classList.contains('on')) rM();
  if(document.getElementById('pE').classList.contains('on')) rE();
  if(document.getElementById('pI').classList.contains('on')) rI();
  if(document.getElementById('pO').classList.contains('on')) rO();
  rLeg();
}
function toggleFigure(){
  showFigure=!showFigure;
  document.getElementById('fig-tog').classList.toggle('on',showFigure);
  draw();
}

// ── MATH HELPERS ──────────────────────────────────────
const vmag=(v,m)=>m===3?Math.sqrt(v.vx**2+v.vy**2+v.vz**2):Math.sqrt(v.vx**2+v.vy**2);
const vdot=(a,b,m)=>a.vx*b.vx+a.vy*b.vy+(m===3?a.vz*b.vz:0);
const vcross=(a,b)=>({x:a.vy*b.vz-a.vz*b.vy,y:a.vz*b.vx-a.vx*b.vz,z:a.vx*b.vy-a.vy*b.vx});
const vangle=(a,b,m)=>{const d=vdot(a,b,m),ma=vmag(a,m),mb=vmag(b,m);return(!ma||!mb)?0:Math.acos(Math.max(-1,Math.min(1,d/(ma*mb))))*180/Math.PI;};
const vproj=(a,b,m)=>{const mb=vmag(b,m);return mb?vdot(a,b,m)/mb:0;};

function eduHint(t,v){
  if(t==='dot'){if(Math.abs(v)<.001)return'⊥ Ortogonales';return v>0?'↑ Misma dirección':'↓ Dir. opuesta';}
  if(t==='ang'){if(Math.abs(v)<.1)return'∥ Paralelos';if(Math.abs(v-180)<.1)return'∥ Antiparalelos';if(Math.abs(v-90)<.5)return'⊥ Perpendiculares';return'';}
  if(t==='cr'){if(v<.001)return'∥ Paralelos (|cruz|=0)';return'Área paral. = '+fN(v,4);}
  return'';
}

// ── MODE ──────────────────────────────────────────────
function setMode(m){
  mode=m;
  document.getElementById('br2').classList.toggle('on',m===2);
  document.getElementById('br3').classList.toggle('on',m===3);
  rV=null;sR=null;unkR=null;opI=[];
  renderVecs();rM();rO();rE();rI();draw();
}
function resetView(){rotX=22;rotY=-38;scl=1;draw();}
function showTab(t){
  ['V','M','O','E','I'].forEach((x,i)=>{
    document.querySelectorAll('.tab')[i].classList.toggle('on',x===t);
    document.getElementById('p'+x).classList.toggle('on',x===t);
  });
  if(t==='M')rM();if(t==='O')rO();if(t==='E')rE();if(t==='I')rI();
}

// ── VECTOR PANEL ──────────────────────────────────────
function renderVecs(){
  let h='';
  vecs.forEach((v,i)=>{
    const c=v.cl;
    const mag2=Math.sqrt(v.vx**2+v.vy**2+(mode===3?v.vz**2:0));
    const zeroWarn=mag2<1e-9?'<span style="font-size:9px;color:var(--red);font-family:Space Mono,monospace;margin-left:auto">|v|=0</span>':'';
    const zf=(l,val,k)=>mode===3?`<div class="inp-group"><label style="color:${c}">${l}</label><input type="number" value="${val}" oninput="uV(${v.id},'${k}',this.value)"/></div>`:'';
    h+=`<div class="vec-card" style="border-left-color:${c}">
      <div class="vec-card-header">
        <div class="vec-color-dot" style="background:${c}"></div>
        <input class="vec-name-input" value="${v.nm}" maxlength="4" oninput="uN(${v.id},this.value)" style="color:${c}"/>
        <button class="badge ${v.on?'badge-on':'badge-off'}" onclick="togV(${v.id})">${v.on?'ON':'OFF'}</button>
        ${zeroWarn}
        ${vecs.length>1?`<button class="badge badge-del" onclick="delV(${v.id})">✕</button>`:''}
      </div>
      <div class="vec-inputs">
        <div class="inp-group"><label style="color:#ff5572">X</label><input type="number" value="${v.vx}" oninput="uV(${v.id},'vx',this.value)"/></div>
        <div class="inp-group"><label style="color:#2dd4a0">Y</label><input type="number" value="${v.vy}" oninput="uV(${v.id},'vy',this.value)"/></div>
        ${zf('Z',v.vz,'vz')}
      </div>
    </div>`;
  });
  h+=`<button class="add-vec-btn" onclick="addV()">+ Agregar vector</button>`;
  document.getElementById('pV').innerHTML=h;
  rLeg();
}
function uV(id,k,val){const v=vecs.find(v=>v.id===id);if(v)v[k]=parseFloat(val)||0;draw();if(document.getElementById('pM').classList.contains('on'))rM();}
function uN(id,val){const v=vecs.find(v=>v.id===id);if(v)v.nm=val||'v';rLeg();if(document.getElementById('pO').classList.contains('on'))rO();if(document.getElementById('pE').classList.contains('on'))rE();if(document.getElementById('pI').classList.contains('on'))rI();}
function togV(id){const v=vecs.find(v=>v.id===id);if(v)v.on=!v.on;renderVecs();draw();if(document.getElementById('pM').classList.contains('on'))rM();}
function delV(id){if(vecs.length<=1){alert('Al menos 1 vector.');return;}vecs=vecs.filter(v=>v.id!==id);opI=opI.filter(i=>i!==id);renderVecs();draw();rO();rE();rI();}
function addV(){
  const used=vecs.map(v=>v.nm);
  const pool=['C','D','E','F','G','H','P','Q','R','S','T','U','W'];
  const nm=pool.find(n=>!used.includes(n))||'V'+nid;
  vecs.push({id:nid++,on:true,nm,vx:1,vy:1,vz:1,cl:PAL[palIdx++%PAL.length]});
  renderVecs();draw();
}

// ── LEGEND ────────────────────────────────────────────
function rLeg(){
  let h='';
  vecs.filter(v=>v.on).forEach(v=>{
    const c=v.cl;
    const cp=mode===3?`(${v.vx},${v.vy},${v.vz})`:`(${v.vx},${v.vy})`;
    h+=`<div class="leg-item" style="border-left-color:${c}"><div class="leg-dot" style="background:${c}"></div><span class="leg-text">${v.nm} ${cp}</span></div>`;
  });
  if(rV&&!rV.scalar){const cp=fV(rV.vx,rV.vy,rV.vz);h+=`<div class="leg-item" style="border-left-color:${RC}"><div class="leg-dot" style="background:${RC}"></div><span class="leg-text">res ${cp}</span></div>`;}
  if(sR&&!sR.err){const cp=fV(sR.vx,sR.vy,sR.vz);h+=`<div class="leg-item" style="border-left-color:${SC}"><div class="leg-dot" style="background:${SC}"></div><span class="leg-text">${sR.nm} ${cp}</span></div>`;}
  document.getElementById('legend').innerHTML=h;
}

// ── MATH PANEL ────────────────────────────────────────
function rM(){
  const mc=document.getElementById('pM');
  const act=vecs.filter(v=>v.on);
  if(!act.length){mc.innerHTML='<p style="color:var(--text3);font-size:12px;padding:4px 0">Sin vectores activos.</p>';return;}
  let h='';
  h+=`<div class="section-title">Magnitudes · Ángulos directores</div><div class="math-grid">`;
  act.forEach(v=>{
    const c=v.cl,m=vmag(v,mode);
    const ax=m?Math.acos(Math.max(-1,Math.min(1,v.vx/m)))*180/Math.PI:0;
    const ay=m?Math.acos(Math.max(-1,Math.min(1,v.vy/m)))*180/Math.PI:0;
    const az=mode===3&&m?Math.acos(Math.max(-1,Math.min(1,v.vz/m)))*180/Math.PI:null;
    const ux=m?fN(v.vx/m):'—',uy=m?fN(v.vy/m):'—',uz=mode===3&&m?fN(v.vz/m):'—';
    h+=`<div class="math-card full"><div class="math-label" style="color:${c}">${v.nm}</div>
      <div class="math-value">|${v.nm}| = ${fN(m)}</div>
      <div class="math-value sm">αx=${fN(ax,2)}° αy=${fN(ay,2)}°${az!==null?' αz='+fN(az,2)+'°':''}</div>
      <div class="math-value sm" style="color:var(--text3)">û = (${ux}, ${uy}${mode===3?', '+uz:''})</div>
    </div>`;
  });
  h+=`</div>`;
  // Multi-vector global stats (3+ vectors)
  if(act.length>=2){
    const sumV={vx:act.reduce((s,v)=>s+v.vx,0),vy:act.reduce((s,v)=>s+v.vy,0),vz:act.reduce((s,v)=>s+v.vz,0)};
    const sumM=vmag(sumV,mode);
    const names=act.map((v,i)=>`<span style="color:${v.cl}">${v.nm}</span>`).join('+');
    h+=`<div class="section-title">Suma de todos los vectores</div>
    <div class="math-grid">
      <div class="math-card full"><div class="math-label">${names}</div>
        <div class="math-value sm">${fV(sumV.vx,sumV.vy,sumV.vz)}</div>
        <div class="math-value">|suma| = ${fN(sumM)}</div>
      </div>
    </div>`;
  }
  // All pairwise combinations — collapsible
  for(let i=0;i<act.length;i++) for(let j=i+1;j<act.length;j++){
    const a=act[i],b=act[j],ci=a.cl,cj=b.cl;
    const d=vdot(a,b,mode),an=vangle(a,b,mode),pab=vproj(a,b,mode),pba=vproj(b,a,mode);
    const cr=mode===3?vcross(a,b):null,crM=cr?Math.sqrt(cr.x**2+cr.y**2+cr.z**2):0;
    const hint=eduHint('ang',an);
    h+=`<div class="collapsible-header" onclick="toggleSection(this)">
      <div class="section-title" style="margin-bottom:0;border-bottom:none;flex:1">
        <span style="color:${ci}">${a.nm}</span>&nbsp;—&nbsp;<span style="color:${cj}">${b.nm}</span>
        ${hint?`<span style="font-size:9px;color:var(--green);font-style:italic;font-weight:400;margin-left:6px">${hint}</span>`:''}
      </div>
      <span class="collapsible-arrow open">▶</span>
    </div>
    <div class="collapsible-body" style="max-height:400px">
    <div class="math-grid" style="margin-bottom:10px">
      <div class="math-card"><div class="math-label">Prod. punto</div><div class="math-value">${fN(d)}</div><div class="math-hint">${eduHint('dot',d)}</div></div>
      <div class="math-card"><div class="math-label">Ángulo</div><div class="math-value">${fN(an,2)}°</div></div>
      <div class="math-card"><div class="math-label">Proy ${a.nm}→${b.nm}</div><div class="math-value">${fN(pab)}</div></div>
      <div class="math-card"><div class="math-label">Proy ${b.nm}→${a.nm}</div><div class="math-value">${fN(pba)}</div></div>
      ${cr?`<div class="math-card full"><div class="math-label">${a.nm} × ${b.nm}</div><div class="math-value sm">(${fN(cr.x,2)}, ${fN(cr.y,2)}, ${fN(cr.z,2)})</div><div class="math-hint">${eduHint('cr',crM)}</div></div>`:''}
    </div></div>`;
  }
  mc.innerHTML=h;
}

// ── OPS PANEL ─────────────────────────────────────────
function rO(){
  const p=document.getElementById('pO');
  const sb=vecs.map((v,i)=>{const c=v.cl,sel=opI.includes(v.id);return`<button class="ops-vec-btn ${sel?'on':''}" style="${sel?`color:${c};border-color:${c}`:''}" onclick="tO(${v.id})">${v.nm}</button>`;}).join('');
  const ob=['+','−','×','·'].map(o=>`<button class="op-btn ${opS===o?'on':''}" onclick="sO('${o}')">${o}</button>`).join('');
  let rh='';
  if(rV){
    if(rV.scalar){rh=`<div class="result-box"><div class="result-title">⟶ Resultado escalar</div><div class="result-val">${fN(rV.sv,4)}</div><div class="result-sub">Valor escalar — no se grafica</div></div>`;}
    else{const m=vmag(rV,mode);const cp=fV(rV.vx,rV.vy,rV.vz);rh=`<div class="result-box"><div class="result-title">⟶ Resultado vector</div><div class="result-val">${cp}</div><div class="result-sub">|res| = ${fN(m,4)}</div></div><button class="add-vec-btn" style="border-style:solid;border-color:${RC};color:${RC};margin-top:0" onclick="saveR()">+ Guardar como vector</button>`;}
  }
  p.innerHTML=`<div class="section-title">Selecciona vectores</div>
    <div class="ops-vec-btns">${sb}</div>
    <div class="section-title">Operación</div>
    <div class="op-btns">${ob}</div>
    `+(() => {
    const selNames = opI.map(id=>{const v=vecs.find(v=>v.id===id);return v?v.nm:'?';});
    let expr = '';
    if(selNames.length>=2){
      if(opS==='+') expr=selNames.join(' + ');
      else if(opS==='−') expr=selNames.join(' − ');
      else if(opS==='×') expr=selNames.join(' × ');
      else if(opS==='·') expr=selNames.join(' · ');
      expr = '<div style="font-family:Space Mono,monospace;font-size:12px;color:var(--text2);background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:8px 12px;margin-bottom:10px;text-align:center">'+expr+' = ?</div>';
    }
    return expr;
  })()+`<button class="action-btn" onclick="compute()">Calcular y graficar</button>${rh}`;
}
function tO(id){const i=opI.indexOf(id);i>=0?opI.splice(i,1):opI.push(id);rO();}
function sO(o){opS=o;rO();}
function compute(){
  if(opI.length<2){alert('Selecciona al menos 2 vectores.');return;}
  const sel=opI.map(id=>vecs.find(v=>v.id===id)).filter(Boolean);
  if(opS==='+')rV={vx:sel.reduce((s,v)=>s+v.vx,0),vy:sel.reduce((s,v)=>s+v.vy,0),vz:sel.reduce((s,v)=>s+v.vz,0),scalar:false};
  else if(opS==='−')rV={vx:sel.slice(1).reduce((s,v)=>s-v.vx,sel[0].vx),vy:sel.slice(1).reduce((s,v)=>s-v.vy,sel[0].vy),vz:sel.slice(1).reduce((s,v)=>s-v.vz,sel[0].vz),scalar:false};
  else if(opS==='×'){if(mode===2){alert('Cruz solo en R³.');return;}if(sel.length!==2){alert('Exactamente 2 vectores.');return;}const cr=vcross(sel[0],sel[1]);rV={vx:cr.x,vy:cr.y,vz:cr.z,scalar:false};}
  else if(opS==='·'){if(sel.length!==2){alert('Exactamente 2 vectores.');return;}rV={scalar:true,sv:vdot(sel[0],sel[1],mode)};}
  rO();rLeg();draw();
}
function saveR(){if(!rV||rV.scalar)return;const used=vecs.map(v=>v.nm);const nm=['R','S','T','P','Q'].find(n=>!used.includes(n))||'R'+nid;vecs.push({id:nid++,on:true,nm,...rV,cl:PAL[palIdx++%PAL.length]});rV=null;renderVecs();rO();draw();}

// ── ECUACIÓN SOLVER ───────────────────────────────────
function pLin(expr,unk,kn,comp){
  let e=expr.replace(/\s/g,'');e=e.replace(/([^+\-\(])\-/g,'$1+-');if(e.startsWith('-'))e='0+'+e;
  const toks=[];let depth=0,cur='';
  for(let i=0;i<e.length;i++){const ch=e[i];if(ch==='(')depth++;else if(ch===')')depth--;if(ch==='+'&&depth===0){toks.push(cur);cur='';}else cur+=ch;}
  if(cur)toks.push(cur);
  let coef=0,cst=0;
  for(const tok of toks.filter(t=>t)){
    const t=tok.trim();if(!t)continue;
    const pm=t.match(/^([+\-]?\d*\.?\d*)\*?\((.+)\)$/);
    if(pm){const s=pm[1]===''||pm[1]==='+'?1:pm[1]==='-'?-1:parseFloat(pm[1]);const inn=pLin(pm[2],unk,kn,comp);coef+=s*inn.coef;cst+=s*inn.cst;continue;}
    let sign=1,rest=t;if(rest.startsWith('-')){sign=-1;rest=rest.slice(1);}else if(rest.startsWith('+'))rest=rest.slice(1);
    const sm=rest.match(/^(\d+\.?\d*)\*?(.+)$/);let s=1,nm='';if(sm){s=parseFloat(sm[1]);nm=sm[2];}else nm=rest;
    s*=sign;nm=nm.toLowerCase().replace('*','');
    if(nm===unk.toLowerCase()){coef+=s;continue;}
    if(kn[nm]){cst+=s*(kn[nm][comp]||0);continue;}
    const n=parseFloat(nm);if(!isNaN(n)){cst+=s*n;continue;}
    throw new Error('No reconozco "'+nm+'"');
  }
  return{coef,cst};
}
function solveEq(eqStr,unknNm){
  const eq=eqStr.replace(/\s/g,'').toLowerCase();const parts=eq.split('=');
  if(parts.length!==2)return{err:'Necesita exactamente un ='};
  const kn={};vecs.forEach(v=>{kn[v.nm.toLowerCase()]={vx:v.vx,vy:v.vy,vz:v.vz};});
  const unk=unknNm.toLowerCase();if(kn[unk])return{err:'"'+unknNm+'" ya es un vector conocido.'};
  const comps=mode===3?['vx','vy','vz']:['vx','vy'];const res={},steps=[];
  for(const comp of comps){
    const cl=comp==='vx'?'x':comp==='vy'?'y':'z';
    try{const L=pLin(parts[0],unk,kn,comp),R=pLin(parts[1],unk,kn,comp);
      const a=L.coef-R.coef,b=R.cst-L.cst;
      if(Math.abs(a)<1e-12){if(Math.abs(b)<1e-12)return{err:cl+': infinitas soluciones'};return{err:cl+': sin solución'};}
      res[comp]=b/a;steps.push(cl+': '+fN(a,3)+'·'+unknNm+' = '+fN(b,3)+'  →  '+unknNm+cl+' = '+fN(b/a,4));
    }catch(e){return{err:'Error en '+cl+': '+e.message};}
  }
  if(mode===2)res.vz=0;return{res,steps};
}
function rE(){
  const p=document.getElementById('pE');
  const vn=vecs.map(v=>`<span style="color:${v.cl}">${v.nm}</span>`).join(', ');
  const ex=vecs.length>=2?`${vecs[0].nm}+2${vecs[1].nm}-x=4(x-${vecs[0].nm})`:'A+2B-x=4(x-A)';
  let sh='';
  if(sR){
    if(sR.err){sh=`<div class="error-box">⚠ ${sR.err}</div>`;}
    else{const cp=fV(sR.vx,sR.vy,sR.vz);const m=vmag({vx:sR.vx,vy:sR.vy,vz:sR.vz||0},mode);
      sh=`<div class="solve-result"><div class="solve-title">✓ ${sR.nm} resuelto</div>
        ${sR.steps.map(s=>`<div class="solve-step"><b>›</b> ${s}</div>`).join('')}
        <div class="solve-final">${sR.nm} = ${cp}</div>
        <div class="solve-mag">|${sR.nm}| = ${fN(m,4)}</div></div>
        <button class="add-vec-btn" style="border-style:solid;border-color:${SC};color:${SC};margin-top:0" onclick="saveSol()">+ Graficar ${sR.nm}</button>`;}
  }
  p.innerHTML=`<div class="solver-desc">Vectores: ${vn}<br/>Escribe una ecuación vectorial y despeja la incógnita.<br/>Ejemplo: <strong>${ex}</strong></div>
    <div class="eq-row"><span class="eq-label">Incógnita:</span><input class="eq-input" id="iu" value="x" maxlength="4" style="max-width:80px"/></div>
    <input class="eq-input" id="ie" placeholder="${ex}" style="width:100%;margin-bottom:8px"/>
    <button class="action-btn" onclick="runSolve()">Resolver y graficar</button>${sh}`;
}
function runSolve(){const eq=document.getElementById('ie').value.trim();const unk=document.getElementById('iu').value.trim();if(!eq||!unk){alert('Completa ecuación e incógnita.');return;}const r=solveEq(eq,unk);if(r.err){sR={err:r.err};rE();return;}sR={nm:unk,steps:r.steps,vx:r.res.vx,vy:r.res.vy,vz:r.res.vz||0};rE();rLeg();draw();}
function saveSol(){if(!sR||sR.err)return;const used=vecs.map(v=>v.nm);const nm=!used.includes(sR.nm)?sR.nm:(['R','S','T'].find(n=>!used.includes(n))||'S'+nid);vecs.push({id:nid++,on:true,nm,vx:sR.vx,vy:sR.vy,vz:sR.vz||0,cl:PAL[palIdx++%PAL.length]});sR=null;renderVecs();rE();draw();}

// ── INCÓGNITA (componente desconocida) ────────────────
// Resuelve: operación(A,B) = target  donde A o B tienen componentes con variables
// Variables como "x","k" en componentes, resuelve la(s) variable(s)
let unkVecs=[
  {nm:'A',comps:['3','5','0']},
  {nm:'B',comps:['5','x','0']},
];

function rI(){
  const p=document.getElementById('pI');
  const ops=['·','|A|','|B|','+','-'];
  const opBtns=ops.map(o=>`<button class="unk-op-btn ${unkOp===o?'on':''}" onclick="setUnkOp('${o}')">${o}</button>`).join('');
  let vecRows='';
  unkVecs.forEach((v,i)=>{
    const compsCount=mode===3?3:2;
    const labels=['X','Y','Z'];
    const colors=['var(--red)','var(--green)','var(--blue)'];
    let compInputs='';
    for(let c=0;c<compsCount;c++){
      compInputs+=`<div class="unk-comp-group">
        <span class="unk-comp-lbl" style="color:${colors[c]}">${labels[c]}</span>
        <input class="unk-comp" value="${v.comps[c]||'0'}" placeholder="${labels[c].toLowerCase()}" oninput="updUnkVec(${i},${c},this.value)" title="Número o variable (ej: x, 2k)"/>
      </div>`;
    }
    const canDel=unkVecs.length>1;
    vecRows+=`<div class="unk-vec-item">
      <div class="unk-vec-name" style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <input style="background:none;border:none;border-bottom:2px solid var(--blue);color:var(--blue);font-family:'Space Mono',monospace;font-size:14px;font-weight:700;width:44px;outline:none;text-align:center;padding:1px 2px" value="${v.nm}" oninput="updUnkName(${i},this.value)"/>
        <span style="font-size:10px;color:var(--text3);font-family:'Space Mono',monospace">vector ${i+1}</span>
        ${canDel?`<button class="badge badge-del" onclick="delUnkVec(${i})" style="margin-left:auto">✕</button>`:''}
      </div>
      <div class="unk-comp-row">${compInputs}</div>
    </div>`;
  });
  let resHtml='';
  if(unkR){
    if(unkR.err){resHtml=`<div class="error-box">⚠ ${unkR.err}</div>`;}
    else{
      const steps=unkR.steps.map(s=>`<div class="solve-step"><b>›</b> ${s}</div>`).join('');
      resHtml=`<div class="unk-result-box"><div class="unk-result-title">✓ Solución</div>${steps}
        ${Object.entries(unkR.vars).map(([k,v])=>`<div class="unk-result-val">${k} = ${fN(v,6)}</div>`).join('')}
        <div class="unk-result-check" id="unk-check">${unkR.check}</div>
      </div>`;
    }
  }
  p.innerHTML=`<div class="solver-desc" style="border-left:3px solid var(--blue)">
      Define vectores con <strong>componentes numéricas o variables</strong> (ej: x, k, t).<br/>
      Selecciona la operación y el resultado esperado para resolver.<br/>
      Ejemplo: <strong>A(3,5) · B(5,x) = 0</strong> → x = −3
    </div>
    <div class="section-title">Vectores con incógnita</div>
    <div class="unk-vec-row">${vecRows}</div>
    <button class="add-vec-btn" style="margin-bottom:10px" onclick="addUnkVec()">+ Agregar vector</button>
    <div class="section-title">Operación y resultado esperado</div>
    <div class="unk-op-row">${opBtns}
      <span style="font-size:11px;color:var(--text3);font-family:'Space Mono',monospace">=</span>
      <input class="unk-result-input" id="unk-target" value="${unkTarget}" placeholder="0" oninput="unkTarget=this.value"/>
    </div>
    <button class="action-btn blue" onclick="runUnkSolve()">Resolver incógnita</button>
    ${resHtml}`;
}
function setUnkOp(o){unkOp=o;rI();}
function updUnkVec(i,c,val){unkVecs[i].comps[c]=val;unkR=null;}
function updUnkName(i,val){unkVecs[i].nm=val||'A';}
function addUnkVec(){unkVecs.push({nm:String.fromCharCode(65+unkVecs.length),comps:['0','0','0']});unkR=null;rI();}
function delUnkVec(i){if(unkVecs.length<=1)return;unkVecs.splice(i,1);unkR=null;rI();}

function runUnkSolve(){
  const target=parseFloat(unkTarget);
  const isScalar=(unkOp==='·'||unkOp==='|A|'||unkOp==='|B|');
  const compsN=mode===3?3:2;

  // Parse vectors: each component is either a number or "coef*var + const"
  // We support: number, variable name, scalar*variable
  const varNames=new Set();
  const parsedVecs=unkVecs.map(v=>({
    nm:v.nm,
    comps:v.comps.slice(0,compsN).map(str=>parseComp(str.trim(),varNames))
  }));
  const vars=[...varNames];

  if(vars.length===0){unkR={err:'No hay incógnitas. Escribe una variable (ej: x) en alguna componente.'};rI();return;}
  if(vars.length>1&&!isScalar){unkR={err:'Múltiples incógnitas solo soportado para producto punto.'};rI();return;}

  try{
    let steps=[], solved={};

    if(unkOp==='·'){
      if(unkVecs.length<2){unkR={err:'Necesitas al menos 2 vectores para producto punto.'};rI();return;}
      // dot(A,B) = target → linear in vars
      // sum_i A[i]*B[i] = target
      // Each A[i]*B[i] = (aCoef*var+aConst)*(bCoef*var+bConst) — can be quadratic if var appears in both
      // For simplicity: collect linear terms (var appears in at most one vector per component)
      const A=parsedVecs[0],B=parsedVecs[1];
      // Build: sum coef*var + const = target
      const varCoef={};vars.forEach(v=>varCoef[v]=0);
      let constTerm=0, isQuadratic=false;
      for(let c=0;c<compsN;c++){
        const a=A.comps[c],b=B.comps[c];
        // (a.coef*var+a.const)*(b.coef*var+b.const)
        if(a.coef!==0&&b.coef!==0&&a.varName===b.varName){isQuadratic=true;break;}
        // linear cross terms
        if(a.coef!==0) varCoef[a.varName]=(varCoef[a.varName]||0)+a.coef*b.const;
        if(b.coef!==0) varCoef[b.varName]=(varCoef[b.varName]||0)+b.coef*a.const;
        constTerm+=a.const*b.const;
      }
      if(isQuadratic){unkR={err:'La incógnita aparece en ambos vectores en la misma componente (ecuación cuadrática). Coloca x solo en uno de los dos vectores.'};rI();return;}
      // Solve each variable (if only 1 var this is simple)
      vars.forEach(vn=>{
        const a=varCoef[vn]||0;const b=target-constTerm;
        if(Math.abs(a)<1e-12){unkR={err:'Coeficiente de '+vn+' = 0, ecuación sin solución única.'};return;}
        solved[vn]=b/a;
        steps.push(`Producto punto: ${fN(a,4)}·${vn} + ${fN(constTerm,4)} = ${fN(target,4)}`);
        steps.push(`${fN(a,4)}·${vn} = ${fN(b,4)}  →  ${vn} = ${fN(b/a,6)}`);
      });
      // Verification
      const Ar=parsedVecs[0].comps.map(c=>c.coef*(solved[c.varName]||0)+c.const);
      const Br=parsedVecs[1].comps.map(c=>c.coef*(solved[c.varName]||0)+c.const);
      const checkDot=Ar.reduce((s,v,i)=>s+v*Br[i],0);
      unkR={vars:solved,steps,check:`Verificación: ${unkVecs[0].nm}·${unkVecs[1].nm} = ${fN(checkDot,6)} (esperado: ${fN(target,4)})`};
    }
    else if(unkOp==='|A|'||unkOp==='|B|'){
      const idx=unkOp==='|A|'?0:1;
      const V=parsedVecs[idx];
      if(!V){unkR={err:'Vector no definido.'};rI();return;}
      // |V|² = target² → sum(coef*var+const)² = target²
      // Expand: sum((coef*var)²+2*coef*var*const+const²) = target²
      // → (sum coef²)*var²+2*(sum coef*const)*var+(sum const²-target²)=0
      const vn=vars[0];
      let A2=0,B2=0,C2=0;
      for(let c=0;c<compsN;c++){
        const comp=V.comps[c];
        A2+=comp.coef**2;B2+=2*comp.coef*comp.const;C2+=comp.const**2;
      }
      C2-=target**2;
      if(Math.abs(A2)<1e-12){unkR={err:'La variable no afecta la magnitud.'};rI();return;}
      const disc=B2**2-4*A2*C2;
      if(disc<0){unkR={err:'No existe solución real (discriminante negativo).'};rI();return;}
      const sol1=(-B2+Math.sqrt(disc))/(2*A2),sol2=(-B2-Math.sqrt(disc))/(2*A2);
      const unique=Math.abs(sol1-sol2)<1e-9;
      if(unique){solved[vn]=sol1;steps.push(`${vn} = ${fN(sol1,6)}`);}
      else{solved[vn]=sol1;steps.push(`${vn} = ${fN(sol1,6)} ó ${vn} = ${fN(sol2,6)} (dos soluciones — se usa la primera)`);}
      unkR={vars:solved,steps,check:`|${V.nm}| con ${vn}=${fN(sol1,4)}: ${fN(Math.sqrt(V.comps.reduce((s,c)=>{const v=c.coef*sol1+c.const;return s+v*v;},0)),6)} (esperado: ${fN(target,4)})`};
    }
    else if(unkOp==='+'||unkOp==='-'){
      const sign=unkOp==='+'?1:-1;
      // Component-wise: for each comp, (A±B)[c] = target[c]
      // But target here is scalar — interpret as magnitude of result = target
      unkR={err:'Para suma/resta define la ecuación completa en la pestaña Ecuación. Aquí usa · o magnitud.'};rI();return;
    }
  }catch(e){unkR={err:e.message};}
  rI();
}

function parseComp(str,varSet){
  // Returns {coef, const, varName} for linear expr like "3", "x", "2x", "-x", "3.5k"
  if(!str||str==='') return {coef:0,const:0,varName:null};
  const num=parseFloat(str);
  if(!isNaN(num)&&str.match(/^[\-\+]?\d*\.?\d+$/)) return {coef:0,const:num,varName:null};
  // Try to match: optional sign, optional number, variable name
  const m=str.match(/^([+\-]?\d*\.?\d*)\*?([a-zA-Z]\w*)$/);
  if(m){
    const coef=m[1]===''||m[1]==='+'?1:m[1]==='-'?-1:parseFloat(m[1]);
    const varName=m[2];
    varSet.add(varName);
    return {coef,const:0,varName};
  }
  // Try: const + coef*var (not supported in input, but handle pure number again)
  throw new Error('Componente no reconocida: "'+str+'". Usa número o variable (ej: x, 2k, -3t)');
}

// ── CANVAS ────────────────────────────────────────────
const cv=document.getElementById('c'),ctx=cv.getContext('2d');
const toRad=d=>d*Math.PI/180;
function p3(x,y,z,cx,cy,s){
  const cY=Math.cos(toRad(rotY)),sY=Math.sin(toRad(rotY));
  const x1=x*cY+z*sY,z1=-x*sY+z*cY;
  const cX=Math.cos(toRad(rotX)),sX=Math.sin(toRad(rotX));
  return{sx:cx+x1*s,sy:cy-(y*cX-z1*sX)*s};
}
function p2(x,y,cx,cy,s){return{sx:cx+x*s,sy:cy-y*s};}

function drawArrow(x1,y1,x2,y2,col,lw){
  const dx=x2-x1,dy=y2-y1,len=Math.sqrt(dx*dx+dy*dy);if(len<2)return;
  const ux=dx/len,uy=dy/len,hw=9,hl=16,bx=x2-ux*hl,by=y2-uy*hl;
  ctx.shadowColor=col;ctx.shadowBlur=18;
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(bx,by);ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.lineCap='round';ctx.stroke();
  ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(bx+uy*hw,by-ux*hw);ctx.lineTo(bx-uy*hw,by+ux*hw);
  ctx.closePath();ctx.fillStyle=col;ctx.fill();ctx.shadowBlur=0;
}

function drawAxis3(o,pp,pl,pn,nl,col,lbl,lw,axLen,s,cx,cy){
  // Negative dashed
  ctx.beginPath();ctx.moveTo(o.sx,o.sy);ctx.lineTo(pn.sx,pn.sy);
  ctx.strokeStyle=col;ctx.lineWidth=lw*.5;ctx.globalAlpha=.2;ctx.setLineDash([5,7]);ctx.lineCap='round';ctx.stroke();ctx.setLineDash([]);
  ctx.globalAlpha=.2;ctx.fillStyle=col;ctx.font='bold 11px Space Mono';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('-'+lbl,nl.sx,nl.sy);
  // Positive solid
  ctx.beginPath();ctx.moveTo(o.sx,o.sy);ctx.lineTo(pp.sx,pp.sy);
  ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.globalAlpha=.9;ctx.setLineDash([]);ctx.stroke();
  const dx=pp.sx-o.sx,dy=pp.sy-o.sy,l=Math.sqrt(dx*dx+dy*dy);
  if(l>4){const ux=dx/l,uy=dy/l,hw=5,hl=11,bx=pp.sx-ux*hl,by=pp.sy-uy*hl;ctx.beginPath();ctx.moveTo(pp.sx,pp.sy);ctx.lineTo(bx+uy*hw,by-ux*hw);ctx.lineTo(bx-uy*hw,by+ux*hw);ctx.closePath();ctx.fillStyle=col;ctx.globalAlpha=.9;ctx.fill();}
  // Axis label
  ctx.globalAlpha=.9;ctx.fillStyle=col;ctx.font='bold 13px Space Mono';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(lbl,pl.sx,pl.sy);
  ctx.globalAlpha=1;
}

// Draw tick marks and numbers on axes
function adaptiveStep(axLen){
  if(axLen>=50) return 10;
  if(axLen>=21) return 5;
  return 2;
}
function drawAxisTicks3(o,dir,col,axLen,s,cx,cy,fn3){
  const step=adaptiveStep(axLen);
  for(let v=step;v<=Math.floor(axLen);v+=step){
    const pp=fn3(dir[0]*v,dir[1]*v,dir[2]*v,cx,cy,s);
    const pn=fn3(-dir[0]*v,-dir[1]*v,-dir[2]*v,cx,cy,s);
    ctx.globalAlpha=.9;ctx.beginPath();ctx.arc(pp.sx,pp.sy,2.5,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
    ctx.globalAlpha=.3;ctx.beginPath();ctx.arc(pn.sx,pn.sy,2,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
    const lbl=String(v);
    const nx=pp.sx+11,ny=pp.sy+11;
    ctx.font='bold 11px Space Mono';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.globalAlpha=.6;ctx.fillStyle='#060a10';ctx.fillRect(nx-9,ny-7,18,14);
    ctx.globalAlpha=1;ctx.fillStyle=col;ctx.fillText(lbl,nx,ny);
    const nnx=pn.sx+11,nny=pn.sy+11;
    ctx.globalAlpha=.25;ctx.fillStyle='#060a10';ctx.fillRect(nnx-11,nny-7,22,14);
    ctx.globalAlpha=.4;ctx.fillStyle=col;ctx.fillText('-'+lbl,nnx,nny);
  }
  ctx.globalAlpha=1;
}

function drawAxisTicks2(o,isX,col,axLen,s,cx,cy){
  const step=adaptiveStep(axLen);
  for(let v=step;v<=Math.floor(axLen);v+=step){
    const pp=isX?p2(v,0,cx,cy,s):p2(0,v,cx,cy,s);
    const pn=isX?p2(-v,0,cx,cy,s):p2(0,-v,cx,cy,s);
    ctx.globalAlpha=.9;ctx.beginPath();ctx.arc(pp.sx,pp.sy,2.5,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
    ctx.globalAlpha=.3;ctx.beginPath();ctx.arc(pn.sx,pn.sy,2,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
    const lbl=String(v);
    const nx=pp.sx+(isX?0:-16), ny=pp.sy+(isX?14:0);
    ctx.font='bold 12px Space Mono';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.globalAlpha=.6;ctx.fillStyle='#060a10';ctx.fillRect(nx-10,ny-8,20,16);
    ctx.globalAlpha=1;ctx.fillStyle=col;ctx.fillText(lbl,nx,ny);
    const nnx=pn.sx+(isX?0:-20), nny=pn.sy+(isX?14:0);
    ctx.globalAlpha=.25;ctx.fillStyle='#060a10';ctx.fillRect(nnx-12,nny-8,24,16);
    ctx.globalAlpha=.45;ctx.fillStyle=col;ctx.fillText('-'+lbl,nnx,nny);
  }
  ctx.globalAlpha=1;
}

function draw(){
  const W=cv.width,H=cv.height,cx=W/2,cy=H/2;
  const all=[...vecs.filter(v=>v.on)];
  if(rV&&!rV.scalar) all.push(rV);
  if(sR&&!sR.err) all.push({vx:sR.vx,vy:sR.vy,vz:sR.vz||0});
  const mxC=all.reduce((m,v)=>Math.max(m,Math.abs(v.vx),Math.abs(v.vy),Math.abs(v.vz||0)),5);
  const axLen=mxC*1.5, s=Math.min(W,H)/(axLen*2.8)*scl;

  ctx.clearRect(0,0,W,H);
  // Background gradient
  const bg=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(W,H)*.8);
  bg.addColorStop(0,'#0d1628');bg.addColorStop(1,'#060a10');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);

  if(mode===3){
    // 3D volumetric grid — full cube of dots every 1 unit, larger at every 2
    for(let i=-10;i<=10;i++) for(let k=-10;k<=10;k++) for(let j=-10;j<=10;j++){
      const isMain=(i%2===0&&j%2===0&&k%2===0);
      const d=Math.sqrt(i*i+j*j+k*k)/14;
      const alpha=isMain?(0.38-d*0.32):(0.10-d*0.09);
      const r=isMain?1.6:0.7;
      if(alpha<=0.015)continue;
      const pp=p3(i,j,k,cx,cy,s);
      ctx.fillStyle=`rgba(40,65,110,${alpha})`;ctx.beginPath();ctx.arc(pp.sx,pp.sy,r,0,Math.PI*2);ctx.fill();
    }
    const o=p3(0,0,0,cx,cy,s);
    ctx.beginPath();ctx.arc(o.sx,o.sy,6,0,Math.PI*2);ctx.fillStyle='#c8d8f0';ctx.shadowColor='#c8d8f0';ctx.shadowBlur=14;ctx.fill();ctx.shadowBlur=0;
ctx.beginPath();ctx.arc(o.sx,o.sy,2.5,0,Math.PI*2);ctx.fillStyle='#0a0f1a';ctx.fill();

    const axes=[
      [[axLen,0,0],[-axLen,0,0],'#ff5572','X',[1,0,0]],
      [[0,axLen,0],[0,-axLen,0],'#2dd4a0','Y',[0,1,0]],
      [[0,0,axLen],[0,0,-axLen],'#4da6ff','Z',[0,0,1]],
    ];
    axes.forEach(([pos,neg,col,lbl,dir])=>{
      const pp=p3(...pos,cx,cy,s),pl=p3(pos[0]*1.18,pos[1]*1.18,pos[2]*1.18,cx,cy,s);
      const pn=p3(...neg,cx,cy,s),nl=p3(neg[0]*1.18,neg[1]*1.18,neg[2]*1.18,cx,cy,s);
      drawAxis3(o,pp,pl,pn,nl,col,lbl,2.5,axLen,s,cx,cy);
      drawAxisTicks3(o,dir,col,axLen,s,cx,cy,p3);
    });

    // Geometric figure — connect tips only, forming correct polygon
    if(showFigure){
      const active=vecs.filter(v=>v.on);
      if(active.length>=2){
        const tips=active.map(v=>p3(v.vx,v.vy,v.vz,cx,cy,s));
        // Fill polygon (tips only, closed loop)
        ctx.globalAlpha=.13;
        ctx.beginPath();
        tips.forEach((pt,i)=>i===0?ctx.moveTo(pt.sx,pt.sy):ctx.lineTo(pt.sx,pt.sy));
        ctx.closePath();
        ctx.fillStyle='#f0c040';ctx.fill();
        // Outline edges (tip[0]→tip[1]→tip[2]→...→tip[0])
        ctx.globalAlpha=.6;
        ctx.beginPath();
        tips.forEach((pt,i)=>i===0?ctx.moveTo(pt.sx,pt.sy):ctx.lineTo(pt.sx,pt.sy));
        ctx.closePath();
        ctx.strokeStyle='#f0c040';ctx.lineWidth=1.8;ctx.setLineDash([]);ctx.stroke();
        // Label each tip
        ctx.globalAlpha=.9;ctx.font='bold 11px Space Mono';ctx.textAlign='center';ctx.textBaseline='bottom';
        active.forEach((v,i)=>{
          const c=v.cl;
          ctx.fillStyle=c;ctx.fillText(v.nm,tips[i].sx,tips[i].sy-6);
        });
        ctx.globalAlpha=1;
      }
    }

    vecs.filter(v=>v.on).forEach(v=>{
      const col=v.cl;
      const po=p3(0,0,0,cx,cy,s),pt=p3(v.vx,v.vy,v.vz,cx,cy,s);
      drawArrow(po.sx,po.sy,pt.sx,pt.sy,col,3.5);
      // Vector name label at tip
      ctx.save();ctx.font='bold 12px Space Mono';ctx.textAlign='center';ctx.textBaseline='bottom';
      ctx.shadowColor=col;ctx.shadowBlur=8;ctx.fillStyle=col;ctx.globalAlpha=.95;
      ctx.fillText(v.nm,pt.sx,pt.sy-10);ctx.restore();
      // Projection shadows
      const tip=[v.vx,v.vy,v.vz];
      ctx.globalAlpha=.32;ctx.lineWidth=1.5;ctx.setLineDash([4,4]);
      [[tip[0],0,tip[2]],[tip[0],tip[1],0],[0,tip[1],tip[2]]].forEach(sh=>{
        const ps=p3(...sh,cx,cy,s);ctx.beginPath();ctx.moveTo(pt.sx,pt.sy);ctx.lineTo(ps.sx,ps.sy);ctx.strokeStyle=col;ctx.stroke();
        ctx.beginPath();ctx.arc(ps.sx,ps.sy,2.5,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
      });
      ctx.setLineDash([]);ctx.globalAlpha=1;
    });
    if(rV&&!rV.scalar){const po=p3(0,0,0,cx,cy,s),pt=p3(rV.vx,rV.vy,rV.vz,cx,cy,s);drawArrow(po.sx,po.sy,pt.sx,pt.sy,RC,3.5);}
    if(sR&&!sR.err){const po=p3(0,0,0,cx,cy,s),pt=p3(sR.vx,sR.vy,sR.vz||0,cx,cy,s);drawArrow(po.sx,po.sy,pt.sx,pt.sy,SC,3.5);}
  } else {
    // R2 grid — sub dots every 1 unit, main dots every 2 units
    for(let i=-16;i<=16;i++) for(let j=-16;j<=16;j++){
      const isMain=(i%2===0&&j%2===0);
      const pp=p2(i,j,cx,cy,s),d=Math.sqrt(i*i+j*j)/16;
      const alpha=isMain?(0.65-d*0.45):(0.20-d*0.14);
      const r=isMain?1.9:0.85;
      if(alpha<=0.02)continue;
      ctx.fillStyle=`rgba(30,51,90,${alpha})`;ctx.beginPath();ctx.arc(pp.sx,pp.sy,r,0,Math.PI*2);ctx.fill();
    }
    const o=p2(0,0,cx,cy,s);
    ctx.beginPath();ctx.arc(o.sx,o.sy,6,0,Math.PI*2);ctx.fillStyle='#c8d8f0';ctx.shadowColor='#c8d8f0';ctx.shadowBlur=14;ctx.fill();ctx.shadowBlur=0;
ctx.beginPath();ctx.arc(o.sx,o.sy,2.5,0,Math.PI*2);ctx.fillStyle='#0a0f1a';ctx.fill();

    // Axes R2
    [[[axLen,0],[-axLen,0],'#ff5572','X',true],[[0,axLen],[0,-axLen],'#2dd4a0','Y',false]].forEach(([pos,neg,col,lbl,isX])=>{
      const pp=p2(...pos,cx,cy,s),pl=p2(pos[0]*1.15,pos[1]*1.15,cx,cy,s);
      const pn=p2(...neg,cx,cy,s),nl=p2(neg[0]*1.15,neg[1]*1.15,cx,cy,s);
      ctx.beginPath();ctx.moveTo(o.sx,o.sy);ctx.lineTo(pn.sx,pn.sy);ctx.strokeStyle=col;ctx.lineWidth=1.4;ctx.globalAlpha=.2;ctx.setLineDash([5,7]);ctx.stroke();ctx.setLineDash([]);
      ctx.globalAlpha=.2;ctx.fillStyle=col;ctx.font='bold 11px Space Mono';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('-'+lbl,nl.sx,nl.sy);
      ctx.beginPath();ctx.moveTo(o.sx,o.sy);ctx.lineTo(pp.sx,pp.sy);ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.globalAlpha=.9;ctx.setLineDash([]);ctx.stroke();
      const dx=pp.sx-o.sx,dy=pp.sy-o.sy,l=Math.sqrt(dx*dx+dy*dy);
      if(l>4){const ux=dx/l,uy=dy/l,hw=5,hl=11,bx=pp.sx-ux*hl,by=pp.sy-uy*hl;ctx.beginPath();ctx.moveTo(pp.sx,pp.sy);ctx.lineTo(bx+uy*hw,by-ux*hw);ctx.lineTo(bx-uy*hw,by+ux*hw);ctx.closePath();ctx.fillStyle=col;ctx.globalAlpha=.9;ctx.fill();}
      ctx.globalAlpha=.9;ctx.fillStyle=col;ctx.font='bold 13px Space Mono';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(lbl,pl.sx,pl.sy);ctx.globalAlpha=1;
      drawAxisTicks2(o,isX,col,axLen,s,cx,cy);
    });

    // Figure R2 — connect tips only
    if(showFigure){
      const active=vecs.filter(v=>v.on);
      if(active.length>=2){
        const tips=active.map(v=>p2(v.vx,v.vy,cx,cy,s));
        ctx.globalAlpha=.13;
        ctx.beginPath();
        tips.forEach((pt,i)=>i===0?ctx.moveTo(pt.sx,pt.sy):ctx.lineTo(pt.sx,pt.sy));
        ctx.closePath();ctx.fillStyle='#f0c040';ctx.fill();
        ctx.globalAlpha=.6;
        ctx.beginPath();
        tips.forEach((pt,i)=>i===0?ctx.moveTo(pt.sx,pt.sy):ctx.lineTo(pt.sx,pt.sy));
        ctx.closePath();ctx.strokeStyle='#f0c040';ctx.lineWidth=1.8;ctx.setLineDash([]);ctx.stroke();
        ctx.globalAlpha=.9;ctx.font='bold 11px Space Mono';ctx.textAlign='center';ctx.textBaseline='bottom';
        active.forEach((v,i)=>{
          const c=v.cl;
          ctx.fillStyle=c;ctx.fillText(v.nm,tips[i].sx,tips[i].sy-6);
        });
        ctx.globalAlpha=1;
      }
    }

    vecs.filter(v=>v.on).forEach(v=>{
      const col=v.cl;
      const po=p2(0,0,cx,cy,s),pt=p2(v.vx,v.vy,cx,cy,s);
      drawArrow(po.sx,po.sy,pt.sx,pt.sy,col,3.5);
      // Vector name label
      ctx.save();ctx.font='bold 12px Space Mono';ctx.textAlign='center';ctx.textBaseline='bottom';
      ctx.shadowColor=col;ctx.shadowBlur=8;ctx.fillStyle=col;ctx.globalAlpha=.95;
      ctx.fillText(v.nm,pt.sx,pt.sy-10);ctx.restore();
      // Orthogonal projections to X and Y axes
      const px=p2(v.vx,0,cx,cy,s);  // foot on X axis
      const py=p2(0,v.vy,cx,cy,s);  // foot on Y axis
      ctx.save();
      ctx.globalAlpha=.32;ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.lineCap='round';
      // tip → foot on X
      ctx.beginPath();ctx.moveTo(pt.sx,pt.sy);ctx.lineTo(px.sx,px.sy);ctx.strokeStyle=col;ctx.stroke();
      // tip → foot on Y
      ctx.beginPath();ctx.moveTo(pt.sx,pt.sy);ctx.lineTo(py.sx,py.sy);ctx.strokeStyle=col;ctx.stroke();
      ctx.setLineDash([]);
      // dots at feet
      ctx.globalAlpha=.55;
      ctx.beginPath();ctx.arc(px.sx,px.sy,3,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
      ctx.beginPath();ctx.arc(py.sx,py.sy,3,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
      ctx.restore();
    });
    if(rV&&!rV.scalar){const po=p2(0,0,cx,cy,s),pt=p2(rV.vx,rV.vy,cx,cy,s);drawArrow(po.sx,po.sy,pt.sx,pt.sy,RC,3.5);}
    if(sR&&!sR.err){const po=p2(0,0,cx,cy,s),pt=p2(sR.vx,sR.vy,cx,cy,s);drawArrow(po.sx,po.sy,pt.sx,pt.sy,SC,3.5);}
  }
}

// ── RESIZE & INPUT ────────────────────────────────────
function resize(){
  const w=document.getElementById('cw');
  cv.width=w.clientWidth*devicePixelRatio;cv.height=w.clientHeight*devicePixelRatio;
  cv.style.width=w.clientWidth+'px';cv.style.height=w.clientHeight+'px';draw();
}
cv.addEventListener('mousedown',e=>{drag={x:e.clientX,y:e.clientY,rx:rotX,ry:rotY};});
window.addEventListener('mousemove',e=>{if(!drag)return;if(mode===3){rotY=drag.ry+(e.clientX-drag.x)*.5;rotX=drag.rx-(e.clientY-drag.y)*.5;}draw();});
window.addEventListener('mouseup',()=>{drag=null;});
cv.addEventListener('touchstart',e=>{
  if(e.touches.length===1) drag={x:e.touches[0].clientX,y:e.touches[0].clientY,rx:rotX,ry:rotY};
  else if(e.touches.length===2){const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;lp=Math.sqrt(dx*dx+dy*dy);}
  e.preventDefault();},{passive:false});
cv.addEventListener('touchmove',e=>{
  if(e.touches.length===1&&drag){if(mode===3){rotY=drag.ry+(e.touches[0].clientX-drag.x)*.5;rotX=drag.rx-(e.touches[0].clientY-drag.y)*.5;}draw();}
  else if(e.touches.length===2&&lp){const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;const d=Math.sqrt(dx*dx+dy*dy);scl=Math.min(Math.max(scl*(d/lp),.3),5);lp=d;draw();}
  e.preventDefault();},{passive:false});
cv.addEventListener('touchend',()=>{drag=null;lp=null;});
window.addEventListener('resize',resize);
cv.addEventListener('wheel',e=>{
  e.preventDefault();
  const delta=e.deltaY>0?0.92:1.08;
  scl=Math.min(Math.max(scl*delta,.3),5);
  draw();
},{passive:false});

// AL vectors init — called when module opens
function initVectorsApp(){
  if(!window._alInitDone){
    window._alInitDone=true;
    vecs=[]; palIdx=0; nid=0;
    renderVecs();
  }
  // Double resize to ensure canvas fills correctly after mount
  setTimeout(()=>{ resize(); }, 30);
  setTimeout(()=>{ resize(); draw(); }, 120);
}


// ══════════════════════════════════════════════════════
// LAUNCHER
// ══════════════════════════════════════════════════════
function launchModule(mod){
  const launcher = document.getElementById('launcher');
  launcher.classList.add('hidden');
  if(mod==='al'){
    setTimeout(()=>{ launcher.style.display='none'; },400);
  } else if(mod==='em'){
    setTimeout(()=>{
      launcher.style.display='none';
      document.getElementById('em-app').classList.add('visible');
      emInit();
      // Wait for CSS transition + layout to settle, then resize
      setTimeout(()=>emResizeCanvas(), 50);
      setTimeout(()=>emResizeCanvas(), 350);
    },400);
  }
}


// ══════════════════════════════════════════════════════
// EM MODULE
// ══════════════════════════════════════════════════════
const EM_K = 8.9875e9;   // Coulomb constant N·m²/C²
const EM_MU0 = 4*Math.PI*1e-7; // permeability N/A²
const EM_EPS0 = 8.854e-12;     // permittivity F/m
let emCoord = 'cart';
let emInitDone = false;
let emCanvas, emCtx;
let emScl = 1, emRotX = 25, emRotY = -35, emDrag = null, emLP = null;
let emObjects = []; // field sources/objects to draw
let emResult = null;

function emInit(){
  if(emInitDone) return;
  emInitDone = true;
  emCanvas = document.getElementById('em-canvas');
  emCtx = emCanvas.getContext('2d');
  emResizeCanvas();
  window.addEventListener('resize', emResizeCanvas);

  // Touch/mouse on EM canvas
  emCanvas.addEventListener('mousedown',e=>{emDrag={x:e.clientX,y:e.clientY,rx:emRotX,ry:emRotY};});
  let emRafPending=false;
  window.addEventListener('mousemove',e=>{
    if(!emDrag)return;
    emRotY=emDrag.ry+(e.clientX-emDrag.x)*.5;
    emRotX=emDrag.rx-(e.clientY-emDrag.y)*.5;
    if(!emRafPending){emRafPending=true;requestAnimationFrame(()=>{emDraw();emRafPending=false;});}
  });
  window.addEventListener('mouseup',()=>{emDrag=null;});
  emCanvas.addEventListener('touchstart',e=>{
    if(e.touches.length===1) emDrag={x:e.touches[0].clientX,y:e.touches[0].clientY,rx:emRotX,ry:emRotY};
    else if(e.touches.length===2){
      const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;
      emLP=Math.sqrt(dx*dx+dy*dy);
    }
  },{passive:true});
  emCanvas.addEventListener('touchmove',e=>{
    e.preventDefault();
    if(e.touches.length===1&&emDrag){
      emRotY=emDrag.ry+(e.touches[0].clientX-emDrag.x)*.5;
      emRotX=emDrag.rx-(e.touches[0].clientY-emDrag.y)*.5;
    } else if(e.touches.length===2&&emLP){
      const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;
      const np=Math.sqrt(dx*dx+dy*dy);
      emScl*=np/emLP; emLP=np;
      emScl=Math.min(Math.max(emScl,.3),5);
    }
    if(!emRafPending){emRafPending=true;requestAnimationFrame(()=>{emDraw();emRafPending=false;});}
  },{passive:false});
  emCanvas.addEventListener('touchend',()=>{emDrag=null;emLP=null;},{passive:true});
  emCanvas.addEventListener('wheel',e=>{
    e.preventDefault();
    emScl*=e.deltaY>0?0.92:1.08;
    emScl=Math.min(Math.max(emScl,.3),5);
    emDraw();
  },{passive:false});

  emRenderAllPanels();
  // Double resize to ensure canvas fills correctly after mount
  requestAnimationFrame(()=>{
    emResizeCanvas();
    requestAnimationFrame(()=>emResizeCanvas());
  });
}

function emResizeCanvas(){
  const cw=document.getElementById('em-cw');
  if(!cw||!emCanvas)return;
  const dpr=window.devicePixelRatio||1;
  emCanvas.width=cw.clientWidth*dpr;
  emCanvas.height=cw.clientHeight*dpr;
  emCanvas.style.width=cw.clientWidth+'px';
  emCanvas.style.height=cw.clientHeight+'px';
  emDraw();
}

// ── 3D PROJECTION (same as AL) ────────────────────────
function emP3(x,y,z){
  const W=emCanvas.width,H=emCanvas.height,cx=W/2,cy=H/2;
  const s=Math.min(W,H)/22*emScl;
  const rx=emRotX*Math.PI/180, ry=emRotY*Math.PI/180;
  const y1=y*Math.cos(rx)-z*Math.sin(rx);
  const z1=y*Math.sin(rx)+z*Math.cos(rx);
  const x2=x*Math.cos(ry)+z1*Math.sin(ry);
  const z2=-x*Math.sin(ry)+z1*Math.cos(ry);
  return {sx:cx+x2*s, sy:cy-y1*s, z2};
}

function emDrawArrow(x1,y1,x2,y2,col,lw=2.5){
  const ctx=emCtx;
  const dx=x2-x1,dy=y2-y1,len=Math.sqrt(dx*dx+dy*dy);
  if(len<2)return;
  const hs=Math.min(12,len*.35), hw=hs*.55;
  const ux=dx/len,uy=dy/len;
  ctx.save();ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=lw;ctx.lineCap='round';
  ctx.shadowColor=col;ctx.shadowBlur=6;
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2-ux*hs,y2-uy*hs);ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2,y2);
  ctx.lineTo(x2-ux*hs-uy*hw,y2-uy*hs+ux*hw);
  ctx.lineTo(x2-ux*hs+uy*hw,y2-uy*hs-ux*hw);
  ctx.closePath();ctx.fill();
  ctx.shadowBlur=0;ctx.restore();
}

// ── DRAW EM CANVAS ────────────────────────────────────

function emDraw(){
  if(!emCanvas||!emCtx)return;
  const ctx=emCtx;
  const W=emCanvas.width,H=emCanvas.height,cx=W/2,cy=H/2;
  ctx.clearRect(0,0,W,H);

  // Background
  const bg=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(W,H)*.8);
  bg.addColorStop(0,'#0d1628');bg.addColorStop(1,'#060a10');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);

  // Reference dots along X axis only
  for(let i=-8;i<=8;i++){
    const isMain=(i%2===0);
    const alpha=isMain?0.35:0.15;
    const r=isMain?1.6:0.7;
    const pp=emP3(i,0,0);
    ctx.globalAlpha=alpha;
    ctx.fillStyle='rgba(50,80,130,1)';
    ctx.beginPath();ctx.arc(pp.sx,pp.sy,r,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;

  // Compute axis length based on objects
  const allCoords=emObjects.flatMap(o=>o.type==='vector'
    ?[Math.abs((o.ox||0)+o.vx),Math.abs((o.oy||0)+o.vy),Math.abs((o.oz||0)+o.vz)]
    :[Math.abs(o.x||0),Math.abs(o.y||0),Math.abs(o.z||0)]);
  const axLen=Math.max(6, ...(allCoords.length?allCoords:[6]))*1.4;

  // Axes — identical to AL module
  const emAxDef=[
    [[axLen,0,0],[-axLen,0,0],'#ff5572','X',[1,0,0]],
    [[0,axLen,0],[0,-axLen,0],'#2dd4a0','Y',[0,1,0]],
    [[0,0,axLen],[0,0,-axLen],'#4da6ff','Z',[0,0,1]],
  ];
  // Draw axes using EM context — mirrors drawAxis3/drawAxisTicks3 logic
  const ec=emCtx, emO=emP3(0,0,0);
  emAxDef.forEach(([pos,neg,col,lbl,dir])=>{
    const pp=emP3(...pos), pl=emP3(pos[0]*1.18,pos[1]*1.18,pos[2]*1.18);
    const pn=emP3(...neg), nl=emP3(neg[0]*1.18,neg[1]*1.18,neg[2]*1.18);
    const lw=2.5;
    // Negative dashed
    ec.beginPath();ec.moveTo(emO.sx,emO.sy);ec.lineTo(pn.sx,pn.sy);
    ec.strokeStyle=col;ec.lineWidth=lw*.5;ec.globalAlpha=.2;ec.setLineDash([5,7]);ec.lineCap='round';ec.stroke();ec.setLineDash([]);
    ec.globalAlpha=.2;ec.fillStyle=col;ec.font='bold 11px Space Mono';ec.textAlign='center';ec.textBaseline='middle';ec.fillText('-'+lbl,nl.sx,nl.sy);
    // Positive solid
    ec.beginPath();ec.moveTo(emO.sx,emO.sy);ec.lineTo(pp.sx,pp.sy);
    ec.strokeStyle=col;ec.lineWidth=lw;ec.globalAlpha=.9;ec.setLineDash([]);ec.stroke();
    const ddx=pp.sx-emO.sx,ddy=pp.sy-emO.sy,ll=Math.sqrt(ddx*ddx+ddy*ddy);
    if(ll>4){const ux=ddx/ll,uy=ddy/ll,hw=5,hl=11,bx=pp.sx-ux*hl,by=pp.sy-uy*hl;ec.beginPath();ec.moveTo(pp.sx,pp.sy);ec.lineTo(bx+uy*hw,by-ux*hw);ec.lineTo(bx-uy*hw,by+ux*hw);ec.closePath();ec.fillStyle=col;ec.globalAlpha=.9;ec.fill();}
    ec.globalAlpha=.9;ec.fillStyle=col;ec.font='bold 13px Space Mono';ec.textAlign='center';ec.textBaseline='middle';ec.fillText(lbl,pl.sx,pl.sy);
    ec.globalAlpha=1;
    // Ticks
    const step=adaptiveStep(axLen);
    for(let v=step;v<=Math.floor(axLen);v+=step){
      const tp=emP3(dir[0]*v,dir[1]*v,dir[2]*v),tn=emP3(-dir[0]*v,-dir[1]*v,-dir[2]*v);
      ec.globalAlpha=.9;ec.beginPath();ec.arc(tp.sx,tp.sy,2.5,0,Math.PI*2);ec.fillStyle=col;ec.fill();
      ec.globalAlpha=.3;ec.beginPath();ec.arc(tn.sx,tn.sy,2,0,Math.PI*2);ec.fillStyle=col;ec.fill();
      const nx=tp.sx+11,ny=tp.sy+11;
      ec.font='bold 11px Space Mono';ec.textAlign='center';ec.textBaseline='middle';
      ec.globalAlpha=.6;ec.fillStyle='#060a10';ec.fillRect(nx-9,ny-7,18,14);
      ec.globalAlpha=1;ec.fillStyle=col;ec.fillText(String(v),nx,ny);
      const nnx=tn.sx+11,nny=tn.sy+11;
      ec.globalAlpha=.25;ec.fillStyle='#060a10';ec.fillRect(nnx-11,nny-7,22,14);
      ec.globalAlpha=.4;ec.fillStyle=col;ec.fillText('-'+String(v),nnx,nny);
    }
    ec.globalAlpha=1;
  });

  // Origin
  const o=emP3(0,0,0);
  ctx.beginPath();ctx.arc(o.sx,o.sy,6,0,Math.PI*2);ctx.fillStyle='#c8d8f0';ctx.shadowColor='#c8d8f0';ctx.shadowBlur=14;ctx.fill();ctx.shadowBlur=0;
  ctx.beginPath();ctx.arc(o.sx,o.sy,2.5,0,Math.PI*2);ctx.fillStyle='#0a0f1a';ctx.fill();

  // Draw EM objects
  emObjects.forEach(obj=>{
    if(obj.type==='vector'){
      const o2=emP3(obj.ox||0,obj.oy||0,obj.oz||0);
      const p2=emP3((obj.ox||0)+obj.vx,(obj.oy||0)+obj.vy,(obj.oz||0)+obj.vz);
      emDrawArrow(o2.sx,o2.sy,p2.sx,p2.sy,obj.color||'#4da6ff',3);
      ctx.save();ctx.font='bold 12px Space Mono';ctx.fillStyle=obj.color||'#4da6ff';
      ctx.shadowColor=obj.color||'#4da6ff';ctx.shadowBlur=8;ctx.globalAlpha=.95;
      ctx.textAlign='center';ctx.textBaseline='bottom';
      ctx.fillText(obj.label||'',p2.sx,p2.sy-10);ctx.restore();
    } else if(obj.type==='charge'){
      const pp=emP3(obj.x,obj.y,obj.z);
      const col=obj.q>0?'#ff5572':'#4da6ff';
      ctx.beginPath();ctx.arc(pp.sx,pp.sy,9,0,Math.PI*2);
      ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=18;ctx.fill();ctx.shadowBlur=0;
      ctx.beginPath();ctx.arc(pp.sx,pp.sy,4,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,.4)';ctx.fill();
      ctx.font='bold 11px Space Mono';ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(obj.q>0?'+':'−',pp.sx,pp.sy);
      ctx.font='bold 9px Space Mono';ctx.fillStyle=col;ctx.globalAlpha=.9;ctx.textBaseline='top';
      ctx.fillText(obj.label||'q',pp.sx,pp.sy+13);ctx.globalAlpha=1;
    }
  });
}

// ── COORD SYSTEM ──────────────────────────────────────
function emSetCoord(c){
  emCoord=c;
  ['cart','cyl','sph'].forEach(id=>{
    document.getElementById('em-'+id).classList.toggle('on',id===c);
  });
  emRenderAllPanels();
}

function emResetView(){
  emRotX=25; emRotY=-35; emScl=1; emDraw();
}
function emTogglePanel(){
  const bot=document.getElementById('em-bottom');
  const btn=document.getElementById('em-panel-tog-btn');
  const collapsed=bot.classList.toggle('collapsed');
  btn.classList.toggle('on',!collapsed);
  setTimeout(()=>emResizeCanvas(),50);
}

function emShowTab(tab){
  document.querySelectorAll('.em-tab').forEach((t,i)=>{
    const tabs=['coulomb','gauss','potential','lorentz','faraday','maxwell'];
    t.classList.toggle('on',tabs[i]===tab);
  });
  ['Coulomb','Gauss','Potential','Lorentz','Faraday','Maxwell'].forEach(t=>{
    const p=document.getElementById('em-p'+t);
    if(p) p.classList.toggle('on',t.toLowerCase()===tab);
  });
}

// ── PANEL RENDERERS ───────────────────────────────────
function emRenderAllPanels(){
  emRenderCoulomb();
  emRenderGauss();
  emRenderPotential();
  emRenderLorentz();
  emRenderFaraday();
  emRenderMaxwell();
}

// helper — format scientific notation
function emFmt(v,dec=4){
  if(v===null||v===undefined||isNaN(v))return '—';
  if(Math.abs(v)===0)return '0';
  if(Math.abs(v)>=1e4||Math.abs(v)<1e-3&&v!==0){
    return v.toExponential(dec);
  }
  return parseFloat(v.toFixed(dec)).toString();
}

// ─────────────────────────────────────────────────────
// COULOMB — Ley de Coulomb & Campo Eléctrico
// ─────────────────────────────────────────────────────
function emRenderCoulomb(){
  const p=document.getElementById('em-pCoulomb');
  if(!p)return;
  const coordLabels=emCoord==='cart'?['x','y','z']:emCoord==='cyl'?['ρ','φ°','z']:['r','θ°','φ°'];
  const [l1,l2,l3]=coordLabels;
  p.innerHTML=`
  <div class="em-section-title">Ley de Coulomb — Fuerza entre cargas</div>
  <div class="em-formula">F = k&middot;q<sub>1</sub>&middot;q<sub>2</sub> / r&sup2; &nbsp;|&nbsp; k = 8.9875&times;10&#8313; N&middot;m&sup2;/C&sup2;</div>
  <div class="em-input-row">
    <div class="em-input-group"><label>q₁ (C)</label><input id="em-q1" value="1e-6" placeholder="1e-6"></div>
    <div class="em-input-group"><label>q₂ (C)</label><input id="em-q2" value="-2e-6" placeholder="-2e-6"></div>
    <div class="em-input-group"><label>r (m)</label><input id="em-r-c" value="0.05" placeholder="0.05"></div>
  </div>
  <div class="em-section-title" style="margin-top:10px">Posici&oacute;n de q<sub>1</sub> (${l1},${l2},${l3})</div>
  <div class="em-input-row">
    <div class="em-input-group"><label>${l1}</label><input id="em-q1x" value="0"></div>
    <div class="em-input-group"><label>${l2}</label><input id="em-q1y" value="0"></div>
    <div class="em-input-group"><label>${l3}</label><input id="em-q1z" value="0"></div>
  </div>
  <div class="em-section-title">Posici&oacute;n de q<sub>2</sub> (${l1},${l2},${l3})</div>
  <div class="em-input-row">
    <div class="em-input-group"><label>${l1}</label><input id="em-q2x" value="2"></div>
    <div class="em-input-group"><label>${l2}</label><input id="em-q2y" value="1"></div>
    <div class="em-input-group"><label>${l3}</label><input id="em-q2z" value="0"></div>
  </div>
  <button class="em-action-btn" onclick="emCalcCoulomb()">Calcular y graficar</button>
  <div id="em-res-coulomb"></div>
  `;
}

function emToCart(a,b,c){
  if(emCoord==='cart') return [a,b,c];
  if(emCoord==='cyl'){
    const phi=b*Math.PI/180;
    return [a*Math.cos(phi), a*Math.sin(phi), c];
  }
  // spherical r,theta,phi
  const th=b*Math.PI/180, ph=c*Math.PI/180;
  return [a*Math.sin(th)*Math.cos(ph), a*Math.sin(th)*Math.sin(ph), a*Math.cos(th)];
}

function emCalcCoulomb(){
  const q1=parseFloat(document.getElementById('em-q1').value)||0;
  const q2=parseFloat(document.getElementById('em-q2').value)||0;
  const r=parseFloat(document.getElementById('em-r-c').value)||1;

  const [x1,y1,z1]=emToCart(
    parseFloat(document.getElementById('em-q1x').value)||0,
    parseFloat(document.getElementById('em-q1y').value)||0,
    parseFloat(document.getElementById('em-q1z').value)||0
  );
  const [x2,y2,z2]=emToCart(
    parseFloat(document.getElementById('em-q2x').value)||0,
    parseFloat(document.getElementById('em-q2y').value)||0,
    parseFloat(document.getElementById('em-q2z').value)||0
  );

  const dx=x2-x1,dy=y2-y1,dz=z2-z1;
  const dist=Math.sqrt(dx*dx+dy*dy+dz*dz)||r;
  const F=EM_K*Math.abs(q1)*Math.abs(q2)/(dist*dist);
  const attract=q1*q2<0;
  const sign=q1*q2<0?'Atractiva':'Repulsiva';

  // Unit vector
  const ux=dx/dist,uy=dy/dist,uz=dz/dist;
  // Force vector on q2 from q1 (sign based on charges)
  const fSign=q1*q2>0?1:-1;
  const Fvec={vx:fSign*F*ux*1e6,vy:fSign*F*uy*1e6,vz:fSign*F*uz*1e6}; // scaled for display

  // Electric field at q2 due to q1
  const E=EM_K*Math.abs(q1)/(dist*dist);
  const Esx=q1>0?ux:-ux,Esy=q1>0?uy:-uy,Esz=q1>0?uz:-uz;

  // Update canvas objects
  emObjects=[
    {type:'charge',x:x1,y:y1,z:z1,q:q1,label:'q₁'},
    {type:'charge',x:x2,y:y2,z:z2,q:q2,label:'q₂'},
    {type:'vector',ox:x2,oy:y2,oz:z2,vx:Esx*2,vy:Esy*2,vz:Esz*2,color:'#ff8c42',label:'F'},
  ];
  emDraw();

  document.getElementById('em-res-coulomb').innerHTML=`
  <div class="em-math-grid" style="margin-top:10px">
    <div class="em-math-card full">
      <div class="em-math-label">Fuerza de Coulomb</div>
      <div class="em-math-value big">${emFmt(F)} N</div>
      <div class="em-result-hint">${sign} — ${attract?'Las cargas se atraen':'Las cargas se repelen'}</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">Distancia r</div>
      <div class="em-math-value">${emFmt(dist)} m</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">Campo E en q₂</div>
      <div class="em-math-value">${emFmt(E)} N/C</div>
    </div>
    <div class="em-math-card full">
      <div class="em-math-label">Vector unitario r̂ (q₁→q₂)</div>
      <div class="em-math-value sm">(${emFmt(ux,3)}, ${emFmt(uy,3)}, ${emFmt(uz,3)})</div>
    </div>
    <div class="em-math-card full">
      <div class="em-math-label">Vector fuerza F⃗ sobre q₂</div>
      <div class="em-math-value sm">${emFmt(fSign*F*ux)} x̂ + ${emFmt(fSign*F*uy)} ŷ + ${emFmt(fSign*F*uz)} ẑ N</div>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────────────
// GAUSS
// ─────────────────────────────────────────────────────
function emRenderGauss(){
  const p=document.getElementById('em-pGauss');
  if(!p)return;
  p.innerHTML=`
  <div class="em-section-title">Ley de Gauss — Flujo Eléctrico</div>
  <div class="em-formula">&oint; E&middot;dA = Q<sub>enc</sub>/&epsilon;<sub>0</sub> &nbsp;|&nbsp; &epsilon;<sub>0</sub> = 8.854&times;10<sup>&minus;12</sup> F/m</div>
  <div class="em-section-title" style="margin-top:8px">Geometría de la superficie gaussiana</div>
  <div class="em-input-row">
    <div class="em-input-group">
      <label>Geometría</label>
      <select id="em-gauss-geo" style="background:var(--surface3);border:1px solid var(--border);border-radius:6px;color:var(--text1);font-family:Space Mono,monospace;font-size:11px;padding:7px 8px;width:100%">
        <option value="sphere">Esfera</option>
        <option value="cylinder">Cilindro</option>
        <option value="plane">Plano infinito</option>
      </select>
    </div>
    <div class="em-input-group"><label>Q_enc (C)</label><input id="em-qenc" value="1e-9"></div>
  </div>
  <div class="em-input-row">
    <div class="em-input-group"><label>r o d (m)</label><input id="em-gauss-r" value="0.1"></div>
    <div class="em-input-group"><label>L (m) — cilindro</label><input id="em-gauss-L" value="1"></div>
  </div>
  <button class="em-action-btn" onclick="emCalcGauss()">Calcular flujo y campo</button>
  <div id="em-res-gauss"></div>`;
}

function emCalcGauss(){
  const geo=document.getElementById('em-gauss-geo').value;
  const Q=parseFloat(document.getElementById('em-qenc').value)||0;
  const r=parseFloat(document.getElementById('em-gauss-r').value)||0.1;
  const L=parseFloat(document.getElementById('em-gauss-L').value)||1;

  let E=0, flux=0, area=0, note='';
  flux = Q / EM_EPS0;

  if(geo==='sphere'){
    area = 4*Math.PI*r*r;
    E = Q/(4*Math.PI*EM_EPS0*r*r);
    note = 'E radial: E⃗ = (Q/4πε₀r²) r̂';
    emObjects=[{type:'charge',x:0,y:0,z:0,q:Q,label:'Q'}];
    // Draw radial field arrows
    [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].forEach(([dx,dy,dz])=>{
      const s=Q>0?1:-1;
      emObjects.push({type:'vector',ox:s*dx*r*3,oy:s*dy*r*3,oz:s*dz*r*3,vx:s*dx*2,vy:s*dy*2,vz:s*dz*2,color:'#ff8c42',label:''});
    });
  } else if(geo==='cylinder'){
    area = 2*Math.PI*r*L;
    E = Q/(2*Math.PI*EM_EPS0*r*L);
    note = 'E radial: E⃗ = (lambda/2πε₀ρ) ρ̂  |  lambda = Q/L';
    emObjects=[{type:'charge',x:0,y:0,z:0,q:Q,label:'Q'}];
  } else {
    // infinite plane: σ = Q/A (we treat r as half-spacing)
    area = 1; // conceptual
    E = Q/(2*EM_EPS0); // sigma/(2*eps0), treat Q as sigma
    note = 'E uniforme: E⃗ = σ/2ε₀  (σ = densidad superficial)';
    emObjects=[];
  }

  emDraw();
  document.getElementById('em-res-gauss').innerHTML=`
  <div class="em-math-grid" style="margin-top:10px">
    <div class="em-math-card full">
      <div class="em-math-label">Flujo total Φ_E</div>
      <div class="em-math-value big">${emFmt(flux)} N·m²/C</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">Campo E</div>
      <div class="em-math-value">${emFmt(E)} N/C</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">Área gaussiana</div>
      <div class="em-math-value">${emFmt(area)} m²</div>
    </div>
    <div class="em-math-card full">
      <div class="em-math-label">Expresión del campo</div>
      <div class="em-result-hint">${note}</div>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────────────
// POTENCIAL ELÉCTRICO
// ─────────────────────────────────────────────────────
function emRenderPotential(){
  const p=document.getElementById('em-pPotential');
  if(!p)return;
  p.innerHTML=`
  <div class="em-section-title">Potencial Eléctrico</div>
  <div class="em-formula">V = k&middot;Q/r &nbsp;|&nbsp; &Delta;V = V<sub>B</sub> &minus; V<sub>A</sub> &nbsp;|&nbsp; W = q&middot;&Delta;V</div>
  <div class="em-input-row">
    <div class="em-input-group"><label>Q (C)</label><input id="em-vQ" value="1e-6"></div>
    <div class="em-input-group"><label>r_A (m)</label><input id="em-vra" value="0.1"></div>
    <div class="em-input-group"><label>r_B (m)</label><input id="em-vrb" value="0.3"></div>
  </div>
  <div class="em-input-row">
    <div class="em-input-group"><label>q prueba (C)</label><input id="em-vq" value="1e-9"></div>
  </div>
  <button class="em-action-btn" onclick="emCalcPotential()">Calcular</button>
  <div id="em-res-potential"></div>`;
}

function emCalcPotential(){
  const Q=parseFloat(document.getElementById('em-vQ').value)||0;
  const rA=parseFloat(document.getElementById('em-vra').value)||0.1;
  const rB=parseFloat(document.getElementById('em-vrb').value)||0.3;
  const q=parseFloat(document.getElementById('em-vq').value)||1e-9;

  const VA=EM_K*Q/rA;
  const VB=EM_K*Q/rB;
  const dV=VB-VA;
  const W=q*dV;
  const E_A=EM_K*Q/(rA*rA);
  const E_B=EM_K*Q/(rB*rB);

  emObjects=[{type:'charge',x:0,y:0,z:0,q:Q,label:'Q'}];
  // Show points A and B
  emObjects.push({type:'vector',ox:rA,oy:0,oz:0,vx:0.01,vy:0,vz:0,color:'#2dd4a0',label:'A'});
  emObjects.push({type:'vector',ox:rB,oy:0,oz:0,vx:0.01,vy:0,vz:0,color:'#ff8c42',label:'B'});
  emDraw();

  document.getElementById('em-res-potential').innerHTML=`
  <div class="em-math-grid" style="margin-top:10px">
    <div class="em-math-card">
      <div class="em-math-label">V en A (r=${rA}m)</div>
      <div class="em-math-value">${emFmt(VA)} V</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">V en B (r=${rB}m)</div>
      <div class="em-math-value">${emFmt(VB)} V</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">ΔV = V_B - V_A</div>
      <div class="em-math-value">${emFmt(dV)} V</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">Trabajo W = q·ΔV</div>
      <div class="em-math-value">${emFmt(W)} J</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">E en A</div>
      <div class="em-math-value">${emFmt(E_A)} N/C</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">E en B</div>
      <div class="em-math-value">${emFmt(E_B)} N/C</div>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────────────
// FUERZA DE LORENTZ
// ─────────────────────────────────────────────────────
function emRenderLorentz(){
  const p=document.getElementById('em-pLorentz');
  if(!p)return;
  p.innerHTML=`
  <div class="em-section-title">Fuerza de Lorentz</div>
  <div class="em-formula"><b>F</b> = q(<b>E</b> + <b>v</b> &times; <b>B</b>)</div>
  <div class="em-section-title" style="margin-top:8px">Carga y velocidad</div>
  <div class="em-input-row">
    <div class="em-input-group"><label>q (C)</label><input id="em-lq" value="1.6e-19"></div>
  </div>
  <div class="em-input-row">
    <div class="em-input-group"><label>vx (m/s)</label><input id="em-lvx" value="1e6"></div>
    <div class="em-input-group"><label>vy</label><input id="em-lvy" value="0"></div>
    <div class="em-input-group"><label>vz</label><input id="em-lvz" value="0"></div>
  </div>
  <div class="em-section-title">Campo eléctrico E⃗ (N/C)</div>
  <div class="em-input-row">
    <div class="em-input-group"><label>Ex</label><input id="em-lex" value="0"></div>
    <div class="em-input-group"><label>Ey</label><input id="em-ley" value="1e4"></div>
    <div class="em-input-group"><label>Ez</label><input id="em-lez" value="0"></div>
  </div>
  <div class="em-section-title">Campo magnético B⃗ (T)</div>
  <div class="em-input-row">
    <div class="em-input-group"><label>Bx</label><input id="em-lbx" value="0"></div>
    <div class="em-input-group"><label>By</label><input id="em-lby" value="0"></div>
    <div class="em-input-group"><label>Bz</label><input id="em-lbz" value="0.5"></div>
  </div>
  <button class="em-action-btn" onclick="emCalcLorentz()">Calcular fuerza</button>
  <div id="em-res-lorentz"></div>`;
}

function emCalcLorentz(){
  const q=parseFloat(document.getElementById('em-lq').value)||0;
  const vx=parseFloat(document.getElementById('em-lvx').value)||0;
  const vy=parseFloat(document.getElementById('em-lvy').value)||0;
  const vz=parseFloat(document.getElementById('em-lvz').value)||0;
  const Ex=parseFloat(document.getElementById('em-lex').value)||0;
  const Ey=parseFloat(document.getElementById('em-ley').value)||0;
  const Ez=parseFloat(document.getElementById('em-lez').value)||0;
  const Bx=parseFloat(document.getElementById('em-lbx').value)||0;
  const By=parseFloat(document.getElementById('em-lby').value)||0;
  const Bz=parseFloat(document.getElementById('em-lbz').value)||0;

  // v × B
  const cxB=vy*Bz-vz*By, cyB=vz*Bx-vx*Bz, czB=vx*By-vy*Bx;
  // F = q(E + v×B)
  const Fx=q*(Ex+cxB), Fy=q*(Ey+cyB), Fz=q*(Ez+czB);
  const Fmag=Math.sqrt(Fx*Fx+Fy*Fy+Fz*Fz);
  const vmag=Math.sqrt(vx*vx+vy*vy+vz*vz);
  const Emag=Math.sqrt(Ex*Ex+Ey*Ey+Ez*Ez);
  const Bmag=Math.sqrt(Bx*Bx+By*By+Bz*Bz);

  // Scale for visualization
  const sc=2/Math.max(vmag,Emag,Bmag,Fmag,1e-20);
  emObjects=[
    {type:'vector',ox:0,oy:0,oz:0,vx:vx*sc,vy:vy*sc,vz:vz*sc,color:'#2dd4a0',label:'v⃗'},
    {type:'vector',ox:0,oy:0,oz:0,vx:Ex*sc,vy:Ey*sc,vz:Ez*sc,color:'#f0c040',label:'E'},
    {type:'vector',ox:0,oy:0,oz:0,vx:Bx*sc,vy:By*sc,vz:Bz*sc,color:'#4da6ff',label:'B'},
    {type:'vector',ox:0,oy:0,oz:0,vx:Fx*sc,vy:Fy*sc,vz:Fz*sc,color:'#ff5572',label:'F⃗'},
  ];
  emDraw();

  document.getElementById('em-res-lorentz').innerHTML=`
  <div class="em-math-grid" style="margin-top:10px">
    <div class="em-math-card full">
      <div class="em-math-label">Fuerza total F⃗ = q(E⃗ + v⃗×B⃗)</div>
      <div class="em-math-value sm">(${emFmt(Fx)}, ${emFmt(Fy)}, ${emFmt(Fz)}) N</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">|F⃗|</div>
      <div class="em-math-value">${emFmt(Fmag)} N</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">v⃗ × B⃗</div>
      <div class="em-math-value sm">(${emFmt(cxB,3)}, ${emFmt(cyB,3)}, ${emFmt(czB,3)})</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">F_eléctrica = qE</div>
      <div class="em-math-value">${emFmt(q*Emag)} N</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">F_magnética = q|v×B|</div>
      <div class="em-math-value">${emFmt(q*Math.sqrt(cxB**2+cyB**2+czB**2))} N</div>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────────────
// FARADAY — Inducción electromagnética
// ─────────────────────────────────────────────────────
function emRenderFaraday(){
  const p=document.getElementById('em-pFaraday');
  if(!p)return;
  p.innerHTML=`
  <div class="em-section-title">Ley de Faraday — Inducción</div>
  <div class="em-formula">&varepsilon; = &minus;d&Phi;<sub>B</sub>/dt &nbsp;|&nbsp; &Phi;<sub>B</sub> = B&middot;A&middot;cos(&theta;)</div>
  <div class="em-input-row">
    <div class="em-input-group"><label>B (T)</label><input id="em-fb" value="0.5"></div>
    <div class="em-input-group"><label>A (m²)</label><input id="em-fa" value="0.01"></div>
    <div class="em-input-group"><label>θ (°)</label><input id="em-ftheta" value="0"></div>
  </div>
  <div class="em-input-row">
    <div class="em-input-group"><label>dB/dt (T/s)</label><input id="em-fdbdt" value="2"></div>
    <div class="em-input-group"><label>N vueltas</label><input id="em-fn" value="100"></div>
  </div>
  <button class="em-action-btn" onclick="emCalcFaraday()">Calcular FEM</button>
  <div id="em-res-faraday"></div>`;
}

function emCalcFaraday(){
  const B=parseFloat(document.getElementById('em-fb').value)||0;
  const A=parseFloat(document.getElementById('em-fa').value)||0;
  const th=parseFloat(document.getElementById('em-ftheta').value)||0;
  const dBdt=parseFloat(document.getElementById('em-fdbdt').value)||0;
  const N=parseFloat(document.getElementById('em-fn').value)||1;

  const thRad=th*Math.PI/180;
  const flux=B*A*Math.cos(thRad);
  const dFluxDt=dBdt*A*Math.cos(thRad);
  const emf=-N*dFluxDt;

  // Vector B on canvas
  emObjects=[
    {type:'vector',ox:0,oy:0,oz:0,vx:0,vy:B*3,vz:0,color:'#4da6ff',label:'B'},
  ];
  emDraw();

  document.getElementById('em-res-faraday').innerHTML=`
  <div class="em-math-grid" style="margin-top:10px">
    <div class="em-math-card">
      <div class="em-math-label">Flujo Φ_B</div>
      <div class="em-math-value">${emFmt(flux)} Wb</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">dΦ_B/dt</div>
      <div class="em-math-value">${emFmt(dFluxDt)} Wb/s</div>
    </div>
    <div class="em-math-card full">
      <div class="em-math-label">FEM inducida ε = −N·dΦ/dt</div>
      <div class="em-math-value big">${emFmt(emf)} V</div>
      <div class="em-result-hint">${emf>0?'Dirección: positiva (Lenz)':'Dirección: negativa (Lenz)'}</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">N vueltas</div>
      <div class="em-math-value">${N}</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">cos(θ)</div>
      <div class="em-math-value">${emFmt(Math.cos(thRad),4)}</div>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────────────
// MAXWELL — Las 4 ecuaciones
// ─────────────────────────────────────────────────────
function emRenderMaxwell(){
  const p=document.getElementById('em-pMaxwell');
  if(!p)return;
  p.innerHTML=`
  <div class="em-section-title">Ecuaciones de Maxwell</div>
  <div class="em-formula" style="line-height:2">
    &nabla;&middot;E = &rho;/&epsilon;<sub>0</sub> &nbsp;&nbsp;&nbsp;(Gauss el&eacute;ctrico)<br>
    &nabla;&middot;B = 0 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(Gauss magn&eacute;tico)<br>
    &nabla;&times;E = &minus;&part;B/&part;t &nbsp;(Faraday)<br>
    &nabla;&times;B = &mu;<sub>0</sub>J + &mu;<sub>0</sub>&epsilon;<sub>0</sub>&part;E/&part;t &nbsp;(Amp&egrave;re-Maxwell)
  </div>
  <div class="em-section-title" style="margin-top:8px">Onda electromagnética en el vacío</div>
  <div class="em-formula">c = 1/&radic;(&mu;<sub>0</sub>&epsilon;<sub>0</sub>) &nbsp;|&nbsp; E = c&middot;B &nbsp;|&nbsp; <b>S</b> = (1/&mu;<sub>0</sub>) <b>E</b>&times;<b>B</b></div>
  <div class="em-input-row">
    <div class="em-input-group"><label>E₀ (N/C)</label><input id="em-mE0" value="1000"></div>
    <div class="em-input-group"><label>f (Hz)</label><input id="em-mf" value="1e9"></div>
  </div>
  <button class="em-action-btn" onclick="emCalcMaxwell()">Calcular onda EM</button>
  <div id="em-res-maxwell"></div>`;
}

function emCalcMaxwell(){
  const E0=parseFloat(document.getElementById('em-mE0').value)||1000;
  const f=parseFloat(document.getElementById('em-mf').value)||1e9;

  const c=1/Math.sqrt(EM_MU0*EM_EPS0);
  const B0=E0/c;
  const lambda=c/f;
  const omega=2*Math.PI*f;
  const k=omega/c;
  // Poynting vector magnitude S = E0*B0/mu0
  const S=E0*B0/EM_MU0;
  // Energy density
  const uE=0.5*EM_EPS0*E0*E0;
  const uB=0.5*B0*B0/EM_MU0;

  // Draw E and B vectors orthogonal
  emObjects=[
    {type:'vector',ox:0,oy:0,oz:0,vx:0,vy:3,vz:0,color:'#f0c040',label:'E'},
    {type:'vector',ox:0,oy:0,oz:0,vx:0,vy:0,vz:3,color:'#4da6ff',label:'B'},
    {type:'vector',ox:0,oy:0,oz:0,vx:3,vy:0,vz:0,color:'#ff5572',label:'S'},
  ];
  emDraw();

  document.getElementById('em-res-maxwell').innerHTML=`
  <div class="em-math-grid" style="margin-top:10px">
    <div class="em-math-card">
      <div class="em-math-label">c = 1/&radic;(&mu;0&epsilon;0)</div>
      <div class="em-math-value">${emFmt(c,0)} m/s</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">B0 = E0/c</div>
      <div class="em-math-value">${emFmt(B0)} T</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">Long. de onda &lambda;</div>
      <div class="em-math-value">${emFmt(lambda)} m</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">Poynting |S|</div>
      <div class="em-math-value">${emFmt(S)} W/m&sup2;</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">u_E (densidad)</div>
      <div class="em-math-value">${emFmt(uE)} J/m&sup3;</div>
    </div>
    <div class="em-math-card">
      <div class="em-math-label">u_B (densidad)</div>
      <div class="em-math-value">${emFmt(uB)} J/m&sup3;</div>
    </div>
    <div class="em-math-card full">
      <div class="em-math-label">k = &omega;/c (n&uacute;m. de onda)</div>
      <div class="em-math-value">${emFmt(k)} rad/m</div>
    </div>
  </div>`;
}







// ═══════════════════════════════════════════════════════
// SUPER CALC v3.0.0 — NAVIGATION
// ═══════════════════════════════════════════════════════
const SUBMOD_CONFIG = {
  al: {
    title: '<span class="al-c">Álgebra</span> Lineal',
    cards: [
      { icon:'⟶', name:'Vectores 3D', desc:'Operaciones, graficación y cálculo vectorial', id:'vectors', cls:'al-sub' },
      { icon:'▦',  name:'Matrices & Ec. Lineales', desc:'Operaciones, sistemas, determinantes, eigenvalores', id:'mat', cls:'al-sub' },
      { icon:'≠',  name:'Inecuaciones', desc:'Lineal, cuadrática, sistemas, valor absoluto', id:'ineq', cls:'al-sub' },
    ]
  },
  fi: {
    title: '<span class="fi-c">Física</span>',
    cards: [
      { icon:'⚡', name:'Electromagnetismo', desc:'Coulomb, Gauss, Lorentz, Faraday, Maxwell', id:'em', cls:'fi-sub' },
      { icon:'🔜', name:'Más próximamente', desc:'Mecánica, Termodinámica, Óptica...', id:'soon', cls:'fi-sub', disabled:true },
    ]
  },
  ca: {
    title: '<span class="ca-c">Cálculo</span>',
    cards: [
      { icon:'∂', name:'Cálculo Diferencial', desc:'Límites, derivadas, análisis de función', id:'calc', cls:'ca-sub' },
      { icon:'∫', name:'Cálculo Integral', desc:'Integral indefinida, definida, series de Taylor', id:'calc', cls:'ca-sub' },
      { icon:'∇', name:'Cálculo Multivariable', desc:'Derivadas parciales, gradiente, integral doble', id:'calc', cls:'ca-sub' },
      { icon:'dy', name:'Ecuaciones Diferenciales', desc:'1er orden, lineal, 2do orden coef. constantes', id:'calc', cls:'ca-sub' },
    ]
  }
};

let currentParent = null;

function openSubmod(parent) {
  currentParent = parent;
  const cfg = SUBMOD_CONFIG[parent];
  document.getElementById('submod-title').innerHTML = cfg.title;
  const cardsEl = document.getElementById('submod-cards');
  cardsEl.innerHTML = cfg.cards.map(c => `
    <div class="submod-card ${c.cls} ${c.disabled?'disabled':''}" onclick="${c.disabled?'':'launchSubmod(\''+c.id+'\')'}" style="${c.disabled?'opacity:.4;cursor:default':''}">
      <div class="submod-icon">${c.icon}</div>
      <div class="submod-info">
        <div class="submod-name">${c.name}</div>
        <div class="submod-desc">${c.desc}</div>
      </div>
      <div class="submod-arrow">${c.disabled?'':'›'}</div>
    </div>`).join('');
  const launcher = document.getElementById('launcher');
  launcher.classList.add('hidden');
  setTimeout(() => {
    launcher.style.display = 'none';
    document.getElementById('submod-screen').classList.add('visible');
  }, 300);
}

function closeSubmod() {
  document.getElementById('submod-screen').classList.remove('visible');
  const launcher = document.getElementById('launcher');
  launcher.style.display = 'flex';
  launcher.style.opacity = '0';
  setTimeout(() => {
    launcher.classList.remove('hidden');
    launcher.style.opacity = '';
  }, 50);
}

function launchSubmod(id) {
  if (id === 'vectors') {
    document.getElementById('submod-screen').classList.remove('visible');
    setTimeout(() => {
      document.getElementById('app').style.display = 'flex';
      initVectorsApp();
    }, 300);
  } else if (id === 'em') {
    document.getElementById('submod-screen').classList.remove('visible');
    setTimeout(() => {
      document.getElementById('em-app').classList.add('visible');
      emInit();
      setTimeout(() => emResizeCanvas(), 50);
      setTimeout(() => emResizeCanvas(), 350);
    }, 300);
  } else if (id === 'mat') {
    document.getElementById('submod-screen').classList.remove('visible');
    setTimeout(() => {
      document.getElementById('mat-app').classList.add('visible');
      matInit();
    }, 300);
  } else if (id === 'calc') {
    document.getElementById('submod-screen').classList.remove('visible');
    setTimeout(() => {
      document.getElementById('calc-app').classList.add('visible');
      calcInit();
    }, 300);
  }
}

function closeModule(id) {
  if (id === 'vectors') {
    document.getElementById('app').style.display = 'none';
  } else if (id === 'em') {
    document.getElementById('em-app').classList.remove('visible');
  } else if (id === 'mat') {
    document.getElementById('mat-app').classList.remove('visible');
  } else if (id === 'ineq') {
    document.getElementById('ineq-app').classList.remove('visible');
    setTimeout(() => ineqBack(), 350);
  } else if (id === 'calc') {
    document.getElementById('calc-app').classList.remove('visible');
  }
  setTimeout(() => {
    document.getElementById('submod-screen').classList.add('visible');
  }, 50);
}

// Legacy goHome — now goes to submod screen
function goHome() {
  closeModule('em');
}

// ═══════════════════════════════════════════════════════
// MATRICES MODULE
// ═══════════════════════════════════════════════════════
let matCurrentTab = 'ops';

function matTab(id) {
  document.querySelectorAll('.mat-tab').forEach((t,i) => {
    t.classList.toggle('on', ['ops','det','sis','eig'][i] === id);
  });
  ['Ops','Det','Sis','Eig'].forEach(p => {
    const el = document.getElementById('mat-p'+p);
    if(el) el.classList.toggle('on', p.toLowerCase() === id);
  });
  matCurrentTab = id;
}

function matInit() {
  matOpsRenderControls();
  matOpsRenderGrids();
  matBuildDet();
  matBuildSis();
  matBuildEig();
}

// ── Helpers ──
function matGetGrid(prefix, rows, cols) {
  const vals = [];
  for(let r=0;r<rows;r++){
    const row=[];
    for(let c=0;c<cols;c++){
      const el=document.getElementById(`${prefix}-${r}-${c}`);
      row.push(el ? parseFloat(el.value)||0 : 0);
    }
    vals.push(row);
  }
  return vals;
}
function matMakeGrid(prefix, rows, cols, extraClass='') {
  let html=`<div class="mat-grid-wrap"><div class="mat-grid" style="grid-template-columns:repeat(${cols},58px)">`;
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    html+=`<input class="mat-cell ${extraClass}" id="${prefix}-${r}-${c}" value="0" type="number" step="any">`;
  }
  return html+'</div></div>';
}
function matFmtNum(n,d=4) {
  if(isNaN(n)||!isFinite(n)) return '—';
  const r=parseFloat(n.toFixed(d));
  return r===0?'0':String(r);
}
function matFmtMatrix(M,label='') {
  const rows=M.length,cols=M[0].length;
  let h=label?`<div class="mat-res-lbl">${label}</div>`:'' ;
  h+=`<div class="mat-res-val">`;
  for(let r=0;r<rows;r++){
    h+='[ '+M[r].map(v=>matFmtNum(v).padStart(9)).join('  ')+' ]<br>';
  }
  return h+'</div>';
}

// ── Matrix math ──
function matMul(A,B) {
  const r=A.length,k=A[0].length,c=B[0].length;
  if(k!==B.length) return null;
  return Array.from({length:r},(_,i)=>Array.from({length:c},(_,j)=>A[i].reduce((s,_,p)=>s+A[i][p]*B[p][j],0)));
}
function matAdd(A,B,sign=1) {
  if(A.length!==B.length||A[0].length!==B[0].length) return null;
  return A.map((row,i)=>row.map((v,j)=>v+sign*B[i][j]));
}
function matScale(A,k) { return A.map(row=>row.map(v=>v*k)); }
function matTranspose(A) { return A[0].map((_,j)=>A.map(r=>r[j])); }
function matDet(M) {
  const n=M.length;
  if(n===1) return M[0][0];
  if(n===2) return M[0][0]*M[1][1]-M[0][1]*M[1][0];
  let det=0;
  for(let c=0;c<n;c++){
    const minor=M.slice(1).map(row=>[...row.slice(0,c),...row.slice(c+1)]);
    det+=((c%2===0)?1:-1)*M[0][c]*matDet(minor);
  }
  return det;
}
function matInv(M) {
  const n=M.length, aug=M.map((row,i)=>[...row,...Array.from({length:n},(_,j)=>i===j?1:0)]);
  for(let col=0;col<n;col++){
    let maxR=col;
    for(let r=col+1;r<n;r++) if(Math.abs(aug[r][col])>Math.abs(aug[maxR][col])) maxR=r;
    [aug[col],aug[maxR]]=[aug[maxR],aug[col]];
    const piv=aug[col][col];
    if(Math.abs(piv)<1e-12) return null;
    for(let j=0;j<2*n;j++) aug[col][j]/=piv;
    for(let r=0;r<n;r++) if(r!==col){
      const f=aug[r][col];
      for(let j=0;j<2*n;j++) aug[r][j]-=f*aug[col][j];
    }
  }
  return aug.map(row=>row.slice(n));
}
// ── Fracción exacta helpers ──
let sisFracMode=false;
function matSisToggleFrac(){
  sisFracMode=!sisFracMode;
  const tog=document.getElementById('sis-frac-tog');
  const lbl=document.getElementById('sis-frac-lbl');
  if(tog) tog.classList.toggle('on',sisFracMode);
  if(lbl) lbl.textContent=sisFracMode?'FRAC':'DEC';
}
function fGcd(a,b){a=Math.abs(Math.round(a));b=Math.abs(Math.round(b));while(b){[a,b]=[b,a%b];}return a||1;}
function fSimp([n,d]){if(d===0)return[n,d];const g=fGcd(Math.abs(n),Math.abs(d));const s=d<0?-1:1;return[s*n/g,s*d/g];}
function fAdd([an,ad],[bn,bd]){return fSimp([an*bd+bn*ad,ad*bd]);}
function fSub([an,ad],[bn,bd]){return fSimp([an*bd-bn*ad,ad*bd]);}
function fMul([an,ad],[bn,bd]){return fSimp([an*bn,ad*bd]);}
function fDiv([an,ad],[bn,bd]){return fSimp([an*bd,ad*bn]);}
function fStr([n,d],useFrac){
  if(d===0)return'∞';
  const v=n/d;
  if(!useFrac) return matFmtNum(v);
  if(d===1)return`${n}`;
  return`${n}/${d}`;
}
function toFrac2(x){
  // convert float to exact fraction via continued fractions
  if(!isFinite(x))return[x>0?1:-1,0];
  const sign=x<0?-1:1;x=Math.abs(x);
  const maxIter=20,eps=1e-9;
  let [n0,d0,n1,d1]=[1,0,0,1];
  let rem=x;
  for(let i=0;i<maxIter;i++){
    const a=Math.floor(rem);
    [n0,n1]=[a*n0+n1,n0];
    [d0,d1]=[a*d0+d1,d0];
    const frac=rem-a;
    if(frac<eps)break;
    rem=1/frac;
  }
  return fSimp([sign*n0,d0]);
}
function matGauss(A,b) {
  const n=A.length;
  // Convert to fractions
  const aug=A.map((row,i)=>[...row,b[i]].map(v=>toFrac2(v)));
  const steps=[];
  for(let col=0;col<n;col++){
    // Partial pivot by absolute value of numerator/denominator
    let maxR=col;
    for(let r=col+1;r<n;r++){
      const [an,ad]=aug[r][col],[bn,bd]=aug[maxR][col];
      if(Math.abs(an/ad)>Math.abs(bn/bd)) maxR=r;
    }
    if(maxR!==col){ [aug[col],aug[maxR]]=[aug[maxR],aug[col]]; steps.push(`Swap F${col+1} ↔ F${maxR+1}`); }
    const piv=aug[col][col];
    if(Math.abs(piv[0]/piv[1])<1e-12) return {sol:null,steps,inconsistent:true};
    for(let r=0;r<n;r++) if(r!==col){
      const f=fDiv(aug[r][col],piv);
      if(Math.abs(f[0]/f[1])<1e-12) continue;
      for(let j=col;j<=n;j++) aug[r][j]=fSub(aug[r][j],fMul(f,aug[col][j]));
      steps.push(`F${r+1} ← F${r+1} − (${fStr(f,true)})·F${col+1}`);
    }
    steps.push(`Pivote col ${col+1}: ${fStr(piv,true)}`);
  }
  const sol=aug.map((row,i)=>fDiv(row[n],row[i]));
  return {sol,steps,inconsistent:false,isFrac:true};
}
function matCramer(A,b) {
  const n=A.length,detA=matDet(A);
  if(Math.abs(detA)<1e-12) return null;
  return b.map((_,i)=>{
    const Ai=A.map((row,r)=>row.map((v,c)=>c===i?b[r]:v));
    return matDet(Ai)/detA;
  });
}

// Power iteration for dominant eigenvalue
function matPowerIter(M,maxIter=200) {
  const n=M.length;
  let v=Array(n).fill(0).map(()=>Math.random()*2-1);
  let norm=Math.sqrt(v.reduce((s,x)=>s+x*x,0));
  v=v.map(x=>x/norm);
  let lam=0;
  for(let iter=0;iter<maxIter;iter++){
    const Mv=M.map(row=>row.reduce((s,val,j)=>s+val*v[j],0));
    const newNorm=Math.sqrt(Mv.reduce((s,x)=>s+x*x,0));
    lam=Mv.reduce((s,x,i)=>s+x*v[i],0);
    v=Mv.map(x=>x/newNorm);
  }
  return {lam,vec:v};
}
function matDeflate(M,lam,vec) {
  const n=M.length;
  const norm2=vec.reduce((s,x)=>s+x*x,0);
  return M.map((row,i)=>row.map((v,j)=>v-lam*vec[i]*vec[j]/norm2));
}
function matEigenAll(M) {
  const n=M.length;
  const pairs=[];
  let Mcur=M.map(r=>[...r]);
  for(let k=0;k<n;k++){
    const {lam,vec}=matPowerIter(Mcur);
    pairs.push({lam,vec});
    Mcur=matDeflate(Mcur,lam,vec);
  }
  return pairs;
}

// ── Ops panel — N matrices of arbitrary m×n ──────────
// State: array of matrix definitions {rows, cols, id}
let matOpsState = { op:'add', matrices:[{id:0,rows:2,cols:2},{id:1,rows:2,cols:2}], nextId:2, scalar:1 };

function matOpsRebuild() {
  matOpsState.op = document.getElementById('mat-op').value;
  matOpsRenderControls();
  matOpsRenderGrids();
  document.getElementById('mat-res-ops').innerHTML = '';
}

function matOpsReset() {
  matOpsState = { op: document.getElementById('mat-op').value, matrices:[{id:0,rows:2,cols:2},{id:1,rows:2,cols:2}], nextId:2, scalar:1 };
  matOpsRenderControls();
  matOpsRenderGrids();
  document.getElementById('mat-res-ops').innerHTML = '';
}

function matOpsRenderControls() {
  const op = matOpsState.op;
  const isSca = op === 'sca';
  const isTra = op === 'tra';
  const isSingle = isSca || isTra;
  // Ensure correct number of matrices
  if (isSingle && matOpsState.matrices.length > 1) matOpsState.matrices = [matOpsState.matrices[0]];
  if (!isSingle && matOpsState.matrices.length < 2) matOpsState.matrices.push({id:matOpsState.nextId++,rows:matOpsState.matrices[0].rows,cols:matOpsState.matrices[0].cols});

  let h = '<div class="mat-row" style="flex-wrap:wrap;gap:6px;margin-bottom:8px">';
  if (isSca) {
    h += `<label>Escalar k:</label><input class="mat-inp wide" id="mat-sca-k" value="${matOpsState.scalar}" type="number" step="any" oninput="matOpsState.scalar=parseFloat(this.value)||1">`;
  }
  if (!isSingle) {
    h += `<button class="mat-btn" style="padding:5px 10px;font-size:10px" onclick="matOpsAddMatrix()">+ Matriz</button>`;
    if (matOpsState.matrices.length > 2) {
      h += `<button class="mat-btn danger" style="padding:5px 10px;font-size:10px" onclick="matOpsRemoveMatrix()">− Última</button>`;
    }
  }
  h += '</div>';
  document.getElementById('mat-ops-controls').innerHTML = h;
}

function matOpsAddMatrix() {
  const last = matOpsState.matrices[matOpsState.matrices.length-1];
  matOpsState.matrices.push({id:matOpsState.nextId++, rows:last.rows, cols:last.cols});
  matOpsRenderGrids();
}

function matOpsRemoveMatrix() {
  if (matOpsState.matrices.length <= 2) return;
  matOpsState.matrices.pop();
  matOpsRenderGrids();
}

function matOpsSizeChange(id, dim, val) {
  const m = matOpsState.matrices.find(m=>m.id===id);
  if (!m) return;
  m[dim] = Math.min(8, Math.max(1, parseInt(val)||1));
  matOpsRenderGrids();
}

function matOpsRenderGrids() {
  const op = matOpsState.op;
  const letters = 'ABCDEFGHIJ';
  let h = '';
  matOpsState.matrices.forEach((m, i) => {
    const lbl = letters[i] || `M${i}`;
    const prefix = `mo-${m.id}`;
    h += `<div style="margin-bottom:12px">
      <div class="mat-sec" style="margin-top:0">${lbl} — 
        <input class="mat-inp" style="width:36px;display:inline;padding:2px 4px" value="${m.rows}" min="1" max="8" type="number" onchange="matOpsSizeChange(${m.id},'rows',this.value)">
        ×
        <input class="mat-inp" style="width:36px;display:inline;padding:2px 4px" value="${m.cols}" min="1" max="8" type="number" onchange="matOpsSizeChange(${m.id},'cols',this.value)">
      </div>`;
    h += matMakeGrid(prefix, m.rows, m.cols);
    h += '</div>';
  });
  document.getElementById('mat-ops-grids').innerHTML = h;
}

function matOpsGetMatrix(m) {
  return matGetGrid(`mo-${m.id}`, m.rows, m.cols);
}

function matCalcOps() {
  const op = matOpsState.op;
  const ms = matOpsState.matrices;
  const letters = 'ABCDEFGHIJ';
  let result, title, err = '';

  if (op === 'sca') {
    const A = matOpsGetMatrix(ms[0]);
    const k = matOpsState.scalar;
    result = matScale(A, k);
    title = `${k} × A`;
  } else if (op === 'tra') {
    const A = matOpsGetMatrix(ms[0]);
    result = matTranspose(A);
    title = 'Aᵀ';
  } else if (op === 'add' || op === 'sub') {
    // Check all same dimensions
    const r0 = ms[0].rows, c0 = ms[0].cols;
    const bad = ms.find(m => m.rows !== r0 || m.cols !== c0);
    if (bad) { err = `Todas las matrices deben ser ${r0}×${c0} para suma/resta.`; }
    else {
      result = matOpsGetMatrix(ms[0]);
      for (let i = 1; i < ms.length; i++) {
        const B = matOpsGetMatrix(ms[i]);
        result = matAdd(result, B, op === 'sub' ? -1 : 1);
      }
      title = ms.map((_,i)=>letters[i]).join(op==='add'?' + ':' − ');
    }
  } else if (op === 'mul') {
    // Chain multiplication — check dimensional compatibility
    result = matOpsGetMatrix(ms[0]);
    for (let i = 1; i < ms.length; i++) {
      const B = matOpsGetMatrix(ms[i]);
      if (result[0].length !== B.length) {
        err = `Columnas de ${letters[i-1]} (${result[0].length}) ≠ filas de ${letters[i]} (${B.length}). Dimensiones incompatibles.`;
        result = null; break;
      }
      result = matMul(result, B);
    }
    if (result) title = ms.map((_,i)=>letters[i]).join(' × ');
  }

  if (err || !result) {
    document.getElementById('mat-res-ops').innerHTML = `<div class="mat-res"><div class="mat-err">${err||'Error en el cálculo.'}</div></div>`;
    return;
  }
  document.getElementById('mat-res-ops').innerHTML = `<div class="mat-res">${matFmtMatrix(result, title)}</div>`;
}

function matBuildGrids() { matOpsRenderControls(); matOpsRenderGrids(); } // compat alias
function matClearOps() { matOpsReset(); }

// ── Det & Inv panel ──
function matBuildDet() {
  const n=parseInt(document.getElementById('mat-dn')?.value)||2;
  document.getElementById('mat-det-grid').innerHTML=matMakeGrid('md',n,n);
  document.getElementById('mat-res-det').innerHTML='';
}
function matCalcDet() {
  const n=parseInt(document.getElementById('mat-dn').value)||2;
  const M=matGetGrid('md',n,n);
  const d=matDet(M);
  document.getElementById('mat-res-det').innerHTML=`<div class="mat-res">
    <div class="mat-res-lbl">Determinante</div>
    <div class="mat-res-val" style="font-size:20px">${matFmtNum(d,6)}</div>
    <div class="${Math.abs(d)<1e-10?'mat-err':'mat-ok'}">${Math.abs(d)<1e-10?'Matriz singular (det ≈ 0)':'Matriz invertible'}</div>
  </div>`;
}
function matCalcInv() {
  const n=parseInt(document.getElementById('mat-dn').value)||2;
  const M=matGetGrid('md',n,n);
  const inv=matInv(M);
  if(!inv){
    document.getElementById('mat-res-det').innerHTML=`<div class="mat-res"><div class="mat-err">Matriz singular — no tiene inversa.</div></div>`;
    return;
  }
  document.getElementById('mat-res-det').innerHTML=`<div class="mat-res">${matFmtMatrix(inv,'A⁻¹')}<div class="mat-ok">Verificar: A · A⁻¹ = I</div></div>`;
}
function matClearDet() { document.querySelectorAll('#mat-det-grid .mat-cell').forEach(el=>el.value=0); document.getElementById('mat-res-det').innerHTML=''; }

// ── Sistemas panel ──
function matBuildSis() {
  const n=parseInt(document.getElementById('mat-sn')?.value)||2;
  let html=`<div class="mat-grid-wrap"><div class="mat-grid" style="grid-template-columns:repeat(${n+1},58px)">`;
  for(let r=0;r<n;r++){
    for(let c=0;c<n;c++) html+=`<input class="mat-cell" id="ms-${r}-${c}" value="0" type="number" step="any">`;
    html+=`<input class="mat-cell rhs" id="ms-${r}-${n}" value="0" type="number" step="any">`;
  }
  html+='</div></div>';
  html+=`<div style="font-size:9px;font-family:'Space Mono',monospace;color:#5a7a9a;margin-bottom:8px">Las últimas columnas (doradas) son el vector b</div>`;
  document.getElementById('mat-sis-grid').innerHTML=html;
  document.getElementById('mat-res-sis').innerHTML='';
}
function matCalcSis() {
  const n=parseInt(document.getElementById('mat-sn').value)||2;
  const A=[],b=[];
  for(let r=0;r<n;r++){
    A.push(Array.from({length:n},(_,c)=>parseFloat(document.getElementById(`ms-${r}-${c}`)?.value||0)));
    b.push(parseFloat(document.getElementById(`ms-${r}-${n}`)?.value||0));
  }
  const met=document.getElementById('mat-smet').value;
  let html='<div class="mat-res">';
  if(met==='gauss'){
    const {sol,steps,inconsistent}=matGauss(A.map(r=>[...r]),b.map(v=>v));
    html+=`<div class="mat-res-lbl">Gauss-Jordan — pasos:</div>`;
    steps.forEach(s=>{
      // steps already contain fraction strings; reformat dec parts if not fracMode
      let display=s;
      if(!sisFracMode){
        // replace any a/b fraction tokens with decimals
        display=s.replace(/(-?\d+)\/(\d+)/g,(_,n,d)=>matFmtNum(parseInt(n)/parseInt(d)));
      }
      html+=`<div class="mat-step">${display}</div>`;
    });
    if(inconsistent||!sol){ html+=`<div class="mat-err">Sistema sin solución o infinitas soluciones.</div>`; }
    else {
      html+=`<div class="mat-res-lbl" style="margin-top:8px">Solución:</div><div class="mat-res-val">`;
      sol.forEach((v,i)=>{ html+=`x<sub>${i+1}</sub> = ${fStr(v,sisFracMode)}<br>`; });
      html+='</div>';
    }
  } else {
    const sol=matCramer(A,b);
    if(!sol){ html+=`<div class="mat-err">det(A) = 0 — Cramer no aplicable.</div>`; }
    else {
      html+=`<div class="mat-res-lbl">Cramer — det(A) = ${matFmtNum(matDet(A))}</div>`;
      html+=`<div class="mat-res-val">`;
      sol.forEach((v,i)=>{ html+=`x<sub>${i+1}</sub> = ${sisFracMode?fStr(toFrac2(v),true):matFmtNum(v)}<br>`; });
      html+='</div>';
    }
  }
  html+='</div>';
  document.getElementById('mat-res-sis').innerHTML=html;
}
function matClearSis() { document.querySelectorAll('#mat-sis-grid .mat-cell').forEach(el=>el.value=0); document.getElementById('mat-res-sis').innerHTML=''; }

// ── Eigenvalores panel ──
function matBuildEig() {
  const n=parseInt(document.getElementById('mat-en')?.value)||2;
  document.getElementById('mat-eig-grid').innerHTML=matMakeGrid('me',n,n);
  document.getElementById('mat-res-eig').innerHTML='';
}
function matCalcEig() {
  const n=parseInt(document.getElementById('mat-en').value)||2;
  const M=matGetGrid('me',n,n);
  const pairs=matEigenAll(M);
  let html='<div class="mat-res"><div class="mat-res-lbl">Valores &amp; Vectores Propios (iteración potencia)</div>';
  pairs.forEach(({lam,vec},i)=>{
    html+=`<div class="mat-eigen-pair">
      <div class="mat-eigen-lbl">&lambda;<sub>${i+1}</sub></div>
      <div class="mat-eigen-val">${matFmtNum(lam,5)}</div>
      <div class="mat-eigen-vec">v = [ ${vec.map(v=>matFmtNum(v,4)).join(',  ')} ]</div>
    </div>`;
  });
  html+=`<div style="font-size:9px;font-family:'Space Mono',monospace;color:#5a7a9a;margin-top:4px">* Método de iteración potencia — preciso para matrices diagonalizables</div>`;
  html+='</div>';
  document.getElementById('mat-res-eig').innerHTML=html;
}
function matClearEig() { document.querySelectorAll('#mat-eig-grid .mat-cell').forEach(el=>el.value=0); document.getElementById('mat-res-eig').innerHTML=''; }

// ═══════════════════════════════════════════════════════
// INECUACIONES MODULE
// ═══════════════════════════════════════════════════════
let ineqType = null;

function ineqSetType(type) {
  ineqType = type;
  document.getElementById('ineq-pick-screen').style.display = 'none';
  const solver = document.getElementById('ineq-solver');
  solver.classList.add('on');
  const titles = {linear:'Lineal: ax + b ⊳ c', quad:'Cuadrática: ax² + bx + c ⊳ 0', system:'Sistema de Inecuaciones', abs:'Valor Absoluto: |ax + b| ⊳ c'};
  document.getElementById('ineq-solver-title').textContent = titles[type]||type;
  buildIneqForm(type);
}

function ineqBack() {
  ineqType = null;
  document.getElementById('ineq-pick-screen').style.display = '';
  const solver = document.getElementById('ineq-solver');
  solver.classList.remove('on');
}

function ineqSymCycle(btnId, symbols) {
  const btn = document.getElementById(btnId);
  const cur = btn.textContent;
  const idx = (symbols.indexOf(cur)+1) % symbols.length;
  btn.textContent = symbols[idx];
}

function buildIneqForm(type) {
  const body = document.getElementById('ineq-solver-body');
  const syms = ['<', '≤', '>', '≥'];
  if(type==='linear') {
    body.innerHTML = `
      <div class="mat-sec">Inecuación Lineal</div>
      <div style="font-size:10px;font-family:'Space Mono',monospace;color:#5a7a9a;margin-bottom:10px">ax + b  ⊳  c</div>
      <div class="ineq-row">
        <div class="ineq-inp-grp"><label>a</label><input class="ineq-inp" id="iq-a" value="2" type="number" step="any"></div>
        <span style="font-size:14px;font-family:'Space Mono',monospace;color:#a0b4cc;padding-top:16px">x +</span>
        <div class="ineq-inp-grp"><label>b</label><input class="ineq-inp" id="iq-b" value="3" type="number" step="any"></div>
        <button class="ineq-sym-btn on" id="iq-sym" onclick="ineqSymCycle('iq-sym',['<','≤','>','≥'])">&gt;</button>
        <div class="ineq-inp-grp"><label>c</label><input class="ineq-inp" id="iq-c" value="7" type="number" step="any"></div>
      </div>
      <button class="ineq-btn" onclick="ineqSolveLinear()">Resolver</button>
      <div id="ineq-res"></div>
      <canvas id="ineq-numline" height="72"></canvas>`;
  } else if(type==='quad') {
    body.innerHTML = `
      <div class="mat-sec">Inecuación Cuadrática</div>
      <div style="font-size:10px;font-family:'Space Mono',monospace;color:#5a7a9a;margin-bottom:10px">ax² + bx + c  ⊳  0</div>
      <div class="ineq-row">
        <div class="ineq-inp-grp"><label>a</label><input class="ineq-inp" id="iq-a" value="1" type="number" step="any"></div>
        <span style="font-size:13px;font-family:'Space Mono',monospace;color:#a0b4cc;padding-top:16px">x² +</span>
        <div class="ineq-inp-grp"><label>b</label><input class="ineq-inp" id="iq-b" value="-3" type="number" step="any"></div>
        <span style="font-size:13px;font-family:'Space Mono',monospace;color:#a0b4cc;padding-top:16px">x +</span>
        <div class="ineq-inp-grp"><label>c</label><input class="ineq-inp" id="iq-c" value="2" type="number" step="any"></div>
        <button class="ineq-sym-btn on" id="iq-sym" onclick="ineqSymCycle('iq-sym',['<','≤','>','≥'])">&lt;</button>
        <span style="font-size:13px;font-family:'Space Mono',monospace;color:#a0b4cc;padding-top:16px">0</span>
      </div>
      <button class="ineq-btn" onclick="ineqSolveQuad()">Resolver</button>
      <div id="ineq-res"></div>
      <canvas id="ineq-numline" height="72"></canvas>`;
  } else if(type==='system') {
    body.innerHTML = `
      <div class="mat-sec">Sistema de Inecuaciones</div>
      <div style="font-size:10px;font-family:'Space Mono',monospace;color:#5a7a9a;margin-bottom:10px">Dos inecuaciones lineales simultáneas</div>
      <div class="ineq-row" style="margin-bottom:6px">
        <div class="ineq-inp-grp"><label>a₁</label><input class="ineq-inp" id="iq-a1" value="1" type="number" step="any"></div>
        <span style="font-size:13px;font-family:'Space Mono',monospace;color:#a0b4cc;padding-top:16px">x +</span>
        <div class="ineq-inp-grp"><label>b₁</label><input class="ineq-inp" id="iq-b1" value="-2" type="number" step="any"></div>
        <button class="ineq-sym-btn on" id="iq-s1" onclick="ineqSymCycle('iq-s1',['<','≤','>','≥'])">&gt;</button>
        <div class="ineq-inp-grp"><label>c₁</label><input class="ineq-inp" id="iq-c1" value="-1" type="number" step="any"></div>
      </div>
      <div class="ineq-row">
        <div class="ineq-inp-grp"><label>a₂</label><input class="ineq-inp" id="iq-a2" value="1" type="number" step="any"></div>
        <span style="font-size:13px;font-family:'Space Mono',monospace;color:#a0b4cc;padding-top:16px">x +</span>
        <div class="ineq-inp-grp"><label>b₂</label><input class="ineq-inp" id="iq-b2" value="3" type="number" step="any"></div>
        <button class="ineq-sym-btn on" id="iq-s2" onclick="ineqSymCycle('iq-s2',['<','≤','>','≥'])">&lt;</button>
        <div class="ineq-inp-grp"><label>c₂</label><input class="ineq-inp" id="iq-c2" value="10" type="number" step="any"></div>
      </div>
      <button class="ineq-btn" onclick="ineqSolveSystem()">Resolver</button>
      <div id="ineq-res"></div>
      <canvas id="ineq-numline" height="72"></canvas>`;
  } else if(type==='abs') {
    body.innerHTML = `
      <div class="mat-sec">Valor Absoluto</div>
      <div style="font-size:10px;font-family:'Space Mono',monospace;color:#5a7a9a;margin-bottom:10px">|ax + b|  ⊳  c</div>
      <div class="ineq-row">
        <span style="font-size:16px;font-family:'Space Mono',monospace;color:#a0b4cc;padding-top:16px">|</span>
        <div class="ineq-inp-grp"><label>a</label><input class="ineq-inp" id="iq-a" value="2" type="number" step="any"></div>
        <span style="font-size:13px;font-family:'Space Mono',monospace;color:#a0b4cc;padding-top:16px">x +</span>
        <div class="ineq-inp-grp"><label>b</label><input class="ineq-inp" id="iq-b" value="-1" type="number" step="any"></div>
        <span style="font-size:16px;font-family:'Space Mono',monospace;color:#a0b4cc;padding-top:16px">|</span>
        <button class="ineq-sym-btn on" id="iq-sym" onclick="ineqSymCycle('iq-sym',['<','≤','>','≥'])">&lt;</button>
        <div class="ineq-inp-grp"><label>c</label><input class="ineq-inp" id="iq-c" value="5" type="number" step="any"></div>
      </div>
      <button class="ineq-btn" onclick="ineqSolveAbs()">Resolver</button>
      <div id="ineq-res"></div>
      <canvas id="ineq-numline" height="72"></canvas>`;
  }
  // Add missing CSS for ineq-inp-grp
  if(!document.getElementById('ineq-inp-grp-style')){
    const st=document.createElement('style');
    st.id='ineq-inp-grp-style';
    st.textContent=`.ineq-inp-grp{display:flex;flex-direction:column;gap:4px}.ineq-inp-grp label{font-size:9px;font-family:'Space Mono',monospace;color:#5a7a9a;text-align:center}`;
    document.head.appendChild(st);
  }
}

function ineqShowResult(html, intervals, steps) {
  let out=`<div class="ineq-res">`;
  out+=`<div class="ineq-res-expr">${html}</div>`;
  if(intervals) out+=`<div class="ineq-res-interval">Solución: ${intervals}</div>`;
  if(steps) steps.forEach(s=>{ out+=`<div class="ineq-res-step">${s}</div>`; });
  out+=`</div>`;
  document.getElementById('ineq-res').innerHTML=out;
}

function ineqSolveLinear() {
  const a=parseFloat(document.getElementById('iq-a').value)||0;
  const b=parseFloat(document.getElementById('iq-b').value)||0;
  const c=parseFloat(document.getElementById('iq-c').value)||0;
  let sym=document.getElementById('iq-sym').textContent;
  const steps=[];
  steps.push(`${a}x + ${b} ${sym} ${c}`);
  steps.push(`${a}x ${sym} ${c - b}`);
  let sol, symFinal=sym;
  const rhs=(c-b);
  if(Math.abs(a)<1e-12){
    const lhs=b;
    const sat=checkIneq(lhs,sym,c);
    sol=sat?'x ∈ ℝ (toda la recta real)':'No hay solución';
    steps.push(sat?'Siempre verdadero':'Siempre falso');
  } else {
    let x=rhs/a;
    if(a<0){ symFinal=flipSym(sym); steps.push(`÷ ${a} (negativo — invierte desigualdad)`); }
    else steps.push(`÷ ${a}`);
    steps.push(`x ${symFinal} ${matFmtNum(x)}`);
    sol=ineqIntervalLinear(symFinal,x);
    drawNumLine([{val:x,sym:symFinal,color:'#f472b6'}],[sol]);
  }
  ineqShowResult(`${a}x + ${b} ${sym} ${c}`, sol, steps);
}

function ineqSolveQuad() {
  const a=parseFloat(document.getElementById('iq-a').value)||1;
  const b=parseFloat(document.getElementById('iq-b').value)||0;
  const c=parseFloat(document.getElementById('iq-c').value)||0;
  const sym=document.getElementById('iq-sym').textContent;
  const disc=b*b-4*a*c;
  const steps=[`${a}x² + ${b}x + ${c} ${sym} 0`];
  steps.push(`Discriminante: b²−4ac = ${matFmtNum(disc)}`);
  let sol, roots=[];
  if(disc<0){
    const alwaysPos=a>0;
    if((sym==='>'||sym==='≥')===alwaysPos){ sol='x ∈ ℝ'; steps.push('Sin raíces reales — parábola siempre '+(a>0?'positiva':'negativa')); }
    else { sol='Sin solución'; steps.push('Sin raíces reales — no cumple la desigualdad'); }
  } else if(Math.abs(disc)<1e-12){
    const r=-b/(2*a);
    roots=[r];
    steps.push(`Raíz doble: x = ${matFmtNum(r)}`);
    sol=sym==='<'?'Sin solución':sym==='≤'?`x = ${matFmtNum(r)}`:`x ∈ ℝ \\ {${matFmtNum(r)}}`;
  } else {
    const r1=(-b-Math.sqrt(disc))/(2*a), r2=(-b+Math.sqrt(disc))/(2*a);
    const lo=Math.min(r1,r2), hi=Math.max(r1,r2);
    roots=[lo,hi];
    steps.push(`Raíces: x₁ = ${matFmtNum(lo)}, x₂ = ${matFmtNum(hi)}`);
    const inside=(sym==='<'||sym==='≤');
    const closed=(sym==='≤'||sym==='≥');
    if((a>0&&inside)||(a<0&&!inside)){
      sol=`${closed?'[':'('}${matFmtNum(lo)}, ${matFmtNum(hi)}${closed?']':')'}`; 
      steps.push(`a${a>0?'>':'<'}0 → solución interior al intervalo`);
    } else {
      const br=closed?']':')';const bl=closed?'[':'(';
      sol=`(-∞, ${matFmtNum(lo)}${br} ∪ ${bl}${matFmtNum(hi)}, +∞)`;
      steps.push(`a${a>0?'>':'<'}0 → solución exterior al intervalo`);
    }
  }
  ineqShowResult(`${a}x² + ${b}x + ${c} ${sym} 0`, sol, steps);
  drawNumLine(roots.map(r=>({val:r,sym:'root',color:'#f472b6'})),[sol]);
}

function ineqSolveSystem() {
  const a1=parseFloat(document.getElementById('iq-a1').value)||1;
  const b1=parseFloat(document.getElementById('iq-b1').value)||0;
  const c1=parseFloat(document.getElementById('iq-c1').value)||0;
  const s1=document.getElementById('iq-s1').textContent;
  const a2=parseFloat(document.getElementById('iq-a2').value)||1;
  const b2=parseFloat(document.getElementById('iq-b2').value)||0;
  const c2=parseFloat(document.getElementById('iq-c2').value)||0;
  const s2=document.getElementById('iq-s2').textContent;
  const steps=[`Inecuación 1: ${a1}x + ${b1} ${s1} ${c1}`,`Inecuación 2: ${a2}x + ${b2} ${s2} ${c2}`];
  const solve1=ineqLinearBound(a1,b1,c1,s1);
  const solve2=ineqLinearBound(a2,b2,c2,s2);
  steps.push(`I1 → x ${solve1.sym} ${matFmtNum(solve1.val)}`);
  steps.push(`I2 → x ${solve2.sym} ${matFmtNum(solve2.val)}`);
  const inter=ineqIntersect(solve1,solve2);
  const sol=inter||'Sin solución (intersección vacía)';
  steps.push(`Intersección: ${sol}`);
  ineqShowResult(`Sistema`,sol,steps);
  drawNumLine([{val:solve1.val,sym:solve1.sym,color:'#7c6af7'},{val:solve2.val,sym:solve2.sym,color:'#22d3ee'}],[sol]);
}

function ineqSolveAbs() {
  const a=parseFloat(document.getElementById('iq-a').value)||1;
  const b=parseFloat(document.getElementById('iq-b').value)||0;
  const c=parseFloat(document.getElementById('iq-c').value)||0;
  const sym=document.getElementById('iq-sym').textContent;
  const steps=[`|${a}x + ${b}| ${sym} ${c}`];
  let sol;
  if(c<0&&(sym==='<'||sym==='≤')){ sol='Sin solución (|·| ≥ 0)'; steps.push('El valor absoluto nunca es negativo'); }
  else if(c<0&&(sym==='>'||sym==='≥')){ sol='x ∈ ℝ'; steps.push('|·| siempre ≥ 0 > c'); }
  else {
    const r1=(-b+c)/a, r2=(-b-c)/a;
    const lo=Math.min(r1,r2), hi=Math.max(r1,r2);
    const closed=(sym==='≤'||sym==='≥');
    if(sym==='<'||sym==='≤'){
      steps.push(`−${c} ${flipSym(sym)} ${a}x + ${b} ${sym} ${c}`);
      steps.push(`Raíces: ${matFmtNum(lo)}, ${matFmtNum(hi)}`);
      sol=`${closed?'[':'('}${matFmtNum(lo)}, ${matFmtNum(hi)}${closed?']':')'}`;
    } else {
      steps.push(`${a}x + ${b} ${sym} ${c}  ó  ${a}x + ${b} ${flipSym(sym)} −${c}`);
      steps.push(`Raíces: ${matFmtNum(lo)}, ${matFmtNum(hi)}`);
      const br=closed?']':')';const bl=closed?'[':'(';
      sol=`(-∞, ${matFmtNum(lo)}${br} ∪ ${bl}${matFmtNum(hi)}, +∞)`;
    }
  }
  ineqShowResult(`|${a}x + ${b}| ${sym} ${c}`,sol,steps);
  drawNumLine([{val:(-b+c)/a,sym:'root',color:'#f472b6'},{val:(-b-c)/a,sym:'root',color:'#f472b6'}],[sol]);
}

// ── Ineq helpers ──
function flipSym(s){ return {'>':'<','<':'>','≥':'≤','≤':'≥'}[s]||s; }
function checkIneq(a,sym,b){ return {'>':a>b,'<':a<b,'≥':a>=b,'≤':a<=b}[sym]; }
function ineqIntervalLinear(sym,x){
  if(sym==='>') return `(${matFmtNum(x)}, +∞)`;
  if(sym==='≥') return `[${matFmtNum(x)}, +∞)`;
  if(sym==='<') return `(-∞, ${matFmtNum(x)})`;
  if(sym==='≤') return `(-∞, ${matFmtNum(x)}]`;
  return '';
}
function ineqLinearBound(a,b,c,sym){
  const rhs=c-b; let x=rhs/(a||1), s=sym;
  if(a<0) s=flipSym(sym);
  return {val:x,sym:s};
}
function ineqIntersect(s1,s2){
  // Both as intervals [lo,hi], compute intersection
  const lo1=(s1.sym==='>'||s1.sym==='≥')?s1.val:-Infinity;
  const hi1=(s1.sym==='<'||s1.sym==='≤')?s1.val:Infinity;
  const lo2=(s2.sym==='>'||s2.sym==='≥')?s2.val:-Infinity;
  const hi2=(s2.sym==='<'||s2.sym==='≤')?s2.val:Infinity;
  const lo=Math.max(lo1,lo2), hi=Math.min(hi1,hi2);
  if(lo>hi) return null;
  const loS=isFinite(lo)?matFmtNum(lo):'-∞', hiS=isFinite(hi)?matFmtNum(hi):'+∞';
  const loBr=(s1.sym==='≥'||s2.sym==='≥')?'[':'(';
  const hiBr=(s1.sym==='≤'||s2.sym==='≤')?']':')';
  return `${loBr}${loS}, ${hiS}${hiBr}`;
}

// ── Number line canvas ──
function drawNumLine(points, solutionLabels) {
  const canvas=document.getElementById('ineq-numline');
  if(!canvas) return;
  const W=canvas.offsetWidth||320; canvas.width=W; canvas.height=72;
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,W,72);
  // Background
  ctx.fillStyle='#111827'; ctx.fillRect(0,0,W,72);
  // Compute range
  const vals=points.map(p=>p.val).filter(v=>isFinite(v));
  if(!vals.length) return;
  const ctr=(Math.min(...vals)+Math.max(...vals))/2;
  const span=Math.max(Math.max(...vals)-Math.min(...vals),4)*1.6;
  const lo=ctr-span/2, hi=ctr+span/2;
  const toX=v=>16+(v-lo)/(hi-lo)*(W-32);
  // Axis line
  const ay=38;
  ctx.strokeStyle='#1e2d45'; ctx.lineWidth=2; ctx.beginPath();
  ctx.moveTo(12,ay); ctx.lineTo(W-12,ay); ctx.stroke();
  ctx.fillStyle='#3a5a7a';ctx.font='10px Space Mono';ctx.textAlign='center';
  // Ticks
  for(let v=Math.ceil(lo);v<=Math.floor(hi);v++){
    const x=toX(v);
    ctx.strokeStyle='#1e2d45';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,ay-4);ctx.lineTo(x,ay+4);ctx.stroke();
    if((hi-lo)<20) ctx.fillText(v,x,ay+16);
  }
  // Points
  points.forEach(({val,sym,color})=>{
    if(!isFinite(val)) return;
    const x=toX(val);
    const filled=(sym==='≤'||sym==='≥'||sym==='root');
    ctx.beginPath();ctx.arc(x,ay,7,0,Math.PI*2);
    ctx.strokeStyle=color;ctx.lineWidth=2;
    if(filled){ ctx.fillStyle=color;ctx.fill(); }
    else { ctx.fillStyle='#111827';ctx.fill(); ctx.stroke(); }
    ctx.stroke();
    ctx.fillStyle=color;ctx.font='bold 10px Space Mono';ctx.textAlign='center';
    ctx.fillText(matFmtNum(val),x,ay-14);
  });
  // Arrows for unbounded
  ctx.strokeStyle='#f472b6';ctx.lineWidth=2;ctx.setLineDash([4,3]);
  // (simplified — just show colored region hint)
  ctx.setLineDash([]);
}





// ═══════════════════════════════════════════════════════
// CÁLCULO MODULE v4.0.0
// ═══════════════════════════════════════════════════════

// ── Estado ──
let calcCurrentTab = 'dif';
let calcActiveInput = null;

function calcSetActiveInput(el) { calcActiveInput = el; }

// ── Navegación ──
function calcTab(id) {
  document.querySelectorAll('.calc-tab').forEach((t,i) => {
    t.classList.toggle('on', ['dif','int','mul','edo','graf'][i] === id);
  });
  ['Dif','Int','Mul','Edo','Graf'].forEach(p => {
    const el = document.getElementById('calc-p'+p);
    if(el) el.classList.toggle('on', p.toLowerCase() === id);
  });
  calcCurrentTab = id;
  if(id==='graf') grafInitFields();
}

// ── Teclado tipo C ──
const CALC_KB_GROUPS = [
  { label: 'Operadores', btns: [
    { icon:'∂/∂x', name:'parcial x', ins:'∂/∂x(' },
    { icon:'d/dx',  name:'derivada',  ins:'d/dx(' },
    { icon:'∫',     name:'integral',  ins:'∫(' },
    { icon:'∑',     name:'suma',      ins:'∑(' },
    { icon:'lim',   name:'límite',    ins:'lim(x→' },
  ]},
  { label: 'Funciones', btns: [
    { icon:'sin',   name:'seno',      ins:'sin(' },
    { icon:'cos',   name:'coseno',    ins:'cos(' },
    { icon:'tan',   name:'tangente',  ins:'tan(' },
    { icon:'sin⁻¹', name:'arcsin',    ins:'asin(' },
    { icon:'cos⁻¹', name:'arccos',    ins:'acos(' },
    { icon:'tan⁻¹', name:'arctan',    ins:'atan(' },
    { icon:'ln',    name:'log nat.',  ins:'ln(' },
    { icon:'log',   name:'log₁₀',    ins:'log(' },
    { icon:'√',     name:'raíz',      ins:'sqrt(' },
    { icon:'eˣ',    name:'exp',       ins:'e^' },
    { icon:'|x|',   name:'abs',       ins:'abs(' },
  ]},
  { label: 'Constantes y potencias', btns: [
    { icon:'xⁿ',   name:'potencia',  ins:'x^' },
    { icon:'π',    name:'pi',        ins:'π' },
    { icon:'∞',    name:'infinito',  ins:'∞' },
    { icon:'e',    name:'euler',     ins:'e' },
    { icon:'( )',  name:'paréntesis',ins:'(' },
    { icon:'1/x',  name:'fracción',  ins:'1/(' },
  ]},
];

function calcBuildKB(containerId) {
  const el = document.getElementById(containerId);
  if(!el || el.dataset.built) return;
  el.dataset.built = '1';
  el.className = 'calc-keyboard';
  el.innerHTML = CALC_KB_GROUPS.map(g => `
    <div class="calc-kb-group">
      <div class="calc-kb-label">${g.label}</div>
      <div class="calc-kb-btns">
        ${g.btns.map(b => `
          <button class="calc-kb-btn" onclick="calcKBInsert(${JSON.stringify(b.ins)})">
            <span class="kb-icon">${b.icon}</span>
            <span class="kb-name">${b.name}</span>
          </button>`).join('')}
      </div>
    </div>`).join('');
}

function calcKBInsert(text) {
  // Insert into last focused input in current panel
  const panel = document.getElementById('calc-p' + calcCurrentTab.charAt(0).toUpperCase() + calcCurrentTab.slice(1));
  const inp = calcActiveInput && panel && panel.contains(calcActiveInput)
    ? calcActiveInput
    : panel ? panel.querySelector('.calc-inp') : null;
  if(!inp) return;
  const s = inp.selectionStart, e = inp.selectionEnd;
  inp.value = inp.value.slice(0,s) + text + inp.value.slice(e);
  const pos = s + text.length;
  inp.focus();
  inp.setSelectionRange(pos,pos);
  calcActiveInput = inp;
}

function calcInitKBs() {
  ['dif','int','mul','edo'].forEach(id => {
    calcBuildKB('calc-kb-'+id);
  });
}

// ── Limpiar resultado ──
function calcClear(prefix) {
  document.querySelectorAll(`[id^="${prefix}"]`).forEach(el => {
    if(el.tagName==='INPUT') el.value='';
    if(el.id === prefix+'-res') el.innerHTML='';
  });
}

// ── Parser de expresiones ──
// Convierte string a función evaluable
function calcParse(expr) {
  if(!expr || !expr.trim()) return null;
  let s = expr.trim();
  // Normalize
  s = s.replace(/π/g,'Math.PI');
  s = s.replace(/∞/g,'Infinity');
  s = s.replace(/\^/g,'**');
  s = s.replace(/\bsin\b/g,'Math.sin');
  s = s.replace(/\bcos\b/g,'Math.cos');
  s = s.replace(/\btan\b/g,'Math.tan');
  s = s.replace(/\basin\b/g,'Math.asin');
  s = s.replace(/\bacos\b/g,'Math.acos');
  s = s.replace(/\batan\b/g,'Math.atan');
  s = s.replace(/\bln\b/g,'Math.log');
  s = s.replace(/\blog\b/g,'Math.log10');
  s = s.replace(/\bsqrt\b/g,'Math.sqrt');
  s = s.replace(/\babs\b/g,'Math.abs');
  s = s.replace(/\be\b/g,'Math.E');
  // implicit multiplication: 2x → 2*x, x(... → x*(
  s = s.replace(/(\d)([a-zA-Z(])/g,'$1*$2');
  s = s.replace(/([a-zA-Z)])(\d)/g,'$1*$2');
  s = s.replace(/\)(\()/g,')*$1');
  try {
    const fn = new Function('x','y','return '+s+';');
    fn(0,0); // test
    return fn;
  } catch(e) { return null; }
}

// Evaluate with x=val, y=yval
function calcEval(fn, x, y=0) {
  try { const v=fn(x,y); return isFinite(v)?v:NaN; }
  catch(e){ return NaN; }
}

// ── Número decimal limpio ──
function cFmt(v, d=6) {
  if(!isFinite(v)) return v>0?'+∞':'-∞';
  if(Math.abs(v)<1e-10) return '0';
  const r = Math.round(v*1e9)/1e9;
  // try fraction
  const frac = toFrac2(r);
  if(Math.abs(frac[0]/frac[1]-r)<1e-9 && Math.abs(frac[1])<=100 && Math.abs(frac[1])>1)
    return `${frac[0]}/${frac[1]}`;
  return parseFloat(r.toPrecision(d)).toString();
}

// ── Derivada numérica (Richardson extrapolation) ──
function numDeriv(fn, x, order=1) {
  const h = 1e-4;
  if(order===1) return (calcEval(fn,x+h)-calcEval(fn,x-h))/(2*h);
  if(order===2) return (calcEval(fn,x+h)-2*calcEval(fn,x)+calcEval(fn,x-h))/(h*h);
  if(order===3) return (calcEval(fn,x+2*h)-2*calcEval(fn,x+h)+2*calcEval(fn,x-h)-calcEval(fn,x-2*h))/(2*h*h*h);
  return NaN;
}

// ── Integral numérica (Romberg) ──
function numIntegral(fn, a, b, n=1000) {
  if(!isFinite(a)||!isFinite(b)) return NaN;
  const h=(b-a)/n;
  let s=calcEval(fn,a)+calcEval(fn,b);
  for(let i=1;i<n;i++) s+=(i%2===0?2:4)*calcEval(fn,a+i*h);
  return s*h/3;
}

// ── Derivada simbólica básica ──
// Returns object with exprStr and steps[]
function symDeriv(exprStr, order=1) {
  let steps = [];
  let expr = exprStr.trim();

  // Detectar forma canónica
  const rules = [
    { pattern: /^(\d+(?:\.\d+)?)\*?x\*\*(\d+(?:\.\d+)?)$/, name: 'Regla de potencia: d/dx[axⁿ] = n·axⁿ⁻¹',
      apply: (m) => {
        const a=parseFloat(m[1]),n=parseFloat(m[2]);
        const na=a*n, nn=n-1;
        steps.push(`Identificar: a=${cFmt(a)}, n=${cFmt(n)}`);
        steps.push(`Aplicar d/dx[${cFmt(a)}x^${cFmt(n)}] = ${cFmt(a)}·${cFmt(n)}·x^(${cFmt(n)}−1)`);
        const res = nn===0 ? cFmt(na) : nn===1 ? `${cFmt(na)}x` : `${cFmt(na)}x^${cFmt(nn)}`;
        steps.push(`Resultado: ${res}`);
        return res;
      }
    },
    { pattern: /^x\*\*(\d+(?:\.\d+)?)$/, name: 'Regla de potencia',
      apply: (m) => {
        const n=parseFloat(m[1]), nn=n-1;
        steps.push(`Identificar: a=1, n=${cFmt(n)}`);
        steps.push(`Aplicar d/dx[x^${cFmt(n)}] = ${cFmt(n)}·x^(${cFmt(n)}−1)`);
        const res = nn===0?cFmt(n):nn===1?`${cFmt(n)}x`:`${cFmt(n)}x^${cFmt(nn)}`;
        steps.push(`Resultado: ${res}`);
        return res;
      }
    },
    { pattern: /^(\d+(?:\.\d+)?)$/, name: 'Derivada de constante',
      apply: () => { steps.push('Derivada de constante = 0'); return '0'; }
    },
    { pattern: /^x$/, name: 'Derivada de x',
      apply: () => { steps.push('d/dx[x] = 1'); return '1'; }
    },
    { pattern: /^(\d+(?:\.\d+)?)\*?x$/, name: 'Derivada de ax',
      apply: (m) => { steps.push(`d/dx[${m[1]}x] = ${m[1]}`); return m[1]; }
    },
    { pattern: /^sin\(x\)$/, name: 'Derivada de sin(x)',
      apply: () => { steps.push('d/dx[sin(x)] = cos(x)'); return 'cos(x)'; }
    },
    { pattern: /^cos\(x\)$/, name: 'Derivada de cos(x)',
      apply: () => { steps.push('d/dx[cos(x)] = −sin(x)'); return '−sin(x)'; }
    },
    { pattern: /^tan\(x\)$/, name: 'Derivada de tan(x)',
      apply: () => { steps.push('d/dx[tan(x)] = sec²(x) = 1/cos²(x)'); return '1/cos²(x)'; }
    },
    { pattern: /^ln\(x\)$/, name: 'Derivada de ln(x)',
      apply: () => { steps.push('d/dx[ln(x)] = 1/x'); return '1/x'; }
    },
    { pattern: /^e\^x$/, name: 'Derivada de eˣ',
      apply: () => { steps.push('d/dx[eˣ] = eˣ'); return 'eˣ'; }
    },
    { pattern: /^asin\(x\)$/, apply: () => { steps.push('d/dx[arcsin(x)] = 1/√(1−x²)'); return '1/√(1−x²)'; } },
    { pattern: /^acos\(x\)$/, apply: () => { steps.push('d/dx[arccos(x)] = −1/√(1−x²)'); return '−1/√(1−x²)'; } },
    { pattern: /^atan\(x\)$/, apply: () => { steps.push('d/dx[arctan(x)] = 1/(1+x²)'); return '1/(1+x²)'; } },
  ];

  // normalize expr for matching
  const norm = expr.replace(/\s/g,'').replace(/π/g,'PI').replace(/\^/g,'**');

  for(const rule of rules) {
    const m = norm.match(rule.pattern);
    if(m) {
      steps.unshift(`Regla aplicada: ${rule.name||''}`);
      const res = rule.apply(m);
      if(order>1) {
        steps.push(`--- Derivada de orden ${order}: derivar el resultado ---`);
        const next = symDeriv(res, order-1);
        steps.push(...next.steps);
        return { exprStr: next.exprStr, steps };
      }
      return { exprStr: res, steps };
    }
  }

  // Fallback: numerical
  steps.push('Expresión compuesta — usando diferenciación numérica');
  return { exprStr: null, steps, numerical: true };
}

// ══════════════════════════════════════
// CÁLCULO DIFERENCIAL
// ══════════════════════════════════════

function calcLimit() {
  const fxStr = document.getElementById('dif-lim-fx').value.trim();
  const aStr  = document.getElementById('dif-lim-a').value.trim();
  const side  = document.getElementById('dif-lim-side').value;
  const resEl = document.getElementById('dif-lim-res');

  if(!fxStr){ resEl.innerHTML=`<div class="calc-err">Ingresa f(x)</div>`; return; }

  const fn = calcParse(fxStr);
  if(!fn){ resEl.innerHTML=`<div class="calc-err">Expresión inválida. Revisa la sintaxis.</div>`; return; }

  const a = aStr==='∞'?Infinity:aStr==='-∞'?-Infinity:parseFloat(aStr);
  const steps = [];
  steps.push(`Calcular: lim(x→${aStr||'?'}) ${fxStr}`);

  let L = NaN;
  const eps = [1e-4, 1e-6, 1e-8];

  if(!isFinite(a)) {
    // límite en infinito: evaluamos en valores grandes
    const big = a>0 ? [1e6,1e8,1e10] : [-1e6,-1e8,-1e10];
    const vals = big.map(x=>calcEval(fn,x));
    steps.push(`Evaluar en valores ${a>0?'grandes positivos':'grandes negativos'}:`);
    big.forEach((x,i)=>steps.push(`  f(${x.toExponential(0)}) = ${cFmt(vals[i])}`));
    const diffs = [Math.abs(vals[1]-vals[0]), Math.abs(vals[2]-vals[1])];
    if(diffs[0]<1e-3 && diffs[1]<diffs[0]+1e-6) {
      L = vals[2];
      steps.push(`Los valores convergen → límite = ${cFmt(L)}`);
    } else {
      steps.push('Los valores no convergen → límite no existe o es ∞');
      L = Infinity;
    }
  } else {
    if(side==='both'||side==='right') {
      const rVals = eps.map(h=>calcEval(fn,a+h));
      steps.push(`Aproximación por la derecha (x→${aStr}⁺):`);
      eps.forEach((h,i)=>steps.push(`  f(${a}+${h}) = ${cFmt(rVals[i])}`));
      const rL = rVals[2];
      if(side==='right'){ L=rL; steps.push(`Límite derecho = ${cFmt(rL)}`); }
      else {
        const lVals = eps.map(h=>calcEval(fn,a-h));
        steps.push(`Aproximación por la izquierda (x→${aStr}⁻):`);
        eps.forEach((h,i)=>steps.push(`  f(${a}−${h}) = ${cFmt(lVals[i])}`));
        const lL = lVals[2];
        steps.push(`Límite derecho = ${cFmt(rL)}`);
        steps.push(`Límite izquierdo = ${cFmt(lL)}`);
        if(Math.abs(rL-lL)<1e-5){
          L = (rL+lL)/2;
          steps.push(`Ambos lados coinciden → límite bilateral = ${cFmt(L)}`);
        } else {
          steps.push('Los límites laterales son distintos → el límite bilateral NO existe');
          L = NaN;
        }
      }
    } else {
      const lVals = eps.map(h=>calcEval(fn,a-h));
      steps.push(`Aproximación por la izquierda:`);
      eps.forEach((h,i)=>steps.push(`  f(${a}−${h}) = ${cFmt(lVals[i])}`));
      L = lVals[2];
      steps.push(`Límite izquierdo = ${cFmt(L)}`);
    }
  }

  const valDirect = calcEval(fn, a);
  if(isFinite(valDirect) && Math.abs(valDirect-L)<1e-4) {
    steps.push(`Verificación: f(${aStr}) = ${cFmt(valDirect)} ✓ (función continua en ese punto)`);
  }

  resEl.innerHTML = calcResHTML(`lim(x→${aStr||'?'}) ${fxStr}`, steps, isNaN(L)?'No existe':cFmt(L));
}

function calcDerivative() {
  const fxStr = document.getElementById('dif-der-fx').value.trim();
  const ord   = parseInt(document.getElementById('dif-der-ord').value)||1;
  const ptStr = document.getElementById('dif-der-pt').value.trim();
  const resEl = document.getElementById('dif-der-res');

  if(!fxStr){ resEl.innerHTML=`<div class="calc-err">Ingresa f(x)</div>`; return; }

  const fn = calcParse(fxStr);
  if(!fn){ resEl.innerHTML=`<div class="calc-err">Expresión inválida.</div>`; return; }

  const ordLabel = ord===1?"Primera (f')" : ord===2?"Segunda (f'')" : "Tercera (f''')";
  const steps = [`Calcular derivada de orden ${ord}: ${ordLabel}`];
  steps.push(`f(x) = ${fxStr}`);

  const { exprStr, steps: symSteps, numerical } = symDeriv(fxStr, ord);
  steps.push(...symSteps);

  let resultStr = exprStr || '(ver valor numérico)';
  let evalPart = '';

  if(ptStr !== '') {
    const pt = parseFloat(ptStr);
    if(!isNaN(pt)) {
      const numVal = numDeriv(fn, pt, ord);
      steps.push(`Evaluar en x = ${ptStr}:`);
      steps.push(`f${"'".repeat(ord)}(${ptStr}) ≈ ${cFmt(numVal)}`);
      evalPart = ` → en x=${ptStr}: ${cFmt(numVal)}`;
    }
  }

  resEl.innerHTML = calcResHTML(`d${ord>1?ord:''}/dx${ord>1?ord:''} [${fxStr}]`, steps, resultStr + evalPart);
}

function calcAnalysis() {
  const fxStr = document.getElementById('dif-ana-fx').value.trim();
  const resEl = document.getElementById('dif-ana-res');

  if(!fxStr){ resEl.innerHTML=`<div class="calc-err">Ingresa f(x)</div>`; return; }
  const fn = calcParse(fxStr);
  if(!fn){ resEl.innerHTML=`<div class="calc-err">Expresión inválida.</div>`; return; }

  const steps = [`Análisis completo de f(x) = ${fxStr}`];

  // Puntos críticos (f'=0): buscar donde f' cambia de signo
  const h = 1e-5;
  const xs = Array.from({length:800},(_,i)=>-10+(i/799)*20);
  const fVals = xs.map(x=>calcEval(fn,x));
  const dVals = xs.map(x=>numDeriv(fn,x,1));
  const d2Vals = xs.map(x=>numDeriv(fn,x,2));

  // Raíces de f' (cambio de signo)
  const critPts = [];
  for(let i=1;i<xs.length;i++){
    if(Math.sign(dVals[i])!==Math.sign(dVals[i-1]) && isFinite(dVals[i]) && isFinite(dVals[i-1])){
      const xc = (xs[i]+xs[i-1])/2;
      const fc = calcEval(fn,xc);
      const d2 = numDeriv(fn,xc,2);
      critPts.push({x:xc, f:fc, d2});
    }
  }

  steps.push(`\nDerivada primera: se evalúa numéricamente`);
  if(critPts.length===0) {
    steps.push('Sin puntos críticos en [-10, 10]');
  } else {
    steps.push(`Puntos críticos encontrados en [-10, 10]:`);
    critPts.slice(0,5).forEach(({x,f,d2})=>{
      const tipo = Math.abs(d2)<1e-6?'punto de inflexión':d2>0?'mínimo local':'máximo local';
      steps.push(`  x ≈ ${cFmt(x)} → f(x) ≈ ${cFmt(f)} → ${tipo} (f''(x) ≈ ${cFmt(d2)})`);
    });
  }

  // Creciente / decreciente en intervalos
  const increasing = dVals.filter(d=>d>1e-4).length;
  const decreasing = dVals.filter(d=>d<-1e-4).length;
  steps.push(`\nComportamiento general en [-10, 10]:`);
  steps.push(`  Creciente en ${increasing} / ${xs.length} puntos evaluados`);
  steps.push(`  Decreciente en ${decreasing} / ${xs.length} puntos evaluados`);

  // Concavidad
  const concaveUp = d2Vals.filter(d=>d>1e-4).length;
  steps.push(`  Cóncava hacia arriba (f''>0): ${concaveUp} / ${xs.length} puntos`);
  steps.push(`  Cóncava hacia abajo (f''<0): ${xs.length-concaveUp} / ${xs.length} puntos`);

  // Valor en x=0
  const f0 = calcEval(fn,0);
  steps.push(`\nIntercepto vertical: f(0) = ${cFmt(f0)}`);

  resEl.innerHTML = calcResHTML(`Análisis de f(x) = ${fxStr}`, steps, `${critPts.length} punto(s) crítico(s) en [-10,10]`);
}

// ══════════════════════════════════════
// CÁLCULO INTEGRAL
// ══════════════════════════════════════

function calcIntegralIndef() {
  const fxStr = document.getElementById('int-indef-fx').value.trim();
  const resEl = document.getElementById('int-indef-res');

  if(!fxStr){ resEl.innerHTML=`<div class="calc-err">Ingresa f(x)</div>`; return; }

  const steps = [`Calcular: ∫ ${fxStr} dx`];

  // Reglas simbólicas básicas
  const intRules = [
    { label:'constante',  pat:/^(\d+(?:\.\d+)?)$/, apply: m => { const c=m[1]; steps.push(`Regla: ∫k dx = kx + C`); steps.push(`∫${c} dx = ${c}x + C`); return `${c}x + C`; } },
    { label:'xⁿ',         pat:/^x\*\*(\d+(?:\.\d+)?)$/, apply: m => { const n=parseFloat(m[1]),n1=n+1; steps.push(`Regla de potencia: ∫xⁿ dx = xⁿ⁺¹/(n+1) + C`); steps.push(`∫x^${n} dx = x^${n1}/${cFmt(n1)} + C`); return `x^${n1}/${cFmt(n1)} + C`; } },
    { label:'axⁿ',        pat:/^(\d+(?:\.\d+)?)\*?x\*\*(\d+(?:\.\d+)?)$/, apply: m => { const a=parseFloat(m[1]),n=parseFloat(m[2]),n1=n+1; steps.push(`Regla: ∫axⁿ dx = axⁿ⁺¹/(n+1) + C`); steps.push(`∫${a}x^${n} dx = ${a}x^${n1}/${cFmt(n1)} + C`); return `${cFmt(a/n1)}x^${n1} + C`; } },
    { label:'ax',         pat:/^(\d+(?:\.\d+)?)\*?x$/, apply: m => { const a=parseFloat(m[1]); steps.push(`Regla: ∫ax dx = ax²/2 + C`); return `${cFmt(a/2)}x² + C`; } },
    { label:'x',          pat:/^x$/, apply: () => { steps.push(`Regla: ∫x dx = x²/2 + C`); return `x²/2 + C`; } },
    { label:'sin(x)',     pat:/^sin\(x\)$/, apply: () => { steps.push(`Regla: ∫sin(x) dx = −cos(x) + C`); return `−cos(x) + C`; } },
    { label:'cos(x)',     pat:/^cos\(x\)$/, apply: () => { steps.push(`Regla: ∫cos(x) dx = sin(x) + C`); return `sin(x) + C`; } },
    { label:'eˣ',         pat:/^e\^x$/, apply: () => { steps.push(`Regla: ∫eˣ dx = eˣ + C`); return `eˣ + C`; } },
    { label:'1/x',        pat:/^1\/x$/, apply: () => { steps.push(`Regla: ∫(1/x) dx = ln|x| + C`); return `ln|x| + C`; } },
    { label:'ln(x)',      pat:/^ln\(x\)$/, apply: () => { steps.push(`Integración por partes: ∫ln(x) dx = x·ln(x) − x + C`); return `x·ln(x) − x + C`; } },
    { label:'1/sqrt',     pat:/^1\/sqrt\(x\)$/, apply: () => { steps.push(`Regla: ∫1/√x dx = 2√x + C`); return `2√x + C`; } },
    { label:'tan(x)',     pat:/^tan\(x\)$/, apply: () => { steps.push(`Regla: ∫tan(x) dx = −ln|cos(x)| + C`); return `−ln|cos(x)| + C`; } },
  ];

  const norm = fxStr.trim().replace(/\s/g,'').replace(/\^/g,'**');
  let found = false;
  for(const rule of intRules) {
    const m = norm.match(rule.pattern);
    if(m){ const res=rule.apply(m); resEl.innerHTML=calcResHTML(`∫ ${fxStr} dx`, steps, res); found=true; break; }
  }

  if(!found) {
    steps.push('Forma no reconocida para integración simbólica exacta');
    steps.push('Mostrando antiderivada aproximada (verificar con derivación)');
    const fn = calcParse(fxStr);
    if(fn) {
      // Show numeric integral over [0,1] as a reference
      const v = numIntegral(fn, 0, 1);
      steps.push(`∫₀¹ f(x) dx ≈ ${cFmt(v)} (referencia numérica)`);
      steps.push('Para integral indefinida exacta de expresiones compuestas, usa integración por sustitución o por partes');
      resEl.innerHTML = calcResHTML(`∫ ${fxStr} dx`, steps, 'F(x) + C (ver pasos)');
    } else {
      resEl.innerHTML = `<div class="calc-err">Expresión inválida.</div>`;
    }
  }
}

function calcIntegralDef() {
  const fxStr = document.getElementById('int-def-fx').value.trim();
  const aStr  = document.getElementById('int-def-a').value.trim();
  const bStr  = document.getElementById('int-def-b').value.trim();
  const resEl = document.getElementById('int-def-res');

  if(!fxStr||!aStr||!bStr){ resEl.innerHTML=`<div class="calc-err">Completa todos los campos</div>`; return; }

  const fn = calcParse(fxStr);
  if(!fn){ resEl.innerHTML=`<div class="calc-err">Expresión inválida.</div>`; return; }

  const a=parseFloat(aStr), b=parseFloat(bStr);
  if(isNaN(a)||isNaN(b)){ resEl.innerHTML=`<div class="calc-err">Límites inválidos</div>`; return; }

  const steps = [`Calcular: ∫₍${aStr}₎^₍${bStr}₎ ${fxStr} dx`];
  steps.push(`Método: Regla de Simpson 1/3 (n=1000 subdivisiones)`);

  const n=1000, h=(b-a)/n;
  steps.push(`Partición: h = (${bStr}−${aStr})/${n} = ${cFmt(h)}`);

  let s = calcEval(fn,a) + calcEval(fn,b);
  for(let i=1;i<n;i++) s += (i%2===0?2:4)*calcEval(fn,a+i*h);
  const result = s*h/3;

  steps.push(`Aplicar fórmula de Simpson:`);
  steps.push(`∫ ≈ (h/3)·[f(${aStr}) + 4f(x₁) + 2f(x₂) + ... + f(${bStr})]`);
  steps.push(`f(${aStr}) = ${cFmt(calcEval(fn,a))}`);
  steps.push(`f(${bStr}) = ${cFmt(calcEval(fn,b))}`);
  steps.push(`f((${aStr}+${bStr})/2) = ${cFmt(calcEval(fn,(a+b)/2))}`);
  steps.push(`Resultado: ∫₍${aStr}₎^₍${bStr}₎ ${fxStr} dx ≈ ${cFmt(result)}`);

  // Propiedad de linealidad
  if(a!==b) {
    const swapped = numIntegral(fn,b,a);
    steps.push(`Verificación: ∫₍${bStr}₎^₍${aStr}₎ = −∫₍${aStr}₎^₍${bStr}₎ = ${cFmt(swapped)}`);
  }

  resEl.innerHTML = calcResHTML(`∫₍${aStr}₎^₍${bStr}₎ ${fxStr} dx`, steps, cFmt(result));
}

function calcTaylor() {
  const fxStr = document.getElementById('int-taylor-fx').value.trim();
  const aStr  = document.getElementById('int-taylor-a').value.trim();
  const nStr  = document.getElementById('int-taylor-n').value.trim();
  const resEl = document.getElementById('int-taylor-res');

  if(!fxStr){ resEl.innerHTML=`<div class="calc-err">Ingresa f(x)</div>`; return; }

  const fn = calcParse(fxStr);
  if(!fn){ resEl.innerHTML=`<div class="calc-err">Expresión inválida.</div>`; return; }

  const a = parseFloat(aStr)||0;
  const N = Math.min(parseInt(nStr)||5, 8);
  const steps = [`Serie de Taylor de f(x) = ${fxStr} centrada en a = ${cFmt(a)}`];
  steps.push(`f(x) = Σ [f⁽ⁿ⁾(a)/n!] · (x−a)ⁿ`);

  // Calcular coeficientes numéricos
  const h=1e-4;
  const derivs = [calcEval(fn,a)];
  let facs = [1];
  for(let k=1;k<=N;k++){
    derivs.push(numDeriv(fn,a,Math.min(k,3)));
    facs.push(facs[k-1]*k);
  }

  // Para n>3 usamos diferencias finitas de orden superior
  const higherDeriv = (k) => {
    if(k<=3) return numDeriv(fn,a,k);
    // approx via function values
    const H=1e-3;
    let s=0;
    for(let j=0;j<=k;j++){
      const sgn=((k-j)%2===0)?1:-1;
      const binom = facs[k]/(facs[j]*facs[k-j]);
      s += sgn*binom*calcEval(fn,a+j*H);
    }
    return s/(H**k);
  };

  const terms = [];
  steps.push(`\nCoeficientes:`);
  for(let k=0;k<=N;k++){
    const dk = k<=3 ? derivs[k] : higherDeriv(k);
    const coef = dk/facs[k];
    if(Math.abs(coef)>1e-10) {
      const xPart = k===0?'':k===1?`(x−${cFmt(a)})`:`(x−${cFmt(a)})^${k}`;
      const termStr = `${cFmt(coef)}${xPart}`;
      terms.push(termStr);
      steps.push(`  k=${k}: f⁽${k}⁾(${cFmt(a)}) = ${cFmt(dk)} → coef = ${cFmt(dk)}/${facs[k]} = ${cFmt(coef)}`);
    }
  }

  const series = terms.join(' + ').replace(/\+ −/g,'− ');
  steps.push(`\nSerie resultante (${N} términos):`);
  steps.push(`f(x) ≈ ${series}`);

  resEl.innerHTML = calcResHTML(`Taylor de ${fxStr} en a=${cFmt(a)}`, steps, series);
}

// ══════════════════════════════════════
// CÁLCULO MULTIVARIABLE
// ══════════════════════════════════════

function calcPartial() {
  const fxyStr = document.getElementById('mul-par-fxy').value.trim();
  const varName= document.getElementById('mul-par-var').value;
  const ord    = parseInt(document.getElementById('mul-par-ord').value)||1;
  const resEl  = document.getElementById('mul-par-res');

  if(!fxyStr){ resEl.innerHTML=`<div class="calc-err">Ingresa f(x,y)</div>`; return; }

  const fn = calcParse(fxyStr);
  if(!fn){ resEl.innerHTML=`<div class="calc-err">Expresión inválida.</div>`; return; }

  const steps = [`Calcular ∂${ord>1?ord:''}f/∂${varName}${ord>1?ord:''} de f(x,y) = ${fxyStr}`];
  const h = 1e-5;

  const evalPts = [
    {x:0,y:0},{x:1,y:1},{x:1,y:0},{x:0,y:1},{x:-1,y:1}
  ];

  steps.push(`Método: diferenciación numérica con h=${h}`);
  steps.push(`Fórmula: ∂f/∂${varName} ≈ [f(${varName}+h)−f(${varName}−h)] / (2h)`);
  steps.push(`\nValores en puntos de muestra:`);

  evalPts.forEach(({x,y})=>{
    let dv;
    if(ord===1) {
      dv = varName==='x'
        ? (calcEval(fn,x+h,y)-calcEval(fn,x-h,y))/(2*h)
        : (calcEval(fn,x,y+h)-calcEval(fn,x,y-h))/(2*h);
    } else {
      dv = varName==='x'
        ? (calcEval(fn,x+h,y)-2*calcEval(fn,x,y)+calcEval(fn,x-h,y))/(h*h)
        : (calcEval(fn,x,y+h)-2*calcEval(fn,x,y)+calcEval(fn,x,y-h))/(h*h);
    }
    steps.push(`  ∂${ord>1?ord:''}f/∂${varName}${ord>1?ord:''}(${x},${y}) ≈ ${cFmt(dv)}`);
  });

  resEl.innerHTML = calcResHTML(
    `∂${ord>1?ord:''}f/∂${varName}${ord>1?ord:''} [${fxyStr}]`,
    steps,
    `Ver tabla de valores (evaluación numérica)`,
  );
}

function calcGradient() {
  const fxyStr = document.getElementById('mul-grad-fxy').value.trim();
  const x0Str  = document.getElementById('mul-grad-x0').value.trim();
  const y0Str  = document.getElementById('mul-grad-y0').value.trim();
  const resEl  = document.getElementById('mul-grad-res');

  if(!fxyStr){ resEl.innerHTML=`<div class="calc-err">Ingresa f(x,y)</div>`; return; }

  const fn = calcParse(fxyStr);
  if(!fn){ resEl.innerHTML=`<div class="calc-err">Expresión inválida.</div>`; return; }

  const h=1e-5;
  const steps = [`Calcular ∇f(x,y) = (∂f/∂x, ∂f/∂y) de f(x,y) = ${fxyStr}`];
  steps.push(`El gradiente apunta en la dirección de mayor incremento de f`);

  const evalPts = x0Str!==''&&y0Str!==''
    ? [{x:parseFloat(x0Str),y:parseFloat(y0Str)}]
    : [{x:0,y:0},{x:1,y:1},{x:2,y:0}];

  evalPts.forEach(({x,y})=>{
    const dfx = (calcEval(fn,x+h,y)-calcEval(fn,x-h,y))/(2*h);
    const dfy = (calcEval(fn,x,y+h)-calcEval(fn,x,y-h))/(2*h);
    const mag = Math.sqrt(dfx*dfx+dfy*dfy);
    steps.push(`\n∇f(${cFmt(x)},${cFmt(y)}):`);
    steps.push(`  ∂f/∂x = ${cFmt(dfx)}`);
    steps.push(`  ∂f/∂y = ${cFmt(dfy)}`);
    steps.push(`  |∇f| = √(${cFmt(dfx)}² + ${cFmt(dfy)}²) = ${cFmt(mag)}`);
    if(mag>1e-10) steps.push(`  Dirección unitaria: (${cFmt(dfx/mag)}, ${cFmt(dfy/mag)})`);
  });

  const {x,y} = evalPts[0];
  const dfx = (calcEval(fn,x+h,y)-calcEval(fn,x-h,y))/(2*h);
  const dfy = (calcEval(fn,x,y+h)-calcEval(fn,x,y-h))/(2*h);

  resEl.innerHTML = calcResHTML(`∇f(${x0Str||'x'},${y0Str||'y'})`, steps, `(${cFmt(dfx)}, ${cFmt(dfy)})`);
}

function calcDoubleIntegral() {
  const fxyStr = document.getElementById('mul-dint-fxy').value.trim();
  const x1=parseFloat(document.getElementById('mul-dint-x1').value)||0;
  const x2=parseFloat(document.getElementById('mul-dint-x2').value)||1;
  const y1=parseFloat(document.getElementById('mul-dint-y1').value)||0;
  const y2=parseFloat(document.getElementById('mul-dint-y2').value)||1;
  const resEl=document.getElementById('mul-dint-res');

  if(!fxyStr){ resEl.innerHTML=`<div class="calc-err">Ingresa f(x,y)</div>`; return; }
  const fn=calcParse(fxyStr);
  if(!fn){ resEl.innerHTML=`<div class="calc-err">Expresión inválida.</div>`; return; }

  const steps=[`Calcular ∬ ${fxyStr} dx dy`];
  steps.push(`Región: x ∈ [${x1}, ${x2}], y ∈ [${y1}, ${y2}]`);
  steps.push(`Método: Regla de Simpson 2D (n=50 × 50)`);
  steps.push(`Por el Teorema de Fubini: ∬ = ∫₍${y1}₎^₍${y2}₎ [∫₍${x1}₎^₍${x2}₎ f(x,y) dx] dy`);

  // Simpson 2D
  const nx=50,ny=50;
  const hx=(x2-x1)/nx, hy=(y2-y1)/ny;
  let total=0;
  for(let j=0;j<=ny;j++){
    const y=y1+j*hy;
    const wy = j===0||j===ny?1:j%2===0?2:4;
    for(let i=0;i<=nx;i++){
      const x=x1+i*hx;
      const wx = i===0||i===nx?1:i%2===0?2:4;
      total += wx*wy*calcEval(fn,x,y);
    }
  }
  const result = total*hx*hy/9;

  steps.push(`\nEvaluando integrales interiores:`);
  [y1,(y1+y2)/2,y2].forEach(y=>{
    const inner=numIntegral(x=>calcEval(fn,x,y),x1,x2);
    steps.push(`  y=${cFmt(y)}: ∫f(x,${cFmt(y)})dx ≈ ${cFmt(inner)}`);
  });
  steps.push(`\nResultado final: ∬ ${fxyStr} dx dy ≈ ${cFmt(result)}`);

  resEl.innerHTML=calcResHTML(`∬ ${fxyStr} dx dy`, steps, cFmt(result));
}

// ══════════════════════════════════════
// ECUACIONES DIFERENCIALES
// ══════════════════════════════════════

function calcEDOSep() {
  const rhsStr=document.getElementById('edo-sep-rhs').value.trim();
  const x0=parseFloat(document.getElementById('edo-sep-x0').value)||0;
  const y0=parseFloat(document.getElementById('edo-sep-y0').value)||1;
  const resEl=document.getElementById('edo-sep-res');

  if(!rhsStr){ resEl.innerHTML=`<div class="calc-err">Ingresa dy/dx = f(x,y)</div>`; return; }
  const fn=calcParse(rhsStr);
  if(!fn){ resEl.innerHTML=`<div class="calc-err">Expresión inválida.</div>`; return; }

  const steps=[`Resolver: dy/dx = ${rhsStr}`];
  steps.push(`Condición inicial: y(${x0}) = ${y0}`);
  steps.push(`\nMétodo: Runge-Kutta de 4to orden (RK4)`);
  steps.push(`Intervalo: x ∈ [${x0}, ${x0+5}], paso h = 0.1`);

  const h=0.1, steps_n=50;
  const xs=[x0], ys=[y0];
  let x=x0, y=y0;
  for(let i=0;i<steps_n;i++){
    const k1=h*calcEval(fn,x,y);
    const k2=h*calcEval(fn,x+h/2,y+k1/2);
    const k3=h*calcEval(fn,x+h/2,y+k2/2);
    const k4=h*calcEval(fn,x+h,y+k3);
    y += (k1+2*k2+2*k3+k4)/6;
    x += h;
    xs.push(parseFloat(x.toFixed(4)));
    ys.push(y);
  }

  steps.push(`\nFórmula RK4:`);
  steps.push(`k₁ = h·f(xₙ, yₙ)`);
  steps.push(`k₂ = h·f(xₙ+h/2, yₙ+k₁/2)`);
  steps.push(`k₃ = h·f(xₙ+h/2, yₙ+k₂/2)`);
  steps.push(`k₄ = h·f(xₙ+h, yₙ+k₃)`);
  steps.push(`yₙ₊₁ = yₙ + (k₁+2k₂+2k₃+k₄)/6`);

  steps.push(`\nPrimeros pasos:`);
  for(let i=0;i<Math.min(6,xs.length);i++){
    steps.push(`  y(${cFmt(xs[i])}) ≈ ${cFmt(ys[i])}`);
  }
  steps.push(`  ...`);
  steps.push(`  y(${cFmt(xs[xs.length-1])}) ≈ ${cFmt(ys[ys.length-1])}`);

  resEl.innerHTML=calcResHTML(`dy/dx = ${rhsStr}, y(${x0})=${y0}`, steps,
    `y(${cFmt(x0+5)}) ≈ ${cFmt(ys[ys.length-1])}}`);
}

function calcEDOLinear() {
  const pxStr=document.getElementById('edo-lin-px').value.trim();
  const qxStr=document.getElementById('edo-lin-qx').value.trim();
  const x0=parseFloat(document.getElementById('edo-lin-x0').value)||0;
  const y0=parseFloat(document.getElementById('edo-lin-y0').value)||1;
  const resEl=document.getElementById('edo-lin-res');

  if(!pxStr||!qxStr){ resEl.innerHTML=`<div class="calc-err">Completa P(x) y Q(x)</div>`; return; }
  const pFn=calcParse(pxStr), qFn=calcParse(qxStr);
  if(!pFn||!qFn){ resEl.innerHTML=`<div class="calc-err">Expresión inválida.</div>`; return; }

  const steps=[`Resolver: y' + P(x)y = Q(x)`];
  steps.push(`P(x) = ${pxStr}`);
  steps.push(`Q(x) = ${qxStr}`);
  steps.push(`Condición inicial: y(${x0}) = ${y0}`);
  steps.push(`\nMétodo del factor integrante μ(x) = e^[∫P(x)dx]`);
  steps.push(`Multiplicamos ambos lados por μ(x):`);
  steps.push(`d/dx[μ(x)·y] = μ(x)·Q(x)`);
  steps.push(`y = (1/μ(x))·[∫μ(x)·Q(x)dx + C]`);
  steps.push(`\nSolución numérica via RK4 con f(x,y) = Q(x)−P(x)·y:`);

  // RK4 on y' = Q(x) - P(x)*y
  const dy = calcParse(`(${qxStr})-(${pxStr})*y`);
  if(!dy){ resEl.innerHTML=`<div class="calc-err">No se pudo construir la ecuación.</div>`; return; }

  const h=0.1, nst=50;
  let x=x0, y=y0;
  const pts=[[x,y]];
  for(let i=0;i<nst;i++){
    const k1=h*(calcEval(qFn,x)-calcEval(pFn,x)*y);
    const k2=h*(calcEval(qFn,x+h/2)-calcEval(pFn,x+h/2)*(y+k1/2));
    const k3=h*(calcEval(qFn,x+h/2)-calcEval(pFn,x+h/2)*(y+k2/2));
    const k4=h*(calcEval(qFn,x+h)-calcEval(pFn,x+h)*(y+k3));
    y+=(k1+2*k2+2*k3+k4)/6; x+=h;
    pts.push([parseFloat(x.toFixed(4)),y]);
  }

  steps.push(`Primeros pasos:`);
  pts.slice(0,6).forEach(([xi,yi])=>steps.push(`  y(${cFmt(xi)}) ≈ ${cFmt(yi)}`));
  steps.push(`  ...`);
  const last=pts[pts.length-1];
  steps.push(`  y(${cFmt(last[0])}) ≈ ${cFmt(last[1])}`);

  resEl.innerHTML=calcResHTML(`y' + (${pxStr})y = ${qxStr}`, steps, `y(${cFmt(last[0])}) ≈ ${cFmt(last[1])}`);
}

function calcEDO2nd() {
  const a=parseFloat(document.getElementById('edo-2do-a').value)||1;
  const b=parseFloat(document.getElementById('edo-2do-b').value)||0;
  const c=parseFloat(document.getElementById('edo-2do-c').value)||0;
  const y0=parseFloat(document.getElementById('edo-2do-y0').value)||1;
  const dy0=parseFloat(document.getElementById('edo-2do-dy0').value)||0;
  const resEl=document.getElementById('edo-2do-res');

  const steps=[`Resolver: ${cFmt(a)}y'' + ${cFmt(b)}y' + ${cFmt(c)}y = 0`];
  steps.push(`Condiciones iniciales: y(0) = ${y0}, y'(0) = ${dy0}`);
  steps.push(`\nMétodo: Ecuación característica ar² + br + c = 0`);

  const disc = b*b - 4*a*c;
  steps.push(`Discriminante: Δ = b²−4ac = ${cFmt(b)}²−4·${cFmt(a)}·${cFmt(c)} = ${cFmt(disc)}`);

  let sol='', type='';
  if(disc>1e-9){
    const r1=(-b+Math.sqrt(disc))/(2*a);
    const r2=(-b-Math.sqrt(disc))/(2*a);
    type='Raíces reales distintas';
    steps.push(`${type}: r₁ = ${cFmt(r1)}, r₂ = ${cFmt(r2)}`);
    steps.push(`Solución general: y(x) = C₁·e^(${cFmt(r1)}x) + C₂·e^(${cFmt(r2)}x)`);
    // Apply IC
    // y(0)=C1+C2=y0, y'(0)=r1*C1+r2*C2=dy0
    const det=r1-r2;
    const C1=(dy0-r2*y0)/det;
    const C2=(r1*y0-dy0)/det;
    steps.push(`Aplicar condiciones iniciales:`);
    steps.push(`  C₁+C₂ = ${y0} y r₁C₁+r₂C₂ = ${dy0}`);
    steps.push(`  C₁ = ${cFmt(C1)}, C₂ = ${cFmt(C2)}`);
    sol=`y(x) = ${cFmt(C1)}·e^(${cFmt(r1)}x) + ${cFmt(C2)}·e^(${cFmt(r2)}x)`;
    steps.push(`Solución particular: ${sol}`);
    steps.push(`\nVerificación en puntos:`);
    [0,1,2,3].forEach(x=>{
      const yv=C1*Math.exp(r1*x)+C2*Math.exp(r2*x);
      steps.push(`  y(${x}) ≈ ${cFmt(yv)}`);
    });
  } else if(Math.abs(disc)<1e-9) {
    const r=-b/(2*a);
    type='Raíz real doble';
    steps.push(`${type}: r = ${cFmt(r)}`);
    steps.push(`Solución general: y(x) = (C₁ + C₂x)·e^(${cFmt(r)}x)`);
    const C1=y0;
    const C2=dy0-r*y0;
    steps.push(`C₁ = ${cFmt(C1)}, C₂ = ${cFmt(C2)}`);
    sol=`y(x) = (${cFmt(C1)} + ${cFmt(C2)}x)·e^(${cFmt(r)}x)`;
    steps.push(`Solución particular: ${sol}`);
  } else {
    const alpha=-b/(2*a);
    const beta=Math.sqrt(-disc)/(2*a);
    type='Raíces complejas conjugadas';
    steps.push(`${type}: r = ${cFmt(alpha)} ± ${cFmt(beta)}i`);
    steps.push(`Solución general: y(x) = e^(${cFmt(alpha)}x)·[C₁cos(${cFmt(beta)}x) + C₂sin(${cFmt(beta)}x)]`);
    const C1=y0;
    const C2=(dy0-alpha*y0)/beta;
    steps.push(`C₁ = ${cFmt(C1)}, C₂ = ${cFmt(C2)}`);
    sol=`y(x) = e^(${cFmt(alpha)}x)·[${cFmt(C1)}cos(${cFmt(beta)}x) + ${cFmt(C2)}sin(${cFmt(beta)}x)]`;
    steps.push(`Solución particular: ${sol}`);
    steps.push(`\nVerificación en puntos:`);
    [0,1,2,3].forEach(x=>{
      const yv=Math.exp(alpha*x)*(C1*Math.cos(beta*x)+C2*Math.sin(beta*x));
      steps.push(`  y(${x}) ≈ ${cFmt(yv)}`);
    });
  }

  // build plot points for 2nd order solution
  const _edo2pts=[];
  for(let _xi=0;_xi<=30;_xi++){
    const _x=_xi*0.2;
    let _yv=NaN;
    const _disc=b*b-4*a*c;
    if(_disc>1e-9){
      const _r1=(-b+Math.sqrt(_disc))/(2*a),_r2=(-b-Math.sqrt(_disc))/(2*a);
      const _det=_r1-_r2,_C1=(dy0-_r2*y0)/_det,_C2=(_r1*y0-dy0)/_det;
      _yv=_C1*Math.exp(_r1*_x)+_C2*Math.exp(_r2*_x);
    } else if(Math.abs(_disc)<1e-9){
      const _r=-b/(2*a),_C1=y0,_C2=dy0-_r*y0;
      _yv=(_C1+_C2*_x)*Math.exp(_r*_x);
    } else {
      const _al=-b/(2*a),_be=Math.sqrt(-_disc)/(2*a);
      const _C1=y0,_C2=(dy0-_al*y0)/_be;
      _yv=Math.exp(_al*_x)*(_C1*Math.cos(_be*_x)+_C2*Math.sin(_be*_x));
    }
    if(isFinite(_yv)) _edo2pts.push([_x,_yv]);
  }
  resEl.innerHTML=calcResHTML(`${cFmt(a)}y''+${cFmt(b)}y'+${cFmt(c)}y=0`, steps, sol, {type:'ode',pts:_edo2pts,xMin:0,xMax:6});
}

// ── HTML renderer para resultados ──
function calcResHTML(expr, steps, result) {
  return `<div class="calc-res">
    <div class="calc-res-expr">${expr}</div>
    <div class="calc-res-lbl">Paso a paso:</div>
    ${steps.map(s=>`<div class="calc-step">${s.startsWith('  ')?s:('<b>›</b> '+s)}</div>`).join('')}
    <div class="calc-res-lbl" style="margin-top:10px">Resultado:</div>
    <div class="calc-res-val">${result}</div>
  </div>`;
}


// ── Init al abrir módulo ──
function calcInit() {
  calcInitKBs();
  calcTab('dif');
}

// ═══════════════════════════════════════════════════════
// GRAFICACIÓN MODULE
// ═══════════════════════════════════════════════════════

let grafType = 'lin';

// Definición de cada tipo: coeficientes, fórmula, evaluador, pasos
const GRAF_TYPES = {
  lin: {
    title: 'Coeficientes — Lineal',
    coefs: [
      { id:'gm', label:'m =', placeholder:'1', default:'1' },
      { id:'gb', label:'b =', placeholder:'0', default:'0' },
    ],
    preview: (v) => {
      const m=v.gm, b=v.gb;
      const mStr = m==='1'?'':m==='-1'?'-':m;
      const bPart = parseFloat(b)===0?'':(parseFloat(b)>0?` + ${b}`:` - ${Math.abs(parseFloat(b))}`);
      return `y = ${mStr}x${bPart}` || 'y = x';
    },
    eval: (x,v) => grafParseCoef(v.gm)*x + grafParseCoef(v.gb),
    steps: (x,v,y) => {
      const m=grafParseCoef(v.gm), b=grafParseCoef(v.gb);
      return [
        `<span class="gs-op">y = m·x + b</span>`,
        `<span class="gs-op">y = ${m}·(<span class="gs-x">${x}</span>) + ${b}</span>`,
        `<span class="gs-op">y = ${m*x} + ${b}</span>`,
        `<span class="gs-y">y = ${y}</span>`,
      ];
    },
  },
  quad: {
    title: 'Coeficientes — Cuadrática',
    coefs: [
      { id:'ga', label:'a =', placeholder:'1', default:'1' },
      { id:'gb', label:'b =', placeholder:'0', default:'0' },
      { id:'gc', label:'c =', placeholder:'0', default:'0' },
    ],
    preview: (v) => {
      const a=v.ga, b=v.gb, c=v.gc;
      const bPart = parseFloat(b)===0?'':(parseFloat(b)>0?` + ${b}x`:` - ${Math.abs(parseFloat(b))}x`);
      const cPart = parseFloat(c)===0?'':(parseFloat(c)>0?` + ${c}`:` - ${Math.abs(parseFloat(c))}`);
      return `y = ${a}x²${bPart}${cPart}`;
    },
    eval: (x,v) => grafParseCoef(v.ga)*x*x + grafParseCoef(v.gb)*x + grafParseCoef(v.gc),
    steps: (x,v,y) => {
      const a=grafParseCoef(v.ga), b=grafParseCoef(v.gb), c=grafParseCoef(v.gc);
      return [
        `<span class="gs-op">y = a·x² + b·x + c</span>`,
        `<span class="gs-op">y = ${a}·(<span class="gs-x">${x}</span>)² + ${b}·(<span class="gs-x">${x}</span>) + ${c}</span>`,
        `<span class="gs-op">y = ${a}·${x*x} + ${b*x} + ${c}</span>`,
        `<span class="gs-op">y = ${a*x*x} + ${b*x} + ${c}</span>`,
        `<span class="gs-y">y = ${y}</span>`,
      ];
    },
  },
  abs: {
    title: 'Coeficientes — Valor Absoluto',
    coefs: [
      { id:'ga', label:'a =', placeholder:'1', default:'1' },
      { id:'gh', label:'h =', placeholder:'0', default:'0' },
      { id:'gk', label:'k =', placeholder:'0', default:'0' },
    ],
    preview: (v) => {
      const a=v.ga, h=grafParseCoef(v.gh), k=grafParseCoef(v.gk);
      const hPart = h===0?'x':(h>0?`x + ${h}`:`x - ${Math.abs(h)}`);
      const kPart = k===0?'':(k>0?` + ${k}`:` - ${Math.abs(k)}`);
      return `y = ${a}|${hPart}|${kPart}`;
    },
    eval: (x,v) => grafParseCoef(v.ga)*Math.abs(x + grafParseCoef(v.gh)) + grafParseCoef(v.gk),
    steps: (x,v,y) => {
      const a=grafParseCoef(v.ga), h=grafParseCoef(v.gh), k=grafParseCoef(v.gk);
      const inner = x+h;
      return [
        `<span class="gs-op">y = a·|x + h| + k</span>`,
        `<span class="gs-op">y = ${a}·|(<span class="gs-x">${x}</span>) + ${h}| + ${k}</span>`,
        `<span class="gs-op">y = ${a}·|${inner}| + ${k}</span>`,
        `<span class="gs-op">y = ${a}·${Math.abs(inner)} + ${k}</span>`,
        `<span class="gs-y">y = ${y}</span>`,
      ];
    },
  },
  exp: {
    title: 'Coeficientes — Exponencial',
    coefs: [
      { id:'ga', label:'a =', placeholder:'1', default:'1' },
      { id:'gbas', label:'b =', placeholder:'2', default:'2' },
    ],
    preview: (v) => `y = ${v.ga}·${v.gbas}ˣ`,
    eval: (x,v) => grafParseCoef(v.ga)*Math.pow(grafParseCoef(v.gbas), x),
    steps: (x,v,y) => {
      const a=grafParseCoef(v.ga), b=grafParseCoef(v.gbas);
      return [
        `<span class="gs-op">y = a · bˣ</span>`,
        `<span class="gs-op">y = ${a} · ${b}<span class="gs-x">^${x}</span></span>`,
        `<span class="gs-op">y = ${a} · ${Math.pow(b,x).toFixed(4)}</span>`,
        `<span class="gs-y">y = ${y}</span>`,
      ];
    },
  },
};

function grafSetType(type) {
  grafType = type;
  document.querySelectorAll('.graf-type-card').forEach(c => c.classList.remove('sel'));
  document.getElementById('gtype-'+type).classList.add('sel');
  grafInitFields();
}

function grafInitFields() {
  const def = GRAF_TYPES[grafType];
  if(!def) return;
  document.getElementById('graf-inputs-title').textContent = def.title;
  const wrap = document.getElementById('graf-coef-fields');
  wrap.innerHTML = def.coefs.map(c => `
    <div class="graf-coef-row">
      <label>${c.label}</label>
      <input class="graf-coef" id="${c.id}" placeholder="${c.placeholder}" value="${c.default}" oninput="grafPreview()"/>
    </div>`).join('');
  grafPreview();
}

// Parsea un coeficiente admitiendo: números, e, π, pi, expresiones simples
function grafParseCoef(str) {
  if(!str || str.trim()==='') return NaN;
  let s = str.trim()
    .replace(/π/g, String(Math.PI))
    .replace(/\bpi\b/gi, String(Math.PI))
    .replace(/\be\b/g, String(Math.E))
    .replace(/\^/g, '**');
  try {
    const v = Function('"use strict"; return (' + s + ')')();
    return isFinite(v) ? v : NaN;
  } catch(e) { return NaN; }
}

function grafGetVals() {
  const def = GRAF_TYPES[grafType];
  const v = {};
  def.coefs.forEach(c => {
    const el = document.getElementById(c.id);
    v[c.id] = el ? (el.value.trim()||c.default) : c.default;
  });
  return v;
}

function grafPreview() {
  const def = GRAF_TYPES[grafType];
  if(!def) return;
  try {
    const v = grafGetVals();
    document.getElementById('graf-formula-preview').textContent = def.preview(v);
  } catch(e) {}
}

function grafFmt(n) {
  if(!isFinite(n)) return '—';
  const r = Math.round(n*10000)/10000;
  return r % 1 === 0 ? r.toString() : parseFloat(r.toFixed(4)).toString();
}

function grafDraw() {
  const def = GRAF_TYPES[grafType];
  if(!def) return;
  const v   = grafGetVals();
  const N   = parseInt(document.getElementById('graf-pts-n').value)||3;
  const fn  = (x) => def.eval(x, v);

  // Generar puntos: -N ... 0 ... +N (enteros)
  const xs = [];
  for(let i=-N; i<=N; i++) xs.push(i);
  const pts = xs.map(x => ({ x, y: fn(x) }));

  // Calcular rango del canvas con padding
  const ys = pts.map(p=>p.y).filter(isFinite);
  const xMin = -N-1, xMax = N+1;
  let yMin = Math.min(...ys, 0)-1;
  let yMax = Math.max(...ys, 0)+1;
  // padding visual
  const yPad = (yMax-yMin)*0.15;
  yMin -= yPad; yMax += yPad;

  // Mostrar canvas
  const wrap = document.getElementById('graf-canvas-wrap');
  wrap.style.display = 'block';

  const cv = document.getElementById('graf-cv');
  const dpr = window.devicePixelRatio||1;
  const W = cv.offsetWidth||300;
  const H = 300;
  cv.width  = W*dpr;
  cv.height = H*dpr;
  const ctx = cv.getContext('2d');
  ctx.scale(dpr, dpr);

  const toX = wx => (wx-xMin)/(xMax-xMin)*W;
  const toY = wy => (1-(wy-yMin)/(yMax-yMin))*H;

  // ── Fondo blanco como la referencia ──
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0,0,W,H);

  // ── Grid fino ──
  ctx.strokeStyle = '#e0e8f0';
  ctx.lineWidth = 0.5;
  // verticales cada 1 unidad
  for(let x=Math.ceil(xMin); x<=xMax; x++) {
    const px=toX(x);
    ctx.beginPath(); ctx.moveTo(px,0); ctx.lineTo(px,H); ctx.stroke();
  }
  // horizontales cada unidad entera
  const yStep = grafGridStep(yMax-yMin, 7);
  const y0g = Math.ceil(yMin/yStep)*yStep;
  for(let y=y0g; y<=yMax; y+=yStep) {
    const py=toY(y);
    ctx.beginPath(); ctx.moveTo(0,py); ctx.lineTo(W,py); ctx.stroke();
  }

  // ── Ejes en negro ──
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;
  // eje X
  const axisY = toY(0);
  ctx.beginPath(); ctx.moveTo(0,axisY); ctx.lineTo(W,axisY); ctx.stroke();
  // eje Y
  const axisX = toX(0);
  ctx.beginPath(); ctx.moveTo(axisX,0); ctx.lineTo(axisX,H); ctx.stroke();

  // ── Flechas en los ejes ──
  const arr = 7;
  ctx.fillStyle = '#000000';
  // flecha derecha eje X
  ctx.beginPath(); ctx.moveTo(W,axisY); ctx.lineTo(W-arr,axisY-arr/2); ctx.lineTo(W-arr,axisY+arr/2); ctx.closePath(); ctx.fill();
  // flecha arriba eje Y
  ctx.beginPath(); ctx.moveTo(axisX,0); ctx.lineTo(axisX-arr/2,arr); ctx.lineTo(axisX+arr/2,arr); ctx.closePath(); ctx.fill();

  // ── Marcas y números en los ejes ──
  ctx.fillStyle = '#333333';
  ctx.font = `${10}px Space Mono, monospace`;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  // eje X: números
  for(let x=Math.ceil(xMin); x<=Math.floor(xMax); x++) {
    if(x===0) continue;
    const px=toX(x);
    ctx.beginPath(); ctx.moveTo(px, axisY-3); ctx.lineTo(px, axisY+3); ctx.stroke();
    ctx.textAlign='center';
    ctx.fillText(x, px, axisY+(axisY<H-20?16:-8));
  }
  // eje Y: números
  for(let y=y0g; y<=yMax; y+=yStep) {
    if(Math.abs(y)<yStep*0.01) continue;
    const py=toY(y);
    ctx.beginPath(); ctx.moveTo(axisX-3,py); ctx.lineTo(axisX+3,py); ctx.stroke();
    ctx.textAlign='right';
    ctx.fillText(grafFmt(y), axisX-6, py+3);
  }
  // origen
  ctx.textAlign='right';
  ctx.fillText('0', axisX-5, axisY+12);

  // ── Curva continua ──
  const STEPS = W*2;
  ctx.strokeStyle = '#2563eb';  // azul como la referencia
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  let penDown = false;
  let prevPy = null;
  for(let i=0; i<=STEPS; i++) {
    const wx = xMin + (xMax-xMin)*i/STEPS;
    const wy = fn(wx);
    if(!isFinite(wy)) { penDown=false; prevPy=null; continue; }
    const px=toX(wx), py=toY(wy);
    // discontinuidad (tan, etc.)
    if(prevPy!==null && Math.abs(py-prevPy)>H*1.2) { penDown=false; }
    if(!penDown) { ctx.moveTo(px,py); penDown=true; }
    else ctx.lineTo(px,py);
    prevPy=py;
  }
  ctx.stroke();

  // ── Puntos rojos ──
  pts.forEach(({x,y}) => {
    if(!isFinite(y)) return;
    const px=toX(x), py=toY(y);
    if(py<-10||py>H+10) return;
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
  });

  // ── Tabla de valores (overlay) ──
  const tableEl = document.getElementById('graf-table');
  tableEl.innerHTML = `<table>
    <tr><th>x</th><th>y</th></tr>
    ${pts.map(({x,y})=>`
      <tr class="${x===0?'zero-row':''}">
        <td>${x}</td>
        <td>${grafFmt(y)}</td>
      </tr>`).join('')}
  </table>`;

  // ── Pasos de cálculo ──
  const stepsWrap = document.getElementById('graf-steps-wrap');
  const stepsEl   = document.getElementById('graf-steps');
  stepsWrap.style.display = 'block';
  stepsEl.innerHTML = pts.map(({x,y}) => {
    if(!isFinite(y)) return '';
    const lines = def.steps(x, v, grafFmt(y));
    return `<div class="graf-step-block">
      <div style="color:#f0c040;font-weight:700;margin-bottom:4px">x = ${x}</div>
      ${lines.map(l=>`<div>${l}</div>`).join('')}
    </div>`;
  }).join('');
}

function grafClear() {
  document.getElementById('graf-canvas-wrap').style.display='none';
  document.getElementById('graf-steps-wrap').style.display='none';
  document.getElementById('graf-steps').innerHTML='';
  document.getElementById('graf-table').innerHTML='';
  // reset coefs a defaults
  grafInitFields();
}

function grafUpdate() {
  // si ya hay una gráfica visible, redibujar con los nuevos parámetros
  if(document.getElementById('graf-canvas-wrap').style.display!=='none') {
    grafDraw();
  }
}

function grafGridStep(range, targetDivs) {
  const raw = range/targetDivs;
  const mag = Math.pow(10, Math.floor(Math.log10(Math.max(raw,1e-10))));
  const norm = raw/mag;
  let step;
  if(norm<1.5) step=1;
  else if(norm<3.5) step=2;
  else if(norm<7.5) step=5;
  else step=10;
  return step*mag;
}
