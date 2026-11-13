import { EventEmitter } from "node:events";

// In-process change feed for SSE. Fine for one server instance; swap for
// Postgres LISTEN/NOTIFY if we ever run more than one.
const g = globalThis as unknown as { polkuBus?: EventEmitter };
export const bus = (g.polkuBus ??= new EventEmitter().setMaxListeners(0));

export const publishChange = () => bus.emit("change");
