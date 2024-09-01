import { createContext } from "@lit/context";
import type { IDB } from "./lib/idb";
export type { IDB } from "./lib/idb";
export const dbContext = createContext<IDB>("db-context");
