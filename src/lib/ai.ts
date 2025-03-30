import { Muscle, exerciseCache } from "./exercises";
import { Session } from "./data";
import { MapWithDefault } from "./utils";

export const sessionFractionalSets = (session: Session) => {
  const impact = new MapWithDefault<Muscle, number>(0);
  for (const lift of session.lifts) {
    const exercise = exerciseCache.getExercise(lift.shorthand);
    if (!exercise) {
      continue;
    }
    for (const muscle of exercise?.target) {
      const current = impact.get(muscle);
      impact.set(muscle, current + (lift.sets?.length ?? 0));
    }
    for (const muscle of exercise?.auxiliary ?? []) {
      const current = impact.get(muscle);
      impact.set(muscle, current + (lift.sets?.length ?? 0) * 0.5);
    }
  }
  return impact;
};

export const sessionTotalSets = (session: Session) => {
  let totalSets = 0;
  for (const lift of session.lifts) {
    totalSets += lift.sets?.length ?? 0;
  }
  return totalSets;
};

export const inferSessionTitle = (fractionalSets: Map<Muscle, number>) => {
  let upperPull = 0;
  let upperPush = 0;
  let legs = 0;
  let abs = 0;

  const muscleImpact = (m: Muscle) => {
    return fractionalSets.get(m) ?? 0;
  };

  [
    Muscle.biceps,
    Muscle.lats,
    Muscle.lowerBack,
    Muscle.traps,
    Muscle.sideDeltoids,
    Muscle.rearDeltoids,
  ].forEach((m) => {
    upperPull += muscleImpact(m);
  });

  [Muscle.pectorals, Muscle.triceps, Muscle.frontDeltoids].forEach((m) => {
    upperPush += muscleImpact(m);
  });

  [Muscle.quads, Muscle.calves, Muscle.glutes, Muscle.hamstrings].forEach(
    (m) => {
      legs += muscleImpact(m);
    }
  );

  [Muscle.abs, Muscle.obliques].forEach((m) => {
    abs += muscleImpact(m);
  });

  if (upperPull > upperPush + legs) {
    return "Pull";
  }

  if (upperPush > upperPull + legs) {
    return "Push";
  }

  if (legs > upperPull + upperPush) {
    return "Legs";
  }

  if (upperPull + upperPush > 0.6) {
    return "Upper Body";
  }

  if (abs > 6) {
    return "Abdominals";
  }

  return "Whole Body";
};

