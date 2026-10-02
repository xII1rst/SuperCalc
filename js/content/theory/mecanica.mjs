import { ROUTES as r, t, card } from './helpers.mjs';

export const mecanica = {
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
};
