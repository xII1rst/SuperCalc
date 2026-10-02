// ─────────────────────────────────────────────────────
// GAUSS
// ─────────────────────────────────────────────────────
export function emRenderGauss(){
  const p=document.getElementById('em-pGauss');
  if(!p)return;
  p.innerHTML=`
  <div class="em-section-title">Ley de Gauss — Flujo Eléctrico</div>
  <div class="em-formula">&oint; E&middot;dA = Q<sub>enc</sub>/&epsilon;<sub>0</sub> &nbsp;|&nbsp; &epsilon;<sub>0</sub> = 8.854&times;10<sup>&minus;12</sup> F/m</div>
  <div class="em-section-title" style="margin-top:8px">Geometría de la superficie gaussiana</div>
  <div class="em-input-row">
    <div class="em-input-group">
      <label>Geometría</label>
      <select id="em-gauss-geo" style="background:var(--surface3);border:1px solid var(--border);border-radius:6px;color:var(--text1);font-family:var(--font-math);font-size:13px;padding:7px 8px;width:100%">
        <option value="sphere">Esfera</option>
        <option value="cylinder">Cilindro</option>
        <option value="plane">Plano infinito</option>
      </select>
    </div>
    <div class="em-input-group"><label>Q_enc (C)</label><input id="em-qenc" value="1e-9"></div>
  </div>
  <div class="em-input-row">
    <div class="em-input-group"><label>r o d (m)</label><input id="em-gauss-r" value="0.1"></div>
    <div class="em-input-group"><label>L (m) — cilindro</label><input id="em-gauss-L" value="1"></div>
  </div>
  <button class="em-action-btn" data-action="emCalcGauss">Calcular flujo y campo</button>
  <div id="em-res-gauss"></div>`;
}

// ─────────────────────────────────────────────────────
// POTENCIAL ELÉCTRICO
// ─────────────────────────────────────────────────────
export function emRenderPotential(){
  const p=document.getElementById('em-pPotential');
  if(!p)return;
  p.innerHTML=`
  <div class="em-section-title">Potencial Eléctrico</div>
  <div class="em-formula">V = k&middot;Q/r &nbsp;|&nbsp; &Delta;V = V<sub>B</sub> &minus; V<sub>A</sub> &nbsp;|&nbsp; W = q&middot;&Delta;V</div>
  <div class="em-input-row">
    <div class="em-input-group"><label>Q (C)</label><input id="em-vQ" value="1e-6"></div>
    <div class="em-input-group"><label>r_A (m)</label><input id="em-vra" value="0.1"></div>
    <div class="em-input-group"><label>r_B (m)</label><input id="em-vrb" value="0.3"></div>
  </div>
  <div class="em-input-row">
    <div class="em-input-group"><label>q prueba (C)</label><input id="em-vq" value="1e-9"></div>
  </div>
  <button class="em-action-btn" data-action="emCalcPotential">Calcular</button>
  <div id="em-res-potential"></div>`;
}

// ─────────────────────────────────────────────────────
// FUERZA DE LORENTZ
// ─────────────────────────────────────────────────────
export function emRenderLorentz(){
  const p=document.getElementById('em-pLorentz');
  if(!p)return;
  p.innerHTML=`
  <div class="em-section-title">Fuerza de Lorentz</div>
  <div class="em-formula"><b>F</b> = q(<b>E</b> + <b>v</b> &times; <b>B</b>)</div>
  <div class="em-section-title" style="margin-top:8px">Carga y velocidad</div>
  <div class="em-input-row">
    <div class="em-input-group"><label>q (C)</label><input id="em-lq" value="1.6e-19"></div>
  </div>
  <div class="em-input-row">
    <div class="em-input-group"><label>vx (m/s)</label><input id="em-lvx" value="1e6"></div>
    <div class="em-input-group"><label>vy</label><input id="em-lvy" value="0"></div>
    <div class="em-input-group"><label>vz</label><input id="em-lvz" value="0"></div>
  </div>
  <div class="em-section-title">Campo eléctrico E⃗ (N/C)</div>
  <div class="em-input-row">
    <div class="em-input-group"><label>Ex</label><input id="em-lex" value="0"></div>
    <div class="em-input-group"><label>Ey</label><input id="em-ley" value="1e4"></div>
    <div class="em-input-group"><label>Ez</label><input id="em-lez" value="0"></div>
  </div>
  <div class="em-section-title">Campo magnético B⃗ (T)</div>
  <div class="em-input-row">
    <div class="em-input-group"><label>Bx</label><input id="em-lbx" value="0"></div>
    <div class="em-input-group"><label>By</label><input id="em-lby" value="0"></div>
    <div class="em-input-group"><label>Bz</label><input id="em-lbz" value="0.5"></div>
  </div>
  <button class="em-action-btn" data-action="emCalcLorentz">Calcular fuerza</button>
  <div id="em-res-lorentz"></div>`;
}

