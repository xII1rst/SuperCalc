import test from 'node:test';
import assert from 'node:assert/strict';
import * as w from '../js/math/waves.mjs';

// Oráculos de los 50 enunciados de Ondas. Las expresiones esperadas se calculan
// desde sus datos y leyes, sin usar las salidas del motor como referencia.
const close=(actual,expected)=>assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=1e-10*Math.max(1,Math.abs(expected)),`${actual} ≠ ${expected}`);
const pi=Math.PI,g=9.80665,c=299792458;
const checks={
  1(){const r=w.harmonicMotion(.05,4*pi,pi/3,.5);close(r.amplitude,.05);close(r.omega,4*pi);close(r.frequency,2);close(r.period,.5);close(r.phase,pi/3);close(r.position,.025);},
  2(){const r=w.springOscillator(.5,200);close(r.omega0,20);close(r.frequency,10/pi);close(r.period,pi/10);},
  3(){close(w.pendulumPeriod(1.5).period,2*pi*Math.sqrt(1.5/g));},
  4(){close(w.lcOscillation(.01,1e-6,0,0).frequency,5000/pi);},
  5(){close(w.harmonicMotion(.2,1,0,0,100).energy,2);},
  6(){const r=w.harmonicMotion(.1,10);close(r.maxSpeed,1);close(r.maxAcceleration,10);},
  7(){const r=w.travelingWave(.02,3,12);close(r.wavelength,2*pi/3);close(r.speed,4);close(r.frequency,6/pi);},
  8(){close(w.waveRelation(343,{frequency:440}).wavelength,343/440);},
  9(){close(w.stringWave(50,.01).speed,Math.sqrt(5000));},
  10(){close(w.intensityLevel(1e-6).decibels,60);},
  11(){close(w.dopplerFrequency(500,343,30,0).observed,500*343/313);},
  12(){close(w.beats(440,446).beatFrequency,6);},
  13(){close(w.waveRelation(c,{frequency:100e6}).wavelength,c/1e8);close(w.waveRelation(c,{wavelength:550e-9}).frequency,c/550e-9);},
  14(){close(w.electromagneticWave(100).averageIntensity,.5*8.8541878128e-12*c*10000);},
  15(){assert.deepEqual(w.stringHarmonics(240,1.2).harmonics,[100,200,300]);},
  16(){close(w.youngInterference(600e-9,.2e-3,1.5).spacing,.0045);},
  17(){const r=w.refractiveMedium(1.5,600e-9);close(r.speed,c/1.5);close(r.wavelength,400e-9);},
  18(){close(w.pendulumPeriod(1,g,1/3,1,.5).period,2*pi*Math.sqrt(2/(3*g)));},
  19(){const r=w.springOscillator(.5,50,2);close(r.omega0,10);close(r.gamma,2);close(r.dampedOmega,Math.sqrt(96));assert.equal(r.regime,'underdamped');},
  20(){const r=w.springOscillator(.5,50,15);close(r.roots[0],-15+Math.sqrt(125));close(r.roots[1],-15-Math.sqrt(125));close(r.criticalDamping,10);assert.equal(r.regime,'overdamped');assert.match(r.freeSolution,/C₁e/);},
  21(){const r=w.springOscillator(.5,50,2);close(r.quality,2.5);close(r.decrement,4*pi/Math.sqrt(96));},
  22(){const r=w.springOscillator(1,100,2,10,8).forced;close(r.amplitude,10/Math.sqrt(1552));close(r.phaseLag,Math.atan2(16,36));},
  23(){const r=w.springOscillator(1,100,2,10,8);close(r.forced.averagePower,6400/1552);close(r.resonance.omega,Math.sqrt(98));close(r.resonance.amplitude,10/Math.sqrt(396));close(r.resonance.powerPeakAmplitude,.5);},
  24(){const r=w.phasorSum([[3,0],[4,pi/2]]);close(r.amplitude,5);close(r.phase,Math.atan2(4,3));},
  25(){const r=w.beats(100,104);close(r.beatFrequency,4);close(r.carrierFrequency,102);assert.match(r.formula,/2 cos/);},
  26(){const a=w.lissajous(3,4,1,1,pi/2),b=w.lissajous(1,1,2,3,pi/2);close(a.ellipse.crossCoefficient,0);close(a.ellipse.rightSide,1);assert.equal(b.ellipse,null);for(const [x,y] of a.points)close((x/3)**2+(y/4)**2,1);for(const [x,y] of b.points)close(y**2,(1-x)*(2*x+1)**2/2);},
  27(){const r=w.deepWaterDispersion(10);close(r.phaseSpeed,Math.sqrt(g*10/(2*pi)));close(r.groupSpeed,Math.sqrt(g*10/(2*pi))/2);},
  28(){const r=w.travelingWave(.1,2*pi,8*pi,.25,.1);close(r.maxTransverseVelocity,.8*pi);close(r.transverseAcceleration,-6.4*pi**2*Math.sin(-.3*pi));},
  29(){const r=w.stringWave(80,.1/5,5);close(r.speed,Math.sqrt(4000));close(r.fundamental,Math.sqrt(40));},
  30(){close(w.wavePowerString(.02,200,.01,30).averagePower,1.2);},
  31(){close(w.gasSoundSpeed(1.4,293.15,.029).speed,Math.sqrt(1.4*8.314462618*293.15/.029));close(w.gasSoundSpeed(1.67,293.15,.004).speed,Math.sqrt(1.67*8.314462618*293.15/.004));},
  32(){close(w.combineSoundLevels([60,63]).decibels,60+10*Math.log10(1+10**.3));close(w.combineSoundLevels(Array(10).fill(60)).decibels,70);},
  33(){close(w.dopplerFrequency(600,343,20,-10).observed,600*333/323);},
  34(){assert.deepEqual(w.tubeModes(.85,343,'open-open',3).modes.map(r=>r.frequency),[1,2,3].map(n=>n*343/1.7));for(const [i,r] of w.tubeModes(.85,343,'closed-open',3).modes.entries())close(r.frequency,(2*i+1)*343/3.4);},
  35(){const r=w.stringBoundary(100,.01,.04);close(r.reflectedAmplitude,-1/3);close(r.transmittedAmplitude,2/3);close(r.reflectedEnergy,1/9);close(r.transmittedEnergy,8/9);},
  36(){close(w.movingWallEcho(1000,343,10).echoFrequency,1000*353/333);},
  37(){const r=w.machCone(680,343);close(r.mach,680/343);close(r.angleDegrees,Math.asin(343/680)*180/pi);},
  38(){const r=w.dampingFromAmplitudes(.1,.02,5,.5);close(r.decrement,Math.log(5)/5);close(r.gamma,Math.log(5)/2.5);close(r.quality,Math.sqrt((4*pi)**2+(Math.log(5)/2.5)**2)/(2*Math.log(5)/2.5));},
  39(){const r=w.springOscillator(2,800,8,20);close(r.resonance.omega,Math.sqrt(392));close(r.resonance.amplitude,20/Math.sqrt(25344));close(r.bandwidth,4);close(r.resonance.averagePower,4*392*400/25344);close(r.resonance.powerPeak,25);close(r.resonance.upperHalfPower-r.resonance.lowerHalfPower,4);},
  40(){const r=w.phasorSum([[2,0],[3,pi/3],[1.5,-pi/6]]),x=3.5+3*Math.sqrt(3)/4,y=3*Math.sqrt(3)/2-.75;close(r.real,x);close(r.imaginary,y);close(r.amplitude,Math.hypot(x,y));close(r.phase,Math.atan2(y,x));},
  41(){const r=w.lissajous(2,3,1,1,-pi/3);close(r.ellipse.crossCoefficient,-1);close(r.ellipse.rightSide,.75);for(const [x,y] of r.points)close((x/2)**2+(y/3)**2-x*y/6,.75);},
  42(){const r=w.standingWave(.04,5*pi,200*pi,.5);close(r.speed,40);close(r.wavelength,.4);close(r.componentAmplitude,.02);r.nodes.forEach(x=>close(Math.sin(5*pi*x),0));r.antinodes.forEach(x=>close(Math.abs(Math.sin(5*pi*x)),1));assert.match(r.componentFormula,/sen\(kx−ωt\).*sen\(kx\+ωt\)/);},
  43(){close(w.materialWaveSpeed(200e9,7850).speed,Math.sqrt(200e9/7850));close(w.materialWaveSpeed(2.2e9,1000).speed,Math.sqrt(2.2e6));},
  44(){const r=w.pointSourceSound(50,10);close(r.intensity,1/(8*pi));close(r.decibels,10*Math.log10(1/(8*pi*1e-12)));close(w.pointSourceDistanceForLevel(50,60).distance,Math.sqrt(50/(4*pi*1e-6)));},
  45(){const r=w.electromagneticWave(300);close(r.magneticPeak,300/c);close(r.averageIntensity,.5*8.8541878128e-12*c*90000);close(r.absorbingPressure,.5*8.8541878128e-12*90000);},
  46(){const r=w.refractiveMedium(1.33,500e-9),b=w.normalIncidence(1,1.5);close(r.speed,c/1.33);close(r.wavelength,500e-9/1.33);close(b.reflectance,.04);close(b.transmittance,.96);},
  47(){const r=w.polarizerChain(100,[0,45,90]);r.after.forEach((v,i)=>close(v,[50,25,12.5][i]));},
  48(){const r=w.youngInterference(550e-9,.3e-3,2,3,1,1.5,10e-6);close(r.bright,.011);close(r.dark,.0055);close(r.filmShift,1/30);},
  49(){const r=w.soapFilmConstructive(1.33,300e-9);assert.equal(r.wavelengths,null);assert.match(r.formula,/4nt\/\(2m\+1\)/);const band=w.soapFilmConstructive(1.33,300e-9,[380e-9,750e-9]);assert.equal(band.wavelengths.length,1);close(band.wavelengths[0].wavelength,532e-9);},
  50(){close(w.newtonRing(1,589e-9,5,true).radius,Math.sqrt(2.945e-6));close(w.newtonRing(1,589e-9,3,false).radius,Math.sqrt(2.0615e-6));},
};
for(const [id,check] of Object.entries(checks))test(`Ondas guía ${id}: oráculo independiente`,check);

