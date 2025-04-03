import { Log, LogConfig, Set, Session, Lift } from "./data";

const RE_DATE = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
const RE_SHORTCUT = /(?<shortcut>\w+)\s*=\s*(?<expansion>[\w#]+)/;
const RE_WEIGHT = /(?<mod>[+-])?(?<weight>\d+(?:\.\d+)?)/;
const RE_REP =
  /^(?:(?<single>\d+)|(?:(?<seconds>\d+)s)|(?<multi>\d+(?:\/\d+)+)|(?<myo>\d+(?:\+\d+)+))$/;
const RE_DURATION = /(?<minutes>\d+)'/;

enum ParseErrorType {
  INVALID_SHORTHAND = "Invalid Shorthand",
  INVALID_WEIGHT = "Invalid Weight",
  INVALID_REP = "Invalid Rep",
}

const debugLog = (...args: unknown[]) => {
  return;
  console.debug(...args);
};

export class ParseError extends Error {
  constructor(readonly type: ParseErrorType, msg: string) {
    super(msg);
    Object.setPrototypeOf(this, ParseError.prototype);
  }
  toString() {
    return `${this.type} : ${this.message}`;
  }
}

export interface ParsingMetadata {
  lastSessionStartLine?: number;
}

export function parseLog(
  log: Log,
  config: LogConfig
): {
  sessions: Session[];
  errors: Map<number, string>;
  metadata: ParsingMetadata;
} {
  const sessions: Session[] = [];
  const errors = new Map<number, string>();
  const metadata: ParsingMetadata = {};
  const shortcuts = config.shortcuts;

  console.group(`Parsing log ${log.id}`);

  const lines = log.text.split("\n");

  let currentDate: string | undefined = undefined;
  let currentSession: Session | undefined = undefined;

  let lineNumber = 0;

  lines: for (const line of lines) {
    lineNumber++;
    // Filter out empty lines.
    if (!line.length) {
      continue lines;
    }

    // Filter out comments.
    if (line.match(/^#/)) {
      continue lines;
    }

    // Match shortcuts.
    const matchShortcut = RE_SHORTCUT.exec(line);
    if (matchShortcut) {
      if (matchShortcut.groups?.shortcut && matchShortcut.groups?.expansion) {
        shortcuts.set(
          matchShortcut.groups.shortcut,
          matchShortcut.groups?.expansion
        );
      }
      continue lines;
    }

    // Match dates.
    const matchDate = RE_DATE.exec(line);
    if (matchDate) {
      if (sessions.length) {
        sessions[sessions.length - 1].endLine = lineNumber - 1;
      }

      metadata.lastSessionStartLine = lineNumber - 1;
      const date = line.trim();
      if (!date) {
        console.error(`Failed to parse date [${line}]`);
        continue lines;
      }
      currentSession = {
        date,
        lifts: [],
        startLine: lineNumber,
        endLine: lineNumber,
      };
      sessions.push(currentSession);
      currentDate = date;
      continue lines;
    }

    // Match session duration
    const matchDuration = RE_DURATION.exec(line);
    if (matchDuration) {
      if (!currentSession) {
        errors.set(lineNumber, "Duration specified outside of a session");
        continue lines;
      }
      currentSession.duration = Number(matchDuration.groups?.minutes);
      continue lines;
    }

    // Match lifts.
    if (currentDate === undefined) {
      errors.set(lineNumber, "Unknown date for lift");
      console.warn(`Uknown date for lift ${line}`);
      continue lines;
    }

    try {
      const lift = parseLift(line, shortcuts);
      lift.line = lineNumber;
      currentSession?.lifts.push(lift);
      debugLog(`Parsed lift`, lift);
    } catch (e: unknown) {
      if (e instanceof ParseError) {
        console.error(`Parsing error on line ${lineNumber} : ${e.toString()}`);
        errors.set(lineNumber, e.toString());
      } else {
        console.error(e);
      }
    }
  }
  if (sessions.length) {
    sessions[sessions.length - 1].endLine = lineNumber;
  }
  console.groupEnd();

  return { sessions, errors, metadata };
}

export function parseLift(line: string, shortcuts?: Map<string, string>): Lift {
  let str = line;
  debugLog(`Parsing lift [${str}]`);

  let isSuperSet = false;
  if (str.match(/^SS /)) {
    isSuperSet = true;
    debugLog(` .. is a superset. ${isSuperSet}`);
    str = str.slice(3);
    debugLog(` .. remaining match [${str}]`);
  }

  const matchPrefix = /(?<prefix>\w+) ?/.exec(str);
  if (matchPrefix?.groups?.prefix) {
    const prefix = matchPrefix?.groups?.prefix;
    if (shortcuts?.has(prefix)) {
      str = str.replace(prefix, shortcuts.get(prefix)!);
    }
  }

  const match = /(?<shorthand>[A-Za-z]\w*)(#(?<modifiers>\w+))?\ ?/.exec(str);
  if (!match?.groups?.shorthand) {
    throw new ParseError(ParseErrorType.INVALID_SHORTHAND, line);
  }
  let shorthand = match.groups?.shorthand;
  const work = str.slice(match[0].length);
  const modifiersString = match.groups?.modifiers;
  const modifiers = modifiersString?.split(/(?=[A-Z])/g);

  // Ignore all comments
  const workWithoutComments = work.replace(/\([^)]+\)/g, "");

  const sets: Set[] = [];

  let groups = workWithoutComments.split(/;/);
  group: for (const group of groups) {
    let str = group.trim();
    // Split of the first blob without spaces, this is the group of weights
    let match = str.match(/^[^ ]+/);
    if (!match) {
      // This means an empty weight group
      continue group;
    }
    // Now split the group of weights by /
    let groupWeightsStr = match[0].trim();
    let weightsStr = groupWeightsStr.split(/\//);
    const weights: number[] = [];
    for (const weightStr of weightsStr) {
      const match = RE_WEIGHT.exec(weightStr);
      if (!match?.groups?.weight) {
        throw new ParseError(ParseErrorType.INVALID_WEIGHT, weightStr);
      }
      weights.push(Number(match.groups.weight));
    }
    const groupRepsStr = str.slice(match[0].length).trim();
    if (groupRepsStr === "") {
      continue group;
    }
    const repsStr = groupRepsStr.trim().replace(/,$/, "").split(/,\s+/);
    for (const repStr of repsStr) {
      const match = RE_REP.exec(repStr.trim());
      if (!match) {
        throw new ParseError(ParseErrorType.INVALID_REP, `[${repStr}]`);
      }
      if (match.groups?.single) {
        const reps = Number(match.groups.single);
        if (weights.length !== 1) {
          throw new ParseError(
            ParseErrorType.INVALID_REP,
            `Expected one weight for a simple rep`
          );
        }
        sets.push({
          single: {
            weight: weights[0],
            reps: reps,
          },
        });
      } else if (match.groups?.time) {
        const time = Number(match.groups.time);
        if (weights.length !== 1) {
          throw new ParseError(
            ParseErrorType.INVALID_REP,
            `Expected one weight for a timed rep`
          );
        }
        sets.push({
          timed: {
            weight: weights[0],
            seconds: time,
          },
        });
      } else if (match.groups?.myo) {
        const individualReps = match.groups.myo
          .split("+")
          .map(Number)
          .filter((x) => !isNaN(x));
        const reps = individualReps.reduce((acc, cur) => acc + cur, 0);
        if (weights.length !== 1) {
          throw new ParseError(
            ParseErrorType.INVALID_REP,
            `Expected one weight for a simple rep`
          );
        }
        sets.push({
          single: {
            weight: weights[0],
            reps: reps,
            myo: true,
          },
        });
      } else if (match.groups?.multi) {
        const multiRepsStr = match.groups.multi.split(/\//);
        const multiReps: number[] = [];
        for (const multiRepStr of multiRepsStr) {
          const multiRep = Number(multiRepStr);
          multiReps.push(multiRep);
        }
        if (weights.length === 1 && multiReps.length == 2) {
          sets.push({
            split: {
              weight: weights[0],
              leftReps: multiReps[0],
              rightReps: multiReps[1],
            },
          });
        } else if (weights.length === multiReps.length) {
          sets.push({
            drop: {
              weights,
              reps: multiReps,
            },
          });
        } else {
          throw new ParseError(
            ParseErrorType.INVALID_REP,
            `Mismatched count of weigths and reps [${groupWeightsStr}] : [${groupRepsStr}]`
          );
        }
      }
    }
  }

  return {
    shorthand,
    modifiers,
    work,
    sets,
  };
}
