export enum Muscle {
  pectorals = "pectorals",
  triceps = "triceps",
  biceps = "biceps",
  frontDeltoids = "frontDeltoids",
  sideDeltoids = "sideDeltoids",
  lats = "lats",
  traps = "traps",
  quads = "quads",
  hamstrings = "hamstrings",
  calves = "calves",
  abs = "abs",
  lowerBack = "lowerBack",
  upperBack = "upperBack",
  glutes = "glutes",
  forearms = "forearms",
  obliques = "obliques",
}

export interface Modifier {
  name: string;
  shortcut: string;
  multiplier?: number;
  targetMultiplier?: Map<Muscle, number>;
}

export interface Exercise {
  name: string;
  target: Muscle[];
  auxiliary?: Muscle[];
  modifiers: Modifier[];
  shorthand: string;
}

const freeWeights: Modifier[] = [
  { name: "Barbell", shortcut: "B" },
  { name: "Dumbbell", shortcut: "Db", multiplier: 2 },
];

const bodyWeight: Modifier[] = [{ name: "Body Weight", shortcut: "Bw" }];

const machines: Modifier[] = [{ name: "Machine", shortcut: "M" }];

const seated: Modifier[] = [{ name: "Seated", shortcut: "S" }];

const cable: Modifier[] = [{ name: "Cable", shortcut: "C" }];

