// Al retroceder desde la portada se pregunta en un diálogo propio, no con confirm().
export function _confirmExit(){
  const dialog = document.getElementById('exit-dialog');
  if (typeof dialog?.showModal !== 'function') { exitStay(); return; }
  if (!dialog.open) dialog.showModal();
}

export function closeExitDialog(){
  const dialog = document.getElementById('exit-dialog');
  if (dialog?.open) dialog.close();
}

export function exitStay(){
  closeExitDialog();
  history.pushState({sc:'launcher'}, '');
}

export function exitLeave(){
  closeExitDialog();
  history.go(-1);
}
