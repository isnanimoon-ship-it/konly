"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // 관리자/인증 페이지는 추적하지 않음
    if (pathname.startsWith("/manage") || pathname.startsWith("/auth")) return;

    // 하루에 한 번만 카운팅
    const today = new Date().toISOString().slice(0, 10);
    const lastTracked = localStorage.getItem("visitor_last_tracked");
    if (lastTracked === today) return;

    localStorage.setItem("visitor_last_tracked", today);
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: pathname }),
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 마운트 시 1회만 실행 (레이아웃은 내비게이션해도 언마운트되지 않음)

  return null;
}
