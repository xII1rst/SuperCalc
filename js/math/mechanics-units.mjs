// Factores hacia SI. Pies y millas internacionales; libra avoirdupois.
// https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8
export const MECHANICS_UNITS = Object.freeze({
  length: Object.freeze({'m': 1, 'cm': 0.01, 'km': 1000, 'ft': 0.3048, 'in': 0.0254, 'mi': 1609.344}),
  time: Object.freeze({'s': 1, 'min': 60, 'h': 3600}),
  speed: Object.freeze({'m/s': 1, 'm/min': 1 / 60, 'km/h': 1000 / 3600, 'ft/s': 0.3048, 'ft/min': 0.3048 / 60, 'in/s': 0.0254, 'mph': 1609.344 / 3600, 'mi/s': 1609.344}),
  acceleration: Object.freeze({'m/s²': 1, 'ft/s²': 0.3048, 'in/s²': 0.0254, 'mph/s': 1609.344 / 3600}),
  mass: Object.freeze({'kg': 1, 'g': 0.001, 'lb': 0.45359237}),
  force: Object.freeze({'N': 1, 'kN': 1000, 'lbf': 4.4482216152605}),
  energy: Object.freeze({'J': 1, 'kJ': 1000, 'ft·lbf': 0.3048 * 4.4482216152605}),
  angle: Object.freeze({'rad': 1, '°': Math.PI / 180}),
});

export function convertMechanicsUnit(value, quantity, from, to) {
  const units = MECHANICS_UNITS[quantity];
  if (!Number.isFinite(value) || !units || !Object.hasOwn(units, from) || !Object.hasOwn(units, to)) {
    throw new RangeError('Unidad o valor no válido para esta magnitud.');
  }
  const result = value * units[from] / units[to];
  if (!Number.isFinite(result)) throw new RangeError('La conversión excede el límite numérico disponible.');
  return result;
}

export function toMechanicsSI(value, quantity, unit) {
  return convertMechanicsUnit(value, quantity, unit, Object.keys(MECHANICS_UNITS[quantity] || {})[0]);
}

export function fromMechanicsSI(value, quantity, unit) {
  return convertMechanicsUnit(value, quantity, Object.keys(MECHANICS_UNITS[quantity] || {})[0], unit);
}
