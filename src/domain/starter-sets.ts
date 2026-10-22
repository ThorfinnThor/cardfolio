/** Sets that make a good first binder: small or famous, and all available in German. */
export interface StarterSet {
  id: string;
  title: string;
  blurb: string;
}

export const STARTER_SETS: readonly StarterSet[] = [
  { id: "cel25", title: "Celebrations", blurb: "Nur 25 Karten – der kleinste Start, schnell geschafft." },
  { id: "base1", title: "Das erste Set", blurb: "Das Grundset von 1999 mit Glurak, Bisaflor und Turtok." },
  { id: "sv03.5", title: "151", blurb: "Die allerersten 151 Pokémon, die jeder kennt." },
  { id: "swsh10.5", title: "Pokémon GO", blurb: "Beliebte Pokémon aus dem Handyspiel auf 78 Karten." },
  { id: "base2", title: "Dschungel", blurb: "Evoli, Flamara und Co. aus dem zweiten Set." },
];
