/**
 * Dot-matrix map of Finland for the cockpit beat.
 * Outline is a coarse hand-traced polygon (lon, lat). Each dot is assigned to
 * the nearest wellbeing county seat, which is good enough for a 1-second read.
 * Not a geographic data product.
 */

const OUTLINE: [number, number][] = [
  [22.9, 59.8], [24.0, 60.0], [25.0, 60.2], [26.5, 60.4], [27.8, 60.5], [29.0, 61.2], [30.0, 61.8],
  [31.0, 62.4], [31.5, 62.9], [30.6, 63.4], [30.0, 64.0], [30.5, 64.3], [29.7, 64.8], [30.1, 65.7],
  [29.3, 66.1], [29.9, 67.0], [29.0, 67.7], [30.0, 68.0], [28.7, 68.9], [28.9, 69.1], [28.4, 69.8],
  [27.5, 70.08], [26.0, 69.95], [25.2, 69.6], [24.7, 68.65], [23.0, 68.65], [21.8, 69.0], [20.6, 69.05],
  [21.3, 68.6], [22.4, 68.4], [23.6, 67.9], [23.6, 67.2], [24.0, 66.6], [24.15, 65.8], [25.3, 65.4],
  [25.0, 64.9], [24.5, 64.7], [23.5, 64.2], [22.4, 63.6], [21.4, 63.2], [21.2, 62.7], [21.4, 62.0],
  [21.5, 61.4], [21.4, 60.9], [21.8, 60.5], [22.5, 60.2],
];

/** Synthetic share of promises kept, last 90 days. */
export const COUNTY_SEATS: { name: string; lon: number; lat: number; kept: number }[] = [
  { name: "Lappi", lon: 25.7, lat: 66.5, kept: 67 },
  { name: "Pohjois-Pohjanmaa", lon: 25.5, lat: 65.0, kept: 72 },
  { name: "Kainuu", lon: 27.7, lat: 64.2, kept: 66 },
  { name: "Pohjanmaa", lon: 21.6, lat: 63.1, kept: 81 },
  { name: "Keski-Pohjanmaa", lon: 23.1, lat: 63.8, kept: 77 },
  { name: "Etelä-Pohjanmaa", lon: 22.8, lat: 62.8, kept: 79 },
  { name: "Pohjois-Savo", lon: 27.7, lat: 62.9, kept: 74 },
  { name: "Pohjois-Karjala", lon: 29.8, lat: 62.6, kept: 69 },
  { name: "Keski-Suomi", lon: 25.7, lat: 62.2, kept: 61 },
  { name: "Etelä-Savo", lon: 27.3, lat: 61.7, kept: 63 },
  { name: "Satakunta", lon: 21.8, lat: 61.5, kept: 76 },
  { name: "Pirkanmaa", lon: 23.8, lat: 61.5, kept: 84 },
  { name: "Kanta-Häme", lon: 24.5, lat: 61.0, kept: 80 },
  { name: "Päijät-Häme", lon: 25.7, lat: 61.0, kept: 71 },
  { name: "Kymenlaakso", lon: 26.7, lat: 60.8, kept: 68 },
  { name: "Etelä-Karjala", lon: 28.2, lat: 61.06, kept: 75 },
  { name: "Varsinais-Suomi", lon: 22.3, lat: 60.45, kept: 82 },
  { name: "Länsi-Uusimaa", lon: 24.07, lat: 60.25, kept: 78 },
  { name: "Keski-Uusimaa", lon: 24.85, lat: 60.6, kept: 83 },
  { name: "Itä-Uusimaa", lon: 25.7, lat: 60.4, kept: 73 },
  { name: "Helsinki", lon: 24.94, lat: 60.17, kept: 86 },
  { name: "Vantaa-Kerava", lon: 25.04, lat: 60.3, kept: 80 },
];

const COS = Math.cos((64 * Math.PI) / 180);

function inside(lon: number, lat: number) {
  let hit = false;
  for (let i = 0, j = OUTLINE.length - 1; i < OUTLINE.length; j = i++) {
    const [xi, yi] = OUTLINE[i];
    const [xj, yj] = OUTLINE[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

export type Dot = { x: number; y: number; county: number };

/** Dots in pixel space; map is `height` px tall, top-left at (0, 0). */
export function makeDots(height: number, pitch: number) {
  const latMin = 59.75;
  const latMax = 70.1;
  const lonMin = 20.5;
  const pxPerLat = height / (latMax - latMin);
  const pxPerLon = pxPerLat * COS;
  const lonMax = 31.6;
  const width = (lonMax - lonMin) * pxPerLon;
  const dots: Dot[] = [];
  for (let y = pitch / 2; y < height; y += pitch) {
    for (let x = pitch / 2; x < width; x += pitch) {
      const lat = latMax - y / pxPerLat;
      const lon = lonMin + x / pxPerLon;
      if (!inside(lon, lat)) continue;
      let best = 0;
      let bestD = Infinity;
      COUNTY_SEATS.forEach((c, i) => {
        const d = ((c.lon - lon) * COS) ** 2 + (c.lat - lat) ** 2;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      dots.push({ x, y, county: best });
    }
  }
  const project = (lon: number, lat: number) => ({ x: (lon - lonMin) * pxPerLon, y: (latMax - lat) * pxPerLat });
  return { dots, width, project };
}
