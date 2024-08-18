export interface Log {
  // Unique identifier of the workout log.
  id: string;
  // Full text of the workout log.
  text: string;
}

export interface Session {
  date: Date;
  lifts: Lift[];
}

export interface Lift {
  shorthand: string;
  work: string;
}