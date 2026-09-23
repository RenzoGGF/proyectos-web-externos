export interface Tutorial {
  id: string;
  titulo: string;
  youtubeId: string;
}

// Tutorial general accesible desde el Navbar
export const GENERAL_TUTORIAL: Tutorial = {
  id: 'general',
  titulo: '¿Cómo busco un proyecto?',
  youtubeId: 'Ol3r5ykgjks'
};

// Tutoriales de Drive por empresa (identificados por empresaId en minúsculas)
export const COMPANY_DRIVE_TUTORIALS: Record<string, Tutorial> = {
  'c-ter': {
    id: 'drive-ter',
    titulo: '¿Cómo usar el Drive de Ter?',
    youtubeId: ''
  },
  'c-edifica-inversiones-del-sur-sac': {
    id: 'drive-edifica',
    titulo: '¿Cómo usar el Drive de Edifica?',
    youtubeId: 'lrm9pKbHU-o'
  },
  'c-grupo-tyc': {
    id: 'drive-tyc',
    titulo: '¿Cómo usar el Drive de T&C?',
    youtubeId: 'lrm9pKbHU-o'
  },
  'c-illusione-constructora-e-inmobiliaria-sac': {
    id: 'drive-illusione',
    titulo: '¿Cómo usar el Drive de Illusione?',
    youtubeId: ''
  }
};

/**
 * Retorna el tutorial de Drive únicamente si está configurado y cuenta con un ID de video activo.
 */
export function getCompanyDriveTutorial(empresaId?: string): Tutorial | null {
  if (!empresaId) return null;
  const key = empresaId.toLowerCase().trim();
  const tutorial = COMPANY_DRIVE_TUTORIALS[key];

  if (tutorial && tutorial.youtubeId && tutorial.youtubeId.trim() !== '') {
    return tutorial;
  }

  return null;
}