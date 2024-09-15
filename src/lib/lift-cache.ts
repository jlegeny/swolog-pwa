import { Lift, Session } from "./data";
import "./utils";

export class LiftCache {
  private lineToLift = new Map<number, Lift>();
  private shorthandToAllLifts = new Map<string, Lift[]>();

  constructor(public sessions: Session[]) {
    this.init(sessions);
  }

  public init(sessions: Session[]) {
    this.sessions = sessions;
    this.lineToLift.clear();
    this.shorthandToAllLifts.clear();
    for (const session of sessions) {
      for (const lift of session.lifts) {
        if (!this.shorthandToAllLifts.has(lift.shorthand)) {
          this.shorthandToAllLifts.set(lift.shorthand, []);
        }
        lift.date = session.date;
        this.shorthandToAllLifts.get(lift.shorthand)?.push(lift);
        if (lift.line) {
          this.lineToLift.set(lift.line, lift);
        }
      }
    }
  }

  public get lastSession(): Session | undefined {
    if (!this.sessions.length) {
      return undefined;
    }
    return this.sessions[this.sessions.length - 1];
  }

  sessionAtLine = (line:number): Session|undefined => {
    for (const session of this.sessions) {
      if (session.startLine <= line && line <= session.endLine) {
        return session;
      }
    }
    return undefined;
  }

  liftHistory = (lift: Lift): Lift[] => {
    return this.shorthandToAllLifts.get(lift.shorthand) ?? [];
  }

  dateAtLine = (line: number): string | undefined => {
    for (const session of this.sessions) {
      if (session.startLine <= line && line <= session.endLine) {
        return session.date;
      }
    }
    return undefined;
  };

  liftAtLine = (line: number): Lift | undefined => {
    return this.lineToLift.get(line);
  }

  findPreviousLift = (shorthand: string, date: string): Lift | undefined => {
    const history = this.shorthandToAllLifts.get(shorthand);
    if (!history) {
      return undefined;
    }

    for (const lift of history.reversed()) {
      if (!lift.date) {
        console.error("Lift has no date", lift);
        return undefined;
      }
      if (lift.date < date) {
        return lift;
      }
    }
    return undefined;
  };


}
