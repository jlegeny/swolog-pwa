import { Log } from './data';
import { parseLog } from './lib/parser';

export const parse = (log: Log) => {
    return parseLog(log);
}
