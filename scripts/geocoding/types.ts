export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeocoderProvider {
  name: string;
  geocode(direccion: string, distrito: string): Promise<Coordinates | null>;
}