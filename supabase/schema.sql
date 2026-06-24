-- ============================================================
-- 쇼핑몰 링크 디렉토리 - Supabase Schema
-- ============================================================

-- 프로필 (auth.users 확장)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- 신규 가입 시 자동으로 프로필 생성
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 카테고리 (대분류 / 소분류)
create table public.categories (
  id bigint primary key generated always as identity,
  name text not null,
  parent_id bigint references public.categories(id) on delete cascade,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 상품
create table public.products (
  id bigint primary key generated always as identity,
  title text not null,
  description text,
  image_url text,
  external_url text not null,
  category_id bigint references public.categories(id) on delete set null,
  click_count bigint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 상품 수정 시 updated_at 자동 갱신
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_updated_at
  before update on public.products
  for each row execute procedure public.update_updated_at();

-- 클릭 수 원자적 증가 함수
create or replace function public.increment_product_click(p_product_id bigint)
returns void language plpgsql security definer as $$
begin
  update public.products
  set click_count = click_count + 1
  where id = p_product_id;
end;
$$;

-- 오류 제기 (상품 정보 오류 / 링크 오류)
create table public.reports (
  id bigint primary key generated always as identity,
  product_id bigint not null references public.products(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('info', 'link')),
  description text,
  status text not null default 'pending' check (status in ('pending', 'resolved')),
  created_at timestamptz not null default now()
);

-- 최근 본 상품 (로그인 사용자)
create table public.recently_viewed (
  id bigint primary key generated always as identity,
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  unique (user_id, product_id)
);

-- 최근 본 상품 upsert 함수
create or replace function public.upsert_recently_viewed(p_user_id uuid, p_product_id bigint)
returns void language plpgsql security definer as $$
begin
  insert into public.recently_viewed (user_id, product_id, viewed_at)
  values (p_user_id, p_product_id, now())
  on conflict (user_id, product_id) do update
    set viewed_at = now();
end;
$$;

-- 공지게시판
create table public.notices (
  id bigint primary key generated always as identity,
  title text not null,
  content text not null,
  is_pinned boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger notices_updated_at
  before update on public.notices
  for each row execute procedure public.update_updated_at();

-- 사이트 설정 (하단 관리 등)
create table public.site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

-- 기본 사이트 설정 삽입
insert into public.site_settings (key, value) values
  ('copyright', '© 2024 쇼핑링크. All rights reserved.'),
  ('footer_text', '본 사이트는 외부 쇼핑몰 링크를 제공하는 서비스입니다.'),
  ('site_name', '쇼핑링크'),
  ('footer_extra', '');

-- 방문자 로그
create table public.visitor_logs (
  id bigint primary key generated always as identity,
  page text not null default '/',
  user_id uuid references public.profiles(id) on delete set null,
  visited_at timestamptz not null default now()
);

-- 일별 방문자 집계 뷰
create or replace view public.daily_visitors as
select
  date_trunc('day', visited_at)::date as visit_date,
  count(*) as visit_count,
  count(distinct user_id) as unique_user_count
from public.visitor_logs
group by date_trunc('day', visited_at)::date
order by visit_date desc;

-- ============================================================
-- RLS (Row Level Security) 설정
-- ============================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.reports enable row level security;
alter table public.recently_viewed enable row level security;
alter table public.notices enable row level security;
alter table public.site_settings enable row level security;
alter table public.visitor_logs enable row level security;

-- profiles 정책
create policy "프로필 본인 조회" on public.profiles for select using (auth.uid() = id);
create policy "관리자 전체 조회" on public.profiles for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- categories 정책 (전체 공개 읽기)
create policy "카테고리 전체 읽기" on public.categories for select using (true);
create policy "관리자 카테고리 쓰기" on public.categories for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- products 정책 (활성 상품 공개 읽기)
create policy "활성 상품 읽기" on public.products for select using (is_active = true);
create policy "관리자 상품 전체 접근" on public.products for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- reports 정책
create policy "본인 오류제기 조회" on public.reports for select using (user_id = auth.uid());
create policy "로그인 사용자 오류제기 등록" on public.reports for insert with check (user_id = auth.uid());
create policy "관리자 오류제기 전체 접근" on public.reports for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- recently_viewed 정책
create policy "본인 최근 본 상품" on public.recently_viewed for all using (user_id = auth.uid());

-- notices 정책
create policy "활성 공지 읽기" on public.notices for select using (is_active = true);
create policy "관리자 공지 전체 접근" on public.notices for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- site_settings 정책
create policy "설정 전체 읽기" on public.site_settings for select using (true);
create policy "관리자 설정 쓰기" on public.site_settings for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- visitor_logs 정책
create policy "방문자 로그 삽입" on public.visitor_logs for insert with check (true);
create policy "관리자 방문자 로그 조회" on public.visitor_logs for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
