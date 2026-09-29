import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WAVE_C, harmonicMotion, springOscillator, pendulumPeriod, phasorSum, beats,
  travelingWave, stringWave, standingWave, deepWaterDispersion, wavePowerString,
  intensityLevel, combineSoundLevels, pointSourceSound, dopplerFrequency, stringBoundary,
  electromagneticWave, refractiveMedium, normalIncidence, polarizerChain,
  youngInterference, soapFilmConstructive, newtonRing,
  lcOscillation, tubeModes, lissajous, multipleSlitInterference, gratingOrders,
} from '../js/math/waves.mjs';

const close=(actual,expected,tolerance=1e-8)=>assert.ok(Math.abs(actual-expected)<=tolerance*Math.max(1,Math.abs(expected)),`${actual} ≠ ${expected}`);

test('Ondas 1–6 y 19–23: MAS, péndulo y oscilador forzado',()=>{
  const motion=harmonicMotion(0.05,4*Math.PI,Math.PI/3,0.5);
  close(motion.position,0.025);
  close(motion.frequency,2);
  close(motion.period,0.5);
  const spring=springOscillator(0.5,200);
  close(spring.omega0,20);
  close(pendulumPeriod(1.5).period,2*Math.PI*Math.sqrt(1.5/9.80665));
  const damped=springOscillator(0.5,50,2,10,8);
  assert.equal(damped.regime,'underdamped');
  close(damped.omega0,10);
  close(damped.gamma,2);
  assert.ok(damped.forced.averagePower>0);
  assert.equal(springOscillator(0.5,50,15).regime,'overdamped');
  assert.throws(()=>springOscillator(1,100,0,10,10),RangeError);
});

test('Ondas 15–18 y 38–41: LC, tubos y Lissajous',()=>{
  const lc=lcOscillation(0.1,100e-6,0.001,0.005);
  close(lc.omega,1/Math.sqrt(1e-5));
  close(lc.capacitorEnergy+lc.inductorEnergy,lc.totalEnergy);
  const open=tubeModes(1,340,'open-open',3),closed=tubeModes(1,340,'closed-open',3);
  close(open.modes[0].frequency,170);close(closed.modes[0].frequency,85);
  assert.deepEqual(closed.modes.map(mode=>mode.harmonic),[1,3,5]);
  const figure=lissajous(1,2,2,3,Math.PI/2);
  close(figure.x,1);close(figure.y,0);assert.equal(figure.points.length,200);
});

test('Ondas 48–50: varias rendijas y banda de red',()=>{
  close(multipleSlitInterference(4,1e-6,500e-9,0).normalizedIntensity,1);
  close(multipleSlitInterference(4,1e-6,500e-9,Math.asin(0.125)*180/Math.PI).normalizedIntensity,0);
  const orders=gratingOrders(2e-6,550e-9,380e-9,750e-9);
  assert.equal(orders.orders[0].angleDegrees,0);
  assert.equal(orders.orders.at(-1).order,5);
  assert.equal(orders.orders.at(-1).angleDegrees,null);
  assert.throws(()=>gratingOrders(1e-6,550e-9,750e-9,380e-9),/invertida/);
});

test('Ondas 7–12, 24–30 y 42: propagación, cuerda, fasores y estacionaria',()=>{
  const wave=travelingWave(0.02,3,12);
  close(wave.speed,4);
  close(wave.wavelength,2*Math.PI/3);
  close(stringWave(50,0.01).speed,Math.sqrt(5000));
  close(intensityLevel(1e-6).decibels,60);
  close(dopplerFrequency(500,343,30).observed,500*343/313);
  close(beats(440,446).beatFrequency,6);
  close(phasorSum([[3,0],[4,Math.PI/2]]).amplitude,5);
  const dispersion=deepWaterDispersion(10);
  close(dispersion.groupSpeed,dispersion.phaseSpeed/2);
  close(wavePowerString(0.02,200,0.01,30).averagePower,1.2);
  const standing=standingWave(0.04,5*Math.PI,200*Math.PI,0.5);
  close(standing.speed,40);
  close(standing.wavelength,0.4);
  close(standing.nodes[1],0.2);
  close(standing.antinodes[0],0.1);
  close(standing.componentAmplitude,0.02);
});

test('Ondas 32–37 y 43–44: fuentes, frontera de cuerda y Mach parcial',()=>{
  close(combineSoundLevels([60,60]).decibels,60+10*Math.log10(2));
  close(pointSourceSound(50,10).intensity,50/(400*Math.PI));
  const boundary=stringBoundary(100,0.01,0.04);
  close(boundary.reflectedAmplitude,-1/3);
  close(boundary.reflectedEnergy+boundary.transmittedEnergy,1);
  assert.throws(()=>dopplerFrequency(1000,343,350),RangeError);
});

test('Ondas 14 y 45–50: intensidad EM, polarizadores, Young, película y anillos',()=>{
  const em=electromagneticWave(300);
  close(em.magneticPeak,300/WAVE_C);
  close(em.peakPoynting,2*em.averageIntensity);
  close(em.absorbingPressure,em.averageIntensity/WAVE_C);
  const medium=refractiveMedium(1.33,500e-9);
  close(medium.speed,WAVE_C/1.33);
  close(normalIncidence(1,1.5).reflectance,0.04);
  close(polarizerChain(100,[0,45,90]).final,12.5);
  const young=youngInterference(550e-9,0.3e-3,2,3,1,1.5,10e-6);
  close(young.bright,0.011);
  close(young.dark,0.0055);
  close(young.filmShift,1/30);
  const film=soapFilmConstructive(1.33,300e-9,[380e-9,750e-9]);
  assert.deepEqual(film.wavelengths.map(item=>item.order),[1]);
  close(film.wavelengths[0].wavelength,532e-9);
  close(newtonRing(1,589e-9,5,true).radius,Math.sqrt(5*589e-9));
});
