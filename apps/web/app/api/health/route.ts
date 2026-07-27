import { NextResponse } from "next/server";

/** فحص صحة خفيف لمنصات النشر (Railway healthcheck) — لا اعتماديات، استجابة فورية */
export function GET() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
