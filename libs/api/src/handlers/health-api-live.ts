import { HttpApiBuilder } from "@effect/platform";
import { Effect } from "effect";
import { AppApi } from "../contracts/app-api.js";
import { HealthService } from "../services/health-service.js";

/**
 * HealthApiLive - Health check endpoint implementation
 *
 * Simple handler that returns the current health status.
 * This endpoint is not protected by authentication.
 */
export const HealthApiLive = HttpApiBuilder.group(AppApi, "health", (handlers) =>
    Effect.gen(function* () {
        const healthService = yield* HealthService;

        return handlers
            .handle("healthCheck", () => healthService.healthCheck)
            .handle("probe", () => healthService.probe);
    }),
);
