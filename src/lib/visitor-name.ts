/** Deterministic anonymous names from visitor hashes . */

const ADJECTIVES = [
  "Amber",
  "Bold",
  "Brave",
  "Bright",
  "Calm",
  "Clever",
  "Cosmic",
  "Crisp",
  "Curious",
  "Daring",
  "Eager",
  "Electric",
  "Emerald",
  "Fearless",
  "Gentle",
  "Golden",
  "Happy",
  "Hidden",
  "Honest",
  "Jade",
  "Keen",
  "Kind",
  "Lively",
  "Lucky",
  "Merry",
  "Mighty",
  "Misty",
  "Noble",
  "Nimble",
  "Patient",
  "Pepper",
  "Quiet",
  "Rapid",
  "Rustic",
  "Sharp",
  "Silent",
  "Silver",
  "Sly",
  "Soft",
  "Steady",
  "Sunny",
  "Swift",
  "Tide",
  "Velvet",
  "Vivid",
  "Warm",
  "Wild",
  "Wise",
  "Witty",
  "Zesty",
] as const;

const ANIMALS = [
  "Badger",
  "Bear",
  "Beaver",
  "Bison",
  "Cedar",
  "Crane",
  "Crow",
  "Deer",
  "Dove",
  "Eagle",
  "Falcon",
  "Ferret",
  "Finch",
  "Fox",
  "Gecko",
  "Heron",
  "Ibex",
  "Jaguar",
  "Koala",
  "Lemur",
  "Lynx",
  "Marten",
  "Moose",
  "Otter",
  "Owl",
  "Panda",
  "Panther",
  "Puffin",
  "Quail",
  "Rabbit",
  "Raven",
  "Robin",
  "Seal",
  "Sparrow",
  "Squid",
  "Squirrel",
  "Stork",
  "Swan",
  "Tiger",
  "Toad",
  "Trout",
  "Turtle",
  "Viper",
  "Walrus",
  "Whale",
  "Wolf",
  "Wren",
  "Yak",
  "Zebra",
] as const;

const AVATAR_TONES = [
  "oklch(0.72 0.09 165)",
  "oklch(0.7 0.08 200)",
  "oklch(0.74 0.07 140)",
  "oklch(0.68 0.06 85)",
  "oklch(0.7 0.07 40)",
  "oklch(0.68 0.08 250)",
  "oklch(0.72 0.06 300)",
  "oklch(0.7 0.07 20)",
] as const;

function hashToUint(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type VisitorIdentity = {
  name: string;
  initials: string;
  color: string;
};

export function visitorIdentity(visitorHash: string): VisitorIdentity {
  const n = hashToUint(visitorHash);
  const adjective = ADJECTIVES[n % ADJECTIVES.length];
  const animal = ANIMALS[Math.floor(n / ADJECTIVES.length) % ANIMALS.length];
  const color = AVATAR_TONES[n % AVATAR_TONES.length];

  return {
    name: `${adjective} ${animal}`,
    initials: `${adjective[0]}${animal[0]}`,
    color,
  };
}

export function visitorDisplayName(visitorHash: string): string {
  return visitorIdentity(visitorHash).name;
}
