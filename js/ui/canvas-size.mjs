// Sincroniza el bitmap HiDPI con el tamaño real del contenedor visible.
export function resizeCanvasToContainer(canvas,container,draw,deviceRatio=1){
  if(!canvas||!container) return false;
  const rect=container.getBoundingClientRect?.()||{
    width:container.clientWidth,height:container.clientHeight,
  };
  if(!rect.width||!rect.height) return false;
  const width=Math.round(rect.width*deviceRatio),height=Math.round(rect.height*deviceRatio);
  if(canvas.width!==width||canvas.height!==height){
    canvas.width=width;canvas.height=height;
    canvas.style.width=rect.width+'px';canvas.style.height=rect.height+'px';
  }
  draw();
  return true;
}

export function observeContainerSize(container,resize,Observer=globalThis.ResizeObserver){
  if(!container||typeof Observer!=='function') return null;
  const observer=new Observer(resize);
  observer.observe(container);
  return observer;
}
