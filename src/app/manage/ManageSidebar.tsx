"use client";

import {
  BarChart2,
  Bell,
  FolderTree,
  Home,
  LogOut,
  MessageSquareWarning,
  Package,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  siteName: string;
}

const navItems = [
  { href: "/manage", label: "대시보드", icon: BarChart2, exact: true },
  { href: "/manage/categories", label: "카테고리 관리", icon: FolderTree },
  { href: "/manage/products", label: "상품 관리", icon: Package },
  { href: "/manage/notices", label: "공지사항 관리", icon: Bell },
  { href: "/manage/reports", label: "오류 제기 관리", icon: MessageSquareWarning },
  { href: "/manage/settings", label: "사이트 설정", icon: Settings },
];

export default function ManageSidebar({ siteName }: Props) {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch("/api/signout", { method: "POST" });
    } catch {}
    window.location.href = "/";
  };

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-100 min-h-screen flex flex-col">
      <div className="px-4 py-5 border-b border-gray-100">
        <Link href="/" className="text-base font-bold text-gray-900 flex items-center gap-2">
          <Home size={16} className="text-gray-400" />
          {siteName}
        </Link>
        <p className="text-xs text-gray-400 mt-0.5">관리자 페이지</p>
      </div>

      <nav className="flex-1 py-3">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-gray-900 text-white font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors w-full"
        >
          <LogOut size={15} />
          로그아웃
        </button>
      </div>
    </aside>
  );
}
