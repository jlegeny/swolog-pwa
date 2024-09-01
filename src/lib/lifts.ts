enum Muscle {
  pectoral = "pectoral",
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

export const config: {
  exercises: Exercise[];
  shortcuts: Map<string, string>;
} = {
  exercises: [
    {
      name: "Bench Press",
      shorthand: "BP",
      target: [Muscle.pectoral],
      modifiers: [
        {
          name: "Barbell",
          shortcut: "B",
        },
        {
          name: "Dumbbell",
          shortcut: "Db",
          multiplier: 2,
        },
      ],
    },
  ],
  shortcuts: new Map([["BBP", "BP#B"]]),
};
