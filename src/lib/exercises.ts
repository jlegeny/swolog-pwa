enum Muscle {
  pectoral = "pectoral",
  triceps = "triceps",
}

interface Modifier {
  name: string;
  shortcut: string;
  multiplier?: number;
  targetMultiplier?: Map<Muscle, number>;
}

interface Exercise {
  name: string;
  target: Muscle[];
  auxiliary?: Muscle[];
  modifiers: Modifier[];
  shorthand: string;
}

const freeWeights = [
  {
    name: "Barbell",
    shortcut: "B",
  },
  {
    name: "Dumbbell",
    shortcut: "Db",
    multiplier: 2,
  },
];

export const exercises: Exercise[] = [
  {
    name: "Bench Press",
    shorthand: "BP",
    target: [Muscle.pectoral],
    modifiers: freeWeights,
  },
  {
    name: "Incline Bench Press",
    shorthand: "IBP",
    target: [Muscle.pectoral],
    auxiliary: [Muscle.triceps],
    modifiers: freeWeights,
  },
];
