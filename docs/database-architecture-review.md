# Database Architecture Review

## Executive Summary

The current Starbucks Medium project should keep Supabase Postgres as the primary database for this demo/test stage. The application has a real transactional core: users, orders, wallet balances, wallet top-ups, gift cards, reward point history, and admin audit-like notifications all benefit from relational constraints, ACID transactions, and a single source of truth.

A distributed database is not recommended right now. The recent performance work already moved the public read-heavy paths toward a safer architecture: cached public catalog reads, cache tags, on-demand menu browsing, lazy rendering, and reduced authenticated database reads. Those changes address the current bottlenecks more directly than a database replacement would.

The best near-term architecture is:

- Supabase Postgres plus Prisma for core relational data.
- Next.js cache/revalidation for public catalog and site content.
- Vercel/public assets for fixed generated product images.
- Supabase Storage for runtime admin uploads.
- Relational transactions for wallet, order, reward, and gift-card value movement.

If traffic grows substantially, add targeted indexes, a read-optimized cache/search layer, and background reporting jobs before considering any distributed database.

## Current Database Architecture

The project currently uses:

- Prisma with PostgreSQL through `DATABASE_URL` and `DIRECT_URL`.
- Supabase Postgres as the relational database.
- Prisma migrations:
  - `20260519150000_add_full_menu_seed`
  - `20260519170000_rewards_wallet_gift_cards`
  - `20260523120000_wallet_mock_topups`
- Server actions and API routes for authenticated writes.
- Prisma interactive transactions for order placement, reward redemption, wallet top-up confirmation, gift-card purchases, gift-card cancellation, wallet adjustment, and order cancellation/refunds.
- Next.js `unstable_cache` for public reads in `lib/data.ts`.
- Cache tags:
  - `public-menu`
  - `site-info`
  - `gift-cards`
  - `rewards`
- Supabase Storage for admin-uploaded menu and gift-card images.
- Local deployable image files under `public/images/` for fixed generated product and site images.

Recent performance changes are already aligned with scalable architecture: public catalog reads are cached, public menu item loading is deferred until search/category interaction, and admin notification count no longer blocks the first admin render.

## Data Domain Classification

| Domain | Current storage | Classification | Recommendation |
|---|---|---|---|
| Users and auth profile data | Postgres `User` | A. Must stay relational / transactional | Keep relational. Email uniqueness, active status, roles, wallet balance, and reward points need consistency. |
| Menu categories | Postgres `MenuCategory` | C. Could later move to cache/search/read replica | Keep source of truth in Postgres. Serve public reads through cache. |
| Menu items | Postgres `MenuItem` | C. Could later move to cache/search/read replica | Keep canonical catalog in Postgres. Public browsing/search can later use Redis/search/document read models. |
| Orders | Postgres `Order` | A. Must stay relational / transactional | Keep relational. Orders connect users, items, payment method, rewards, wallet transactions, and notifications. |
| Order items | Postgres `OrderItem` | A. Must stay relational / transactional | Keep relational. They preserve historical unit price and subtotal. |
| Cart/order flow | Client cart plus server validation | B. Can stay relational for now if persisted later | Client cart is fine for demo. If persisted later, keep user carts relational or short-lived cache-backed. |
| Wallet balance | Postgres `User.walletBalance` | A. Must stay relational / transactional | Keep relational. This is the live balance and must be updated atomically. |
| Wallet transactions | Postgres `WalletTransaction` | A. Must stay relational / transactional | Keep relational as the wallet ledger/audit trail. |
| Wallet top-ups | Postgres `WalletTopUp` | A. Must stay relational / transactional | Keep relational. Idempotency, status, provider references, and confirmation must be consistent. |
| Gift cards | Postgres `GiftCard` | A. Must stay relational / transactional | Keep relational. Amount, balance, status, buyer, and recipient are value-bearing records. |
| Gift-card templates | Postgres `GiftCardTemplate` | C. Could later move to cache/search/read replica | Keep source in Postgres. Public active templates are safe to cache. |
| Gift-card transactions | Postgres `GiftCardTransaction` | A. Must stay relational / transactional | Keep relational for audit/history. |
| Reward rules | Postgres `RewardRule` | C. Could later move to cache/search/read replica | Keep source in Postgres. Public active rules are safe to cache. |
| Reward redemptions | Postgres `RewardRedemption` | A. Must stay relational / transactional | Keep relational. Redemptions spend points and must be auditable. |
| Reward transactions | Postgres `RewardTransaction` | A. Must stay relational / transactional | Keep relational. Points have value in the system and need a history trail. |
| Admin notifications | Postgres `Notification` | B/C. Can stay relational now; later feed/cache | Keep relational now. If high-volume, move read feed to cache or queue-backed read model. |
| Site settings/home content | Postgres `SiteInfo` | C. Could later move to cache/read model | Keep in Postgres for admin editing, serve through cache. |
| Uploaded image metadata | Image URLs in Postgres fields | B/E. Metadata relational, bytes object storage | Keep URLs in relational rows. Store actual files in Supabase Storage. |
| Fixed product/site images | `public/images/` | E. Object files, not relational rows | Keep as deployable static assets. Do not store image bytes in Postgres. |
| Admin/upload storage audit | Supabase Storage plus scripts | E/B. Object files with relational references | Keep object files in storage and audit references from relational records. |
| Analytics/events/logs if added later | Not present | D. Could later move to distributed/non-relational storage | Do not add now. Use event/analytics storage only when product metrics require it. |

