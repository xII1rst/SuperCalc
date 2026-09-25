import { adaptiveStep } from './axes.mjs';
import { renderFigure } from './figures.mjs';
import { figureState } from '../state/figures.mjs';
import { readCanvasPalette, resolveCanvasColor } from './colors.mjs';

export function createEmCanvas(emCanvas,getState){
const emCtx=emCanvas.getContext('2d');
let emScl,emRotX,emRotY;
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

function draw(){
  const color=readCanvasPalette();
  const state=getState();
  const {emObjects}=state;
  ({emScl,emRotX,emRotY}=state);
  const ctx=emCtx;
  const W=emCanvas.width,H=emCanvas.height,cx=W/2,cy=H/2;
  ctx.clearRect(0,0,W,H);

  // Background
  const bg=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(W,H)*.8);
  bg.addColorStop(0,color('canvas-bg0'));bg.addColorStop(1,color('canvas-bg1'));
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);

  // Reference dots along X axis only
  for(let i=-8;i<=8;i++){
    const isMain=(i%2===0);
    const alpha=isMain?0.35:0.15;
    const r=isMain?1.6:0.7;
    const pp=emP3(i,0,0);
    ctx.globalAlpha=alpha;
    ctx.fillStyle=color('canvas-em-grid');
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
    [[axLen,0,0],[-axLen,0,0],color('red'),'X',[1,0,0]],
    [[0,axLen,0],[0,-axLen,0],color('green'),'Y',[0,1,0]],
    [[0,0,axLen],[0,0,-axLen],color('blue'),'Z',[0,0,1]],
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
      ec.globalAlpha=.6;ec.fillStyle=color('canvas-bg1');ec.fillRect(nx-9,ny-7,18,14);
      ec.globalAlpha=1;ec.fillStyle=col;ec.fillText(String(v),nx,ny);
      const nnx=tn.sx+11,nny=tn.sy+11;
      ec.globalAlpha=.25;ec.fillStyle=color('canvas-bg1');ec.fillRect(nnx-11,nny-7,22,14);
      ec.globalAlpha=.4;ec.fillStyle=col;ec.fillText('-'+String(v),nnx,nny);
    }
    ec.globalAlpha=1;
  });

  // Origin
  const o=emP3(0,0,0);
  ctx.beginPath();ctx.arc(o.sx,o.sy,6,0,Math.PI*2);ctx.fillStyle=color('canvas-origin');ctx.shadowColor=color('canvas-origin');ctx.shadowBlur=14;ctx.fill();ctx.shadowBlur=0;
  ctx.beginPath();ctx.arc(o.sx,o.sy,2.5,0,Math.PI*2);ctx.fillStyle=color('canvas-origin-dot');ctx.fill();

  // Draw EM objects
  emObjects.forEach(obj=>{
    if(obj.type==='vector'){
      const vectorColor=resolveCanvasColor(obj.color,color) || color('blue');
      const o2=emP3(obj.ox||0,obj.oy||0,obj.oz||0);
      const p2=emP3((obj.ox||0)+obj.vx,(obj.oy||0)+obj.vy,(obj.oz||0)+obj.vz);
      emDrawArrow(o2.sx,o2.sy,p2.sx,p2.sy,vectorColor,3);
      ctx.save();ctx.font='bold 12px Space Mono';ctx.fillStyle=vectorColor;
      ctx.shadowColor=vectorColor;ctx.shadowBlur=8;ctx.globalAlpha=.95;
      ctx.textAlign='center';ctx.textBaseline='bottom';
      ctx.fillText(obj.label||'',p2.sx,p2.sy-10);ctx.restore();
    } else if(obj.type==='charge'){
      const pp=emP3(obj.x,obj.y,obj.z);
      const col=obj.q>0?color('red'):color('blue');
      ctx.beginPath();ctx.arc(pp.sx,pp.sy,9,0,Math.PI*2);
      ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=18;ctx.fill();ctx.shadowBlur=0;
      ctx.beginPath();ctx.arc(pp.sx,pp.sy,4,0,Math.PI*2);ctx.fillStyle=color('canvas-charge-core');ctx.fill();
      ctx.font='bold 11px Space Mono';ctx.fillStyle=color('canvas-charge-text');ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(obj.q>0?'+':'−',pp.sx,pp.sy);
      ctx.font='bold 9px Space Mono';ctx.fillStyle=col;ctx.globalAlpha=.9;ctx.textBaseline='top';
      ctx.fillText(obj.label||'q',pp.sx,pp.sy+13);ctx.globalAlpha=1;
    }
  });
  // Figura geométrica EM
  if(figureState.em) renderFigure(emCtx, (x,y,z)=>{ const p=emP3(x,y,z); return {sx:p.sx,sy:p.sy,z2:p.z2}; }, figureState.em);
}

return {draw};
}
