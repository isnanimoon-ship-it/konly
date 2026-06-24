"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRecentlyViewed } from "@/lib/hooks/useRecentlyViewed";
import { useToast } from "@/components/ui/Toast";
import { Product } from "@/lib/types";
import { AlertCircle, ExternalLink, Link as LinkIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Modal from "@/components/ui/Modal";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuth();
  const { addProduct } = useRecentlyViewed();
  const { showToast } = useToast();
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<"info" | "link">("info");
  const [reportDesc, setReportDesc] = useState("");
  const [reporting, setReporting] = useState(false);

  // "바로가기" 버튼: 클릭수 증가 + 외부 링크 열기
  const handleGoExternal = (e: React.MouseEvent) => {
    e.preventDefault();
    fetch("/api/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: product.id }),
    });
    addProduct(product);
    window.open(product.external_url, "_blank", "noopener,noreferrer");
  };

  const handleReport = (type: "info" | "link") => {
    if (!user) {
      showToast("로그인 후 이용할 수 있습니다.", "error");
      return;
    }
    setReportType(type);
    setReportModalOpen(true);
  };

  const submitReport = async () => {
    if (!user) return;
    setReporting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          type: reportType,
          description: reportDesc,
        }),
      });
      if (!res.ok) throw new Error();
      setReportModalOpen(false);
      setReportDesc("");
      showToast("오류 제기가 접수되었습니다. 감사합니다.", "success");
    } catch {
      showToast("오류 제기에 실패했습니다.", "error");
    } finally {
      setReporting(false);
    }
  };

  return (
    <>
      <div className="card group flex flex-col">
        {/* 이미지 → 상품 상세 페이지 */}
        <Link
          href={`/products/${product.slug}`}
          className="relative aspect-[4/3] bg-gray-50 overflow-hidden block"
        >
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <LinkIcon size={32} className="text-gray-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </Link>

        {/* 내용 */}
        <div className="flex flex-col flex-1 p-3">
          {/* 카테고리 */}
          {product.category && (
            <span className="text-xs text-gray-400 mb-1">
              {product.category.name}
            </span>
          )}

          {/* 제목 → 상품 상세 페이지 */}
          <Link
            href={`/products/${product.slug}`}
            className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors flex-1"
          >
            {product.title}
          </Link>

          {/* 설명 */}
          {product.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {product.description}
            </p>
          )}

          {/* 하단 액션 */}
          <div className="mt-3 pt-2 border-t border-gray-50 flex items-center justify-between gap-1 flex-wrap">
            <button
              onClick={handleGoExternal}
              className="text-xs text-blue-600 font-medium flex items-center gap-1 hover:text-blue-700 shrink-0"
            >
              <ExternalLink size={12} />
              바로가기
            </button>

            {/* 오류 제기 (로그인 사용자) */}
            {user && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleReport("info")}
                  className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-0.5 transition-colors whitespace-nowrap"
                  title="상품 정보 오류 제기"
                >
                  <AlertCircle size={10} />
                  정보오류
                </button>
                <span className="text-gray-200 text-[10px]">|</span>
                <button
                  onClick={() => handleReport("link")}
                  className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-0.5 transition-colors whitespace-nowrap"
                  title="링크 오류 제기"
                >
                  <AlertCircle size={10} />
                  링크오류
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 오류 제기 모달 */}
      <Modal
        isOpen={reportModalOpen}
        onClose={() => {
          setReportModalOpen(false);
          setReportDesc("");
        }}
        title={reportType === "info" ? "상품 정보 오류 제기" : "링크 오류 제기"}
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-900 line-clamp-1">
              {product.title}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {reportType === "info"
                ? "상품 정보에 오류가 있는 경우 제기해주세요."
                : "링크가 작동하지 않는 경우 제기해주세요."}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              상세 내용 (선택)
            </label>
            <textarea
              value={reportDesc}
              onChange={(e) => setReportDesc(e.target.value)}
              placeholder="오류 내용을 자세히 입력해주세요..."
              className="input resize-none h-24"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setReportModalOpen(false);
                setReportDesc("");
              }}
              className="btn-secondary flex-1"
            >
              취소
            </button>
            <button
              onClick={submitReport}
              disabled={reporting}
              className="btn-primary flex-1"
            >
              {reporting ? "제출 중..." : "제출"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
