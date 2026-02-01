import { HttpApiBuilder, HttpApiSwagger, HttpServer } from "@effect/platform";
import { Layer } from "effect";
import { AppApiLive } from "@plaxe/api/app-api-live";

// Create web handler from the Effect HttpApi
// OpenAPI: Swagger UI at /api/docs, OpenAPI JSON at /api/openapi.json
const { handler, dispose } = HttpApiBuilder.toWebHandler(
    Layer.mergeAll(
        HttpApiSwagger.layer({ path: "/api/docs" }),
        HttpApiBuilder.middlewareOpenApi({ path: "/api/openapi.json" }),
    ).pipe(Layer.provideMerge(AppApiLive), Layer.provideMerge(HttpServer.layerContext)),
);

// Store dispose in global so HMR can access the OLD handler's dispose
declare global {
    var __apiDispose: (() => Promise<void>) | undefined;
}

globalThis.__apiDispose = dispose;

// Vite HMR support - clean up resources when module is hot-reloaded
if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        const oldDispose = globalThis.__apiDispose;
        if (oldDispose) {
            oldDispose().catch(() => {});
        }
    });
}

export { handler, dispose };
