# 11. Tech Stack — الحزمة التقنية ومبرراتها

> معيار الاختيار: سرعة فريق صغير + نضج النظام البيئي + قابلية التوظيف بالسعودية/عن بُعد + لا اعتماد قاتل على مزود واحد.

## الواجهة (Frontend)

| التقنية | الاختيار | لماذا |
|---------|----------|-------|
| إطار العمل | **Next.js 15 (App Router) + React 19 + TypeScript** | SSR للتسويق وSEO، نظام i18n/RTL ناضج، أكبر سوق مواهب |
| التنسيق | **Tailwind CSS + Radix UI** (عبر packages/ui) | سرعة + RTL ممتاز (خصائص منطقية) + إتاحة (a11y) جاهزة |
| الحالة/البيانات | **TanStack Query** + Zod (من `contracts`) | تزامن خادم-عميل مُتحقق الأنواع end-to-end |
| عارض المخطط التفاعلي | **SVG + مكتبة خاصة** | التحكم الكامل بالتفاعل (تصحيح الغرف) — Canvas/WebGL لاحقًا عند الحاجة |
| 3D | **Three.js (react-three-fiber)** | القياسي للمتصفح؛ يكفي لـ 2.5D ثم الجولة الكاملة |
| i18n | **next-intl** | ar-SA أولًا + en، RTL/LTR |

## الخادم (Core API)

| التقنية | الاختيار | لماذا |
|---------|----------|-------|
| إطار العمل | **NestJS (Node 22, TypeScript)** | بنية modules تطابق الـ Modular Monolith، DI، انضباط فريق |
| ORM | **Drizzle** | SQL-first، هجرات صريحة، أداء، لا سحر مخفي |
| الطوابير | **BullMQ على Redis** | ناضج، أولويات، jobs مجدولة، يكفي حتى المرحلة B (ثم SQS/RabbitMQ إن لزم) |
| التحقق | **Zod** (مشترك مع الواجهة) | عقد واحد للطرفين |
| المصادقة | JWT خاص + مزود SMS محلي (Unifonic/Msegat) | OTP سعودي موثوق |
| الدفع | **مزود محلي: Moyasar أو Tap** | مدى + Apple Pay + STC Pay — إلزامي للسوق السعودي |

## طبقة الذكاء الاصطناعي (Python)

| التقنية | الاختيار | لماذا |
|---------|----------|-------|
| اللغة/الأدوات | **Python 3.12 + uv + Pydantic v2** | النظام البيئي للـ CV/ML؛ Pydantic = تحقق JSON Schema للوكلاء |
| LLM أساسي | **Claude (Opus/Sonnet/Haiku)** عبر طبقة موحدة خاصة | الأفضل في structured output والعربية؛ الطبقة الموحدة تمنع lock-in وتتيح failover |
| Orchestration | **كود خاص (DAG صريح)** — لا LangChain | المنطق لدينا حتمي وبسيط؛ الأطر تضيف طبقات إخفاء تضر بالتدقيق والتحكم |
| CV للمخططات | PyTorch + نماذج مفتوحة (بداية من أوزان CubiCasa5K وأشباهها) ثم fine-tune | لا يوجد API جاهز موثوق للمخططات العربية — هذا خندقنا |
| DWG/DXF | **ezdxf** + محول DWG→DXF (ODA File Converter) | المسار الحتمي الأدق |
| توليد الصور | **SDXL/Flux + ControlNet** (depth/seg من هندسة الغرفة) عبر GPU serverless (Replicate/Modal) | الصورة يجب أن تطابق الغرفة الحقيقية؛ serverless = صفر تكلفة خمول |
| PDF | Typst أو Playwright print (عربي RTL سليم) | تقارير عربية جميلة قابلة للقولبة |
| Evals | **pytest + إطار evals خاص** على Golden Set في CI | الجودة كاختبارات، لا انطباعات |

## البيانات والبنية التحتية

| التقنية | الاختيار | لماذا |
|---------|----------|-------|
| قاعدة البيانات | **PostgreSQL 16 + pgvector** (managed) | مصدر حقيقة واحد + بحث متجهي بلا نظام إضافي |
| Cache/Queue | **Redis** (managed) | ثنائي الاستخدام |
| الملفات | **S3-compatible** (مع region خليجي) + CDN (CloudFront/Cloudflare) | إقامة بيانات + سرعة |
| بحث الكتالوج | pgvector الآن → **OpenSearch** عند > 1M منتج | لا نشتري تعقيدًا مبكرًا |
| السحابة | **AWS (منطقة البحرين me-south-1)** أو GCP الدمام | إقامة بيانات خليجية + أوسع خدمات |
| الحاويات | Docker + **K8s (EKS) من المرحلة B**؛ قبلها ECS/Fargate أو PaaS | لا Kubernetes قبل الحاجة |
| IaC | **Terraform** | القياسي |
| CI/CD | **GitHub Actions** | مع الريبو |
| مراقبة | **OpenTelemetry + Grafana Cloud** + **Sentry** | tracing موحد يشمل تكلفة الـ LLM لكل مشروع |
| Feature flags | **Unleash/Flagsmith** (self-host رخيص) | إطلاق تدريجي للوكلاء الجدد |

## Ingestion (الكتالوج)

| التقنية | الاختيار | لماذا |
|---------|----------|-------|
| Scraping/Feeds | **Playwright + Crawlee** (Node) داخل `services/catalog-ingestion` | أدوات ناضجة؛ نفس لغة الفريق |
| جدولة | Cron jobs على الطوابير نفسها | لا نظام جديد |
| Enrichment | Haiku دفعات (Batch API) | توسيم ملايين المنتجات بتكلفة مقبولة |

## ما رفضناه عمدًا (وسبب الرفض)

| المرفوض | السبب |
|---------|-------|
| Microservices من اليوم الأول | فريق 4 أشخاص؛ التعقيد يقتل السرعة |
| MongoDB | بياناتنا علائقية بامتياز (تكلفة/منتجات/إصدارات) |
| LangChain/CrewAI للـ orchestration | نحتاج DAG حتميًا مُدقَّقًا؛ الأطر تخفي التحكم وتصعّب الـ debugging |
| Pinecone/Weaviate | pgvector يكفي لسنوات؛ نظام أقل = موثوقية أكثر |
| بناء نموذج توليد صور خاص الآن | التكلفة هائلة؛ ControlNet فوق نماذج جاهزة يحقق الهدف |
| GraphQL | REST + Zod يكفي؛ GraphQL يعقّد caching والأمان بلا حاجة حالية |
