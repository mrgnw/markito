# Changelog

## Unreleased

### Performance

- Server-render the folder tree and the selected file, so the first paint shows content without client fetches. (#6)
- Walk filesystem folders concurrently, bounded to 32 levels and 20,000 entries. (#5)
- Switching files saves the previous file and fetches the next one at the same time. (#6)
- Prefetch a file's content on hover, with a small in-memory cache. (#7)

### UX

- The editor opens in preview-inline mode: markers hidden, shown back in the construct at the caret, always editable.

- The open file lives in the URL as `?f=`, so reloads and deep links keep it open. (#6)
- The tree row and filename update the moment a file is clicked. (#6)
- The editor gains focus when a file opens. (#6)
- A skeleton shows while the editor code loads. (#7)
- Fade and slide transitions on status glyphs, the mobile overlay, the add-folder form and tree collapse. Disabled under `prefers-reduced-motion`. (#7)
- Collapsing a parent folder no longer forgets which children were collapsed. (#7)

- `GET /version` reports the package version, git commit and build time of the running server. (#9)

### Fixes

- Filenames containing `#`, `%` or `?` now open and save. (#6)
- Leaving the page with unsaved edits asks for confirmation. (#6)
- Autosave could write the previous file's text under the newly opened file's name. (#6)
- Removed the `/api/status` endpoint; the backend kind comes from the page load. (#6)
