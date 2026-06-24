"use client";

import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import { Notice } from "@/lib/types";
import { Bell, Pencil, Pin, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useEffect, useState } from "react";

interface NoticeForm {
  title: string;
  content: string;
  is_pinned: boolean;
  is_active: boolean;
}

const defaultForm: NoticeForm = {
  title: "",
  content: "",
  is_pinned: false,
  is_active: true,
};

export default function NoticesManagePage() {
  const { showToast } = useToast();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<NoticeForm>(defaultForm);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  const fetchNotices = async () => {
    const { data } = await supabase
      .from("notices")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });
    setNotices(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEdit = (notice: Notice) => {
    setEditingId(notice.id);
    setForm({
      title: notice.title,
      content: notice.content,
      is_pinned: notice.is_pinned,
      is_active: notice.is_active,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);

    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      is_pinned: form.is_pinned,
      is_active: form.is_active,
    };

    if (editingId !== null) {
      const { error } = await supabase
        .from("notices")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        showToast("수정에 실패했습니다.", "error");
      } else {
        showToast("공지사항이 수정되었습니다.", "success");
        setModalOpen(false);
        fetchNotices();
      }
    } else {
      const { error } = await supabase.from("notices").insert(payload);

      if (error) {
        showToast("추가에 실패했습니다.", "error");
      } else {
        showToast("공지사항이 추가되었습니다.", "success");
        setModalOpen(false);
        fetchNotices();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("공지사항을 삭제할까요?")) return;
    const { error } = await supabase.from("notices").delete().eq("id", id);
    if (error) {
      showToast("삭제에 실패했습니다.", "error");
    } else {
      showToast("삭제되었습니다.", "success");
      fetchNotices();
    }
  };

  const toggleActive = async (notice: Notice) => {
    const { error } = await supabase
      .from("notices")
      .update({ is_active: !notice.is_active })
      .eq("id", notice.id);
    if (!error) {
      setNotices((prev) =>
        prev.map((n) =>
          n.id === notice.id ? { ...n, is_active: !n.is_active } : n
        )
      );
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">공지사항 관리</h1>
        <button onClick={openCreate} className="btn-primary text-sm">
          <Plus size={15} className="mr-1.5" />
          공지 추가
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="text-center py-10 text-sm text-gray-400">
              로딩 중...
            </div>
          ) : notices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell size={28} className="text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">공지사항이 없습니다</p>
            </div>
          ) : (
            notices.map((notice) => (
              <div
                key={notice.id}
                className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50"
              >
                {notice.is_pinned && (
                  <Pin size={13} className="text-blue-400 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {notice.is_pinned && (
                      <span className="badge bg-blue-50 text-blue-500">
                        공지
                      </span>
                    )}
                    {!notice.is_active && (
                      <span className="badge bg-gray-100 text-gray-400">
                        비활성
                      </span>
                    )}
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {notice.title}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(notice.created_at).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleActive(notice)}
                    className={`transition-colors ${
                      notice.is_active ? "text-green-500" : "text-gray-300"
                    }`}
                    title={notice.is_active ? "비활성화" : "활성화"}
                  >
                    {notice.is_active ? (
                      <ToggleRight size={20} />
                    ) : (
                      <ToggleLeft size={20} />
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(notice)}
                    className="btn-ghost p-1.5 text-gray-400 hover:text-gray-700"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(notice.id)}
                    className="btn-ghost p-1.5 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId !== null ? "공지사항 수정" : "공지사항 추가"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              제목 *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="공지사항 제목"
              className="input text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              내용 *
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="공지사항 내용을 입력하세요..."
              className="input resize-none h-36 text-sm"
              required
            />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_pinned}
                onChange={(e) =>
                  setForm({ ...form, is_pinned: e.target.checked })
                }
                className="rounded border-gray-300"
              />
              <span className="text-xs font-medium text-gray-600 flex items-center gap-1">
                <Pin size={12} />
                상단 고정
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.checked })
                }
                className="rounded border-gray-300"
              />
              <span className="text-xs font-medium text-gray-600">활성화</span>
            </label>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary flex-1 text-sm"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 text-sm"
            >
              {saving ? "저장 중..." : editingId !== null ? "수정 완료" : "추가"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
