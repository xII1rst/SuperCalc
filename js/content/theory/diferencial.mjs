import { ROUTES as r, t, card } from './helpers.mjs';

export const diferencial = {
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
};
