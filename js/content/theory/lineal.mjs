import { ROUTES as r, t, card } from './helpers.mjs';

export const lineal = {
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
};
