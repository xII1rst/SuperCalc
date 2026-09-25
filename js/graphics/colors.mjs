// Captura un estilo calculado por repintado; no guarda colores entre cambios de tema.
export function readCanvasPalette() {
  const style = typeof getComputedStyle === 'function' && typeof document !== 'undefined'
    ? getComputedStyle(document.documentElement) : null;
  const cache = new Map();
  return name => {
    if (!cache.has(name)) cache.set(name, style?.getPropertyValue(`--${name}`).trim() || 'transparent');
    return cache.get(name);
  };
}

// Los estilos HTML admiten var(); canvas necesita el valor CSS ya resuelto.
export function resolveCanvasColor(value, palette) {
  const token = /^var\(--([\w-]+)\)$/.exec(value || '');
  return token ? palette(token[1]) : value;
}