export const exercises: Exercise[] = [
  // Chest
  {
    name: "Bench Press",
    shorthand: "BP",
    target: [Muscle.pectorals],
    modifiers: freeWeights,
  },
  {
    name: "Incline Bench Press",
    shorthand: "IBP",
    target: [Muscle.pectorals],
    auxiliary: [Muscle.triceps],
    modifiers: freeWeights,
  },
  {
    name: "Close Grip Bench Press",
    shorthand: "CGBP",
    target: [Muscle.triceps],
    auxiliary: [Muscle.pectorals],
    modifiers: [{ name: "Barbell", shortcut: "B" }],
  },
  {
    name: "Chest Fly",
    shorthand: "Fly",
    target: [Muscle.pectorals],
    modifiers: [{ name: "Cable", shortcut: "C" }, ...freeWeights],
  },
  {
    name: "Push-Up",
    shorthand: "PushUp",
    target: [Muscle.pectorals],
    auxiliary: [Muscle.triceps, Muscle.frontDeltoids],
    modifiers: bodyWeight,
  },
  {
    name: "Dip",
    shorthand: "Dip",
    target: [Muscle.triceps],
    auxiliary: [Muscle.pectorals, Muscle.frontDeltoids],
    modifiers: [
      { name: "Body Weight", shortcut: "Bw" },
      { name: "Machine", shortcut: "M" },
    ],
  },
  // Back
  {
    name: "Pull-Up",
    shorthand: "PullUp",
    target: [Muscle.lats],
    auxiliary: [Muscle.biceps, Muscle.traps],
    modifiers: bodyWeight,
  },
  {
    name: "Lat Pulldown",
    shorthand: "LPD",
    target: [Muscle.lats],
    auxiliary: [Muscle.biceps],
    modifiers: machines,
  },
  {
    name: "Bent-Over Row",
    shorthand: "BOR",
    target: [Muscle.lats],
    auxiliary: [Muscle.biceps, Muscle.lowerBack],
    modifiers: freeWeights,
  },
  {
    name: "Deadlift",
    shorthand: "DL",
    target: [Muscle.lowerBack, Muscle.glutes],
    auxiliary: [Muscle.hamstrings, Muscle.traps],
    modifiers: [{ name: "Barbell", shortcut: "B" }],
  },
  {
    name: "One-Arm Row",
    shorthand: "OAR",
    target: [Muscle.lats],
    auxiliary: [Muscle.biceps],
    modifiers: [{ name: "Dumbbell", shortcut: "Db" }],
  },
  {
    name: "Row",
    shorthand: "Row",
    target: [Muscle.lats],
    auxiliary: [Muscle.biceps, Muscle.traps],
    modifiers: [
      { name: "Machine", shortcut: "M" },
      { name: "Cable", shortcut: "C" },
    ],
  },
  {
    name: "Low Row",
    shorthand: "LowRow",
    target: [Muscle.lats],
    auxiliary: [Muscle.biceps, Muscle.traps],
    modifiers: [
      { name: "Cable", shortcut: "C" },
      { name: "Machine", shortcut: "M" },
    ],
  },
  {
    name: "T-Bar Row",
    shorthand: "TBRow",
    target: [Muscle.lats],
    auxiliary: [Muscle.traps, Muscle.biceps],
    modifiers: [{ name: "Barbell", shortcut: "B" }],
  },
  {
    name: "One-Armed Pulldown",
    shorthand: "OAPD",
    target: [Muscle.lats],
    auxiliary: [Muscle.biceps],
    modifiers: [{ name: "Cable", shortcut: "C" }],
  },
  // Shoulders
  {
    name: "Shoulder Press",
    shorthand: "SHP",
    target: [Muscle.frontDeltoids],
    auxiliary: [Muscle.triceps],
    modifiers: [...freeWeights, ...machines, ...seated],
  },
  {
    name: "Lateral Raise",
    shorthand: "LatR",
    target: [Muscle.sideDeltoids],
    modifiers: [{ name: "Dumbbell", shortcut: "Db", multiplier: 2 }, ...cable],
  },
  {
    name: "Front Raise",
    shorthand: "FR",
    target: [Muscle.frontDeltoids],
    modifiers: [{ name: "Dumbbell", shortcut: "Db", multiplier: 2 }],
  },
  {
    name: "Reverse Fly",
    shorthand: "RFly",
    target: [Muscle.sideDeltoids],
    auxiliary: [Muscle.traps],
    modifiers: [
      ...machines,
      { name: "Dumbbell", shortcut: "Db", multiplier: 2 },
      ...cable,
    ],
  },
  {
    name: "Delts Machine",
    shorthand: "DeltM",
    target: [Muscle.sideDeltoids],
    modifiers: machines,
  },
  // Shoulders and Upper Back
  {
    name: "Upright Row",
    shorthand: "URow",
    target: [Muscle.sideDeltoids, Muscle.traps],
    modifiers: freeWeights,
  },
  {
    name: "Shrug",
    shorthand: "Shrug",
    target: [Muscle.traps],
    modifiers: [
      { name: "Dumbbell", shortcut: "Db", multiplier: 2 },
      { name: "Barbell", shortcut: "B" },
    ],
  },
  {
    name: "Face Pull",
    shorthand: "FP",
    target: [Muscle.sideDeltoids, Muscle.traps],
    auxiliary: [Muscle.upperBack],
    modifiers: [{ name: "Cable", shortcut: "C" }],
  },
  // Arms
  {
    name: "Bicep Curl",
    shorthand: "Curl",
    target: [Muscle.biceps],
    modifiers: [
      { name: "Dumbbell", shortcut: "Db", multiplier: 2 },
      { name: "Hammer", shortcut: "H" },
      ...seated,
    ],
  },
  {
    name: "Inclined Bench Curl",
    shorthand: "IBC",
    target: [Muscle.biceps],
    auxiliary: [Muscle.forearms],
    modifiers: [{ name: "Dumbbell", shortcut: "Db", multiplier: 2 }],
  },
  {
    name: "Tricep Extension",
    shorthand: "TrcpExt",
    target: [Muscle.triceps],
    modifiers: [
      { name: "Dumbbell", shortcut: "Db", multiplier: 2 },
      { name: "Cable", shortcut: "C" },
    ],
  },
  {
    name: "Skull Crusher",
    shorthand: "SKC",
    target: [Muscle.triceps],
    modifiers: [
      { name: "Barbell", shortcut: "B" },
      { name: "Dumbbell", shortcut: "Db", multiplier: 2 },
    ],
  },
  {
    name: "Tricep Pushdown",
    shorthand: "TPD",
    target: [Muscle.triceps],
    modifiers: [{ name: "Cable", shortcut: "C" }],
  },
  // Forearms
  {
    name: "Wrist Curls",
    shorthand: "WrCurl",
    target: [Muscle.forearms],
    modifiers: [
      { name: "Dumbbell", shortcut: "Db", multiplier: 2 },
      { name: "Barbell", shortcut: "B" },
    ],
  },
  // Legs
  {
    name: "Squat",
    shorthand: "SQ",
    target: [Muscle.quads],
    auxiliary: [Muscle.glutes, Muscle.hamstrings],
    modifiers: freeWeights,
  },
  {
    name: "Hack Squat",
    shorthand: "HackSq",
    target: [Muscle.quads],
    auxiliary: [Muscle.glutes, Muscle.hamstrings],
    modifiers: machines,
  },
  {
    name: "Lunge",
    shorthand: "Lunge",
    target: [Muscle.quads, Muscle.glutes],
    modifiers: [
      { name: "Dumbbell", shortcut: "Db", multiplier: 2 },
      ...bodyWeight,
    ],
  },
  {
    name: "Leg Press",
    shorthand: "LP",
    target: [Muscle.quads],
    auxiliary: [Muscle.glutes],
    modifiers: machines,
  },
  {
    name: "Calf Raise",
    shorthand: "CalfR",
    target: [Muscle.calves],
    modifiers: [...bodyWeight, ...machines],
  },
  {
    name: "Leg Extension",
    shorthand: "LExt",
    target: [Muscle.quads],
    modifiers: machines,
  },
  {
    name: "Calf Press",
    shorthand: "Calf",
    target: [Muscle.calves],
    modifiers: machines,
  },
  {
    name: "Bulgarian Split Squat",
    shorthand: "BSSQ",
    target: [Muscle.quads, Muscle.glutes],
    auxiliary: [Muscle.hamstrings],
    modifiers: [
      { name: "Dumbbell", shortcut: "Db", multiplier: 2 },
      { name: "Body Weight", shortcut: "BW" },
    ],
  },
  {
    name: "Leg Curl",
    shorthand: "LCurl",
    target: [Muscle.hamstrings],
    modifiers: [{ name: "Machine", shortcut: "M" }],
  },
  {
    name: "Hip Thrust",
    shorthand: "HT",
    target: [Muscle.glutes],
    auxiliary: [Muscle.hamstrings],
    modifiers: [
      { name: "Barbell", shortcut: "B" },
      { name: "Body Weight", shortcut: "BW" },
    ],
  },
  {
    name: "Adductor",
    shorthand: "ADD",
    target: [Muscle.quads],
    modifiers: [{ name: "Machine", shortcut: "M" }],
  },
  {
    name: "Abductor",
    shorthand: "ABD",
    target: [Muscle.glutes],
    modifiers: [{ name: "Machine", shortcut: "M" }],
  },
  {
    name: "Romanian Deadlift",
    shorthand: "RDL",
    target: [Muscle.hamstrings],
    auxiliary: [Muscle.glutes, Muscle.lowerBack],
    modifiers: [
      { name: "Barbell", shortcut: "B" },
      { name: "Dumbbell", shortcut: "Db", multiplier: 2 },
    ],
  },
  // Glutes
  {
    name: "Donkey Kick",
    shorthand: "Kick",
    target: [Muscle.glutes],
    auxiliary: [Muscle.hamstrings],
    modifiers: [
      ...machines,
      { name: "Body Weight", shortcut: "Bw" },
      { name: "Cable", shortcut: "C" },
    ],
  },
  // Lower Back and Hamstrings
  {
    name: "Good Mornings",
    shorthand: "GM",
    target: [Muscle.lowerBack],
    auxiliary: [Muscle.hamstrings, Muscle.glutes],
    modifiers: [
      { name: "Barbell", shortcut: "B" },
      { name: "Body Weight", shortcut: "BW" },
    ],
  },
  // Core
  {
    name: "Plank",
    shorthand: "Plank",
    target: [Muscle.abs],
    modifiers: bodyWeight,
  },
  {
    name: "Crunch",
    shorthand: "Crunch",
    target: [Muscle.abs],
    modifiers: [...bodyWeight, ...cable],
  },
  {
    name: "Russian Twist",
    shorthand: "RT",
    target: [Muscle.abs],
    auxiliary: [Muscle.obliques],
    modifiers: [{ name: "Dumbbell", shortcut: "Db" }],
  },
  {
    name: "Leg Raise",
    shorthand: "LegR",
    target: [Muscle.abs],
    modifiers: bodyWeight,
  },
  {
    name: "Decline Bench Crunch",
    shorthand: "DBCrunch",
    target: [Muscle.abs],
    modifiers: [
      { name: "Body Weight", shortcut: "BW" },
      { name: "Dumbbell", shortcut: "Db" },
    ],
  },
];

class ExerciseCache {
  private shorthandToExercise = new Map<string, Exercise>();

  constructor() {
    for (const exercise of exercises) {
      this.shorthandToExercise.set(exercise.shorthand, exercise);
    }
  }

  getExercise = (shorthand: string): Exercise | undefined => {
    return this.shorthandToExercise.get(shorthand);
  };

  getModifier = (
    shortcut: string,
    exercise: Exercise
  ): Modifier | undefined => {
    for (const modifier of exercise.modifiers ?? []) {
      if (modifier.shortcut === shortcut) {
        return modifier;
      }
    }
    return undefined;
  };
}

export const exerciseCache = new ExerciseCache();
