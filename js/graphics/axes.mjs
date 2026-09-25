// Intervalo de marcas compartido por los canvas de vectores y EM.
export function adaptiveStep(axLen) {
  if (axLen >= 50) return 10;
  if (axLen >= 21) return 5;
  return 2;
}

export function graphGridStep(range,targetDivs){
  const raw=range/targetDivs;
  const mag=Math.pow(10,Math.floor(Math.log10(Math.max(raw,1e-10))));
  const norm=raw/mag;
  let step;
  if(norm<1.5) step=1;
  else if(norm<3.5) step=2;
  else if(norm<7.5) step=5;
  else step=10;
  return step*mag;
}
