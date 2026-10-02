import { fDMS } from '../../../utils/format.mjs';
import { triangleGeometry } from '../../../math/algebra/triangle.mjs';

// Triángulo desde tres puntos. Se crea una vez con las dependencias del núcleo de vectores.
export function createTriangleTools({ fN, fMag, triDrawCanvas }) {
function triGet(id){ return parseFloat(document.getElementById(id).value)||0; }

// ══════════════════════════════════════════════════════
function triClear(){
  document.getElementById('tri-res').innerHTML='';
  ['px','py','pz','qx','qy','qz','rx','ry','rz'].forEach(k=>{
    const el=document.getElementById('tri-'+k);
    if(el) el.value='0';
  });
}

function triCalc(){
  const P={x:triGet('tri-px'),y:triGet('tri-py'),z:triGet('tri-pz')};
  const Q={x:triGet('tri-qx'),y:triGet('tri-qy'),z:triGet('tri-qz')};
  const R={x:triGet('tri-rx'),y:triGet('tri-ry'),z:triGet('tri-rz')};

  const {
    PQ, QR, PR, QP, RP, RQ, dPQ, dQR, dPR,
    angP, angQ, angR, sumAng,
    cr, crossMag, area, dotPQPR, dotQPQR, dotRPRQ,
  }=triangleGeometry(P,Q,R);
  const fmt=v=>fN(v,4);

  // ── Construir HTML de resultados ──
  const mkStepCard=(title,color,steps)=>`
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:11px 13px;margin-bottom:8px">
      <div style="font-family:var(--font-ui);font-size:13px;font-weight:700;color:${color};margin-bottom:8px;">${title}</div>
      ${steps.map(s=>`<div style="font-family:var(--font-math);font-size:12px;color:var(--text-soft);line-height:1.9;padding:1px 0">${s}</div>`).join('')}
    </div>`;

  const mkResult=(label,value,color='var(--accent)')=>`
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:9px 12px;flex:1;min-width:0">
      <div style="font-family:var(--font-math);font-size:12px;color:var(--text3);margin-bottom:3px">${label}</div>
      <div style="font-family:var(--font-math);font-size:15px;color:${color};font-weight:700">${value}</div>
    </div>`;

  // Pasos lado PQ
  const stepsPQ=[
    `<b style="color:var(--gold)">PQ</b> = Q − P`,
    `= (${Q.x}−${P.x}, ${Q.y}−${P.y}, ${Q.z}−${P.z})`,
    `= <b>(${fmt(PQ.x)}, ${fmt(PQ.y)}, ${fmt(PQ.z)})</b>`,
    `|<b>PQ</b>| = √(${fmt(PQ.x)}² + ${fmt(PQ.y)}² + ${fmt(PQ.z)}²)`,
    `= √(${fmt(PQ.x**2)} + ${fmt(PQ.y**2)} + ${fmt(PQ.z**2)})`,
    `= √${fmt(PQ.x**2+PQ.y**2+PQ.z**2)} = <b>${fMag(dPQ)}</b>`,
  ];
  const stepsQR=[
    `<b style="color:var(--blue)">QR</b> = R − Q`,
    `= (${R.x}−${Q.x}, ${R.y}−${Q.y}, ${R.z}−${Q.z})`,
    `= <b>(${fmt(QR.x)}, ${fmt(QR.y)}, ${fmt(QR.z)})</b>`,
    `|<b>QR</b>| = √(${fmt(QR.x)}² + ${fmt(QR.y)}² + ${fmt(QR.z)}²)`,
    `= √${fmt(QR.x**2+QR.y**2+QR.z**2)} = <b>${fMag(dQR)}</b>`,
  ];
  const stepsPR=[
    `<b style="color:var(--green)">PR</b> = R − P`,
    `= (${R.x}−${P.x}, ${R.y}−${P.y}, ${R.z}−${P.z})`,
    `= <b>(${fmt(PR.x)}, ${fmt(PR.y)}, ${fmt(PR.z)})</b>`,
    `|<b>PR</b>| = √(${fmt(PR.x)}² + ${fmt(PR.y)}² + ${fmt(PR.z)}²)`,
    `= √${fmt(PR.x**2+PR.y**2+PR.z**2)} = <b>${fMag(dPR)}</b>`,
  ];

  // Pasos ángulo P
  const stepsAngP=[
    `cos P = (<b>PQ · PR</b>) / (|PQ|·|PR|)`,
    `<b>PQ · PR</b> = (${fmt(PQ.x)})(${fmt(PR.x)}) + (${fmt(PQ.y)})(${fmt(PR.y)}) + (${fmt(PQ.z)})(${fmt(PR.z)})`,
    `= ${fmt(PQ.x*PR.x)} + ${fmt(PQ.y*PR.y)} + ${fmt(PQ.z*PR.z)} = <b>${fmt(dotPQPR)}</b>`,
    `cos P = ${fmt(dotPQPR)} / (${fmt(dPQ)} × ${fmt(dPR)})`,
    `cos P = ${fmt(dotPQPR)} / ${fmt(dPQ*dPR)} = ${fmt(dotPQPR/(dPQ*dPR))}`,
    `P = cos⁻¹(${fmt(dotPQPR/(dPQ*dPR))}) = <b>${fDMS(angP)}</b>`,
  ];
  const stepsAngQ=[
    `cos Q = (<b>QP · QR</b>) / (|QP|·|QR|)`,
    `<b>QP · QR</b> = (${fmt(QP.x)})(${fmt(QR.x)}) + (${fmt(QP.y)})(${fmt(QR.y)}) + (${fmt(QP.z)})(${fmt(QR.z)})`,
    `= ${fmt(QP.x*QR.x)} + ${fmt(QP.y*QR.y)} + ${fmt(QP.z*QR.z)} = <b>${fmt(dotQPQR)}</b>`,
    `cos Q = ${fmt(dotQPQR)} / (${fmt(dPQ)} × ${fmt(dQR)})`,
    `cos Q = ${fmt(dotQPQR)} / ${fmt(dPQ*dQR)} = ${fmt(dotQPQR/(dPQ*dQR))}`,
    `Q = cos⁻¹(${fmt(dotQPQR/(dPQ*dQR))}) = <b>${fDMS(angQ)}</b>`,
  ];
  const stepsAngR=[
    `cos R = (<b>RP · RQ</b>) / (|RP|·|RQ|)`,
    `<b>RP · RQ</b> = (${fmt(RP.x)})(${fmt(RQ.x)}) + (${fmt(RP.y)})(${fmt(RQ.y)}) + (${fmt(RP.z)})(${fmt(RQ.z)})`,
    `= ${fmt(RP.x*RQ.x)} + ${fmt(RP.y*RQ.y)} + ${fmt(RP.z*RQ.z)} = <b>${fmt(dotRPRQ)}</b>`,
    `cos R = ${fmt(dotRPRQ)} / (${fmt(dPR)} × ${fmt(dQR)})`,
    `cos R = ${fmt(dotRPRQ)} / ${fmt(dPR*dQR)} = ${fmt(dotRPRQ/(dPR*dQR))}`,
    `R = cos⁻¹(${fmt(dotRPRQ/(dPR*dQR))}) = <b>${fDMS(angR)}</b>`,
  ];

  // Pasos área
  const stepsArea=[
    `<b>PQ × PR</b> — producto vectorial`,
    `i: (${fmt(PQ.y)})(${fmt(PR.z)}) − (${fmt(PQ.z)})(${fmt(PR.y)}) = <b>${fmt(cr.x)}</b>`,
    `j: (${fmt(PQ.z)})(${fmt(PR.x)}) − (${fmt(PQ.x)})(${fmt(PR.z)}) = <b>${fmt(cr.y)}</b>`,
    `k: (${fmt(PQ.x)})(${fmt(PR.y)}) − (${fmt(PQ.y)})(${fmt(PR.x)}) = <b>${fmt(cr.z)}</b>`,
    `|<b>PQ × PR</b>| = √(${fmt(cr.x)}² + ${fmt(cr.y)}² + ${fmt(cr.z)}²) = ${fMag(crossMag)}`,
    `Área = |PQ × PR| / 2 = ${fmt(crossMag)} / 2 = <b>${fMag(area)}</b>`,
  ];

  const verif=Math.abs(sumAng-180)<0.01
    ?`<span style="color:var(--green)">${fDMS(angP)} + ${fDMS(angQ)} + ${fDMS(angR)} = ${fmt(sumAng)}° ≈ 180°</span>`
    :`<span style="color:var(--red)">Suma = ${fmt(sumAng)}° (revisar datos)</span>`;

  document.getElementById('tri-res').innerHTML=`
    <!-- Resumen superior -->
    <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">
      ${mkResult('Lado PQ', fMag(dPQ), 'var(--gold)')}
      ${mkResult('Lado QR', fMag(dQR), 'var(--blue)')}
      ${mkResult('Lado PR', fMag(dPR), 'var(--green)')}
    </div>
    <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">
      ${mkResult('Ángulo P', fDMS(angP), 'var(--gold)')}
      ${mkResult('Ángulo Q', fDMS(angQ), 'var(--blue)')}
      ${mkResult('Ángulo R', fDMS(angR), 'var(--green)')}
    </div>
    <div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap">
      ${mkResult('Perímetro', fMag(dPQ+dQR+dPR))}
      ${mkResult('Área', fMag(area))}
    </div>
    <div style="font-family:var(--font-math);font-size:12px;margin-bottom:14px;padding:7px 12px;background:var(--surface2);border-radius:8px;border:1px solid var(--border)">${verif}</div>

    <!-- Pasos colapsables -->
    <div class="section-title" style="margin-bottom:8px">A) Lados del triángulo</div>
    ${mkStepCard('Lado PQ = Q − P', 'var(--gold)', stepsPQ)}
    ${mkStepCard('Lado QR = R − Q', 'var(--blue)', stepsQR)}
    ${mkStepCard('Lado PR = R − P', 'var(--green)', stepsPR)}

    <div class="section-title" style="margin-top:14px;margin-bottom:8px">C) Ángulos internos</div>
    ${mkStepCard('Ángulo en P', 'var(--gold)', stepsAngP)}
    ${mkStepCard('Ángulo en Q', 'var(--blue)', stepsAngQ)}
    ${mkStepCard('Ángulo en R', 'var(--green)', stepsAngR)}

    <div class="section-title" style="margin-top:14px;margin-bottom:8px">Área del triángulo</div>
    ${mkStepCard('Producto vectorial PQ × PR', 'var(--al2)', stepsArea)}
  `;

  // ── Graficar en el canvas 3D ──
  // Añadir los 3 puntos como vectores temporales y dibujar
  triDrawCanvas(P, Q, R);
}

return { triGet, triClear, triCalc };
}
