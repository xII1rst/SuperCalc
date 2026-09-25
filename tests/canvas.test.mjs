import test from 'node:test';
import assert from 'node:assert/strict';
import { createVectorCanvas } from '../js/graphics/vector-canvas.mjs';
import { createEmCanvas } from '../js/graphics/em-canvas.mjs';

function fakeCanvas(){
  const calls={arc:0};
  const ctx=new Proxy({}, {get(_target,key){
    if(key==='createRadialGradient') return ()=>({addColorStop(){}});
    if(key==='arc') return ()=>{calls.arc++;};
    return ()=>{};
  }});
  return {canvas:{width:640,height:480,getContext:()=>ctx},calls};
}

test('canvas vectorial dibuja en R³ y R² con estado externo',()=>{
  const {canvas,calls}=fakeCanvas();
  let reads=0, mode=3;
  const {draw}=createVectorCanvas(canvas,()=>{
    reads++;
    return {vecs:[{vx:1,vy:2,vz:3,on:true,nm:'A',cl:'#fff'}],mode,rV:null,sR:null,scl:1,showFigure:false,rotX:22,rotY:-38};
  });
  draw();
  assert.equal(reads,1);
  assert.ok(calls.arc>100);
  mode=2;
  draw();
  assert.equal(reads,2);
});

test('canvas electromagnético dibuja cargas y vectores',()=>{
  const {canvas,calls}=fakeCanvas();
  let reads=0;
  const {draw}=createEmCanvas(canvas,()=>{
    reads++;
    return {emScl:1,emRotX:25,emRotY:-35,emObjects:[
      {type:'charge',x:1,y:0,z:0,q:1,label:'q'},
      {type:'vector',ox:0,oy:0,oz:0,vx:1,vy:2,vz:0,label:'F'},
    ]};
  });
  draw();
  assert.equal(reads,1);
  assert.ok(calls.arc>0);
});

test('ambos canvas vuelven a leer los colores al repintar',()=>{
  const previous={document:globalThis.document,getComputedStyle:globalThis.getComputedStyle};
  const theme={name:'dark'};
  const stops=[];
  const ctx=new Proxy({}, {get(_target,key){
    if(key==='createRadialGradient') return ()=>({addColorStop(_position,value){stops.push(value);}});
    return ()=>{};
  }});
  globalThis.document={documentElement:{}};
  globalThis.getComputedStyle=()=>({getPropertyValue:name=>({
    '--canvas-bg0':theme.name==='dark'?'#0d1628':'#fdeef3',
    '--canvas-bg1':theme.name==='dark'?'#060a10':'#fff5f8',
  })[name]||'#123456'});
  try {
    const canvas={width:320,height:240,getContext:()=>ctx};
    const vector=createVectorCanvas(canvas,()=>({vecs:[],mode:2,rV:null,sR:null,scl:1,showFigure:false,rotX:0,rotY:0}));
    const em=createEmCanvas(canvas,()=>({emScl:1,emRotX:0,emRotY:0,emObjects:[]}));
    vector.draw(); em.draw();
    assert.deepEqual(stops.slice(0,4),['#0d1628','#060a10','#0d1628','#060a10']);
    theme.name='light';
    vector.draw(); em.draw();
    assert.deepEqual(stops.slice(4),['#fdeef3','#fff5f8','#fdeef3','#fff5f8']);
  } finally {
    for(const [key,value] of Object.entries(previous)){
      if(value===undefined) delete globalThis[key]; else globalThis[key]=value;
    }
  }
});
