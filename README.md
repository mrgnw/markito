# markito

Edit your local markdown files in the browser. Run it locally, point it at one or more folders, edit with a clean WYSIWYG editor (autosaves to disk).

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

A folder is backed by either the local filesystem (`fs`) or a Cloudflare R2 bucket (`r2`):

```json
{ "folders": [
  { "id": "notes",   "backend": "fs", "path": "~/notes" },
  { "id": "journal", "backend": "r2", "bucket": "my-bucket", "prefix": "journal/" }
] }
```

R2 uses the **S3 API** (so the UI can list and pick any bucket), via these credentials —
env vars locally, Worker secrets on Cloudflare:

```sh
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
```

In the **+ Add folder** dialog, toggle **R2**, pick a bucket, and (optionally) set a key prefix.

## Deploy targets

Two builds from one codebase (conditional adapter in `svelte.config.js`):

```sh
npm run build            # adapter-node  — local fs folders (the md.example.com service)
npm run build:cf         # adapter-cloudflare — Workers (R2 folders)
npm run deploy           # build:cf + wrangler deploy
```

On Workers, set the R2 creds as secrets (`wrangler secret put R2_ACCOUNT_ID`, etc.).
Folder config on Workers is currently read-only via `MARKITO_CONFIG_JSON` — see
[todos/r2-workers-config.md](todos/r2-workers-config.md).

## Develop

```sh
pnpm install
pnpm dev          # http://localhost:5179
pnpm build        # production build → build/
node build        # run the production server
```

## Roadmap

Live behind Cloudflare Access at `md.example.com` (see [todos/done/](todos/done/)). R2 backend + Workers deploy landed; remaining: [Workers config persistence in KV](todos/r2-workers-config.md).

## License

[MIT](LICENSE)
