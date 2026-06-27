# Remote access via Cloudflare Tunnel + Access

Make a locally-running `edith` reachable remotely, secured the same way as d1dash / drover.

## Goal

- Expose the local server (port 5179) through a Cloudflare Tunnel to a hostname like `edith.example.com`.
- Gate it behind Cloudflare Access (single user — just the owner's identity), so no app-level auth is needed.

## Notes / steps (to flesh out when implementing)

- `cloudflared tunnel` → map `edith.example.com` → `http://localhost:5179`.
- Cloudflare Access policy: allow only the owner's email/identity.
- The app already binds `0.0.0.0` and the dev server allows `.example.ts.net` / `.example.com` hosts; verify the prod (adapter-node) server is fine behind the tunnel (it reads `HOST`/`PORT`).
- Keep "one user" assumption — Access is the only auth layer.
- Reference the existing d1dash tunnel + Access setup for the exact config.
