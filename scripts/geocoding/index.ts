import { NominatimGeocoder } from './nominatim';
import type { GeocoderProvider } from './types';

// Proveedor activo por defecto
export const defaultGeocoder: GeocoderProvider = new NominatimGeocoder();
export * from './types';