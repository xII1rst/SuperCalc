import { ROUTES as r, t, card } from './helpers.mjs';

export const ondas = {
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
};
