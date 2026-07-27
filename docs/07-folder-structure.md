> ⚠️ **لافتة Architecture Freeze v1.0:** هذه وثيقة تأسيسية من الجيل الأول. عند أي تعارض مع أقسام الـ PRD المعتمدة ([docs/02-prd.md](02-prd.md)) أو القاموس الرسمي في [ARCHITECTURE_FREEZE_v1.md](ARCHITECTURE_FREEZE_v1.md)، **فالـ PRD هو المرجع** (مثال: DigitalTwin لا FloorPlanGraph، وDesignVariant لا tier). إعادة كتابتها الرسمية ضمن أقسام PRD 7–12 (TD-01).

# 7. Folder Structure — هيكلة المشروع

## Monorepo (Turborepo + pnpm) + Python workspace

قرار: **Monorepo واحد** — فريق صغير، أنواع مشتركة بين الواجهة والخادم، وإصدار منسق. الـ AI Pipeline بايثون يعيش في نفس الريبو تحت `ai/` بأدواته الخاصة (uv/poetry).

```
bayti-ai/
├── README.md
├── docs/                          # الوثائق التأسيسية (هذه الوثائق)
├── turbo.json
├── pnpm-workspace.yaml
├── .github/
│   └── workflows/                 # ci.yml, deploy-api.yml, deploy-web.yml, ai-evals.yml
│
├── apps/
│   ├── web/                       # Next.js (App Router) — RTL أولًا
│   │   ├── app/
│   │   │   ├── (marketing)/       # الصفحات التسويقية
│   │   │   ├── (app)/
│   │   │   │   ├── projects/[id]/
│   │   │   │   │   ├── upload/
│   │   │   │   │   ├── review/    # مراجعة تحليل المخطط (تفاعلي SVG)
│   │   │   │   │   ├── intake/
│   │   │   │   │   ├── style/
│   │   │   │   │   ├── council/   # شاشة تقدم الوكلاء الحية
│   │   │   │   │   ├── design/    # النتائج: غرف/عناصر/3 نسخ
│   │   │   │   │   ├── shopping/
│   │   │   │   │   ├── costs/
│   │   │   │   │   └── chat/
│   │   │   └── api/               # BFF خفيف فقط (proxy/auth)
│   │   ├── components/
│   │   ├── lib/
│   │   └── messages/              # i18n: ar.json, en.json
│   │
│   └── api/                       # NestJS Core API
│       ├── src/
│       │   ├── modules/
│       │   │   ├── identity/
│       │   │   ├── projects/
│       │   │   ├── floorplan/
│       │   │   ├── design/
│       │   │   ├── catalog/
│       │   │   ├── costing/
│       │   │   ├── chat/
│       │   │   └── billing/
│       │   ├── common/            # guards, filters, interceptors, problem-details
│       │   ├── jobs/              # تعريف الـ queues وpublishers
│       │   └── main.ts
│       └── test/
│
├── packages/                      # مشترك TypeScript
│   ├── contracts/                 # ⭐ Zod schemas لكل عقود API + أنواع مشتركة
│   ├── design-schema/             # ⭐ JSON Schemas: FloorPlanGraph, AgentReports, MasterDesignDocument
│   ├── ui/                        # مكونات التصميم المشتركة (RTL-ready)
│   └── config/                    # eslint, tsconfig, tailwind preset
│
├── ai/                            # Python workspace (uv)
│   ├── pyproject.toml
│   ├── orchestrator/
│   │   ├── dag.py                 # تعريف DAG الوكلاء
│   │   ├── runner.py              # تنفيذ، retries، partial re-run
│   │   └── merger.py              # الفحوصات الحتمية + Chief Designer
│   ├── agents/
│   │   ├── base.py                # عقد الوكيل: inputs → validated JSON output
│   │   ├── architect/
│   │   ├── interior/
│   │   ├── kitchen/
│   │   ├── bathroom/
│   │   ├── landscape/
│   │   ├── lighting/
│   │   ├── electrical/
│   │   ├── hvac/
│   │   ├── furniture/
│   │   ├── cost/
│   │   └── shopping/
│   ├── prompts/                   # ⭐ prompts مُصدَّرة بملفات (versioned)
│   │   └── interior/v3.md ...
│   ├── floorplan/
│   │   ├── cad/                   # DWG/DXF parsing
│   │   ├── cv/                    # نماذج كشف الجدران/الأبواب
│   │   ├── vlm/                   # Vision-LLM extraction
│   │   └── reconcile.py           # دمج المصادر → FloorPlanGraph
│   ├── matching/                  # Product Matcher (hybrid search)
│   ├── rendering/                 # صور (diffusion+controlnet)، فيديو، pdf، 3d
│   ├── llm/                       # ⭐ طبقة موحدة: providers, caching, cost logging
│   ├── evals/
│   │   ├── golden/                # 50 مخطط ground truth
│   │   └── metrics/               # geometric validity, schema, cost accuracy
│   └── workers/                   # consumers للطوابير (entrypoints)
│
├── services/
│   └── catalog-ingestion/         # Scrapers/feeds + normalization + enrichment
│       ├── stores/                # ikea_sa/, saco/, homecentre/, abyat/ ...
│       ├── normalize/
│       └── enrich/
│
├── infra/
│   ├── docker/                    # Dockerfiles لكل تطبيق
│   ├── compose.dev.yml            # بيئة تطوير كاملة بأمر واحد
│   └── terraform/                 # لاحقًا: بيئات staging/prod
│
└── tooling/
    └── scripts/                   # seed, migrate, load-golden-set ...
```

## النقاط الحاسمة (⭐)

1. **`packages/design-schema` هو الدستور:** JSON Schemas لكل بنية بيانات AI تُستخدم من TypeScript (تحقق API) وPython (تحقق مخرجات الوكلاء) معًا — تُولَّد منها أنواع الطرفين. أي تغيير schema = مراجعة إلزامية.
2. **`packages/contracts`:** كل endpoint له Zod schema — الواجهة لا تخمّن شكل البيانات أبدًا.
3. **`ai/prompts` ملفات لا strings في الكود:** مراجعة prompts كمراجعة كود، وربط كل مخرج بنسخة الـ prompt.
4. **`ai/evals` من اليوم الأول** — يعمل في CI (`ai-evals.yml`) على عينة، وكامل الـ golden set ليليًا.
5. **`compose.dev.yml`:** مطوّر جديد يشغّل المنصة كاملة (web+api+workers+pg+redis+minio) بأمر واحد.
