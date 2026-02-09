import { HttpClient, HttpClientRequest, HttpClientResponse } from "@effect/platform";
import type { HttpClientError } from "@effect/platform";
import { Context, Effect, Layer, Schema } from "effect";
import type { ParseError } from "effect/ParseResult";
import { PlexClientConfig } from "./config.js";
import { PlexApiError } from "./errors.js";
import type {
    PlexChildrenResponse,
    PlexFriends,
    PlexHistoryResponse,
    PlexHomeUsersResponse,
    PlexLeavesResponse,
    PlexLibraryItemsResponse,
    PlexLibrarySectionsResponse,
    PlexMetadataResponse,
    PlexPin,
    PlexResources,
    PlexUser,
} from "./schemas/index.js";
import * as Schemas from "./schemas/index.js";

// ----------------------------------------------------------------
// Service interface
// ----------------------------------------------------------------

export interface PlexClient {
    readonly createPin: Effect.Effect<typeof PlexPin.Type, PlexApiError>;
    readonly checkPin: (pinId: number) => Effect.Effect<typeof PlexPin.Type, PlexApiError>;
    readonly getUser: Effect.Effect<typeof PlexUser.Type, PlexApiError>;
    readonly getResources: Effect.Effect<typeof PlexResources.Type, PlexApiError>;
    readonly getFriends: Effect.Effect<typeof PlexFriends.Type, PlexApiError>;
    readonly getHomeUsers: Effect.Effect<typeof PlexHomeUsersResponse.Type, PlexApiError>;

    readonly getLibrarySections: Effect.Effect<
        typeof PlexLibrarySectionsResponse.Type,
        PlexApiError
    >;
    readonly getLibraryItems: (
        sectionId: string,
    ) => Effect.Effect<typeof PlexLibraryItemsResponse.Type, PlexApiError>;
    readonly getMetadata: (
        ratingKey: string,
    ) => Effect.Effect<typeof PlexMetadataResponse.Type, PlexApiError>;
    readonly getChildren: (
        ratingKey: string,
    ) => Effect.Effect<typeof PlexChildrenResponse.Type, PlexApiError>;
    readonly getAllLeaves: (
        ratingKey: string,
    ) => Effect.Effect<typeof PlexLeavesResponse.Type, PlexApiError>;
    readonly getHistory: (
        minDate?: number,
    ) => Effect.Effect<typeof PlexHistoryResponse.Type, PlexApiError>;
    readonly deleteItem: (ratingKey: string) => Effect.Effect<void, PlexApiError>;
}

export const PlexClient = Context.GenericTag<PlexClient>("PlexClient");

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

const PLEX_TV_BASE = "https://plex.tv";

const plexHeaders = (config: PlexClientConfig) => ({
    Accept: "application/json",
    "X-Plex-Token": config.plexToken,
    "X-Plex-Client-Identifier": config.clientIdentifier,
    "X-Plex-Product": config.product,
});

const wrapError =
    (method: string, path: string) => (cause: HttpClientError.HttpClientError | ParseError) =>
        new PlexApiError({ method, path, cause });

const requestPlexTv = <A, I>(
    method: "GET" | "POST" | "DELETE",
    path: string,
    schema: Schema.Schema<A, I>,
    config: PlexClientConfig,
    httpClient: HttpClient.HttpClient,
) =>
    Effect.gen(function* () {
        const url = `${PLEX_TV_BASE}${path}`;
        const request = (
            method === "POST"
                ? HttpClientRequest.post(url)
                : method === "DELETE"
                  ? HttpClientRequest.del(url)
                  : HttpClientRequest.get(url)
        ).pipe(HttpClientRequest.setHeaders(plexHeaders(config)));

        const response = yield* httpClient
            .execute(request)
            .pipe(Effect.mapError(wrapError(method, path)));

        if (response.status >= 400) {
            const body = yield* response.text.pipe(Effect.orElseSucceed(() => ""));
            return yield* new PlexApiError({ method, path, status: response.status, body });
        }

        return yield* HttpClientResponse.schemaBodyJson(schema)(response).pipe(
            Effect.mapError(wrapError(method, path)),
        );
    });

