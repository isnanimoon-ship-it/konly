"use client";

import { Category } from "@/lib/types";
import { ChevronDown, ChevronRight, LayoutGrid } from "lucide-react";
import { useEffect, useState } from "react";

interface CategoryFilterProps {
  categories: Category[];
  selectedParentId: number | null;
  selectedChildId: number | null;
  onSelectParent: (id: number | null) => void;
  onSelectChild: (id: number | null) => void;
}

export default function CategoryFilter({
  categories,
  selectedParentId,
  selectedChildId,
  onSelectParent,
  onSelectChild,
}: CategoryFilterProps) {
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  // 선택된 부모 카테고리는 자동으로 펼치기
  useEffect(() => {
    if (selectedParentId !== null) {
      setExpandedIds((prev) =>
        prev.includes(selectedParentId) ? prev : [...prev, selectedParentId]
      );
    }
  }, [selectedParentId]);

  const toggleExpand = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectParent = (id: number | null) => {
    onSelectParent(id);
    onSelectChild(null);
    setMobileOpen(false);
  };

  const handleSelectChild = (parentId: number, childId: number) => {
    onSelectParent(parentId);
    onSelectChild(childId);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <nav className="space-y-0.5">
      {/* 전체 */}
      <button
        onClick={() => handleSelectParent(null)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
          selectedParentId === null
            ? "bg-gray-900 text-white font-medium"
            : "text-gray-600 hover:bg-gray-50"
        }`}
      >
        <LayoutGrid size={14} className="shrink-0" />
        전체
      </button>

      {categories.map((parent) => {
        const hasChildren = (parent.children?.length ?? 0) > 0;
        const isExpanded = expandedIds.includes(parent.id);
        const isSelected = selectedParentId === parent.id;

        return (
          <div key={parent.id}>
            {/* 대분류 */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => handleSelectParent(parent.id)}
                className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                  isSelected
                    ? "bg-gray-900 text-white font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {parent.name}
              </button>
              {hasChildren && (
                <button
                  onClick={(e) => toggleExpand(parent.id, e)}
                  className={`p-1.5 rounded-md transition-colors shrink-0 ${
                    isSelected
                      ? "text-white/60 hover:text-white hover:bg-white/10"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <ChevronRight
                    size={13}
                    className={`transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                  />
                </button>
              )}
            </div>

            {/* 소분류 */}
            {hasChildren && isExpanded && (
              <div className="ml-3 pl-3 border-l-2 border-gray-100 mt-0.5 mb-1 space-y-0.5">
                <button
                  onClick={() => handleSelectParent(parent.id)}
                  className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors ${
                    isSelected && selectedChildId === null
                      ? "text-blue-600 font-semibold bg-blue-50"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  전체
                </button>
                {parent.children?.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => handleSelectChild(parent.id, child.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors ${
                      selectedChildId === child.id
                        ? "text-blue-600 font-semibold bg-blue-50"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {child.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* 모바일: 드롭다운 토글 */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 shadow-sm"
        >
          <span>
            {selectedParentId === null
              ? "전체 카테고리"
              : `${categories.find((c) => c.id === selectedParentId)?.name ?? ""}${
                  selectedChildId
                    ? ` › ${
                        categories
                          .find((c) => c.id === selectedParentId)
                          ?.children?.find((c) => c.id === selectedChildId)?.name ?? ""
                      }`
                    : ""
                }`}
          </span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 text-gray-400 ${mobileOpen ? "rotate-180" : ""}`}
          />
        </button>
        {mobileOpen && (
          <div className="mt-1 p-2 bg-white border border-gray-200 rounded-xl shadow-lg">
            {sidebarContent}
          </div>
        )}
      </div>

      {/* 데스크탑: 사이드바 */}
      <div className="hidden lg:block">{sidebarContent}</div>
    </>
  );
}
