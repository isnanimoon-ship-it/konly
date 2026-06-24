"use client";

import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { Category } from "@/lib/types";
import { ChevronRight, FolderPlus, Pencil, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface FormState {
  name: string;
  parent_id: number | null;
  sort_order: number;
}

const defaultForm: FormState = { name: "", parent_id: null, sort_order: 0 };

export default function CategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("parent_id", { ascending: true, nullsFirst: true })
      .order("sort_order");
    setCategories(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parents = categories.filter((c) => c.parent_id === null);
  const getChildren = (parentId: number) =>
    categories.filter((c) => c.parent_id === parentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    if (editingId !== null) {
      const { error } = await supabase
        .from("categories")
        .update({
          name: form.name.trim(),
          parent_id: form.parent_id,
          sort_order: form.sort_order,
        })
        .eq("id", editingId);

      if (error) {
        showToast("수정에 실패했습니다.", "error");
      } else {
        showToast("카테고리가 수정되었습니다.", "success");
        setEditingId(null);
        setForm(defaultForm);
        fetchCategories();
      }
    } else {
      const { error } = await supabase.from("categories").insert({
        name: form.name.trim(),
        parent_id: form.parent_id,
        sort_order: form.sort_order,
      });

      if (error) {
        showToast("추가에 실패했습니다.", "error");
      } else {
        showToast("카테고리가 추가되었습니다.", "success");
        setForm(defaultForm);
        fetchCategories();
      }
    }
    setSaving(false);
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      parent_id: cat.parent_id,
      sort_order: cat.sort_order,
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("삭제하면 하위 카테고리도 함께 삭제됩니다. 계속할까요?"))
      return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      showToast("삭제에 실패했습니다.", "error");
    } else {
      showToast("삭제되었습니다.", "success");
      fetchCategories();
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">카테고리 관리</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 추가/수정 폼 */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FolderPlus size={16} className="text-gray-400" />
            {editingId !== null ? "카테고리 수정" : "카테고리 추가"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                카테고리명 *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="카테고리명 입력"
                className="input text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                상위 카테고리 (소분류인 경우 선택)
              </label>
              <select
                value={form.parent_id ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    parent_id: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="input text-sm"
              >
                <option value="">대분류 (최상위)</option>
                {parents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                정렬 순서
              </label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  setForm({ ...form, sort_order: Number(e.target.value) })
                }
                className="input text-sm"
                min={0}
              />
            </div>
            <div className="flex gap-2 pt-1">
              {editingId !== null && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm(defaultForm);
                  }}
                  className="btn-secondary flex-1 text-sm"
                >
                  <X size={14} className="mr-1" />
                  취소
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex-1 text-sm"
              >
                {saving
                  ? "저장 중..."
                  : editingId !== null
                  ? "수정 완료"
                  : "추가"}
              </button>
            </div>
          </form>
        </div>

        {/* 카테고리 목록 */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            카테고리 목록
          </h2>
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-6">로딩 중...</p>
          ) : parents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              등록된 카테고리가 없습니다
            </p>
          ) : (
            <div className="space-y-1">
              {parents.map((parent) => (
                <div key={parent.id}>
                  {/* 대분류 */}
                  <div className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-gray-50 group">
                    <span className="text-sm font-medium text-gray-800 flex-1">
                      {parent.name}
                    </span>
                    <span className="text-xs text-gray-300">
                      순서: {parent.sort_order}
                    </span>
                    <button
                      onClick={() => handleEdit(parent)}
                      className="opacity-0 group-hover:opacity-100 btn-ghost p-1 text-gray-400"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(parent.id)}
                      className="opacity-0 group-hover:opacity-100 btn-ghost p-1 text-red-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  {/* 소분류 */}
                  {getChildren(parent.id).map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center gap-2 py-1.5 px-2 pl-6 rounded-lg hover:bg-gray-50 group"
                    >
                      <ChevronRight
                        size={12}
                        className="text-gray-300 shrink-0"
                      />
                      <span className="text-sm text-gray-600 flex-1">
                        {child.name}
                      </span>
                      <span className="text-xs text-gray-300">
                        {child.sort_order}
                      </span>
                      <button
                        onClick={() => handleEdit(child)}
                        className="opacity-0 group-hover:opacity-100 btn-ghost p-1 text-gray-400"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(child.id)}
                        className="opacity-0 group-hover:opacity-100 btn-ghost p-1 text-red-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
