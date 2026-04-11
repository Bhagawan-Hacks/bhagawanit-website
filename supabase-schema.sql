-- ==========================================
-- 1. Create Profiles Table & Policies
-- ==========================================
create table public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);


-- ==========================================
-- 2. Trigger definition to sync users
-- ==========================================
-- This automatically creates a profile row whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ==========================================
-- 3. Create Posts Table & Policies
-- ==========================================
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  image_url text not null,
  caption text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.posts enable row level security;

-- Policies for posts
create policy "Posts are viewable by everyone." on posts for select using (true);
create policy "Authenticated users can insert posts." on posts for insert with check (auth.uid() = user_id);
create policy "Users can update own posts." on posts for update using (auth.uid() = user_id);
create policy "Users can delete own posts." on posts for delete using (auth.uid() = user_id);


-- ==========================================
-- 4. Set up Storage Buckets & Policies
-- ==========================================
-- Create 'avatars' bucket (ignore errors if it already exists)
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;

create policy "Avatar images are publicly accessible." on storage.objects for select using (bucket_id = 'avatars');
create policy "Anyone can upload an avatar." on storage.objects for insert with check (bucket_id = 'avatars');


-- Create 'posts' bucket (ignore errors if it already exists)
insert into storage.buckets (id, name, public) values ('posts', 'posts', true) on conflict do nothing;

create policy "Post images are publicly accessible." on storage.objects for select using (bucket_id = 'posts');
create policy "Authenticated users can upload posts." on storage.objects for insert with check (bucket_id = 'posts' and auth.role() = 'authenticated');
