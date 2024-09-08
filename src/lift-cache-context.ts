import { createContext } from "@lit/context";
import type { LiftCache } from "./lib/lift-cache";
export type { LiftCache } from "./lib/lift-cache";
export const cacheContext = createContext<LiftCache>("cache-context");
