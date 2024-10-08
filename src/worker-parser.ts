import { Log } from "./lib/data";
import * as parser from "./lib/parser";

export const parseLog = (log: Log) => {
  return parser.parseLog(log);
};

export const parseLift = (line: string, shortcuts: Map<string, string>) => {
  return parser.parseLift(line, shortcuts);
};
