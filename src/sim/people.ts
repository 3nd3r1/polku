import { makeHetu } from "../ontology/hetu";
import { COUNTIES } from "../ontology/world";

/**
 * SYNTHETIC population register. Not real persons: every identity code is in
 * the 900-999 test range, phone numbers are masked. Counties are real
 * wellbeing counties. Seeded into the `people` table by `npm run db:seed`.
 */
export type Person = {
  id: string;
  hetu: string;
  name: string;
  birthDate: string;
  county: string;
  phone: string;
};

export function ageOf(p: Pick<Person, "birthDate">, now = new Date()) {
  const [y, m, d] = p.birthDate.split("-").map(Number);
  const hadBirthday = now.getMonth() + 1 > m || (now.getMonth() + 1 === m && now.getDate() >= d);
  return now.getFullYear() - y - (hadBirthday ? 0 : 1);
}

type Seed = Omit<Person, "hetu"> & { individual: number };

/** The people on the role cards. Odd individual number = man, even = woman, as in real codes. */
const DEMO: Seed[] = [
  { id: "matti", name: "Matti Virtanen", birthDate: "1955-03-04", county: "Keski-Suomi", phone: "+358 40 *** 2107", individual: 901 },
  { id: "aino", name: "Aino Korhonen", birthDate: "1992-06-18", county: "Pirkanmaa", phone: "+358 50 *** 8841", individual: 902 },
  { id: "seppo", name: "Seppo Laine", birthDate: "1946-09-22", county: "Pohjois-Savo", phone: "+358 40 *** 6624", individual: 903 },
  { id: "liisa", name: "Liisa Nieminen", birthDate: "1951-01-27", county: "Lappi", phone: "+358 44 *** 5530", individual: 904 },
];

const MEN = ["Juhani", "Timo", "Kari", "Jari", "Antero", "Mikko", "Pentti", "Heikki", "Ilkka", "Raimo", "Erkki", "Veikko"];
const WOMEN = ["Marja", "Tuula", "Anneli", "Pirjo", "Ritva", "Sirpa", "Helena", "Leena", "Kaarina", "Tellervo", "Eila", "Riitta"];
const SURNAMES = ["Korhonen", "Mäkelä", "Heikkinen", "Koskinen", "Järvinen", "Lehtonen", "Saarinen", "Salminen", "Turunen", "Hiltunen", "Kettunen", "Rantanen", "Lindholm", "Karjalainen", "Savolainen"];

/** Deterministic PRNG so every seed produces the same register. */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function syntheticPeople(count = 50): Person[] {
  const rand = mulberry32(2026);
  const pick = <T>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)];
  const seeds: Seed[] = [...DEMO];
  let odd = 905;
  let even = 906;
  while (seeds.length < count) {
    const man = rand() < 0.5;
    const year = 1938 + Math.floor(rand() * 50);
    const month = 1 + Math.floor(rand() * 12);
    const day = 1 + Math.floor(rand() * 28);
    const individual = man ? odd : even;
    if (man) odd += 2;
    else even += 2;
    seeds.push({
      id: `p${seeds.length}`,
      name: `${pick(man ? MEN : WOMEN)} ${pick(SURNAMES)}`,
      birthDate: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      county: pick(COUNTIES).name,
      phone: `+358 ${pick(["40", "44", "45", "50"])} *** ${String(Math.floor(rand() * 10000)).padStart(4, "0")}`,
      individual,
    });
  }
  return seeds.map(({ individual, ...p }) => ({ ...p, hetu: makeHetu(p.birthDate, individual) }));
}

export const DEMO_IDS = DEMO.map((d) => d.id);
