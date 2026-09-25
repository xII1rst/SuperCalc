// Geometría del triángulo definido por tres puntos cartesianos en R³.
export function triangleGeometry(P, Q, R) {
  const subtract = (a, b) => ({ x: a.x-b.x, y: a.y-b.y, z: a.z-b.z });
  const magnitude = v => Math.sqrt(v.x**2+v.y**2+v.z**2);
  const dot = (a, b) => a.x*b.x+a.y*b.y+a.z*b.z;
  const angle = (a, b) => {
    const ma=magnitude(a), mb=magnitude(b);
    if(!ma||!mb) return 0;
    return Math.acos(Math.max(-1,Math.min(1,dot(a,b)/(ma*mb))))*180/Math.PI;
  };
  const PQ=subtract(Q,P), QR=subtract(R,Q), PR=subtract(R,P);
  const QP=subtract(P,Q), RP=subtract(P,R), RQ=subtract(Q,R);
  const dPQ=magnitude(PQ), dQR=magnitude(QR), dPR=magnitude(PR);
  const angP=angle(PQ,PR), angQ=angle(QP,QR), angR=angle(RP,RQ);
  const cr={
    x:PQ.y*PR.z-PQ.z*PR.y,
    y:PQ.z*PR.x-PQ.x*PR.z,
    z:PQ.x*PR.y-PQ.y*PR.x,
  };
  const crossMag=magnitude(cr);
  return {
    PQ, QR, PR, QP, RP, RQ, dPQ, dQR, dPR,
    angP, angQ, angR, sumAng:angP+angQ+angR,
    cr, crossMag, area:crossMag/2,
    dotPQPR:dot(PQ,PR), dotQPQR:dot(QP,QR), dotRPRQ:dot(RP,RQ),
  };
}