## What Must Remain Relational

These domains should stay in Postgres because they require consistency, rollback safety, foreign-key relationships, and auditability:

- `User.walletBalance`
- `WalletTransaction`
- `WalletTopUp`
- `Order`
- `OrderItem`
- Wallet order payments
- Gift-card purchase, sending, balance, cancellation, and refund records
- Reward redemptions and reward point transactions
- Admin wallet/point adjustments
- Authentication roles and account activation

The existing code correctly uses Prisma transactions for the critical value-moving flows. That is the right design. Moving these domains to an eventually consistent document store or cache would increase the risk of double-crediting, negative balances, inconsistent order/payment state, and incomplete audit trails.

## What Can Later Move to Cache, Search, or Read Models

The following are good candidates for read optimization later, while keeping Postgres as the canonical source of truth:

- Public menu category browsing.
- Public menu item search.
- Active reward rule display.
- Active gift-card template display.
- Site/footer/about/location settings.
- Admin dashboard summaries.
- Notification feed reads if volume grows.

The project already started down this path with cached public data in `lib/data.ts`, a menu browsing API, and cache invalidation after admin mutations. That is enough for the current demo scale.

## Object and File Storage

Images and uploaded assets should not be stored as relational rows or byte arrays in Postgres.

Current approach is appropriate:

- Fixed generated product and site images live in `public/images/` and deploy through Vercel.
- Runtime admin uploads live in Supabase Storage.
- Database records store only `imageUrl` strings.
- Storage cleanup/audit logic checks `MenuItem.imageUrl` and `GiftCardTemplate.imageUrl` before deleting managed storage files.

This should remain the pattern.

## Is a Distributed Database Necessary Now?

No.

For this project, a distributed database would add complexity without solving the current primary limitations:

- The current row counts are small: the local check shows 204 menu items, 17 categories, 4 gift-card templates, and a very small transaction history.
- Public route slowness was already addressed by caching and deferred menu item loading.
- Private route latency is mostly remote database round-trip time and authenticated per-user reads, not a lack of distributed storage.
- Financial correctness matters more than multi-region write locality.
- A distributed database would complicate transactions, Prisma support, migrations, consistency guarantees, operational debugging, and cost.

If the app becomes a real multi-region commerce system, distributed SQL or regional replicas could be evaluated. This demo does not need that now.

## Current Bottlenecks: Architecture vs. Implementation

Most current performance constraints are not database architecture problems.

They are mainly:

- Remote Supabase latency from the app runtime location.
- Too many private/admin live reads on protected pages.
- Admin pages reading more records than needed as datasets grow.
- Lack of pagination on some admin lists.
- Potential missing indexes once order, wallet, notification, or transaction tables grow.

