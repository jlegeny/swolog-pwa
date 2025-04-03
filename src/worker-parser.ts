import { Log, LogConfig } from "./lib/data";
import * as parser from "./lib/parser";

export const parseLog = (log: Log, config: LogConfig) => {
  return parser.parseLog(log, config);
};

export const parseLift = (line: string, shortcuts: Map<string, string>) => {
  return parser.parseLift(line, shortcuts);
};
