# Remote access via Cloudflare Tunnel + Access

> **DONE 2026-06-27** — live at **https://md.example.com** behind Cloudflare Access.
>
> - DNS: `md.example.com` CNAME → Cloudflare tunnel (`cloudflared tunnel route dns`, cert.pem).
> - Ingress: `md.example.com → http://localhost:5179` added to the token-managed Cloudflare tunnel
>   via the CF API using the existing wrangler OAuth token (`connectivity:admin`) —
>   see `~/dev/scripts/markito-cf-ingress.py`.
> - Access: self-hosted app for `md.example.com`, policy cloned from `dash.example.com` —
>   see `~/dev/scripts/markito-cf-access.py` (needs a 1-perm token: Access Apps:Edit).
> - Serving: service `markito` (`node bin/markito.js --port 5179`), autostart on.

Make a locally-running `markito` reachable remotely, secured the same way as d1dash / drover.

## Goal

- Expose the local server (port 5179) through a Cloudflare Tunnel to a hostname like `markito.example.com`.
- Gate it behind Cloudflare Access (single user — just the owner's identity), so no app-level auth is needed.

## Notes / steps (to flesh out when implementing)

- `cloudflared tunnel` → map `markito.example.com` → `http://localhost:5179`.
- Cloudflare Access policy: allow only the owner's email/identity.
- The app already binds `0.0.0.0` and the dev server allows `.example.ts.net` / `.example.com` hosts; verify the prod (adapter-node) server is fine behind the tunnel (it reads `HOST`/`PORT`).
- Keep "one user" assumption — Access is the only auth layer.
- Reference the existing d1dash tunnel + Access setup for the exact config.
