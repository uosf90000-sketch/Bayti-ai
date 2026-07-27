import Link from "next/link";
import { TopBar } from "@/components/ui";
import { CinematicJourney } from "@/components/cinematic/CinematicJourney";

export default function Landing() {
  return (
    <main>
      <TopBar
        action={
          <Link href="/login" className="btn btn-ghost" style={{ minHeight: 42, padding: "0 20px", fontSize: 15 }}>
            تسجيل الدخول
          </Link>
        }
      />

      <CinematicJourney />
    </main>
  );
}
