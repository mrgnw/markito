# markito

Edit your local markdown files in the browser. Run it locally, point it at one or more folders, edit with a clean WYSIWYG editor ([Aragonite](https://github.com/voithos-labs/aragonite), autosaves to disk). Saving writes back the file as it was plus your edits; formatting you did not touch is left alone.

> [!NOTE]
> This project was built with heavy LLM assistance and should be considered proof-of-concept. Contributions are welcome, but I can't guarantee the accuracy of the code or that I will continue to maintain it. If there are any mistakes in attribution or anything else, please let me know.

## Usage

```sh
# run it, then add folders from the web UI
npx markito

# or seed it with folders up front (repeatable)
npx markito --folder ~/notes --folder ~/dev/docs
```

Open http://localhost:5179. Click **+** in the sidebar to add a folder (paste an absolute path); hover a folder to remove it. Folders persist to config, so next run they're still there.

## Options

```
-f, --folder <path>   Add a folder to edit (repeatable). Persisted to config.
-p, --port <port>     Port to listen on (default 5179)
-c, --config <path>   Config file (default ~/.config/markito/config.json)
-h, --help            Show help
```

## Config

`~/.config/markito/config.json` (respects `$XDG_CONFIG_HOME`), auto-created on first folder add:

```json
{
  "folders": [
    { "id": "notes", "name": "notes", "path": "~/notes" }
  ]
}
```

Only `.md` files are shown and editable. Each file is addressed as `{folderId}/{relative/path}`; reads and writes are guarded against escaping a folder's root.

## Storage backends

A folder is backed by either the local filesystem (`fs`) or the bound Cloudflare R2 bucket (`r2`):

```json
{ "folders": [
  { "id": "notes",   "backend": "fs", "path": "~/notes" },
  { "id": "journal", "backend": "r2", "prefix": "journal/" }
] }
```

R2 uses a single **bound bucket** (`env.BUCKET`) — **no credentials**. An R2 "folder" is just
a key prefix within that bucket; in the **+ Add folder** dialog, toggle **R2** and enter a prefix.
R2 is **Workers-only** (the binding doesn't exist on the local node build); on the node deploy the
R2 tab is disabled.

## Deploy targets

Two builds from one codebase (conditional adapter in `svelte.config.js`):

```sh
npm run build            # adapter-node  — local fs folders (the md.example.com service)
npm run build:cf         # adapter-cloudflare — Workers (R2 folders)
pnpm ship           # build:cf + wrangler deploy
```

Workers setup — create the bucket once (binding name `BUCKET` is set in `wrangler.jsonc`):

```sh
wrangler r2 bucket create markito
```

Folder config on Workers is currently read-only via `MARKITO_CONFIG_JSON` — see
[todos/r2-workers-config.md](todos/r2-workers-config.md).

## Develop

```sh
pnpm install
pnpm dev          # http://localhost:5179
pnpm build        # production build → build/
node build        # run the production server
uv run scripts/check-roundtrip.py  # saved bytes = original + typed text (needs a build)
```

## Roadmap

Live behind Cloudflare Access at `md.example.com` (see [todos/done/](todos/done/)). R2 backend + Workers deploy landed; remaining: [Workers config persistence in KV](todos/r2-workers-config.md).

## License

[MIT](LICENSE)
