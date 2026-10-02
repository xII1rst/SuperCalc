// Reutiliza las fichas y opciones estáticas para no mantener otra lista de nombres.
export function collectMarkupTools(root, catalog) {
  const entries = [];
  const tool = id => catalog.find(entry => entry.id === id);
  const add = (owner, id, title, description, selection, keywords = '') => {
    if (!owner || !title) return;
    entries.push({
      id, title, description: description || owner.description,
      path: `${owner.path} / ${owner.title}`, route: owner.route, icon: owner.icon,
      keywords, selection,
    });
  };
  for (const header of root.querySelectorAll('.calc-card-header[data-action="toggleCard"]')) {
    const panel = header.closest('.calc-panel');
    const tab = panel?.id.replace('calc-p', '').toLowerCase();
    const value = header.dataset.arg;
    add(tool(`calc-${tab}`), `card:${value}`,
      header.querySelector('.calc-card-name')?.textContent.trim(),
      header.querySelector('.calc-card-desc')?.textContent.trim(),
      { action: 'toggleCard', value, card: `card-${value}`, body: `body-${value}` });
  }
  for (const id of ['geom', 'linear']) {
    const select = root.getElementById(`${id}-mode`);
    for (const option of select?.options || []) {
      add(tool(id), `${id}:${option.value}`, option.textContent.trim(), '',
        { select: select.id, value: option.value, action: select.dataset.action }, option.value);
    }
  }
  const matrixKeywords = {
    ops: 'sumar restar multiplicar transpuesta operaciones matrices',
    det: 'determinante inversa determinant inverse', sis: 'ecuaciones lineales Gauss sistema',
    eig: 'eigenvalues eigenvectores autovalores valores propios', space: 'núcleo rango imagen espacios',
  };
  for (const tab of root.querySelectorAll('.mat-tab[data-action="matTab"]')) {
    const value = tab.dataset.arg;
    add(tool('mat'), `mat:${value}`, tab.textContent.trim(), '',
      { action: 'matTab', value, focus: `mat-p${value[0].toUpperCase()}${value.slice(1)}` }, matrixKeywords[value]);
  }
  return entries;
}
