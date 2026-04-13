# Loyalty Rewards App — Technical Specification

## 1. Project Overview

A **customer loyalty & rewards platform** delivered as a Telegram Mini App. It enables businesses to run loyalty programs where customers earn points from purchases and redeem them for discounts, gifts, or exclusive products.

### Core Features

- **Points System**: Earn points from purchase receipts (QR scanning or manual entry), spend on rewards
- **Tier Memberships**: Bronze → Silver → Gold → Platinum with escalating benefits
- **Offers Marketplace**: Discounts, flash sales, birthday offers, exclusive deals
- **Product Catalog**: Store inventory with optional tier-based access
- **QR Code Entry**: Two modes — customer scans receipt, or scans store door QR to claim points
- **Merchant Dashboard**: Analytics, customer management, product/offer CRUD, team roles
- **Referral System**: Share referral codes, earn bonus points

### Architecture

- **Frontend**: React 18 SPA built with Vite 5, Tailwind CSS 3, Zustand, TanStack Query
- **Backend**: Supabase (PostgreSQL + Row Level Security + Storage)
- **Platform**: Telegram WebApp via `@twa-dev/sdk`
- **Authentication**: Telegram ID based (no Supabase Auth required for end users)

---

## 2. Tech Stack

| Category | Technology |
|---|---|
| Framework | React 18.2, React Router DOM 6 |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 3 + PostCSS + Autoprefixer |
| State | Zustand 4 (global), React Query 5 (server) |
| Backend | Supabase (PostgreSQL) |
| Animation | Framer Motion 12 |
| Icons | Lucide React |
| QR | html5-qrcode, qrcode.react |
| Charts | Recharts |
| Dates | date-fns |
| Telegram | @twa-dev/sdk |
| Testing | Vitest + React Testing Library |
| Fonts | Plus Jakarta Sans |

---

## 3. Database Schema

All tables live in the `public` schema with RLS enabled. The app uses **Telegram ID** as the primary user identifier rather than Supabase Auth.

### Entity Relationship

```
users (1) ←→ (N) user_store_memberships ←→ (1) stores
                ↓
            (N) transactions
            (N) redemptions
            (N) pending_point_claims

offers (1) ←→ (N) offer_products ←→ (1) products
offers (1) ←→ (N) redemptions

stores (1) ←→ (N) products
stores (1) ←→ (N) offers
stores (1) ←→ (N) promotions
stores (1) ←→ (N) roles
```

### Core Tables

#### `users`
Platform users identified by Telegram. No Supabase auth dependency.

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| telegram_id | bigint | **Unique** — Telegram user ID |
| username | text | Telegram username |
| full_name | text | Display name |
| photo_url | text | Telegram profile photo |
| phone | text | Phone number |
| birth_date | date | For birthday rewards |
| gender | text | 'male' / 'female' |
| role | text | 'user' / 'admin' / 'super_admin' |
| is_super_admin | boolean | Platform-level admin |
| referral_code | text | Unique referral code |
| referred_by | uuid | FK to users (referrer) |
| ad_points_balance | integer | Platform ad points |
| created_at, updated_at | timestamptz | Timestamps |
| last_active | timestamptz | Last activity |

#### `stores`
Loyalty program configuration per business.

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| slug | text | **Unique** — URL-friendly store ID |
| name | text | Store name |
| owner_email | text | Contact email |
| owner_username | text | Telegram username of owner |
| description | text | About the store |
| logo_url | text | Store logo |
| phone, address, city | text | Contact info |
| category | text | Store category |
| tier_config | jsonb | Tier thresholds per store |
| points_rate | integer | Points per 1 DZD spent |
| welcome_points | integer | Points on first join |
| primary_color | text | Brand accent color (hex) |
| plan | text | 'basic' / 'premium' |
| is_active | boolean | Store visibility |
| bot_username | text | Telegram bot username |
| bot_token | text | Bot API token |
| ad_points_balance | integer | Store ad budget |
| created_at, updated_at | timestamptz | Timestamps |

