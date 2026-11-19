# MAGIC — Plataforma de Seguimiento Académico y Evaluación de Posgrados

[![Quality & Security Gate](https://github.com/larry-academic/magic-platform/actions/workflows/quality.yml/badge.svg)](https://github.com/larry-academic/magic-platform/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![WCAG Target: AA](https://img.shields.io/badge/Accessibility-WCAG%202.2%20AA-emerald.svg)]()

**MAGIC** es una plataforma institucional web de alto rendimiento para la gestión, seguimiento colegiado y trazabilidad de investigaciones doctorales y de posgrado. Conecta de manera sincronizada al **estudiante/doctorando**, a su **tutor/director de tesis** y a la **administración académica**.

---

## 🏛️ Identidad Visual & Arquitectura Editorial

El sistema implementa el lenguaje visual **Academic Editorial Architecture**:
- **Fondo Carbón Cálido (`#1e1c1a`)**: Minimiza la fatiga visual en sesiones prolongadas de lectura y evaluación.
- **Folios en Papel Pergamino Claro (`#faf8f5`)**: Contraste natural para la lectura de actas concertadas, protocolos de muestreo y capítulos de tesis.
- **Tipografía Jerárquica**:
  - `Newsreader`: Monografías, citas doctorales y titulares estructurales.
  - `Manrope`: Controles interactivos, métricas, tablas de datos y chips de estado.
- **Acentos Institucionales**:
  - `Terracota (#c05c3d)`: Acciones primarias y foco interactivo.
  - `Verde Salvia (#2d5a3f)`: Sello de aval colegiado y validación curricular.
  - `Ocre Scribe (#c49a45)`: Revisiones en deliberación y advertencias no críticas.

---

## 🚀 Arquitectura Tecnológica

| Capa | Solución Adoptada | Justificación |
|---|---|---|
| **Frontend Runtime** | React 18/19 + TypeScript | SPA de alta reactividad sin sobrecarga de renderizado en servidor. |
| **Bundler & Build** | Vite 5/8 | Compilación ultrarrápida (<6s) y división de código optimizada. |
| **Estilos** | Tailwind CSS v4 `@theme` | Tokens nativos alineados 1:1 con `DESIGN.md`. |
| **Animación** | Motion (`motion/react`) | Transiciones fluidas con respeto a `prefers-reduced-motion`. |
| **Primitivas UI** | Radix UI Headless | Accesibilidad nativa WCAG 2.2 AA (foco, teclado, aria-live). |
| **Caché y Datos** | TanStack Query v5 | Gestión de estado remoto, revalidaciones y optimismo controlado. |
| **Base de Datos** | PostgreSQL (Supabase Aislado) | Modelo relacional íntegro, restricciones de clave y transacciones. |
| **Seguridad & RBAC** | Supabase Auth + RLS | Políticas a nivel de fila y triggers de servidor que impiden escalación. |
| **Almacenamiento** | Supabase Private Storage | Bucket `academic-evidence` con acceso exclusivo por URL firmada. |

---

## 👥 Gobernanza de Roles y Permisos

1. **Estudiante / Doctorando (`student`)**:
   - Todo autorregistro público nace incondicionalmente como `student` mediante trigger en base de datos.
   - Redacta y envía el Acta de Acuerdos Iniciales (C01).
   - Consulta el itinerario publicado y remite evidencias en formato PDF/DOCX a Storage privado.
2. **Docente Tutor / Director de Tesis (`tutor`)**:
   - Cuenta aprovisionada exclusivamente por la administración institucional.
   - Evalúa acuerdos (avala o solicita ajustes con retroalimentación obligatoria).
   - Personaliza la ruta académica a partir de plantillas canónicas y la publica de manera atómica.
   - Dictamina entregables de evidencias y habilita compuertas metodológicas.
3. **Administrador Institucional (`admin`)**:
   - Control total de usuarios, provisión de tutores con clave temporal o invitación y promoción de perfiles sin duplicar cuentas.
   - Sincronización autoritativa directa con Supabase (`admin_promote_user`, `admin_toggle_user_active`, `manage-user` Edge Function).
   - Invariante de seguridad: Prohibición a nivel de base de datos (`trg_protect_last_admin`) de revocar o desactivar al último administrador activo.
   - Asignación formal de tutores por proyecto con trazabilidad histórica (`admin_assign_tutor`).
   - **Selector de 3 Experiencias (`AdminViewSwitcher`)**: Permite inspeccionar la vista de estudiante o tutor con banner permanente de **Solo Lectura** (`ReadOnlySupervisionBanner`) para prevenir suplantación.

---

## 🔒 Política de Confidencialidad de Credenciales

En cumplimiento con la política de seguridad institucional:
- Las credenciales del Administrador Inicial son **estrictamente confidenciales**.
- Ninguna contraseña, token de servicio o correo real se encuentra incrustado en código, markdown o historial Git.
- El script de aprovisionamiento (`scripts/bootstrap-admin.mjs`) procesa credenciales exclusivamente en memoria volátil de sesión.
- El escáner de seguridad (`scripts/scan-secrets.mjs`) audita automáticamente el repositorio antes de cada commit y en CI/CD.

---

## 📦 Puesta en Marcha Local

### Prerrequisitos
- [Bun](https://bun.sh) (v1.1+) o [Node.js](https://nodejs.org) (v18+)
- [Git](https://git-scm.com)

### Instalación
```bash
# 1. Clonar el repositorio
git clone https://github.com/larry-academic/magic-platform.git
cd magic-platform

# 2. Instalar dependencias
bun install

# 3. Configurar variables de entorno
cp .env.example .env

# 4. Iniciar servidor de desarrollo
bun run dev
```

### Ejecución de Pruebas
```bash
# Ejecutar suite de pruebas unitarias
bun run test

# Verificar tipos TypeScript
bun run lint

# Escanear código en búsqueda de secretos o fugas
bun run scan:secrets

# Compilar para producción
bun run build
```

---

## 📂 Estructura del Repositorio

```text
MAGIC/
├── docs/                        # Especificaciones académicas 01 a 07 + ADRs
│   ├── 01_PRD_MAGIC.md
│   ├── 02_TRD_Arquitectura_MAGIC.md
│   ├── 03_Flujos_UX_User_Journey_MAGIC.md
│   ├── 04_Design_Brief_UI_Tokens_MAGIC.md
│   ├── 05_Backend_Data_Schema_Supabase_MAGIC.md
│   ├── 06_Plan_Implementacion_Antigravity_MAGIC.md
│   ├── 07_Flujo_Completo_Plataforma_Seguimiento_Academico_MAGIC.md
│   └── adr/                     # Registros de Decisiones de Arquitectura
├── scripts/
│   ├── bootstrap-admin.mjs      # Aprovisionamiento seguro de primer admin
│   └── scan-secrets.mjs         # Escáner anti-fugas de credenciales
├── src/
│   ├── app/                     # Enrutamiento, layouts y shell
│   ├── components/shared/       # AppShell, folios, banners de supervisión
│   ├── context/                 # AuthContext y gestión de sesiones
│   ├── features/
│   │   ├── auth/                # Login, registro y recuperación
│   │   ├── student/             # Acuerdos, ruta, tareas y evidencias
│   │   ├── tutor/               # Bandeja de avales, editor de rutas
│   │   └── admin/               # Padrón de usuarios, asignaciones, auditoría
│   ├── styles/                  # Tailwind 4, tokens @theme y tipografía
│   └── types/                   # Tipos TypeScript y contratos de base de datos
├── supabase/
│   ├── migrations/              # Migraciones SQL ordenadas y versionadas
│   └── functions/manage-user/   # Edge Function para provisión de usuarios
├── tests/                       # Pruebas automatizadas Vitest
├── vercel.json                  # Configuración SPA y cabeceras de seguridad
└── vite.config.ts
```

---

## 📄 Licencia

Este proyecto está licenciado bajo los términos de la Licencia MIT.
