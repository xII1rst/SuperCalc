let deferredPrompt=null;
function showUpdateBanner(){
  if(document.getElementById('update-banner')) return;
  const banner=document.createElement('div');
  banner.id='update-banner';
  banner.style.cssText='position:fixed;bottom:0;left:0;right:0;background:var(--surface);border-top:2px solid var(--al2);padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px;z-index:9999;font-family:Space Grotesk,sans-serif;color:var(--text);font-size:13px';
  banner.innerHTML='<span>Hay una versión nueva de SuperCalc disponible.</span><button type="button" data-action="reloadApp" style="padding:7px 16px;background:var(--al2);color:var(--on-accent);border:none;border-radius:8px;font-weight:700;cursor:pointer">Actualizar</button>';
  document.body.appendChild(banner);
}
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('./sw.js', {scope: './'}).then(reg => {
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      nw.addEventListener('statechange', () => {
        if(nw.state === 'installed' && navigator.serviceWorker.controller) showUpdateBanner();
      });
    });
  }).catch(() => {});
}


window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault(); deferredPrompt=e; showInstallBanner();
});
window.addEventListener('appinstalled',()=>{const b=document.getElementById('install-banner');if(b)b.remove();});

function showInstallBanner(){
  if(document.getElementById('install-banner'))return;
  const b=document.createElement('div');
  b.id='install-banner';
  b.style.cssText='position:fixed;bottom:0;left:0;right:0;background:var(--surface);border-top:2px solid var(--gold);padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px;z-index:9999;font-family:Space Grotesk,sans-serif;box-shadow:0 -4px 20px var(--panel-shadow)';
  b.innerHTML='<div style="font-size:13px;color:var(--text);font-weight:600">📲 Añadir <span style="color:var(--al2)">SuperCalc</span> a inicio</div><div style="display:flex;gap:8px"><button data-action="installApp" style="padding:7px 16px;background:var(--gold);color:var(--on-accent);border:none;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer">Instalar</button><button data-action="dismissInstall" style="padding:7px 12px;background:none;border:1px solid var(--border);color:var(--text2);border-radius:8px;font-size:12px;cursor:pointer">Ahora no</button></div>';
  document.body.appendChild(b);
}
function installApp(){if(!deferredPrompt)return;deferredPrompt.prompt();deferredPrompt.userChoice.then(()=>{
  deferredPrompt=null;dismissInstall();});
}
function dismissInstall(){const b=document.getElementById('install-banner');if(b)b.remove();}
function reloadApp(){location.reload();}

// ── PWA MANIFEST (SuperCalc branding) ──────────────
(()=>{
  const sz=512, cv2=document.createElement('canvas');
  cv2.width=sz; cv2.height=sz;
  const cx=cv2.getContext('2d');

  // Fondo redondeado
  const g=cx.createLinearGradient(0,0,sz,sz);
  g.addColorStop(0,'#0a0818'); g.addColorStop(1,'#150d38');
  cx.fillStyle=g;
  if(cx.roundRect){cx.beginPath();cx.roundRect(0,0,sz,sz,sz*.2);cx.fill();}
  else{cx.fillRect(0,0,sz,sz);}

  // Grid cartesiano tenue
  cx.strokeStyle='rgba(124,106,247,0.10)'; cx.lineWidth=1.5;
  const step=sz/10;
  for(let i=1;i<10;i++){
    cx.beginPath();cx.moveTo(i*step,0);cx.lineTo(i*step,sz);cx.stroke();
    cx.beginPath();cx.moveTo(0,i*step);cx.lineTo(sz,i*step);cx.stroke();
  }

  const cx0=sz*.5, cy0=sz*.48, rx=sz*.36, ry=sz*.11;

  function drawOrbit(deg,color){
    cx.save(); cx.translate(cx0,cy0); cx.rotate(deg*Math.PI/180);
    cx.beginPath(); cx.ellipse(0,0,rx,ry,0,0,Math.PI*2);
    cx.strokeStyle=color; cx.lineWidth=3; cx.setLineDash([14,8]);
    cx.globalAlpha=0.7; cx.stroke(); cx.setLineDash([]); cx.globalAlpha=1;
    cx.restore();
  }

  function drawElectron(orbitAngle, posAngle, sym, border, fill, fs){
    const r1=posAngle*Math.PI/180, r2=orbitAngle*Math.PI/180;
    const lx=rx*Math.cos(r1), ly=ry*Math.sin(r1);
    const x=cx0+lx*Math.cos(r2)-ly*Math.sin(r2);
    const y=cy0+lx*Math.sin(r2)+ly*Math.cos(r2);
    const er=sz*.075;
    cx.beginPath();cx.arc(x,y,er,0,Math.PI*2);
    cx.fillStyle='#080c14';cx.fill();
    cx.strokeStyle=border;cx.lineWidth=3.5;cx.stroke();
    cx.font=`700 ${fs}px Georgia,serif`;
    cx.textAlign='center';cx.textBaseline='middle';
    cx.fillStyle=fill;cx.shadowColor=border;cx.shadowBlur=12;
    cx.fillText(sym,x,y+2); cx.shadowBlur=0;
  }

  drawOrbit(0,  '#7c6af7');
  drawOrbit(60, '#22d3ee');
  drawOrbit(-60,'#f0c040');

  // Halo
  const halo=cx.createRadialGradient(cx0,cy0,0,cx0,cy0,sz*.18);
  halo.addColorStop(0,'rgba(124,106,247,0.25)');
  halo.addColorStop(1,'rgba(124,106,247,0)');
  cx.fillStyle=halo; cx.beginPath();cx.arc(cx0,cy0,sz*.18,0,Math.PI*2);cx.fill();

  // Ω
  const og=cx.createLinearGradient(cx0-sz*.15,cy0-sz*.12,cx0+sz*.15,cy0+sz*.12);
  og.addColorStop(0,'#ede9fe'); og.addColorStop(0.4,'#a594ff'); og.addColorStop(1,'#5b45d4');
  cx.font=`700 ${Math.round(sz*.38)}px Georgia,serif`;
  cx.textAlign='center'; cx.textBaseline='middle';
  cx.fillStyle=og; cx.shadowColor='#7c6af7'; cx.shadowBlur=50;
  cx.fillText('Ω',cx0,cy0+sz*.04); cx.shadowBlur=0;

  // Electrones: ∑ violeta, π cian (más pequeño), ∂ dorado
  drawElectron(0,   0,  '∑','#7c6af7','#a594ff', Math.round(sz*.09));
  drawElectron(60,  0,  'π','#22d3ee','#67e8f9', Math.round(sz*.072));
  drawElectron(-60, 0,  '∂','#f0c040','#f0c040', Math.round(sz*.09));

  const icon=cv2.toDataURL('image/png');
  const m={name:'SuperCalc',short_name:'SuperCalc',start_url:location.pathname,
    display:'standalone',background_color:'#080c14',theme_color:'#7c6af7',
    icons:[{src:icon,sizes:'192x192',type:'image/png'},{src:icon,sizes:'512x512',type:'image/png'}]};
  const b=new Blob([JSON.stringify(m)],{type:'application/manifest+json'});
  const l=document.createElement('link');l.rel='manifest';l.href=URL.createObjectURL(b);
  document.head.appendChild(l);
})();

export { installApp, dismissInstall, reloadApp };