// ─────────────────────────────────────────────────────
// FARADAY — Inducción electromagnética
// ─────────────────────────────────────────────────────
export function emRenderFaraday(){
  const p=document.getElementById('em-pFaraday');
  if(!p)return;
  p.innerHTML=`
  <div class="em-section-title">Ley de Faraday — Inducción</div>
  <div class="em-formula">&varepsilon; = &minus;d&Phi;<sub>B</sub>/dt &nbsp;|&nbsp; &Phi;<sub>B</sub> = B&middot;A&middot;cos(&theta;)</div>
  <div class="em-input-row">
    <div class="em-input-group"><label>B (T)</label><input id="em-fb" value="0.5"></div>
    <div class="em-input-group"><label>A (m²)</label><input id="em-fa" value="0.01"></div>
    <div class="em-input-group"><label>θ (°)</label><input id="em-ftheta" value="0"></div>
  </div>
  <div class="em-input-row">
    <div class="em-input-group"><label>dB/dt (T/s)</label><input id="em-fdbdt" value="2"></div>
    <div class="em-input-group"><label>N vueltas</label><input id="em-fn" value="100"></div>
  </div>
  <button class="em-action-btn" data-action="emCalcFaraday">Calcular FEM</button>
  <div id="em-res-faraday"></div>`;
}

// ─────────────────────────────────────────────────────
// MAXWELL — Las 4 ecuaciones
// ─────────────────────────────────────────────────────
export function emRenderMaxwell(){
  const p=document.getElementById('em-pMaxwell');
  if(!p)return;
  p.innerHTML=`
  <div class="em-section-title">Ecuaciones de Maxwell</div>
  <div class="em-formula" style="line-height:2">
    &nabla;&middot;E = &rho;/&epsilon;<sub>0</sub> &nbsp;&nbsp;&nbsp;(Gauss el&eacute;ctrico)<br>
    &nabla;&middot;B = 0 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(Gauss magn&eacute;tico)<br>
    &nabla;&times;E = &minus;&part;B/&part;t &nbsp;(Faraday)<br>
    &nabla;&times;B = &mu;<sub>0</sub>J + &mu;<sub>0</sub>&epsilon;<sub>0</sub>&part;E/&part;t &nbsp;(Amp&egrave;re-Maxwell)
  </div>
  <div class="em-section-title" style="margin-top:8px">Onda electromagnética en el vacío</div>
  <div class="em-formula">c = 1/&radic;(&mu;<sub>0</sub>&epsilon;<sub>0</sub>) &nbsp;|&nbsp; E = c&middot;B &nbsp;|&nbsp; S₀ = E₀B₀/&mu;<sub>0</sub> &nbsp;|&nbsp; &lang;S&rang; = S₀/2</div>
  <div class="em-input-row">
    <div class="em-input-group"><label>E₀ (N/C)</label><input id="em-mE0" value="1000"></div>
    <div class="em-input-group"><label>f (Hz)</label><input id="em-mf" value="1e9"></div>
  </div>
  <button class="em-action-btn" data-action="emCalcMaxwell">Calcular onda EM</button>
  <div id="em-res-maxwell"></div>`;
}
