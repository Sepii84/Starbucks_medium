# Starbucks Medium

A medium-complexity full-stack coffee shop ordering website built with Next.js App Router, TypeScript, Prisma, PostgreSQL, Tailwind CSS, secure cookie sessions, user ordering, and a protected admin panel.

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

The seed is idempotent. It creates the admin/user accounts, site info, 17 menu categories, and the full Starbucks-inspired demo menu from `prisma/seed.ts` without duplicating rows on repeated runs.

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

On Windows PowerShell, if an npm script exits immediately with no output, run it through `cmd /c`, for example `cmd /c npm run dev`.

## Seed Credentials

Admin:

- Email: `admin@example.com`
- Password: `Admin123!`

User:

- Email: `user@example.com`
- Password: `User123!`

## Main Routes

- `/` public home
- `/menu` public menu with user-only add to bag
- `/about` public about page
- `/location` public location and contact page
- `/login` login with role-based redirect
- `/register` public user registration
- `/account` protected user account
- `/order` protected user bag and checkout
- `/admin` protected admin dashboard
- `/admin/orders` order management
- `/admin/menu` menu and category management
- `/admin/site-info` editable website/footer information
- `/admin/users` user management
- `/admin/notifications` admin notifications
- `/admin/account` admin profile and password

## Notes

- Public visitors can browse menu and site pages but cannot order.
- USER accounts can add items to the local bag and finalize orders.
- ADMIN accounts are redirected to `/admin` and protected from normal order flow.
- Order totals are always recalculated on the server from database prices.
- Placing an order creates an unread admin notification automatically.
