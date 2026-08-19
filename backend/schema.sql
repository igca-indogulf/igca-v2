-- IGCA MVP — Supabase/PostgreSQL schema
-- Run this entire file in Supabase SQL Editor.
create extension if not exists pgcrypto;

create type public.account_type as enum ('investor','professional','founder','advisor','student','other');
create type public.connection_status as enum ('pending','accepted','declined','blocked');
create type public.appointment_status as enum ('pending','accepted','declined','cancelled','completed');
create type public.notification_type as enum ('connection','message','appointment','system','follow');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  username text unique,
  account_type public.account_type not null default 'other',
  headline text,
  bio text,
  avatar_url text,
  location text,
  industry text,
  expertise text[] not null default '{}',
  interests text[] not null default '{}',
  company_name text,
  website text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null,
  slug text unique,
  type text,
  description text,
  location text,
  website text,
  logo_url text,
  focus text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status public.connection_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(requester_id, addressee_id),
  check(requester_id <> addressee_id)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key(conversation_id,user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check(length(trim(body)) between 1 and 5000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  notes text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(ends_at > starts_at)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check(length(trim(body)) between 1 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(post_id,user_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check(length(trim(body)) between 1 and 3000),
  created_at timestamptz not null default now()
);

create table public.saved_items (
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null check(item_type in ('post','company','profile','insight')),
  item_id uuid not null,
  created_at timestamptz not null default now(),
  primary key(user_id,item_type,item_id)
);

create table public.insights (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete set null,
  category text not null,
  title text not null,
  body text not null,
  read_minutes integer not null default 5,
  published_at timestamptz not null default now(),
  is_published boolean not null default true
);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  sector text not null,
  title text not null,
  detail text,
  stage text,
  created_at timestamptz not null default now()
);

create index profiles_search_idx on public.profiles using gin(to_tsvector('simple', coalesce(full_name,'') || ' ' || coalesce(headline,'') || ' ' || coalesce(industry,'') || ' ' || coalesce(company_name,'')));
create index messages_conversation_idx on public.messages(conversation_id,created_at);
create index notifications_user_idx on public.notifications(user_id,created_at desc);
create index connections_requester_idx on public.connections(requester_id,status);
create index connections_addressee_idx on public.connections(addressee_id,status);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,full_name,account_type)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name','New Member'),
    coalesce((new.raw_user_meta_data->>'account_type')::public.account_type,'other')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles','companies','connections','conversations','appointments','posts'] loop
    execute format('drop trigger if exists trg_%s_updated on public.%I', t,t);
    execute format('create trigger trg_%s_updated before update on public.%I for each row execute procedure public.set_updated_at()', t,t);
  end loop;
end $$;

-- RLS
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.connections enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.appointments enable row level security;
alter table public.notifications enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.comments enable row level security;
alter table public.saved_items enable row level security;
alter table public.insights enable row level security;
alter table public.opportunities enable row level security;

create policy "profiles readable" on public.profiles for select to authenticated using (true);
create policy "own profile insert" on public.profiles for insert to authenticated with check(id=auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());

create policy "companies readable" on public.companies for select to authenticated using(true);
create policy "company owner insert" on public.companies for insert to authenticated with check(owner_id=auth.uid());
create policy "company owner update" on public.companies for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());

create policy "connections visible to members" on public.connections for select to authenticated using(requester_id=auth.uid() or addressee_id=auth.uid());
create policy "connection request" on public.connections for insert to authenticated with check(requester_id=auth.uid());
create policy "connection participants update" on public.connections for update to authenticated using(requester_id=auth.uid() or addressee_id=auth.uid()) with check(requester_id=auth.uid() or addressee_id=auth.uid());

create policy "conversation members see membership" on public.conversation_members for select to authenticated using(user_id=auth.uid());
create policy "conversation member insert self" on public.conversation_members for insert to authenticated with check(user_id=auth.uid());

create policy "messages members read" on public.messages for select to authenticated using(exists(select 1 from public.conversation_members cm where cm.conversation_id=messages.conversation_id and cm.user_id=auth.uid()));
create policy "messages sender insert" on public.messages for insert to authenticated with check(sender_id=auth.uid() and exists(select 1 from public.conversation_members cm where cm.conversation_id=messages.conversation_id and cm.user_id=auth.uid()));
create policy "messages sender update" on public.messages for update to authenticated using(sender_id=auth.uid()) with check(sender_id=auth.uid());

create policy "appointments participants" on public.appointments for select to authenticated using(requester_id=auth.uid() or recipient_id=auth.uid());
create policy "appointment requester insert" on public.appointments for insert to authenticated with check(requester_id=auth.uid());
create policy "appointment participants update" on public.appointments for update to authenticated using(requester_id=auth.uid() or recipient_id=auth.uid()) with check(requester_id=auth.uid() or recipient_id=auth.uid());

create policy "own notifications" on public.notifications for select to authenticated using(user_id=auth.uid());
create policy "own notifications update" on public.notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

create policy "posts readable" on public.posts for select to authenticated using(true);
create policy "own posts insert" on public.posts for insert to authenticated with check(author_id=auth.uid());
create policy "own posts update" on public.posts for update to authenticated using(author_id=auth.uid()) with check(author_id=auth.uid());
create policy "own posts delete" on public.posts for delete to authenticated using(author_id=auth.uid());

create policy "likes readable" on public.post_likes for select to authenticated using(true);
create policy "own likes insert" on public.post_likes for insert to authenticated with check(user_id=auth.uid());
create policy "own likes delete" on public.post_likes for delete to authenticated using(user_id=auth.uid());

create policy "comments readable" on public.comments for select to authenticated using(true);
create policy "comment own insert" on public.comments for insert to authenticated with check(author_id=auth.uid());
create policy "comment own update" on public.comments for update to authenticated using(author_id=auth.uid()) with check(author_id=auth.uid());
create policy "comment own delete" on public.comments for delete to authenticated using(author_id=auth.uid());

create policy "own saves" on public.saved_items for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

create policy "insights readable" on public.insights for select to authenticated using(is_published=true or author_id=auth.uid());
create policy "opportunities readable" on public.opportunities for select to authenticated using(true);

-- Realtime for messaging/notifications.
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.connections;
