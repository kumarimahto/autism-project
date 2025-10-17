Frontend (Vite)

If you hit the ENOSPC watcher error (system limit for file watchers), either increase inotify watchers on Linux or run the dev server with polling.

Run normally:

```bash
npm install
npm run dev
```

Run with polling (no sudo required):

```bash
npm install
npm run dev:poll
```
