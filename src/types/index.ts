export type Etapa = 'en_planos' | 'en_construccion' | 'entrega_inmediata';
export type Estado = 'activo' | 'vencido';

export interface FechaEntrega {
  texto: string;
  anio: number;
  trimestre: number | null;
}

export interface Advisor {
  id: string;
  nombre: string;
  telefono: string;
}

export interface Company {
  id: string;
  nombre: string;
  logo: string;
}

export interface Project {
  id: string;
  slug: string;
  asesorId: string;
  empresaId: string;
  nombre: string;
  distrito: string;
  direccion?: string;
  enlace?: string;
  etapa: Etapa | null;
  fechaEntrega: FechaEntrega | null;
  financiamiento: string[];
  tipologia: string[];
  disponibles?: number;
  pisosProyecto?: number;
  pisoMasAltoVenta?: number;
  departamentosPorPiso?: number;
  areaMin?: number;
  areaMax?: number;
  habitaciones: number[];
  banos: number[];
  precioMin?: number;
  estado: Estado;
  imagen: string;
}

export interface ProjectDetailed extends Omit<Project, 'asesorId' | 'empresaId'> {
  asesor?: Advisor;
  empresa?: Company;
}

export interface FilterState {
  distrito: string;
  etapa: string;
  habitaciones: number[];
  precioMax: number | null;
  anioMaxEntrega: number | null;
}