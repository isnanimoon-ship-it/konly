import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Pin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NoticeDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: notice } = await supabase
    .from("notices")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (!notice) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div className="max-w-3xl space-y-6">
      <Link
        href="/notices"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft size={16} />
        공지사항 목록
      </Link>

      <article className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50">
          <div className="flex items-center gap-2 mb-2">
            {notice.is_pinned && (
              <>
                <Pin size={14} className="text-blue-500" />
                <span className="badge bg-blue-50 text-blue-600">공지</span>
              </>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-900">{notice.title}</h1>
          <p className="text-xs text-gray-400 mt-2">
            {new Date(notice.created_at).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="px-6 py-5">
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
            {notice.content}
          </div>
        </div>
      </article>
    </div>
    </div>
  );
}