#### `user_store_memberships`
Links users to stores with their loyalty state.

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | FK → users |
| store_id | uuid | FK → stores |
| role_id | uuid | FK → roles |
| points | integer | Current points balance |
| tier | text | 'bronze' / 'silver' / 'gold' / 'platinum' |
| total_spent | integer | Lifetime spend in DZD |
| visit_count | integer | Number of purchases |
| last_purchase | timestamptz | Last transaction date |
| referral_code | text | User's unique referral code |
| joined_at, updated_at | timestamptz | Timestamps |

Unique constraint on `(user_id, store_id)`.

#### `transactions`
Point ledger — every points movement is recorded.

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | FK → users |
| store_id | uuid | FK → stores |
| membership_id | uuid | FK → user_store_memberships |
| type | text | 'earn' / 'redeem' / 'adjust' / 'expire' / 'welcome' / 'referral' |
| points | integer | Points change (+/-) |
| amount | integer | Purchase amount in DZD |
| note | text | Description |
| offer_id | uuid | FK → offers (if redemption) |
| qr_token | text | Unique token for QR verification |
| qr_used | boolean | Whether QR was consumed |
| expires_at | timestamptz | Expiry for QR tokens |
| created_at | timestamptz | Timestamp |

#### `products`
Store inventory items.

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| store_id | uuid | FK → stores |
| name | text | Product name |
| description | text | Details |
| price | integer | Price in DZD |
| category | text | Classification |
| image_url | text | Product image |
| is_exclusive | boolean | Tier-gated product |
| min_tier_to_view | text | Minimum tier to see |
| is_active | boolean | Visibility |
| created_at, updated_at | timestamptz | Timestamps |

#### `offers`
Redeemable rewards.

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| store_id | uuid | FK → stores |
| title | text | Offer name |
| description | text | Details |
| type | text | 'discount' / 'gift' / 'double_points' / 'flash' / 'exclusive' |
| discount_percent | integer | % off (if discount) |
| points_cost | integer | Points to redeem |
| min_tier | text | Minimum tier required |
| occasion_type | text | 'always' / 'fixed' / 'birthday' / 'anniversary' / 'win_back' / 'flash' |
| occasion_date | date | Specific date |
| valid_from, valid_until | timestamptz | Validity window |
| usage_limit | integer | Max redemptions |
| image_url | text | Offer banner |
| is_active | boolean | Visibility |
| created_at, updated_at | timestamptz | Timestamps |

#### `offer_products`
Many-to-many link between offers and products.

| Column | Type | Description |
|---|---|---|
| offer_id | uuid | FK → offers |
| product_id | uuid | FK → products |

#### `redemptions`
Offer redemption records with coupon generation.

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | FK → users |
| store_id | uuid | FK → stores |
| offer_id | uuid | FK → offers |
| points_spent | integer | Points consumed |
| coupon_code | text | 4-digit code |
| coupon_code_expires_at | timestamptz | 24h expiry |
| products | uuid[] | Linked product IDs |
| created_at | timestamptz | Timestamp |

#### `pending_point_claims`
Real-time point claim tracking (door QR mode).

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| store_id | uuid | FK → stores |
| user_id | uuid | FK → users |
| membership_id | uuid | FK → user_store_memberships |
| status | text | 'waiting' / 'claimed' / 'expired' |
| points_claimed | integer | Points to add |
| amount_claimed | integer | Purchase amount |
| expires_at | timestamptz | 10-minute expiry |
| created_at | timestamptz | Timestamp |

#### `promotions`
Push notification campaigns.

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| store_id | uuid | FK → stores |
| title | text | Campaign title |
| body | text | Message body |
| image_url | text | Banner |
| cta_label | text | Button label |
| cta_url | text | Deep link |
| target_tiers | text[] | Tier filter |
| target_gender | text | Gender filter |
| target_city | text | City filter |
| target_min_spent | integer | Min lifetime spend |
| reward_points | integer | Bonus points |
| budget_points | integer | Total budget |
| starts_at, ends_at | timestamptz | Campaign window |
| is_active | boolean | Visibility |
| created_at, updated_at | timestamptz | Timestamps |

#### `roles`
Team member roles and permissions.

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| store_id | uuid | FK → stores |
| slug | text | 'owner' / 'manager' / 'cashier' / 'viewer' / 'client' |
| name | text | Display name |
| permissions | jsonb | { view, edit, delete, ... } |

---

## 4. Page Structure

### Customer App (Mobile-First)

