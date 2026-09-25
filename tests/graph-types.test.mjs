import test from 'node:test';
import assert from 'node:assert/strict';
import { GRAPH_TYPES, parseGraphValues } from '../js/math/graph-types.mjs';

test('los siete tipos de gráfica tienen evaluador, campos y pasos',()=>{
  assert.deepEqual(Object.keys(GRAPH_TYPES),['lin','quad','abs','exp','raiz','log','racional']);
  for(const def of Object.values(GRAPH_TYPES)){
    const values=Object.fromEntries(def.coefs.map(field=>[field.id,field.default]));
    assert.equal(typeof def.preview(values),'string');
    assert.ok(def.steps(1,values,1).length>=2);
  }
});

test('raíz, logaritmo y racional respetan dominios y asíntotas',()=>{
  assert.deepEqual(parseGraphValues('racional',{ga:'1',gb:'1',gc:'1',gd:'-2'}),
    {ga:1,gb:1,gc:1,gd:-2});
  assert.equal(parseGraphValues('racional',{ga:'x',gb:'1',gc:'1',gd:'-2'}),null);
  assert.equal(GRAPH_TYPES.raiz.eval(4,{ga:'2',gh:'0',gk:'1'}),5);
  assert.ok(Number.isNaN(GRAPH_TYPES.raiz.eval(-1,{ga:'1',gh:'0',gk:'0'})));
  assert.equal(GRAPH_TYPES.log.eval(100,{ga:'1',gbas:'10',gc:'1',gd:'0'}),2);
  assert.ok(Number.isNaN(GRAPH_TYPES.log.eval(1,{ga:'1',gbas:'1',gc:'1',gd:'0'})));
  assert.equal(GRAPH_TYPES.racional.eval(3,{ga:'1',gb:'1',gc:'1',gd:'-2'}),4);
  assert.ok(Number.isNaN(GRAPH_TYPES.racional.eval(2,{ga:'1',gb:'1',gc:'1',gd:'-2'})));
});
