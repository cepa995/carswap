# carswap

A car-swap app for Serbia. Say what you drive and how much you can add on top, swipe through cars, and see straight away where a swap is possible.

This is a pnpm monorepo. Today it holds the buyer web app. The dealer dashboard, the API and the matching jobs will be added alongside it; the plan is in the [milestones](https://github.com/cepa995/carswap/milestones).

## Getting started

You need Node 20.9 or newer and pnpm 10.

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

| Command             | What it does                                             |
| ------------------- | -------------------------------------------------------- |
| `pnpm dev`          | Start the web app with hot reload                        |
| `pnpm build`        | Production build                                         |
| `pnpm start`        | Serve the production build                               |
| `pnpm lint`         | ESLint                                                   |
| `pnpm typecheck`    | Generate route types and run TypeScript                  |
| `pnpm test`         | Unit tests (Vitest)                                      |
| `pnpm e2e`          | End-to-end tests (Playwright) against a production build |
| `pnpm format`       | Format everything with Prettier                          |
| `pnpm format:check` | Check formatting without changing files                  |

The first time you run the end-to-end tests, install their browser with `pnpm --filter @carswap/web exec playwright install chromium`.

CI runs the format check, lint, typecheck, unit tests, a production build and the end-to-end tests on every pull request.

## What the web app does today

| Route      | What is there                                                                  |
| ---------- | ------------------------------------------------------------------------------ |
| `/`        | Landing page built around the "my car + X" equation, with a live budget slider |
| `/swipe`   | The deck: drag or use the keyboard to like or pass, undo, open details         |
| `/garage`  | Cars you liked, each with its top-up, smallest first                           |
| `/credits` | Author, licence and source for every demo photo                                |

There is no backend yet. The app runs on seed data, and what a visitor enters (their car, budget and swipes) is kept in `localStorage`.

The flow: a visitor can swipe straight away. After the first like the app asks what they drive (make, model, year, mileage, fuel) and shows an estimated value as a range. From then on every card shows the top-up instead of just the price, the deck is limited to swaps that fit the budget, and a like on a car whose dealer accepts the visitor's car is a match.

## Repository layout

```
apps/web/
  src/app/               routes, global styles and design tokens (globals.css)
  src/components/
    deck/                swipe engine (SwipeDeck), card face, details, match moment
    car/                 "my car" flow and budget sheet
    garage/              saved swaps
    landing/             landing page sections
    ui/                  shared primitives: button, sheet, slider, plate, animated number
  src/lib/
    domain/              pure logic with unit tests: estimate, deal maths, deck order
    seed/                demo dealers, listings and vehicle catalogue
    copy.ts              every user-facing string (Serbian)
    store.ts             local state, persisted to localStorage
    useEstimate.ts       the one place screens get a car's estimated value
    analytics.ts         typed funnel events; no provider wired up yet
scripts/seed-photos/     builds the demo photo set from Wikimedia Commons
```

## Things worth knowing before changing code

- **The estimate is a placeholder.** `lib/domain/valuation.ts` is a hand-tuned depreciation curve, not a model. Every screen reads estimates through the `useEstimate` hook in `lib/useEstimate.ts`, so the real valuation service plugs in there.
- **Dealers, cars and prices are examples.** Dealer names are invented. The UI labels itself as a demo while `NEXT_PUBLIC_DEMO` is not `0`.
- **Card order is a stand-in for ranking.** `lib/domain/deck.ts` deals swaps within budget in a stable shuffle, then near misses.
- **This is Next.js 16 with Cache Components.** Pages are prerendered to a static shell and routes are kept alive across navigation. Screens that depend on `localStorage` render only in the browser (`use(browser())` inside a Suspense boundary), and code that runs during prerender must not read the clock. `apps/web/AGENTS.md` points to the framework docs bundled in `node_modules/next/dist/docs/`; read the relevant guide before using an API from memory.
- **Copy is Serbian only**, in one file. Car names always appear in the nominative and sentences avoid gendered verb forms; the comment at the top of `copy.ts` explains why.
- **The product name is a working title**, read from `lib/brand.ts`.

## Demo photos

The listing photos come from Wikimedia Commons under CC0, CC BY and CC BY-SA licences. `scripts/seed-photos/manifest.json` lists each file with its author and licence, and the build script downloads, resizes and catalogues them:

```bash
uv run --with pillow python scripts/seed-photos/build.py
```

It writes the images to `apps/web/public/seed/cars/`, their metadata to `apps/web/src/lib/seed/photos.json`, and the credits to `apps/web/public/seed/ATTRIBUTION.md`. The same credits are shown in the app at `/credits`. These licences cover the photos only.

Next.js caches optimised images, so after replacing a photo under the same file name, delete `apps/web/.next/cache/images` and `apps/web/.next/dev/cache/images` or the old picture keeps being served.
