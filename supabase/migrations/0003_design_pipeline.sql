-- Bayti AI — خط الإنتاج الحقيقي (Real Design Pipeline): حفظ نتائج التحليل والتصميم والتسوق والتكلفة والإصدارات.
-- يطابق apps/web/lib/design/types.ts و apps/web/lib/twin.ts (المرجع الملزم). تطبيق: supabase db push

-- ————— نتيجة تحليل المخطط الحقيقي (يحل محل/يوازي twinStore المحلي) —————
create table public.floorplan_analyses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  source text not null check (source in ('vlm', 'mock')),
  overall_confidence numeric not null check (overall_confidence between 0 and 1),
  analyzed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index floorplan_analyses_project_id_idx on public.floorplan_analyses (project_id, created_at desc);

alter table public.floorplan_analyses enable row level security;

create policy floorplan_analyses_all on public.floorplan_analyses
  for all using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

-- ————— Room Objects (كائن مستقل لكل غرفة مكتشفة فعليًا — لا دمج، لا اختراع) —————
create table public.room_objects (
  id text primary key, -- يطابق AnalyzedRoom.id / RoomObject.id من apps/web/lib/twin.ts
  project_id uuid not null references public.projects(id) on delete cascade,
  floorplan_analysis_id uuid not null references public.floorplan_analyses(id) on delete cascade,
  room_type text not null,
  name_ar text not null,
  area_m2 numeric,
  dimensions jsonb, -- {width, length, height} أو null — P9: لا تخمين
  confidence numeric not null check (confidence between 0 and 1),
  created_at timestamptz not null default now()
);

create index room_objects_project_id_idx on public.room_objects (project_id);
create index room_objects_floorplan_analysis_id_idx on public.room_objects (floorplan_analysis_id);

alter table public.room_objects enable row level security;

create policy room_objects_all on public.room_objects
  for all using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

-- ————— Design Results (مخرج Design Engine لكل غرفة على حدة) —————
create table public.room_designs (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.room_objects(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  style_ar text not null,
  summary_ar text not null,
  palette jsonb not null,
  materials jsonb not null,
  furniture jsonb not null,
  lighting jsonb not null,
  confidence numeric not null check (confidence between 0 and 1),
  created_at timestamptz not null default now()
);

create index room_designs_room_id_idx on public.room_designs (room_id, created_at desc);
create index room_designs_project_id_idx on public.room_designs (project_id);

alter table public.room_designs enable row level security;

create policy room_designs_all on public.room_designs
  for all using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

-- ————— Shopping Matches (مطابقة كل عنصر تصميم بمنتج حقيقي من الكتالوج — أو "لا يوجد" صراحة) —————
create table public.shopping_matches (
  id uuid primary key default gen_random_uuid(),
  room_design_id uuid not null references public.room_designs(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  item jsonb not null, -- FurnitureItem أو MaterialSpec الأصلي من التصميم
  matched boolean not null,
  product_id text references public.catalog_products(id),
  product_name text,
  price numeric(12,2),
  product_url text,
  merchant_name text,
  created_at timestamptz not null default now(),
  constraint shopping_matches_matched_has_product check (
    (matched and product_id is not null) or (not matched and product_id is null)
  )
);

create index shopping_matches_room_design_id_idx on public.shopping_matches (room_design_id);
create index shopping_matches_project_id_idx on public.shopping_matches (project_id);

alter table public.shopping_matches enable row level security;

create policy shopping_matches_all on public.shopping_matches
  for all using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

-- ————— Cost Summary (Cost Engine — من عناصر مطابقة بسعر حقيقي فقط، لا رقم مُخترع) —————
create table public.cost_summaries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  total numeric(14,2) not null,
  by_room jsonb not null,
  by_category jsonb not null,
  unpriced_item_count int not null default 0,
  computed_at timestamptz not null default now()
);

create index cost_summaries_project_id_idx on public.cost_summaries (project_id, computed_at desc);

alter table public.cost_summaries enable row level security;

create policy cost_summaries_all on public.cost_summaries
  for all using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

-- ————— Versions (P7 — إصدارات غير قابلة للحذف/التعديل؛ الاستعادة تنشئ إصدارًا جديدًا) —————
create table public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  version_number int not null,
  label text,
  snapshot jsonb not null, -- ProjectPipeline كاملة عند هذا الإصدار (لقطة غير قابلة للتعديل)
  created_at timestamptz not null default now(),
  unique (project_id, version_number)
);

create index project_versions_project_id_idx on public.project_versions (project_id, version_number desc);

alter table public.project_versions enable row level security;

-- قراءة وإدراج فقط — لا update ولا delete (P7: لا حذف، الاستعادة تُنشئ إصدارًا جديدًا لا تُعدّل قديمًا)
create policy project_versions_select on public.project_versions
  for select using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

create policy project_versions_insert on public.project_versions
  for insert with check (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );
