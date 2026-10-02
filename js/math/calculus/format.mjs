// ── Resultado exacto: fracción / constante ──
export function toExact(v){
  if(!isFinite(v)) return v>0?'+∞':'-∞';
  if(Math.abs(v)<1e-10) return '0';
  if(Math.abs(v)>1e12) return v>0?'+∞':'-∞';
  if(Math.abs(v-Math.round(v))<1e-8) return String(Math.round(v));
  const neg=v<0; const av=Math.abs(v);
  for(let d=2;d<=200;d++){
    const n=Math.round(av*d);
    if(n>0&&Math.abs(n/d-av)<5e-8) return (neg?'-':'')+n+'/'+d;
  }
  for(let d=1;d<=16;d++){
    const n=Math.round(v*d/Math.PI);
    if(n!==0&&Math.abs(n*Math.PI/d-v)<1e-7){
      const ns=Math.abs(n)===1?(n<0?'-':''):(n+'');
      return ns+'π'+(d===1?'':'/'+d);
    }
  }
  for(let r=2;r<=15;r++){
    const sq=Math.sqrt(r);
    for(let d=1;d<=30;d++){
      const n=Math.round(av*d/sq);
      if(n>0&&Math.abs(n*sq/d-av)<5e-8){
        const ns=n===1?'':(n+'');
        return (neg?'-':'')+ns+'√'+r+(d===1?'':'/'+d);
      }
    }
  }
  // e y potencias enteras de e
  if(Math.abs(v-Math.E)<1e-7) return 'e';
  if(Math.abs(v+Math.E)<1e-7) return '-e';
  if(v>0){
    const lne=Math.log(v);
    if(isFinite(lne)){
      const k=Math.round(lne);
      if(k!==0&&Math.abs(lne-k)<1e-6){
        if(k===1) return 'e';
        if(k===-1) return '1/e';
        return 'e^'+k;
      }
    }
  }
  // √π
  if(Math.abs(v-Math.sqrt(Math.PI))<1e-7) return '√π';
  if(Math.abs(v+Math.sqrt(Math.PI))<1e-7) return '-√π';
  return null;
}

export function fmtResult(v){
  if(v===null||v===undefined||isNaN(v)) return null;
  if(!isFinite(v)) return v>0?'+∞':'-∞';
  if(Math.abs(v)>1e12) return v>0?'+∞':'-∞';
  const ex=toExact(v); if(ex) return ex;
  return parseFloat(v.toFixed(8)).toString();
}

export function fmtNum(v,dp=6){
  if(v===null||v===undefined||isNaN(v)) return 'indef.';
  if(!isFinite(v)) return v>0?'+∞':'-∞';
  if(Math.abs(v)<1e-10) return '0';
  if(Math.abs(v)>1e12) return v>0?'+∞':'-∞';
  return parseFloat(v.toFixed(dp)).toString();
}

export function fmtA(s){ return (s||'').trim().replace('Infinity','∞').replace('-Infinity','-∞'); }
