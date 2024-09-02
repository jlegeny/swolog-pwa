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
}

export interface Lift {
  shorthand: string;
  work: string;
  modifiers?: string[];
  date?: string;
  line?: number;
}
