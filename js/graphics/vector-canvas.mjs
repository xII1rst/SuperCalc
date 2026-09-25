import { renderFigure } from './figures.mjs';
import { adaptiveStep } from './axes.mjs';
import { figureState } from '../state/figures.mjs';
import { readCanvasPalette, resolveCanvasColor } from './colors.mjs';

export function createVectorCanvas(cv,getState){
const ctx=cv.getContext('2d');
let color;
const toRad=d=>d*Math.PI/180;
let rotX,rotY;
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
    ctx.globalAlpha=.6;ctx.fillStyle=color('canvas-bg1');ctx.fillRect(nx-9,ny-7,18,14);
    ctx.globalAlpha=1;ctx.fillStyle=col;ctx.fillText(lbl,nx,ny);
    const nnx=pn.sx+11,nny=pn.sy+11;
    ctx.globalAlpha=.25;ctx.fillStyle=color('canvas-bg1');ctx.fillRect(nnx-11,nny-7,22,14);
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
    ctx.globalAlpha=.6;ctx.fillStyle=color('canvas-bg1');ctx.fillRect(nx-10,ny-8,20,16);
    ctx.globalAlpha=1;ctx.fillStyle=col;ctx.fillText(lbl,nx,ny);
    const nnx=pn.sx+(isX?0:-20), nny=pn.sy+(isX?14:0);
    ctx.globalAlpha=.25;ctx.fillStyle=color('canvas-bg1');ctx.fillRect(nnx-12,nny-8,24,16);
    ctx.globalAlpha=.45;ctx.fillStyle=col;ctx.fillText('-'+lbl,nnx,nny);
  }
  ctx.globalAlpha=1;
}

function draw(){
  color=readCanvasPalette();
  const RC=color('purple'), SC=color('green');
  const state=getState();
  const {vecs,mode,rV,sR,scl,showFigure}=state;
  ({rotX,rotY}=state);
  const W=cv.width,H=cv.height,cx=W/2,cy=H/2;
  const all=[...vecs.filter(v=>v.on)];
  if(rV&&!rV.scalar) all.push(rV);
  if(sR&&!sR.err) all.push({vx:sR.vx,vy:sR.vy,vz:sR.vz||0});
  const mxC=all.reduce((m,v)=>Math.max(m,Math.abs(v.vx),Math.abs(v.vy),Math.abs(v.vz||0)),5);
  const axLen=mxC*1.5, s=Math.min(W,H)/(axLen*2.8)*scl;

  ctx.clearRect(0,0,W,H);
  // Background gradient
  const bg=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(W,H)*.8);
  bg.addColorStop(0,color('canvas-bg0'));bg.addColorStop(1,color('canvas-bg1'));
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
      ctx.fillStyle=`rgba(${color('canvas-grid3-rgb')},${alpha})`;ctx.beginPath();ctx.arc(pp.sx,pp.sy,r,0,Math.PI*2);ctx.fill();
    }
    const o=p3(0,0,0,cx,cy,s);
    ctx.beginPath();ctx.arc(o.sx,o.sy,6,0,Math.PI*2);ctx.fillStyle=color('canvas-origin');ctx.shadowColor=color('canvas-origin');ctx.shadowBlur=14;ctx.fill();ctx.shadowBlur=0;
ctx.beginPath();ctx.arc(o.sx,o.sy,2.5,0,Math.PI*2);ctx.fillStyle=color('canvas-origin-dot');ctx.fill();

    const axes=[
      [[axLen,0,0],[-axLen,0,0],color('red'),'X',[1,0,0]],
      [[0,axLen,0],[0,-axLen,0],color('green'),'Y',[0,1,0]],
      [[0,0,axLen],[0,0,-axLen],color('blue'),'Z',[0,0,1]],
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
        ctx.fillStyle=color('gold');ctx.fill();
        // Outline edges (tip[0]→tip[1]→tip[2]→...→tip[0])
        ctx.globalAlpha=.6;
        ctx.beginPath();
        tips.forEach((pt,i)=>i===0?ctx.moveTo(pt.sx,pt.sy):ctx.lineTo(pt.sx,pt.sy));
        ctx.closePath();
        ctx.strokeStyle=color('gold');ctx.lineWidth=1.8;ctx.setLineDash([]);ctx.stroke();
        // Label each tip
        ctx.globalAlpha=.9;ctx.font='bold 11px Space Mono';ctx.textAlign='center';ctx.textBaseline='bottom';
        active.forEach((v,i)=>{
          const c=resolveCanvasColor(v.cl,color);
          ctx.fillStyle=c;ctx.fillText(v.nm,tips[i].sx,tips[i].sy-6);
        });
        ctx.globalAlpha=1;
      }
    }

    vecs.filter(v=>v.on).forEach(v=>{
      const col=resolveCanvasColor(v.cl,color);
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
    // Figura geométrica 3D
    if(figureState.vector) renderFigure(ctx, (x,y,z)=>{const pp=p3(x,y,z,cx,cy,s);return{sx:pp.sx,sy:pp.sy,z2:pp.z2??(-z)};}, figureState.vector);
  } else {
    // R2 grid — sub dots every 1 unit, main dots every 2 units
    for(let i=-16;i<=16;i++) for(let j=-16;j<=16;j++){
      const isMain=(i%2===0&&j%2===0);
      const pp=p2(i,j,cx,cy,s),d=Math.sqrt(i*i+j*j)/16;
      const alpha=isMain?(0.65-d*0.45):(0.20-d*0.14);
      const r=isMain?1.9:0.85;
      if(alpha<=0.02)continue;
      ctx.fillStyle=`rgba(${color('canvas-grid-rgb')},${alpha})`;ctx.beginPath();ctx.arc(pp.sx,pp.sy,r,0,Math.PI*2);ctx.fill();
    }
    const o=p2(0,0,cx,cy,s);
    ctx.beginPath();ctx.arc(o.sx,o.sy,6,0,Math.PI*2);ctx.fillStyle=color('canvas-origin');ctx.shadowColor=color('canvas-origin');ctx.shadowBlur=14;ctx.fill();ctx.shadowBlur=0;
ctx.beginPath();ctx.arc(o.sx,o.sy,2.5,0,Math.PI*2);ctx.fillStyle=color('canvas-origin-dot');ctx.fill();

    // Axes R2
    [[[axLen,0],[-axLen,0],color('red'),'X',true],[[0,axLen],[0,-axLen],color('green'),'Y',false]].forEach(([pos,neg,col,lbl,isX])=>{
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
        ctx.closePath();ctx.fillStyle=color('gold');ctx.fill();
        ctx.globalAlpha=.6;
        ctx.beginPath();
        tips.forEach((pt,i)=>i===0?ctx.moveTo(pt.sx,pt.sy):ctx.lineTo(pt.sx,pt.sy));
        ctx.closePath();ctx.strokeStyle=color('gold');ctx.lineWidth=1.8;ctx.setLineDash([]);ctx.stroke();
        ctx.globalAlpha=.9;ctx.font='bold 11px Space Mono';ctx.textAlign='center';ctx.textBaseline='bottom';
        active.forEach((v,i)=>{
          const c=resolveCanvasColor(v.cl,color);
          ctx.fillStyle=c;ctx.fillText(v.nm,tips[i].sx,tips[i].sy-6);
        });
        ctx.globalAlpha=1;
      }
    }

    vecs.filter(v=>v.on).forEach(v=>{
      const col=resolveCanvasColor(v.cl,color);
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

return {draw};
}
