import {MECHANICS_UNITS} from './mechanics-units.mjs';
export const OUTPUT_UNITS=Object.freeze({...MECHANICS_UNITS,
 pressure:{Pa:1,kPa:1e3,MPa:1e6},angularAcceleration:{'rad/s²':1,'°/s²':Math.PI/180}, area:{'m²':1,'cm²':1e-4},frequency:{Hz:1,kHz:1e3,MHz:1e6},angularFrequency:{'rad/s':1,'°/s':Math.PI/180,rpm:Math.PI/30},rate:{'s⁻¹':1,'min⁻¹':1/60},waveNumber:{'rad/m':1,'rad/cm':100},
 power:{W:1,kW:1e3,mW:1e-3},intensity:{'W/m²':1,'mW/m²':1e-3},current:{A:1,mA:1e-3,'µA':1e-6},voltage:{V:1,mV:1e-3,kV:1e3},charge:{C:1,mC:1e-3,'µC':1e-6,nC:1e-9},
 resistance:{'Ω':1,'kΩ':1e3,'MΩ':1e6},capacitance:{F:1,mF:1e-3,'µF':1e-6,nF:1e-9,pF:1e-12},inductance:{H:1,mH:1e-3,'µH':1e-6},electricField:{'N/C':1,'V/m':1,'kV/m':1e3},magneticField:{T:1,mT:1e-3,'µT':1e-6},flux:{Wb:1,mWb:1e-3,'µWb':1e-6},
 torque:{'N·m':1,'kN·m':1e3,'lbf·ft':4.4482216152605*.3048},momentum:{'kg·m/s':1,'N·s':1,'g·m/s':1e-3},inertia:{'kg·m²':1,'g·cm²':1e-7},angularMomentum:{'kg·m²/s':1,'g·cm²/s':1e-7},specificAngularMomentum:{'m²/s':1,'cm²/s':1e-4},stiffness:{'N/m':1,'kN/m':1e3},energyDensity:{'J/m³':1,'kJ/m³':1e3},dipole:{'C·m':1,'µC·m':1e-6},chargeDensity:{'C/m³':1,'µC/m³':1e-6},linearCharge:{'C/m':1,'µC/m':1e-6},electricFlux:{'N·m²/C':1,'kN·m²/C':1e3},potentialLaplacian:{'V/m²':1,'kV/m²':1e3},magneticMoment:{'A·m²':1,'mA·m²':1e-3},damping:{'kg/s':1,'g/s':1e-3},mechanicalImpedance:{'kg/s':1,'g/s':1e-3}
});
export function outputDimension(unit){return Object.keys(OUTPUT_UNITS).find(d=>Object.hasOwn(OUTPUT_UNITS[d],unit))||null;}
export function convertOutput(value,from,to){
 const dimension=outputDimension(from),units=OUTPUT_UNITS[dimension];if(!dimension||!Object.hasOwn(units,to))throw new RangeError('Unidades incompatibles.');
 const convert=v=>{if(Array.isArray(v))return v.map(convert);if(!Number.isFinite(v))throw new RangeError('Resultado no finito.');const result=v*units[from]/units[to];if(!Number.isFinite(result))throw new RangeError('Conversión fuera del rango numérico.');return result;};return convert(value);
}
