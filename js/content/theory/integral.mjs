import { ROUTES as r, t, card } from './helpers.mjs';

export const integral = {
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
};
