import { HttpApiBuilder } from "@effect/platform";
import { Layer } from "effect";
import { AppApi } from "../contracts/app-api.js";
import { HealthApiLive } from "./health-api-live.js";

/**
 * AppApiLive - Complete API layer combining all implementations
 *
 * Provides:
 * - Health check (unprotected)
 * - Probe (unprotected)
 */
export const AppApiLive = HttpApiBuilder.api(AppApi).pipe(Layer.provide(HealthApiLive));