const requestServer = <A, I>(
    method: "GET" | "POST" | "DELETE",
    path: string,
    schema: Schema.Schema<A, I>,
    config: PlexClientConfig,
    httpClient: HttpClient.HttpClient,
) =>
    Effect.gen(function* () {
        const url = `${config.serverUrl}${path}`;
        const request = (
            method === "POST"
                ? HttpClientRequest.post(url)
                : method === "DELETE"
                  ? HttpClientRequest.del(url)
                  : HttpClientRequest.get(url)
        ).pipe(HttpClientRequest.setHeaders(plexHeaders(config)));

        const response = yield* httpClient
            .execute(request)
            .pipe(Effect.mapError(wrapError(method, path)));

        if (response.status >= 400) {
            const body = yield* response.text.pipe(Effect.orElseSucceed(() => ""));
            return yield* new PlexApiError({ method, path, status: response.status, body });
        }

        return yield* HttpClientResponse.schemaBodyJson(schema)(response).pipe(
            Effect.mapError(wrapError(method, path)),
        );
    });

const requestServerVoid = (
    method: "GET" | "POST" | "DELETE",
    path: string,
    config: PlexClientConfig,
    httpClient: HttpClient.HttpClient,
) =>
    Effect.gen(function* () {
        const url = `${config.serverUrl}${path}`;
        const request = (
            method === "DELETE" ? HttpClientRequest.del(url) : HttpClientRequest.get(url)
        ).pipe(HttpClientRequest.setHeaders(plexHeaders(config)));

        const response = yield* httpClient
            .execute(request)
            .pipe(Effect.mapError(wrapError(method, path)));

        if (response.status >= 400) {
            const body = yield* response.text.pipe(Effect.orElseSucceed(() => ""));
            return yield* new PlexApiError({ method, path, status: response.status, body });
        }
    });

// ----------------------------------------------------------------
// Live Layer
// ----------------------------------------------------------------

export const PlexClientLive = Layer.effect(
    PlexClient,
    Effect.gen(function* () {
        const config = yield* PlexClientConfig;
        const httpClient = yield* HttpClient.HttpClient;

        return {
            createPin: requestPlexTv(
                "POST",
                "/api/v2/pins?strong=true",
                Schemas.PlexPin,
                config,
                httpClient,
            ),

            checkPin: (pinId: number) =>
                requestPlexTv("GET", `/api/v2/pins/${pinId}`, Schemas.PlexPin, config, httpClient),

            getUser: requestPlexTv("GET", "/api/v2/user", Schemas.PlexUser, config, httpClient),

            getResources: requestPlexTv(
                "GET",
                "/api/v2/resources?includeHttps=1&includeRelay=1&includeIPv6=1",
                Schemas.PlexResources,
                config,
                httpClient,
            ),

            getFriends: requestPlexTv(
                "GET",
                "/api/v2/friends",
                Schemas.PlexFriends,
                config,
                httpClient,
            ),

            getHomeUsers: requestPlexTv(
                "GET",
                "/api/v2/home/users",
                Schemas.PlexHomeUsersResponse,
                config,
                httpClient,
            ),

            getLibrarySections: requestServer(
                "GET",
                "/library/sections",
                Schemas.PlexLibrarySectionsResponse,
                config,
                httpClient,
            ),

            getLibraryItems: (sectionId: string) =>
                requestServer(
                    "GET",
                    `/library/sections/${sectionId}/all`,
                    Schemas.PlexLibraryItemsResponse,
                    config,
                    httpClient,
                ),

            getMetadata: (ratingKey: string) =>
                requestServer(
                    "GET",
                    `/library/metadata/${ratingKey}`,
                    Schemas.PlexMetadataResponse,
                    config,
                    httpClient,
                ),

            getChildren: (ratingKey: string) =>
                requestServer(
                    "GET",
                    `/library/metadata/${ratingKey}/children`,
                    Schemas.PlexChildrenResponse,
                    config,
                    httpClient,
                ),

            getAllLeaves: (ratingKey: string) =>
                requestServer(
                    "GET",
                    `/library/metadata/${ratingKey}/allLeaves`,
                    Schemas.PlexLeavesResponse,
                    config,
                    httpClient,
                ),

            getHistory: (minDate?: number) => {
                const params = minDate != null ? `?mindate=${minDate}` : "";
                return requestServer(
                    "GET",
                    `/status/sessions/history/all${params}`,
                    Schemas.PlexHistoryResponse,
                    config,
                    httpClient,
                );
            },

            deleteItem: (ratingKey: string) =>
                requestServerVoid("DELETE", `/library/metadata/${ratingKey}`, config, httpClient),
        };
    }),
);
