export enum Muscle {
  pectoral = "pectoral",
  triceps = "triceps",
  biceps = "biceps",
  deltoids = "deltoids",
  lats = "lats",
  traps = "traps",
  quads = "quads",
  hamstrings = "hamstrings",
  calves = "calves",
  abs = "abs",
  lowerBack = "lowerBack",
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

const bodyWeight: Modifier[] = [
  { name: "Body Weight", shortcut: "Bw" },
];

const machines: Modifier[] = [
  { name: "Machine", shortcut: "M" },
];

export const exercises: Exercise[] = [
  // Chest
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
  {
    name: "Chest Fly",
    shorthand: "CF",
    target: [Muscle.pectoral],
    modifiers: [{ name: "Cable", shortcut: "C" }, ...freeWeights],
  },
  {
    name: "Push-Up",
    shorthand: "PU",
    target: [Muscle.pectoral],
    auxiliary: [Muscle.triceps, Muscle.deltoids],
    modifiers: bodyWeight,
  },
  // Back
  {
    name: "Pull-Up",
    shorthand: "PLU",
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
  // Shoulders
  {
    name: "Shoulder Press",
    shorthand: "SP",
    target: [Muscle.deltoids],
    auxiliary: [Muscle.triceps],
    modifiers: [...freeWeights, ...machines],
  },
  {
    name: "Lateral Raise",
    shorthand: "LR",
    target: [Muscle.deltoids],
    modifiers: [{ name: "Dumbbell", shortcut: "Db", multiplier: 2 }],
  },
  {
    name: "Front Raise",
    shorthand: "FR",
    target: [Muscle.deltoids],
    modifiers: [{ name: "Dumbbell", shortcut: "Db", multiplier: 2 }],
  },
  // Arms
  {
    name: "Bicep Curl",
    shorthand: "BC",
    target: [Muscle.biceps],
    modifiers: [{ name: "Dumbbell", shortcut: "Db", multiplier: 2 }],
  },
  {
    name: "Tricep Extension",
    shorthand: "TE",
    target: [Muscle.triceps],
    modifiers: [{ name: "Dumbbell", shortcut: "Db", multiplier: 2 }, { name: "Cable", shortcut: "C" }],
  },
  {
    name: "Hammer Curl",
    shorthand: "HC",
    target: [Muscle.biceps],
    auxiliary: [Muscle.forearms],
    modifiers: [{ name: "Dumbbell", shortcut: "Db", multiplier: 2 }],
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
    name: "Lunge",
    shorthand: "Lunge",
    target: [Muscle.quads, Muscle.glutes],
    modifiers: [{ name: "Dumbbell", shortcut: "Db", multiplier: 2 }, ...bodyWeight],
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
    modifiers: bodyWeight,
  },
  {
    name: "Russian Twist",
    shorthand: "RT",
    target: [Muscle.abs],
    auxiliary: [Muscle.obliques],
    modifiers: [{ name: "Dumbbell", shortcut: "Db" }],
  },
];

class ExerciseCache {
  private shorthandToExercise = new Map<string, Exercise>();

  constructor() {
    for (const exercise of exercises) {
      this.shorthandToExercise.set(exercise.shorthand, exercise);
    }
  }

  getExercise = (shorthand: string): Exercise|undefined => {
    return this.shorthandToExercise.get(shorthand);
  }

  getModifier = (shortcut: string, exercise: Exercise): Modifier|undefined => {
    for (const modifier of exercise.modifiers ?? []) {
      if (modifier.shortcut === shortcut) {
        return modifier;
      }
    }
    return undefined;
  }
}

export const exerciseCache = new ExerciseCache();

