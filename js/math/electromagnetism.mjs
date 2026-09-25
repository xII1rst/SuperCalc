// Fórmulas físicas independientes del DOM y de canvas.
export const EM_K = 8.9875e9;
export const EM_MU0 = 4 * Math.PI * 1e-7;
export const EM_EPS0 = 8.854e-12;

export function toCartesian(a, b, c, coord) {
  if (coord === 'cart') return [a, b, c];
  if (coord === 'cyl') {
    const phi = b * Math.PI / 180;
    return [a * Math.cos(phi), a * Math.sin(phi), c];
  }
  const th = b * Math.PI / 180, ph = c * Math.PI / 180;
  return [a * Math.sin(th) * Math.cos(ph), a * Math.sin(th) * Math.sin(ph), a * Math.cos(th)];
}

export function coulomb(q1, q2, p1, p2) {
  const [x1, y1, z1] = p1, [x2, y2, z2] = p2;
  const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1;
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (dist < 1e-10) return null;
  const F = EM_K * Math.abs(q1) * Math.abs(q2) / (dist * dist);
  const sign = q1 * q2 < 0 ? 'Atractiva' : 'Repulsiva';
  const attract = q1 * q2 < 0;
  const ux = dx / dist, uy = dy / dist, uz = dz / dist;
  const fSign = q1 * q2 > 0 ? 1 : -1;
  const E = EM_K * Math.abs(q1) / (dist * dist);
  const eDir = q1 > 0 ? 1 : -1;
  return { dist, F, sign, attract, ux, uy, uz, fSign, E, eDir };
}

export function gauss(geo, Q, r, L) {
  const flux = Q / EM_EPS0;
  if (geo === 'sphere') return {
    flux, area: 4 * Math.PI * r * r,
    E: Q / (4 * Math.PI * EM_EPS0 * r * r),
  };
  if (geo === 'cylinder') return {
    flux, area: 2 * Math.PI * r * L,
    E: Q / (2 * Math.PI * EM_EPS0 * r * L),
  };
  return { flux, area: 1, E: Q / (2 * EM_EPS0) };
}

export function potential(Q, rA, rB, q) {
  const VA = EM_K * Q / rA;
  const VB = EM_K * Q / rB;
  const dV = VB - VA;
  const W = q * dV;
  const E_A = EM_K * Q / (rA * rA);
  const E_B = EM_K * Q / (rB * rB);
  return { VA, VB, dV, W, E_A, E_B };
}

export function lorentz(q, velocity, electric, magnetic) {
  const [vx, vy, vz] = velocity;
  const [Ex, Ey, Ez] = electric;
  const [Bx, By, Bz] = magnetic;
  const cxB = vy * Bz - vz * By, cyB = vz * Bx - vx * Bz, czB = vx * By - vy * Bx;
  const Fx = q * (Ex + cxB), Fy = q * (Ey + cyB), Fz = q * (Ez + czB);
  const Fmag = Math.sqrt(Fx * Fx + Fy * Fy + Fz * Fz);
  const vmag = Math.sqrt(vx * vx + vy * vy + vz * vz);
  const Emag = Math.sqrt(Ex * Ex + Ey * Ey + Ez * Ez);
  const Bmag = Math.sqrt(Bx * Bx + By * By + Bz * Bz);
  return { cxB, cyB, czB, Fx, Fy, Fz, Fmag, vmag, Emag, Bmag };
}

export function faraday(B, A, th, dBdt, N) {
  const thRad = th * Math.PI / 180;
  const flux = B * A * Math.cos(thRad);
  const dFluxDt = dBdt * A * Math.cos(thRad);
  const emf = -N * dFluxDt;
  return { thRad, flux, dFluxDt, emf };
}

export function maxwell(E0, f) {
  const c = 1 / Math.sqrt(EM_MU0 * EM_EPS0);
  const B0 = E0 / c;
  const lambda = c / f;
  const omega = 2 * Math.PI * f;
  const k = omega / c;
  const S = E0 * B0 / EM_MU0;
  const uE = 0.5 * EM_EPS0 * E0 * E0;
  const uB = 0.5 * B0 * B0 / EM_MU0;
  return { c, B0, lambda, omega, k, S, uE, uB };
}

export function potentialEnergy(q1,q2,r){
  if(!Number.isFinite(q1)||!Number.isFinite(q2)||!Number.isFinite(r)||r<=0) return null;
  return EM_K*q1*q2/r;
}

export function parallelPlateCapacitance(area,distance,relativePermittivity=1){
  if(!Number.isFinite(area)||area<=0||!Number.isFinite(distance)||distance<=0||
    !Number.isFinite(relativePermittivity)||relativePermittivity<=0) return null;
  return relativePermittivity*EM_EPS0*area/distance;
}

export function magneticFieldWire(current,radius){
  if(!Number.isFinite(current)||!Number.isFinite(radius)||radius<=0) return null;
  return EM_MU0*current/(2*Math.PI*radius);
}

export function inductance(turns,fluxPerTurn,current){
  if(!Number.isFinite(turns)||turns<=0||!Number.isFinite(fluxPerTurn)||
    !Number.isFinite(current)||current===0) return null;
  const L=turns*fluxPerTurn/current;
  if(L<0) return null;
  return {L,energy:0.5*L*current*current};
}

export function ohmsLaw({voltage,current,resistance}){
  const values=[voltage,current,resistance];
  const known=values.filter(Number.isFinite).length;
  if(known<2) return null;
  if(known===3){
    if(Math.abs(voltage-current*resistance)>1e-9*Math.max(1,Math.abs(voltage))) return null;
    return {voltage,current,resistance,power:voltage*current};
  }
  if(!Number.isFinite(voltage)) voltage=current*resistance;
  else if(!Number.isFinite(current)){
    if(resistance===0) return null;
    current=voltage/resistance;
  } else {
    if(current===0) return null;
    resistance=voltage/current;
  }
  return {voltage,current,resistance,power:voltage*current};
}

export function rcCircuit(resistance,capacitance,initialVoltage,time){
  if(!Number.isFinite(resistance)||resistance<=0||!Number.isFinite(capacitance)||capacitance<=0||
    !Number.isFinite(initialVoltage)||!Number.isFinite(time)||time<0) return null;
  const tau=resistance*capacitance,decay=Math.exp(-time/tau);
  return {tau,chargeVoltage:initialVoltage*(1-decay),
    dischargeVoltage:initialVoltage*decay,
    chargeCurrent:initialVoltage/resistance*decay,
    dischargeCurrent:-initialVoltage/resistance*decay};
}

export function inducedEmf(turns,initialFlux,finalFlux,deltaTime){
  if(!Number.isFinite(turns)||turns<=0||!Number.isFinite(initialFlux)||!Number.isFinite(finalFlux)||
    !Number.isFinite(deltaTime)||deltaTime<=0) return null;
  const deltaFlux=finalFlux-initialFlux;
  return {deltaFlux,emf:-turns*deltaFlux/deltaTime};
}
