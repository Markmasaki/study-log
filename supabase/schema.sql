-- 学習記録アプリ（study-log）のテーブル。すべて sl_ で始め、既存テーブルと分ける。
-- 行はログイン中の本人だけが読み書きできる（RLS）。

create table if not exists public.sl_study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  studied_on date not null default current_date,
  minutes integer not null check (minutes > 0),
  category text not null default 'other' check (category in ('qassist','qb','other')),
  subject text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.sl_qassist_lectures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  subject text not null,
  title text not null,
  sort integer not null default 0,
  watched_on date,
  created_at timestamptz not null default now()
);

create table if not exists public.sl_qb_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  subject text not null,
  total integer not null default 0 check (total >= 0),
  answered integer not null default 0 check (answered >= 0),
  correct integer check (correct >= 0),
  round integer not null default 1 check (round >= 1),
  source text not null default 'manual' check (source in ('manual','import')),
  updated_at timestamptz not null default now(),
  unique (user_id, subject)
);

create index if not exists sl_study_sessions_user_day on public.sl_study_sessions (user_id, studied_on);
create index if not exists sl_qassist_lectures_user on public.sl_qassist_lectures (user_id, subject, sort);

alter table public.sl_study_sessions enable row level security;
alter table public.sl_qassist_lectures enable row level security;
alter table public.sl_qb_progress enable row level security;

do $$
declare t text;
begin
  foreach t in array array['sl_study_sessions','sl_qassist_lectures','sl_qb_progress'] loop
    execute format('drop policy if exists %I on public.%I', t || '_own', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t || '_own', t);
  end loop;
end $$;

-- Anki（日別の復習数・デッキ別の残り枚数）
create table if not exists public.sl_anki_daily (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day date not null,
  reviews integer not null default 0 check (reviews >= 0),
  correct integer check (correct >= 0),
  new_cards integer check (new_cards >= 0),
  minutes integer check (minutes >= 0),
  source text not null default 'manual' check (source in ('manual','import')),
  updated_at timestamptz not null default now(),
  unique (user_id, day)
);

create table if not exists public.sl_anki_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  deck text not null,
  due_new integer not null default 0 check (due_new >= 0),
  due_learn integer not null default 0 check (due_learn >= 0),
  due_review integer not null default 0 check (due_review >= 0),
  total integer check (total >= 0),
  source text not null default 'manual' check (source in ('manual','import')),
  updated_at timestamptz not null default now(),
  unique (user_id, deck)
);

alter table public.sl_anki_daily enable row level security;
alter table public.sl_anki_decks enable row level security;

do $$
declare t text;
begin
  foreach t in array array['sl_anki_daily','sl_anki_decks'] loop
    execute format('drop policy if exists %I on public.%I', t || '_own', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t || '_own', t);
  end loop;
end $$;

-- Q-Assist・総まとめ講座の章ごとのカタログ（動画数・合計秒数）と、章ごとの視聴済み本数
create table if not exists public.sl_qassist_chapters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  course text not null,
  chapter text not null,
  videos integer not null check (videos >= 0),
  seconds integer not null check (seconds >= 0),
  is_old boolean not null default false,
  is_optional boolean not null default false,
  sort integer not null default 0,
  watched integer not null default 0 check (watched >= 0),
  updated_at timestamptz not null default now(),
  unique (user_id, course, chapter),
  check (watched <= videos)
);
create index if not exists sl_qassist_chapters_user on public.sl_qassist_chapters (user_id, sort);
alter table public.sl_qassist_chapters enable row level security;
drop policy if exists sl_qassist_chapters_own on public.sl_qassist_chapters;
create policy sl_qassist_chapters_own on public.sl_qassist_chapters for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
