import { readCanvasPalette } from './colors.mjs';

const FORMULAS = [
  'E = mc²','F = ma','PV = nRT','a² + b² = c²','p = mv','τ = r × F',
  'W = ΔKE','v = λf','v² = u² + 2as','s = ut + ½at²','T = 2π√(L/g)',
  'F = −kx','L = Iω','K = ½mv²','P = Fv','J = FΔt','ω = dθ/dt',
  '∇·E = ρ/ε₀','∇×B = μ₀J','F = kq₁q₂/r²','∮E·dA = Q/ε₀',
  'V = IR','P = IV','Z = R + jX','ε = −dΦ/dt','B = μ₀I/2πr',
  'λ = h/p','Ψ(x,t)','ΔxΔp ≥ ħ/2','β = v/c','E = hf','Ĥψ = Eψ',
  '∂f/∂x','dy/dx','∇²φ = 0','∂²u/∂t²','∫₀^∞ e⁻ˣ dx',
  'lim(x→0)','f(x) = Σ aₙxⁿ','d/dx[eˣ] = eˣ','∬f dA',
  'det(A)','A·B = |A||B|cosθ','A×B = |A||B|sinθ','Ax = λx',
  'tr(A)','A⁻¹A = I','rank(A)','‖v‖ = √(Σvᵢ²)',
  'q = mcΔT','S = k·ln W','η = W/Q_H','ΔG = ΔH − TΔS',
  'Σᵢ xᵢ/n','P(A|B)','E[X]','σ² = E[(X−μ)²]','Cov(X,Y)',
  'n! = n(n-1)!','eⁱᵖ + 1 = 0','sin²θ + cos²θ = 1','i² = -1',
  'cosh²x − sinh²x = 1','log_b(xy)','ω = 2πf','|v| = √(x²+y²)',
  'α','β','γ','δ','ε','θ','λ','μ','ν','ρ','σ','τ','φ','ψ','ω','ξ',
  '∞','∫','∂','∇','∑','Π','√','±','≈','≠','∈','∅','ħ','Δ','∮','ℝ','ℂ','ℕ',
];

const LAYERS = [
  {share:.30,sizeMin:18,sizeMax:32,opacityMin:.022,opacityMax:.055,speedX:.12,speedY:.06},
  {share:.45,sizeMin:10,sizeMax:18,opacityMin:.04,opacityMax:.09,speedX:.24,speedY:.13},
  {share:.25,sizeMin:7,sizeMax:12,opacityMin:.055,opacityMax:.13,speedX:.38,speedY:.20},
];
const COLOR_TOKENS = ['formula-1-rgb','formula-2-rgb','formula-3-rgb','formula-4-rgb','formula-5-rgb'];

export function createFormulaBackground(canvas, { win=window, doc=document, random=Math.random, readPalette=readCanvasPalette } = {}) {
  const ctx = canvas.getContext('2d');
  const motion = win.matchMedia?.('(prefers-reduced-motion: reduce)');
  let items = [], width = 0, height = 0, palette = [], opacityMultiplier = 1;
  let running = false, dirty = true, frameId = null, resizeTimer = null, lastTime = 0;

  const rand = (min,max) => min + random() * (max-min);

  function refreshTheme() {
    const color = readPalette();
    palette = COLOR_TOKENS.map(token => color(token));
    opacityMultiplier = Number(color('formula-opacity')) || 1;
    dirty = true;
  }

  function build() {
    width = Math.max(1, win.innerWidth);
    height = Math.max(1, win.innerHeight);
    canvas.width = width;
    canvas.height = height;
    items = [];
    const total = Math.floor(width * height / 6900);
    LAYERS.forEach((layer, layerIndex) => {
      for (let i=0, count=Math.round(total*layer.share); i<count; i++) {
        const angle = rand(0,Math.PI*2);
        const speed = rand(.7,1.3);
        items.push({
          text: FORMULAS[Math.floor(random()*FORMULAS.length)],
          x: rand(0,width), y: rand(0,height),
          size: rand(layer.sizeMin,layer.sizeMax),
          opacity: rand(layer.opacityMin,layer.opacityMax),
          angle: rand(-.225,.225), layer: layerIndex,
          colorIndex: Math.floor(random()*COLOR_TOKENS.length),
          vx: Math.cos(angle)*layer.speedX*speed,
          vy: Math.sin(angle)*layer.speedY*speed,
        });
      }
    });
    dirty = true;
  }

  function update(step) {
    for (const item of items) {
      item.x += item.vx*step;
      item.y += item.vy*step;
      if (item.x > width+40) item.x = -40;
      else if (item.x < -40) item.x = width+40;
      if (item.y > height+20) item.y = -20;
      else if (item.y < -20) item.y = height+20;
    }
    dirty = true;
  }

  function draw() {
    if (!dirty) return;
    ctx.clearRect(0,0,width,height);
    for (const item of items) {
      const opacity = Math.min(1,item.opacity*opacityMultiplier*(item.layer===0?.6:1));
      ctx.save();
      ctx.translate(item.x,item.y);
      ctx.rotate(item.angle);
      ctx.font = `${item.size}px "Space Mono", monospace`;
      ctx.fillStyle = `rgba(${palette[item.colorIndex]},${opacity})`;
      ctx.fillText(item.text,0,0);
      ctx.restore();
    }
    dirty = false;
  }

  function frame(time) {
    if (!running) return;
    if (doc.hidden) lastTime = 0;
    else if (motion?.matches) { lastTime = 0; draw(); }
    else {
      const step = lastTime ? Math.min(2,Math.max(0,(time-lastTime)/16.667)) : 1;
      lastTime = time;
      update(step);
      draw();
    }
    frameId = win.requestAnimationFrame(frame);
  }

  function onResize() {
    win.clearTimeout(resizeTimer);
    resizeTimer = win.setTimeout(build,120);
  }
  function onMotionChange() { lastTime = 0; dirty = true; }

  function start() {
    if (running) return;
    running = true;
    refreshTheme();
    build();
    win.addEventListener('resize',onResize);
    doc.addEventListener('supercalc:themechange',refreshTheme);
    motion?.addEventListener?.('change',onMotionChange);
    frameId = win.requestAnimationFrame(frame);
  }

  function stop() {
    if (!running) return;
    running = false;
    win.cancelAnimationFrame(frameId);
    win.clearTimeout(resizeTimer);
    win.removeEventListener('resize',onResize);
    doc.removeEventListener('supercalc:themechange',refreshTheme);
    motion?.removeEventListener?.('change',onMotionChange);
  }

  return { start, stop, refreshTheme, build };
}
