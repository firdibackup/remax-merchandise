-- REMAX Gifts - clear operational data (Supabase Postgres).
-- One-off maintenance script: wipes the test data accumulated before go-live so
-- the site starts from a clean slate. Run in the Supabase SQL editor (it runs as
-- the service role); these tables have RLS enabled with NO policies, so the
-- anon/publishable key cannot touch them.
--
-- ⚠️ DESTRUCTIVE + IRREVERSIBLE. Make sure you are on the PRODUCTION project and
--    that these really are throwaway records before running section 2.
--
-- Scope:
--   Pesanan  -> orders (+ order_items, order_status_history)
--   Analitik -> events, search_logs (search keywords)
--   Leads    -> product_stats (views / cart / checkout funnel)
-- Preserved: inventory (real product stock), auth.users (customer accounts),
--            and customer_addresses (see the optional block at the bottom).

-- ── Section 1 — count rows BEFORE wiping (run this block on its own first) ──
select 'orders'               as tabel, count(*) from public.orders
union all select 'order_items',          count(*) from public.order_items
union all select 'order_status_history', count(*) from public.order_status_history
union all select 'events',               count(*) from public.events
union all select 'product_stats',        count(*) from public.product_stats
union all select 'search_logs',          count(*) from public.search_logs;

-- ── Section 2 — clear the data (run this block to actually wipe) ──
-- All FK-related tables (orders -> order_items / order_status_history) are in the
-- list, so this is safe without CASCADE and touches nothing outside the list.
truncate table
  public.order_status_history,
  public.order_items,
  public.orders,
  public.events,
  public.product_stats,
  public.search_logs;

-- ── Section 3 (optional) — also clear saved customer delivery addresses ──
-- Uncomment only if the saved address book entries are your own test data.
-- truncate table public.customer_addresses;