| Route | Page | Description |
|---|---|---|
| `/` | Home | Points balance, scan button, personalized offers, trending products, new arrivals |
| `/scan` | Scanner | QR code scanner for receipt scanning |
| `/offers` | ClientOffers | All available offers filtered by user tier |
| `/offers/:id` | OfferDetail | Offer details with product list, redeem button |
| `/products` | ClientProducts | Product catalog |
| `/products/:id` | ProductDetail | Product info, add to offer if applicable |
| `/history` | History | Transaction history (earn/redeem) |
| `/profile` | Profile | User info, tier badge, referral code, active coupons, birthdate |
| `/claim/:storeSlug` | ClaimPoints | Real-time claim waiting screen (door QR mode) |
| `/claim-success` | ClaimSuccess | Success screen after points claimed |

### Merchant Dashboard

| Route | Page | Description |
|---|---|---|
| `/dashboard/overview` | Overview | Stats cards, 14-day chart, tier distribution, recent transactions, offer performance |
| `/dashboard/qr` | QRGenerator | Generate store door QR codes for point claims |
| `/dashboard/products` | Products | Product CRUD with image upload, categories, exclusive toggle |
| `/dashboard/offers` | Offers | Offer CRUD with product linking, tier gating, validity |
| `/dashboard/customers` | Customers | Customer list with search, tier filter, pagination |
| `/dashboard/customers/:memberId` | CustomerDetail | Individual customer profile, points, transaction history |
| `/dashboard/team` | TeamManagement | Invite team members, assign roles |
| `/dashboard/roles` | RolesManagement | Define roles and permissions |
| `/dashboard/notifications` | Notifications | Create push campaigns with targeting |
| `/dashboard/settings` | Settings | Store profile, tier config, points rate, theme |

---

## 5. Key Features & Logic

### 5.1 User Initialization (Telegram Auth)

1. App loads → reads `Telegram.WebApp.initData`
2. Extract `telegram_id` and user data from Telegram
3. Look up or create user by `telegram_id` in `users` table
4. Look up store from URL slug (`?startapp=store-slug`) or create if first user
5. Create or fetch membership in `user_store_memberships`
6. First user of a store becomes **owner** with full dashboard access
7. Subsequent users get **client** role

### 5.2 Points Earn Flow

**Mode A — Receipt QR Scan**
1. Customer scans QR on receipt (contains `qr_token`)
2. App verifies token in `transactions` table
3. Marks token as used (`qr_used = true`)
4. Adds points to customer's membership
5. Creates `earn` transaction record

**Mode B — Door QR (Real-Time)**
1. Customer scans store door QR → navigates to `/claim/:slug`
2. Creates `pending_point_claim` record with status `waiting`
3. Merchant dashboard polls for pending claims
4. Merchant enters purchase amount → confirms claim
5. Status updates to `claimed`, points added to customer
6. Customer screen auto-navigates to success on status change

### 5.3 Offer Redemption

1. Customer views offer, clicks "استبدال"
2. System checks: sufficient points? tier eligible? offer active?
3. Generates 4-digit `coupon_code`, expires in 24h
4. Deducts points from membership
5. Creates `redemption` record with products linked
6. Creates `redeem` transaction record
7. Shows coupon code to customer

### 5.4 Tier System

Default tiers: **Bronze (0)** → **Silver (10,000)** → **Gold (50,000)** → **Platinum (100,000)**

- Tier thresholds stored per-store in `stores.tier_config`
- Database trigger `update_user_tier()` recalculates on any points change
- Higher tiers unlock exclusive offers and products

### 5.5 Dashboard Access Control

- Route guard checks `membership.role` from `user_store_memberships`
- Owner & Manager roles can access all dashboard pages
- Cashier role limited to QR generation
- Viewer role read-only
- Client role has no dashboard access → `NoAccess` page

### 5.6 Referral System

- Each membership gets a unique `referral_code` (auto-generated)
- Referrer shares link: `https://t.me/{bot}?start=ref_{code}`
- New user joins via link → `referred_by` set to referrer
- On first purchase, both get referral bonus points (configurable)

---

## 6. Design System

### Colors (Tailwind Config)

