import { Muscle } from "./exercises";
import { Session } from "./data";
import { exerciseCache  } from "./exercises";
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
}

export const inferSessionTitle = (fractionalSets: Map<Muscle, number>) => {
  let upperPull = 0;
  let upperPullMax = 0;
  let upperPush = 0;
  let upperPushMax = 0;
  let legs = 0;
  let legsMax = 0;
  let abs = 0;
  // let absMax = 0;
  let max = 0;

  const muscleImpact = (m: Muscle) => {
    return fractionalSets.get(m) ?? 0;
  };

  [
    Muscle.biceps,
    Muscle.lats,
    Muscle.lowerBack,
    Muscle.upperBack,
    Muscle.traps,
    Muscle.sideDeltoids,
  ].forEach((m) => {
    upperPull += muscleImpact(m);
    upperPullMax += 1;
    max += muscleImpact(m);
  });

  [Muscle.pectorals, Muscle.triceps, Muscle.frontDeltoids].forEach((m) => {
    upperPush += muscleImpact(m);
    upperPushMax += 1;
    max += muscleImpact(m);
  });

  [Muscle.quads, Muscle.calves, Muscle.glutes, Muscle.hamstrings].forEach(
    (m) => {
      legs += muscleImpact(m);
      legsMax += 1;
      max += muscleImpact(m);
    }
  );

  [Muscle.abs, Muscle.obliques].forEach((m) => {
    abs += muscleImpact(m);
    // max += muscleImpact(m);
  });

  const upperPullRatio = upperPull && upperPull / upperPullMax;
  const upperPushRatio = upperPush && upperPush / upperPushMax;
  const legsRatio = legs && legs / legsMax;
  const absRatio = abs && abs / max;

  console.log(
    "Pull",
    upperPullRatio,
    "Push",
    upperPushRatio,
    "Legs",
    legsRatio
  );
  if (upperPullRatio > upperPushRatio + legsRatio) {
    return "Pull";
  }

  if (upperPushRatio > upperPullRatio + legsRatio) {
    return "Push";
  }

  if (legsRatio > upperPullRatio + upperPushRatio) {
    return "Legs";
  }

  if (upperPullRatio + upperPushRatio > 0.6) {
    return "Upper Body";
  }

  if (absRatio > 0.5) {
    return "Abdominals";
  }

  return "Whole Body";
};
