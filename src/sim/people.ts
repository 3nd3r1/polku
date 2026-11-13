/**
 * SYNTHETIC people returned by the simulated strong identification.
 * Not real persons. Counties are real wellbeing counties (hyvinvointialueet).
 */
export type Person = {
  id: string;
  name: string;
  birthYear: number;
  county: string;
  phone: string;
};

export const PEOPLE: readonly Person[] = [
  { id: "matti", name: "Matti Virtanen", birthYear: 1968, county: "Keski-Suomi", phone: "+358 40 *** 2107" },
  { id: "aino", name: "Aino Korhonen", birthYear: 1996, county: "Pirkanmaa", phone: "+358 50 *** 8841" },
  { id: "eino", name: "Eino Mäkinen", birthYear: 1959, county: "Satakunta", phone: "+358 44 *** 3092" },
  { id: "liisa", name: "Liisa Nieminen", birthYear: 1951, county: "Lappi", phone: "+358 40 *** 5530" },
  { id: "pekka", name: "Pekka Hämäläinen", birthYear: 1955, county: "Kymenlaakso", phone: "+358 45 *** 1178" },
  { id: "seppo", name: "Seppo Laine", birthYear: 1946, county: "Pohjois-Savo", phone: "+358 40 *** 6624" },
];

export const ageOf = (p: Person, now = new Date()) => now.getFullYear() - p.birthYear;
