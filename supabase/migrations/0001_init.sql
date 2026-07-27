-- Bayti AI — VS-4: مخطط قاعدة البيانات الأولي (Storage + سجل المشاريع + checkpoints التحليل)
-- يطابق ProjectStatus/UploadIntent/UploadComplete في packages/contracts/src/projects.ts (المرجع الملزم).
-- تطبيق: supabase db push  (أو  supabase migration up  محليًا بعد supabase link)

create extension if not exists "pgcrypto";

create type project_status as enum (
  'uploaded', 'analyzing', 'needs_review', 'intake', 'generating',
  'matching', 'rendering', 'ready', 'editing', 'failed'
);

-- ————— المشاريع —————
-- is_demo يسمح بمشروع مرجعي عام (فيلا حي النرجس) بلا مالك — مطابقة لبطاقة "مثال" في lib/mock.ts
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  status project_status not null default 'uploaded',
  file_name text,
  thumbnail_url text,
  current_version int,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_owner_or_demo check (
    (is_demo and user_id is null) or (not is_demo and user_id is not null)
  )
);

create index projects_user_id_idx on public.projects (user_id, updated_at desc);

create function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.projects enable row level security;

create policy projects_select on public.projects
  for select using (is_demo or user_id = auth.uid());

create policy projects_insert on public.projects
  for insert with check (not is_demo and user_id = auth.uid());

create policy projects_update on public.projects
  for update using (not is_demo and user_id = auth.uid());

create policy projects_delete on public.projects
  for delete using (not is_demo and user_id = auth.uid());

-- ————— المخططات المرفوعة (Storage) —————
-- الرفع عبر presigned URL (العميل لا يرسل الملف للـ API مباشرة) — يطابق UploadIntentInput/Output
create table public.floorplans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  file_name text not null,
  content_type text not null,
  size_bytes bigint not null,
  storage_path text not null,
  level smallint not null default 0,
  reject_reason text,
  uploaded_at timestamptz,
  created_at timestamptz not null default now()
);

create index floorplans_project_id_idx on public.floorplans (project_id, created_at desc);

alter table public.floorplans enable row level security;

create policy floorplans_all on public.floorplans
  for all using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

-- ————— نقاط استئناف التحليل (checkpoints) —————
-- قاعدة مؤسس: لا AI حقيقي قبل اكتمال الحفظ والاستئناف من checkpoint.
create table public.analysis_checkpoints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  stage text not null,
  progress_pct smallint not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index analysis_checkpoints_project_id_idx on public.analysis_checkpoints (project_id, created_at desc);

alter table public.analysis_checkpoints enable row level security;

create policy analysis_checkpoints_all on public.analysis_checkpoints
  for all using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

-- ————— Storage bucket للمخططات —————
insert into storage.buckets (id, name, public)
values ('floorplans', 'floorplans', false)
on conflict (id) do nothing;

-- مسار الكائن يبدأ بـ {user_id}/... — كل مستخدم يرى مجلده فقط
create policy floorplans_storage_rw on storage.objects
  for all using (
    bucket_id = 'floorplans' and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'floorplans' and (storage.foldername(name))[1] = auth.uid()::text
  );
