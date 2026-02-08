import { Layer } from "effect";
import { HealthServiceLive } from "./services/health-service.js";

/**
 * A Layer composed of all the dependencies (and sub-dependencies) needed to run this application.
 * This includes internal services, connections to external data sources, etc.
 */
export const AppLayer = Layer.empty.pipe(Layer.provideMerge(HealthServiceLive));
