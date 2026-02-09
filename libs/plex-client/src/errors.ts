import { HttpApiSchema } from "@effect/platform";
import { Schema } from "effect";

export class PlexApiError extends Schema.TaggedError<PlexApiError>()(
    "PlexApiError",
    {
        method: Schema.String,
        path: Schema.String,
        status: Schema.optional(Schema.Number),
        body: Schema.optional(Schema.Unknown),
        cause: Schema.optional(Schema.Unknown),
    },
    HttpApiSchema.annotations({ status: 502 }),
) {
    get message(): string {
        const status = this.status ? ` (${this.status})` : "";
        return `PlexApiError: ${this.method} ${this.path}${status}`;
    }
}
