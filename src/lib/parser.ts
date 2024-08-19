import { Log, Session, Lift } from '../data';

const RE_DATE = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
const RE_WEIGHT = /(?<mod>[+-])?(?<weight>\d+(?:\.\d+)?)/;

enum ParseErrorType {
  INVALID_SHORTHAND = "Invalid Shorthand",
  INVALID_WEIGHT = "Invalid Weight",
}

class ParseError extends Error {
  constructor(readonly type: ParseErrorType, msg: string) {
      super(msg);
      Object.setPrototypeOf(this, ParseError.prototype);
  }
  toString() {
    return this.type;
  }
}

export interface ParsingMetadata {
  lastSessionStartLine?: number;
}

export function parseLog(log: Log): { sessions: Session[], errors: Map<number, string>, metadata: ParsingMetadata } {
  const sessions: Session[] = [];
  const errors = new Map<number, string>();
  const metadata: ParsingMetadata = {};

  console.group();
  console.debug(`Parsing log ${log.id}`);

  const lines = log.text.split('\n');

  let currentDate: Date | undefined = undefined
  let currentSession: Session | undefined =  undefined;

  let lineNumber = 0

  lines:
  for (const line of lines) {
    lineNumber++;

    // Filter out empty lines.
    if (!line.length) {
      continue lines;
    }

    // Filter out comments.
    if (line.match(/^#/)) {
      continue lines;
    }
    
    // Match dates.
    const matchDate = RE_DATE.exec(line);
    if (matchDate) {
      metadata.lastSessionStartLine = lineNumber - 1;
      console.debug(`Matched Date at line ${lineNumber}`, matchDate);
      const date = new Date(Date.parse(line));
      if (!date) {
        console.error(`Failed to parse date [${line}]`);
        continue lines;
      }
      currentSession = {
        date,
        lifts: [],
      }
      sessions.push(currentSession)
      currentDate = date;
      continue lines;
    }
    
    // Match lifts.
    if (currentDate === undefined) {
      errors.set(lineNumber, "Unknown date for lift");
      console.warn(`Uknown date for lift ${line}`);
      continue lines;
    }
    
    try {
      const lift = parseLift(line);
      currentSession?.lifts.push(lift);
      console.debug(`Parsed lift`, lift);
    } catch (e: unknown) {
      if (e instanceof ParseError) {
        console.error(`Parsing error on line ${lineNumber} : ${e.toString()}`);
        errors.set(lineNumber, e.toString());
      } else {
        console.error(e);
      }
    }
  }
  console.groupEnd();

  return { sessions, errors, metadata };
}


function parseLift(line: string): Lift {
  let str = line;
  console.debug(`Parsing lift [${str}]`);
  
  let isSuperSet = false;
  if (str.match(/^SS /)) {
    isSuperSet = true;
    console.debug(` .. is a superset. ${isSuperSet}`);
    str = str.slice(3);
    console.debug(` .. remaining match [${str}]`);
  }

  const match = /(?<shorthand>\w+)\ /.exec(str);
  if (!match) {
    throw new ParseError(ParseErrorType.INVALID_SHORTHAND, line);
  }

  const shorthand = match.groups?.shorthand ?? "ERROR";
  const work = str.slice(match[0].length);

  let groups = work.split(/;/);
  group:
  for (const group of groups) {
    let str = group.trim();
    // Split of the first blob without spaces, this is the group of weights
    let match = str.match(/^[^ ]+/);
    if (!match) {
      // This means an empty weight group
      continue group;
    }
    // Now split the group of weights by /
    let groupWeights = match[0];
    let weights = groupWeights.split(/\//);
    for (const weight of weights) {
      const match = RE_WEIGHT.exec(weight);
      if (!match) { 
        throw new ParseError(ParseErrorType.INVALID_WEIGHT, weight);
      }
      console.debug(`Weight ${match.groups?.weight}`);
    }
  }

  return {
    shorthand,
    work,
  }
}
