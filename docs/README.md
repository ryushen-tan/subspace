# Docs

- **pocketbase-schema.md** — PocketBase collections: `users` (tier), `projects` (user project library). How to create them and set API rules.
- **websocket-and-project-implementation.md** — How the WebSocket and project-by-ID flow work: when we connect/disconnect, `resetProject({ disconnect: false })` for "new project", hydrate for load, disconnect on Su3 unmount. Use this when aligning another branch.
- For WebSocket connection failures (e.g. code 1006), see the "Code 1006" / proxy section in **websocket-and-project-implementation.md** and ensure your reverse proxy forwards WebSocket upgrades for `/agent/ws`.
