/**
 * GeoCoordinates Value Object
 * Encapsulates GPS latitude/longitude and distance calculations via Haversine formula.
 */
export class GeoCoordinates {
  readonly latitude: number;
  readonly longitude: number;

  constructor(latitude: number, longitude: number) {
    if (latitude < -90 || latitude > 90) {
      throw new Error(`Invalid latitude: ${latitude}`);
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error(`Invalid longitude: ${longitude}`);
    }
    this.latitude = latitude;
    this.longitude = longitude;
  }

  static almatyCenter(): GeoCoordinates {
    return new GeoCoordinates(43.238949, 76.889709);
  }

  /**
   * Distance in kilometers using Haversine formula
   */
  distanceTo(other: GeoCoordinates): number {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(other.latitude - this.latitude);
    const dLon = this.deg2rad(other.longitude - this.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(this.latitude)) *
        Math.cos(this.deg2rad(other.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  equals(other: GeoCoordinates): boolean {
    return this.latitude === other.latitude && this.longitude === other.longitude;
  }

  toJSON(): { latitude: number; longitude: number } {
    return { latitude: this.latitude, longitude: this.longitude };
  }
}
