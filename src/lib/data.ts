export interface Log {
  // Unique identifier of the workout log.
  id: string;
  // Full text of the workout log.
  text: string;
}

export interface Session {
  date: string;
  lifts: Lift[];
  startLine: number;
  endLine: number;
  duration?: number; // in minutes
}

export interface SimpleSet {
  weight: number;
  reps: number;
}

export interface SplitSet {
  weight: number;
  leftReps: number;
  rightReps: number;
}

export interface DropSet {
  weights: number[];
  reps: number[];
}

type ValueOf<Obj> = Obj[keyof Obj];
type OneOnly<Obj, Key extends keyof Obj> = { [key in Exclude<keyof Obj, Key>]: null } & Pick<Obj, Key>;
type OneOfByKey<Obj> = { [key in keyof Obj]: OneOnly<Obj, key> };
export type OneOfType<Obj> = ValueOf<OneOfByKey<Obj>>;

type Set = OneOfType<{simple: SimpleSet; split: SplitSet; drop: DropSet}>;

export interface Lift {
  shorthand: string;
  work: string;
  modifiers?: string[];
  date?: string;
  line?: number;
  sets?: Set[];
}
