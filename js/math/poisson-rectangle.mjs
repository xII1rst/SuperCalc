import {EM_EPS0} from './electromagnetism.mjs';
const finite=(v,label)=>{if(!Number.isFinite(v))throw new RangeError(label+' debe ser finito.');return v;};
export function poissonRectangle({width,height,nx=12,ny=12,rho=0,left,right,bottom,top},{tolerance=1e-8,maxIterations=5000}={}){
 if(![width,height].every(v=>Number.isFinite(v)&&v>0)||![nx,ny].every(v=>Number.isInteger(v)&&v>=4&&v<=48)||typeof rho!=='number'&&!['function'].includes(typeof rho)||![left,right,bottom,top].every(v=>typeof v==='function')||!Number.isFinite(tolerance)||tolerance<=0||!Number.isInteger(maxIterations)||maxIterations<1||maxIterations>10000)throw new RangeError('Rectángulo positivo, mallas 4–48, fronteras como funciones, tolerancia positiva y 1–10000 barridos.');
 const dx=width/nx,dy=height/ny,wx=1/dx**2,wy=1/dy**2,diagonal=2*(wx+wy);finite(diagonal,'Escala de malla');
 const V=Array.from({length:ny+1},()=>Array(nx+1).fill(0)),source=V.map(row=>row.slice()),density=typeof rho==='function'?rho:()=>rho;
 for(let j=0;j<=ny;j++){V[j][0]=finite(left(j*dy),'Frontera izquierda');V[j][nx]=finite(right(j*dy),'Frontera derecha');}
 for(let i=0;i<=nx;i++){
  const b=finite(bottom(i*dx),'Frontera inferior'),t=finite(top(i*dx),'Frontera superior');
  if(i===0||i===nx)for(const[existing,value]of [[V[0][i],b],[V[ny][i],t]])if(Math.abs(existing-value)>1e-10*Math.max(1,Math.abs(existing),Math.abs(value)))throw new RangeError('Las fronteras no coinciden en una esquina.');
  V[0][i]=b;V[ny][i]=t;
 }
 for(let j=1;j<ny;j++)for(let i=1;i<nx;i++){source[j][i]=finite(density(i*dx,j*dy)/EM_EPS0,'ρ/ε₀');V[j][i]=(V[j][0]*(nx-i)+V[j][nx]*i)/nx;}
 const omega=2/(1+Math.sin(Math.PI/Math.max(nx,ny))),history=[];let status='max_iterations',residual=Infinity,change=Infinity,iterations=0;
 const residualAt=()=>{let max=0;for(let j=1;j<ny;j++)for(let i=1;i<nx;i++)max=Math.max(max,Math.abs(wx*(V[j][i-1]+V[j][i+1])+wy*(V[j-1][i]+V[j+1][i])-diagonal*V[j][i]+source[j][i]));return finite(max,'Residuo');};
 for(let k=1;k<=maxIterations;k++){
  change=0;for(let j=1;j<ny;j++)for(let i=1;i<nx;i++){
   const target=(wx*(V[j][i-1]+V[j][i+1])+wy*(V[j-1][i]+V[j+1][i])+source[j][i])/diagonal,next=V[j][i]+omega*(target-V[j][i]);finite(next,'Iteración');change=Math.max(change,Math.abs(next-V[j][i]));V[j][i]=next;
  }
  iterations=k;residual=residualAt();if(k<=10||k%25===0||k===maxIterations||change<=tolerance)history.push({iteration:k,change,residual});
  if(change<=tolerance&&residual/diagonal<=tolerance){status='converged';break;}
 }
 const center=V[Math.floor(ny/2)][Math.floor(nx/2)],x=width*Math.floor(nx/2)/nx,y=height*Math.floor(ny/2)/ny;
 return {status,grid:V,center,centerPoint:[x,y],width,height,nx,ny,dx,dy,iterations,change,residual,tolerance,omega,history,
  formula:'∇²V=−ρ/ε₀. (Vᵢ₋₁ⱼ−2Vᵢⱼ+Vᵢ₊₁ⱼ)/Δx²+(Vᵢⱼ₋₁−2Vᵢⱼ+Vᵢⱼ₊₁)/Δy²=−ρᵢⱼ/ε₀; SOR hasta cambio y residuo normalizado.',
  assumption:'Dominio rectangular, fronteras de Dirichlet compatibles y permitividad uniforme ε₀. Convergencia del sistema discreto; el residuo no acota por sí solo el error frente a la solución continua.'};
}
