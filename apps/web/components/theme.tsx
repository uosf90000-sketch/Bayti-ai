"use client";
import { useEffect, useState } from "react";

const KEY = "bayti.theme.v1";
type Mode = "dark" | "light";

function readMode(): Mode {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("dark");

  useEffect(() => {
    setMode(readMode());
  }, []);

  function toggle() {
    const next: Mode = mode === "light" ? "dark" : "light";
    setMode(next);
    if (next === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* private mode — theme just won't persist */
    }
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={mode === "light" ? "التبديل إلى الوضع الليلي" : "التبديل إلى الوضع النهاري"}
      title={mode === "light" ? "الوضع الليلي" : "الوضع النهاري"}
    >
      {mode === "light" ? "☾" : "☀"}
    </button>
  );
}
