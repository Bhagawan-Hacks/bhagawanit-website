-- ==========================================
-- 1. Create Profiles Table & Policies
-- ==========================================
-- We use 'if not exists' so it doesn't crash if you already created it
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text,
  role text default 'client' check (role in ('client', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

-- Ignore errors if policies already exist by dropping them first
drop policy if exists "Public profiles are viewable by everyone." on profiles;
drop policy if exists "Users can insert their own profile." on profiles;
drop policy if exists "Users can update own profile." on profiles;

create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);


-- ==========================================
-- 2. Trigger definition to sync users
-- ==========================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    'client'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ==========================================
-- 3. Create Posts Table & Policies
-- ==========================================
create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  image_url text not null,
  caption text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.posts enable row level security;

drop policy if exists "Posts are viewable by everyone." on posts;
drop policy if exists "Authenticated users can insert posts." on posts;
drop policy if exists "Users can update own posts." on posts;
drop policy if exists "Users can delete own posts." on posts;

create policy "Posts are viewable by everyone." on posts for select using (true);
create policy "Authenticated users can insert posts." on posts for insert with check (auth.uid() = user_id);
create policy "Users can update own posts." on posts for update using (auth.uid() = user_id);
create policy "Users can delete own posts." on posts for delete using (auth.uid() = user_id);


-- ==========================================
-- 4. Set up Storage Buckets & Policies
-- ==========================================
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;

drop policy if exists "Avatar images are publicly accessible." on storage.objects;
drop policy if exists "Anyone can upload an avatar." on storage.objects;

create policy "Avatar images are publicly accessible." on storage.objects for select using (bucket_id = 'avatars');
create policy "Anyone can upload an avatar." on storage.objects for insert with check (bucket_id = 'avatars');


insert into storage.buckets (id, name, public) values ('posts', 'posts', true) on conflict do nothing;

drop policy if exists "Post images are publicly accessible." on storage.objects;
drop policy if exists "Authenticated users can upload posts." on storage.objects;

create policy "Post images are publicly accessible." on storage.objects for select using (bucket_id = 'posts');
-- ==========================================
-- 5. Create Meetings Table & Policies
-- ==========================================
create table if not exists public.meetings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  full_name text not null,
  email text not null,
  phone text,
  company text,
  service text,
  budget text,
  message text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  meeting_date text,
  meeting_time text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.meetings enable row level security;

-- Users can view their own meetings
create policy "Users can view own meetings" on public.meetings
  for select using (auth.uid() = user_id);

-- Users can insert their own meetings
create policy "Users can insert own meetings" on public.meetings
  for insert with check (auth.uid() = user_id);

-- Admin role check function (Optimization)
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Admin can view all meetings
create policy "Admin can view all meetings" on public.meetings
  for select using ( public.is_admin() );

-- Admin can update meetings (approve/reject)
create policy "Admin can update meetings" on public.meetings
  for update using ( public.is_admin() );

-- NOTE: To make yourself admin, run this in SQL Editor:
-- UPDATE public.profiles SET role = 'admin' WHERE id = 'YOUR_USER_ID';
