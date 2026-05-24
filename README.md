# Starbucks Medium

A medium-complexity full-stack coffee shop ordering website built with Next.js App Router, TypeScript, Prisma, PostgreSQL, Tailwind CSS, secure cookie sessions, user ordering, rewards, gift cards, fake wallet balance, and a protected admin panel.

## Stack

- Next.js App Router
- React + TypeScript
- PostgreSQL + Prisma ORM
- Server actions and protected API routes
- Tailwind CSS
- bcrypt password hashing
- Zod validation

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and set your PostgreSQL connection:

```bash
cp .env.example .env
```

On Windows Command Prompt:

```bat
copy .env.example .env
```

Edit `DATABASE_URL` and `DIRECT_URL` in `.env` before continuing.

For Supabase pooler connections, use port `6543` with `pgbouncer=true` for
`DATABASE_URL` because that is what the Next.js app uses at runtime. Keep the
port `5432` connection in `DIRECT_URL` for Prisma migration/direct operations.
After changing `.env`, stop and restart the Next.js dev server so Prisma and
Next.js load the new connection string.

3. Generate the Prisma client:

```bash
npm run prisma:generate
```

4. Run the Prisma migration:

```bash
npm run prisma:migrate
```

5. Seed the database:

```bash
npm run prisma:seed
```

The seed is idempotent. It creates the admin/user accounts, site info, 17 menu categories, the full Starbucks-inspired demo menu, reward rules, and gift card templates from `prisma/seed.ts` without duplicating rows on repeated runs.

Branding note: this is a Starbucks-inspired development demo. For commercial deployment, rename the brand/menu items and replace trademarked references or images unless proper permission exists.

6. Verify database counts:

```bash
npm run db:check
```

If `npm run db:check` shows menu items greater than `0`, the database is seeded. If `/menu` is still empty after that, the problem is in the menu page fetch/filter/rendering. If `npm run db:check` shows `0` menu items, the seed did not run correctly.

7. Start development:

```bash
npm run dev
```

Open `http://localhost:3011`.

In development, `GET /api/dev/menu-count` returns menu category/item counts for quick debugging.

The project includes a local `.npmrc` so npm scripts run through PowerShell consistently on Windows paths with spaces.

## Product Images

Generated menu, gift-card, and site images live under `public/images`. The repeatable image workflow is:

```bash
npm run images:manifest
npm run images:generate
npm run images:apply
npm run images:verify
npm run images:zip
```

Use `--force` to regenerate existing files, `--limit=10` for a small batch, or `--only=menu`, `--only=gift-cards`, or `--only=site` to focus one asset type. The final zip is written to `generated-assets/product-images.zip`.

## Admin Image Uploads

Admin menu item and gift card template forms support either a pasted image URL/path or a direct upload from the device. File selection only creates a local browser preview; the image is uploaded when the admin saves the form. Runtime uploads are sent through protected server-side admin logic and stored in Supabase Storage; they are not written to `/public` because Vercel runtime storage is not persistent.

Add these values to `.env` for uploads:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://PROJECT_REF.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="replace-with-supabase-service-role-key"
SUPABASE_STORAGE_BUCKET="site-images"
```

Create the `site-images` bucket in Supabase Storage, or set `SUPABASE_STORAGE_BUCKET` to the bucket you want to use. The app uploads to:

- `menu-items/...` for menu item images
- `gift-cards/...` for gift card template images

The upload route checks the logged-in account is an ADMIN before accepting a file. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only and never expose it to client code. Make the bucket publicly readable if you want uploaded image URLs to display directly in the browser.

If an uploaded image is replaced or its record is deleted, the app removes the old Supabase object only after the database change succeeds and only when no other menu item or gift card template still references it. Local named images such as `/images/menu/Caffe Latte.jpg` and `/images/gift-cards/25 dollar gift card.jpg` are never deleted by this cleanup.

To inspect existing Supabase upload folders without deleting anything:

```bash
npm run storage:audit
```

To delete orphaned files under the managed `menu-items/` and `gift-cards/` folders:

```bash
npm run storage:cleanup
```

## Demo Wallet Top-Ups

Wallet top-ups use an internal MOCK provider only. No Stripe, Iyzico, PayTR,
PayPal, card form, bank form, or real checkout session is connected.

Set the provider in `.env`:

```bash
PAYMENT_PROVIDER="mock"
```

If `PAYMENT_PROVIDER` is missing, the app defaults safely to `mock`. Setting it
explicitly is still recommended for Vercel and other deployments so the demo
payment mode is obvious.

The flow is:

1. A USER starts a top-up from `/wallet`.
2. The server creates a `PENDING` `WalletTopUp`.
3. The user confirms on `/wallet/top-up/mock-confirm`.
4. The server marks the top-up `SUCCEEDED`, increases `User.walletBalance`,
   and creates a `WalletTransaction` with type `TOP_UP` inside one Prisma
   transaction.

Refreshing the success/confirmation flow will not credit the wallet twice.
Admin wallet view shows recent demo top-ups for audit visibility.

## Seed Credentials

Admin:

- Email: `admin@example.com`
- Password: `Admin123!`

User:

- Email: `user@example.com`
- Password: `User123!`
- Seeded reward points: `250`
- Seeded fake wallet balance: `$100.00`

## Main Routes

- `/` public home
- `/menu` public menu with user-only add to bag
- `/rewards` public/user rewards page with point redemption
- `/gift-cards` public/user gift card page
- `/about` public about page
- `/location` public location and contact page
- `/login` login with role-based redirect
- `/register` public user registration
- `/account` protected user account
- `/order` protected user bag and checkout
- `/wallet` protected fake in-website wallet
- `/wallet/top-up/mock-confirm` protected MOCK wallet top-up confirmation
- `/admin` protected admin dashboard
- `/admin/orders` order management
- `/admin/menu` menu and category management
- `/admin/rewards` reward rules, redemptions, point history, and point adjustments
- `/admin/gift-cards` gift card templates, purchased cards, and gift card history
- `/admin/wallet` wallet balances, search, transactions, and admin adjustments
- `/admin/site-info` editable website/footer information
- `/admin/users` user management
- `/admin/notifications` admin notifications
- `/admin/account` admin profile and password

## SEO and Search Visibility

Set `NEXT_PUBLIC_APP_URL` to the deployed canonical origin in Vercel, for example:

```bash
NEXT_PUBLIC_APP_URL="https://starbucks-medium.vercel.app"
```

After deployment, check:

- `/sitemap.xml` includes only public pages.
- `/robots.txt` allows public pages and blocks admin, API, wallet, account, and order routes.
- Public pages have page-specific titles, descriptions, canonical URLs, Open Graph tags, Twitter/X card tags, and lightweight JSON-LD.
- Private/user/admin pages are marked `noindex`.
- Social links should be changed from `#` to real project links before adding them to structured-data `sameAs`.

Submit `/sitemap.xml` in Google Search Console after each production deployment and validate key pages with the URL Inspection tool.

## Notes

- Public visitors can browse menu and site pages but cannot order.
- USER accounts can add items to the local bag and finalize orders.
- ADMIN accounts are redirected to `/admin` and protected from normal order flow.
- Order totals are always recalculated on the server from database prices.
- Placing an order creates an unread admin notification automatically.
- Rewards award 1 point per whole dollar of successful order total.
- Reward redemption deducts points server-side and records redemption/history rows.
- Wallet money is fake in-website balance only, not real currency and not connected to payments.
- Wallet payments, gift card purchases, gift card sends, admin wallet adjustments, and refunds are recorded in `WalletTransaction`.
- Gift cards can be created for in-person pickup or sent to another registered user email inside the website.
