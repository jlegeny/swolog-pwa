import { Muscle } from "./exercises";

export interface MuscleGroup {
  name: string;
  muscles: Set<Muscle>;
}

export interface LogConfig {
  // Shortcuts.
  shortcuts: Map<string, string>;
  periodLength: number;
  periodTarget: Map<Muscle, number>;
  muscleGroups: Array<MuscleGroup>;
}

export const DEFAULT_CONFIG = {
  shortcuts: new Map([
    ["BBP", "BP#B"],
    ["DBBP", "BP#D"],
    ["IBBP", "IBP#B"],
    ["IBDP", "IBP#D"],
    ["PU", "PullUp"],
    ["IBDC", "IBC#D"],
    ["BBC", "Curl#B"],
    ["OHP", "SHP#B"],
  ]),
  muscleGroups: [
    {
      name: "Pull",
      muscles: new Set([
        Muscle.biceps,
        Muscle.lats,
        Muscle.lowerBack,
        Muscle.traps,
        Muscle.sideDeltoids,
        Muscle.rearDeltoids,
        Muscle.forearms,
      ]),
    },
    {
      name: "Push",
      muscles: new Set([
        Muscle.pectorals,
        Muscle.triceps,
        Muscle.frontDeltoids,
      ]),
    },
    {
      name: "Legs",
      muscles: new Set([
        Muscle.quads,
        Muscle.calves,
        Muscle.glutes,
        Muscle.hamstrings,
        Muscle.adductor,
      ]),
    },
    {
      name: "Abs",
      muscles: new Set([Muscle.abs, Muscle.obliques]),
    },
  ],
  periodLength: 7,
  periodTarget: new Map<Muscle, number>([
    [Muscle.pectorals, 16],
    [Muscle.lats, 16],
    [Muscle.quads, 16],
    [Muscle.hamstrings, 16],
    [Muscle.glutes, 16],

    [Muscle.frontDeltoids, 14],
    [Muscle.sideDeltoids, 14],
    [Muscle.rearDeltoids, 14],
    [Muscle.traps, 14],
    [Muscle.triceps, 14],
    [Muscle.biceps, 14],
    [Muscle.calves, 14],
    [Muscle.abs, 14],

    [Muscle.forearms, 12],
    [Muscle.obliques, 12],
    [Muscle.lowerBack, 12],
    [Muscle.adductor, 12],
  ]),
};

export function getConfigForLog(_id: string): LogConfig {
  return DEFAULT_CONFIG;
}
