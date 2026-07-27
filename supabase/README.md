# Supabase — VS-4

مخطط قاعدة البيانات جاهز بالكامل بدون اتصال حي. الخطوة الوحيدة المتبقية عند توفر مشروع حقيقي:

```bash
supabase link --project-ref <your-project-ref>
supabase db push        # يطبّق migrations/0001_init.sql
supabase db reset       # (بيئة تطوير فقط) يطبّق migrations ثم seed.sql
```

ثم في `apps/web/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
NEXT_PUBLIC_USE_MOCK_PROJECTS=false
```

`USE_MOCK_PROJECTS=false` يفعّل سجل المشاريع الحقيقي + Storage الحقيقي للمخططات + checkpoints التحليل —
**لكنه يتطلب أيضًا مصادقة Supabase حقيقية** (auth.uid() تُستخدم في كل RLS policy). المصادقة (OTP) ما زالت mock
عمدًا في هذه المرحلة (خارج نطاق VS-4 كما حدده المؤسس) — تفعيلها الكامل خطوة لاحقة منفصلة. إلى أن تُفعَّل،
إطفاء `USE_MOCK_PROJECTS` بدون مصادقة حقيقية سيفشل بوضوح (`لا توجد جلسة Supabase`) بدل أن يتصرف بصمت — بالتصميم.

## البنية

- `migrations/0001_init.sql` — `projects` (بحالة `is_demo` لمشروع مرجعي عام)، `floorplans` (رفع presigned)، `analysis_checkpoints` (استئناف التحليل)، Storage bucket `floorplans` بسياسات RLS كاملة.
- `seed.sql` — يزرع مشروع "فيلا حي النرجس — مثال" (`is_demo=true`) المطابق لبيانات mock الحالية.
