import { histogram, parseDataset, percentile, summarizeDataset } from '../math/statistics.mjs';
import { boxPlotChart, histogramChart } from '../graphics/statistics-charts.mjs';
import { fN } from '../utils/format.mjs';

export function statsAnalyze() {
  const target = document.getElementById('stats-result');
  try {
    const values = parseDataset(document.getElementById('stats-values').value);
    const percentileText = document.getElementById('stats-percentile').value.trim();
    const requested = percentileText === '' ? NaN : Number(percentileText);
    const summary = summarizeDataset(values);
    const requestedValue = percentile(values, requested);
    const fields = [
      ['Cantidad', summary.count], ['Suma', summary.sum], ['Media', summary.mean],
      ['Mediana', summary.median], ['Moda', summary.modes.length ? summary.modes.map(value => fN(value)).join(', ') : 'Sin moda'],
      ['Mínimo', summary.min], ['Máximo', summary.max], ['Rango', summary.range],
      ['Q1 (25 %)', summary.q1], ['Q3 (75 %)', summary.q3], ['Rango intercuartílico', summary.iqr],
      [`Percentil ${fN(requested)}`, requestedValue],
      ['Varianza poblacional', summary.populationVariance],
      ['Desviación poblacional', summary.populationStdDev],
      ['Varianza muestral', summary.sampleVariance === null ? '—' : summary.sampleVariance],
      ['Desviación muestral', summary.sampleStdDev === null ? '—' : summary.sampleStdDev],
    ];
    target.classList.remove('tool-error');
    target.innerHTML = `<div class="tool-stats-grid">${fields.map(([label, value]) =>
      `<div class="tool-stat"><span>${label}</span><strong>${typeof value === 'number' ? fN(value) : value}</strong></div>`
    ).join('')}</div>
      <div class="tool-charts">
        <div><h3>Histograma</h3>${histogramChart(histogram(values))}</div>
        <div><h3>Diagrama de caja</h3>${boxPlotChart(summary)}</div>
      </div>
      <p class="tool-note">Percentiles por interpolación lineal. La varianza muestral requiere al menos dos datos.</p>`;
  } catch (error) {
    target.textContent = error.message;
    target.classList.add('tool-error');
  }
}

export function statsClear() {
  document.getElementById('stats-values').value = '';
  document.getElementById('stats-percentile').value = '90';
  const target = document.getElementById('stats-result');
  target.textContent = '';
  target.classList.remove('tool-error');
}
