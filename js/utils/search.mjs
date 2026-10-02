// Índice y ranking puros; no depende de la interfaz ni de servicios externos.
export function normalizeSearch(value) {
  return String(value).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
}

const synonyms = [
  'derivative derivatives derivada derivadas derivacion',
  'integral integrals integrales integration integracion integrate',
  'limit limits limite limites', 'matrix matrices matriz',
  'vector vectors vectores', 'equation equations ecuacion ecuaciones',
  'eigenvalue eigenvalues eigenvalores autovalores',
  'determinant determinants determinante determinantes',
  'inverse inversa inversion', 'function functions funcion funciones',
  'sequence sequences sucesion sucesiones', 'series serie',
  'probability probabilidad', 'statistics estadistica',
  'mean media promedio', 'variance varianza', 'median mediana',
  'graph graphs grafica graficas grafo grafos graficador plot plotting',
  'root roots raiz raices', 'interpolation interpolacion',
  'differential diferencial', 'ode edo', 'ivp pvi',
  'force forces fuerza fuerzas', 'energy energia',
  'motion movimiento', 'projectile proyectil proyectiles parabolico',
  'gravity gravitation gravedad gravitacion', 'collision collisions colision colisiones',
  'wave waves onda ondas', 'oscillation oscillations oscilacion oscilaciones',
  'pendulum pendulo', 'spring resorte', 'sound sonido', 'optics optica',
  'circuit circuits circuito circuitos', 'resistance resistencia',
  'capacitance capacitancia', 'electric electrico electrica',
  'magnetic magnetico magnetica magnetismo', 'field campo',
  'charge carga cargas', 'voltage voltaje tension',
  'truth verdad', 'boolean booleana booleano', 'set sets conjunto conjuntos',
  'binary binario binaria', 'coin moneda', 'dice dado dados',
  'combinations combinacion combinaciones', 'theory teoria teoricas',
];
const alternatives = new Map();
for (const group of synonyms) {
  const words = group.split(' ');
  for (const word of words) alternatives.set(word, words);
}
const stopWords = new Set('de del el la los las y en para con un una the of and to'.split(' '));

export function createSearchIndex(entries) {
  return entries.map(entry => ({
    entry,
    title: normalizeSearch(entry.title),
    fields: [entry.title, entry.keywords || '', entry.description, entry.path]
      .map(value => normalizeSearch(value || '').split(' ').filter(Boolean)),
  }));
}

function wordScore(words, term) {
  if (words.includes(term)) return 4;
  if (words.some(word => word.startsWith(term))) return 2;
  return 0;
}

export function searchTools(index, query, limit = 12) {
  const phrase = normalizeSearch(String(query).slice(0, 160));
  if (!phrase) return [];
  const words = phrase.split(' ');
  const meaningful = words.filter(word => !stopWords.has(word));
  const tokens = [...new Set(meaningful.length ? meaningful : words)];
  const weights = [12, 7, 4, 2];
  const ranked = [];
  for (const item of index) {
    let score = 0;
    for (const token of tokens) {
      let best = 0;
      for (const term of alternatives.get(token) || [token]) {
        for (let i = 0; i < item.fields.length; i++) {
          best = Math.max(best, wordScore(item.fields[i], term) * weights[i]);
        }
      }
      if (!best) { score = 0; break; }
      score += best;
    }
    if (!score) continue;
    if (item.title === phrase) score += 200;
    else if (item.title.startsWith(phrase)) score += 100;
    // Entre coincidencias equivalentes, la operación más específica va primero.
    score -= item.title.length / 1000;
    ranked.push({ entry: item.entry, score });
  }
  ranked.sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id));
  return ranked.slice(0, limit).map(item => item.entry);
}
