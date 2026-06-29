# Workers: persist folder config in KV (follow-up)

> **DONE 2026-06-29** (PR #3). `configStore(platform)` uses KV (`CONFIG` binding)
> on Workers, fs file on node — folders are now editable in the UI on md2.example.com.
> Backend per deployment surfaced via `/api/status`; the read-only 405 guard and
> the `MARKITO_CONFIG_JSON` seed are gone.


The R2 backend works on both the node build (fs config file) and the Workers build.
But Workers have **no local filesystem**, so on the Cloudflare build folder config is
currently **read-only**, seeded from the `MARKITO_CONFIG_JSON` env/secret. Adding or
removing folders from the UI won't persist on Workers yet.

## To do

- Add a KV namespace binding (e.g. `CONFIG`) in `wrangler.jsonc`.
- Abstract config storage: `read()`/`write()` → fs file (node) vs KV (Workers).
- On Workers, `addFsFolder` should be rejected (no local fs); only R2 folders make sense.
- Migrate the `MARKITO_CONFIG_JSON` seed path to "seed KV on first boot if empty".

Until then: on Workers, set `MARKITO_CONFIG_JSON` to a `{"folders":[…]}` blob to define
R2 folders, or run the node build (md.example.com) for full add/remove.
