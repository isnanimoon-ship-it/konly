"use client";

import { Category, Product } from "@/lib/types";
import { Package } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import CategoryFilter from "./CategoryFilter";
import ProductCard from "./ProductCard";

interface HomeClientProps {
  categories: Category[];
  initialProducts: Product[];
}

const PAGE_SIZE = 24;

export default function HomeClient({
  categories,
  initialProducts,
}: HomeClientProps) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") ?? "";

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialProducts.length === PAGE_SIZE);
  const loaderRef = useRef<HTMLDivElement>(null);
  const initialProductsRef = useRef(initialProducts);

  const fetchProducts = async (
    parentId: number | null,
    childId: number | null,
    query: string,
    pageNum: number,
    append = false
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (parentId) params.set("parentId", String(parentId));
      if (childId) params.set("childId", String(childId));
      if (query) params.set("q", query);
      params.set("page", String(pageNum));

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error();
      const { products: fetched } = await res.json();

      if (append) {
        setProducts((prev) => [...prev, ...fetched]);
      } else {
        setProducts(fetched);
      }
      setHasMore(fetched.length === PAGE_SIZE);
    } catch {
      console.error("[상품 조회 오류]");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedParentId === null && selectedChildId === null && !searchQuery) {
      setProducts(initialProductsRef.current);
      setPage(0);
      setHasMore(initialProductsRef.current.length === PAGE_SIZE);
      return;
    }
    setProducts([]);
    setPage(0);
    fetchProducts(selectedParentId, selectedChildId, searchQuery, 0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedParentId, selectedChildId, searchQuery]);

  // 무한 스크롤
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchProducts(selectedParentId, selectedChildId, searchQuery, nextPage, true);
        }
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading, page, selectedParentId, selectedChildId, searchQuery]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:items-start">
      {/* 카테고리 사이드바 */}
      <aside className="w-full lg:w-44 lg:shrink-0 lg:sticky lg:top-24">
        <p className="hidden lg:block text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
          카테고리
        </p>
        <CategoryFilter
          categories={categories}
          selectedParentId={selectedParentId}
          selectedChildId={selectedChildId}
          onSelectParent={(id) => {
            setSelectedParentId(id);
            setSelectedChildId(null);
          }}
          onSelectChild={setSelectedChildId}
        />
      </aside>

      {/* 상품 영역 */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* 검색 결과 안내 */}
        {searchQuery && (
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-900">
              &ldquo;{searchQuery}&rdquo;
            </span>{" "}
            검색 결과{" "}
            <span className="font-medium text-gray-900">{products.length}개</span>
          </p>
        )}

        {/* 상품 그리드 / 로딩 / 빈 상태 */}
        {loading && products.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package size={40} className="text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">
              {searchQuery ? "검색 결과가 없습니다" : "등록된 상품이 없습니다"}
            </p>
            {searchQuery && (
              <p className="text-xs text-gray-400 mt-1">
                다른 검색어를 입력해보세요
              </p>
            )}
          </div>
        )}

        {/* 무한 스크롤 트리거 */}
        <div ref={loaderRef} className="h-4" />
        {loading && products.length > 0 && (
          <div className="flex justify-center py-6">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
