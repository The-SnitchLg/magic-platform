# 06 · Plan de implementación — MAGIC | Antigravity

**Versión:** 7.0 · 17/11/2026. **Estrategia:** construir un repositorio y proyecto **completamente nuevos**, no intervenir los viejos. Documento para agente, desarrolladores, QA y responsables académicos. No declara acciones remotas terminadas.

## 1. Principios que deben mantenerse

1. **Contrato funcional:** `07_Flujo_Completo_Plataforma_Seguimiento_Academico.md`, ajustado por solicitud de 3 roles de 17/11. Los seis .md son nuevas especificaciones académicas, no instrucciones para conservar diamantes o cartas del proyecto anterior.
2. **Visual:** ZIP Stitch de 14 pantallas, esquema oscuro `Academic Editorial Architecture`, sin suplantar lógica por texto de demos.
3. **Seguridad:** nueva base, RLS, Auth, Storage privado, roles no autoseleccionables; nada de claves en Git.
4. **Trazabilidad:** cada PR termina con migración, pruebas, capturas y README/ADR actualizados.
5. **UX:** primero circuitos estudiantes y tutores; componente admin y bootstrap desde primera iteración porque habilitan vinculación segura.
6. **Integración real:** una captura de Vercel no prueba Supabase. Cerrar solo con datos enviados en navegador y consultados en DB nuevo, más controles negativos.

## 2. Preflight obligatorio F0

- Crear estructura nueva (no clonar proyecto existente como destino de trabajo), revisar `.agent/`, skills de Antigravity e inventario de archivos disponibles; no instalar skills sin inspeccionar origen.
- Abrir `07` y 14 maquetas (`DESIGN.md`, `code.html`, `screen.png`); registrar correspondencia con pantallas `V00–V18` y rutas nuevas de administrador.
- Inventariar contenido de muestra no validado: nombres de investigadores, tasas, «hito de seis fases», comités, firmas notariales, semáforo; marcarlos visual-only.
- Preparar ADR-001 Stack, ADR-002 Identity/Roles, ADR-003 Route Versioning, ADR-004 Data & Privacy, ADR-005 QA/Deployment.
- Validar que GitHub repo y Supabase `project_ref` sean nuevos antes de conectar Vercel. No usar `.env` ni credenciales del repositorio anterior.

**Gate F0:** matriz pantalla→función→rol→entidad→test, fuentes identificadas y decisiones institucionales que afectan código documentadas.

## 3. Hitos de implementación, dependencias y criterios de salida

| Fase | Alcance vertical | Evidencia para pasar | Bloqueante |
|---|---|---|---|
| F1 | Repo, React/TS/Vite/Tailwind/Newsreader/Manrope, componentes y shell 3 roles | build limpio, shell responsive 360–1440, comparación Stitch | ninguno salvo acceso repositorio |
| F2 | Nuevo Supabase, Auth, trigger student, policies mínimas, bootstrap admin seguro | IDs nuevos, login student/admin, tests RLS, admin único | cuentas externas |
| F3 | Admin usuarios/roles, promociones, asignación tutor, cambio de sesión | admin provisiona tutor; bloqueo admin por student; audita | F2 |
| F4 | Proyecto y acuerdos estudiante ↔ tutor, devolución y aval | recorrido real en DB y pantalla, bloqueo sin aval | decisión D01/D02 |
| F5 | Plantillas aprobadas y editor de ruta del tutor, preview/publish idempotente | nueva ruta por proyecto, alumno ve solo published | D03/D04 |
| F6 | Tareas, evidencias privadas, revisión, corrección y hitos | upload+review+unlock real y pruebas negativas | D05/D06 |
| F7 | Paneles tutor/admin, historial y métricas estrictamente definidas | bandejas reales, filtros, audit log, no mock | F4–F6 |
| F8 | QA visual/seguridad/responsive y despliegue Vercel staging→prod | informe E2E desde URL Vercel y verificación DB | D07/D10 |
| F9 opcional | Comité, bitácora avanzada, firma reglada, indicadores de riesgo | aprobación funcional/metodológica previa | D08/D11 |

### Entregables por PR

Código y cambios SQL; prueba positiva + negativa; captura desktop y móvil (donde aplique); impacto en RLS; escenarios de rollback; versión documentada; referencia HU `ACA-XX` y decisión institucional asociada. **No** cerrar PR porque «se ve bonito» si no hay guardado real.

## 4. GitHub: nuevo repositorio y gestión documental

