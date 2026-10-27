# Local verification checklist (CP0–CP13)

```bash
git pull
npm install --registry https://registry.npmjs.org
npm run dev
# npm run tauri:dev
```

## Smoke

1. Graph boots; status WEB/TAURI
2. +Agent / Undo works (no DataCloneError)
3. Run demo → events + live + sessions chip
4. Attach: exclusive on/off; auto-map
5. Sessions bar: click chip, × stops one session
6. Files / Projects / Shell / Harness
7. Tauri: stream_command + kill on Stop
