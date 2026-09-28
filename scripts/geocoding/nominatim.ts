// scripts/geocoding/nominatim.ts
import type { Coordinates, GeocoderProvider } from './types';

export class NominatimGeocoder implements GeocoderProvider {
  public readonly name = 'OpenStreetMap Nominatim';
  private lastRequestTime = 0;
  // Política de uso público de Nominatim: Máximo 1 req/segundo (usamos 1200ms por seguridad)
  private readonly minIntervalMs = 1200;
  private readonly userAgent: string;

  constructor(userAgent = 'RemaxFamilyInternalPortal/1.0 (contacto-tecnico@remaxfamily.pe)') {
    this.userAgent = userAgent;
  }

  private async waitRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minIntervalMs) {
      await new Promise((resolve) => setTimeout(resolve, this.minIntervalMs - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  async geocode(direccion: string, distrito: string): Promise<Coordinates | null> {
    const dirLimpia = direccion?.trim();
    const distLimpio = distrito?.trim();

    if (!dirLimpia && !distLimpio) return null;

    // Normalizar quitando datos de departamentos, pisos o referencias secundarias
    const direccionBase = dirLimpia.split(/[,/]/)[0].trim();

    // Intentos de búsqueda: 1) Dirección completa, 2) Dirección base
    const queries = [
      `${dirLimpia}, ${distLimpio}, Lima, Perú`,
      `${direccionBase}, ${distLimpio}, Lima, Perú`
    ];

    for (const query of queries) {
      await this.waitRateLimit();

      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=1&countrycodes=pe`;

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': this.userAgent,
            'Accept-Language': 'es'
          }
        });

        if (!response.ok) continue;

        const results = (await response.json()) as Array<{ lat: string; lon: string }>;
        if (Array.isArray(results) && results.length > 0) {
          const lat = parseFloat(results[0].lat);
          const lng = parseFloat(results[0].lon);
          if (!isNaN(lat) && !isNaN(lng)) {
            return { lat, lng };
          }
        }
      } catch {
        // En caso de corte de red en una consulta, continúa con el fallback
        continue;
      }
    }

    return null;
  }
}