import { HttpApi, OpenApi } from "@effect/platform";
import { HealthApi } from "./health-api.js";

/**
 * AppApi - Main API definition combining all groups
 *
 * Groups:
 * - /api/health - Health check (unprotected)
 * - /api/probe - Authentication (mixed public/protected)
 */
export class AppApi extends HttpApi.make("AppApi")
    .add(HealthApi)
    .prefix("/api")
    .annotateContext(
        OpenApi.annotations({
            title: "Plaxe",
            description: "Automated, per-user media deletion for Plex",
            version: "0.0.1",
        }),
    ) {}
