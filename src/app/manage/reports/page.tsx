"use client";

import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { MessageSquareWarning, CheckCircle2, ExternalLink, Pencil } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface ReportWithProduct {
  id: number;
  type: "info" | "link";
  description: string | null;
  status: "pending" | "resolved";
  created_at: string;
  product: {
    id: number;
    title: string;
    external_url: string;
  } | null;
}

export default function ReportsManagePage() {
  const { showToast } = useToast();
  const [reports, setReports] = useState<ReportWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "resolved">(
    "pending"
  );

  const supabase = createClient();

  const fetchReports = async () => {
    let query = supabase
      .from("reports")
      .select("id, type, description, status, created_at, product:products(id, title, external_url)")
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data } = await query;
    setReports((data as unknown as ReportWithProduct[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleResolve = async (id: number) => {
    const { error } = await supabase
      .from("reports")
      .update({ status: "resolved" })
      .eq("id", id);

    if (error) {
      showToast("처리에 실패했습니다.", "error");
    } else {
      showToast("처리 완료로 변경되었습니다.", "success");
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "resolved" } : r))
      );
    }
  };

  const typeLabel = (type: "info" | "link") =>
    type === "info" ? "정보 오류" : "링크 오류";

  const typeColor = (type: "info" | "link") =>
    type === "info"
      ? "bg-amber-50 text-amber-600"
      : "bg-red-50 text-red-600";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">오류 제기 관리</h1>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(["pending", "resolved", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filter === f
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f === "pending" ? "미처리" : f === "resolved" ? "처리완료" : "전체"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="text-center py-10 text-sm text-gray-400">
              로딩 중...
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquareWarning
                size={28}
                className="text-gray-300 mb-2"
              />
              <p className="text-sm text-gray-400">오류 제기 내역이 없습니다</p>
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className={`px-5 py-4 ${
                  report.status === "resolved" ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`badge shrink-0 mt-0.5 ${typeColor(report.type)}`}
                  >
                    {typeLabel(report.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    {report.product ? (
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {report.product.title}
                        </p>
                        <a
                          href={report.product.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-600 shrink-0"
                          title="외부 링크 확인"
                        >
                          <ExternalLink size={13} />
                        </a>
                        <Link
                          href={`/manage/products?edit=${report.product.id}`}
                          className="text-gray-400 hover:text-gray-700 shrink-0"
                          title="상품 수정"
                        >
                          <Pencil size={13} />
                        </Link>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 mb-1">
                        삭제된 상품
                      </p>
                    )}
                    {report.description && (
                      <p className="text-xs text-gray-600 bg-gray-50 rounded-md p-2 mt-1">
                        {report.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(report.created_at).toLocaleString("ko-KR")}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {report.status === "pending" ? (
                      <button
                        onClick={() => handleResolve(report.id)}
                        className="btn-secondary text-xs py-1 px-3 flex items-center gap-1"
                      >
                        <CheckCircle2 size={13} />
                        처리완료
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle2 size={13} />
                        처리됨
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
