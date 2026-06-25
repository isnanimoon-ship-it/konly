"use client";

import { Category } from "@/lib/types";
import { ArrowRight } from "lucide-react";

interface HeroSectionProps {
  categories: Category[];
  onSelectParent: (id: number) => void;
}

export default function HeroSection({ categories, onSelectParent }: HeroSectionProps) {
  const parents = categories.filter((c) => c.parent_id === null).slice(0, 4);

  return (
    <section className="bg-white border-b border-gray-100 py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          {/* 배지 */}
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-100 rounded-full px-3 py-1 mb-5">
            🇰🇷 Made in Korea
          </span>

          {/* 헤드라인 */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            국내 생산 상품만
            <br />
            모았습니다
          </h1>

          {/* 설명 */}
          <p className="mt-3 text-sm sm:text-base text-gray-500 leading-relaxed">
            중국산이 섞일 걱정 없이, 직접 검수한 Made in Korea 상품만
            <br className="hidden sm:block" />
            카테고리별로 찾아보세요.
          </p>

          {/* 카테고리 CTA */}
          {parents.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {parents.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onSelectParent(cat.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full border border-gray-200 text-gray-700 hover:border-gray-900 hover:text-gray-900 hover:bg-gray-50 transition-all"
                >
                  {cat.name} 보기
                  <ArrowRight size={13} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
