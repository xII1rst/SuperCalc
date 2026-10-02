import { ROUTES as r, t, card } from './helpers.mjs';

export const edo = {
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
};
