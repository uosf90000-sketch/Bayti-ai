-- بيانات مرجعية: فيلا حي النرجس (PRD §6.19) كمشروع "مثال" عام — بلا مالك (is_demo=true)
-- تطبيق: supabase db reset  (يشغّل migrations ثم هذا الملف تلقائيًا)
insert into public.projects (title, status, file_name, is_demo, current_version)
values ('فيلا حي النرجس — مثال', 'ready', 'villa-najres-sample.pdf', true, 3)
on conflict do nothing;
