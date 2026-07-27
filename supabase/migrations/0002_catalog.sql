-- Bayti Catalog Builder v1 — جداول الكتالوج (Canonical Products + Merchant Offers).
-- المصدر: packages/catalog-builder/database/001_catalog.sql (نسخة مطابقة، مُضافة هنا لتطبيقها عبر Supabase CLI).
-- تطبيق: supabase db push

create table if not exists public.catalog_products (
  id text primary key,
  canonical_name_ar text,
  canonical_name_en text,
  brand text,
  category text not null,
  subcategory text,
  dimensions jsonb not null default '{}'::jsonb,
  style_tags text[] not null default '{}',
  room_tags text[] not null default '{}',
  budget_tier text,
  quality_score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.catalog_offers (
  id text primary key,
  canonical_product_id text not null references public.catalog_products(id) on delete cascade,
  merchant_name text not null,
  merchant_domain text,
  sku text,
  gtin text,
  variant_label text,
  currency text not null default 'SAR',
  price numeric(12,2),
  previous_price numeric(12,2),
  availability text not null default 'unknown',
  product_url text,
  image_urls text[] not null default '{}',
  source_checked_at date,
  needs_live_recheck boolean not null default true,
  data_source text not null default 'unknown',
  quality_score integer not null default 0,
  issues text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists catalog_products_category_idx on public.catalog_products(category);
create index if not exists catalog_offers_product_idx on public.catalog_offers(canonical_product_id);

alter table public.catalog_products enable row level security;
alter table public.catalog_offers enable row level security;

-- لا يظهر للمستخدمين إلا منتجات/عروض بجودة كافية — وعروض حقيقية فقط (data_source='real') مع رابط شراء فعلي
create policy "Public read catalog products" on public.catalog_products
  for select using (quality_score >= 60);

create policy "Public read real offers" on public.catalog_offers
  for select using (quality_score >= 60 and data_source = 'real' and product_url is not null);
