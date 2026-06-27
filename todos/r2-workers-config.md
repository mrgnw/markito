# Workers: persist folder config in KV (follow-up)

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
