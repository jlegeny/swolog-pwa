import { Log, Session, Lift } from './data';

const RE_DATE = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;

/*
export function date(
  from match: Regex<
    Regex<(Substring, year: Substring, month: Substring, day: Substring)>.RegexOutput
  >.Match
) -> Date? {
  var components = DateComponents()
  components.year = Int(match.year)
  components.month = Int(match.month)
  components.day = Int(match.day)
  components.timeZone = Calendar.current.timeZone
  return Calendar.current.date(from: components)
}
*/

export interface ParsingMetadata {
  lastSessionStartLine?: number;
}

export function parseLog(log: Log): {sessions: Session[], errors: Map<number, string>, metadata: ParsingMetadata} {
  const sessions: Session[] = [];
  const errors = new Map<number, string>();
  const metadata: ParsingMetadata = {};

  console.debug(`Parsing log ${log.id}`);

  const lines = log.text.split('\n');

  let currentDate: Date | undefined = undefined
  let currentOrder = 1

  let lineNumber = 0

  lines:
  for (const line of lines) {
    lineNumber++;
    if (line.match(/^#/)) {
      continue lines;
    }
    const matchDate = RE_DATE.exec(line);
    if (matchDate) {
      metadata.lastSessionStartLine = lineNumber - 1;
      console.info(`Matched Date at line ${lineNumber}`, matchDate);
    }
    /*
    if (line.match(RE_DATE)) {
      guard let parsedDate = date(from: match) else {
        continue lines
      }
      currentDate = parsedDate
      currentOrder = 1
      logger.debug("Parsing date \(currentDate?.formatted() ?? "")")
    } else {
      guard let currentDate = currentDate else {
        errors[index] = "Uknown date for lift"
        logger.warning("Unknown date for lift \(line)")
        continue lines
      }
      do {
        let lift = try parseLift(line: line)
        lift.date = currentDate
        lift.order = currentOrder
        currentOrder += 1
        lifts.append(lift)
      } catch ParseError.parseLiftError(let kind, let string) {
        errors[index] = "\(kind.rawValue) \(string)"
        logger.warning("\(kind.rawValue) \(string)")
        continue lines
      } catch {
        errors[index] = "\(error)"
        logger.warning("\(error)")
        continue lines
      }
    }
      */
  }

  return { sessions, errors, metadata };
}


/*
import Foundation
import OSLog

enum ParseLiftErrorKind: String {
  case invalidShorthand = "Invalid Shorthand"
  case invalidWeight = "Invalid Weight"
}

enum ParseError: Error {
  case parseLiftError(kind: ParseLiftErrorKind, string: String)
}

public let RE_DATE = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/
public let RE_WEIGHT = /(?<mod>[+-])?(?<weight>\d+(?:\.\d+)?)/

func date(
  from match: Regex<
    Regex<(Substring, year: Substring, month: Substring, day: Substring)>.RegexOutput
  >.Match
) -> Date? {
  var components = DateComponents()
  components.year = Int(match.year)
  components.month = Int(match.month)
  components.day = Int(match.day)
  components.timeZone = Calendar.current.timeZone
  return Calendar.current.date(from: components)
}

func parse(log: Log) -> ([Lift], [Int: String]) {
  let logger = Logger()
  var lifts = [Lift]()
  var errors = [Int: String]()

  logger.debug("Parsing log '\(log.name)'")

  let lines = log.text.split { $0.isNewline }

  var currentDate: Date? = nil
  var currentOrder = 1

  lines: for (index, line) in lines.enumerated() {
    if line.starts(with: /#/) {
      continue lines
    } else if let match = line.wholeMatch(of: RE_DATE) {
      guard let parsedDate = date(from: match) else {
        continue lines
      }
      currentDate = parsedDate
      currentOrder = 1
      logger.debug("Parsing date \(currentDate?.formatted() ?? "")")
    } else {
      guard let currentDate = currentDate else {
        errors[index] = "Uknown date for lift"
        logger.warning("Unknown date for lift \(line)")
        continue lines
      }
      do {
        let lift = try parseLift(line: line)
        lift.date = currentDate
        lift.order = currentOrder
        currentOrder += 1
        lifts.append(lift)
      } catch ParseError.parseLiftError(let kind, let string) {
        errors[index] = "\(kind.rawValue) \(string)"
        logger.warning("\(kind.rawValue) \(string)")
        continue lines
      } catch {
        errors[index] = "\(error)"
        logger.warning("\(error)")
        continue lines
      }
    }
  }

  return (lifts, errors)
}

func parseLift(line: Substring) throws -> Lift {
  let logger = Logger()

  var str = line

  var isSuperSet = false
  if let match = str.prefixMatch(of: /SS\ /) {
    isSuperSet = false
    str = str[match.range.upperBound...]
  }

  guard let match = str.prefixMatch(of: /(?<shorthand>\w+)\ /) else {
    throw ParseError.parseLiftError(kind: .invalidShorthand, string: String(line))
  }
  let shorthand = match.shorthand

  logger.debug("Parsing lift '\(shorthand)'")
  let work = line[match.range.upperBound...]
  logger.debug("Left to parse '\(work)'")

  var lift = Lift(shorthand: String(shorthand), work: String(work))

  // Split the remaining string by ; which delimit sets with different weights
  let groups = work.split(separator: ";")
  for group in groups {
    let str = group.trimmingCharacters(in: .whitespaces)
    // Split of the first blob without spaces, this is the group of weights
    guard let match = str.prefixMatch(of: /[^ ]+/) else {
      // This means an empty weight group
      continue
    }
    // Now split the group of weights by /
    let groupWeights = match.output
    let weights = groupWeights.split(separator: "/")
    for weight in weights {
      guard let match = weight.prefixMatch(of: RE_WEIGHT) else {
        throw ParseError.parseLiftError(kind: .invalidWeight, string: String(str))
      }
      logger.debug("Weight \(match.output.weight)")
    }
  }

  return lift
}

*/