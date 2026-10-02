import { ROUTES as r, t, card } from './helpers.mjs';

export const em = {
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
};
