import { createFormulaBackground } from '../graphics/formula-background.mjs';

const background = document.getElementById('sc-bg-canvas');
if (background) createFormulaBackground(background).start();

// Animación de los electrones del logo, independiente del fondo.
(function animateLogo(){
  const e1 = document.getElementById('sc-e1');
  const e2 = document.getElementById('sc-e2');
  const e3 = document.getElementById('sc-e3');
  if (!e1 || !e2 || !e3) return;

  const rx = 88, ry = 24;
  const orbits = [
    { element:e1, rotation:0, angle:0, speed:.012 },
    { element:e2, rotation:Math.PI/3, angle:2.1, speed:.010 },
    { element:e3, rotation:-Math.PI/3, angle:4.2, speed:.011 },
  ];
  let tick = 0;
  function frame(){
    if (!document.hidden) {
      tick++;
      for (const orbit of orbits) {
        const angle = orbit.angle + tick*orbit.speed;
        const x = rx*Math.cos(angle), y = ry*Math.sin(angle);
        const c = Math.cos(orbit.rotation), s = Math.sin(orbit.rotation);
        orbit.element.setAttribute('transform',
          `translate(${(x*c-y*s).toFixed(2)},${(x*s+y*c).toFixed(2)})`);
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
