import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { applyTheme, initTheme, toggleTheme } from '../js/ui/theme.mjs';
import { readCanvasPalette, resolveCanvasColor } from '../js/graphics/colors.mjs';

const [theme,layout,html,worker]=await Promise.all([
  readFile(new URL('../theme.css',import.meta.url),'utf8'),
  readFile(new URL('../style.css',import.meta.url),'utf8'),
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../sw.js',import.meta.url),'utf8'),
]);
const graphics=await Promise.all([
  'analysis','vector-canvas','em-canvas','graph-canvas','colors','formula-background'
].map(name=>readFile(new URL(`../js/graphics/${name}.mjs`,import.meta.url),'utf8')));

test('la paleta oscura se carga antes de los componentes y está disponible offline',()=>{
  assert.match(html,/<html[^>]+data-theme="dark"/);
  assert.ok(html.indexOf('href="theme.css"')<html.indexOf('href="style.css"'));
  assert.match(worker,/['"]\.\/theme\.css['"]/);
  assert.match(theme,/--bg:\s*#0a0f1a/);
  assert.match(theme,/--al:\s*#7c6af7/);
  assert.match(theme,/--ca:\s*#10b981/);
});

test('todos los tokens usados están definidos y los colores literales residen en theme.css',()=>{
  const definitions=new Set([...(`${theme}\n${layout}`).matchAll(/--([a-zA-Z0-9-]+)\s*:/g)].map(m=>m[1]));
  const references=new Set([...(`${theme}\n${layout}`).matchAll(/var\(--([a-zA-Z0-9-]+)/g)].map(m=>m[1]));
  for(const name of references) assert.ok(definitions.has(name),`Falta el token --${name}`);
  assert.doesNotMatch(layout, /#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d/);
  for(const source of graphics) assert.doesNotMatch(source, /#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d/);
});

test('los tokens referidos por HTML y los módulos existen en la paleta',async()=>{
  const moduleNames=(await readdir(new URL('../js/',import.meta.url),{recursive:true}))
    .filter(name=>name.endsWith('.mjs'));
  const sources=await Promise.all(moduleNames.map(name=>readFile(new URL(`../js/${name}`,import.meta.url),'utf8')));
  const definitions=new Set([...theme.matchAll(/--([\w-]+)\s*:/g),...layout.matchAll(/--([\w-]+)\s*:/g)].map(match=>match[1]));
  const references=new Set([...([html,...sources].join('\n')).matchAll(/var\(--([\w-]+)/g)].map(match=>match[1]));
  for(const name of references) assert.ok(definitions.has(name),`Falta el token --${name}`);
});

test('ambos temas ofrecen los mismos tokens y el logo usa la paleta',()=>{
  const blocks=[...theme.matchAll(/:root(?:\[data-theme="(?:dark|light)"\])?\s*\{([^}]*)\}/g)];
  assert.equal(blocks.length,2);
  const tokens=block=>new Set([...block.matchAll(/--([\w-]+)\s*:/g)].map(match=>match[1]));
  assert.deepEqual(tokens(blocks[0][1]),tokens(blocks[1][1]));
  assert.match(html,/data-action="toggleTheme"/);
  assert.match(html,/localStorage\.getItem\('sc-theme'\)/);
  assert.doesNotMatch(html.slice(html.indexOf('<svg id="sc-omega-logo"'),html.indexOf('</svg>')),/#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d/);
});

test('tema inicial, selector y canvas leen el tema vigente',()=>{
  const original={document:globalThis.document,localStorage:globalThis.localStorage,getComputedStyle:globalThis.getComputedStyle};
  const attrs={};
  const root={dataset:{theme:'dark'}};
  const meta={content:'#0a0f1a'};
  const saved=new Map([['sc-theme','light']]);
  const events=[];
  globalThis.document={documentElement:root,getElementById:()=>({setAttribute:(name,value)=>{attrs[name]=value;}}),querySelector:()=>meta,dispatchEvent:event=>events.push(event.type)};
  globalThis.localStorage={getItem:key=>saved.get(key),setItem:(key,value)=>saved.set(key,value)};
  globalThis.getComputedStyle=()=>({getPropertyValue:name=>name==='--canvas-origin'?(root.dataset.theme==='light'?'#d83870':'#c8d8f0'):''});
  try {
    assert.equal(initTheme(),'light');
    assert.equal(meta.content,'#fffdf7');
    assert.equal(attrs['aria-checked'],'true');
    assert.equal(readCanvasPalette()('canvas-origin'),'#d83870');
    assert.equal(resolveCanvasColor('var(--canvas-origin)',readCanvasPalette()),'#d83870');
    assert.equal(events.length,0);
    assert.equal(toggleTheme(),'dark');
    assert.equal(saved.get('sc-theme'),'dark');
    assert.equal(attrs['aria-checked'],'false');
    assert.equal(meta.content,'#0a0f1a');
    assert.deepEqual(events,['supercalc:themechange']);
    assert.equal(applyTheme('invalid',{persist:false}),'dark');
  } finally {
    for(const [key,value] of Object.entries(original)){
      if(value===undefined) delete globalThis[key]; else globalThis[key]=value;
    }
  }
});
