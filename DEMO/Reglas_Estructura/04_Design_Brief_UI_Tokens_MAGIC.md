# 04 · Design Brief — MAGIC | Academic Editorial Architecture

**Versión:** 7.0 · 17/11/2026. **Fuente visual primaria:** `referencias_stitch/posgrados_investigaci_n/DESIGN.md` + 14 capturas `screen.png` / `code.html`. Su diseño **oscuro, terracota y salvia** sustituye la antigua identidad clara `Warm Editorial Roadmap` del ejemplo anterior.

## 1. Concepto de dirección de arte

Una plataforma de investigación debe parecer un **archivo académico contemporáneo**, no un LMS genérico ni un tablero financiero. Fondo carbón cálido, separaciones discretas, tarjetas de documento tipo papel, titulares editoriales, decisiones concisas y jerarquías que permiten leer durante horas. La interacción será refinada, no llamativa: movimientos mínimos, ninguna animación que sustituya el significado de la aprobación.

**Claves reconocibles en las 14 pantallas:** navegación oscura, barra lateral editorial, documento marfil central, encabezados Newsreader, controles Manrope, CTA terracota, etiquetas salvia para avales y ocre para revisión, microinformación sobre paneles laterales. Las variantes móviles muestran **composición adaptable** de esas mismas piezas.

## 2. Paleta y conflicto de diseño resuelto

El `DESIGN.md` incluye **dos niveles de color**: paleta Material exportada (por ejemplo `primary #ffb59f`, `surface #151311`) y descripción de uso visual más oscura/editorial (`primary #c05c3d`, canvas `#1e1c1a`). Para evitar que ambos compitan, declarar tokens propios de **uso final** y conservar los exportados solo como referencia de origen. Validar contrastes en render real.

| Token de implementación | Valor propuesto de la guía narrativa | Uso |
|---|---|---|
| `--canvas` | `#1e1c1a` | fondo general |
| `--recessed` | `#181614` | árbol de archivos y espacios hundidos |
| `--panel` | `#252220` | tarjetas, filtros, navegación |
| `--panel-raised` | `#2e2a27` | modal, menú, inspector |
| `--paper` | `#faf8f5` | actas, evidencia, documentos |
| `--paper-subtle` | `#f3efe9` | panel de documento secundario |
| `--ink-on-dark` | `#e7e2da` | texto general sobre carbón |
| `--ink-on-paper` | `#1e1c1a` | lectura sobre papel |
| `--muted` | `#a39d94` | metadatos de bajo énfasis, revisar contraste |
| `--terracotta` | `#c05c3d` | CTA primario y acción activa |
| `--terracotta-hover` | `#ab5034` | hover de CTA |
| `--sage` | `#2d5a3f` | validación o completado cuando corresponde |
| `--sage-ink` | `#8cb89f` | etiqueta sobre fondo oscuro |
| `--ochre` | `#c49a45` | revisión, advertencia no crítica |
| `--ochre-ink` | `#dfbe76` | texto de estado en revisión |
| `--error` | `#ffb4ab` | error y contraste sobre superficies oscuras |

**Contrastes:** no asumir que blanco sobre `#c05c3d` es WCAG AA para textos pequeños sin medir; si no cumple, ajustar token semántico sin abandonar identidad. Las etiquetas incluyen icono/texto y no solo color.

## 3. Tipografía, ritmo y layout

| Uso | Fuente | Desktop | Móvil |
|---|---|---|---|
| Hero | Newsreader | 48/56, peso 400 | 32/40 |
| H1 sección | Newsreader | 36/44 | 26/34 |
| H2 editorial | Newsreader | 28/36 | 24/32 |
| Cuerpo de lectura larga | Newsreader | 18/30 | 17/28 |
| UI y tablas | Manrope | 14/22 | 14–15/23 |
| Etiquetas/controles | Manrope | 12/16 semibold | 12–13/18 |

- Longitud ideal de lectura: 65–75 caracteres por línea en documentos narrativos.
- ≥1200px: malla 12 columnas, margen 48px, gutter 24px, max-width 1440px; sidebar alrededor de 320px cuando quepa.
- 768–1199px: malla 8 columnas, margen 32px, gutter 20px; convertir panel lateral en sección plegable.
- <768px: malla fluida 4 columnas, margen 20px, gutter 16px; una columna para formularios y documentos.
- Espaciados: 4, 8, 16, 24, 40 px; radio contenido 2–4 px, formularios 4–6 px; evitar **pills** y tarjetas redondeadas excesivamente.
- Fronteras 1px `rgba(231,226,218,.08)`; sombras discretas solo documentos, nada de glassmorphism.

## 4. Arquitectura de componentes

| Componente React | Origen visual | Comportamiento final |
|---|---|---|
| `InstitutionalAppShell` | todos | sidebar/header según rol; selector vista para admin |
| `AcademicHero` | paneles | titular serif y contexto real |
| `DocumentSheet` | acuerdos y ruta | papel invertido, lectura y edición sin recorte |
| `AgreementComposer` | acuerdos | formulario para estudiante, versionado |
| `AgreementReview` | acta y bandeja | lectura + decisiones del tutor, no firma ornamental |
| `RouteTemplateBrowser` | configurar ruta | opciones desde catálogo aprobado, no seis fases inventadas |
| `RouteStageEditor` | editor tutor | reordenar, agregar/quitar sin tocar plantilla maestra |
| `RoutePreview` | configurar ruta | vista exacta de estudiante antes de publicar |
| `ThesisNextAction` | mi investigación | acción principal calculada desde estados |
| `StageTimeline` | estudiante y tutor | disponibilidad basada en hitos reales |
| `TaskAndEvidencePanel` | estudiante tareas | archivo/nota/entrega con progreso y errores |
| `TutorDecisionInbox` | bandeja tutor | separar acuerdos y evidencias por revisar |
| `ReviewDecisionCard` | tutor | aprobar / ajustes con alcance explícito |
| `CohortOverview` | panel tutor | solo KPIs definidos e información autorizada |
| `UserRoleManager` | **nuevo** | admin crea cuentas, promociones, invitaciones y bloqueo |
| `TutorAssignmentManager` | **nuevo** | asignar tutor por estudiante/proyecto |
| `AdminViewSwitcher` | **nuevo** | cambiar 3 experiencias en modo autorizado |
| `ReadOnlySupervisionBanner` | **nuevo** | indica inspección, impide aval por impersonación |
| `SaveState`, `AccessibleDialog`, `EmptyState` | patrón transversal | estados reales y teclado |
| `CommitteeAndAdvisory` | visual de comité | **P2 oculto** hasta validar régimen colegiado |

