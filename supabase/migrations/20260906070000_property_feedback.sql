-- Property testimonials, reviews, likes, and comments
create table if not exists public.property_testimonials (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  author_role text not null check (author_role in ('owner', 'tenant')),
  author_name text not null,
  subject_property_id uuid references public.properties(id) on delete set null,
  subject_label text not null,
  quote text not null check (char_length(quote) between 20 and 1000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.property_reviews (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  author_role text not null check (author_role in ('owner', 'tenant')),
  author_name text not null,
  rating integer not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 10 and 1000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.property_review_likes (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.property_reviews(id) on delete cascade,
  visitor_id text not null,
  created_at timestamptz not null default now(),
  unique(review_id, visitor_id)
);

create table if not exists public.property_review_comments (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.property_reviews(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null,
  body text not null check (char_length(body) between 2 and 500),
  created_at timestamptz not null default now()
);

alter table public.property_testimonials enable row level security;
alter table public.property_reviews enable row level security;
alter table public.property_review_likes enable row level security;
alter table public.property_review_comments enable row level security;

grant select on public.property_testimonials, public.property_reviews, public.property_review_likes, public.property_review_comments to anon, authenticated;
grant insert, update on public.property_testimonials, public.property_reviews to authenticated;
grant insert, delete on public.property_review_likes to anon, authenticated;
grant insert on public.property_review_comments to authenticated;

drop policy if exists property_testimonials_public_read on public.property_testimonials;
create policy property_testimonials_public_read on public.property_testimonials for select using (status = 'approved');
drop policy if exists property_testimonials_submit on public.property_testimonials;
create policy property_testimonials_submit on public.property_testimonials for insert to authenticated with check (author_id = auth.uid());
drop policy if exists property_testimonials_owner_manage on public.property_testimonials;
create policy property_testimonials_owner_manage on public.property_testimonials for update to authenticated using (author_id = auth.uid() and status = 'pending');
drop policy if exists property_testimonials_staff_manage on public.property_testimonials;
create policy property_testimonials_staff_manage on public.property_testimonials for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

drop policy if exists property_reviews_public_read on public.property_reviews;
create policy property_reviews_public_read on public.property_reviews for select using (status = 'approved');
drop policy if exists property_reviews_submit on public.property_reviews;
create policy property_reviews_submit on public.property_reviews for insert to authenticated with check (author_id = auth.uid());
drop policy if exists property_reviews_staff_manage on public.property_reviews;
create policy property_reviews_staff_manage on public.property_reviews for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

drop policy if exists property_review_likes_public_read on public.property_review_likes;
create policy property_review_likes_public_read on public.property_review_likes for select using (true);
drop policy if exists property_review_likes_insert on public.property_review_likes;
create policy property_review_likes_insert on public.property_review_likes for insert with check (true);
drop policy if exists property_review_likes_delete on public.property_review_likes;
create policy property_review_likes_delete on public.property_review_likes for delete using (true);

drop policy if exists property_review_comments_public_read on public.property_review_comments;
create policy property_review_comments_public_read on public.property_review_comments for select using (true);
drop policy if exists property_review_comments_insert on public.property_review_comments;
create policy property_review_comments_insert on public.property_review_comments for insert to authenticated with check (author_id = auth.uid());
drop policy if exists property_review_comments_staff_manage on public.property_review_comments;
create policy property_review_comments_staff_manage on public.property_review_comments for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
