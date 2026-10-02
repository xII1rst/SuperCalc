// Une los espacios de nombres de la interfaz en la tabla de acciones del HTML.
// Un nombre repetido solo se admite si es la misma función (un reexporte); dos
// funciones distintas con el mismo nombre son un error, en vez de pisarse en
// silencio. `owners` fija el módulo dueño de las acciones compartidas.
export function composeActions(sources, owners = {}) {
  const actions = {};
  for (const [label, source] of Object.entries(sources)) {
    for (const [name, value] of Object.entries(source)) {
      if (Object.hasOwn(owners, name) && value !== owners[name]) {
        throw new Error(`Acción ${name}: ${label} no reexporta la función de su módulo dueño`);
      }
      if (Object.hasOwn(actions, name)) {
        if (actions[name] !== value) throw new Error(`Acción duplicada con otra función: ${name} (${label})`);
        continue;
      }
      actions[name] = value;
    }
  }
  return actions;
}