## 5. Interacciones y motion (discreción como valor)

| Situación | Técnica | Duración objetivo propuesta | Condición |
|---|---|---|---|
| hover/focus de botón | CSS transition | 100–150ms | no desplazar elemento |
| expandir ficha/doc | CSS / Motion layout | 160–220ms | preserve foco y texto |
| cambiar sección principal | React ViewTransition **o** Motion | 220–320ms | no duplicar tecnologías para el mismo nodo |
| cambiar rol/experiencia admin | Motion suave + etiqueta «Modo supervisión» | 180–280ms | datos autorizados antes de mostrar |
| publicar/aprobar | feedback posterior a respuesta servidor | 150–220ms | nunca animar éxito antes de commit |
| subir evidencia | progreso real y barra sobria | según carga | porcentaje de bytes verificado |
| reducir movimiento | `prefers-reduced-motion` | 0ms | toda operación igual de usable |

Motion solo para transiciones de layout y estados, no disparar 100 animaciones simultáneas. Animar `transform/opacity` en vez de width/height con reflow incontrolado cuando sea posible. En editores, preferir la estabilidad tipográfica y el enfoque de la tarea.

## 6. CSS de implementación inicial

```css
@import "tailwindcss";
@theme {
  --color-canvas: #1e1c1a;
  --color-panel: #252220;
  --color-panel-raised: #2e2a27;
  --color-paper: #faf8f5;
  --color-ink-dark: #e7e2da;
  --color-terracotta: #c05c3d;
  --color-sage: #2d5a3f;
  --color-ochre: #c49a45;
  --font-editorial: "Newsreader", Georgia, serif;
  --font-interface: "Manrope", system-ui, sans-serif;
}
:root { color-scheme: dark; }
body { background: var(--color-canvas); color: var(--color-ink-dark); font-family: var(--font-interface); }
.editorial-title { font-family: var(--font-editorial); font-size: clamp(2rem, 4vw, 3rem); text-wrap: balance; }
.document-sheet { background: var(--color-paper); color: #1e1c1a; max-width: 75ch; }
@media (prefers-reduced-motion: reduce) {
 *, *::before, *::after { scroll-behavior:auto!important; animation-duration:.01ms!important; transition-duration:.01ms!important; }
}
```

## 7. Vista por rol y responsividad

**Estudiante:** en escritorio sidebar de 240–280px, cuerpo central «Mi investigación», panel lateral discreto de alertas reales. En móvil header compactado + navegación inferior contextual y CTA en la pantalla, sin mini-tablas imposibles.  
**Tutor:** escritorio con cola de decisiones visible arriba, luego estudiantes y editor de ruta; móvil lista vertical filtrable con acciones «Revisar» y «Abrir proyecto», sin copiar dashboard KPI de desktop miniaturizado.  
**Administrador:** nuevo diseño derivado de panel de cohorte: navegación propia, `Usuarios y roles`, `Vinculaciones`, expedientes y selector de 3 vistas; debe priorizar seguridad, no métricas decorativas.  
**Documentos:** actas y entregas importantes se renderizan como folio claro, igual en móvil con ajuste real de tamaño y sin overflow obligatorio.

## 8. Calidad y comprobación visual

- Medir similitud **por estructura, tokens, tipografía, espaciado y contenido jerárquico** frente a cada `screen.png`. No convertir pantallas en imagen de fondo; todos los controles deben vivir en DOM.
- Capturas en 1440/1280/1024/768/430/390/360px; evitar fijar ancho basado en capturas exportadas de 262–487px.
- `@container` para paneles dinámicos; `clamp()` para títulos; `minmax(0,1fr)` en grillas para no desbordar; `overflow-wrap:anywhere` en emails/DOIs.
- Objetivo WCAG 2.2 AA: foco visible, tab orden, formularios etiquetados, aria-live, contraste medido, motion reducido, zoom 200% y teclado para todas las operaciones.
- Fonts desde distribuciones legales, comprobar licencias/autohospedaje; no copiar tipografías incrustadas de origen dudoso.
- No usar Tailwind CDN de `code.html` en producción; traducir a dependencias y CSS compilados.

## 9. Criterios de aceptación visual

`DS01` 14 pantallas inventariadas; `DS02` tema oscuro correcto y documentos claros; `DS03` Newsreader+Manrope o fallback coherente; `DS04` responsive 360–1440; `DS05` vista tutor no desborda listados; `DS06` ruta editable solo tutor; `DS07` documentos muestran texto completo; `DS08` tarjetas de estados derivadas de DB, no mock; `DS09` modo admin visible y readonly; `DS10` contraste AA medido; `DS11` reducido movimiento operativo; `DS12` sin botones decorativos; `DS13` pantallas nuevas admin siguen guía; `DS14` evidencia de capturas en PR.
