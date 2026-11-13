# markito

Browse a folder of markdown files and edit them in your browser, with autosave back to the originals.

[![CI](https://img.shields.io/github/actions/workflow/status/mrgnw/markito/ci.yml?branch=main&style=flat&label=CI)](https://github.com/mrgnw/markito/actions/workflows/ci.yml)
[![MIT license](https://img.shields.io/github/license/mrgnw/markito?style=flat)](LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/mrgnw/markito?style=flat)](https://github.com/mrgnw/markito/commits/main/)
[![Open issues](https://img.shields.io/github/issues/mrgnw/markito?style=flat)](https://github.com/mrgnw/markito/issues)
[![Svelte 5](https://img.shields.io/badge/Svelte-5-ff3e00?style=flat&logo=svelte&logoColor=white)](https://svelte.dev)
[![SvelteKit 2](https://img.shields.io/badge/SvelteKit-2-ff3e00?style=flat&logo=svelte&logoColor=white)](https://svelte.dev/docs/kit)
[![Bun](https://img.shields.io/badge/Bun-scripts-14151a?style=flat&logo=bun&logoColor=white)](https://bun.sh)

> [!NOTE]
> This project was built with heavy LLM assistance and should be considered proof-of-concept. Known save and access limits are listed under [Safety](#safety). Contributions are welcome. If there are any mistakes in attribution or anything else, please let me know.

![Adding a demo Notes folder, opening Weekly-plan.md, editing a paragraph, and autosaving](docs/media/hero.gif)

*Real app, made-up notes: add a folder, choose a file, and write. No import step.*

## Who it's for

- People who keep notes or journals in a plain markdown folder and want a visual editor.
- Developers editing a repository's documentation without moving files into a separate database.
- People with an Obsidian-style folder who want another way to edit its existing `.md` files.

The local Node server reads and writes folders on your computer. The Cloudflare Workers build edits objects in an R2 bucket. They are separate storage modes; markito does not sync local folders to R2.

## 30-second quick start

Requires [Bun](https://bun.sh) and Node `^20.19.0` or `>=22.12.0`. **markito is not published on npm yet.** Run it from source; installation and build time depend on your machine and connection.

Set the clone location and create a disposable demo folder first:

```sh
MARKITO_SOURCE="$PWD/markito"
```

```sh
MARKITO_NOTES=$(mktemp -d "${TMPDIR:-/tmp}/markito-demo.XXXXXX")
```

```sh
git clone https://github.com/mrgnw/markito.git "$MARKITO_SOURCE"
```

```sh
cd "$MARKITO_SOURCE"
```

```sh
bun install --frozen-lockfile
```

```sh
bun run build
```

```sh
printf '# Welcome\n\nA little space to think.\n' > "$MARKITO_NOTES/Welcome.md"
```

```sh
node bin/markito.js --folder "$MARKITO_NOTES"
```

Open http://localhost:5179 and select **Welcome.md**. The server binds to `127.0.0.1` by default. Stop it with Ctrl+C.

To use your own notes, choose an existing folder before starting the server:

```sh
MARKITO_NOTES="$HOME/notes"
```

```sh
node bin/markito.js --folder "$MARKITO_NOTES"
```

Repeat the folder flag to seed more folders. In the sidebar, **+** opens the folder browser; click a folder to add it or its chevron to browse inside. Hover an added folder to remove it from the sidebar. Removing a folder does not delete its files. Folder choices persist across restarts.

## How saving works

1. The [Aragonite](https://github.com/voithos-labs/aragonite) visual editor preserves untouched markdown source, keeping diffs small.
2. Edits autosave two seconds after you stop typing.
3. Cmd/Ctrl+S saves immediately; switching files also triggers a save.
4. A local save writes to the original file; a hosted save replaces the R2 object.

## Safety

Use copies or version-controlled notes while evaluating this proof-of-concept. A failed save can still appear successful ([#1](https://github.com/mrgnw/markito/issues/1)). External changes are not detected before overwriting ([#2](https://github.com/mrgnw/markito/issues/2)), and local writes are not atomic ([#3](https://github.com/mrgnw/markito/issues/3)).

**Localhost is the default; network access is opt-in.** There is no built-in login. Anyone who can reach the server can read and write added folders, browse the server's disk through the folder picker, and add more folders. A VPN limits reachability but does not give individual users separate permissions.

Only expose it behind authentication such as Cloudflare Access. To opt in to listening on all network interfaces:

```sh
HOST=0.0.0.0 node bin/markito.js --folder "$MARKITO_NOTES"
```

The sidebar lists `.md` files. That filter is not an access rule; the file API does not enforce the extension. Paths are checked lexically against the folder root, but symlink targets are not confined ([#4](https://github.com/mrgnw/markito/issues/4)). This is not a filesystem sandbox.

Folder additions through the UI are capped at 64. Local tree traversal uses a depth limit of 32 and a shared 20,000-entry budget; these are best-effort traversal limits, not hard memory bounds. R2 listing stops after 100 pages of up to 1,000 objects. File reads load the full contents into memory. Use small, trusted folders.

## Configuration

Local folder choices live in `~/.config/markito/config.json`, created when the first folder is added. `XDG_CONFIG_HOME` changes the config directory; the config flag or `MARKITO_CONFIG` selects a specific file. Config paths are resolved as filesystem paths; use absolute paths in JSON rather than a literal `~`.

| CLI option | Default | Purpose |
|-|-|-|
| `-f`, `--folder` | none | Add an existing folder; repeatable and persisted |
| `-p`, `--port` | `PORT` or `5179` | Choose the listening port |
| `-c`, `--config` | `MARKITO_CONFIG` or standard location | Choose the config file |
| `-h`, `--help` | — | Show usage and exit |

| Variable | Default | Purpose |
|-|-|-|
| `HOST` | `127.0.0.1` | Listening address; changing it opts in to network exposure |
| `PORT` | `5179` | Listening port; the CLI port flag takes precedence |
| `MARKITO_CONFIG` | `~/.config/markito/config.json` | Config file; the CLI config flag takes precedence |
| `XDG_CONFIG_HOME` | `~/.config` | Base directory for the default config location |
| `MARKITO_FOLDERS` | none | Newline-separated local folders to seed; set by the CLI folder flags |
| `MARKITO_ALLOWED_HOSTS` | `localhost` | Comma-separated allowed hostnames for the Vite development server |

For development through a tailnet hostname, set the actual hostname explicitly alongside localhost. This changes the host allowlist, not authentication.

## Cloudflare Workers and R2

The Workers build uses one R2 bucket bound as `BUCKET` and a KV namespace bound as `CONFIG`. Folder choices live in KV, and each R2 folder is a key prefix. The Node build supports local folders only. See [wrangler.jsonc](wrangler.jsonc) for the bindings.

Put the hosted app behind [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/access-controls/) before storing private notes. Protect both pages and `/api/*` routes. No production deployment has been verified; CI currently checks the Node target.

With Wrangler authenticated to your Cloudflare account, create the bucket:

```sh
bunx wrangler r2 bucket create markito
```

Build and deploy the Workers target; Wrangler creates the configured KV namespace on first deploy:

```sh
bun run ship
```

## Built with

[Svelte 5](https://svelte.dev), [SvelteKit](https://svelte.dev/docs/kit), and [Aragonite](https://github.com/voithos-labs/aragonite). Bun installs dependencies and runs scripts. SvelteKit's Node and Cloudflare adapters provide the two server targets.

## Roadmap and contributing

See the [roadmap](ROADMAP.md) for safety work, file operations, search, and npm distribution. Recent changes are in the [changelog](CHANGELOG.md).

Bug reports, documentation fixes, and focused pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) for setup and checks, or pick a [good first issue](https://github.com/mrgnw/markito/issues?q=is%3Aissue%20is%3Aopen%20label%3A%22good%20first%20issue%22).

## License

This project is licensed under [MIT](LICENSE).

Notable dependencies with their own licenses:

- [Aragonite](https://github.com/voithos-labs/aragonite) — MPL-2.0 (the editor).
- [Fontsource](https://fontsource.org) Lora and Martian Mono — OFL-1.1 (fonts).
