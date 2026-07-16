create table if not exists catalog_products (
id text primary key, store text not null, brand text, sku text, name_ar text not null, name_en text,
category text not null, subcategory text, variant text, currency text default 'SAR',
price numeric(12,2), previous_price numeric(12,2), availability text,
width_cm numeric, depth_cm numeric, height_cm numeric, seat_width_cm numeric, seat_depth_cm numeric, seat_height_cm numeric,
material_summary text, style_tags text[] default '{}', room_tags text[] default '{}', tier text,
product_url text not null, image_url text, source_checked_at date, needs_live_recheck boolean default true,
created_at timestamptz default now(), updated_at timestamptz default now()
);