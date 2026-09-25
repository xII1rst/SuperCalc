const TYPES = new Set(['info','warn','error','ok']);

export function showToast(message, type='info', duration=3200) {
  let stack = document.getElementById('sc-toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'sc-toast-stack';
    stack.className = 'sc-toast-stack';
    document.body.appendChild(stack);
  }

  const toast = document.createElement('div');
  const kind = TYPES.has(type) ? type : 'info';
  toast.className = `sc-toast sc-toast-${kind}`;
  toast.setAttribute('role',kind==='error'||kind==='warn'?'alert':'status');
  toast.textContent = String(message);
  stack.appendChild(toast);
  void toast.offsetWidth;
  toast.classList.add('sc-toast-visible');

  const remove = () => {
    if (!toast.isConnected) return;
    toast.remove();
    if (!stack.childElementCount) stack.remove();
  };
  const timeout = Number(duration);
  setTimeout(() => {
    toast.classList.remove('sc-toast-visible');
    toast.addEventListener('transitionend',remove,{once:true});
    setTimeout(remove,250); // fallback si no se emite transitionend
  },Number.isFinite(timeout)?Math.max(0,timeout):3200);
  return toast;
}
