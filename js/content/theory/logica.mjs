import { ROUTES as r, t, card } from './helpers.mjs';

export const logica = {
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
};
