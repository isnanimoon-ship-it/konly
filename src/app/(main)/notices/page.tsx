import { createClient } from "@/lib/supabase/server";
import { Bell, Pin } from "lucide-react";
import Link from "next/link";

export default async function NoticesPage() {
  const supabase = await createClient();
  const { data: notices } = await supabase
    .from("notices")
    .select("*")
    .eq("is_active", true)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        <Bell size={20} className="text-gray-400" />
        <h1 className="text-xl font-bold text-gray-900">공지사항</h1>
      </div>

      {notices && notices.length > 0 ? (
        <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
          {notices.map((notice) => (
            <Link
              key={notice.id}
              href={`/notices/${notice.id}`}
              className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors group"
            >
              {notice.is_pinned && (
                <Pin size={14} className="text-blue-500 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {notice.is_pinned && (
                    <span className="badge bg-blue-50 text-blue-600">
                      공지
                    </span>
                  )}
                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                    {notice.title}
                  </p>
                </div>
              </div>
              <span className="text-xs text-gray-400 shrink-0">
                {new Date(notice.created_at).toLocaleDateString("ko-KR")}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bell size={40} className="text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">등록된 공지사항이 없습니다</p>
        </div>
      )}
    </div>
  );
}
