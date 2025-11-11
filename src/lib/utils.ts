import * as THREE from "three";

/**
 * Converts latitude and longitude coordinates to a 3D vector (x, y, z)
 * on the surface of a sphere.
 *
 * @param lat - Latitude in degrees
 * @param lng - Longitude in degrees
 * @param radius - The radius of the sphere
 * @returns A THREE.Vector3 position
 */
export function convertLatLonToVec3(lat: number, lng: number, radius: number) {
  // Convert degrees to radians
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (-lng * Math.PI) / 180; // Negate lng for correct orientation

  // Calculate x, y, z coordinates
  const x = radius * Math.cos(latRad) * Math.cos(lonRad);
  const y = radius * Math.sin(latRad);
  const z = radius * Math.cos(latRad) * Math.sin(lonRad);

  return new THREE.Vector3(x, y, z);
}