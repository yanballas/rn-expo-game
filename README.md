# rn-expo-game

Expo (React Native) app. **Single root `package.json` and `package-lock.json`** for the whole repository: install and run commands always from the repo root.

## Layout

- **`client/`** — application source: `app/` (Expo Router), `assets/`, `components/`, `store/`, `storage/`, `scripts/`.
- **Repo root** — Expo config (`app.json`), TypeScript (`tsconfig.json`), ESLint, Prettier, and npm manifest.

When you add a **backend** later, keep the same single root manifest: add server dependencies to this `package.json` and put server code in something like `backend/` (no extra lockfile).

## Path aliases

Imports use explicit prefixes (resolved via `tsconfig.json` and Metro `tsconfigPaths`):

- `@assets/...` → `client/assets/...`
- `@components/...` → `client/components/...`
- `@store/...` → `client/store/...`
- `@storage/...` → `client/storage/...`

Example: `import { LoremBlock } from '@components/lorem-block';`

## Commands

From the repository root:

```bash
npm install
npm start
```

Other scripts: `npm run android`, `npm run ios`, `npm run web`, `npm run lint`, `npm run format`, `npm run reset-project`.

## Fresh starter layout

To move current app code aside and create a blank `client/app`:

```bash
npm run reset-project
```

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
