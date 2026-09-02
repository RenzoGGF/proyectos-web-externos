import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { z } from 'zod';
import type { Advisor, Company, Etapa, Estado, FechaEntrega, Project } from '../src/types/index';
import { generateSlug } from '../src/utils/slug';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const EXCEL_PATH = path.resolve(process.cwd(), 'data/proyectos.xlsx');
const DATA_DIR = path.resolve(process.cwd(), 'src/data');

// ==========================================
// ESQUEMAS DE VALIDACIÓN ZOD
// ==========================================

const AdvisorSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1, 'El nombre del asesor no puede estar vacío'),
  telefono: z.string()
});

const CompanySchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1, 'El nombre de la empresa no puede estar vacío'),
  logo: z.string().min(1)
});

const FechaEntregaSchema = z.object({
  texto: z.string(),
  anio: z.number().int().min(2020).max(2100),
  trimestre: z.number().int().min(1).max(4).nullable()
}).nullable().optional();

const ProjectSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  asesorId: z.string().min(1),
  empresaId: z.string().min(1),
  nombre: z.string().min(1, 'El nombre del proyecto es obligatorio'),
  distrito: z.string().min(1, 'El distrito es obligatorio'),
  direccion: z.string().optional(),
  enlace: z.string().optional(),
  
  // CAMPOS OPCIONALES Y PERMISIVOS CON 0
  etapa: z.enum(['en_planos', 'en_construccion', 'entrega_inmediata']).nullable().optional(),
  fechaEntrega: FechaEntregaSchema,
  financiamiento: z.array(z.string()).default([]),
  tipologia: z.array(z.string()).default([]),
  habitaciones: z.array(z.number().int().min(0)).default([]),
  banos: z.array(z.number().int().min(0)).default([]),
  
  disponibles: z.number().min(0).optional(),
  pisosProyecto: z.number().min(0).optional(),
  pisoMasAltoVenta: z.number().min(0).optional(),
  departamentosPorPiso: z.number().min(0).optional(),
  areaMin: z.number().min(0).optional(),
  areaMax: z.number().min(0).optional(),
  precioMin: z.number().min(0).optional(),
  estado: z.enum(['activo', 'vencido']).default('activo'),
  imagen: z.string().min(1)
});

// ==========================================
// FUNCIONES HELPER DE PARSEO
// ==========================================

function parseRange(value: unknown): number[] {
  if (value === null || value === undefined || value === '') return [];
  const str = String(value).trim();
  const match = str.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
  if (!match) return [];
  
  const min = parseInt(match[1], 10);
  const max = match[2] ? parseInt(match[2], 10) : min;
  
  if (isNaN(min) || isNaN(max)) return [];
  if (min > max) return [min];

  const result: number[] = [];
  for (let i = min; i <= max; i++) {
    result.push(i);
  }
  return result;
}

function parseEtapa(value: unknown): Etapa | null {
  if (!value) return null;
  const str = String(value).trim().toLowerCase();
  if (str.includes('plano')) return 'en_planos';
  if (str.includes('construc')) return 'en_construccion';
  if (str.includes('inmediat')) return 'entrega_inmediata';
  return null;
}

function parseFechaEntrega(value: unknown, etapa: Etapa | null | undefined): FechaEntrega | null {
  if (etapa === 'entrega_inmediata') return null;
  if (!value) return null;

  const rawStr = String(value).trim();
  if (!rawStr) return null;

  const match = rawStr.match(/(\d{4})\s*(?:[T\-]?\s*(\d)\s*T?)?/i);
  if (!match) return null;

  const anio = parseInt(match[1], 10);
  const trimestre = match[2] ? parseInt(match[2], 10) : null;

  return {
    texto: rawStr,
    anio,
    trimestre: trimestre && trimestre >= 1 && trimestre <= 4 ? trimestre : null
  };
}

