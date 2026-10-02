// Fichas teóricas por unidad del temario (UPC) y mapa de cobertura de cada subtema.
// Sin DOM: la pantalla «Fichas teóricas» las presenta y un guion genera el mapa de cobertura.
//
// Estado de cada subtema:
//   C = cubierto (una herramienta lo calcula con pasos)
//   P = parcial (la herramienta cubre familias declaradas, no el tema completo)
//   F = ficha (se explica aquí; no hay calculadora específica)
//   N = pendiente (ni herramienta ni ficha suficiente)

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
const r = ROUTES;
const t = (label, status, tool = null) => ({ label, status, tool });
const card = (kind, title, text, tool = null) => ({ kind, title, text, tool });

export const THEORY = [
  {
    id: 'diferencial', subject: 'Cálculo Diferencial', group: 'math', units: [
      {
        id: 'dif-1', title: 'Unidad 1. Sucesiones y límites de sucesiones',
        topics: [t('1.1 Entorno en ℝ', 'F'), t('1.2 Entorno agujereado', 'F'), t('1.3 Definición de sucesiones', 'C', r.seq), t('1.4 Clases de sucesiones', 'C', r.seq),
          t('1.5 Axioma de completez', 'F'), t('1.6 Límites de sucesiones', 'C', r.seq), t('1.7 Propiedades de los límites para sucesiones', 'F'),
          t('1.8 Teorema del encaje para sucesiones', 'P', r.seq), t('1.9 Teorema del valor absoluto', 'F'), t('1.10 Divergencia y convergencia de sucesiones', 'P', r.seq),
          t('1.11 Álgebra de sucesiones', 'F'), t('1.12 El número e', 'C', r.seq)],
        cards: [
          card('Definición', 'Límite de una sucesión', 'aₙ → L si para todo ε > 0 existe N tal que |aₙ − L| < ε para todo n ≥ N. A partir de cierto término, la sucesión queda dentro de cualquier entorno de L.'),
          card('Teorema', 'Encaje y monotonía', 'Si bₙ ≤ aₙ ≤ cₙ y bₙ, cₙ → L, entonces aₙ → L. Además, toda sucesión monótona y acotada converge (consecuencia del axioma de completez).'),
          card('Ejemplo', 'El número e', '(1 + 1/n)ⁿ es creciente y acotada por 3, así que converge; su límite se define como e ≈ 2,71828. En general (1 + c/n)ⁿ → eᶜ.', r.seq),
          card('Contraejemplo', 'Acotada no basta', 'aₙ = (−1)ⁿ está acotada pero no converge: sus términos pares tienden a 1 y los impares a −1. Hace falta también la monotonía.'),
        ],
      },
      {
        id: 'dif-2', title: 'Unidad 2. Funciones reales',
        topics: [t('2.1 Funciones reales', 'C', r.fn), t('2.2 Representación de funciones reales', 'C', r.graf), t('2.2 Operaciones con funciones', 'P', r.fn)],
        cards: [
          card('Definición', 'Función, dominio y rango', 'Una función f asigna a cada x de su dominio un único valor f(x). El dominio excluye divisiones entre cero, raíces pares de negativos y logaritmos de no positivos.'),
          card('Regla', 'Composición', '(f∘g)(x) = f(g(x)) solo existe donde x está en el dominio de g y g(x) en el dominio de f.'),
          card('Ejemplo', 'Dominio de √(4 − x²)', 'Se exige 4 − x² ≥ 0, es decir −2 ≤ x ≤ 2. El rango es [0, 2].', r.fn),
          card('Error frecuente', 'Simplificar cambia el dominio', '(x² − 1)/(x − 1) y x + 1 coinciden salvo en x = 1: la primera no está definida allí.'),
        ],
      },
      {
        id: 'dif-3', title: 'Unidad 3. Límite y continuidad de funciones',
        topics: [t('Propiedades fundamentales del límite de una función', 'F'), t('Límites en el infinito', 'C', r.lim), t('Formas indeterminadas y límites fundamentales', 'C', r.lim),
          t('Continuidad de una función en un punto', 'C', r.difApp), t('Continuidad en un intervalo', 'P', r.difApp), t('Propiedades de funciones continuas', 'F'), t('Clasificación de la continuidad', 'C', r.difApp)],
        cards: [
          card('Definición', 'Continuidad en un punto', 'f es continua en a si f(a) existe, el límite cuando x → a existe y ambos coinciden. Si falla alguna condición hay discontinuidad: evitable, de salto o infinita.'),
          card('Teorema', 'Valor intermedio', 'Si f es continua en [a, b] y k está entre f(a) y f(b), existe c ∈ [a, b] con f(c) = k. Así se localizan raíces por cambio de signo.'),
          card('Ejemplo', 'Límite fundamental', 'lím x→0 sen x / x = 1. De él salen, por ejemplo, lím (1 − cos x)/x² = 1/2.', r.lim),
          card('Contraejemplo', 'Polo de un cociente', '1/x en x = 0: por la derecha tiende a +∞ y por la izquierda a −∞, así que el límite bilateral no existe.', r.lim),
        ],
      },
      {
        id: 'dif-4', title: 'Unidad 4. La derivada',
        topics: [t('3.1 Concepto e interpretación de la derivada', 'F'), t('3.2 Procesos de derivación', 'C', r.dif), t('3.3 Diferencial de una función', 'C', r.difApp),
          t('3.4 Derivadas y diferenciales de orden superior', 'C', r.dif), t('3.5 Funciones paramétricas y sus derivadas', 'C', r.difApp), t('3.6 Derivación implícita', 'C', r.dif), t("3.7 Formas indeterminadas y regla de L'Hôpital", 'C', r.lim)],
        cards: [
          card('Definición', 'Derivada', "f′(a) = lím h→0 [f(a + h) − f(a)]/h: pendiente de la recta tangente y razón instantánea de cambio. Si las derivadas laterales difieren, f no es derivable en a."),
          card('Regla', 'Cadena', '(f∘g)′(x) = f′(g(x))·g′(x). Con la regla del producto y del cociente se derivan todas las funciones elementales.'),
          card('Ejemplo', 'Derivación logarítmica', "Para y = xˣ (x > 0): ln y = x ln x, luego y′/y = ln x + 1 y y′ = xˣ(ln x + 1).", r.dif),
          card('Contraejemplo', 'Continua no implica derivable', '|x| es continua en 0, pero sus derivadas laterales valen −1 y 1: no es derivable allí.'),
        ],
      },
      {
        id: 'dif-5', title: 'Unidad 4. Aplicaciones de la derivada',
        topics: [t('4.1 Teorema de los valores extremos', 'F'), t('4.2 Puntos críticos', 'C', r.difApp), t('4.3 Teorema de Rolle', 'C', r.difApp), t('4.4 Teorema del valor medio', 'C', r.difApp),
          t('4.5 Crecimiento, decrecimiento y concavidad', 'C', r.difApp), t('4.6 Máximos y mínimos', 'C', r.difApp), t('4.7 Criterio de la segunda derivada', 'C', r.difApp),
          t('4.8 Representación gráfica de funciones', 'C', r.difApp), t('4.9 Problemas geométricos', 'C', r.difApp), t('4.10 Problemas físicos', 'P', r.difApp)],
        cards: [
          card('Teorema', 'Rolle y valor medio', 'Si f es continua en [a, b] y derivable en (a, b), existe c ∈ (a, b) con f′(c) = [f(b) − f(a)]/(b − a). Rolle es el caso f(a) = f(b), donde f′(c) = 0.', r.difApp),
          card('Criterio', 'Segunda derivada', 'Si f′(c) = 0 y f″(c) > 0 hay mínimo local; si f″(c) < 0, máximo local; si f″(c) = 0 el criterio no decide.'),
          card('Ejemplo', 'Cilindro de área mínima', 'Con volumen V fijo, el área 2πr² + 2V/r es mínima cuando h = 2r, es decir r = ∛(V/2π).', r.difApp),
          card('Contraejemplo', 'Sin derivabilidad no hay garantía', 'x^(2/3) en [−1, 1] cumple f(−1) = f(1), pero no es derivable en 0 y f′ nunca se anula: Rolle no se aplica.', r.difApp),
        ],
      },
    ],
  },
  {
    id: 'integral', subject: 'Cálculo Integral', group: 'math', units: [
      {
        id: 'int-1', title: 'Unidad 1. Integración',
        topics: [t('1.1 Integrales indefinidas', 'C', r.int), t('1.2 Ecuaciones diferenciales, PVI y modelos', 'C', r.intApp), t('1.3 Integrales por sustitución', 'C', r.int),
          t('1.4 Estimación con sumas finitas', 'C', r.int), t('1.5 Sumas de Riemann e integrales definidas', 'C', r.int), t('1.6 Propiedades, área y teorema del valor medio', 'P', r.int),
          t('1.7 Teorema fundamental del cálculo', 'C', r.intApp), t('1.8 Sustitución en integrales definidas', 'C', r.int), t('1.9 Integración numérica', 'C', r.numQuad)],
        cards: [
          card('Definición', 'Integral definida', '∫ₐᵇ f(x) dx es el límite de las sumas de Riemann Σ f(xᵢ*)Δx cuando la partición se refina. Mide el área con signo bajo la curva.'),
          card('Teorema', 'Teorema fundamental del cálculo', 'Si f es continua, d/dx ∫ₐˣ f(t) dt = f(x), y si F′ = f entonces ∫ₐᵇ f = F(b) − F(a).', r.intApp),
          card('Ejemplo', 'Sustitución', 'En ∫ 2x·cos(x²) dx se toma u = x², du = 2x dx: el resultado es sen(x²) + C.', r.int),
          card('Error frecuente', 'Singularidad dentro del intervalo', '∫₋₁¹ dx/x² no vale −2: el integrando no está acotado en x = 0 y la integral impropia diverge. Hay que separar el intervalo.', r.int),
        ],
      },
      {
        id: 'int-2', title: 'Unidad 2. Técnicas de integración',
        topics: [t('2.1 Funciones trascendentes', 'C', r.int), t('2.2 Fórmulas básicas de integración', 'C', r.int), t('2.3 Integración por partes', 'C', r.int),
          t('2.4 Integrales trigonométricas', 'C', r.int), t('2.5 Fracciones parciales', 'C', r.int), t('2.6 Sustitución trigonométrica', 'P', r.int),
          t('2.7 Sustituciones diversas', 'P', r.int), t('2.8 Integrales impropias', 'C', r.int)],
        cards: [
          card('Regla', 'Integración por partes', '∫ u dv = uv − ∫ v du. Conviene elegir u la función que se simplifica al derivar (polinomios, logaritmos).'),
          card('Método', 'Fracciones parciales', 'Un cociente de polinomios propio se descompone en términos A/(x − a)ᵏ y (Bx + C)/(x² + px + q)ᵏ, que se integran directamente.', r.int),
          card('Ejemplo', 'Por partes repetida', '∫ x² sen x dx = −x² cos x + 2x sen x + 2 cos x + C.', r.int),
          card('Contraejemplo', 'Impropia divergente', '∫₁^∞ dx/x = lím ln b = ∞ diverge, aunque 1/x → 0. En cambio ∫₁^∞ dx/x² = 1 converge.'),
        ],
      },
      {
        id: 'int-3', title: 'Unidad 3. Aplicaciones de la integral definida',
        topics: [t('3.1 Áreas entre curvas', 'C', r.int), t('3.2 Coordenadas polares', 'C', r.cur), t('3.3 Áreas en coordenadas polares', 'C', r.intApp),
          t('3.4 Volúmenes', 'C', r.int), t('3.5 Longitud de arco (rectangulares y polares)', 'C', r.intApp), t('3.6 Área de una superficie', 'C', r.intApp), t('3.7 Problemas físicos', 'C', r.int)],
        cards: [
          card('Fórmula', 'Discos, arandelas y cascarones', 'Alrededor del eje x: V = π∫(R² − r²) dx. Alrededor del eje y con cascarones: V = 2π∫ |x|·altura dx.', r.int),
          card('Fórmula', 'Longitud de arco', 'L = ∫ₐᵇ √(1 + f′(x)²) dx; en polares L = ∫ √(r² + (dr/dθ)²) dθ.'),
          card('Ejemplo', 'Giro alrededor de y = 2', 'La región entre y = x y y = x² girada en torno a y = 2 da V = π∫₀¹[(2 − x²)² − (2 − x)²] dx = 8π/15.', r.int),
          card('Error frecuente', 'Área no es integral con signo', 'Si f cambia de signo, el área entre la curva y el eje es ∫ |f|, no ∫ f. Hay que partir el intervalo en los ceros.'),
        ],
      },
      {
        id: 'int-4', title: 'Unidad 4. Series infinitas',
        topics: [t('4.1 Series infinitas', 'C', r.int), t('4.2 Pruebas de la integral y de comparación', 'C', r.int), t('4.3 Criterios de la razón y la raíz', 'C', r.int),
          t('4.4 Series alternantes y convergencia absoluta', 'C', r.int), t('4.5 Series de potencias', 'C', r.intApp), t('4.6 Series de Taylor y Maclaurin', 'C', r.int)],
        cards: [
          card('Criterio', 'Razón y raíz', 'Con L = lím |aₙ₊₁/aₙ| o L = lím |aₙ|^(1/n): L < 1 converge absolutamente, L > 1 diverge y L = 1 no decide.', r.int),
          card('Teorema', 'Leibniz', 'Si bₙ > 0 decrece y bₙ → 0, Σ(−1)^(n+1) bₙ converge y el error de la suma parcial cumple |S − S_N| ≤ b_(N+1).', r.int),
          card('Ejemplo', 'Prueba de la integral', 'Σ 1/(n ln² n) converge porque ∫₂^∞ dx/(x ln² x) = 1/ln 2; en cambio Σ 1/(n ln n) diverge.', r.int),
          card('Contraejemplo', 'Término general que tiende a 0', 'Σ 1/n diverge aunque 1/n → 0: la condición aₙ → 0 es necesaria, no suficiente.'),
        ],
      },
    ],
  },
  {
    id: 'multivariable', subject: 'Cálculo Multivariable', group: 'math', units: [
      {
        id: 'mul-1', title: 'Unidad 1. Funciones de varias variables',
        topics: [t('1.1 Geometría del espacio euclidiano', 'C', r.geom), t('1.2 Funciones vectoriales', 'C', r.mulStudy), t('1.3 Campos escalares', 'C', r.mul),
          t('1.4 Topología básica en ℝⁿ', 'F'), t('1.5 Límites y continuidad', 'P', r.mulStudy), t('1.6 Derivadas de funciones vectoriales', 'C', r.mulStudy),
          t('1.7 Derivadas parciales', 'C', r.mul), t('1.8 Derivadas direccionales', 'C', r.mul)],
        cards: [
          card('Definición', 'Derivada parcial y direccional', '∂f/∂x deriva respecto de x con las demás variables fijas. La derivada en la dirección unitaria u es D_u f = ∇f · u.', r.mul),
          card('Criterio', 'Límite que no existe', 'Si dos trayectorias hacia el mismo punto dan límites distintos, el límite no existe. Coincidir en algunas rectas no basta para demostrarlo.'),
          card('Ejemplo', 'Dirección de máximo crecimiento', 'Para f = x²y en (1, 2): ∇f = (4, 1); el crecimiento máximo es |∇f| = √17 en la dirección (4, 1)/√17.', r.mul),
          card('Contraejemplo', 'Parciales sin continuidad', 'f = xy/(x² + y²) con f(0,0) = 0 tiene parciales nulas en el origen, pero sobre y = x vale 1/2: no es continua allí.', r.mulStudy),
        ],
      },
      {
        id: 'mul-2', title: 'Unidad 2. Diferenciabilidad',
        topics: [t('2.1 La diferencial', 'C', r.mulStudy), t('2.2 Gradiente y aplicaciones', 'C', r.mul), t('2.3 Derivadas de orden superior', 'C', r.mulStudy),
          t('2.4 Regla de la cadena', 'C', r.mulStudy), t('2.5 Derivación implícita', 'C', r.mulStudy), t('2.6 Máximos y mínimos', 'C', r.mulStudy), t('2.7 Multiplicadores de Lagrange', 'C', r.mulStudy)],
        cards: [
          card('Criterio', 'Hessiano en dos variables', 'En un punto crítico, con D = f_xx f_yy − f_xy²: D > 0 y f_xx > 0 es mínimo, D > 0 y f_xx < 0 máximo, D < 0 punto silla, D = 0 no decide.', r.mulStudy),
          card('Teorema', 'Multiplicadores de Lagrange', 'Los extremos de f sujeta a g = c cumplen ∇f = λ∇g (si ∇g ≠ 0). Con dos restricciones, ∇f = λ∇g + μ∇h.', r.mulStudy),
          card('Ejemplo', 'Mínimo de la norma sobre un plano', 'x² + y² + z² con x + y + z = 3 da ∇f = λ(1,1,1), así que x = y = z = 1 y el mínimo vale 3.', r.mulStudy),
          card('Error frecuente', 'Olvidar los puntos frontera', 'En una región cerrada, el extremo absoluto puede estar en el borde, donde ∇f no tiene por qué anularse.'),
        ],
      },
      {
        id: 'mul-3', title: 'Unidad 3. Integración múltiple',
        topics: [t('3.1 Integral doble de funciones escalonadas', 'F'), t('3.2 Integral doble sobre rectángulos', 'C', r.mul), t('3.3 Integral doble sobre regiones generales', 'C', r.mulStudy),
          t('3.4 Cambio de coordenadas en integrales dobles', 'C', r.mulStudy), t('3.5 Aplicaciones de integrales dobles', 'C', r.mulStudy), t('3.6 Integrales triples', 'C', r.mulStudy),
          t('3.7 Cambio de coordenadas en integrales triples', 'C', r.mulStudy), t('3.8 Aplicaciones de integrales triples', 'C', r.mulStudy)],
        cards: [
          card('Teorema', 'Fubini', 'Si f es continua en la región, la integral doble se calcula como integrales iteradas en cualquier orden compatible con los límites.'),
          card('Fórmula', 'Jacobianos', 'Polares: dA = r dr dθ. Cilíndricas: dV = r dr dθ dz. Esféricas: dV = ρ² sen φ dρ dφ dθ.', r.mulStudy),
          card('Ejemplo', 'Volumen de una esfera', '∫₀^{2π}∫₀^π∫₀³ ρ² sen φ dρ dφ dθ = 36π, el volumen de la esfera de radio 3.', r.mulStudy),
          card('Error frecuente', 'Olvidar el jacobiano', 'Sobre el disco de radio 3, ∫₀^{2π}∫₀³ r dr dθ = 9π, que es su área. Sin el factor r saldría 6π.'),
        ],
      },
      {
        id: 'mul-4', title: 'Unidad 4. Análisis vectorial',
        topics: [t('4.1 Integral de línea de campos escalares', 'C', r.mulStudy), t('4.2 Integral de línea de campos vectoriales', 'C', r.mulStudy),
          t('4.3 Teorema fundamental para integrales de línea', 'C', r.mulStudy), t('4.4 Teorema de Green', 'C', r.mulStudy), t('4.5 Superficies parametrizadas', 'C', r.mulStudy), t('4.6 Integral de superficie de campos escalares', 'C', r.mulStudy)],
        cards: [
          card('Teorema', 'Green', 'Para C cerrada, simple y antihoraria que encierra D: ∮_C P dx + Q dy = ∬_D (∂Q/∂x − ∂P/∂y) dA.', r.mulStudy),
          card('Teorema', 'Campos conservativos', 'Si F = ∇φ, ∫_C F·dr = φ(B) − φ(A) no depende del camino. En el plano, con dominio simplemente conexo, basta que ∂Q/∂x = ∂P/∂y.'),
          card('Ejemplo', 'Green en un triángulo', '∮ xy dx + x² dy sobre el triángulo (0,0), (1,0), (1,2) vale ∬ x dA = 2/3.', r.mulStudy),
          card('Contraejemplo', 'Rotor nulo con un agujero', 'F = (−y, x)/(x² + y²) cumple ∂Q/∂x = ∂P/∂y fuera del origen, pero su circulación en la circunferencia unidad es 2π: el dominio no es simplemente conexo.'),
        ],
      },
    ],
  },
  {
    id: 'edo', subject: 'Ecuaciones Diferenciales', group: 'math', units: [
      {
        id: 'edo-1', title: 'Unidad I. Conceptos fundamentales',
        topics: [t('1.1 Orden y grado', 'C', r.odeStudy), t('1.2 Solución de una ecuación diferencial', 'C', r.odeStudy), t('1.2.1 Solución general', 'C', r.odeStudy),
          t('1.2.2 EDO a partir de la solución general', 'C', r.odeStudy), t('1.3 Evolución histórica', 'F')],
        cards: [
          card('Definición', 'Orden, grado y linealidad', 'El orden es la derivada más alta; el grado, la potencia de esa derivada cuando la ecuación es polinómica en las derivadas. Es lineal si y y sus derivadas aparecen solo a la primera potencia.', r.odeStudy),
          card('Definición', 'Solución general y particular', 'La solución general de una EDO de orden n tiene n constantes arbitrarias; una condición inicial por constante fija la particular.'),
          card('Ejemplo', 'Eliminar la constante', 'De la familia y = Cx² se obtiene y′ = 2Cx = 2y/x, es decir x y′ − 2y = 0.', r.odeStudy),
          card('Error frecuente', 'Soluciones singulares', 'y′ = 2√y tiene la familia y = (x + C)² (con x + C ≥ 0) y también y = 0, que no sale de la familia para ningún C.'),
        ],
      },
      {
        id: 'edo-2', title: 'Unidad II. Primer orden y primer grado',
        topics: [t('2.1 Conceptos básicos y teoremas', 'F'), t('2.2 Variables separables', 'C', r.odeStudy), t('2.2.1 Reducibles a separables', 'C', r.odeStudy),
          t('2.3 Homogéneas', 'P', r.odeStudy), t('2.3.1 Transformables a homogéneas', 'P', r.odeStudy), t('2.4 Exactas', 'C', r.odeStudy), t('2.4.1 Factor integrante', 'P', r.odeStudy),
          t('2.5 Lineal de primer orden', 'C', r.odeStudy), t('2.5.1 Reducibles a lineales (Bernoulli)', 'C', r.odeStudy), t('2.6 Eliminación en sistemas con coeficientes constantes', 'C', r.odeStudy), t('2.7 Modelado de problemas físicos y geométricos', 'C', r.odeStudy)],
        cards: [
          card('Teorema', 'Existencia y unicidad', 'Si f y ∂f/∂y son continuas cerca de (x₀, y₀), el PVI y′ = f(x, y), y(x₀) = y₀ tiene solución única en un intervalo alrededor de x₀.'),
          card('Método', 'Factor integrante', 'Para y′ + P(x) y = Q(x), μ = e^(∫P dx) convierte el lado izquierdo en (μy)′, así que y = (1/μ)∫ μQ dx.', r.odeStudy),
          card('Ejemplo', 'Enfriamiento de Newton', "T′ = k(T − 20) con T(0) = 90 y T(10) = 60 da T = 20 + 70e^(kt), k = ln(4/7)/10, y T(20) ≈ 42,9 °C.", r.odeStudy),
          card('Contraejemplo', 'Sin unicidad', 'y′ = 3y^(2/3), y(0) = 0 tiene las soluciones y = 0 y y = x³: ∂f/∂y no es continua en y = 0.'),
        ],
      },
      {
        id: 'edo-3', title: 'Unidad III. Orden superior',
        topics: [t('3.1 Ecuaciones de orden y grado superior', 'P', r.odeStudy), t('3.2 Lineales homogéneas', 'C', r.odeStudy),
          t('3.3 No homogéneas: coeficientes indeterminados y variación de parámetros', 'C', r.odeStudy), t('3.4 Problemas físicos', 'C', r.odeStudy)],
        cards: [
          card('Método', 'Ecuación característica', 'ay″ + by′ + cy = 0 con ar² + br + c = 0: raíces reales distintas dan e^(r₁x), e^(r₂x); doble, e^(rx) y xe^(rx); complejas α ± βi, e^(αx)cos βx y e^(αx)sen βx.', r.odeStudy),
          card('Regla', 'Resonancia', 'Si el término forzante ya resuelve la homogénea, la propuesta de coeficientes indeterminados se multiplica por x (o x² si la raíz es doble).'),
          card('Ejemplo', 'Forzado en resonancia', 'y″ + 4y = cos 2x tiene solución particular y_p = (x/4) sen 2x: la amplitud crece con x.', r.odeStudy),
          card('Error frecuente', 'Variación de parámetros sin normalizar', 'La fórmula con el wronskiano exige escribir la ecuación como y″ + p y′ + q y = g, con coeficiente 1 en y″.'),
        ],
      },
      {
        id: 'edo-4', title: 'Unidad IV. Transformada de Laplace',
        topics: [t('4.1 Definición, propiedades y teoremas', 'C', r.odeStudy), t('4.2 Problemas de valor inicial', 'C', r.odeStudy), t('4.3 Sistemas lineales', 'C', r.odeStudy),
          t('4.4 Sistemas homogéneos con coeficientes constantes', 'C', r.odeStudy), t('4.5 Problemas físicos', 'C', r.odeStudy)],
        cards: [
          card('Definición', 'Transformada de Laplace', 'L{f}(s) = ∫₀^∞ e^(−st) f(t) dt. Convierte derivadas en productos: L{y′} = sY − y(0), L{y″} = s²Y − s y(0) − y′(0).', r.odeStudy),
          card('Teorema', 'Traslación', 'L{e^(at) f(t)} = F(s − a). Permite invertir cuadráticas completando el cuadrado.'),
          card('Ejemplo', 'PVI forzado', "y″ + 4y = sen t con y(0) = y′(0) = 0: Y = 1/[(s² + 1)(s² + 4)], y = (1/3) sen t − (1/6) sen 2t.", r.odeStudy),
          card('Error frecuente', 'Olvidar las condiciones iniciales', 'L{y″} no es s²Y: los términos −s y(0) − y′(0) son los que fijan la solución particular.'),
        ],
      },
    ],
  },
  {
    id: 'lineal', subject: 'Álgebra Lineal', group: 'math', units: [
      {
        id: 'lin-1', title: 'Unidad I. Vectores en ℝ² y ℝ³',
        topics: [t('Generalidades', 'C', r.vec), t('Suma y producto por escalar', 'C', r.vec), t('Producto cruz y propiedades', 'C', r.vec),
          t('Rectas y planos en el espacio', 'C', r.geom), t('Aplicaciones y problemas', 'C', r.geom)],
        cards: [
          card('Fórmula', 'Productos escalar y cruz', 'A·B = |A||B| cos θ mide alineación; |A×B| = |A||B| sen θ es el área del paralelogramo y A×B es normal a ambos.', r.vec),
          card('Fórmula', 'Recta y plano', 'Recta: P = P₀ + t·d. Plano: n·(P − P₀) = 0, es decir ax + by + cz = d con n = (a, b, c). Distancia de un punto al plano: |n·P₁ − d|/|n|.', r.geom),
          card('Ejemplo', 'Plano por tres puntos', 'Con A(1,0,0), B(0,1,0), C(0,0,1): n = AB × AC = (1, 1, 1), luego x + y + z = 1.', r.geom),
          card('Error frecuente', 'El producto cruz no conmuta', 'B × A = −(A × B). Cambiar el orden invierte la normal y el signo de los volúmenes.'),
        ],
      },
      {
        id: 'lin-2', title: 'Unidad II. Matrices y determinantes',
        topics: [t('Generalidades', 'C', r.mat), t('Operaciones con matrices', 'C', r.mat), t('Producto de dos matrices', 'C', r.mat), t('Determinantes', 'C', r.mat),
          t('Expansión por filas o columnas', 'C', r.mat), t('Propiedades y aplicaciones', 'C', r.lin), t('Inversa de una matriz cuadrada', 'C', r.mat)],
        cards: [
          card('Teorema', 'Invertibilidad', 'Una matriz cuadrada A es invertible si y solo si det A ≠ 0, si y solo si sus columnas son linealmente independientes, si y solo si Ax = 0 solo tiene la solución trivial.'),
          card('Regla', 'Propiedades del determinante', 'det(AB) = det A · det B; intercambiar dos filas cambia el signo; multiplicar una fila por k multiplica el determinante por k; det(Aᵀ) = det A.', r.lin),
          card('Ejemplo', 'Inversa 2×2', 'Para A = [[a, b], [c, d]] con ad − bc ≠ 0: A⁻¹ = 1/(ad − bc) · [[d, −b], [−c, a]].', r.mat),
          card('Contraejemplo', 'AB ≠ BA', 'Con A = [[0,1],[0,0]] y B = [[0,0],[1,0]]: AB = [[1,0],[0,0]] pero BA = [[0,0],[0,1]].'),
        ],
      },
      {
        id: 'lin-3', title: 'Unidad III. Sistemas de ecuaciones lineales',
        topics: [t('Formas de una ecuación lineal', 'F'), t('Sistemas de m × n', 'C', r.mat), t('Eliminación gaussiana y de Gauss-Jordan', 'C', r.mat),
          t('Sistemas homogéneos', 'C', r.mat), t('Regla de Cramer', 'C', r.mat), t('Aplicaciones y problemas', 'C', r.mat)],
        cards: [
          card('Teorema', 'Rouché-Frobenius', 'Ax = b es compatible si y solo si rango A = rango [A|b]. Si además el rango es igual al número de incógnitas la solución es única; si es menor, hay infinitas.', r.mat),
          card('Método', 'Gauss-Jordan', 'Las operaciones elementales de fila no cambian las soluciones. Se llega a la forma escalonada reducida y se leen las variables libres.'),
          card('Ejemplo', 'Sistema con parámetro', 'x + y = 1, x + ky = 2: si k ≠ 1 hay solución única; si k = 1 las filas dan 0 = 1 y el sistema es incompatible.', r.mat),
          card('Error frecuente', 'Cramer con determinante nulo', 'Si det A = 0, Cramer no se aplica: el sistema puede no tener solución o tener infinitas. Hay que escalonar.'),
        ],
      },
      {
        id: 'lin-4', title: 'Unidad IV. Espacios vectoriales',
        topics: [t('Definición y propiedades básicas', 'F'), t('Subespacios vectoriales', 'C', r.lin), t('Combinación lineal y espacio generado', 'C', r.lin),
          t('Independencia y dependencia lineal', 'C', r.lin), t('Bases y dimensión', 'C', r.lin), t('Rango y nulidad', 'C', r.mat), t('Cambio de base', 'C', r.lin),
          t('Bases ortonormales', 'C', r.lin), t('Ejercicios y problemas', 'C', r.lin)],
        cards: [
          card('Definición', 'Subespacio', 'W ⊆ V es subespacio si contiene el 0 y es cerrado bajo suma y producto por escalar. Basta comprobar que au + bv ∈ W para u, v ∈ W.', r.lin),
          card('Teorema', 'Rango y nulidad', 'Para A de m × n: rango A + nulidad A = n. La nulidad cuenta las variables libres de Ax = 0.', r.mat),
          card('Ejemplo', 'Gram-Schmidt', 'De (1,1,0) y (1,0,1) se obtiene e₁ = (1,1,0)/√2 y e₂ = (1,−1,2)/√6, una base ortonormal del mismo plano.', r.lin),
          card('Contraejemplo', 'Recta que no pasa por el origen', 'W = {(x, y) : y = x + 1} no es subespacio: no contiene (0, 0) y la suma de dos de sus puntos se sale de W.'),
        ],
      },
      {
        id: 'lin-5', title: 'Unidad V. Transformaciones lineales',
        topics: [t('Definición y ejemplos', 'C', r.lin), t('Propiedades de una transformación lineal', 'F'), t('Núcleo e imagen', 'C', r.lin),
          t('Representación matricial', 'C', r.lin), t('Ejercicios y aplicaciones', 'C', r.lin)],
        cards: [
          card('Definición', 'Transformación lineal', 'T es lineal si T(u + v) = T(u) + T(v) y T(cu) = cT(u). Toda T: ℝⁿ → ℝᵐ lineal es T(x) = Ax, con las imágenes de la base canónica como columnas.', r.lin),
          card('Teorema', 'Núcleo e imagen', 'dim Nu T + dim Im T = dim V. T es inyectiva si y solo si Nu T = {0}.'),
          card('Ejemplo', 'Rotación', 'Girar un ángulo θ en el plano tiene matriz [[cos θ, −sen θ], [sen θ, cos θ]], con determinante 1.', r.lin),
          card('Contraejemplo', 'Traslación', 'T(x) = x + b con b ≠ 0 no es lineal: T(0) = b ≠ 0.'),
        ],
      },
      {
        id: 'lin-6', title: 'Unidad VI. Valores y vectores propios',
        topics: [t('Definición y teoremas', 'F'), t('Ecuación y polinomio característico', 'C', r.mat), t('Cálculo de valores y vectores propios', 'C', r.mat),
          t('Matrices semejantes y diagonalización', 'C', r.lin), t('Matrices simétricas y diagonalización ortogonal', 'C', r.lin)],
        cards: [
          card('Definición', 'Valor y vector propio', 'Av = λv con v ≠ 0. Los λ son las raíces de det(A − λI) = 0 y cada espacio propio es el núcleo de A − λI.', r.mat),
          card('Teorema', 'Diagonalización', 'A de n × n es diagonalizable si tiene n vectores propios independientes: A = PDP⁻¹. Toda matriz simétrica real lo es con P ortogonal.', r.lin),
          card('Ejemplo', 'Matriz 2×2', 'A = [[2, 1], [1, 2]] tiene λ = 1 con v = (1, −1) y λ = 3 con v = (1, 1).', r.mat),
          card('Contraejemplo', 'Valor propio defectuoso', 'A = [[1, 1], [0, 1]] tiene λ = 1 doble, pero su espacio propio es solo la recta generada por (1, 0): no es diagonalizable.'),
        ],
      },
    ],
  },
  {
    id: 'numerico', subject: 'Análisis Numérico', group: 'math', units: [
      {
        id: 'num-1', title: 'Unidad 1. Generalidades',
        topics: [t('1.1 ¿Qué es el análisis numérico?', 'F'), t('1.2 La necesidad de los métodos numéricos', 'F'), t('1.3 Implementación en dispositivos digitales', 'F'),
          t('1.4.1 Análisis de errores', 'C', r.numErr), t('1.4.2 Aritmética de precisión fija', 'C', r.numPrec), t('1.4.3 Truncamiento y serie de Taylor', 'C', r.numTaylor),
          t('1.5 Algoritmos iterativos y orden de convergencia', 'P', r.numRoots)],
        cards: [
          card('Definición', 'Error absoluto y relativo', 'Con valor exacto p y aproximación p*: error absoluto |p − p*| y relativo |p − p*|/|p|. p* tiene t cifras significativas si el relativo es menor que 5·10⁻ᵗ.', r.numErr),
          card('Teorema', 'Resto de Lagrange', 'f(x) = Pₙ(x) + f⁽ⁿ⁺¹⁾(ξ)(x − x₀)ⁿ⁺¹/(n + 1)! para algún ξ entre x₀ y x. Acotar f⁽ⁿ⁺¹⁾ acota el error de truncamiento.', r.numTaylor),
          card('Ejemplo', 'Cancelación catastrófica', 'Con 4 cifras, √1001 − √1000 = 31,64 − 31,62 = 0,02; en cambio 1/(√1001 + √1000) = 0,01581, mucho más exacto.', r.numPrec),
          card('Definición', 'Orden de convergencia', 'Si |eₖ₊₁| ≈ C|eₖ|^p, el método tiene orden p: bisección es lineal (p = 1, C = 1/2) y Newton cuadrático (p = 2) cerca de una raíz simple.'),
        ],
      },
      {
        id: 'num-2', title: 'Unidad 2. Ecuaciones en una variable',
        topics: [t('2.1 Método de bisección', 'C', r.numRoots), t('2.2 Método de Newton-Raphson', 'C', r.numRoots), t('2.3 Método de Bairstow', 'C', r.numRoots)],
        cards: [
          card('Teorema', 'Garantía de la bisección', 'Si f es continua y f(a)f(b) < 0, tras n pasos el error es a lo más (b − a)/2ⁿ. Para un error ε hacen falta n ≥ log₂((b − a)/ε) pasos.', r.numRoots),
          card('Fórmula', 'Newton-Raphson', 'xₖ₊₁ = xₖ − f(xₖ)/f′(xₖ). Converge cuadráticamente si la raíz es simple y x₀ está cerca.'),
          card('Ejemplo', '√2 por Newton', 'Con f(x) = x² − 2 y x₀ = 1: x₁ = 1,5, x₂ = 1,41667, x₃ = 1,414216. Las cifras correctas se duplican en cada paso.', r.numRoots),
          card('Contraejemplo', 'Newton que oscila', 'Para f(x) = x³ − 2x + 2 con x₀ = 0 se obtiene 1, 0, 1, …: el método cicla y nunca llega a la raíz real x ≈ −1,769.'),
        ],
      },
      {
        id: 'num-3', title: 'Unidad 3. Sistemas lineales y no lineales',
        topics: [t('3.1.1 Eliminación gaussiana', 'C', r.numLinear), t('3.1.2 Factorización LU', 'C', r.numLinear), t('3.2.1 Método de Jacobi', 'C', r.numLinear),
          t('3.2.2 Método de Gauss-Seidel', 'C', r.numLinear), t('3.3 Newton-Raphson para sistemas no lineales', 'C', r.numSystem)],
        cards: [
          card('Teorema', 'Convergencia de Jacobi y Gauss-Seidel', 'Si A es estrictamente diagonal dominante por filas, ambos métodos convergen para cualquier vector inicial.', r.numLinear),
          card('Método', 'Pivoteo parcial', 'En cada columna se elige como pivote el elemento de mayor valor absoluto. Evita dividir entre números pequeños que amplifican el redondeo.'),
          card('Ejemplo', 'Newton para un sistema', 'x² + y² = 4, xy = 1 desde (2, 0,5): cada paso resuelve J(xₖ)Δ = −F(xₖ) y converge a (1,932; 0,5176).', r.numSystem),
          card('Contraejemplo', 'Sin dominancia diagonal', 'Con A = [[1, 2], [2, 1]], Jacobi diverge: el radio espectral de su matriz de iteración es 2.'),
        ],
      },
      {
        id: 'num-4', title: 'Unidad 4. Interpolación y ajuste de curvas',
        topics: [t('4.1 Interpolación de Lagrange', 'C', r.numInterp), t('4.2 Diferencias divididas de Newton', 'C', r.numInterp),
          t('4.3 Mínimos cuadrados', 'C', r.numInterp), t('4.4 Ajuste por funciones sinusoidales', 'C', r.numInterp)],
        cards: [
          card('Teorema', 'Error de interpolación', 'f(x) − Pₙ(x) = f⁽ⁿ⁺¹⁾(ξ)/(n + 1)! · Π(x − xᵢ). El error crece fuera del intervalo de los nodos.', r.numInterp),
          card('Método', 'Mínimos cuadrados', 'Se minimiza Σ(yᵢ − modelo(xᵢ))². Para un modelo lineal en los parámetros se resuelven las ecuaciones normales: AᵀAc = Aᵀy.'),
          card('Ejemplo', 'Recta de ajuste', 'Los puntos (0, 1), (1, 3), (2, 4) dan y = 1,1667 + 1,5x.', r.numInterp),
          card('Contraejemplo', 'Fenómeno de Runge', 'Interpolar 1/(1 + 25x²) en nodos equiespaciados de [−1, 1] con grado alto produce oscilaciones enormes cerca de los extremos.'),
        ],
      },
      {
        id: 'num-5', title: 'Unidad 5. Diferenciación e integración numérica',
        topics: [t('5.1 Fórmulas de tres y cinco puntos', 'C', r.numDiff), t('5.2.1 Regla compuesta del trapecio', 'C', r.numQuad), t('5.2.2 Simpson compuesta', 'C', r.numQuad)],
        cards: [
          card('Fórmula', 'Diferencia centrada', 'f′(x) ≈ [f(x + h) − f(x − h)]/(2h), con error O(h²). La de cinco puntos tiene error O(h⁴).', r.numDiff),
          card('Fórmula', 'Cotas de cuadratura', 'Trapecio: |E| ≤ (b − a)h²·máx|f″|/12. Simpson (n par): |E| ≤ (b − a)h⁴·máx|f⁽⁴⁾|/180.', r.numQuad),
          card('Ejemplo', '∫₀¹ eˣ dx', 'Trapecio con n = 4 da 1,72722; Simpson con n = 4 da 1,71832; el valor exacto es e − 1 = 1,71828.', r.numQuad),
          card('Error frecuente', 'h demasiado pequeño', 'Al reducir h el truncamiento baja, pero el redondeo crece como ε/h: existe un h óptimo, no conviene tomarlo arbitrariamente pequeño.', r.numDiff),
        ],
      },
      {
        id: 'num-6', title: 'Unidad 6. EDO numéricas',
        topics: [t('6.1 Problemas de valor inicial', 'C', r.numOde), t('6.2.1 Método de Euler', 'C', r.numOde), t('6.2.2 Métodos de Runge-Kutta', 'C', r.numOde),
          t('6.3 Métodos multipaso: Adams-Bashforth', 'C', r.numOde)],
        cards: [
          card('Fórmula', 'Euler y RK4', 'Euler: yₖ₊₁ = yₖ + h f(tₖ, yₖ), error global O(h). RK4 combina cuatro pendientes con pesos 1, 2, 2, 1 y su error global es O(h⁴).', r.numOde),
          card('Método', 'Adams-Bashforth', 'Usa pendientes de pasos anteriores: AB2 es yₖ₊₁ = yₖ + h(3fₖ − fₖ₋₁)/2. Necesita un método autoiniciador para el primer paso.'),
          card('Ejemplo', 'y′ = y, y(0) = 1, h = 0,1', 'Euler da y(1) ≈ 2,5937 y RK4 da 2,718280, frente a e = 2,718282.', r.numOde),
          card('Contraejemplo', 'Inestabilidad', 'Para y′ = −50y con h = 0,1, Euler multiplica por 1 − 5 = −4 en cada paso: la solución numérica explota aunque la exacta decae.', r.numStab),
        ],
      },
    ],
  },
  {
    id: 'logica', subject: 'Lógica Matemática', group: 'math', units: [
      {
        id: 'log-1', title: 'Unidad I. Sistemas numéricos',
        topics: [t('1.1 Binario, octal, decimal y hexadecimal', 'C', r.bases), t('1.2 Conversiones entre sistemas', 'C', r.bases),
          t('1.3 Suma, resta, multiplicación y división', 'C', r.bases), t('1.4 Aplicación en la computación', 'C', r.bases)],
        cards: [
          card('Definición', 'Notación posicional', 'En base b, dₙ…d₁d₀ vale Σ dᵢ bⁱ. Un dígito hexadecimal equivale a 4 bits y uno octal a 3.', r.bases),
          card('Método', 'Complemento a dos', 'Con n bits, −x se representa invirtiendo los bits de x y sumando 1. El rango es de −2ⁿ⁻¹ a 2ⁿ⁻¹ − 1.', r.bases),
          card('Ejemplo', '0x2F a binario y decimal', 'Cada dígito hexadecimal son 4 bits: 2F₁₆ = 0010 1111₂ = 2·16 + 15 = 47.', r.bases),
          card('Error frecuente', 'Desbordamiento con signo', 'En 8 bits, 100 + 50 = 150 no cabe: el resultado se lee como −106. Sumar dos positivos y obtener un negativo indica desbordamiento.'),
        ],
      },
      {
        id: 'log-2', title: 'Unidad II. Conjuntos y relaciones',
        topics: [t('2.1 Conjuntos y subconjuntos', 'C', r.sets), t('2.2 Operaciones con conjuntos', 'C', r.sets), t('2.3 Propiedades y aplicaciones', 'C', r.sets),
          t('2.4 Producto cartesiano y relación binaria', 'C', r.sets), t('2.5 Representación de las relaciones', 'C', r.sets), t('2.6 Propiedades de las relaciones', 'C', r.sets),
          t('2.7 Relaciones de equivalencia', 'C', r.sets), t('2.8 Funciones', 'C', r.sets), t('2.9 Aplicaciones en la computación', 'F')],
        cards: [
          card('Fórmula', 'Inclusión-exclusión', '|A ∪ B| = |A| + |B| − |A ∩ B|; con tres conjuntos se suman las intersecciones triples.', r.sets),
          card('Definición', 'Relación de equivalencia', 'Reflexiva, simétrica y transitiva. Sus clases de equivalencia forman una partición del conjunto.', r.sets),
          card('Ejemplo', 'Congruencia módulo 3', 'a ~ b si 3 divide a a − b es de equivalencia en ℤ, con tres clases: [0], [1] y [2].'),
          card('Contraejemplo', 'Simétrica y transitiva, no reflexiva', 'En {1, 2}, R = {(1, 1)} es simétrica y transitiva, pero no reflexiva porque falta (2, 2).', r.sets),
        ],
      },
      {
        id: 'log-3', title: 'Unidad III. Lógica matemática',
        topics: [t('3.1.1 Proposiciones simples y compuestas', 'C', r.props), t('3.1.2 Tablas de verdad', 'C', r.props), t('3.1.3 Tautología, contradicción y contingencia', 'C', r.props),
          t('3.1.4 Equivalencias lógicas', 'C', r.props), t('3.1.5 Reglas de inferencia', 'C', r.props), t('3.1.6 Argumentos válidos y no válidos', 'C', r.props),
          t('3.1.7 Demostración formal', 'P', r.props), t('3.2.1 Cuantificadores', 'C', r.sets), t('3.2.2 Representación y evaluación de predicados', 'C', r.sets),
          t('3.3 Álgebra declarativa', 'F'), t('3.4 Inducción matemática', 'C', r.props), t('3.5 Aplicaciones en la computación', 'F')],
        cards: [
          card('Definición', 'Argumento válido', 'Un argumento es válido si en ninguna fila de la tabla las premisas son verdaderas y la conclusión falsa, es decir, si (P₁ ∧ … ∧ Pₙ) → C es tautología.', r.props),
          card('Regla', 'Negación de cuantificadores', '¬∀x P(x) ≡ ∃x ¬P(x) y ¬∃x P(x) ≡ ∀x ¬P(x). El orden importa: ∀x∃y no equivale a ∃y∀x.', r.sets),
          card('Método', 'Inducción matemática', 'Se prueba P(n₀) y que P(k) implica P(k + 1). Ejemplo: 1 + 2 + … + n = n(n + 1)/2.', r.props),
          card('Definición', 'Álgebra declarativa', 'Se describe qué se cumple (hechos y reglas como p ∧ q → r) en lugar de cómo calcularlo; un motor de inferencia deduce las consecuencias. Es la base de Prolog y de SQL.'),
          card('Contraejemplo', 'Falacia de afirmar el consecuente', 'De p → q y q no se sigue p: con p falsa y q verdadera las premisas valen y la conclusión no.', r.props),
        ],
      },
      {
        id: 'log-4', title: 'Unidad IV. Álgebra booleana',
        topics: [t('4.1 Teoremas y postulados', 'F'), t('4.2 Optimización de expresiones booleanas', 'C', r.bool), t('4.3.1 Minitérminos y maxitérminos', 'C', r.bool),
          t('4.3.2 Circuitos lógicos', 'C', r.bool)],
        cards: [
          card('Teorema', 'Postulados de Huntington', 'Conmutatividad, distributividad, identidades (x + 0 = x, x·1 = x) y complemento (x + x′ = 1, x·x′ = 0). De ellos salen idempotencia, absorción y De Morgan.'),
          card('Método', 'Mapa de Karnaugh', 'Se agrupan unos adyacentes en bloques de 1, 2, 4 u 8 celdas, lo más grandes posible; cada bloque da un implicante primo.', r.bool),
          card('Ejemplo', 'Absorción', 'xy + xy′ + x′y = x + y: los dos primeros términos dan x y luego x + x′y = x + y.', r.bool),
          card('Error frecuente', 'NAND no es asociativa', '(x NAND y) NAND z ≠ x NAND (y NAND z): las redes NAND se construyen por niveles, no agrupando a voluntad.'),
        ],
      },
      {
        id: 'log-5', title: 'Unidad V. Teoría de grafos',
        topics: [t('5.1 Elementos y componentes de los grafos', 'C', r.graphs), t('5.1.1 Tipos de grafos', 'C', r.graphs), t('5.2.1 Representación matemática', 'C', r.graphs),
          t('5.2.2 Representación computacional', 'P', r.graphs), t('5.3.1 Camino más corto', 'C', r.graphs), t('5.3.2 Recorrido a lo ancho', 'C', r.graphs), t('5.3.3 Recorrido en profundidad', 'C', r.graphs)],
        cards: [
          card('Teorema', 'Lema del apretón de manos', 'La suma de los grados es 2|E|, así que el número de vértices de grado impar es par. Un grafo conexo tiene circuito de Euler si todos sus grados son pares.', r.graphs),
          card('Método', 'Dijkstra', 'Con pesos no negativos, se fija en cada paso el vértice no visitado de menor distancia tentativa y se relajan sus aristas.', r.graphs),
          card('Ejemplo', 'BFS frente a DFS', 'BFS visita por niveles y da caminos con el menor número de aristas; DFS profundiza primero y sirve para detectar ciclos y componentes.', r.graphs),
          card('Contraejemplo', 'Dijkstra con pesos negativos', 'Con aristas A→B de peso 2, A→C de peso 3 y C→B de peso −2, Dijkstra fija B con distancia 2, pero el camino A→C→B cuesta 1.'),
        ],
      },
      {
        id: 'log-6', title: 'Unidad VI. Árboles y redes',
        topics: [t('6.1.1 Componentes y propiedades', 'C', r.graphs), t('6.1.2 Clasificación por altura y nodos', 'C', r.graphs), t('6.2 Árboles con peso', 'C', r.graphs),
          t('6.2.1 Recorrido de un árbol', 'C', r.graphs), t('6.3.1 Flujo máximo', 'C', r.graphs), t('6.3.2 Corte mínimo', 'C', r.graphs), t('6.3.3 Pareos y redes de Petri', 'C', r.graphs)],
        cards: [
          card('Teorema', 'Caracterización de árboles', 'Un grafo con n vértices es un árbol si es conexo y tiene n − 1 aristas, o si entre cada par de vértices hay un único camino.'),
          card('Teorema', 'Flujo máximo y corte mínimo', 'El valor del flujo máximo de s a t es igual a la capacidad mínima de un corte que separa s de t (Ford-Fulkerson).', r.graphs),
          card('Ejemplo', 'Recorridos', 'En el árbol con raíz A, hijos B y C, y D hijo izquierdo de B: preorden A B D C, inorden D B A C, postorden D B C A.', r.graphs),
          card('Error frecuente', 'Kruskal con ciclos', 'Kruskal toma la arista más barata que no forme ciclo; si se acepta una que cierra un ciclo el resultado deja de ser árbol.'),
        ],
      },
    ],
  },
  {
    id: 'em', subject: 'Electromagnetismo', group: 'fi', units: [
      {
        id: 'em-1', title: 'Unidad 1. Electricidad',
        topics: [t('Carga, materia e historia del electromagnetismo', 'F'), t('Electrización, conductores y aisladores', 'F'), t('Cuantización de la carga', 'F'),
          t('Ley de Coulomb', 'C', r.em), t('Campo eléctrico y superposición', 'C', r.emStat), t('Flujo eléctrico', 'C', r.em), t('Ley de Gauss integral y diferencial', 'C', r.emStat),
          t('Distribuciones continuas de carga', 'C', r.emStat), t('Potencial eléctrico escalar', 'C', r.emStat), t('Líneas de fuerza y equipotenciales', 'P', r.emStat),
          t('Dipolo eléctrico', 'C', r.emStat), t('Multipolos eléctricos lineales', 'F'), t('Campo como gradiente del potencial', 'C', r.emStat), t('Energía eléctrica', 'C', r.emStat)],
        cards: [
          card('Fórmula', 'Coulomb y superposición', 'F = kq₁q₂/r² con k = 8,988·10⁹ N·m²/C². El campo de varias cargas es la suma vectorial de los campos de cada una.', r.em),
          card('Teorema', 'Gauss', '∮ E·dA = Q_enc/ε₀, o en forma diferencial ∇·E = ρ/ε₀. Con simetría esférica, cilíndrica o plana da E directamente.', r.emStat),
          card('Fórmula', 'Potencial y multipolos', 'E = −∇V. Lejos de una distribución, V se desarrolla en monopolo (Q/r), dipolo (p cos θ/r²) y términos de orden superior; una carga neta nula deja dominante el dipolo.'),
          card('Ejemplo', 'Esfera conductora', 'Con carga Q y radio R, E = 0 dentro y E = kQ/r² fuera; el potencial es kQ/R constante en todo el interior.', r.emStat),
          card('Error frecuente', 'Gauss sin simetría', 'La ley de Gauss siempre se cumple, pero solo permite despejar E cuando la simetría hace E constante sobre la superficie gaussiana.'),
        ],
      },
      {
        id: 'em-2', title: 'Unidad 2. Campo eléctrico en dieléctricos',
        topics: [t('Homogeneidad, linealidad e isotropía', 'F'), t('Dieléctricos y permitividad', 'C', r.emStat), t('Polarización', 'P', r.emStat),
          t('Capacitor y capacitancia', 'C', r.em), t('Cálculo de la capacitancia', 'C', r.emStat), t('Energía y densidad de energía', 'C', r.emStat),
          t('Circuitos con capacitores', 'C', r.emCirc), t('Efecto de un dieléctrico', 'C', r.emStat), t('Gauss en un dieléctrico, div D y div P', 'P', r.emStat),
          t('Teorema de la divergencia', 'F'), t('Laplaciano, Poisson y Laplace', 'C', r.emStat)],
        cards: [
          card('Fórmula', 'Capacitores', 'Placas paralelas: C = κε₀A/d. Energía U = Q²/(2C) = CV²/2 y densidad u = ε E²/2.', r.em),
          card('Fórmula', 'D, P y E', 'D = ε₀E + P = εE en medios lineales e isótropos; ∇·D = ρ_libre y ∇·P = −ρ_ligada.'),
          card('Ejemplo', 'Dieléctrico con la batería conectada', 'V se mantiene: C y Q se multiplican por κ y la energía también. Si el capacitor está aislado, Q se mantiene y la energía se divide por κ.', r.emStat),
          card('Teorema', 'Divergencia y Poisson', '∮ F·dA = ∭ ∇·F dV. Junto con E = −∇V da ∇²V = −ρ/ε (Poisson), y ∇²V = 0 donde no hay carga (Laplace).', r.emStat),
        ],
      },
      {
        id: 'em-3', title: 'Unidad 3. Corriente y resistencia',
        topics: [t('Corriente eléctrica', 'C', r.emCirc), t('Resistencia y ley de Ohm', 'C', r.em), t('Efecto de la temperatura', 'P', r.emCirc),
          t('Energía y potencia eléctrica', 'C', r.emCirc), t('Fuerza electromotriz', 'C', r.emCirc), t('Resistencias en serie y en paralelo', 'C', r.emCirc),
          t('Reglas de Kirchhoff', 'C', r.emCirc), t('Circuitos RC', 'C', r.emCirc)],
        cards: [
          card('Fórmula', 'Ohm y resistividad', 'V = IR con R = ρL/A; con la temperatura, ρ ≈ ρ₀[1 + α(T − T₀)]. La potencia disipada es P = VI = I²R.', r.emCirc),
          card('Regla', 'Kirchhoff', 'Nodos: la suma de corrientes que entran es igual a la de las que salen. Mallas: la suma de las caídas de tensión en un lazo cerrado es cero.', r.emCirc),
          card('Ejemplo', 'Carga de un RC', 'Con R = 1 kΩ y C = 10 µF, τ = RC = 10 ms; el capacitor llega al 63 % de la tensión final en un τ y al 99 % en unos 5τ.', r.emCirc),
          card('Error frecuente', 'Paralelo no es suma', 'En paralelo se suman las conductancias: 1/R = 1/R₁ + 1/R₂. Dos resistencias de 10 Ω en paralelo dan 5 Ω, no 20 Ω.'),
        ],
      },
      {
        id: 'em-4', title: 'Unidad 4. Campo magnético estacionario',
        topics: [t('Campo magnético y sus fuentes', 'C', r.emMag), t('Fuerza entre elementos de corriente', 'C', r.emMag), t('Torque sobre un lazo de corriente', 'C', r.emMag),
          t('Partícula cargada en un campo', 'C', r.emMag), t('Efecto Hall', 'C', r.emMag), t('Ley de Biot-Savart', 'C', r.emMag), t('Ley de Ampère', 'C', r.emMag),
          t('Flujo y ley de Gauss del magnetismo', 'F'), t('Ampère diferencial y rotacional de Maxwell', 'F'), t('Potencial vectorial magnético', 'F'),
          t('Propiedades magnéticas de la materia', 'P', r.emMag), t('Partículas en campos E y B', 'C', r.em), t('Energía magnética', 'P', r.emMag)],
        cards: [
          card('Fórmula', 'Lorentz y órbita', 'F = q(E + v × B). En B uniforme con v ⊥ B, la carga describe una circunferencia de radio r = mv/(|q|B).', r.em),
          card('Teorema', 'Biot-Savart y Ampère', 'dB = (µ₀/4π) I dl × r̂ / r². Con simetría, ∮ B·dl = µ₀ I_enc da el hilo (µ₀I/2πr) y el solenoide (µ₀nI).', r.emMag),
          card('Fórmula', 'Divergencia, rotacional y A', '∇·B = 0 (no hay monopolos) y ∇×B = µ₀J en régimen estacionario. Por eso B = ∇×A, con A el potencial vectorial.'),
          card('Ejemplo', 'Espira circular', 'En el centro de una espira de radio R con corriente I, B = µ₀I/(2R). Su momento magnético es µ = IA y el torque τ = µ × B.', r.emMag),
          card('Error frecuente', 'Sentido de la fuerza', 'v × B se evalúa con la regla de la mano derecha para una carga positiva; para un electrón la fuerza apunta al lado contrario.'),
        ],
      },
      {
        id: 'em-5', title: 'Unidad 5. Campos magnéticos no estacionarios',
        topics: [t('Ley de Faraday', 'C', r.em), t('Ley de Lenz', 'C', r.emMag), t('Teorema de Stokes', 'F'), t('Maxwell a partir de Faraday', 'F'),
          t('FEM inducida y autoinducida', 'C', r.emMag), t('Circuitos RL', 'C', r.emCirc), t('Circuitos LC', 'C', r.wOsc)],
        cards: [
          card('Teorema', 'Faraday-Lenz', 'ε = −N dΦ/dt. El signo menos (Lenz) indica que la corriente inducida se opone al cambio de flujo que la produce.', r.em),
          card('Teorema', 'Stokes y forma diferencial', '∮ E·dl = ∬ (∇×E)·dA. Aplicado a Faraday da ∇×E = −∂B/∂t.'),
          card('Ejemplo', 'Barra sobre rieles', 'Una barra de longitud L que se mueve con rapidez v en B perpendicular induce ε = BLv; con resistencia R circula I = BLv/R.', r.emMag),
          card('Fórmula', 'RL y LC', 'RL: I(t) = (ε/R)(1 − e^(−tR/L)), con τ = L/R. LC: la carga oscila con ω = 1/√(LC) y la energía pasa del capacitor al inductor.', r.emCirc),
        ],
      },
      {
        id: 'em-6', title: 'Unidad 6. Corriente alterna',
        topics: [t('Corriente alterna', 'C', r.emCirc), t('Circuito RLC en serie', 'C', r.emCirc), t('Ecuaciones de Maxwell', 'P', r.em)],
        cards: [
          card('Fórmula', 'Impedancia', 'Z = √(R² + (X_L − X_C)²) con X_L = ωL y X_C = 1/(ωC); la fase cumple tan φ = (X_L − X_C)/R.', r.emCirc),
          card('Teorema', 'Ecuaciones de Maxwell', '∇·E = ρ/ε₀, ∇·B = 0, ∇×E = −∂B/∂t y ∇×B = µ₀J + µ₀ε₀∂E/∂t. En el vacío predicen ondas con c = 1/√(µ₀ε₀).', r.em),
          card('Ejemplo', 'Resonancia', 'Con L = 0,1 H y C = 10 µF, ω₀ = 1/√(LC) = 1000 rad/s: ahí X_L = X_C, Z = R y la corriente es máxima.', r.emCirc),
          card('Error frecuente', 'Sumar tensiones eficaces', 'En RLC, V_R + V_L + V_C no da la tensión de la fuente: los fasores están desfasados y se suman como vectores.'),
        ],
      },
    ],
  },
  {
    id: 'mecanica', subject: 'Mecánica', group: 'fi', units: [
      {
        id: 'mec-1', title: 'Unidad 1. Métodos vectoriales',
        topics: [t('Magnitudes escalares y vectoriales', 'F'), t('Adición y resta de vectores', 'C', r.mForces), t('Producto escalar y vectorial', 'C', r.mForces)],
        cards: [
          card('Definición', 'Escalares y vectores', 'Un escalar tiene solo magnitud (masa, energía); un vector, magnitud y dirección (fuerza, velocidad), y se suma por componentes.'),
          card('Fórmula', 'Ángulo entre vectores', 'cos θ = A·B/(|A||B|). A·B = 0 indica vectores perpendiculares y A × B = 0, paralelos.', r.mForces),
          card('Ejemplo', 'Proyección', 'La componente de A = (3, 4) sobre la dirección de B = (1, 0) es A·B/|B| = 3.'),
        ],
      },
      {
        id: 'mec-2', title: 'Unidad 2. Fuerzas',
        topics: [t('Composición y descomposición de fuerzas', 'C', r.mForces), t('Torque sobre cuerpos rígidos', 'C', r.mForces),
          t('Equilibrio de una partícula', 'C', r.mForces), t('Equilibrio del cuerpo rígido', 'C', r.mForces)],
        cards: [
          card('Teorema', 'Condiciones de equilibrio', 'Partícula: ΣF = 0. Cuerpo rígido: además Στ = 0 respecto de cualquier punto.', r.mForces),
          card('Fórmula', 'Torque', 'τ = r × F; en el plano τ = xFy − yFx. Conviene tomar momentos respecto del punto donde actúan más incógnitas.'),
          card('Ejemplo', 'Viga apoyada', 'Una viga de 4 m y 200 N con una carga de 400 N a 1 m del apoyo izquierdo: R₂ = (200·2 + 400·1)/4 = 200 N y R₁ = 400 N.', r.mForces),
        ],
      },
      {
        id: 'mec-3', title: 'Unidad 3. Movimiento de la partícula',
        topics: [t('Marco de referencia', 'F'), t('Posición, velocidad y aceleración instantáneas', 'C', r.mFrames), t('MRU y MRUA', 'C', r.mMotion),
          t('Movimiento bidimensional', 'C', r.mProj), t('Aceleración constante', 'C', r.mMotion), t('Componentes tangencial y radial', 'C', r.mFrames),
          t('Movimiento circular uniforme y acelerado', 'C', r.mFrames)],
        cards: [
          card('Fórmula', 'Cinemática', 'v = dr/dt, a = dv/dt. Con a constante: x = x₀ + v₀t + at²/2 y v² = v₀² + 2a(x − x₀).', r.mMotion),
          card('Fórmula', 'Aceleración en curvas', 'a_t = dv/dt cambia la rapidez y a_r = v²/r cambia la dirección; |a| = √(a_t² + a_r²).', r.mFrames),
          card('Ejemplo', 'Tiro parabólico', 'Con v₀ = 20 m/s a 45° y g = 9,8 m/s², el alcance en suelo plano es v₀² sen 2θ/g ≈ 40,8 m.', r.mProj),
          card('Error frecuente', 'Rapidez constante no es aceleración nula', 'En movimiento circular uniforme la rapidez no cambia, pero la velocidad sí: hay aceleración centrípeta.'),
        ],
      },
      {
        id: 'mec-4', title: 'Unidad 4. Movimiento relativo',
        topics: [t('Velocidad relativa', 'C', r.mFrames), t('Transformaciones galileanas', 'C', r.mFrames), t('Traslación relativa uniforme', 'C', r.mFrames),
          t('Rotación relativa uniforme', 'C', r.mFrames), t('Movimiento relativo a la Tierra', 'P', r.mFrames)],
        cards: [
          card('Fórmula', 'Galileo', 'r′ = r − Vt y v′ = v − V para un marco que se traslada con velocidad constante V; la aceleración es la misma en ambos.', r.mFrames),
          card('Fórmula', 'Marco giratorio', 'v_rel = v − ω × r. En aceleraciones aparecen la centrífuga −ω × (ω × r) y la de Coriolis −2ω × v_rel.'),
          card('Ejemplo', 'Cruzar un río', 'Un bote de 5 m/s en una corriente de 3 m/s debe apuntar con sen θ = 3/5 aguas arriba para cruzar en línea recta, a 4 m/s.', r.mFrames),
        ],
      },
      {
        id: 'mec-5', title: 'Unidad 5. Dinámica de la partícula',
        topics: [t('Leyes de Newton', 'C', r.mDyn), t('Cantidad de movimiento y su conservación', 'C', r.mColl), t('Acción y reacción', 'F'),
          t('Partícula en un campo de fuerzas', 'P', r.mForces), t('Momento angular y su conservación', 'C', r.mRot), t('Fuerzas centrales 1/r²', 'P', r.mRot)],
        cards: [
          card('Teorema', 'Segunda ley', 'ΣF = dp/dt = ma para masa constante. Sin fuerza externa neta, p se conserva.', r.mDyn),
          card('Teorema', 'Fuerza central', 'Si F apunta siempre hacia un centro, el torque respecto de él es nulo y L = r × mv se conserva: la órbita es plana.', r.mRot),
          card('Ejemplo', 'Plano inclinado con fricción', 'Con θ = 30° y µ = 0,2, a = g(sen θ − µ cos θ) ≈ 3,2 m/s².', r.mForces),
          card('Error frecuente', 'Acción y reacción no se anulan', 'El par acción-reacción actúa sobre cuerpos distintos, así que nunca se cancela en el diagrama de un mismo cuerpo.'),
        ],
      },
      {
        id: 'mec-6', title: 'Unidad 6. Trabajo y energía',
        topics: [t('Trabajo', 'C', r.mForces), t('Potencia', 'C', r.mForces), t('Energía cinética', 'C', r.mDyn), t('Energía potencial', 'C', r.mDyn),
          t('Conservación de la energía', 'C', r.mForces), t('Fuerzas conservativas', 'C', r.mForces), t('Fuerzas centrales', 'P', r.mRot),
          t('Curvas de energía potencial', 'C', r.mForces), t('Fuerzas no conservativas', 'P', r.mForces)],
        cards: [
          card('Teorema', 'Trabajo y energía', 'W_neto = ΔK. Si solo actúan fuerzas conservativas, K + U se conserva; las no conservativas cumplen W_nc = ΔE.', r.mForces),
          card('Criterio', 'Curva de energía potencial', 'F = −dU/dx. Los equilibrios son los puntos con U′ = 0: mínimo de U estable, máximo inestable. El movimiento solo ocurre donde E ≥ U.', r.mForces),
          card('Ejemplo', 'Resorte que lanza un bloque', 'Con k = 200 N/m comprimido 0,1 m, un bloque de 0,5 kg sale con v = x√(k/m) = 2 m/s.', r.mForces),
        ],
      },
      {
        id: 'mec-7', title: 'Unidad 7. Sistemas de partículas',
        topics: [t('Movimiento del centro de masa', 'C', r.mColl), t('Masa reducida', 'C', r.mColl), t('Momento angular del sistema', 'C', r.mColl),
          t('Energía cinética del sistema', 'C', r.mColl), t('Conservación de la energía del sistema', 'P', r.mColl), t('Impulso y cantidad de movimiento', 'C', r.mColl),
          t('Choques en una dimensión', 'C', r.mColl), t('Choques en dos y tres dimensiones', 'P', r.mColl)],
        cards: [
          card('Teorema', 'Centro de masa', 'M a_CM = ΣF_ext: el CM se mueve como una partícula con toda la masa. K = MV_CM²/2 + K_rel.', r.mColl),
          card('Fórmula', 'Choques', 'Siempre se conserva p. Elástico: también K, y e = 1. Perfectamente inelástico: los cuerpos quedan unidos (e = 0).', r.mColl),
          card('Ejemplo', 'Péndulo balístico', 'Una bala de 10 g a 300 m/s se incrusta en un bloque de 2 kg: V = 0,01·300/2,01 ≈ 1,49 m/s y sube h = V²/2g ≈ 11 cm.', r.mColl),
          card('Error frecuente', 'La energía no se conserva en el choque', 'En el péndulo balístico se conserva p durante el choque y la energía solo después; usar energía en el choque da una velocidad falsa.'),
        ],
      },
      {
        id: 'mec-8', title: 'Unidad 8. Cuerpo rígido',
        topics: [t('Momento angular del cuerpo rígido', 'C', r.mRot), t('Cálculo del momento de inercia', 'C', r.mRot),
          t('Ecuación de rotación', 'C', r.mRot), t('Energía cinética de rotación', 'C', r.mRot)],
        cards: [
          card('Fórmula', 'Rotación', 'Στ = Iα y K_rot = Iω²/2. Steiner: I = I_CM + Md².', r.mRot),
          card('Ejemplo', 'Rodadura por un plano', 'Un cilindro macizo (I = mR²/2) rueda sin deslizar con a = g sen θ/(1 + 1/2) = (2/3) g sen θ.', r.mRot),
          card('Ejemplo', 'Patinador', 'Al recoger los brazos I disminuye y ω aumenta, porque Iω se conserva; la energía cinética crece por el trabajo de los músculos.', r.mRot),
        ],
      },
      {
        id: 'mec-9', title: 'Unidad 9. Interacciones gravitacionales',
        topics: [t('Ley de gravitación de Newton', 'C', r.mRot), t('Masas inercial y gravitacional', 'F'), t('Energía potencial gravitacional', 'C', r.mRot),
          t('Movimiento general bajo la gravedad', 'P', r.mRot), t('Leyes de Kepler', 'P', r.mRot), t('Principio de equivalencia', 'F')],
        cards: [
          card('Fórmula', 'Órbita circular', 'v = √(GM/r), T = 2π√(r³/GM) (tercera ley de Kepler) y E = −GMm/(2r).', r.mRot),
          card('Teorema', 'Leyes de Kepler', 'Órbitas elípticas con el Sol en un foco; áreas iguales en tiempos iguales (conservación de L); T² ∝ a³.'),
          card('Definición', 'Principio de equivalencia', 'La masa inercial (de F = ma) y la gravitacional (de F = GMm/r²) son iguales; por eso todos los cuerpos caen con la misma aceleración.'),
          card('Ejemplo', 'Ápsides', 'Por conservación de L, r_p v_p = r_a v_a: un satélite va más rápido en el perigeo que en el apogeo.', r.mRot),
        ],
      },
    ],
  },
  {
    id: 'ondas', subject: 'Ondas', group: 'fi', units: [
      {
        id: 'ond-1', title: 'Unidad 1. Teoría de las oscilaciones',
        topics: [t('MAS: masa y resorte, ecuación diferencial', 'C', r.wOsc), t('Péndulo simple y físico', 'C', r.wOsc), t('Oscilaciones amortiguadas', 'C', r.wOsc),
          t('Oscilaciones forzadas y resonancia', 'C', r.wOsc), t('Superposición en un eje, misma frecuencia (fasores)', 'C', r.wOsc),
          t('Superposición en un eje, frecuencias distintas (pulsaciones)', 'C', r.wOsc), t('Oscilaciones en un plano (Lissajous)', 'C', r.wOsc)],
        cards: [
          card('Fórmula', 'MAS', 'mx″ + kx = 0 da x = A cos(ωt + φ) con ω = √(k/m). Péndulo simple: T = 2π√(L/g) para ángulos pequeños.', r.wOsc),
          card('Fórmula', 'Amortiguado y forzado', 'mx″ + bx′ + kx = F₀ cos ω_d t. Si b² < 4mk oscila con ω′ = √(ω₀² − (b/2m)²); la amplitud forzada es máxima cerca de ω₀.', r.wOsc),
          card('Ejemplo', 'Pulsaciones', 'Dos sonidos de 440 y 446 Hz se oyen como uno de 443 Hz cuya intensidad sube y baja 6 veces por segundo.', r.wOsc),
          card('Error frecuente', 'La amplitud de la suma', 'Dos MAS de igual frecuencia y amplitudes 3 y 4 no dan amplitud 7 salvo en fase: con desfase de 90° dan 5.', r.wOsc),
        ],
      },
      {
        id: 'ond-2', title: 'Unidad 2. Movimiento ondulatorio',
        topics: [t('2.1 Onda viajera, ecuación de onda y parámetros', 'C', r.wMech), t('2.2 Ondas en cuerdas, sólidos, líquidos y gases', 'C', r.wMech),
          t('2.2 Energía y potencia transmitida', 'C', r.wMech), t('2.2 Sonido, intensidad y decibelios', 'C', r.wMech), t('2.2 Efecto Doppler y cono de Mach', 'C', r.wMech),
          t('2.3 Superposición longitudinal: tubos', 'C', r.wMech), t('2.4 Superposición transversal: ondas estacionarias', 'C', r.wMech),
          t('Reflexión y transmisión en una frontera', 'C', r.wMech), t('Dispersión', 'C', r.wMech)],
        cards: [
          card('Fórmula', 'Onda viajera', 'y = A sen(kx − ωt) viaja a v = ω/k = λf y cumple ∂²y/∂t² = v² ∂²y/∂x². En una cuerda, v = √(T/µ).', r.wMech),
          card('Fórmula', 'Armónicos', 'Cuerda fija o tubo abierto-abierto: fₙ = nv/(2L). Tubo cerrado-abierto: solo armónicos impares, fₙ = nv/(4L).', r.wMech),
          card('Ejemplo', 'Doppler', 'Una fuente de 500 Hz que se acerca a 30 m/s se oye a 500·343/(343 − 30) ≈ 548 Hz.', r.wMech),
          card('Error frecuente', 'Sumar decibelios', 'Dos fuentes de 60 dB no dan 120 dB: se suman intensidades y el total es 63 dB.', r.wMech),
        ],
      },
      {
        id: 'ond-3', title: 'Unidad 3. Ondas electromagnéticas',
        topics: [t('Onda EM, relación E = cB e intensidad', 'C', r.wOpt), t('Espectro: frecuencia y longitud de onda', 'C', r.wOpt), t('Refracción e incidencia normal', 'C', r.wOpt),
          t('Polarización y ley de Malus', 'C', r.wOpt), t('Interferencia de Young', 'C', r.wOpt), t('Películas delgadas y anillos de Newton', 'C', r.wOpt),
          t('Varias rendijas y redes de difracción', 'C', r.wOpt)],
        cards: [
          card('Fórmula', 'Onda EM en el vacío', 'E₀ = cB₀, c = 1/√(µ₀ε₀) e intensidad I = E₀²/(2µ₀c). En un medio, v = c/n y λ = λ₀/n.', r.wOpt),
          card('Fórmula', 'Interferencia de dos rendijas', 'Máximos en d sen θ = mλ; en pantalla lejana, y_m ≈ mλL/d.', r.wOpt),
          card('Ejemplo', 'Polarizadores cruzados', 'Luz no polarizada de 100 W/m² a través de polarizadores a 0°, 45° y 90°: 50 → 25 → 12,5 W/m². Sin el intermedio llegaría 0.', r.wOpt),
          card('Error frecuente', 'Cambio de fase por reflexión', 'Al reflejarse en un medio de mayor índice la onda gana media longitud de onda; olvidarlo invierte las condiciones de máximo y mínimo en películas delgadas.'),
        ],
      },
    ],
  },
];

export const STATUS = { C: 'Cubierto', P: 'Parcial', F: 'Ficha', N: 'Pendiente' };
export const CARD_KINDS = ['Definición', 'Teorema', 'Fórmula', 'Regla', 'Criterio', 'Método', 'Ejemplo', 'Contraejemplo', 'Error frecuente'];

// Conteo de subtemas por estado, para una materia o para todo el temario.
export function coverageCounts(subjects = THEORY) {
  const counts = { C: 0, P: 0, F: 0, N: 0, total: 0 };
  for (const subject of subjects) for (const unit of subject.units) for (const topic of unit.topics) {
    counts[topic.status]++;
    counts.total++;
  }
  return counts;
}
