"use client";

import { fetchRecentProducts, getRecentlyViewedIds } from "@/lib/hooks/useRecentlyViewed";
import { Product } from "@/lib/types";
import { Clock, Package } from "lucide-react";
import { useEffect, useState } from "react";
import ProductCard from "@/components/products/ProductCard";
import Link from "next/link";

export default function RecentPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = getRecentlyViewedIds();
    fetchRecentProducts(ids).then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Clock size={20} className="text-gray-400" />
        <h1 className="text-xl font-bold text-gray-900">최근 본 상품</h1>
      </div>

      {loading ? (
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package size={40} className="text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500">
            최근 본 상품이 없습니다
          </p>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            상품을 클릭하면 여기에 기록됩니다
          </p>
          <Link href="/" className="btn-primary text-sm">
            상품 둘러보기
          </Link>
        </div>
      )}
    </div>
  );
}
