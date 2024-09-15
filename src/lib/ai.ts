import { Muscle } from "./exercises";

export const inferSessionTitle = (
  mainMuscles: Set<Muscle>,
  auxMuscles: Set<Muscle>
) => {
  let upperPull = 0;
  // let upperPullMax = 0;
  let upperPush = 0;
  // let upperPushMax = 0;
  let legs = 0;
  // let legsMax = 0;
  let abs = 0;
  // let absMax = 0;
  let max = 0;

  const muscleImpact = (m: Muscle) => {
    if (mainMuscles.has(m)) {
      return 1;
    }
    if (auxMuscles.has(m)) {
      return 0.33;
    }
    return 0;
  };

  [Muscle.biceps, Muscle.lats, Muscle.lowerBack, Muscle.upperBack].forEach(
    (m) => {
      upperPull += muscleImpact(m);
      max += muscleImpact(m);
    }
  );

  [Muscle.pectoral, Muscle.triceps, Muscle.deltoids].forEach((m) => {
    upperPush += muscleImpact(m);
    max += muscleImpact(m);
  });

  [Muscle.quads, Muscle.calves, Muscle.glutes, Muscle.hamstrings].forEach(
    (m) => {
      legs += muscleImpact(m);
      max += muscleImpact(m);
    }
  );

  [Muscle.abs, Muscle.obliques].forEach((m) => {
    abs += muscleImpact(m);
    // max += muscleImpact(m);
  });

  const upperPullRatio = upperPull / max;
  const upperPushRatio = upperPush / max;
  const legsRatio = legs / max;
  const absRatio = abs / max;

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
