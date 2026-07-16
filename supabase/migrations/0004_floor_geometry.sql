-- Bayti AI — محرك CAD/BIM: هندسة الطابق التقريبية (جدران/فتحات/حدود غرف) المستخرجة من التحليل البصري.
-- يطابق apps/web/lib/geometry/types.ts (المرجع الملزم). تطبيق: supabase db push

create table public.floor_geometries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  scale jsonb not null, -- CoordinateScale: {status, meters_per_unit, source}
  walls jsonb not null, -- WallSegment[]
  openings jsonb not null, -- Opening[]
  rooms jsonb not null, -- RoomGeometry[] — فقط الغرف التي أمكن تحديد حدودها فعليًا
  overall_confidence numeric not null check (overall_confidence between 0 and 1),
  analyzed_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index floor_geometries_project_id_idx on public.floor_geometries (project_id, created_at desc);

alter table public.floor_geometries enable row level security;

create policy floor_geometries_all on public.floor_geometries
  for all using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );
