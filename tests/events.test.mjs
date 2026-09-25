import test from 'node:test';
import assert from 'node:assert/strict';
import { bindActions } from '../js/ui/events.mjs';

test('delegación de acciones estáticas y formularios dinámicos sin window',()=>{
  const listeners=new Map(),calls=[];
  const root={addEventListener(type,handler){listeners.set(type,handler);}};
  const actions={
    calcDerivative:(...args)=>calls.push(['calcDerivative',...args]),
    setMode:(...args)=>calls.push(['setMode',...args]),
    matOpsSizeChange:(...args)=>calls.push(['matOpsSizeChange',...args]),
    uV:(...args)=>calls.push(['uV',...args]),
    ineqSymCycle:(...args)=>calls.push(['ineqSymCycle',...args]),
    mathTogSteps:(...args)=>calls.push(['mathTogSteps',...args]),
    kbInsert:(...args)=>calls.push(['kbInsert',...args]),
  };
  bindActions(root,actions);
  const fire=(type,dataset,value='')=>{
    const element={dataset,value,closest:()=>element};
    const event={type,target:element,preventDefault(){}};
    listeners.get(type)(event);
    return {element,event};
  };
  fire('click',{action:'calcDerivative'});
  fire('click',{action:'setMode',arg:'3',argType:'number'});
  fire('change',{action:'matOpsSizeChange',event:'change',id:'2',dimension:'rows'},'4');
  fire('input',{action:'uV',event:'input',id:'7',key:'vx'},'2.5');
  fire('click',{action:'ineqSymCycle',arg:'iq-sym'});
  const toggle=fire('click',{action:'mathTogSteps',arg:'details'});
  const keyboard=fire('pointerdown',{action:'kbInsert',event:'pointerdown',insert:'x^2'});
  fire('click',{action:'uV',event:'input',id:'7',key:'vx'},'9');
  fire('click',{action:'notRegistered'});
  assert.deepEqual(calls.slice(0,5),[
    ['calcDerivative'],['setMode',3],['matOpsSizeChange',2,'rows','4'],
    ['uV',7,'vx','2.5'],['ineqSymCycle','iq-sym',['<','≤','>','≥']],
  ]);
  assert.deepEqual(calls[5],['mathTogSteps','details',toggle.element]);
  assert.deepEqual(calls[6],['kbInsert',keyboard.event,'x^2']);
  assert.equal(calls.length,7);
  let selections=0;
  listeners.get('focusin')({target:{tagName:'INPUT',type:'text',dataset:{},select(){selections++;}}});
  listeners.get('focusin')({target:{tagName:'INPUT',type:'text',dataset:{noSelect:''},select(){selections++;}}});
  assert.equal(selections,1);
});
