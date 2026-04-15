# QWEN.md — Project Context

## Project Overview

**Customer Loyalty & Rewards Platform** — a Telegram Mini App built with React 18, Vite 5, Tailwind CSS 3, Zustand 4, TanStack Query 5, and Supabase (PostgreSQL).

The app serves two audiences:
- **Customers**: Earn points from purchases (via QR scanning or door QR claims), redeem offers/coupons, browse products, track tier membership (Bronze → Silver → Gold → Platinum), and participate in referrals.
- **Merchants**: Dashboard with analytics, customer management, product/offer CRUD, QR code generation for point claims, team role management, and push notification campaigns.

### Architecture
- **Frontend**: React 18 SPA with `react-router-dom` v6, Framer Motion animations, and `lucide-react` icons.
- **State**: Zustand for global state (`userStore`, `dashboardStore`); TanStack Query for server state.
- **Backend**: Supabase (PostgreSQL + Row Level Security). No Supabase Auth — users are identified by Telegram ID.
- **Platform**: Telegram WebApp via `@twa-dev/sdk`. Auth flows from `Telegram.WebApp.initData`.
- **i18n**: Full trilingual support (Arabic `ar`, English `en`, French `fr`) via `i18next` + `react-i18next`. Arabic uses RTL layout.

---

## Key Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite dev server (port 9002, host enabled) |
| `npm run build` | Production build (output: `dist/`) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint on the entire project |
| `npx eslint . --fix` | Auto-fix lint issues |
| `npm run test` | Run Vitest tests |

---

## Project Structure

```
src/
├── components/       # Reusable UI (BottomNav, OfferCard, PointsCard, TierBadge, ...)
├── pages/            # Route-level pages (Home, Offers, Overview, Customers, ...)
├── hooks/            # Custom hooks (useProducts, useOffers, useTransactions, ...)
├── lib/              # Utilities & services (supabase.js, auth.js, telegram.js, tiers.js, ...)
├── store/            # Zustand stores (userStore.js, dashboardStore.js)
├── locales/          # i18n translation files (ar.json, en.json, fr.json)
├── assets/           # Static assets
├── main.jsx          # Entry point (renders App, imports i18n)
├── App.jsx           # Router + QueryClientProvider + route definitions
└── index.css         # Global Tailwind styles + custom CSS variables
```

---

## Code Conventions

### File Naming
- **Components/pages**: PascalCase `.jsx` — `OfferCard.jsx`, `Home.jsx`
- **Hooks**: `use` prefix, `.js` — `useOffers.js`
- **Lib/store**: camelCase `.js` — `supabase.js`, `userStore.js`

### Style
- **Indentation**: 2 spaces, no semicolons, single quotes
- **Components**: Functional only, `export default function Name`
- **Hooks**: Named exports — `export const useHookName`
- **Imports order**: React core → third-party → internal (stores → lib → hooks → components)
- **Tailwind**: Utility classes directly in `className`; mobile-first with `max-w-md` containers

### Error Handling
- Wrap all Supabase calls in `try/catch`
- Check `if (error) throw error` after queries
- Store errors in Zustand: `set({ error: err.message })`
- Provide fallback/demo data when Supabase is unreachable

### State Management
- **Zustand** for global state (user, membership, store config)
- **TanStack Query** for server state (offers, products, transactions)
- Query keys include store ID for data isolation; default `staleTime: 5 min`

---

## Database Schema (Supabase)

Core tables in `public` schema with RLS enabled:

| Table | Purpose |
|---|---|
| `users` | Platform users identified by Telegram ID |
| `stores` | Loyalty program config per business |
| `user_store_memberships` | Links users to stores with points, tier, role |
| `transactions` | Point ledger (earn/redeem/adjust/expire/welcome/referral) |
| `products` | Store inventory with tier-gated access |
| `offers` | Redeemable rewards (discount, gift, flash, exclusive) |
| `offer_products` | Many-to-many: offers ↔ products |
| `redemptions` | Redemption records with coupon codes |
| `pending_point_claims` | Real-time point claim tracking (door QR mode) |
| `promotions` | Push notification campaigns |
| `roles` | Team member roles and permissions |

User initialization: First user of a store becomes **owner**; subsequent users get **client** role. Referral logic rewards both referrer and referee.

---

## Routing

### Customer Routes
| Route | Page |
|---|---|
| `/` | Home (or Onboarding if no user) |
| `/scan` | QR scanner |
| `/offers`, `/offers/:id` | Offers list / detail |
| `/products`, `/products/:id` | Product catalog / detail |
| `/history` | Transaction history |
| `/profile` | User profile, tier badge, coupons |
| `/claim/:storeSlug` | Claim points waiting screen |
| `/claim-success` | Claim success |

### Merchant Dashboard Routes (`/dashboard/*`)
Guarded by `DashboardGuard` — checks membership role access. Includes: overview, QR generator, deliveries, products, offers, customers, team, notifications, settings, roles.

---

## Environment Variables

```
VITE_SUPABASE_URL=<project-url>
VITE_SUPABASE_ANON_KEY=<anon-key>
```

Missing variables trigger fallback to demo data mode.

---

## Key Design Tokens

| Token | Hex | Usage |
|---|---|---|
| `bg` | #ffffff | Page background |
| `surface` | #f8fafc | Card backgrounds |
| `accent` | #10b981 | Primary actions (dynamic per store) |
| `error` | #ef4444 | Error states |
| `muted` | #64748b | Secondary text |
| `text` | #1e293b | Primary text |

Font: **Plus Jakarta Sans** (Google Fonts). Cards use `rounded-3xl`, buttons `rounded-2xl`, animations via Framer Motion.

---

## Notes for AI Agents

- Always run `npm run lint` after making code changes.
- Use existing patterns — don't introduce new libraries unless explicitly requested.
- Arabic text uses RTL direction; ensure `dir="rtl"` is applied when `lang === 'ar'`.
- The app uses `@twa-dev/sdk` for Telegram integration; check `src/lib/telegram.js` for Telegram data extraction.
- Supabase client is in `src/lib/supabase.js`. All DB calls go through it.
- Database setup/seed logic is in `src/lib/setup-db.js`.
- Refer to `SPEC.md` for the full technical specification and `AGENTS.md` for detailed development guidelines.
