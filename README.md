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

## Develop

```sh
pnpm install
pnpm dev          # http://localhost:5179
pnpm build        # production build → build/
node build        # run the production server
```

## Roadmap

Live behind Cloudflare Access at `md.example.com` (see [todos/done/](todos/done/)). Next: an R2 text-file backend ([todos/r2-backend.md](todos/r2-backend.md)).

## License

[MIT](LICENSE)
