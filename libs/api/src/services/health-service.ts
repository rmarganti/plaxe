import { Context, Effect, Layer, Option } from "effect";
import { AppConfig } from "../config.js";

export interface HealthService {
    /**
     * Report on the current health status of the system.
     */
    healthCheck: Effect.Effect<{
        status: HealthStatus;
        timestamp: string;
        version: Option.Option<string>;
    }>;

    /**
     * Return a simple 'ok' status for indicating liveness for
     * load-balancers, k8s deployments, etc.
     */
    probe: Effect.Effect<{ status: "ok" }>;
}

export type HealthStatus = "ok" | "degraded" | "unhealthy";

export const HealthService = Context.GenericTag<HealthService>("HealthService");

export const HealthServiceLive = Layer.effect(
    HealthService,
    Effect.gen(function* () {
        const appConfig = yield* AppConfig;

        return {
            healthCheck: Effect.succeed({
                status: "ok",
                timestamp: new Date().toISOString(),
                version: Option.some(appConfig.version),
            }),

            probe: Effect.succeed({
                status: "ok",
            }),
        };
    }),
);
