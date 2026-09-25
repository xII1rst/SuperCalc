import test from 'node:test';
import assert from 'node:assert/strict';
import { showToast } from '../js/ui/toast.mjs';

function fakeNode(){
  const classes=new Set();
  return {
    children:[],parentNode:null,attributes:{},
    classList:{add:name=>classes.add(name),remove:name=>classes.delete(name),contains:name=>classes.has(name)},
    get childElementCount(){return this.children.length;},
    get isConnected(){return Boolean(this.parentNode);},
    appendChild(child){this.children.push(child);child.parentNode=this;},
    remove(){if(!this.parentNode)return;this.parentNode.children=this.parentNode.children.filter(child=>child!==this);this.parentNode=null;},
    setAttribute(name,value){this.attributes[name]=value;},
    addEventListener(){},
  };
}

test('toast no bloqueante usa texto seguro, se apila y se retira',()=>{
  const original={document:globalThis.document,setTimeout:globalThis.setTimeout};
  const body=fakeNode(), timers=[];
  globalThis.document={body,createElement:fakeNode,getElementById:id=>body.children.find(node=>node.id===id)||null};
  globalThis.setTimeout=(callback,delay)=>{timers.push({callback,delay});return timers.length;};
  try {
    const first=showToast('<b>Atención</b>','warn',5);
    const second=showToast('Listo','ok',10);
    assert.equal(body.children.length,1);
    assert.equal(body.children[0].childElementCount,2);
    assert.equal(first.textContent,'<b>Atención</b>');
    assert.equal(first.attributes.role,'alert');
    assert.equal(second.attributes.role,'status');
    assert.ok(first.classList.contains('sc-toast-visible'));
    timers[0].callback();
    assert.equal(first.classList.contains('sc-toast-visible'),false);
    timers.at(-1).callback();
    assert.equal(body.children[0].childElementCount,1);
    timers[1].callback();
    timers.at(-1).callback();
    assert.equal(body.children.length,0);
  } finally {
    globalThis.document=original.document;
    globalThis.setTimeout=original.setTimeout;
  }
});
