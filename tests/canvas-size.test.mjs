import test from 'node:test';
import assert from 'node:assert/strict';
import { resizeCanvasToContainer, observeContainerSize } from '../js/ui/canvas-size.mjs';

test('ajusta bitmap al contenedor visible y evita tamaños cero',()=>{
  const canvas={width:0,height:0,style:{}};
  let draws=0;
  const container={getBoundingClientRect:()=>({width:100.25,height:50.5})};
  assert.equal(resizeCanvasToContainer(canvas,container,()=>draws++,2),true);
  assert.equal(canvas.width,201);
  assert.equal(canvas.height,101);
  assert.equal(draws,1);
  assert.equal(resizeCanvasToContainer(canvas,{clientWidth:0,clientHeight:0},()=>draws++,2),false);
  assert.equal(draws,1);
});

test('ResizeObserver es opcional y observa el contenedor concreto',()=>{
  const container={};
  let observed;
  class Observer{
    constructor(callback){this.callback=callback;}
    observe(target){observed=target;}
  }
  assert.ok(observeContainerSize(container,()=>{},Observer));
  assert.equal(observed,container);
  assert.equal(observeContainerSize(container,()=>{},undefined)===null,typeof globalThis.ResizeObserver!=='function');
});