test('conversión de ondas exige un dato positivo y rechaza conflicto o desbordamiento',()=>{
  assert.throws(()=>w.waveRelation(343),/solo una/);
  assert.throws(()=>w.waveRelation(343,{frequency:440,wavelength:1}),/solo una/);
  assert.throws(()=>w.waveRelation(343,{frequency:0}),/positivo/);
  assert.throws(()=>w.waveRelation(1e308,{frequency:1e-308}),/rango/);
});
test('decaimiento exige un modelo pasivo y admite la ausencia de pérdidas',()=>{
  assert.throws(()=>w.dampingFromAmplitudes(.1,.2,5,.5),/superar/);
  assert.throws(()=>w.dampingFromAmplitudes(.1,.02,2.5,.5),/entero/);
  assert.equal(w.dampingFromAmplitudes(.1,.1,5,.5).quality,Infinity);
});
test('resonancia distingue pico de potencia, pico de amplitud y amortiguamiento fuerte',()=>{
  const r=w.springOscillator(1,100,2,10);
  const powerAt=omega=>w.springOscillator(1,100,2,10,omega).forced.averagePower;
  close(powerAt(r.resonance.lowerHalfPower),r.resonance.powerPeak/2);
  close(powerAt(r.resonance.upperHalfPower),r.resonance.powerPeak/2);
  assert.ok(r.resonance.omega<r.resonance.powerPeakOmega);
  const strong=w.springOscillator(1,100,30,10);
  assert.equal(strong.resonance.omega,0);close(strong.resonance.amplitude,.1);
  assert.equal(w.springOscillator(1,100,0,10).resonance,null);
});
test('Lissajous distingue elipse, segmento y frecuencias diferentes',()=>{
  assert.equal(w.lissajous(2,3,1,1,0).ellipse.degenerate,true);
  assert.equal(w.lissajous(2,3,1,1,Math.PI/3).ellipse.degenerate,false);
  assert.equal(w.lissajous(0,3,1,1,0).ellipse,null);
});
