import { Schema } from "effect";

// ----------------------------------------------------------------
// GET /library/sections — Library sections
// ----------------------------------------------------------------

export class PlexLibrarySection extends Schema.Class<PlexLibrarySection>("PlexLibrarySection")({
    key: Schema.String,
    title: Schema.String,
    type: Schema.String,
    agent: Schema.String,
    scanner: Schema.String,
    uuid: Schema.String,
}) {}

export class PlexLibrarySectionsResponse extends Schema.Class<PlexLibrarySectionsResponse>(
    "PlexLibrarySectionsResponse",
)({
    MediaContainer: Schema.Struct({
        size: Schema.Number,
        Directory: Schema.optionalWith(Schema.Array(PlexLibrarySection), { default: () => [] }),
    }),
}) {}

// ----------------------------------------------------------------
// GET /library/sections/{id}/all — All items in a library
// ----------------------------------------------------------------

export class PlexMediaItem extends Schema.Class<PlexMediaItem>("PlexMediaItem")({
    ratingKey: Schema.String,
    key: Schema.String,
    type: Schema.String,
    title: Schema.String,
    thumb: Schema.optionalWith(Schema.String, { default: () => "" }),
    summary: Schema.optionalWith(Schema.String, { default: () => "" }),
    year: Schema.optionalWith(Schema.Number, { as: "Option" }),
    viewCount: Schema.optionalWith(Schema.Number, { as: "Option" }),
    leafCount: Schema.optionalWith(Schema.Number, { as: "Option" }),
    viewedLeafCount: Schema.optionalWith(Schema.Number, { as: "Option" }),
    addedAt: Schema.Number,
    updatedAt: Schema.optionalWith(Schema.Number, { as: "Option" }),
    librarySectionID: Schema.optionalWith(Schema.Number, { as: "Option" }),
}) {}

export class PlexLibraryItemsResponse extends Schema.Class<PlexLibraryItemsResponse>(
    "PlexLibraryItemsResponse",
)({
    MediaContainer: Schema.Struct({
        size: Schema.Number,
        librarySectionID: Schema.optionalWith(Schema.Number, { as: "Option" }),
        Metadata: Schema.optionalWith(Schema.Array(PlexMediaItem), { default: () => [] }),
    }),
}) {}

// ----------------------------------------------------------------
// GET /library/metadata/{id} — Single metadata item
// ----------------------------------------------------------------

export class PlexMetadataResponse extends Schema.Class<PlexMetadataResponse>(
    "PlexMetadataResponse",
)({
    MediaContainer: Schema.Struct({
        size: Schema.Number,
        Metadata: Schema.optionalWith(Schema.Array(PlexMediaItem), { default: () => [] }),
    }),
}) {}

// ----------------------------------------------------------------
// GET /library/metadata/{id}/children — Children (seasons)
// ----------------------------------------------------------------

export class PlexChildItem extends Schema.Class<PlexChildItem>("PlexChildItem")({
    ratingKey: Schema.String,
    key: Schema.String,
    type: Schema.String,
    title: Schema.String,
    index: Schema.optionalWith(Schema.Number, { as: "Option" }),
    thumb: Schema.optionalWith(Schema.String, { default: () => "" }),
    leafCount: Schema.optionalWith(Schema.Number, { as: "Option" }),
    viewedLeafCount: Schema.optionalWith(Schema.Number, { as: "Option" }),
    addedAt: Schema.Number,
}) {}

export class PlexChildrenResponse extends Schema.Class<PlexChildrenResponse>(
    "PlexChildrenResponse",
)({
    MediaContainer: Schema.Struct({
        size: Schema.Number,
        Metadata: Schema.optionalWith(Schema.Array(PlexChildItem), { default: () => [] }),
    }),
}) {}

// ----------------------------------------------------------------
// GET /library/metadata/{id}/allLeaves — All episodes of a show
// ----------------------------------------------------------------

export class PlexLeafItem extends Schema.Class<PlexLeafItem>("PlexLeafItem")({
    ratingKey: Schema.String,
    key: Schema.String,
    type: Schema.String,
    title: Schema.String,
    grandparentRatingKey: Schema.optionalWith(Schema.String, { as: "Option" }),
    grandparentTitle: Schema.optionalWith(Schema.String, { as: "Option" }),
    parentRatingKey: Schema.optionalWith(Schema.String, { as: "Option" }),
    parentIndex: Schema.optionalWith(Schema.Number, { as: "Option" }),
    index: Schema.optionalWith(Schema.Number, { as: "Option" }),
    thumb: Schema.optionalWith(Schema.String, { default: () => "" }),
    viewCount: Schema.optionalWith(Schema.Number, { as: "Option" }),
    addedAt: Schema.Number,
}) {}

export class PlexLeavesResponse extends Schema.Class<PlexLeavesResponse>("PlexLeavesResponse")({
    MediaContainer: Schema.Struct({
        size: Schema.Number,
        Metadata: Schema.optionalWith(Schema.Array(PlexLeafItem), { default: () => [] }),
    }),
}) {}

// ----------------------------------------------------------------
// GET /status/sessions/history/all — Playback history
// ----------------------------------------------------------------

export class PlexHistoryItem extends Schema.Class<PlexHistoryItem>("PlexHistoryItem")({
    ratingKey: Schema.String,
    key: Schema.String,
    type: Schema.String,
    title: Schema.String,
    parentRatingKey: Schema.optionalWith(Schema.String, { as: "Option" }),
    grandparentRatingKey: Schema.optionalWith(Schema.String, { as: "Option" }),
    accountID: Schema.Number,
    viewedAt: Schema.Number,
}) {}

export class PlexHistoryResponse extends Schema.Class<PlexHistoryResponse>("PlexHistoryResponse")({
    MediaContainer: Schema.Struct({
        size: Schema.Number,
        Metadata: Schema.optionalWith(Schema.Array(PlexHistoryItem), { default: () => [] }),
    }),
}) {}
