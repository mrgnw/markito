# markito

Edit local markdown files in your browser.

markito is a small web app that serves the markdown files in folders you choose and lets you edit them in a WYSIWYG editor ([Aragonite](https://github.com/voithos-labs/aragonite)) with autosave. Saving writes back the file as it was plus your edits; formatting you did not touch is left alone, so diffs stay small.

> [!NOTE]
> This project was built with heavy LLM assistance and should be considered proof-of-concept. Contributions are welcome, but I can't guarantee the accuracy of the code or that I will continue to maintain it. If there are any mistakes in attribution or anything else, please let me know.

## Who it's for

People who keep notes, docs or journals as plain markdown files (an Obsidian-style folder, a repo's `docs/`) and want a clean editor in the browser without importing them into an app or changing the files on disk. It also runs on Cloudflare Workers, storing files in an R2 bucket, for editing the same notes from anywhere.

## Built with

- [SvelteKit](https://svelte.dev/docs/kit) and Svelte 5
- [Aragonite](https://github.com/voithos-labs/aragonite) editor
- Node (`@sveltejs/adapter-node`) for local folders, Cloudflare Workers with R2 and KV (`@sveltejs/adapter-cloudflare`) for the hosted build
- [Bun](https://bun.sh) for installing and scripts

## Run it

Requires [Bun](https://bun.sh) and Node 20 or newer. markito is not on npm yet ([roadmap](ROADMAP.md)), so run it from a clone.

```sh
git clone https://github.com/mrgnw/markito.git
cd markito
bun install
bun run build
node bin/markito.js --folder ~/notes
```

`bun run start` runs the same `bin/markito.js`. Open http://localhost:5179. The server listens on `127.0.0.1` only unless you set `HOST` (see below). Click **+** in the sidebar to add more folders (paste an absolute path); hover a folder to remove it. Folders persist in the config file, so the next run still has them.

To seed several folders at once, repeat the flag:

```sh
node bin/markito.js --folder ~/notes --folder ~/docs
```

### Options

```
-f, --folder <path>   Add a folder to edit (repeatable). Persisted to config.
-p, --port <port>     Port to listen on (default 5179)
-c, --config <path>   Config file (default ~/.config/markito/config.json)
-h, --help            Show help
```

### Exposing it on a network

markito has no login. Anyone who can reach the port can read and write the folders you added, and browse your disk from the add-folder dialog. Keep the default `127.0.0.1`, or put it behind something that authenticates (Cloudflare Access, a VPN). To listen on all interfaces:

```sh
HOST=0.0.0.0 node bin/markito.js --folder ~/notes
```

In `bun run dev`, extra hostnames must be allowed explicitly:

```sh
MARKITO_ALLOWED_HOSTS=localhost,notes.example.ts.net HOST=0.0.0.0 bun run dev
```

## Config

`~/.config/markito/config.json` (respects `$XDG_CONFIG_HOME`, or `MARKITO_CONFIG`), created when the first folder is added:

```json
{
  "folders": [
    { "id": "notes", "name": "notes", "path": "~/notes" }
  ]
}
```

Only `.md` files are shown and editable. Each file is addressed as `{folderId}/{relative/path}`; reads and writes are guarded against escaping a folder's root.

| Variable | Default | Purpose |
|-|-|-|
| `HOST` | `127.0.0.1` | Address to listen on |
| `PORT` | `5179` | Port to listen on |
| `MARKITO_CONFIG` | `~/.config/markito/config.json` | Config file |
| `MARKITO_FOLDERS` | none | Newline-separated folders to seed (set by `--folder`) |
| `MARKITO_ALLOWED_HOSTS` | `localhost` | Extra hostnames for `bun run dev` |

## Storage backends

A folder is backed by either the local filesystem (`fs`) or the bound Cloudflare R2 bucket (`r2`):

```json
{ "folders": [
  { "id": "notes",   "backend": "fs", "path": "~/notes" },
  { "id": "journal", "backend": "r2", "prefix": "journal/" }
] }
```

R2 uses a single bucket bound as `BUCKET`, with no credentials. An R2 "folder" is a key prefix in that bucket. R2 is Workers-only; the node build disables it.

## Deploy to Cloudflare Workers

The Workers build keeps folder config in a KV namespace (`CONFIG`, created on first deploy) and files in an R2 bucket named `markito`. Put it behind [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/) before storing anything private.

```sh
bunx wrangler r2 bucket create markito
bun run ship
```

## Develop

```sh
bun install
bun run dev
bun run check
bun run test
```

`bun run dev` serves http://localhost:5179. `bun run test` runs unit tests, then builds and runs a browser check that saving keeps the file's bytes; it needs [uv](https://docs.astral.sh/uv/) and Playwright's Chromium (`uvx playwright install chromium`).

## Roadmap

See [ROADMAP.md](ROADMAP.md) and the [open issues](https://github.com/mrgnw/markito/issues). Recent changes are in [CHANGELOG.md](CHANGELOG.md).

## License

This project is licensed under [MIT](LICENSE).

Notable dependencies with their own licenses:

- [Aragonite](https://github.com/voithos-labs/aragonite) - MPL-2.0 (the editor)
- [Fontsource](https://fontsource.org) Lora and Martian Mono - OFL-1.1 (fonts)
