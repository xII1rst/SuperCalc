import { dimension, list, number, read, rows, unitFactors } from './units.mjs';
import { equivalentComponents, nodalCircuit, nodalVoltageSources, rcState, resistiveWire, rlTransient, seriesRlcAc, seriesRlcTransient } from '../../math/electromagnetism-advanced.mjs';
import { lcOscillation } from '../../math/waves.mjs';
import { ohmsLaw } from '../../math/electromagnetism.mjs';

export const fields={
  ohm:[['voltage','Voltaje (V)','9'],['resistance','Resistencia (Ω)','12']],
  rc:[['resistance','R (Ω)','1000'],['capacitance','C (F)','0.00001'],['voltage','V₀ o escalón (V)','100'],['time','Tiempo (s)','0.005'],['fraction','Fracción residual V/V₀','0.1']],
  equivalent:[['values','Valores separados por coma','2, 3, 6','text'],['kind','Tipo: resistor o capacitor','resistor','select','resistor,capacitor'],['inputUnit','Unidad de los valores','Ω','select','Ω,kΩ,MΩ,F,mF,µF,nF,pF'],['connection','Conexión: series o parallel','series','select','series,parallel'],['outputUnit','Unidad del resultado','Ω','select','Ω,kΩ,MΩ,F,mF,µF,nF,pF']],
  wire:[['resistivity','Resistividad (Ω·m)','1.7e-8'],['length','Longitud (m)','10'],['area','Sección (m², o diámetro)','1e-6'],['diameter','Diámetro circular (m, deja área vacía)',''],['voltage','Voltaje (V, opcional)','12']],
  nodal:[['nodes','Número de nodos (0 = tierra)','3'],['resistors','Resistores: nodo a, nodo b, resistencia; una por línea','1, 2, 1000\n2, 0, 1000','textarea'],['fixed','Potenciales fijos: nodo, voltaje; una por línea','0, 0\n1, 10','textarea'],['injections','Corrientes inyectadas: nodo, corriente; opcional','','textarea']],
  nodalfloating:[['nodes','Número de nodos (0 = tierra)','3'],['resistors','Resistores: nodo a, nodo b, resistencia; opcional','2, 0, 2','textarea'],['sources','Fuentes: nodo a, nodo b, V(a)−V(b); una por línea','1, 0, 12\n1, 2, 6','textarea'],['injections','Corrientes inyectadas: nodo, corriente; opcional','','textarea']],
  rl:[['resistance','Resistencia (Ω)','10'],['inductance','Inductancia (H)','2'],['voltage','Escalón de voltaje (V)','20'],['time','Tiempo (s)','0.2']],
  lc:[['inductance','Inductancia L (H)','0.1'],['capacitance','Capacitancia C (F)','0.00001'],['charge','Carga inicial q₀ (C)','0.0001'],['time','Tiempo t (s)','0.01']],
  rlctransient:[['resistance','Resistencia R (Ω)','20'],['inductance','Inductancia L (H)','0.5'],['capacitance','Capacitancia C (F)','0.00005'],['charge','Carga inicial q₀ (C)','0.0001'],['current','Corriente inicial I₀ (A)','0'],['time','Tiempo t (s)','0.01']],
  rlc:[['resistance','Resistencia serie (Ω)','10'],['inductance','Inductancia (H)','0.1'],['capacitance','Capacitancia (F)','0.0001'],['frequency','Frecuencia (Hz)','50'],['voltage','Voltaje RMS (V)','120']],
};

