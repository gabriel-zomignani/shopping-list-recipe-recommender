-- Phase 2 Auth + DB baseline
create extension if not exists pgcrypto;

create table if not exists public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My Shopping List',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.shopping_lists(id) on delete cascade,
  name text not null,
  normalized_name text not null,
  quantity numeric,
  unit text,
  checked boolean not null default false,
  source text not null default 'manual' check (source in ('manual', 'recipe', 'receipt')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.favorite_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.history_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  payload_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_shopping_lists_user_id on public.shopping_lists(user_id);
create index if not exists idx_shopping_items_list_id on public.shopping_items(list_id);
create index if not exists idx_shopping_items_normalized_name on public.shopping_items(normalized_name);
create index if not exists idx_favorite_recipes_user_id on public.favorite_recipes(user_id);
create index if not exists idx_history_sessions_user_id on public.history_sessions(user_id);

alter table public.shopping_lists enable row level security;
alter table public.shopping_items enable row level security;
alter table public.favorite_recipes enable row level security;
alter table public.history_sessions enable row level security;

-- shopping_lists policies
drop policy if exists shopping_lists_select_own on public.shopping_lists;
create policy shopping_lists_select_own
  on public.shopping_lists
  for select
  using (auth.uid() = user_id);

drop policy if exists shopping_lists_insert_own on public.shopping_lists;
create policy shopping_lists_insert_own
  on public.shopping_lists
  for insert
  with check (auth.uid() = user_id);

drop policy if exists shopping_lists_update_own on public.shopping_lists;
create policy shopping_lists_update_own
  on public.shopping_lists
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists shopping_lists_delete_own on public.shopping_lists;
create policy shopping_lists_delete_own
  on public.shopping_lists
  for delete
  using (auth.uid() = user_id);

-- shopping_items policies (ownership through parent list)
drop policy if exists shopping_items_select_own on public.shopping_items;
create policy shopping_items_select_own
  on public.shopping_items
  for select
  using (
    exists (
      select 1
      from public.shopping_lists lists
      where lists.id = shopping_items.list_id
        and lists.user_id = auth.uid()
    )
  );

drop policy if exists shopping_items_insert_own on public.shopping_items;
create policy shopping_items_insert_own
  on public.shopping_items
  for insert
  with check (
    exists (
      select 1
      from public.shopping_lists lists
      where lists.id = shopping_items.list_id
        and lists.user_id = auth.uid()
    )
  );

drop policy if exists shopping_items_update_own on public.shopping_items;
create policy shopping_items_update_own
  on public.shopping_items
  for update
  using (
    exists (
      select 1
      from public.shopping_lists lists
      where lists.id = shopping_items.list_id
        and lists.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.shopping_lists lists
      where lists.id = shopping_items.list_id
        and lists.user_id = auth.uid()
    )
  );

drop policy if exists shopping_items_delete_own on public.shopping_items;
create policy shopping_items_delete_own
  on public.shopping_items
  for delete
  using (
    exists (
      select 1
      from public.shopping_lists lists
      where lists.id = shopping_items.list_id
        and lists.user_id = auth.uid()
    )
  );

-- favorite_recipes policies
drop policy if exists favorite_recipes_select_own on public.favorite_recipes;
create policy favorite_recipes_select_own
  on public.favorite_recipes
  for select
  using (auth.uid() = user_id);

drop policy if exists favorite_recipes_insert_own on public.favorite_recipes;
create policy favorite_recipes_insert_own
  on public.favorite_recipes
  for insert
  with check (auth.uid() = user_id);

drop policy if exists favorite_recipes_update_own on public.favorite_recipes;
create policy favorite_recipes_update_own
  on public.favorite_recipes
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists favorite_recipes_delete_own on public.favorite_recipes;
create policy favorite_recipes_delete_own
  on public.favorite_recipes
  for delete
  using (auth.uid() = user_id);

-- history_sessions policies
drop policy if exists history_sessions_select_own on public.history_sessions;
create policy history_sessions_select_own
  on public.history_sessions
  for select
  using (auth.uid() = user_id);

drop policy if exists history_sessions_insert_own on public.history_sessions;
create policy history_sessions_insert_own
  on public.history_sessions
  for insert
  with check (auth.uid() = user_id);

drop policy if exists history_sessions_update_own on public.history_sessions;
create policy history_sessions_update_own
  on public.history_sessions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists history_sessions_delete_own on public.history_sessions;
create policy history_sessions_delete_own
  on public.history_sessions
  for delete
  using (auth.uid() = user_id);
