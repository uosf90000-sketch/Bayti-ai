import Link from "next/link";

export function Nav() {
  return (
    <nav className="hp2-nav">
      <span className="hp2-nav-mark">بيتي</span>
      <div className="hp2-nav-links">
        <a href="#how">كيف يعمل</a>
        <a href="#experience">التجربة</a>
        <a href="#pricing">الأسعار</a>
      </div>
      <Link href="/login" className="hp2-nav-login">دخول</Link>
    </nav>
  );
}
