# Architecture Decision Records — Bayti AI

> 🔒 **Architecture v1.0 (Frozen) — صادق المؤسس على Architecture Freeze v1.0 بتاريخ 2026-07-15** (مصادقة مشروطة نُفِّذت شروطها: تطبيق F-03/F-04/F-05/F-07 + إضافة ADR-030..032). القرارات ADR-001 → ADR-032 كلها بحالة **Active** — صفر تعارضات، وكلها ببدائل مرفوضة موثقة. **أي تغيير معماري من الآن يتطلب ADR جديدًا معتمدًا من المؤسس قبل التنفيذ — لا استثناءات.**

> **السجل الرسمي المجمع لكل القرارات المعمارية التي يصعب عكسها.**
> كل قرار: السياق، القرار، البدائل المرفوضة (مع سبب الرفض)، والعواقب.
> القاعدة: أي قرار جديد من هذا النوع **لا يُعتمد قبل تسجيله هنا**. التفاصيل الكاملة في أقسام الـ PRD المشار إليها.

| ID | القرار | الحالة | المرجع |
|----|--------|--------|--------|
| ADR-001 | Modular Monolith + AI Workers منفصلة (لا Microservices مبكرة) | ✅ معتمد | [Software Architecture §5](03-software-architecture.md) |
| ADR-002 | TypeScript للـ Core API وPython لطبقة AI | ✅ معتمد | [Software Architecture §5](03-software-architecture.md) |
| ADR-003 | PostgreSQL + pgvector كمصدر حقيقة واحد | ✅ معتمد | [Software Architecture §5](03-software-architecture.md) |
| ADR-004 | كل مخرجات الوكلاء JSON Schema صارم | ✅ معتمد | [Software Architecture §5](03-software-architecture.md) |
| ADR-005 | إعادة تشغيل جزئية (per-agent) للتعديلات | ✅ معتمد | [Software Architecture §5](03-software-architecture.md) |
| ADR-006 | Multi-locale/currency في الـ schema من اليوم الأول | ✅ معتمد | [Software Architecture §5](03-software-architecture.md) |
| ADR-007 | ترتيب المعالجة الملزم: Rule Engine → AI → Validation → Twin → Rendering | ✅ معتمد (P12) | [PRD §1.9](02-prd.md) |
| ADR-008 | تمثيل الـ Digital Twin: JSON هندسي هرمي (لا IFC/BIM، لا صور، لا Scene Graph) | ✅ معتمد | [PRD §4.0 ADR-4.1](02-prd.md) |
| ADR-009 | ثلاثة مسارات تحليل متخصصة (CAD / Vector-PDF / Raster) تصب في Reconciler واحد | ✅ معتمد | [PRD §4.0 ADR-4.2](02-prd.md) |
| ADR-010 | الـ Pipeline آلة حالات بـ checkpoints وإبطال انتقائي | ✅ معتمد | [PRD §4.0 ADR-4.3](02-prd.md) |
| ADR-011 | الثقة معايَرة إحصائيًا على Golden Set (لا أرقام نماذج خام) | ✅ معتمد | [PRD §4.0 ADR-4.4](02-prd.md) |
| ADR-012 | المتر float64 وحدة داخلية موحدة + tolerances في config | ✅ معتمد | [PRD §4.16 ADR-4.5](02-prd.md) |
| ADR-013 | الذوق: StyleVector بـ 10 أبعاد مسماة متصلة (لا enum فقط، لا embedding معتم) | ✅ معتمد | [PRD §5.0 ADR-5.1](02-prd.md) |
| ADR-014 | مخرجات الاستبيان كيانات مُنمَّطة منفصلة (لا blob واحد) | ✅ معتمد | [PRD §5.0 ADR-5.2](02-prd.md) |
| ADR-015 | نقل التفضيلات للذاكرة العامة بموافقة صريحة فقط (لا تعلم صامت) | ✅ معتمد | [PRD §5.0 ADR-5.3](02-prd.md) |
| ADR-016 | مجلس وكلاء متخصصين بـ DAG حتمي (لا orchestration بأطر LangChain/CrewAI) | ✅ معتمد | [AI Architecture §1,§6](04-ai-architecture.md)، [Tech Stack](11-tech-stack.md) |
| ADR-017 | كل Threshold/مهلة/سقف في Configuration مُدار بالإصدارات — ليس في الكود | ✅ معتمد (معيار 1.10-5) | [PRD §1.10](02-prd.md) |
| ADR-018 | معمارية المقترحات: الوكلاء يقترحون ولا يكتبون — الكتابة حصرية لـ Merge Engine | ✅ معتمد | [PRD §6.1 ADR-6.1](02-prd.md) |
| ADR-019 | سجل وكلاء تصريحي (Agent Manifests في config) — لا pipeline مكتوب صلبًا | ✅ معتمد | [PRD §6.1 ADR-6.2](02-prd.md) |
| ADR-020 | حسابات التفسير كمراجع معادلات مسجلة قابلة لإعادة التشغيل — لا نصوص حرة | ✅ معتمد | [PRD §6.5 ADR-6.3](02-prd.md) |
| ADR-021 | إنارة وكهرباء على مرحلتين بنسخ وسيطة مجمدة (LA/LT + RoughIn/Final) — لا حلقات تفاوض بين الوكلاء | ✅ معتمد | [PRD §6.6 ADR-6.4](02-prd.md) |
| ADR-022 | القواعد الهندسية بيانات تصريحية في Rule Packs مُصدَّرة يقيّمها محرك حتمي واحد | ✅ معتمد | [PRD §6.8 ADR-6.5](02-prd.md) |
| ADR-023 | ترتيب الأحداث بـ sequence_number ذري لكل مشروع — المستهلك يرفض الأحداث الأقدم | ✅ معتمد | [PRD §6.6](02-prd.md) |
| ADR-024 | دمج ذري بحارس دلالي: transactional merge على نسخة معزولة + semantic validation قبل التجميد — فشل = rollback كامل | ✅ معتمد | [PRD §6.14 ADR-6.6](02-prd.md) |
| ADR-025 | قانون تغييرات التوأم: Atomic · Immutable · Traceable · Replayable · Reversible — يسري على كل مسار كتابة بلا استثناء إداري | ✅ معتمد | [PRD §6.15 ADR-6.7](02-prd.md) |
| ADR-026 | طبقة محاكاة حتمية (2D swept-volumes) كبوابة اعتماد التصميم — أي تعارض يمنع الاعتماد | ✅ معتمد | [PRD §6.17](02-prd.md) |
| ADR-027 | النسخ الثلاث ملفات معايرة (variants) فوق توأم واحد — لا ثلاث جولات مجلس مستقلة | ✅ معتمد | [PRD §6.20 ADR-6.8](02-prd.md) |
| ADR-028 | دورة حياة التكلفة الثلاثية Estimate→Quote→Actual مع Price Confidence لكل بند | ✅ معتمد | [PRD §6.21](02-prd.md) |
| ADR-029 | تطوير الـ Schemas: additive-first + major version بهجرة مُختبرة ونافذة قراءة مزدوجة — المشاريع القديمة تُقرأ بإصداراتها | ✅ معتمد | [PRD §6.27 ADR-6.9](02-prd.md) |
| ADR-030 | **Canonical Truth:** كل معلومة لها مصدر حقيقة واحد فقط — DigitalTwin للهندسة، Rule Engine للقواعد، StyleVector للذوق، Budget Allocation Engine للميزانية، Project Timeline للتسلسل الزمني. لا يُسمح بنسختين من الحقيقة أبدًا | ✅ معتمد (قرار مؤسس مباشر) | [PROJECT_CONSTITUTION.md](PROJECT_CONSTITUTION.md) |
| ADR-031 | **AI Is Advisory:** الذكاء الاصطناعي يقترح ولا يغيّر بيانات المشروع مباشرة — كل تعديل دائم مهما صغر يمر عبر `Proposal → Rule Engine → Conflict Resolver → Merge Engine → Digital Twin` (يعمّم ADR-018 على كل مسار AI بما فيه المحادثة والتعديلات البسيطة) | ✅ معتمد (قرار مؤسس مباشر) | [PROJECT_CONSTITUTION.md](PROJECT_CONSTITUTION.md) |
| ADR-032 | **UI Independence:** واجهة المستخدم ليست مصدر بيانات — Web/iOS/Android/Vision Pro/Desktop كلها قابلة للاستبدال دون أي تغيير في الـ Domain Model؛ كل منطق المجال خلف الـ API | ✅ معتمد (قرار مؤسس مباشر) | [PROJECT_CONSTITUTION.md](PROJECT_CONSTITUTION.md) |
| ADR-033 | **Canonical Product Model:** منتج واحد بعروض متعددة (CanonicalProduct + Offers) — لا تكرار المنتج لكل متجر | ✅ معتمد (باعتماد القسم 7) | [PRD §7.0 ADR-7.1](02-prd.md) |
| ADR-034 | Knowledge Graph كعلاقات مُنمَّطة مفسَّرة فوق PostgreSQL — لا قاعدة graph مخصصة الآن | ✅ معتمد (باعتماد القسم 7) | [PRD §7.0 ADR-7.2](02-prd.md) |
| ADR-035 | Offline-First Catalog: وقت الطلب لا يلمس أي موقع خارجي أبدًا — الجلب بخط ingestion مستقل قانوني | ✅ معتمد (باعتماد القسم 7) | [PRD §7.0 ADR-7.3](02-prd.md) |
| ADR-036 | التجارة الوحدوية (مواد البناء m2/liter/lm) مواطن درجة أولى في نموذج المنتج + حاسبات كميات من التوأم | ✅ معتمد (باعتماد القسم 7) | [PRD §7.0 ADR-7.4](02-prd.md) |

---

## نموذج تسجيل قرار جديد (يُنسخ ويُملأ)

```markdown
## ADR-0XX · عنوان القرار
- **التاريخ:** YYYY-MM-DD · **الحالة:** مقترح | معتمد | ملغى (يحل محله ADR-0YY)
- **السياق:** ما المشكلة ولماذا القرار مطلوب الآن؟
- **القرار:** ما الذي قررناه بصيغة قاطعة.
- **البدائل المرفوضة:** كل بديل + سبب رفضه المحدد.
- **العواقب:** ما الذي يصبح أسهل، وما الذي يصبح أصعب، وما الذي يصبح مستحيلًا.
- **المرجع:** رابط القسم التفصيلي في الـ PRD/الوثائق.
```

## قواعد إدارة السجل

1. القرار يُسجَّل **قبل** التنفيذ لا بعده.
2. لا يُحذف قرار أبدًا — الإلغاء بقرار جديد يشير للقديم (نفس مبدأ P7).
3. مراجعة ربع سنوية: هل ما زالت مبررات كل قرار قائمة؟
4. أي PR يغيّر قرارًا معماريًا يُرفض إن لم يرافقه تحديث لهذا السجل.
