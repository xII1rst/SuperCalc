# SuperCalc v1.9.4

**Progressive Web App** de cálculo científico y visualización matemática.  
Desarrollada por **Ing. Rafael Miranda (xII1rst)**  
Disponible en: https://xii1rst.github.io/SuperCalc

---

## Descripción

SuperCalc es una calculadora científica avanzada orientada a estudiantes e ingenieros.  
Permite realizar operaciones vectoriales, matriciales, de cálculo diferencial e integral,
análisis electromagnético y graficación — todo con visualización en canvas 3D interactivo,
sin necesidad de instalación ni conexión a internet tras la primera carga.

---

## Módulos

### AL — Álgebra Lineal

#### Vectores 3D
- Hasta 10 vectores simultáneos con nombres y colores personalizados
- Modos R² y R³ con canvas 3D rotable (drag + pinch-zoom)
- **Tab Vectores** — Suma, resta, escalar. Grafica todos los vectores activos con sombras de proyección
- **Tab Cálculos** — Producto punto, ángulo, proyecciones escalares/vectoriales, producto cruz. Resultados con pasos detallados expandibles
- **Tab Operaciones** — Combinaciones lineales (suma ponderada de N vectores activos)
- **Tab Ecuación** — Ecuación vectorial de la línea (punto + dirección), grafica la recta
- **Tab Incógnita** — Resuelve `αA + βB = C` para el escalar o vector desconocido
- **Tab Triángulo** — 3 puntos P/Q/R en R³: lados (notación √n), ángulos (D°MM'SS"), perímetro, área, verificación 180°
- **Tab Figuras** — Grafica figuras geométricas 3D sobre el canvas: esfera, cilindro, cono, plano, toro. Color y opacidad configurables

#### Matrices & Ec. Lineales
- Operaciones básicas (suma, resta, escalar, transpuesta)
- Determinante e inversa
- Sistemas de ecuaciones por Gauss-Jordan con aritmética exacta de fracciones (modo FRAC/DEC)
- Eigenvalores y eigenvectores (2×2 y 3×3)

#### Inecuaciones
- Lineal (ax + b < c), cuadrática, sistema de dos inecuaciones, valor absoluto |ax+b| ≤ c

---

### FÍS — Física

#### Electromagnetismo
- **Coulomb** — Fuerza entre dos cargas; distancia calculada desde posiciones; vectores F y E graficados a escala normalizada
- **Gauss** — Flujo eléctrico; geometrías esfera, cilindro, plano infinito
- **Potencial** — V en A y B, ΔV, trabajo W = qΔV, campo E en ambos puntos
- **Lorentz** — F = q(E + v×B); vectores v, E, B, F graficados con normalización independiente
- **Faraday** — FEM inducida ε = −N·dΦ/dt, flujo magnético, N vueltas
- **Maxwell** — Onda EM en el vacío: B₀, λ, ω, k, Poynting S, densidades u_E y u_B
- **Panel Figuras** — Superpone figuras 3D (esfera, cilindro, cono, plano, toro) al canvas EM

---

### CAL — Cálculo

#### Diferencial
- Límites numéricos (extrapolación de Richardson)
- Derivadas: primera, segunda, tercera en un punto
- Análisis completo de función: monotonía, concavidad, extremos, inflexiones

#### Integral
- Integral indefinida (reglas básicas)
- Integral definida (Simpson 3/8)
- Series de Taylor/Maclaurin hasta orden n

#### Multivariable
- Derivadas parciales ∂f/∂x, ∂f/∂y
- Gradiente ∇f en un punto
- Integral doble numérica (Simpson 2D)

#### Ecuaciones Diferenciales
- 1er orden separable (Euler + RK4)
- 1er orden lineal y' + p(x)y = q(x)
- 2do orden coeficientes constantes (característica)

#### Graficar
- Funciones: lineal, cuadrática, valor absoluto, exponencial, seno, coseno
- Canvas interactivo con etiquetas de ejes

---

## Tecnología

| Elemento | Detalle |
|---|---|
| Plataforma | PWA (Progressive Web App) |
| Archivos | `index.html` · `style.css` · `app.js` |
| Tipografía | Space Grotesk · Space Mono (Google Fonts) |
| Canvas | HTML5 Canvas 2D (proyección isométrica 3D) |
| Offline | Service Worker con estrategia network-first para núcleo, cache-first para fuentes |
| Instalación | Add to Home Screen (Android/iOS) o banner nativo |
| Hosting | GitHub Pages / Vercel |

---

## Tokens de diseño

```
--al:  #7c6af7   violeta       Álgebra Lineal
--al2: #a594ff   violeta claro
--fi:  #22d3ee   cian          Física
--fi2: #67e8f9   cian claro
--ca:  #10b981   esmeralda     Cálculo
--ca2: #34d399   esmeralda claro
--accent: #f0c040  dorado      Vectores / énfasis
--bg:       #080c14
--surface:  #0d1220
--surface2: #111827
--border:   #1e2d45
--text1:    #e8f0fc
--text3:    #3a5a7a
```

---

## Historial de versiones

| Versión | Cambios |
|---|---|
| **v1.9.4** | Correcciones EM: Coulomb sin campo `r` manual (distancia desde posiciones), validación posiciones iguales, Lorentz escala normalizada por vector, `emRenderAllPanels` no destruye inputs al cambiar coordenadas |
| **v1.9.3** | Tab Figuras 3D en AL Vectores (esfera, cilindro, cono, plano, toro). Panel flotante de figuras en EM. Motor de malla compartido con Painter's algorithm |
| **v1.9.2** | Icono PWA actualizado a Ω atómico. Tarjetas del launcher sin descripción, alineación por altura fija. Autor fijo en parte inferior de pantalla |
| **v1.9.1** | Tab Triángulo 3D (P/Q/R, lados √n, ángulos DMS, área, pasos). Math-cards con toggle de pasos. Layout desktop responsive (flex-row canvas+panel). Notación radical y DMS |
| **v1.9.0** | Logo Ω atómico SVG con electrones animados (∑ violeta, π cian, ∂ dorado). Canvas de fórmulas matemáticas de fondo. SW reescrito con estrategia network-first. Arquitectura 3 archivos |
| **v1.8.0** | Módulo Cálculo: Diferencial, Integral, Multivariable, EDO, Graficar |
| **v1.7.0** | Módulo Inecuaciones (lineal, cuadrática, sistema, valor absoluto) |
| **v1.6.0** | Módulo Matrices & Ec. Lineales con Gauss-Jordan en fracciones exactas, eigenvalores |
| **v1.5.0** | Arquitectura modular: Launcher → Submódulos (AL/FÍS). SUBMOD_CONFIG |
| **v1.4.0** | Módulo Electromagnetismo (Coulomb, Gauss, Lorentz, Faraday, Maxwell) |
| **v1.3.0** | Axis ticks adaptativos, figura geométrica toggle en canvas vectores |
| **v1.2.0** | Ecuación de línea (punto + dirección), solver de incógnita vectorial |
| **v1.1.0** | Operaciones vectoriales (prod. punto, ángulo, cruz, proyecciones) |
| **v1.0.0** | App inicial: vectores R²/R³, canvas 3D, PWA, GitHub Pages |

---

## Glosario de funciones principales

| Función | Descripción |
|---|---|
| `draw()` | Render principal del canvas AL vectores |
| `p3(x,y,z,cx,cy,s)` | Proyección isométrica 3D → 2D (AL) |
| `emDraw()` | Render canvas EM |
| `emP3(x,y,z)` | Proyección isométrica 3D → 2D (EM) |
| `renderFigure(ctx, projectFn, state)` | Motor compartido de figuras 3D |
| `genSphere/Cylinder/Cone/Plane/Torus` | Generadores de malla poligonal |
| `showTab(t)` | Navegación tabs AL vectores (V/M/O/E/I/T/F) |
| `figDraw()` / `figClear()` | Graficar/limpiar figura en AL |
| `emFigDraw()` / `emFigClear()` | Graficar/limpiar figura en EM |
| `launchSubmod(id)` | Abre módulo: vectors, em, mat, calc, ineq |
| `openSubmod(parent)` | Abre pantalla de submódulos AL/FÍS/CAL |
| `calcTab(t)` | Navegación tabs Cálculo (dif/int/mul/edo/graf) |
| `emCalcCoulomb()` | Fuerza de Coulomb desde posiciones |
| `emCalcLorentz()` | Fuerza de Lorentz F=q(E+v×B) |
| `matGauss()` | Eliminación Gauss-Jordan con fracciones |
| `triCalc()` | Triángulo 3D: lados, ángulos, área |
| `fDMS(deg)` | Formato grados°minutos'segundos" |
| `fMag(x)` | Magnitud con notación √n |
| `fN(x,dec)` | Decimal sin ceros trailing |
| `scBg()` | Canvas de fórmulas de fondo |
| `scLogoAnim()` | Animación electrones del logo Ω |

---

© 2026 Ing. Rafael Miranda (xII1rst) — SuperCalc
