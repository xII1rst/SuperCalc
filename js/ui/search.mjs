import { createSearchIndex, normalizeSearch, searchTools } from '../utils/search.mjs';
import { buildToolCatalog, defaultToolIds } from './search/catalog.mjs';
import { collectMarkupTools } from './search/markup.mjs';

const escapeHtml = value => String(value).replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

export function createToolSearch({ openTool, selectActions, root = document }) {
  let dialog;
  let catalog;
  let index;
  let results = [];
  let previousFocus;
  let restoreFocus = true;
  const get = id => root.getElementById(id);

  function initialize() {
    if (dialog) return;
    dialog = get('tool-search-dialog');
    catalog = buildToolCatalog();
    catalog.push(...collectMarkupTools(root, catalog));
    index = createSearchIndex(catalog);
    dialog.addEventListener('cancel', event => {
      event.preventDefault();
      searchClose();
    });
    dialog.addEventListener('click', event => {
      if (event.target === dialog) searchClose();
    });
    dialog.addEventListener('close', () => {
      if (restoreFocus && previousFocus?.isConnected) previousFocus.focus();
    });
  }

  function searchUpdate() {
    if (!dialog) return;
    const query = get('tool-search-input').value.slice(0, 160);
    const empty = !normalizeSearch(query);
    results = empty ? defaultToolIds.map(id => catalog.find(entry => entry.id === id)) : searchTools(index, query);
    get('tool-search-status').textContent = empty ? 'Herramientas para empezar'
      : results.length ? `${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}`
      : 'Sin resultados. Prueba otro nombre o tema, como «derivadas», «matrices» o «ondas».';
    get('tool-search-results').innerHTML = results.map(entry =>
      `<li><button type="button" class="search-result" data-action="searchChoose" data-arg="${escapeHtml(entry.id)}">`
      + `<span class="search-result-icon"><svg class="sc-icon" aria-hidden="true"><use href="#sc-icon-${escapeHtml(entry.icon)}"></use></svg></span>`
      + `<span class="search-result-content"><span class="search-result-title">${escapeHtml(entry.title)}</span>`
      + `<span class="search-result-path">${escapeHtml(entry.path)}</span>`
      + `<span class="search-result-description">${escapeHtml(entry.description)}</span></span>`
      + '<svg class="sc-icon search-result-arrow" aria-hidden="true"><use href="#sc-icon-chevron"></use></svg></button></li>'
    ).join('');
    get('tool-search-results').scrollTop = 0;
  }

  function searchOpen() {
    initialize();
    if (!dialog.open) {
      previousFocus = root.activeElement;
      restoreFocus = true;
      searchUpdate();
      dialog.showModal();
    }
    get('tool-search-input').focus();
    get('tool-search-input').select();
  }

  function searchClose() {
    if (dialog?.open) dialog.close();
  }

  function selectTool(entry) {
    const selection = entry.selection;
    if (!selection) return;
    if (selection.select) get(selection.select).value = selection.value;
    if (!selection.body || !get(selection.body).classList.contains('open')) {
      selectActions[selection.action]?.(selection.value);
    }
    const target = selection.body || selection.focus || selection.select;
    const element = target && get(target);
    if (selection.card) get(selection.card).scrollIntoView({ block: 'start', behavior: 'smooth' });
    const input = element?.querySelector('input, textarea, select') || element;
    input?.focus({ preventScroll: true });
  }

  function searchChoose(id) {
    const entry = results.find(result => result.id === id);
    if (!entry || !dialog?.open) return;
    restoreFocus = false;
    searchClose();
    openTool(entry.route, () => selectTool(entry));
  }

  function handleKeydown(event) {
    if (event.isComposing) return false;
    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      searchOpen();
      return true;
    }
    if (!dialog?.open) return false;
    if (event.key === 'Tab') {
      const controls = [...dialog.querySelectorAll('button, input')];
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && event.target === first || !event.shiftKey && event.target === last) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
        return true;
      }
      return false;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      searchClose();
      return true;
    }
    if (event.key === 'Enter' && event.target === get('tool-search-input')) {
      event.preventDefault();
      if (results.length) searchChoose(results[0].id);
      return true;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return false;
    const buttons = [...get('tool-search-results').querySelectorAll('button')];
    const current = buttons.indexOf(event.target);
    if (current === -1 && event.target !== get('tool-search-input')) return false;
    event.preventDefault();
    const next = current + (event.key === 'ArrowDown' ? 1 : -1);
    if (next < 0) get('tool-search-input').focus();
    else buttons[Math.min(next, buttons.length - 1)]?.focus();
    return true;
  }

  return { actions: { searchOpen, searchClose, searchUpdate, searchChoose }, handleKeydown };
}
