import test from 'node:test';
import assert from 'node:assert/strict';
import { drawFunctionGraph, drawNumberLine } from '../js/graphics/analysis.mjs';

function mockCanvas(){
  const calls=[];
  const ctx=new Proxy({}, {
    get:(_target,name)=>(...args)=>calls.push({name,args}),
    set:()=>true,
  });
  return {canvas:{offsetWidth:320,getContext:()=>ctx},calls};
}

test('grafica puntos sin consultar el DOM', () => {
  const {canvas,calls}=mockCanvas();
  drawFunctionGraph(canvas,[{x:-1,y:1},{x:0,y:0},{x:1,y:1}]);
  assert.equal(canvas.width,320);
  assert.equal(canvas.height,160);
  assert.ok(calls.some(call=>call.name==='lineTo'));
});

test('dibuja y formatea marcas de una recta numérica', () => {
  const {canvas,calls}=mockCanvas();
  drawNumberLine(canvas,[{val:1.234567,sym:'root',color:'#fff'}]);
  assert.equal(canvas.height,72);
  assert.ok(calls.some(call=>call.name==='fillText'&&call.args[0]==='1.2346'));
});
