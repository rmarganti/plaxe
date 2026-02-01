import { Config } from "effect";

export const AppConfig = Config.all({
    version: Config.nonEmptyString().pipe(Config.withDefault("unknown")),
});

export type AppConfig = Config.Config.Success<typeof AppConfig>;
