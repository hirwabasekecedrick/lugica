/**
 * Great-circle distance between two WGS84 points.
 *
 * Deliberately hand-rolled rather than pulling in Turf: this is the only
 * geospatial calculation the backend needs, and the full geo library would be a
 * large dependency for one formula.
 *
 * Accurate to ~0.5% against the ellipsoidal distance, which is well inside the
 * error introduced by consumer GPS accuracy itself (typically 5-20m).
 */

/** Mean Earth radius in metres (IUGG). */
const EARTH_RADIUS_METERS = 6_371_008.8;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

export function distanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);

  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  // Haversine: numerically stable for the small distances GPS fixes produce,
  // where the naive spherical law of cosines loses precision.
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Reject segments that are physically impossible or too imprecise to trust.
 *
 * Consumer GPS drifts by several metres while a vehicle is parked. Summing those
 * legs inflates a trip's distance badly — a van idling at a pickup point for five
 * minutes can "travel" a kilometre. Two filters, applied before accumulating:
 *
 *  - implied speed above MAX_PLAUSIBLE_SPEED_MPS. 30 m/s is 108 km/h, above any
 *    plausible speed on the Kigali road network this project serves.
 *  - horizontal accuracy worse than MAX_TRUSTED_ACCURACY_METERS: a fix that
 *    uncertain could move the marker anywhere inside its own error circle.
 *
 * A rejected leg contributes zero distance; the point is still recorded, so the
 * trail does not develop a gap.
 */

/** 30 m/s = 108 km/h. */
export const MAX_PLAUSIBLE_SPEED_MPS = 30;

/** Fixes worse than this are not used for distance accumulation. */
export const MAX_TRUSTED_ACCURACY_METERS = 100;

export function isPlausibleLeg(
  from: { latitude: number; longitude: number; recordedAt: string | Date },
  to: { latitude: number; longitude: number; recordedAt: string | Date },
  toAccuracyMeters?: number | null,
): boolean {
  if (toAccuracyMeters != null && toAccuracyMeters > MAX_TRUSTED_ACCURACY_METERS) {
    return false;
  }

  const seconds =
    (new Date(to.recordedAt).getTime() - new Date(from.recordedAt).getTime()) /
    1000;

  // A non-positive interval means a clock skew or duplicate timestamp. Distance
  // is unbounded for it, so treat it as implausible rather than dividing by ~0.
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return false;
  }

  const metres = distanceMeters(from, to);
  return metres / seconds <= MAX_PLAUSIBLE_SPEED_MPS;
}