**Nombre propuesto:** `posgrados-investigacion-platform` (nuevo y privado). Crear ramas `main` (protegida) y `develop`, PR obligatorio, checks: `typecheck`, `lint`, `test`, `build`, `security-scan`, `e2e-preview`. No subir `.env.local`, contraseñas, claves de servicio, identificadores sensibles innecesarios ni capturas con datos reales.

```text
/docs/01_PRD...06_Plan...07_Flujo...
/docs/adr/ADR-001...005.md
/docs/qa/TEST_MATRIX.md
/docs/runbooks/BOOTSTRAP_AND_DEPLOY.md
/supabase/migrations/*.sql
/supabase/functions/*
/src/*
/tests/e2e/*
/.github/workflows/quality.yml
/README.md
/.env.example
```

Documentación mínima obligatoria en README: objetivo, instalación, tecnologías, arquitectura, flujos, rol de cada UI, variables, migraciones, scripts, despliegues, reversión, QA y referencias Stitch. Guardar `migration` histórica y ADR de toda decisión que afecte permisos, roles o trayectoria académica.

## 5. Supabase: creación desde cero y autenticación inicial

1. Ingresar a organización correcta, crear **nuevo proyecto** Supabase; identificador nuevo validado, contraseña DB entregada por gestor seguro, región según residencia/latencia y cumplimiento.
2. Crear opcional segundo proyecto staging, igualmente nuevo. Guardar refs no secretos en `infra/environments.md` privado.
3. `supabase init`, enlazar **nueva ref** explícita, `supabase db push` o pipeline de migraciones revisadas. Ejecutar SQL tests de RLS y constraints.
4. Configurar Auth email/password, `Site URL` Vercel, allowed redirect URLs `staging` y `production`, políticas de verificación de email. Evitar habilitar registro no verificado por comodidad.
5. Crear bucket privado, políticas de acceso, Edge Functions protegidas, secret key solo en función y en operador de bootstrap.
6. Crear primer administrador mediante script desde entorno seguro. **La clave compartida no se almacena**. Verificar sign-in y `profiles.role='admin'`, activar cambio de clave/MFA.
7. Validar autorregistro student y alta/promoción tutor/admin desde UI. Guardar evidencias ID/timestamp sin contenido personal.

No usar el dashboard SQL para introducir una contraseña en `profiles`: Supabase Auth debe gestionar credenciales. La clave de acceso a base administrada y la clave de inicio de sesión de usuario son cosas distintas.

## 6. Vercel: repositorio nuevo, entornos separados y variables

1. `New Project` → importar repositorio GitHub nuevo → framework Vite, install `npm ci`, build `npm run build`, output `dist`.
2. Establecer `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` para Preview con ref staging, y para Production con ref prod. Publicable key no se considera secreta, pero RLS sí es obligatorio.
3. La **secret key** de Supabase va exclusivamente en Edge Functions o entornos server-only con permisos; nunca en variable `VITE_` ni dentro del bundle.
4. Configurar rewrites SPA para rutas internas; verificar deep links `/estudiante` `/tutor` `/administracion` y recuperación de cuenta.
5. Configurar GitHub integración para previews por PR, controles de merge y pruebas automáticas postdeploy.
6. Comprobar rollback a deployment anterior sin revertir migraciones incompatibles a ciegas.

## 7. Plan de pruebas 0→100% (por gates, sin afirmaciones ficticias)

| Test | Acción de navegador Vercel | Comprobación Supabase/resultado |
|---|---|---|
| E2E01 | registrar cuenta nueva | auth.users existe, profiles.role student |
| E2E02 | intentar ir `/administracion` con student | denegación y ninguna lectura admin |
| E2E03 | admin crea tutor con email+clave temporal/invitación | Auth user creado y role tutor real |
| E2E04 | admin promueve estudiante | mismo ID, nuevo rol tras login, log auditoría |
| E2E05 | admin asigna tutor al proyecto | project.tutor_id correcto, tutor ve sólo asignado |
| E2E06 | student guarda acuerdos | `agreement_versions.draft` y revisión persistida |
| E2E07 | student envía | estado submitted; aparece en bandeja tutor |
| E2E08 | tutor devuelve y student corrige | historial y version_no consistente |
| E2E09 | tutor aprueba | reviewed_by, reviewed_at, ruta habilitable |
| E2E10 | tutor crea borrador de ruta | copia independiente de template |
| E2E11 | tutor publica | published y tareas; doble clic no duplica |
| E2E12 | estudiante consulta ruta | sólo versión publicada y tareas propias |
| E2E13 | student sube evidencia | Storage object privado + submission visible |
| E2E14 | tutor revisa y corrige | nuevo intento sin borrar anterior |
| E2E15 | tutor aprueba hito | siguiente etapa desbloqueada solo por dependencia |
| E2E16 | outsider fuerza URL/ID ajeno | 403/no rows en RLS y Storage |
| E2E17 | admin alterna vistas | sin cambios de rol o aval por impersonación |
| E2E18 | recarga/sale/entra | persistencia sin datos demo ni pérdidas |
| E2E19 | móvil/red lenta/errores | feedback claro, no falso guardado |
| E2E20 | prod postdeploy smoke | resultados observados en **Supabase prod nuevo** sin datos de pruebas destructivas |

