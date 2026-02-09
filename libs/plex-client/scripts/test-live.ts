import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { FetchHttpClient } from "@effect/platform";
import { Effect, Layer, Option } from "effect";
import { PlexClient, PlexClientLive, PlexClientConfig } from "../src/index.js";

const envPath = resolve(import.meta.dirname!, ".env");
try {
    const envContent = readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        if (!(key in process.env) || !process.env[key]) {
            process.env[key] = value;
        }
    }
} catch {
    // .env file is optional if env vars are set directly
}

const PLEX_TOKEN = process.env["PLEX_TOKEN"];
const PLEX_SERVER_URL = process.env["PLEX_SERVER_URL"];
const PLEX_CLIENT_IDENTIFIER = process.env["PLEX_CLIENT_IDENTIFIER"] ?? "plaxe-test-script";

if (!PLEX_TOKEN || !PLEX_SERVER_URL) {
    console.error("Missing required env vars: PLEX_TOKEN, PLEX_SERVER_URL");
    console.error("Create .local/.env with your values (see .local/.env.example).");
    process.exit(1);
}

const ConfigLayer = Layer.succeed(PlexClientConfig, {
    plexToken: PLEX_TOKEN,
    serverUrl: PLEX_SERVER_URL,
    clientIdentifier: PLEX_CLIENT_IDENTIFIER,
    product: "Plaxe Test Script",
});

const MainLayer = PlexClientLive.pipe(
    Layer.provide(ConfigLayer),
    Layer.provide(FetchHttpClient.layer),
);

const formatOption = (opt: Option.Option<unknown>) => (Option.isSome(opt) ? opt.value : "(none)");

const program = Effect.gen(function* () {
    const plex = yield* PlexClient;

    // --- plex.tv endpoints (read-only) ---

    console.log("\n=== getUser ===");
    const user = yield* plex.getUser;
    console.log(`  id: ${user.id}`);
    console.log(`  username: ${user.username}`);
    console.log(`  email: ${user.email}`);

    console.log("\n=== getResources ===");
    const resources = yield* plex.getResources;
    for (const r of resources) {
        console.log(`  ${r.name} (provides: ${r.provides})`);
        for (const c of r.connections) {
            console.log(`    ${c.uri} (local: ${c.local}, relay: ${c.relay})`);
        }
    }

    console.log("\n=== getFriends ===");
    const friends = yield* plex.getFriends;
    console.log(`  count: ${friends.length}`);
    for (const f of friends.slice(0, 5)) {
        console.log(`  - ${f.title} (${f.username})`);
    }

    console.log("\n=== getHomeUsers ===");
    const homeUsers = yield* plex.getHomeUsers;
    console.log(`  count: ${homeUsers.users.length}`);
    for (const u of homeUsers.users) {
        console.log(`  - ${u.title} (admin: ${u.admin}, restricted: ${u.restricted})`);
    }

    // --- Local server endpoints (read-only) ---

    console.log("\n=== getLibrarySections ===");
    const sections = yield* plex.getLibrarySections;
    console.log(`  count: ${sections.MediaContainer.size}`);
    for (const s of sections.MediaContainer.Directory) {
        console.log(`  - [${s.key}] ${s.title} (type: ${s.type})`);
    }

    const firstSection = sections.MediaContainer.Directory[0];
    if (firstSection) {
        console.log(`\n=== getLibraryItems (section "${firstSection.title}") ===`);
        const items = yield* plex.getLibraryItems(firstSection.key);
        console.log(`  count: ${items.MediaContainer.size}`);
        for (const item of items.MediaContainer.Metadata.slice(0, 5)) {
            console.log(
                `  - [${item.ratingKey}] ${item.title} (type: ${item.type}, year: ${formatOption(item.year)})`,
            );
        }

        const firstItem = items.MediaContainer.Metadata[0];
        if (firstItem) {
            console.log(`\n=== getMetadata (ratingKey ${firstItem.ratingKey}) ===`);
            const meta = yield* plex.getMetadata(firstItem.ratingKey);
            const m = meta.MediaContainer.Metadata[0];
            if (m) {
                console.log(`  title: ${m.title}`);
                console.log(`  type: ${m.type}`);
                console.log(`  summary: ${m.summary.slice(0, 100)}...`);
            }

            if (firstItem.type === "show") {
                console.log(`\n=== getChildren (seasons for "${firstItem.title}") ===`);
                const children = yield* plex.getChildren(firstItem.ratingKey);
                console.log(`  count: ${children.MediaContainer.size}`);
                for (const child of children.MediaContainer.Metadata.slice(0, 5)) {
                    console.log(`  - [${child.ratingKey}] ${child.title} (type: ${child.type})`);
                }

                console.log(`\n=== getAllLeaves (episodes for "${firstItem.title}") ===`);
                const leaves = yield* plex.getAllLeaves(firstItem.ratingKey);
                console.log(`  count: ${leaves.MediaContainer.size}`);
                for (const leaf of leaves.MediaContainer.Metadata.slice(0, 5)) {
                    console.log(
                        `  - [${leaf.ratingKey}] ${leaf.title} (viewCount: ${formatOption(leaf.viewCount)})`,
                    );
                }
            }
        }
    }

    console.log("\n=== getHistory ===");
    const history = yield* plex.getHistory();
    console.log(`  count: ${history.MediaContainer.size}`);
    for (const h of history.MediaContainer.Metadata.slice(0, 5)) {
        console.log(
            `  - [${formatOption(h.ratingKey)}] ${formatOption(h.title)} (accountID: ${h.accountID}, viewedAt: ${new Date(h.viewedAt * 1000).toISOString()})`,
        );
    }

    // NOTE: deleteItem is intentionally NOT tested to avoid mutating the server.
    // NOTE: createPin/checkPin are not tested as they create transient resources on plex.tv.

    console.log("\n✅ All read-only methods succeeded.");
});

Effect.runPromise(program.pipe(Effect.provide(MainLayer))).catch((err) => {
    console.error("\n❌ Test failed:", err);
    process.exit(1);
});