The recent caching and query-shaping work is the right first response. A distributed database should come much later, if metrics prove a true multi-region write problem.

## Future Scalability Plan

### Phase 1: Recommended Now

Use the current architecture:

- Supabase Postgres plus Prisma.
- Supabase pooler URL for runtime and direct URL for migrations.
- Vercel static/public image serving for fixed product images.
- Supabase Storage for admin-uploaded runtime images.
- Next.js caching/revalidation for public catalog/site data.
- Prisma transactions for financial and order flows.
- Select-only Prisma queries and batched reads.
- Progressive admin UI for heavy management screens.

This phase is enough for the test/demo website.

### Phase 2: If Traffic Grows

Add measured, targeted improvements:

- Add indexes for high-volume query patterns.
- Paginate admin order, user, notification, wallet, reward, and gift-card history pages.
- Add Redis/Upstash cache for hot public reads if Next.js cache is not enough.
- Add a search service for menu search if catalog size grows beyond simple in-memory filtering.
- Add background jobs for admin dashboard summaries and reports.
- Tune Supabase connection pooling and deployment/database regions.
- Keep cache invalidation driven by admin mutations.

Good candidates for a search layer:

- Menu item name/description/category search.
- Public category browsing.
- Possibly reward and gift-card public display if those become richer catalogs.

### Phase 3: If Very Large Scale

Only after real traffic/latency metrics justify it:

- Keep the financial core in relational Postgres.
- Move analytics/events/logs to an event store or analytics warehouse.
- Move product search to Meilisearch, Algolia, or OpenSearch.
- Use read replicas or regional replicas for public/admin read-heavy workloads.
- Build public catalog read models in cache/document storage.
- Consider distributed SQL only for real multi-region transactional requirements.

Even in this phase, wallet, gift-card balances, order payments, and reward ledgers should remain strongly consistent.

## Suggested Index and Query Improvements

No schema migration was applied in this review. The current demo dataset is small, and adding indexes without measured pressure would be premature.

If the tables grow, consider these indexes first:

- `Order(userId, createdAt)` for account order history.
- `Order(status, createdAt)` for admin dashboard/order queues.
- `Order(createdAt)` for recent order lists.
- `OrderItem(orderId)` for order detail/history joins.
- `WalletTransaction(userId, createdAt)` for wallet history.
- `WalletTopUp(userId, status, createdAt)` for pending/recent top-up lookup.
- `RewardTransaction(userId, createdAt)` for point history.
- `RewardRedemption(userId, createdAt)` for redemption history.
- `GiftCard(buyerId, createdAt)` and `GiftCard(recipientUserId, createdAt)` for gift-card history.
- `GiftCard(status, createdAt)` for admin status views.
- `Notification(isRead, createdAt)` for unread badge and notification feed.
- `MenuItem(categoryId, isAvailable, name)` for category browsing.
- `MenuItem(isAvailable, isFeatured, createdAt)` for featured menu queries.

Query recommendations:

- Keep public menu, rewards, gift-card templates, and site info behind cache tags.
- Keep private wallet/order/account data uncached.
- Paginate admin history pages before they exceed a few hundred rows.
- Avoid loading full relations in admin pages when only names/emails/totals are needed.
- Keep order placement and wallet/gift-card flows inside short, focused transactions.

## Risks of Premature Distributed Database Migration

Moving too early would introduce risks that are larger than the expected benefit:

- Harder ACID guarantees for wallet and gift-card balance updates.
- Higher chance of eventual-consistency bugs in reward or wallet ledgers.
- More complex Prisma support and migration workflows.
- Harder local development and seed/debug process.
- More operational moving parts for a demo project.
- Higher cost and more failure modes.
- More difficult admin reporting across split data stores.

The project should earn that complexity with metrics first.

## Final Recommendation

Do not implement a distributed database now.

Keep Supabase Postgres as the source of truth. Keep all financial/value-bearing domains relational and transactional. Continue using caching, query optimization, pagination, and object storage for the non-transactional surfaces.

The next architecture investment should be targeted indexes and pagination after real row counts grow, not a database replacement.
