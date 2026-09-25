// Álgebra lineal: operaciones vectoriales puras.

export const vmag = (vector, dimension) => dimension === 3
  ? Math.sqrt(vector.vx ** 2 + vector.vy ** 2 + vector.vz ** 2)
  : Math.sqrt(vector.vx ** 2 + vector.vy ** 2);

export const vdot = (a, b, dimension) =>
  a.vx * b.vx + a.vy * b.vy + (dimension === 3 ? a.vz * b.vz : 0);

export const vcross = (a, b) => ({
  x: a.vy * b.vz - a.vz * b.vy,
  y: a.vz * b.vx - a.vx * b.vz,
  z: a.vx * b.vy - a.vy * b.vx,
});

export const vangle = (a, b, dimension) => {
  const dot = vdot(a, b, dimension);
  const magnitudeA = vmag(a, dimension);
  const magnitudeB = vmag(b, dimension);
  return !magnitudeA || !magnitudeB ? 0
    : Math.acos(Math.max(-1, Math.min(1, dot / (magnitudeA * magnitudeB)))) * 180 / Math.PI;
};

export const vproj = (a, b, dimension) => {
  const magnitudeB = vmag(b, dimension);
  return magnitudeB ? vdot(a, b, dimension) / magnitudeB : 0;
};

export function combineVectors(selection,operation,dimension){
  if(operation==='+') return {
    vx:selection.reduce((sum,v)=>sum+v.vx,0),
    vy:selection.reduce((sum,v)=>sum+v.vy,0),
    vz:selection.reduce((sum,v)=>sum+v.vz,0),scalar:false,
  };
  if(operation==='−') return {
    vx:selection.slice(1).reduce((sum,v)=>sum-v.vx,selection[0].vx),
    vy:selection.slice(1).reduce((sum,v)=>sum-v.vy,selection[0].vy),
    vz:selection.slice(1).reduce((sum,v)=>sum-v.vz,selection[0].vz),scalar:false,
  };
  if(operation==='×'){
    const cross=vcross(selection[0],selection[1]);
    return {vx:cross.x,vy:cross.y,vz:cross.z,scalar:false};
  }
  if(operation==='·') return {scalar:true,sv:vdot(selection[0],selection[1],dimension)};
  return null;
}
