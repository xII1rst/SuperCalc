// Formatos numéricos compartidos; independientes del DOM y de canvas.

export function fDMS(deg) {
  if (isNaN(deg) || !isFinite(deg)) return '—';
  const sign = deg < 0 ? '-' : '';
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const mf = (abs - d) * 60;
  const m = Math.floor(mf);
  const s = Math.round((mf - m) * 60);
  if (s === 60) return fDMS(sign ? -(d + m / 60 + 1 / 60) : d + m / 60 + 1 / 60);
  return `${sign}${d}°${String(m).padStart(2, '0')}'${String(s).padStart(2, '0')}"`;
}

export function fN(v, d = 6) {
  if (v === undefined || v === null || isNaN(v)) return 'indefinido';
  if (!isFinite(v)) return v > 0 ? '+∞' : '-∞';
  if (Math.abs(v) < 1e-9) return '0';
  if (Math.abs(v) >= 1e6 || Math.abs(v) < 1e-4 && Math.abs(v) > 0) return v.toExponential(4);
  return parseFloat(v.toFixed(d)).toString();
}

export function matFmtNum(n, d = 4) {
  if (isNaN(n) || !isFinite(n)) return '—';
  const rounded = parseFloat(n.toFixed(d));
  return rounded === 0 ? '0' : String(rounded);
}

export function emFmt(v, dec = 4) {
  if (v === null || v === undefined || isNaN(v)) return '—';
  if (Math.abs(v) === 0) return '0';
  if (Math.abs(v) >= 1e4 || Math.abs(v) < 1e-3 && v !== 0) {
    return v.toExponential(dec);
  }
  return parseFloat(v.toFixed(dec)).toString();
}

export function grafFmt(n){
  if(!isFinite(n)) return '—';
  const r=Math.round(n*10000)/10000;
  return r%1===0?r.toString():parseFloat(r.toFixed(4)).toString();
}

function gcd(a,b){a=Math.abs(Math.round(a));b=Math.abs(Math.round(b));while(b){let t=b;b=a%b;a=t;}return a||1;}

export function toFrac(x){
  if(!isFinite(x)||isNaN(x)) return '—';
  if(Math.abs(x)<1e-9) return '0';
  const sign=x<0?'-':''; x=Math.abs(x);
  let bN=Math.round(x),bD=1,bE=Math.abs(x-bN);
  for(let d=2;d<=500;d++){const n=Math.round(x*d),e=Math.abs(x-n/d);if(e<bE){bE=e;bN=n;bD=d;if(e<1e-9)break;}}
  if(bE>5e-4) return sign+x.toFixed(4);
  const g=gcd(bN,bD),n2=bN/g,d2=bD/g;
  return d2===1?sign+n2:sign+n2+'/'+d2;
}

export function formatMagnitude(x,formatNumber=fN){
  if(isNaN(x)||!isFinite(x)) return '—';
  if(x<0) return formatNumber(x);
  const rounded=Math.round(x);
  if(Math.abs(x-rounded)<1e-9) return String(rounded);
  const n2=x*x, n2r=Math.round(n2);
  if(Math.abs(n2-n2r)<1e-6 && n2r>0) return `√${n2r}`;
  return formatNumber(x);
}
