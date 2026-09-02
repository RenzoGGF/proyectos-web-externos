/**
 * Genera un slug determinista, limpio y URL-friendly a partir de un texto.
 * Ejemplo: "Edificio Miraflores 123!" -> "edificio-miraflores-123"
 */
export function generateSlug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}