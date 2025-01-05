export enum Muscle {
  pectorals = "pectorals",
  adductor = "adductor",
  triceps = "triceps",
  biceps = "biceps",
  frontDeltoids = "frontDeltoids",
  sideDeltoids = "sideDeltoids",
  anteriorDeltoids = "anteriorDeltoids",
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

const barbell = { name: "Barbell", shortcut: "B" };
const dumbbell = { name: "Dumbbell", shortcut: "Db", multiplier: 2 };
const bodyWeight: Modifier = { name: "Body Weight", shortcut: "Bw" };

const machine: Modifier = { name: "Machine", shortcut: "M" };

const seated: Modifier = { name: "Seated", shortcut: "S" };
const standing: Modifier = { name: "Standing", shortcut: "T" };

const cable: Modifier = { name: "Cable", shortcut: "C" };

const freeWeights: Modifier[] = [barbell, dumbbell];

export const exercises: Exercise[] = [
  // Chest
  {
    name: "Bench Press",
    shorthand: "BP",
    target: [Muscle.pectorals],
    auxiliary: [Muscle.anteriorDeltoids, Muscle.triceps],
    modifiers: freeWeights,
  },
  {
    name: "Incline Bench Press",
    shorthand: "IBP",
    target: [Muscle.pectorals],
    auxiliary: [Muscle.anteriorDeltoids, Muscle.triceps],
    modifiers: freeWeights,
  },
  {
    name: "Close Grip Bench Press",
    shorthand: "CGBP",
    target: [Muscle.triceps],
    auxiliary: [Muscle.pectorals],
    modifiers: [barbell],
  },
  // Iso-Lateral Bench Press
  {
    name: "Iso-Lateral Bench Press",
    shorthand: "IsoBBP",
    target: [Muscle.pectorals],
    auxiliary: [Muscle.anteriorDeltoids, Muscle.triceps],
    modifiers: [machine],
  },
  {
    name: "Chest Fly",
    shorthand: "Fly",
    target: [Muscle.pectorals],
    auxiliary: [Muscle.anteriorDeltoids],
    modifiers: [cable, ...freeWeights],
  },
  {
    name: "Push-Up",
    shorthand: "PushUp",
    target: [Muscle.pectorals],
    auxiliary: [Muscle.anteriorDeltoids, Muscle.triceps],
    modifiers: [bodyWeight],
  },
  {
    name: "Dip",
    shorthand: "Dip",
    target: [Muscle.triceps],
    auxiliary: [Muscle.pectorals, Muscle.frontDeltoids],
    modifiers: [bodyWeight, machine, seated],
  },
  // Chest
  {
    name: "Pec Deck",
    shorthand: "Pect",
    target: [Muscle.pectorals],
    auxiliary: [Muscle.anteriorDeltoids],
    modifiers: [machine],
  },

  // Back
  {
    name: "Pull-Up",
    shorthand: "PullUp",
    target: [Muscle.lats],
    auxiliary: [Muscle.biceps, Muscle.traps],
    modifiers: [bodyWeight],
  },
  {
    name: "Chin-Up",
    shorthand: "ChinUp",
    target: [Muscle.biceps, Muscle.lats],
    auxiliary: [Muscle.traps, Muscle.forearms],
    modifiers: [bodyWeight, machine],
  },
  {
    name: "Lat Pulldown",
    shorthand: "LPD",
    target: [Muscle.lats],
    auxiliary: [Muscle.biceps],
    modifiers: [machine],
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
    modifiers: [barbell],
  },
  {
    name: "One-Arm Row",
    shorthand: "OAR",
    target: [Muscle.lats],
    auxiliary: [Muscle.biceps],
    modifiers: [dumbbell],
  },
  {
    name: "Row",
    shorthand: "Row",
    target: [Muscle.lats],
    auxiliary: [Muscle.biceps, Muscle.traps],
    modifiers: [machine, cable],
  },
  {
    name: "Low Row",
    shorthand: "LowRow",
    target: [Muscle.lats],
    auxiliary: [Muscle.biceps, Muscle.traps],
    modifiers: [cable, machine],
  },
  {
    name: "Iso-Lateral High Row",
    shorthand: "IsoHighRow",
    target: [Muscle.lats],
    auxiliary: [Muscle.biceps, Muscle.traps],
    modifiers: [machine],
  },
  {
    name: "T-Bar Row",
    shorthand: "TBRow",
    target: [Muscle.lats],
    auxiliary: [Muscle.traps, Muscle.biceps, Muscle.lowerBack],
    modifiers: [barbell, machine],
  },
  {
    name: "One-Armed Pulldown",
    shorthand: "OAPD",
    target: [Muscle.lats],
    auxiliary: [Muscle.biceps],
    modifiers: [cable],
  },
  // Shoulders
  {
    name: "Shoulder Press",
    shorthand: "SHP",
    target: [Muscle.frontDeltoids],
    auxiliary: [Muscle.anteriorDeltoids, Muscle.triceps],
    modifiers: [...freeWeights, machine, seated, standing],
  },
  {
    name: "Lateral Raise",
    shorthand: "LatR",
    target: [Muscle.sideDeltoids],
    modifiers: [dumbbell, cable],
  },
  {
    name: "Front Raise",
    shorthand: "FR",
    target: [Muscle.frontDeltoids],
    modifiers: [dumbbell],
  },
  {
    name: "Reverse Fly",
    shorthand: "RFly",
    target: [Muscle.sideDeltoids],
    auxiliary: [Muscle.traps],
    modifiers: [machine, dumbbell, cable],
  },
  {
    name: "Delts Machine",
    shorthand: "DeltM",
    target: [Muscle.sideDeltoids],
    modifiers: [machine],
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
    modifiers: [dumbbell, barbell],
  },
  {
    name: "Face Pull",
    shorthand: "FP",
    target: [Muscle.sideDeltoids, Muscle.traps],
    auxiliary: [Muscle.frontDeltoids, Muscle.upperBack],
    modifiers: [cable],
  },
  {
    name: "T-Bar Row",
    shorthand: "TBarRow",
    target: [Muscle.lats],
    auxiliary: [Muscle.traps, Muscle.biceps, Muscle.lowerBack],
    modifiers: [machine],
  },
  // Arms
  {
    name: "Bicep Curl",
    shorthand: "Curl",
    target: [Muscle.biceps],
    modifiers: [
      dumbbell,
      standing,
      barbell,
      { name: "Hammer", shortcut: "H" },
      seated,
    ],
  },
  {
    name: "Inclined Bench Curl",
    shorthand: "IBC",
    target: [Muscle.biceps],
    auxiliary: [Muscle.forearms],
    modifiers: [dumbbell],
  },
  {
    name: "Tricep Extension",
    shorthand: "TrcpExt",
    target: [Muscle.triceps],
    modifiers: [cable, dumbbell],
  },
  {
    name: "Skull Crusher",
    shorthand: "SKC",
    target: [Muscle.triceps],
    modifiers: [barbell, dumbbell],
  },
  {
    name: "Tricep Pushdown",
    shorthand: "TPD",
    target: [Muscle.triceps],
    modifiers: [cable],
  },
  // Forearms
  {
    name: "Wrist Curls",
    shorthand: "WrCurl",
    target: [Muscle.forearms],
    modifiers: [barbell, dumbbell],
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
    modifiers: [machine],
  },
  {
    name: "Lunge",
    shorthand: "Lunge",
    target: [Muscle.quads, Muscle.glutes],
    modifiers: [bodyWeight, dumbbell],
  },
  {
    name: "Leg Press",
    shorthand: "LP",
    target: [Muscle.quads],
    auxiliary: [Muscle.glutes],
    modifiers: [machine],
  },
  {
    name: "Calf Raise",
    shorthand: "CalfR",
    target: [Muscle.calves],
    modifiers: [bodyWeight, machine],
  },
  {
    name: "Leg Extension",
    shorthand: "LExt",
    target: [Muscle.quads],
    modifiers: [machine],
  },
  {
    name: "Calf Press",
    shorthand: "Calf",
    target: [Muscle.calves],
    modifiers: [machine],
  },
  {
    name: "Bulgarian Split Squat",
    shorthand: "BSSQ",
    target: [Muscle.quads, Muscle.glutes],
    auxiliary: [Muscle.hamstrings],
    modifiers: [dumbbell, bodyWeight],
  },
  {
    name: "Leg Curl",
    shorthand: "LCurl",
    target: [Muscle.hamstrings],
    modifiers: [machine, standing],
  },
  {
    name: "Hip Thrust",
    shorthand: "HT",
    target: [Muscle.glutes],
    auxiliary: [Muscle.hamstrings],
    modifiers: [barbell, bodyWeight],
  },
  {
    name: "Adductor",
    shorthand: "ADD",
    target: [Muscle.adductor],
    modifiers: [machine],
  },
  {
    name: "Abductor",
    shorthand: "ABD",
    target: [Muscle.glutes],
    modifiers: [machine],
  },
  {
    name: "Romanian Deadlift",
    shorthand: "RDL",
    target: [Muscle.hamstrings],
    auxiliary: [Muscle.glutes, Muscle.lowerBack],
    modifiers: [barbell, dumbbell],
  },
  // Glutes
  {
    name: "Donkey Kick",
    shorthand: "Kick",
    target: [Muscle.glutes],
    auxiliary: [Muscle.hamstrings],
    modifiers: [machine, bodyWeight, cable],
  },
  // Lower Back and Hamstrings
  {
    name: "Good Mornings",
    shorthand: "GM",
    target: [Muscle.lowerBack],
    auxiliary: [Muscle.hamstrings, Muscle.glutes],
    modifiers: [barbell, bodyWeight],
  },
  // Core
  {
    name: "Plank",
    shorthand: "Plank",
    target: [Muscle.abs],
    modifiers: [bodyWeight],
  },
  {
    name: "Crunch",
    shorthand: "Crunch",
    target: [Muscle.abs],
    modifiers: [bodyWeight, cable],
  },
  {
    name: "Russian Twist",
    shorthand: "RT",
    target: [Muscle.abs],
    auxiliary: [Muscle.obliques],
    modifiers: [dumbbell],
  },
  {
    name: "Leg Raise",
    shorthand: "LegR",
    target: [Muscle.abs],
    modifiers: [bodyWeight],
  },
  {
    name: "Decline Bench Crunch",
    shorthand: "DBCrunch",
    target: [Muscle.abs],
    modifiers: [bodyWeight, dumbbell],
  },
  {
    name: "Abdominals",
    shorthand: "Abs",
    target: [Muscle.abs],
    modifiers: [{ name: "Knee Tuck", shortcut: "Knt" }],
  },
  {
    name: "Obliques",
    shorthand: "Obl",
    target: [Muscle.obliques],
    modifiers: [bodyWeight],
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
