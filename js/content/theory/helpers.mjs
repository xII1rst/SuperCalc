// Constructores compartidos de las fichas teóricas.

export const ROUTES = {
  lim: '#/ca/calc-dif', dif: '#/ca/calc-dif', difApp: '#/ca/study-differential', int: '#/ca/calc-int', intApp: '#/ca/study-integral',
  cur: '#/ca/calc-cur', graf: '#/ca/calc-graf', mul: '#/ca/calc-mul', mulStudy: '#/ca/study-multivariable', edo: '#/ca/calc-edo', odeStudy: '#/ca/study-ode',
  seq: '#/al/seq', fn: '#/al/fn', ineq: '#/al/ineq', vec: '#/al/vectors', geom: '#/al/geom', mat: '#/al/mat', lin: '#/al/linear',
  numErr: '#/num/num-errors', numTaylor: '#/num/num-taylor', numPrec: '#/num/num-precision', numRoots: '#/num/num-roots', numLinear: '#/num/num-linear',
  numSystem: '#/num/num-system', numInterp: '#/num/num-interpolation', numDiff: '#/num/num-derivative', numQuad: '#/num/num-quadrature', numOde: '#/num/num-ode', numStab: '#/num/num-stability',
  bases: '#/logic/logic-bases', sets: '#/logic/logic-sets', props: '#/logic/logic-propositions', bool: '#/logic/logic-boolean', graphs: '#/logic/logic-graphs',
  em: '#/em/em-basics', emStat: '#/em/emplus-electrostatics', emCirc: '#/em/emplus-circuits', emMag: '#/em/emplus-magnetism',
  mMotion: '#/mech/mech-motion', mProj: '#/mech/mech-projectile', mDyn: '#/mech/mech-dynamics', mForces: '#/mech/mechplus-forces', mFrames: '#/mech/mechplus-motion',
  mColl: '#/mech/mechplus-collisions', mRot: '#/mech/mechplus-rotation', wOsc: '#/waves/waves-oscillations', wMech: '#/waves/waves-mechanical', wOpt: '#/waves/waves-optics',
};

export const t = (label, status, tool = null) => ({ label, status, tool });
export const card = (kind, title, text, tool = null) => ({ kind, title, text, tool });
