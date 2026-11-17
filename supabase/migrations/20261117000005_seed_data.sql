-- ==============================================================================
-- MAGIC PLATFORM — Canonical Academic Seed Data
-- Programs, Methodologies & Official Route Templates
-- ==============================================================================

-- 1. Academic Programs
INSERT INTO public.academic_programs (code, name, degree_level, active)
VALUES
  ('DOC-FIL', 'Doctorado en Filosofía y Humanidades', 'Doctorado', true),
  ('DOC-CIE', 'Doctorado en Ciencias de la Educación', 'Doctorado', true),
  ('DOC-EPI', 'Doctorado en Epistemología e Investigación Tecnológica', 'Doctorado', true),
  ('DOC-SOC', 'Doctorado en Estudios Sociales y Políticas Públicas', 'Doctorado', true),
  ('MAE-INV', 'Maestría en Metodología de la Investigación', 'Maestría', true)
ON CONFLICT (code) DO NOTHING;

-- 2. Cohorts
INSERT INTO public.cohorts (label, period)
VALUES
  ('Cohorte Doctoral Activa 2026-I', '2026-I'),
  ('Cohorte Doctoral Ordinaria 2025-II', '2025-II')
ON CONFLICT DO NOTHING;

-- 3. Methodology Catalog
INSERT INTO public.methodology_catalog (id, title, description, approved_by, active)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Enfoque Mixto Concurrente (Cualitativo + Cuantitativo)',
    'Diseño metodológico integrador con triangulación concurrente de datos empíricos, muestreo estratificado y análisis hermenéutico profundo.',
    'Comisión Académica de Posgrados e Investigación',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Enfoque Fenomenológico y Hermenéutico',
    'Investigación cualitativa rigurosa orientada a la comprensión ontológica, discursiva y experiencial en ciencias humanas y sociales.',
    'Comisión Académica de Posgrados e Investigación',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- 4. Route Template (Template 1: Itinerario Doctoral Riguroso)
INSERT INTO public.route_templates (
  id,
  methodology_id,
  version_no,
  name,
  description,
  content_json,
  active
)
VALUES
  (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    1,
    'Ruta Doctoral Canónica: Tesis y Candidatura (4 Etapas)',
    'Itinerario curricular de investigación doctoral estructurado con compuertas epistemológicas y validaciones colegiadas obligatorias.',
    '[
      {
        "title": "Etapa 1: Delimitación Problemática y Marco Teórico",
        "description": "Consolidación del estado del arte, formulación de preguntas rectoras y justificación epistemológica de la investigación.",
        "tasks": [
          {
            "title": "Actividad 1.1: Revisión Sistemática de Literatura y Matriz PRISMA",
            "instructions": "Presentar búsqueda documental sistemática en Scopus/Web of Science con protocolo PRISMA y criterios de inclusión/exclusión.",
            "expected_result": "Documento monográfico de revisión con al menos 45 fuentes Q1/Q2 indexadas.",
            "requires_submission": true,
            "requires_approval": true
          },
          {
            "title": "Actividad 1.2: Delimitación de Pregunta Rectora y Objetivos",
            "instructions": "Redactar la pregunta central, hipótesis o presupuestos epistemológicos y objetivos general y específicos.",
            "expected_result": "Ficha capitular con marco teórico preliminar avalado por el director.",
            "requires_submission": true,
            "requires_approval": true
          }
        ]
      },
      {
        "title": "Etapa 2: Diseño Metodológico y Calibración Empírica",
        "description": "Definición del universo de muestreo, operacionalización de variables o categorías hermenéuticas y diseño de instrumentos.",
        "tasks": [
          {
            "title": "Actividad 2.1: Protocolo de Muestreo y Validación de Instrumentos",
            "instructions": "Adjuntar matriz metodológica de consistencia, plan de muestreo y dictamen de jueces expertos o prueba piloto.",
            "expected_result": "Protocolo metodológico validado con coeficiente de fiabilidad o rigor cualitativo.",
            "requires_submission": true,
            "requires_approval": true
          },
          {
            "title": "Actividad 2.2: Aprobación Bioética y Consentimientos Informados",
            "instructions": "Remitir expediente para evaluación del comité ético de investigación institucional.",
            "expected_result": "Dictamen de comité ético o constancia de bajo riesgo.",
            "requires_submission": true,
            "requires_approval": true
          }
        ]
      },
      {
        "title": "Etapa 3: Trabajo de Campo y Análisis Multivariado",
        "description": "Levantamiento de evidencias en terreno, sistematización de datos y triangulación teórica.",
        "tasks": [
          {
            "title": "Actividad 3.1: Fichas de Campo y Base de Datos Depurada",
            "instructions": "Cargar repositorio con datos crudos anonimizados, scripts de análisis (R/Python/Atlas.ti) y libro de códigos.",
            "expected_result": "Dataset reproducible y memoria descriptiva del levantamiento.",
            "requires_submission": true,
            "requires_approval": true
          },
          {
            "title": "Actividad 3.2: Manuscrito Capitular de Resultados",
            "instructions": "Redacción integral del capítulo analítico con contrastación de hallazgos frente a la literatura previa.",
            "expected_result": "Borrador de capítulo para dictamen de pares internos.",
            "requires_submission": true,
            "requires_approval": true
          }
        ]
      },
      {
        "title": "Etapa 4: Disertación Doctoral y Manuscrito Final",
        "description": "Conclusiones, discusión epistemológica, implicaciones prácticas y redacción integral del tomo de tesis.",
        "tasks": [
          {
            "title": "Actividad 4.1: Versión Preliminar Completa de Tesis",
            "instructions": "Integración de todos los capítulos con estilo editorial normalizado, referencias citadas y anexos documentales.",
            "expected_result": "Tomo de disertación completo para lectura del tribunal doctoral.",
            "requires_submission": true,
            "requires_approval": true
          }
        ]
      }
    ]'::jsonb,
    true
  )
ON CONFLICT (id) DO NOTHING;
