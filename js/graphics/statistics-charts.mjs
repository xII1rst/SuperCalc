import { fN } from '../utils/format.mjs';

export function histogramChart(bins) {
  const left = 38;
  const right = 620;
  const bottom = 132;
  const top = 20;
  const slot = (right - left) / bins.length;
  const peak = Math.max(...bins.map(bin => bin.count), 1);
  const bars = bins.map((bin, index) => {
    const height = bin.count / peak * (bottom - top);
    const width = Math.min(slot - 3, 110);
    const x = left + index * slot + (slot - width) / 2;
    const y = bottom - height;
    return `<g><title>${fN(bin.start)}–${fN(bin.end)}: ${bin.count}</title>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="3"/>
      <text x="${x + width / 2}" y="${Math.max(12, y - 5)}" text-anchor="middle">${bin.count}</text></g>`;
  }).join('');
  return `<svg class="tool-chart tool-histogram" viewBox="0 0 660 170" role="img" aria-label="Histograma de frecuencias">
    <line x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}"/>
    ${bars}
    <text x="${left}" y="155">${fN(bins[0].start)}</text>
    <text x="${right}" y="155" text-anchor="end">${fN(bins.at(-1).end)}</text>
  </svg>`;
}

export function boxPlotChart(summary) {
  const left = 38;
  const right = 620;
  const y = 78;
  const scale = value => summary.range === 0 ? (left + right) / 2 :
    left + (value - summary.min) / summary.range * (right - left);
  const min = scale(summary.min);
  const q1 = scale(summary.q1);
  const median = scale(summary.median);
  const q3 = scale(summary.q3);
  const max = scale(summary.max);
  return `<svg class="tool-chart tool-boxplot" viewBox="0 0 660 145" role="img" aria-label="Diagrama de caja: mínimo ${fN(summary.min)}, Q1 ${fN(summary.q1)}, mediana ${fN(summary.median)}, Q3 ${fN(summary.q3)}, máximo ${fN(summary.max)}">
    <line x1="${min}" y1="${y}" x2="${max}" y2="${y}"/>
    <line x1="${min}" y1="${y - 17}" x2="${min}" y2="${y + 17}"/>
    <line x1="${max}" y1="${y - 17}" x2="${max}" y2="${y + 17}"/>
    <rect x="${q1}" y="${y - 28}" width="${Math.max(q3 - q1, 1)}" height="56" rx="4"/>
    <line class="median" x1="${median}" y1="${y - 28}" x2="${median}" y2="${y + 28}"/>
    <text x="${left}" y="132">${fN(summary.min)}</text>
    <text x="${right}" y="132" text-anchor="end">${fN(summary.max)}</text>
  </svg>`;
}