**Qué significa 100%:** 100% de escenarios obligatorios ejecutados y aprobados con evidencia por entorno, no 100% de ausencia de errores futuros. Fallo crítico de permiso, duplicación de publicación o pérdida de evidencia bloquea liberación.

## 8. Validación de diseño

Comparar referencias HTML/screens con React compilado en Playwright a `1440/1280/1024/768/430/390/360`. Reportar diferencias por composición, tokens, tipografía y legibilidad. Evitar un pixel-perfect que rompa otras resoluciones o cause foco inaccesible. `prefers-reduced-motion` y zoom 200%; manejo sin ratón, sin scroll horizontal global.

## 9. Riesgos y decisiones antes de liberar

| Riesgo | Control |
|---|---|
| contraseña admin publicada en conversación | no escribirla en archivos; cambiar antes de producción, clave temporal/MFA |
| promoción por metadatos del cliente | trigger fijo student, función protegida y RLS |
| admin como tutor mediante vista decorativa | readonly y operación de aval ligada al tutor real |
| nombres y KPI ficticios | seed aislada en staging; producción limpia |
| estudiante ve borrador de ruta | RLS filtra published y pertenencia |
| edición postpublicación borra entregas | versionar y prohibir reescritura destructiva |
| Supabase y Vercel mal conectados | test E2E con consulta DB y comparación project_ref |
| clave de servicio en bundle | escaneo CI y separación de entornos |
| 6 fases obligatorias inventadas | catálogo vacío hasta aprobación académica |

## 10. Prompt operativo optimizado para Antigravity

> Crea un **proyecto completamente nuevo** de plataforma académica, sin modificar el repositorio, Supabase ni Vercel antiguos. Lee en orden el Flujo completo (07), PRD (01), TRD (02), UX (03), Diseño (04), Backend (05) y este plan; inspecciona las **14 carpetas Stitch** y su `DESIGN.md`. Diseña una app React 19.3/TypeScript/Vite 8/Tailwind 4 + CSS, Radix headless, Motion moderado y Supabase Auth/Postgres/Storage privado. Implementa tres rutas de rol verificadas: student por defecto, tutor solo por admin y admin solo por bootstrap/promoción. El primer admin debe provisionarse con secreto inyectado en ejecución y rotación posterior, nunca en código. Crea repo GitHub nuevo, Supabase nuevo y Vercel nuevo cuando se disponga de acceso. No inventes seis fases, firmantes, KPI, semáforo ni reglamento colegiado. Implementa por flujos verticales: roles, proyectos, acuerdos/aval, catálogo y ruta individual/publicación, tareas/evidencias y aprobación. Crea RLS/constraints/RPC, CI y Playwright. Tras cada fase genera diff, pruebas positivas/negativas y capturas desktop/móvil; en el final ejecuta E2E desde URL Vercel y comprueba cada cambio en el project_ref Supabase nuevo. Si no puedes conectar servicios, declara el gate como **NO EJECUTADO**, sin simular éxito.

## 11. Definition of Done global

- [ ] Repositorio GitHub realmente nuevo; rama principal protegida y docs 01–07 versionadas
- [ ] Proyecto Supabase nuevo con `ref` probado y RLS/Storage privados
- [ ] Proyecto Vercel nuevo ligado a repo correcto
- [ ] Primer administrador realmente creado y su login comprobado con clave rotada
- [ ] Autorregistro student inalterable; alta/promoción tutor y admin por servidor
- [ ] Asignaciones y rutas correctas por proyecto
- [ ] Acuerdos, aprobación, publicación, tareas, entregas y aval integrados
- [ ] Pruebas negativas RLS y Storage, idempotencia y conflicto
- [ ] Capturas responsive, a11y y motion reducido
- [ ] CI/QA y pruebas E2E desde Vercel con comprobación DB
- [ ] Alertas, privacidad, mantenimiento, recovery y runbooks documentados
- [ ] No hay datos falsos en producción ni requisitos académicos inventados

**Al cierre de esta entrega documental**, los gates de servicios externos continúan **pendientes de conexión y ejecución**; la evidencia aquí es una especificación y artefactos locales, no servicios desplegados.
