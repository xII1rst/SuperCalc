// Enlaces directos: #/padre abre un menú y #/padre/id abre una herramienta.
// Sin DOM: la navegación valida el destino contra su catálogo antes de abrirlo.
const SEGMENT = /^[a-z0-9-]+$/;

export function routeHash(state) {
  if (state?.sc === 'submod' && state.parent) return `#/${state.parent}`;
  if (state?.sc === 'module' && state.id) return `#/${state.parent || '-'}/${state.id}`;
  return '';
}

export function parseRoute(hash) {
  const parts = String(hash || '').replace(/^#\/?/, '').split('/').filter(Boolean);
  if (!parts.length || parts.length > 2 || !parts.every(part => SEGMENT.test(part))) return null;
  const [parent, id] = parts;
  if (!id) return parent === '-' ? null : { parent };
  return { parent: parent === '-' ? null : parent, id };
}
