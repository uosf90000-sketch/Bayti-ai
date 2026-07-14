# 6. API Design — تصميم الواجهات البرمجية

## 1. المبادئ

- **REST + JSON** للواجهة العامة (بسيط، cacheable، مفهوم لشركاء B2B لاحقًا).
- **SSE** للتحديثات الحية (تقدم الوكلاء، اكتمال الرندر) — أبسط من WebSocket ويكفي.
- إصدار في المسار: `/api/v1/...` — عقد B2B لا يُكسر أبدًا داخل نفس الإصدار.
- كل استجابة تحمل `request_id`؛ الأخطاء بصيغة [RFC 9457 Problem Details](https://www.rfc-editor.org/rfc/rfc9457).
- المصادقة: `Authorization: Bearer <JWT>` (access قصير + refresh rotation). B2B: API Keys بنطاقات.
- Idempotency: كل POST مُنشئ يقبل `Idempotency-Key`.

## 2. خريطة الموارد

```
/api/v1
├── /auth            (otp/request, otp/verify, refresh, logout)
├── /me              (الملف الشخصي، الاشتراك، حدود الاستخدام)
├── /projects
│   ├── POST /                          إنشاء مشروع
│   ├── GET  /:id                       الحالة والملخص
│   ├── POST /:id/floorplans            رفع مخطط (multipart أو presigned S3)
│   ├── GET  /:id/floorplans/:fpId      نتيجة التحليل (FloorPlanGraph)
│   ├── PATCH /:id/floorplans/:fpId     تصحيحات المستخدم (غرف/أبعاد)
│   ├── PUT  /:id/intake                إجابات الاستبيان
│   ├── PUT  /:id/style                 النمط (عام + استثناءات غرف)
│   ├── POST /:id/generate              إطلاق مجلس الوكلاء
│   ├── GET  /:id/events        (SSE)   تقدم حي: agent_started/finished, render_ready...
│   ├── GET  /:id/design?tier=&version= MasterDesignDocument
│   ├── GET  /:id/design/items?room=&category=
│   ├── GET  /:id/costs?tier=           تكلفة غرف/أقسام/إجمالي
│   ├── GET  /:id/shopping?tier=        قائمة المنتجات + البدائل
│   ├── POST /:id/shopping/:matchId/action   {action: accept|choose_alt|remove}
│   ├── GET  /:id/renders?kind=         صور/فيديو/3D/PDF
│   ├── POST /:id/exports/pdf           توليد التقرير
│   ├── POST /:id/chat                  رسالة تعديل بالمحادثة
│   ├── GET  /:id/chat                  السجل
│   └── GET  /:id/versions              شجرة الإصدارات + مقارنة
├── /styles          كتالوج الأنماط وصورها
├── /catalog         (B2B لاحقًا) بحث المنتجات
└── /billing         (plans, checkout, webhooks/payment)
```

## 3. أمثلة عقود رئيسية

### إنشاء مشروع ورفع مخطط
```http
POST /api/v1/projects
{ "title": "فيلا حي النرجس" }
→ 201 { "id": "prj_...", "status": "uploaded" }

POST /api/v1/projects/prj_x/floorplans      (multipart: file, level=0)
→ 202 { "floorplan_id": "fp_...", "status": "analyzing" }
```

### نتيجة التحليل + تصحيح
```http
GET /api/v1/projects/prj_x/floorplans/fp_y
→ 200 {
  "status": "needs_review",
  "graph": { "floors": [...] },
  "confidence": 0.91,
  "questions": [
    { "id": "scale", "type": "reference_length",
      "text_ar": "ما طول الواجهة الأمامية بالمتر؟" }
  ]
}

PATCH /api/v1/projects/prj_x/floorplans/fp_y
{ "corrections": [
    { "op": "rename_room", "room_key": "room_12", "room_type": "majlis_men" },
    { "op": "set_reference_length", "wall_id": "w3", "length_m": 15.0 }
] }
```

### إطلاق المجلس + متابعة حية
```http
POST /api/v1/projects/prj_x/generate
{ "tiers": ["economy", "balanced", "luxury"] }
→ 202 { "run_id": "run_..." }

GET /api/v1/projects/prj_x/events        (SSE)
data: { "type": "agent_started",  "agent": "interior_designer" }
data: { "type": "agent_finished", "agent": "interior_designer", "summary_ar": "صمّمت 9 غرف بنمط New Classic..." }
data: { "type": "council_finished", "design_version": 1 }
data: { "type": "render_ready", "room_key": "room_majlis_1", "url": "..." }
```

### قائمة التسوق
```http
GET /api/v1/projects/prj_x/shopping?tier=balanced&room=room_majlis_1
→ 200 {
  "items": [{
    "design_item_id": "itm_...",
    "item_type": "sofa_3seat",
    "spec": { "dimensions_cm": [220, 95, 85], "color": "بيج", "material": "قماش كتان" },
    "quantity": 2,
    "primary": {
      "product_id": "prd_...", "name_ar": "كنبة ...", "store": "IKEA SA",
      "price": { "amount": 2795, "currency": "SAR", "as_of": "2026-07-12" },
      "url": "https://...", "image_url": "https://..."
    },
    "cheaper_alt": { ... }, "premium_alt": { ... }
  }],
  "room_total": { "amount": 18400, "currency": "SAR" }
}
```

### التعديل بالمحادثة
```http
POST /api/v1/projects/prj_x/chat
{ "message": "اجعل المجلس أفخم وغيّر لون الأرضية إلى رمادي فاتح" }
→ 202 {
  "message_id": "msg_...",
  "parsed_intent": {
    "edits": [
      { "action": "upgrade_tier", "scope": "room_majlis_1" },
      { "action": "change_spec", "scope": "room_majlis_1",
        "category": "flooring", "spec_patch": { "color": "رمادي فاتح" } }
    ]
  }
}
-- ثم عبر SSE: edit_applied { new_version: 4, cost_delta: { amount: +12300 } }
```

## 4. الأخطاء (نموذج موحد)

```json
{
  "type": "https://api.bayti.ai/errors/floorplan-unreadable",
  "title": "تعذّرت قراءة المخطط",
  "status": 422,
  "detail": "الصورة منخفضة الدقة. ارفع نسخة أوضح أو ملف PDF الأصلي.",
  "request_id": "req_7f3a..."
}
```

أكواد المجال: `floorplan-unreadable`, `scale-missing`, `quota-exceeded`, `payment-required`, `edit-ambiguous` (يرجع سؤال توضيح بدل التخمين), `render-failed`.

## 5. Rate Limits & Quotas

| الباقة | مشاريع/شهر | تعديلات محادثة/مشروع | رندر صور |
|--------|------------|----------------------|----------|
| Free | 1 (غرفة واحدة كاملة فقط) | 5 | 4 صور |
| Pro | 3 | 50 | كامل |
| Premium | 10 + أولوية طابور | غير محدود | كامل + فيديو |

- حدود تقنية عامة: 60 req/min للمستخدم، الرفع ≤ 50MB.
- الطوابير لها أولوية حسب الباقة (`priority queue`).

## 6. Webhooks (B2B — مرحلة 2)

`project.ready`, `design.updated`, `shopping.updated` — بتوقيع HMAC وretry بexponential backoff.