export const modes={
  ohm:['circuits','Ley de Ohm y potencia','I=V/R; P=VI'],
  rc:['circuits','RC: carga, descarga y umbral','τ=RC; V descarga=V₀e^(−t/τ)'],
  equivalent:['circuits','Componentes equivalentes','Serie: ΣR o (Σ1/C)⁻¹; paralelo: (Σ1/R)⁻¹ o ΣC'],
  wire:['circuits','Resistividad de un conductor','R = ρL/A; I = V/R; P = V²/R'],
  nodal:['circuits','Circuito por nodos','KCL en cada nodo desconocido: Σ(Vn−Vm)/R = Iinyectada'],
  nodalfloating:['circuits','Circuito con fuentes de voltaje flotantes','Indica cada conexión y polaridad: V(a)−V(b)=ε; KCL también determina la corriente de fuente.'],
  rl:['circuits','Circuito RL transitorio','τ = L/R; I(t) = (V/R)(1−e^(−t/τ))'],
  lc:['circuits','Circuito LC ideal','q(t) = q₀ cos(ωt); I(t) = −q₀ω sen(ωt); ω = 1/√(LC)'],
  rlctransient:['circuits','Circuito RLC libre','Lq″ + Rq′ + q/C = 0; α = R/(2L); ω₀ = 1/√(LC)'],
  rlc:['circuits','Circuito RLC serie en AC','Z = √[R²+(ωL−1/ωC)²]; Irms = Vrms/Z; P = I²R'],
};

export const solvers={
  ohm() {
    const resistance=number('resistance');if(resistance<=0)throw new RangeError('Resistencia positiva requerida.');
    return ohmsLaw({voltage:number('voltage'),resistance});
  },
  rc() { return rcState(number('resistance'),number('capacitance'),number('voltage'),number('time'),number('fraction')); },
  equivalent() {
    const kind=read('kind'),dimension=kind==='resistor'?'resistance':kind==='capacitor'?'capacitance':null;
    const inputUnit=read('inputUnit'),outputUnit=read('outputUnit');
    if(!dimension||!Object.hasOwn(unitFactors[dimension],inputUnit)||!Object.hasOwn(unitFactors[dimension],outputUnit))
      throw new RangeError('Las unidades de entrada y salida deben corresponder al tipo de componente');
    const result=equivalentComponents(list('values').map(value=>value*unitFactors[dimension][inputUnit]),kind,read('connection'));
    return {...result,equivalent:result.equivalent/unitFactors[dimension][outputUnit],unit:outputUnit,equivalentSI:result.equivalent};
  },
  wire() {
    const diameter=number('diameter',true),area=number('area',true);
    if(diameter!==null&&(diameter<=0||area!==null))throw new RangeError('Usa diámetro positivo con área vacía, o área positiva con diámetro vacío.');
    return resistiveWire(number('resistivity'),number('length'),diameter===null?area:Math.PI*diameter**2/4,number('voltage',true));
  },
  nodal() {
    return nodalCircuit(number('nodes'),rows('resistors',3).map(([a,b,resistance])=>({a,b,resistance})),
    rows('fixed',2).map(([node,voltage])=>({node,voltage})),rows('injections',2,true).map(([node,current])=>({node,current})));
  },
  nodalfloating() {
    return nodalVoltageSources(number('nodes'),rows('resistors',3,true).map(([a,b,resistance])=>({a,b,resistance})),
    rows('sources',3).map(([a,b,voltage])=>({a,b,voltage})),rows('injections',2,true).map(([node,current])=>({node,current})));
  },
  rl() { return rlTransient(number('resistance'),number('inductance'),number('voltage'),number('time')); },
  lc() {
    const q0=number('charge'),r=lcOscillation(number('inductance'),number('capacitance'),q0,number('time'));
    return {...r,chargeFormula:`q(t) = (${q0}) cos((${r.omega}) t)`,currentFormula:`I(t) = (${-q0*r.omega}) sen((${r.omega}) t)`,
      assumption:'LC ideal sin pérdidas; q(0)=q₀ e I(0)=0; corriente positiva según I=dq/dt.'};
  },
  rlctransient() { return seriesRlcTransient(number('resistance'),number('inductance'),number('capacitance'),number('charge'),number('current'),number('time')); },
  rlc() { return seriesRlcAc(number('resistance'),number('inductance'),number('capacitance'),number('frequency'),number('voltage')); },
};
