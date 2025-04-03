import { LogConfig } from './data';

export function getConfigForLog(_id: string): LogConfig {
  return {
    shortcuts: new Map([["BBP", "BP#B"]]),
  };
}