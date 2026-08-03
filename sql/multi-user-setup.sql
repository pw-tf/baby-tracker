-- ============================================================
--  Baby Tracker — multi-user isolation setup
-- ============================================================
--  Run this in the Supabase SQL editor (Dashboard > SQL Editor).
--  It is safe to run more than once.
--
--  What it does:
--    1. Reports the current state so you can see what you had before.
--    2. Turns on Row Level Security for every data table.
--    3. Adds policies so each account can only ever touch rows
--       where user_id = auth.uid().
--    4. Adds baby_name + intercom_enabled to user_preferences.
--    5. Re-checks the state so you can confirm it worked.
--
--  Run section 1 on its own FIRST and read the output. If any table
--  already has policies you wrote yourself, look at them before
--  running section 3 — it drops policies by name and recreates them.
-- ============================================================


-- ============================================================
--  SECTION 1 — Before: what does the database look like now?
-- ============================================================

-- Which tables have RLS switched on? rls_enabled must be true for all
-- four rows. If a table shows false, anyone with the anon key (which is
-- public in this app's JavaScript) can read every row in it.
select
    c.relname                          as table_name,
    c.relrowsecurity                   as rls_enabled,
    c.relforcerowsecurity              as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('feedings', 'sleeps', 'weights', 'user_preferences')
order by c.relname;

-- Which policies already exist?
select
    tablename,
    policyname,
    cmd          as applies_to,
    qual         as using_expression,
    with_check   as with_check_expression
from pg_policies
where schemaname = 'public'
  and tablename in ('feedings', 'sleeps', 'weights', 'user_preferences')
order by tablename, policyname;

-- Is any existing row missing a user_id? Rows with a null user_id become
-- invisible to everybody once the policies below are active, because
-- null = auth.uid() is never true. Fix these before continuing (see the
-- note in section 6).
select 'feedings' as table_name, count(*) as rows_with_null_user_id
from public.feedings where user_id is null
union all
select 'sleeps', count(*) from public.sleeps where user_id is null
union all
select 'weights', count(*) from public.weights where user_id is null
union all
select 'user_preferences', count(*) from public.user_preferences where user_id is null;


-- ============================================================
--  SECTION 2 — Columns needed for the app changes
-- ============================================================

-- The baby's name used to live in the browser's localStorage, which meant
-- it was per-device instead of per-account. It now lives here.
alter table public.user_preferences
    add column if not exists baby_name text;

-- Controls whether the Intercom entry point is shown for an account.
-- Defaults to false, so a newly created account never sees it.
alter table public.user_preferences
    add column if not exists intercom_enabled boolean not null default false;


-- ============================================================
--  SECTION 3 — Row Level Security
-- ============================================================
--  Every policy is the same shape: a row belongs to you when its
--  user_id matches your authenticated user id.
--
--    using      → which existing rows you may see / change / delete
--    with check → what a row is allowed to look like after you write it
--
--  Both are needed. Without "with check" on insert, an account could
--  write rows stamped with somebody else's user_id.

alter table public.feedings         enable row level security;
alter table public.sleeps           enable row level security;
alter table public.weights          enable row level security;
alter table public.user_preferences enable row level security;

-- --- feedings ---
drop policy if exists "feedings_select_own" on public.feedings;
create policy "feedings_select_own" on public.feedings
    for select to authenticated
    using (auth.uid() = user_id);

drop policy if exists "feedings_insert_own" on public.feedings;
create policy "feedings_insert_own" on public.feedings
    for insert to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "feedings_update_own" on public.feedings;
create policy "feedings_update_own" on public.feedings
    for update to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "feedings_delete_own" on public.feedings;
create policy "feedings_delete_own" on public.feedings
    for delete to authenticated
    using (auth.uid() = user_id);

-- --- sleeps ---
drop policy if exists "sleeps_select_own" on public.sleeps;
create policy "sleeps_select_own" on public.sleeps
    for select to authenticated
    using (auth.uid() = user_id);

drop policy if exists "sleeps_insert_own" on public.sleeps;
create policy "sleeps_insert_own" on public.sleeps
    for insert to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "sleeps_update_own" on public.sleeps;
create policy "sleeps_update_own" on public.sleeps
    for update to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "sleeps_delete_own" on public.sleeps;
create policy "sleeps_delete_own" on public.sleeps
    for delete to authenticated
    using (auth.uid() = user_id);

-- --- weights ---
drop policy if exists "weights_select_own" on public.weights;
create policy "weights_select_own" on public.weights
    for select to authenticated
    using (auth.uid() = user_id);

drop policy if exists "weights_insert_own" on public.weights;
create policy "weights_insert_own" on public.weights
    for insert to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "weights_update_own" on public.weights;
create policy "weights_update_own" on public.weights
    for update to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "weights_delete_own" on public.weights;
create policy "weights_delete_own" on public.weights
    for delete to authenticated
    using (auth.uid() = user_id);

-- --- user_preferences ---
drop policy if exists "user_preferences_select_own" on public.user_preferences;
create policy "user_preferences_select_own" on public.user_preferences
    for select to authenticated
    using (auth.uid() = user_id);

drop policy if exists "user_preferences_insert_own" on public.user_preferences;
create policy "user_preferences_insert_own" on public.user_preferences
    for insert to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "user_preferences_update_own" on public.user_preferences;
create policy "user_preferences_update_own" on public.user_preferences
    for update to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "user_preferences_delete_own" on public.user_preferences;
create policy "user_preferences_delete_own" on public.user_preferences
    for delete to authenticated
    using (auth.uid() = user_id);

-- Nobody signed in should be able to act as an anonymous reader. The anon
-- role is what an unauthenticated visitor gets, and it has no policies
-- above, so RLS already denies it everything. This makes that explicit.
revoke all on public.feedings         from anon;
revoke all on public.sleeps           from anon;
revoke all on public.weights          from anon;
revoke all on public.user_preferences from anon;


-- ============================================================
--  SECTION 4 — Lock down intercom_enabled
-- ============================================================
--  An account can edit its own preferences row, which would include
--  flipping its own intercom_enabled to true. Revoking the privilege on
--  just that one column means only you (via the dashboard, which uses
--  the service role and bypasses this) can grant intercom access.
--
--  Insert is restricted the same way as update. Otherwise an account
--  could delete its preferences row and insert a fresh one with
--  intercom_enabled already set to true.
--
--  Postgres has no "revoke this one column" — the grant list is
--  replaced wholesale, so this revokes the privilege on the whole table
--  and grants it back column by column. If you add a new column to
--  user_preferences later, add it to both lists below, otherwise the
--  app will not be able to write to it.

revoke update on public.user_preferences from authenticated;
revoke insert on public.user_preferences from authenticated;

grant update (birth_date, weight_unit, baby_name, updated_at)
    on public.user_preferences to authenticated;

grant insert (user_id, birth_date, weight_unit, baby_name, updated_at)
    on public.user_preferences to authenticated;


-- ============================================================
--  SECTION 5 — Turn the intercom on for your own account
-- ============================================================
--  Find your user id under Authentication > Users in the dashboard,
--  then uncomment and run this with your email address.
--
--  Leave your friend's account alone — intercom_enabled defaults to
--  false, so their account will not show the intercom.

-- update public.user_preferences
--    set intercom_enabled = true
--  where user_id = (select id from auth.users where email = 'YOUR-EMAIL-HERE');

--  If the update reports 0 rows, your preferences row does not exist yet.
--  Open the app, set a birth date, then run it again.
--
--  The intercom's Realtime room is now named after the account id
--  ('home-intercom-<your user id>') instead of the single shared room it
--  used before. Supabase Realtime rooms are open to anyone holding the
--  anon key who knows the room name, so the isolation here rests on the
--  name being an unguessable id rather than on a server-side check. That
--  is fine for a private family app. If you ever want it enforced
--  properly, switch the channel to { config: { private: true } } in
--  intercom.html and add RLS policies on realtime.messages.


-- ============================================================
--  SECTION 6 — Creating your friend's account
-- ============================================================
--  Do this in the dashboard, not here:
--
--    1. Authentication > Users > Add user > Create new user.
--    2. Enter their email and a password. Tick "Auto Confirm User"
--       so they can sign in straight away without a confirmation email.
--    3. Send them the password and have them change it later.
--
--  Their preferences row is created by the app the first time they set
--  a birth date or a name, so there is nothing else to set up. Every
--  query the app makes is filtered by user_id and now enforced by the
--  policies above, so their account starts empty and stays separate.
--
--  While you are in the dashboard, check Authentication > Sign In /
--  Providers and make sure "Allow new users to sign up" is OFF. This
--  app's anon key is published in its JavaScript, so with signups on,
--  anyone who finds the URL could create themselves an account. With it
--  off, only you can add accounts.
--
--  If section 1 reported rows with a null user_id, they are yours (they
--  predate this change) and they are now hidden from the app. Claim them
--  with your own user id before anyone else signs in:
--
--  update public.feedings
--     set user_id = (select id from auth.users where email = 'YOUR-EMAIL-HERE')
--   where user_id is null;
--  -- ...and the same for sleeps, weights, user_preferences.


-- ============================================================
--  SECTION 7 — After: confirm it worked
-- ============================================================

-- All four tables should now report rls_enabled = true.
select
    c.relname        as table_name,
    c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('feedings', 'sleeps', 'weights', 'user_preferences')
order by c.relname;

-- Each table should list four policies, and every expression should
-- mention auth.uid(). A policy whose using_expression is just "true"
-- would let any signed-in account read everything — there should be none.
select
    tablename,
    policyname,
    cmd        as applies_to,
    qual       as using_expression,
    with_check as with_check_expression
from pg_policies
where schemaname = 'public'
  and tablename in ('feedings', 'sleeps', 'weights', 'user_preferences')
order by tablename, cmd, policyname;

-- The authenticated role should hold insert/update on birth_date,
-- weight_unit, baby_name, updated_at (and user_id for insert) only.
-- intercom_enabled must NOT appear anywhere in this result.
select
    column_name,
    privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and table_name   = 'user_preferences'
  and grantee      = 'authenticated'
  and privilege_type in ('INSERT', 'UPDATE')
order by privilege_type, column_name;
