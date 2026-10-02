import { drawPreview } from './preview-renderer.mjs';
import { clearRevolutionSolid, drawRevolutionSolid } from './revolution.mjs';

let previewInitDone = false, previewTimer = null;

// ═══════════════════════════════════════════════════════
// VISTA PREVIA 2D EN VIVO
// ═══════════════════════════════════════════════════════
export function initLivePreviews(){
  if(previewInitDone) return;
  previewInitDone = true;
  const app = document.getElementById('calc-app');
  if(!app) return;
  app.addEventListener('input', handlePreviewInput);
  app.addEventListener('change', handlePreviewInput);
}

function handlePreviewInput(e){
  const t = e.target;
  const root = t?.closest?.('.calc-card-body, .app-form');
  if(root?.id==='body-rev'){
    clearRevolutionSolid();
    drawRevolutionSolid();
  }
  const cv = root?.querySelector?.('.calc-preview[data-gmode]');
  if(cv) schedulePreview(cv);
}

function schedulePreview(cv){
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => drawPreview(cv), 250);
}
