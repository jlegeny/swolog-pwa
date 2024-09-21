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

export interface Set {
  single: SimpleSet;
  split: SplitSet;
  drop: DropSet;
}
export interface Lift {
  shorthand: string;
  work: string;
  modifiers?: string[];
  date?: string;
  line?: number;
  sets?: Set[];
}