function parseList(value: unknown): string[] {
  if (!value) return [];
  return String(value)
    .split(/[,/;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseEstado(value: unknown): Estado {
  if (!value) return 'activo';
  const str = String(value).trim().toUpperCase();
  return str === 'VENCIDO' ? 'vencido' : 'activo';
}

function parseNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const cleaned = String(value).replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}

function parseAdvisorString(value: unknown): { nombre: string; telefono: string } {
  if (!value) return { nombre: 'SIN ASESOR', telefono: '' };
  const str = String(value).trim();
  
  const parts = str.split('/');
  const names: string[] = [];
  const phones: string[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const match = trimmed.match(/^(.+?)\s+(\+?\d[\d\s-]{6,14})$/);
    if (match) {
      names.push(match[1].trim().toUpperCase());
      phones.push(match[2].replace(/\s+/g, ''));
    } else {
      names.push(trimmed.toUpperCase());
    }
  }

  return {
    nombre: names.join('/'),
    telefono: phones.join(' / ')
  };
}

function getRowValue(row: Record<string, unknown>, possibleKeys: string[]): unknown {
  for (const key of possibleKeys) {
    if (row[key] !== undefined && row[key] !== '') {
      return row[key];
    }
  }
  return undefined;
}

// ==========================================
// PROCESAMIENTO PRINCIPAL
// ==========================================

function runImport(): void {
  console.log('🚀 Iniciando proceso de importación Excel -> JSON...');

  if (!fs.existsSync(EXCEL_PATH)) {
    console.error(`❌ Error crítico: No se encontró el archivo de origen en "${EXCEL_PATH}".`);
    process.exit(1);
  }

  const workbook = XLSX.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as Record<string, unknown>[];

  if (rawRows.length === 0) {
    console.error('❌ Error crítico: El archivo Excel está vacío.');
    process.exit(1);
  }

  const advisorsMap = new Map<string, Advisor>();
  const advisorNameMap = new Map<string, string>();
  const companiesMap = new Map<string, Company>();
  const projects: Project[] = [];

  const warnings: string[] = [];
  const errors: string[] = [];

  const usedSlugs = new Set<string>();

  rawRows.forEach((row: Record<string, unknown>, index: number) => {
    const rowIndex = index + 2;
    
    // 1. Asesor
    const rawAsesor = getRowValue(row, ['ASESOR RESPONSABLE', 'ASESOR']);
    const { nombre: advisorName, telefono: advisorPhone } = parseAdvisorString(rawAsesor);
    
    if (advisorNameMap.has(advisorName) && advisorNameMap.get(advisorName) !== advisorPhone) {
      warnings.push(
        `[Fila ${rowIndex}] Asesor "${advisorName}" registrado con teléfonos distintos (` +
        `"${advisorNameMap.get(advisorName)}" vs "${advisorPhone}"). Se crearon registros independientes.`
      );
    } else {
      advisorNameMap.set(advisorName, advisorPhone);
    }

    const advisorKey = `${advisorName}_${advisorPhone}`;
    let advisorId = '';

    if (advisorsMap.has(advisorKey)) {
      advisorId = advisorsMap.get(advisorKey)!.id;
    } else {
      const advSlug = generateSlug(advisorName);
      const phoneSlug = generateSlug(advisorPhone);
      advisorId = phoneSlug ? `a-${advSlug}-${phoneSlug}` : `a-${advSlug}`;

      const advisorObj: Advisor = {
        id: advisorId,
        nombre: advisorName,
        telefono: advisorPhone
      };
      
      const val = AdvisorSchema.safeParse(advisorObj);
      if (!val.success) {
        errors.push(`[Fila ${rowIndex}] Asesor inválido: ${val.error.issues[0].message}`);
      } else {
        advisorsMap.set(advisorKey, advisorObj);
      }
    }

    // 2. Empresa
    const rawEmpresa = String(getRowValue(row, ['EMPRESA', 'INMOBILIARIA']) || 'EMPRESA NO ESPECIFICADA').trim().toUpperCase();
    const companySlug = generateSlug(rawEmpresa) || 'desconocida';
    const companyId = `c-${companySlug}`;

    if (!companiesMap.has(rawEmpresa)) {
      const companyObj: Company = {
        id: companyId,
        nombre: rawEmpresa,
        logo: `/images/companies/${companyId}.webp`
      };

      const val = CompanySchema.safeParse(companyObj);
      if (!val.success) {
        errors.push(`[Fila ${rowIndex}] Empresa inválida: ${val.error.issues[0].message}`);
      } else {
        companiesMap.set(rawEmpresa, companyObj);
      }
    }

    // 3. Proyecto
    const rawNombre = String(getRowValue(row, ['NOMBRE DEL PROYECTO', 'PROYECTO', 'NOMBRE']) || '').trim();
    const slug = generateSlug(rawNombre);
    const projectId = `p-${slug}`;

    if (!rawNombre) {
      errors.push(`[Fila ${rowIndex}] Nombre del proyecto está vacío.`);
    }

    if (usedSlugs.has(slug)) {
      errors.push(`[Fila ${rowIndex}] Slug duplicado "${slug}" para el proyecto "${rawNombre}".`);
    } else if (slug) {
      usedSlugs.add(slug);
    }

    const etapa = parseEtapa(getRowValue(row, ['ETAPA']));
    const fechaEntrega = parseFechaEntrega(getRowValue(row, ['FECHA DE ENTREGA', 'ENTREGA']), etapa);

    const areaMin = parseNumber(getRowValue(row, ['AREA MINIMA', 'ÁREA MÍNIMA', 'AREA MINIMA (M2)', 'ÁREA MÍNIMA (M2)']));
    const areaMax = parseNumber(getRowValue(row, ['AREA MAXIMA', 'ÁREA MÁXIMA', 'AREA MAXIMA (M2)', 'ÁREA MÁXIMA (M2)']));

    if (areaMin !== undefined && areaMax !== undefined && areaMax < areaMin) {
      warnings.push(
        `[Fila ${rowIndex}] Proyecto "${rawNombre}": El área máxima (${areaMax} m²) es menor que el área mínima (${areaMin} m²).`
      );
    }

    const projectObj: Project = {
      id: projectId,
      slug,
      asesorId: advisorId,
      empresaId: companyId,
      nombre: rawNombre,
      distrito: String(getRowValue(row, ['DISTRITOS', 'DISTRITO']) || '').trim(),
      direccion: String(getRowValue(row, ['DIRECCION', 'DIRECCIÓN']) || '').trim() || undefined,
      enlace: String(getRowValue(row, ['DRIVE O PÁGINA WEB', 'DRIVE', 'ENLACE', 'WEB']) || '').trim() || undefined,
      etapa,
      fechaEntrega,
      financiamiento: parseList(getRowValue(row, ['FINANCIAMIENTO', 'BANCO'])),
      tipologia: parseList(getRowValue(row, ['TIPOLOGIA', 'TIPOLOGÍA'])),
      disponibles: parseNumber(getRowValue(row, ['DISPONIBLES', 'UNIDADES DISPONIBLES'])),
      pisosProyecto: parseNumber(getRowValue(row, ['PISOS DEL PROYECTO', 'PISOS'])),
      pisoMasAltoVenta: parseNumber(getRowValue(row, ['PISO MÁS ALTO A LA VENTA', 'PISO MAS ALTO A LA VENTA'])),
      departamentosPorPiso: parseNumber(getRowValue(row, ['DEPARTAMENTOS POR PISO', 'DPTO POR PISO'])),
      areaMin,
      areaMax,
      habitaciones: parseRange(getRowValue(row, ['RANGO DE HABITACIONES', 'HABITACIONES', 'DORMITORIOS'])),
      banos: parseRange(getRowValue(row, ['RANGO DE BAÑOS', 'BAÑOS', 'BANOS'])),
      precioMin: parseNumber(getRowValue(row, ['PRECIO MINIMO S/', 'PRECIO MÍNIMO S/', 'PRECIO MINIMO', 'PRECIO MÍNIMO'])),
      estado: parseEstado(getRowValue(row, ['ESTADO'])),
      imagen: `/images/projects/${projectId}.webp`
    };

    const projectVal = ProjectSchema.safeParse(projectObj);
    if (!projectVal.success) {
      projectVal.error.issues.forEach((issue: z.ZodIssue) => {
        errors.push(`[Fila ${rowIndex}] Proyecto "${rawNombre || 'Sin nombre'}": ${issue.path.join('.')} - ${issue.message}`);
      });
    } else {
      projects.push(projectObj);
    }
  });

  if (warnings.length > 0) {
    console.warn('\n⚠️ ADVERTENCIAS DETECTADAS (Proceso continuado):');
    warnings.forEach((w: string) => console.warn(`  - ${w}`));
  }

  if (errors.length > 0) {
    console.error('\n❌ ERRORES CRÍTICOS EN EL EXCEL (Importaciones abortadas):');
    errors.forEach((e: string) => console.error(`  - ${e}`));
    console.error('\nPor favor, corrige el archivo Excel y vuelve a ejecutar "npm run data:import".\n');
    process.exit(1);
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const advisorsArray = Array.from(advisorsMap.values());
  const companiesArray = Array.from(companiesMap.values());

  fs.writeFileSync(path.join(DATA_DIR, 'advisors.json'), JSON.stringify(advisorsArray, null, 2), 'utf-8');
  fs.writeFileSync(path.join(DATA_DIR, 'companies.json'), JSON.stringify(companiesArray, null, 2), 'utf-8');
  fs.writeFileSync(path.join(DATA_DIR, 'projects.json'), JSON.stringify(projects, null, 2), 'utf-8');

  console.log('\n✅ IMPORTACIÓN COMPLETADA CON ÉXITO:');
  console.log(`  - ${projects.length} proyectos procesados en "src/data/projects.json"`);
  console.log(`  - ${advisorsArray.length} asesores guardados en "src/data/advisors.json"`);
  console.log(`  - ${companiesArray.length} empresas guardadas en "src/data/companies.json"\n`);
}

runImport();