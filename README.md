# carswap

A car-swap app for Serbia. Say what you drive, then trade up and add money or trade down and take cash. Swipe through cars and see straight away where a swap is possible and what it costs all in.

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

| Route                     | What is there                                                                                                              |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `/`                       | Landing page: the "my car + X" equation with a live slider, and a walkthrough of the four steps that can be tried in place |
| `/swipe`                  | The deck: drag or use the keyboard to like or pass, undo, open details                                                     |
| `/garage`                 | Cars you liked, each with its top-up, smallest first                                                                       |
| `/auto/[id]`              | One car at an address worth sending to someone                                                                             |
| `/auto/[id]/[car]/[deal]` | The same car with the sender's swap, e.g. `/auto/skoda-octavia-3/golf/doplata-2400`                                        |
| `/credits`                | Author, licence and source for every demo photo                                                                            |

There is no backend yet. The app runs on seed data, and what a visitor enters (their car, which way they want to trade, how much money is in play, and their swipes) is kept in `localStorage`.

The flow: a visitor can swipe straight away. After the first like the app asks what they drive (make, model, year, mileage, fuel) and shows an estimated value as a range. Then they say which way they are trading: a pricier car and they add money, a cheaper one and they take cash, or either. From then on every card shows the top-up or the cash back instead of just the price, the deck is limited to the swaps they asked for, and a like on a car whose dealer accepts the visitor's car is a match.

Every card also shows two figures a classified ad leaves out: what changes hands on the day with tax and paperwork included, and what the car costs to register for a year. The details sheet breaks both down.

Any car can be sent to someone, with Viber first. With a car entered, the link carries the sender's equation, so the preview in the chat reads "Golf + 2.400 € = Škoda Octavia" before anyone opens it. Opening it shows that car and the sender's swap, and one tap deals the same car first in the recipient's own deck.

## Repository layout

```
apps/web/
  src/app/               routes, global styles and design tokens (globals.css)
  src/components/
    deck/                swipe engine (SwipeDeck), card face, details, match moment
    car/                 "my car" flow, the trade-up / trade-down control, cost breakdown
    share/               share sheet and the button that opens it
    listing/             the page a shared link opens
    garage/              saved swaps
    landing/             landing page sections, and the "how a swap goes" walkthrough with its scenes
    ui/                  shared primitives: button, sheet, slider, car chip, animated number
  src/lib/
    domain/              pure logic with unit tests: estimate, deal maths, deck order, costs
    og/                  draws the link-preview images
    seed/                demo dealers, listings and vehicle catalogue
    share.ts             the shared-link format: writing it, and reading it back strictly
    copy.ts              every user-facing string (Serbian)
    store.ts             local state, persisted to localStorage
    useEstimate.ts       the one place screens get a car's estimated value
    analytics.ts         typed funnel events; no provider wired up yet
  assets/                fonts and photo copies the preview images are drawn from
  e2e/                   end-to-end tests
scripts/seed-photos/     builds the demo photo set from Wikimedia Commons
```

## Things worth knowing before changing code

- **The estimate is a placeholder.** `lib/domain/valuation.ts` is a hand-tuned depreciation curve, not a model. Every screen reads estimates through the `useEstimate` hook in `lib/useEstimate.ts`, so the real valuation service plugs in there.
- **Dealers, cars and prices are examples.** Dealer names are invented. The UI labels itself as a demo while `NEXT_PUBLIC_DEMO` is not `0`.
- **Card order is a stand-in for ranking.** `lib/domain/deck.ts` deals the swaps the visitor asked for in a stable shuffle, then near misses.
- **Costs are estimates from public tariffs.** `lib/domain/costs.ts` holds the transfer tax formula from the law, the 2026 tax on use, the police fees and an approximation of insurance and the municipal fee, each with its source next to it. `TARIFFS_CHECKED_ON` says when they were last read; they change every year. The transfer tax follows the law exactly and is zero when the seller charges VAT, as dealers do. The registration figure is good to within about fifteen percent, and the UI says "oko" everywhere.
- **A shared link is read back strictly.** Anyone can type `/auto/<id>/<car>/<deal>`, and the page and its preview print those numbers under our name. `parseSwap` in `lib/share.ts` accepts only a catalogue model and an amount that model could plausibly be credited; anything else redirects to the car without a swap. The links are not signed, so within those limits a link can still state a swap nobody was offered. Signing needs a server, which arrives with the API.
- **Shared pages are always served whole.** Chat apps read the title and image from `<head>` without running scripts, and Next.js streams the title in later for clients it does not recognise as crawlers, Viber among them. Both `/auto` pages export `ensureStatic = "navigation"`, so a link nobody has opened before is rendered completely, then kept. An end-to-end test reads the raw HTML to keep it that way.
- **Preview images are JPEG on purpose.** `next/og` writes PNG only, about 500 kB for an image with a photo in it, which some messengers will not fetch. `lib/og/share-image.tsx` re-encodes with `sharp` to about 100 kB and keeps the result with `use cache`. Set `NEXT_PUBLIC_SITE_URL` in production, or the preview tags point at localhost.
- **`short:` is a Tailwind variant for low viewports.** A phone browser with its address bar showing leaves about 650px of height. The deck tightens itself there so the photo keeps its share of the card. The same styles apply inside anything marked `data-compact`.
- **This is a phone app, and the landing page is laid out for a phone first.** "Kako ide zamena" (`components/landing/HowItWorks.tsx`) shows each step with a real piece of the app at the size it has on a phone. On a phone those pieces sit straight on the page, one step after another, and play as they scroll into view; nothing is drawn around them and nothing is pinned. On a desktop there is no phone around the page, so one is drawn and the same pieces take turns on its screen. Check any change to it at a phone-sized viewport (about 390 by 660) before a desktop one.
- **The deck in that walkthrough is the real one.** It is `SwipeDeck` with the app's `CarCard`, so it cannot drift from the app. `scrollsWithPage` makes the card answer only to sideways drags and leaves vertical ones to the page; without it a thumb landing on the card could not scroll past. End-to-end tests send real touch gestures to check both.
- **This is Next.js 16 with Cache Components.** Pages are prerendered to a static shell and routes are kept alive across navigation. Screens that depend on `localStorage` render only in the browser (`use(browser())` inside a Suspense boundary), and code that runs during prerender must not read the clock. `apps/web/AGENTS.md` points to the framework docs bundled in `node_modules/next/dist/docs/`; read the relevant guide before using an API from memory.
- **Copy is Serbian only**, in one file. Car names always appear in the nominative and sentences avoid gendered verb forms; the comment at the top of `copy.ts` explains why.
- **The product name is a working title**, read from `lib/brand.ts`.

## Demo photos

The listing photos come from Wikimedia Commons under CC0, CC BY and CC BY-SA licences. `scripts/seed-photos/manifest.json` lists each file with its author and licence, and the build script downloads, resizes and catalogues them:

```bash
uv run --with pillow python scripts/seed-photos/build.py
```

It writes the images to `apps/web/public/seed/cars/`, a small JPEG copy of each to `apps/web/assets/share-photos/` for link previews, their metadata to `apps/web/src/lib/seed/photos.json`, and the credits to `apps/web/public/seed/ATTRIBUTION.md`. The same credits are shown in the app at `/credits`, and each preview image prints the credit for its photo. These licences cover the photos only.

Next.js caches optimised images, so after replacing a photo under the same file name, delete `apps/web/.next/cache/images` and `apps/web/.next/dev/cache/images` or the old picture keeps being served.
