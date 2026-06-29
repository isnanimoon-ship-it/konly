"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRecentlyViewed } from "@/lib/hooks/useRecentlyViewed";
import { useToast } from "@/components/ui/Toast";
import { Product } from "@/lib/types";
import Modal from "@/components/ui/Modal";
import ProductCard from "./ProductCard";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, ChevronRight, ExternalLink, X, ZoomIn } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  product: Product;
  relatedProducts: Product[];
}

export default function ProductDetailClient({ product, relatedProducts }: Props) {
  const { user } = useAuth();
  const { addProduct } = useRecentlyViewed();
  const { showToast } = useToast();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<"info" | "link">("info");
  const [reportDesc, setReportDesc] = useState("");
  const [reporting, setReporting] = useState(false);

  // ESC 키로 라이트박스 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // 페이지 진입 시 최근 본 상품 localStorage 추가
  useEffect(() => {
    addProduct(product);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoToCoupang = () => {
    // 클릭수 증가 + DB 최근 본 상품 기록
    fetch("/api/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: product.id }),
    });
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
    <div className="max-w-2xl mx-auto space-y-8">
      {/* 브레드크럼 */}
      <nav className="flex items-center gap-1 text-sm text-gray-400 flex-wrap">
        <Link href="/" className="hover:text-gray-600 shrink-0">
          홈
        </Link>
        {product.category && (
          <>
            <ChevronRight size={14} className="shrink-0" />
            <span className="shrink-0">{product.category.name}</span>
          </>
        )}
        <ChevronRight size={14} className="shrink-0" />
        <span className="text-gray-700 truncate">{product.title}</span>
      </nav>

      {/* 상품 상세 */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* 이미지 (클릭 시 라이트박스) */}
        {product.image_url && (
          <button
            onClick={() => setLightboxOpen(true)}
            className="relative aspect-video bg-gray-50 w-full block group"
          >
            <Image
              src={product.image_url}
              alt={product.title}
              fill
              className="object-contain p-4"
              priority
              sizes="(max-width: 768px) 100vw, 672px"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2 shadow-sm">
                <ZoomIn size={20} className="text-gray-700" />
              </div>
            </div>
          </button>
        )}

        <div className="p-6 space-y-4">
          {/* 카테고리 */}
          {product.category && (
            <span className="badge bg-blue-50 text-blue-600 text-xs">
              {product.category.name}
            </span>
          )}

          {/* 제목 */}
          <h1 className="text-xl font-bold text-gray-900 leading-snug">
            {product.title}
          </h1>

          {/* 설명 */}
          {product.description && (
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          )}

          {/* 쿠팡 이동 버튼 */}
          <button
            onClick={handleGoToCoupang}
            className="w-full btn-primary py-3 text-base flex items-center justify-center gap-2 mt-2"
          >
            <ExternalLink size={18} />
            쿠팡에서 보기
          </button>

          {/* 파트너스 고지 */}
          <p className="text-[11px] text-gray-400 text-center leading-relaxed">
            이 링크는 쿠팡 파트너스 활동의 일환으로 수수료를 받을 수 있습니다.
          </p>

          {/* 오류 신고 */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-50">
            <span className="text-xs text-gray-300">오류 신고</span>
            <button
              onClick={() => handleReport("info")}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5 transition-colors"
            >
              <AlertCircle size={12} />
              정보오류
            </button>
            <span className="text-gray-200">|</span>
            <button
              onClick={() => handleReport("link")}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5 transition-colors"
            >
              <AlertCircle size={12} />
              링크오류
            </button>
          </div>
        </div>
      </div>

      {/* 연관 상품 */}
      {relatedProducts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-gray-900">
            같은 카테고리 상품
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

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

      {/* 라이트박스 */}
      {lightboxOpen && product.image_url && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          {/* 닫기 버튼 */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X size={22} />
          </button>

          {/* 이미지 */}
          <div
            className="relative max-w-4xl max-h-[90vh] w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={product.image_url}
              alt={product.title}
              fill
              className="object-contain"
              sizes="100vw"
              quality={100}
            />
          </div>

          <p className="absolute bottom-4 left-0 right-0 text-center text-white/40 text-xs">
            클릭하거나 ESC 키로 닫기
          </p>
        </div>
      )}
    </div>
  );
}
