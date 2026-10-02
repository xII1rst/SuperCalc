import { ROUTES as r, t, card } from './helpers.mjs';

export const multivariable = {
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
};
