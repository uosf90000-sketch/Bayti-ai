# Architecture Decision Records — Bayti AI

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
