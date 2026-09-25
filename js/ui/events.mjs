// Eventos declarativos para controles estáticos y formularios creados con innerHTML.
// El nombre se busca en una tabla cerrada: no se evalúa código del HTML.
export function bindActions(root,actions){
  const dispatch=event=>{
    const element=event.target?.closest?.('[data-action]');
    if(!element || (element.dataset.event||'click')!==event.type) return;
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
      case 'toggleSection': return action(element);
      default:
        if(Object.hasOwn(data,'arg')) return action(data.argType==='number'?Number(data.arg):data.arg);
        return action();
    }
  };
  for(const type of ['click','change','input','pointerdown']) root.addEventListener(type,dispatch);
  root.addEventListener('focusin',event=>{
    const input=event.target;
    if(input?.tagName==='INPUT'&&['number','text'].includes(input.type)&&!Object.hasOwn(input.dataset||{},'noSelect')){
      input.select?.();
    }
  });
  return dispatch;
}
