import { Config, Context, Effect, Layer } from "effect";

export interface PlexClientConfig {
    readonly plexToken: string;
    readonly serverUrl: string;
    readonly clientIdentifier: string;
    readonly product: string;
}

export const PlexClientConfig = Context.GenericTag<PlexClientConfig>("PlexClientConfig");

export const PlexClientConfigFromEnv = Layer.effect(
    PlexClientConfig,
    Effect.gen(function* () {
        const config = yield* Config.all({
            plexToken: Config.nonEmptyString("PLEX_TOKEN"),
            serverUrl: Config.nonEmptyString("PLEX_SERVER_URL"),
            clientIdentifier: Config.nonEmptyString("PLEX_CLIENT_IDENTIFIER"),
            product: Config.nonEmptyString("PLEX_PRODUCT").pipe(Config.withDefault("Plaxe")),
        });

        return {
            plexToken: config.plexToken,
            serverUrl: config.serverUrl,
            clientIdentifier: config.clientIdentifier,
            product: config.product,
        };
    }),
);
