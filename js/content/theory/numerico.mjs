import { ROUTES as r, t, card } from './helpers.mjs';

export const numerico = {
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
};
