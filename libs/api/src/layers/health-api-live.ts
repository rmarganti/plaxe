import { HttpApiBuilder } from "@effect/platform";
import { Effect, Option } from "effect";
import { AppApi } from "../contracts/app-api.js";
import { HealthCheckResponse, ProbeResponse } from "../contracts/health-api.js";
import { AppConfig } from "../config.js";

/**
 * HealthApiLive - Health check endpoint implementation
 *
 * Simple handler that returns the current health status.
 * This endpoint is not protected by authentication.
 */
export const HealthApiLive = HttpApiBuilder.group(AppApi, "health", (handlers) =>
    Effect.gen(function* () {
        const appConfig = yield* AppConfig;

        return handlers
            .handle("healthCheck", () =>
                Effect.succeed(
                    HealthCheckResponse.make({
                        status: "ok",
                        timestamp: new Date().toISOString(),
                        version: Option.some(appConfig.version),
                    }),
                ),
            )
            .handle("probe", () =>
                Effect.succeed(
                    ProbeResponse.make({
                        status: "ok",
                    }),
                ),
            );
    }),
);
