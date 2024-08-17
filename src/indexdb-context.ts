import { createContext } from '@lit/context';
import type { IDB } from './idb';
export type { IDB } from './idb';
export const dbContext = createContext<IDB>('db-context');
