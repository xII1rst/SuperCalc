import test from 'node:test';
import assert from 'node:assert/strict';
import { createFormulaBackground } from '../js/graphics/formula-background.mjs';

test('parallax de tres capas responde a tema, movimiento reducido y visibilidad',()=>{
  const draws=[];
  const ctx={
    clearRect(){},save(){},restore(){},rotate(){},
    translate(x,y){this.x=x;this.y=y;},
    fillText(){draws.push({x:this.x,y:this.y,color:this.fillStyle,font:this.font});},
  };
  const canvas={width:0,height:0,getContext:()=>ctx};
  const windowEvents=new Map(), documentEvents=new Map(), motionEvents=new Map();
  const frames=[];
  let theme='dark', reduced=false;
  const win={
    innerWidth:700,innerHeight:500,
    requestAnimationFrame(callback){frames.push(callback);return frames.length;},
    cancelAnimationFrame(){},
    setTimeout(callback){callback();return 1;},clearTimeout(){},
    addEventListener:(type,callback)=>windowEvents.set(type,callback),
    removeEventListener:type=>windowEvents.delete(type),
    matchMedia:()=>({get matches(){return reduced;},addEventListener:(type,callback)=>motionEvents.set(type,callback),removeEventListener:type=>motionEvents.delete(type)}),
  };
  const doc={hidden:false,addEventListener:(type,callback)=>documentEvents.set(type,callback),removeEventListener:type=>documentEvents.delete(type)};
  const readPalette=()=>name=>name==='formula-opacity'?(theme==='light'?'3':'1'):(theme==='light'?'216,56,112':'124,106,247');
  const bg=createFormulaBackground(canvas,{win,doc,random:()=>.125,readPalette});
  bg.start();
  assert.equal(canvas.width,700);
  assert.equal(canvas.height,500);
  frames.shift()(16);
  const first=draws.slice();
  assert.ok(first.length>30);
  assert.equal(new Set(first.map(item=>item.font)).size,3);
  assert.match(first[0].color,/rgba\(124,106,247,/);
  frames.shift()(32);
  assert.notEqual(draws[first.length].x,first[0].x);
  theme='light';
  documentEvents.get('supercalc:themechange')();
  frames.shift()(48);
  assert.match(draws.at(-1).color,/rgba\(216,56,112,/);
  reduced=true;
  motionEvents.get('change')();
  const before=draws.length;
  frames.shift()(64);
  frames.shift()(80);
  assert.equal(draws.length,before+first.length);
  doc.hidden=true;
  frames.shift()(96);
  assert.equal(draws.length,before+first.length);
  win.innerWidth=360;win.innerHeight=640;
  windowEvents.get('resize')();
  assert.equal(canvas.width,360);
  assert.equal(canvas.height,640);
  bg.stop();
  assert.equal(windowEvents.size,0);
  assert.equal(documentEvents.size,0);
  assert.equal(motionEvents.size,0);
});
