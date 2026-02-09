import { Schema } from "effect";

// ----------------------------------------------------------------
// POST /api/v2/pins — Create PIN for OAuth
// GET /api/v2/pins/{id} — Check/claim PIN
// ----------------------------------------------------------------

export class PlexPin extends Schema.Class<PlexPin>("PlexPin")({
    id: Schema.Number,
    code: Schema.String,
    authToken: Schema.NullOr(Schema.String),
    expiresAt: Schema.String,
    clientIdentifier: Schema.String,
}) {}

// ----------------------------------------------------------------
// GET /api/v2/user — Current user info
// ----------------------------------------------------------------

export class PlexUser extends Schema.Class<PlexUser>("PlexUser")({
    id: Schema.Number,
    uuid: Schema.String,
    username: Schema.String,
    email: Schema.String,
    thumb: Schema.String,
    title: Schema.String,
    authToken: Schema.String,
}) {}

// ----------------------------------------------------------------
// GET /api/v2/resources — Discover servers
// ----------------------------------------------------------------

export class PlexResourceConnection extends Schema.Class<PlexResourceConnection>(
    "PlexResourceConnection",
)({
    protocol: Schema.String,
    address: Schema.String,
    port: Schema.Number,
    uri: Schema.String,
    local: Schema.Boolean,
    relay: Schema.Boolean,
}) {}

export class PlexResource extends Schema.Class<PlexResource>("PlexResource")({
    name: Schema.String,
    provides: Schema.String,
    clientIdentifier: Schema.String,
    accessToken: Schema.NullOr(Schema.String),
    connections: Schema.Array(PlexResourceConnection),
}) {}

export const PlexResources = Schema.Array(PlexResource);

// ----------------------------------------------------------------
// GET /api/v2/friends — Friends list
// ----------------------------------------------------------------

export class PlexFriend extends Schema.Class<PlexFriend>("PlexFriend")({
    id: Schema.Number,
    uuid: Schema.String,
    title: Schema.String,
    username: Schema.String,
    thumb: Schema.String,
    status: Schema.String,
}) {}

export const PlexFriends = Schema.Array(PlexFriend);

// ----------------------------------------------------------------
// GET /api/v2/home/users — Home (managed) users
// ----------------------------------------------------------------

export class PlexHomeUser extends Schema.Class<PlexHomeUser>("PlexHomeUser")({
    id: Schema.Number,
    uuid: Schema.String,
    title: Schema.String,
    username: Schema.String,
    thumb: Schema.String,
    admin: Schema.Boolean,
    restricted: Schema.Boolean,
}) {}

export class PlexHomeUsersResponse extends Schema.Class<PlexHomeUsersResponse>(
    "PlexHomeUsersResponse",
)({
    users: Schema.Array(PlexHomeUser),
}) {}
