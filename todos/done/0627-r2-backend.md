# Cloudflare R2 as a text-file backend

After the local MVP + Cloudflare Tunnel/Access work, add R2 as an alternative storage backend so files can live in object storage instead of (or alongside) the local filesystem.

> Do not implement yet — capture the idea only.

## Goal

- A "folder" can be backed by an R2 bucket (or a prefix within one) instead of a local directory.
- Same UI: tree listing, read, edit/autosave — but operations hit R2 instead of `fs`.

## Open questions (decide at implementation time)

- Abstraction: introduce a storage interface (`list / read / write`) with `fs` and `r2` implementations, keyed per-folder by a `backend` field in config.
- Listing: R2 has no real directories — derive the tree from object keys / `delimiter` listing.
- Config shape: extend `Folder` with `{ backend: "fs" | "r2", bucket?, prefix? }`.
- Credentials: R2 access via S3 API or Workers binding? If the app moves to a Cloudflare Worker, a binding is cleanest; if it stays adapter-node, use the S3-compatible API with keys from env.
- Conflict/versioning: object storage has no locks — decide last-write-wins (matches current local behavior) vs. ETag checks.
