// Eventos declarativos para controles estáticos y formularios creados con innerHTML.
// El nombre se busca en una tabla cerrada: no se evalúa código del HTML.
export function bindActions(root,actions,{onKeydown}={}){
  const dispatch=event=>{
    const element=event.target?.closest?.('[data-action]');
    if(!element) return;
    const expected=element.dataset.event||'click';
    // Un clic sin puntero (detail 0) viene del teclado: activa también los controles de pointerdown.
    const keyboardClick=event.type==='click'&&expected==='pointerdown'&&event.detail===0;
    if(expected!==event.type&&!keyboardClick) return;
    const name=element.dataset.action;
    const action=actions[name];
    if(typeof action!=='function') return;
    const data=element.dataset;
    switch(name){
      case 'kbInsert': return action(event,data.insert);
      case 'ineqSymCycle': return action(data.arg,['<','≤','>','≥']);
      case 'matOpsSizeChange': return action(Number(data.id),data.dimension,element.value);
      case 'uV': return action(Number(data.id),data.key,element.value);
      case 'uN': return action(Number(data.id),element.value);
      case 'updUnkVec': return action(Number(data.index),Number(data.component),element.value);
      case 'updUnkName': return action(Number(data.index),element.value);
      case 'setUnkTarget':
      case 'matOpsSetScalar': return action(element.value);
      case 'mathTogSteps': return action(data.arg,element);
      case 'previewCalcExpression': return action(element);
      case 'toggleSection': return action(element);
      default:
        if(Object.hasOwn(data,'arg')) return action(data.argType==='number'?Number(data.arg):data.arg);
        return action();
    }
  };
  for(const type of ['click','change','input','pointerdown']) root.addEventListener(type,dispatch);
  // Controles no nativos (role="button") responden a Enter y Espacio como un botón.
  root.addEventListener('keydown',event=>{
    if(onKeydown?.(event)) return;
    if(event.key!=='Enter'&&event.key!==' ') return;
    const element=event.target;
    if(element?.getAttribute?.('role')!=='button'||!element.dataset?.action) return;
    event.preventDefault();
    element.click();
  });
  root.addEventListener('focusin',event=>{
    const input=event.target;
    if(input?.tagName==='INPUT'&&['number','text'].includes(input.type)&&!Object.hasOwn(input.dataset||{},'noSelect')){
      input.select?.();
    }
  });
  return dispatch;
}
