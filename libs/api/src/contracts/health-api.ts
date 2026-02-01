import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "@effect/platform";
import { Schema } from "effect";

// ----------------------------------------------------------------
// Health
// ----------------------------------------------------------------

/**
 * HealthCheckResponse - Response for the health check endpoint
 */
export class HealthCheckResponse extends Schema.Class<HealthCheckResponse>("HealthCheckResponse")({
    status: Schema.Literal("ok", "degraded", "unhealthy"),
    timestamp: Schema.String,
    version: Schema.OptionFromNullOr(Schema.String),
}) {}

/**
 * Health check endpoint
 * GET /api/health
 */
export const healthCheck = HttpApiEndpoint.get("healthCheck", "/health")
    .addSuccess(HealthCheckResponse)
    .annotateContext(
        OpenApi.annotations({
            summary: "Health check",
            description: "Returns the current health status of the API",
        }),
    );

// ----------------------------------------------------------------
// Probe
// ----------------------------------------------------------------

/**
 * ProbeResponse - Response for the health check endpoint
 */
export class ProbeResponse extends Schema.Class<ProbeResponse>("HealthCheckResponse")({
    status: Schema.Literal("ok"),
}) {}

/**
 * Health check endpoint
 * GET /api/probe
 */
export const probe = HttpApiEndpoint.get("probe", "/probe")
    .addSuccess(ProbeResponse)
    .annotateContext(
        OpenApi.annotations({
            summary: "Probe",
            description: "Returns a simple ok status for load balancers or uptime monitors",
        }),
    );

// ----------------------------------------------------------------
// Group
// ----------------------------------------------------------------

/**
 * HealthApi - Unprotected health check group
 *
 * No authentication required - used by load balancers and monitoring.
 */
export class HealthApi extends HttpApiGroup.make("health")
    .add(healthCheck)
    .add(probe)
    .annotateContext(
        OpenApi.annotations({
            title: "Health",
            description: "API health and status endpoints",
        }),
    ) {}
