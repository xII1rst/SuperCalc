export function toggleSection(el){
  const body=el.nextElementSibling;
  const arrow=el.querySelector('.collapsible-arrow');
  const isOpen=body.style.maxHeight&&body.style.maxHeight!=='0px';
  body.style.maxHeight=isOpen?'0px':(body.scrollHeight+20)+'px';
  if(arrow) arrow.classList.toggle('open',!isOpen);
}
export function mathTogSteps(sid,tog){
  const body=document.getElementById(sid);
  if(!body) return;
  const on=!body.classList.contains('on');
  body.classList.toggle('on',on);
  tog.classList.toggle('on',on);
  tog.querySelector('span:last-child').textContent=on?'ocultar pasos':'ver pasos';
  // Expandir el collapsible-body padre si está colapsado
  const cb=body.closest('.collapsible-body');
  if(cb&&on) cb.style.maxHeight=(cb.scrollHeight+body.scrollHeight+40)+'px';
}
function openAllSections(){
  document.querySelectorAll('.collapsible-body').forEach(b=>{b.style.maxHeight=(b.scrollHeight+20)+'px';});
  document.querySelectorAll('.collapsible-arrow').forEach(a=>a.classList.add('open'));
}