| Token | Hex | Usage |
|---|---|---|
| bg | #ffffff | Page background |
| surface | #f8fafc | Card backgrounds |
| card | #ffffff | Component backgrounds |
| border | #e2e8f0 | Borders |
| accent | #10b981 | Primary actions, success |
| accent-light | #d1fae5 | Accent backgrounds |
| accent-dark | #059669 | Pressed states |
| success | #10b981 | Positive states |
| error | #ef4444 | Errors |
| muted | #64748b | Secondary text |
| text | #1e293b | Primary text |

### Typography

- **Font Family**: Plus Jakarta Sans (Google Fonts)
- **Headings**: `font-black` / `font-bold`
- **Body**: `font-medium` / `font-regular`
- **RTL**: All pages use Arabic (`dir="rtl"`)

### Component Patterns

- Cards: `rounded-3xl`, `border border-border`, `shadow-soft`
- Buttons: `rounded-2xl`, `font-black`, `shadow-soft`
- Inputs: `rounded-2xl`, `bg-surface`, `border-border`
- Bottom nav: Fixed, 5 items, active indicator
- Modals: Full-screen overlay with `backdrop-blur`, `rounded-[32px]`

### Animations

- Page transitions: `framer-motion` with `opacity` + `y` slide
- Staggered lists: `staggerChildren` variant
- Button press: `whileTap={{ scale: 0.95 }}`
- Loading: Skeleton shimmer

---

## 7. State Management

### Global (Zustand)

`useUserStore` — Customer-facing state:
- `user` — Current Telegram user
- `membership` — Current store membership (points, tier, role)
- `store` — Current store config
- `initUser()` — Initialize on app load

`useDashboardStore` — Merchant dashboard state:
- `store` — Active store
- `membership` — User's role in store
- `init()` — Load dashboard data

### Server State (TanStack Query)

All data fetching wrapped in `useQuery` / `useMutation`:
- `queryKey` includes store ID for isolation
- `staleTime` default 5 minutes
- Auto-refetch on window focus
- Optimistic updates for mutations

---

## 8. API Patterns (Supabase)

### Fetch Single

```js
const { data } = await supabase
  .from('offers')
  .select('*')
  .eq('id', offerId)
  .single()
```

### Fetch with Relation

```js
const { data } = await supabase
  .from('offers')
  .select('*, offer_products(products(*))')
  .eq('store_id', store.id)
  .eq('is_active', true)
```

### Insert with Return

```js
const { data, error } = await supabase
  .from('transactions')
  .insert({ ... })
  .select()
  .single()
```

### Count Query

```js
const { count } = await supabase
  .from('users')
  .select('*', { count: 'exact', head: true })
  .eq('store_id', store.id)
```

---

## 9. Security (RLS Policies)

All tables have RLS enabled. Key policies:

- **users, stores, products, offers**: Public read; write limited to platform admin or store owner
- **user_store_memberships**: Read for store members; write for store owner/manager
- **transactions, redemptions**: Read/write for store staff
- **pending_point_claims**: Read for store staff; write for owner/manager

The app uses the **anon key** — no server-side auth required. All access controlled via RLS policies tied to Telegram IDs.

---

## 10. Project Structure

```
src/
├── components/      # Reusable UI (BottomNav, OfferCard, PointsCard, ...)
├── pages/           # Route-level pages (Home, Offers, Overview, ...)
├── hooks/           # Custom hooks (useProducts, useOffers, useTransactions)
├── lib/             # Utilities (supabase.js, auth.js, tiers.js, offers.js)
├── store/           # Zustand stores (userStore.js, dashboardStore.js)
├── assets/          # Static assets (images, fonts)
├── main.jsx         # Entry point
├── App.jsx          # Router + providers
└── index.css       # Tailwind + global styles

features/            # Feature specifications (gamification, referral, etc.)
Plan/                # Implementation plans for new features
setup.sql            # Full database schema
SUPABASE_SETUP.md    # Setup guide
AGENTS.md            # Developer guide
```

---

## 11. Development Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npx eslint . --fix` | Auto-fix lint |
| `npm run test` | Run Vitest tests |

---

## 12. Environment Variables

```
VITE_SUPABASE_URL=<project-url>
VITE_SUPABASE_ANON_KEY=<anon-key>
```

Missing variables trigger console warnings; app falls back to demo data mode.

---

*This specification reflects the current implementation as of April 2026.*