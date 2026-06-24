"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import {
  Bookmark,
  BookmarkCheck,
  History,
  LogIn,
  LogOut,
  Menu,
  Search,
  Settings,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Modal from "@/components/ui/Modal";

interface HeaderProps {
  siteName?: string;
}

export default function Header({ siteName = "쇼핑링크" }: HeaderProps) {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bookmarkModalOpen, setBookmarkModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/signout", { method: "POST" });
    } catch {
    } finally {
      window.location.href = "/";
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            {/* 로고 */}
            <Link
              href="/"
              className="text-xl font-bold text-gray-900 shrink-0 tracking-tight"
            >
              {siteName}
            </Link>

            {/* 검색바 (데스크탑) */}
            <form
              onSubmit={handleSearch}
              className="hidden sm:flex flex-1 max-w-xl"
            >
              <div className="relative w-full">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="상품명으로 검색..."
                  className="input pl-9 pr-4 py-2 text-sm"
                />
              </div>
            </form>

            {/* 우측 액션 */}
            <div className="flex items-center gap-1 ml-auto">
              {/* 즐겨찾기 버튼 */}
              <button
                onClick={() => setBookmarkModalOpen(true)}
                className="btn-ghost text-gray-500"
                title="즐겨찾기 추가"
              >
                <Bookmark size={18} />
              </button>

              {/* 최근 본 상품 */}
              <Link href="/recent" className="btn-ghost text-gray-500">
                <History size={18} />
              </Link>

              {/* 공지사항 */}
              <Link
                href="/notices"
                className="hidden sm:flex btn-ghost text-gray-500 text-sm"
              >
                공지
              </Link>

              {/* 로그인/유저 메뉴 */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="btn-ghost text-gray-700 text-sm font-medium"
                  >
                    {user.email?.split("@")[0]}
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-50">
                      {isAdmin && (
                        <Link
                          href="/manage"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Settings size={14} />
                          관리자 페이지
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <LogOut size={14} />
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/auth/login" className="btn-primary text-sm">
                  <LogIn size={14} className="mr-1.5" />
                  로그인
                </Link>
              )}

              {/* 모바일 메뉴 토글 */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden btn-ghost text-gray-500"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* 모바일 검색 */}
          {mobileMenuOpen && (
            <div className="sm:hidden pb-3">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="상품명으로 검색..."
                    className="input pl-9"
                    autoFocus
                  />
                </div>
                <button type="submit" className="btn-primary">
                  검색
                </button>
              </form>
              <div className="flex gap-2 mt-2">
                <Link
                  href="/notices"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-ghost text-sm text-gray-600"
                >
                  공지사항
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 즐겨찾기 안내 모달 */}
      <Modal
        isOpen={bookmarkModalOpen}
        onClose={() => setBookmarkModalOpen(false)}
        title="즐겨찾기에 추가"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-50 rounded-full">
            <BookmarkCheck size={24} className="text-blue-500" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-gray-900">
              이 사이트를 즐겨찾기에 추가하세요
            </p>
            <div className="bg-gray-50 rounded-lg p-3 text-left space-y-2">
              <p className="text-xs text-gray-600">
                <span className="font-semibold text-gray-900">Windows:</span>{" "}
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs font-mono">
                  Ctrl
                </kbd>{" "}
                +{" "}
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs font-mono">
                  D
                </kbd>
              </p>
              <p className="text-xs text-gray-600">
                <span className="font-semibold text-gray-900">Mac:</span>{" "}
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs font-mono">
                  ⌘
                </kbd>{" "}
                +{" "}
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs font-mono">
                  D
                </kbd>
              </p>
              <p className="text-xs text-gray-600">
                <span className="font-semibold text-gray-900">모바일:</span>{" "}
                공유 버튼 → 홈 화면에 추가
              </p>
            </div>
          </div>
          <button
            onClick={() => setBookmarkModalOpen(false)}
            className="btn-primary w-full"
          >
            확인
          </button>
        </div>
      </Modal>
    </>
  );
}
