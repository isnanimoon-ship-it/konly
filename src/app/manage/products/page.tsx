"use client";

import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import { Category, Product } from "@/lib/types";
import {
  ExternalLink,
  ImagePlus,
  MousePointerClick,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { generateSlug } from "@/lib/utils/slug";

interface ProductForm {
  title: string;
  slug: string;
  description: string;
  image_url: string;
  external_url: string;
  category_id: string;
  is_active: boolean;
}

const defaultForm: ProductForm = {
  title: "",
  slug: "",
  description: "",
  image_url: "",
  external_url: "",
  category_id: "",
  is_active: true,
};

export default function ProductsManagePage() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  const fetchData = async () => {
    const [{ data: productsData }, { data: catsData }] = await Promise.all([
      supabase
        .from("products")
        .select("*, category:categories(*)")
        .order("created_at", { ascending: false }),
      supabase
        .from("categories")
        .select("*")
        .order("sort_order"),
    ]);
    setProducts(productsData ?? []);
    setCategories(catsData ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 오류 제기 관리에서 바로 수정으로 진입한 경우 편집 모달 자동 오픈
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId || loading) return;
    const target = products.find((p) => p.id === Number(editId));
    if (target) openEdit(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, searchParams]);

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setSlugManuallyEdited(false);
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setImageUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (json.url) {
        setForm((prev) => ({ ...prev, image_url: json.url }));
      } else {
        showToast(json.error || "업로드에 실패했습니다.", "error");
      }
    } catch {
      showToast("업로드 중 오류가 발생했습니다.", "error");
    } finally {
      setImageUploading(false);
    }
  };

  const openEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      title: product.title,
      slug: product.slug ?? "",
      description: product.description ?? "",
      image_url: product.image_url ?? "",
      external_url: product.external_url,
      category_id: product.category_id?.toString() ?? "",
      is_active: product.is_active,
    });
    setSlugManuallyEdited(true); // 수정 시엔 slug 자동변경 안 함
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.external_url.trim()) return;
    setSaving(true);

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim() || generateSlug(form.title.trim()),
      description: form.description.trim() || null,
      image_url: form.image_url.trim() || null,
      external_url: form.external_url.trim(),
      category_id: form.category_id ? Number(form.category_id) : null,
      is_active: form.is_active,
    };

    if (editingId !== null) {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        showToast("수정에 실패했습니다.", "error");
      } else {
        showToast("상품이 수정되었습니다.", "success");
        setModalOpen(false);
        fetchData();
      }
    } else {
      const { error } = await supabase.from("products").insert(payload);

      if (error) {
        showToast("추가에 실패했습니다.", "error");
      } else {
        showToast("상품이 추가되었습니다.", "success");
        setModalOpen(false);
        fetchData();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("상품을 삭제할까요?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      showToast("삭제에 실패했습니다.", "error");
    } else {
      showToast("삭제되었습니다.", "success");
      fetchData();
    }
  };

  const toggleActive = async (product: Product) => {
    const { error } = await supabase
      .from("products")
      .update({ is_active: !product.is_active })
      .eq("id", product.id);

    if (!error) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_active: !p.is_active } : p
        )
      );
    }
  };

  // 카테고리 계층 구조
  const parentCategories = categories.filter((c) => c.parent_id === null);
  const getChildren = (parentId: number) =>
    categories.filter((c) => c.parent_id === parentId);

  const filtered = products.filter((p) =>
    searchQuery
      ? p.title.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">상품 관리</h1>
        <button onClick={openCreate} className="btn-primary text-sm">
          <Plus size={15} className="mr-1.5" />
          상품 추가
        </button>
      </div>

      {/* 검색 */}
      <div className="relative max-w-xs">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="상품명 검색..."
          className="input pl-8 text-sm"
        />
      </div>

      {/* 상품 테이블 */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-12">
                  이미지
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">
                  상품명
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">
                  카테고리
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">
                  클릭수
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">
                  활성
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-sm text-gray-400">
                    로딩 중...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-sm text-gray-400">
                    <Package size={28} className="mx-auto mb-2 text-gray-300" />
                    상품이 없습니다
                  </td>
                </tr>
              ) : (
                filtered.map((product) => {
                  const cat = Array.isArray(product.category)
                    ? product.category[0]
                    : product.category;
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="w-9 h-9 bg-gray-100 rounded-md overflow-hidden relative shrink-0">
                          {product.image_url ? (
                            <Image
                              src={product.image_url}
                              alt={product.title}
                              fill
                              className="object-cover"
                              sizes="36px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={14} className="text-gray-300" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">
                            {product.title}
                          </p>
                          <a
                            href={product.external_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-600 flex items-center gap-0.5 mt-0.5"
                          >
                            <ExternalLink size={10} />
                            링크 확인
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-gray-500">
                          {cat?.name ?? "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        <div className="flex items-center justify-end gap-1 text-xs text-gray-700">
                          <MousePointerClick size={11} className="text-gray-400" />
                          {product.click_count.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleActive(product)}
                          className={`transition-colors ${
                            product.is_active
                              ? "text-green-500 hover:text-green-600"
                              : "text-gray-300 hover:text-gray-400"
                          }`}
                        >
                          {product.is_active ? (
                            <ToggleRight size={22} />
                          ) : (
                            <ToggleLeft size={22} />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(product)}
                            className="btn-ghost p-1.5 text-gray-400 hover:text-gray-700"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="btn-ghost p-1.5 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-gray-50 bg-gray-50">
          <p className="text-xs text-gray-400">
            총 {filtered.length}개 상품
          </p>
        </div>
      </div>

      {/* 상품 추가/수정 모달 */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId !== null ? "상품 수정" : "상품 추가"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                상품명 *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => {
                  const newTitle = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    title: newTitle,
                    // 제목 변경 시 slug 자동 생성 (수동 수정 전까지)
                    slug: slugManuallyEdited ? prev.slug : generateSlug(newTitle),
                  }));
                }}
                placeholder="상품명 입력"
                className="input text-sm"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                URL 슬러그
                <span className="ml-1.5 text-gray-400 font-normal">
                  /products/<span className="text-blue-500">{form.slug || "자동생성"}</span>
                </span>
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => {
                  setSlugManuallyEdited(true);
                  setForm((prev) => ({ ...prev, slug: e.target.value }));
                }}
                placeholder="자동 생성됩니다"
                className="input text-sm font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                외부 링크 URL *
              </label>
              <input
                type="url"
                value={form.external_url}
                onChange={(e) =>
                  setForm({ ...form, external_url: e.target.value })
                }
                placeholder="https://..."
                className="input text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                카테고리
              </label>
              <select
                value={form.category_id}
                onChange={(e) =>
                  setForm({ ...form, category_id: e.target.value })
                }
                className="input text-sm"
              >
                <option value="">카테고리 없음</option>
                {parentCategories.map((parent) => (
                  <optgroup key={parent.id} label={parent.name}>
                    {getChildren(parent.id).length > 0 ? (
                      getChildren(parent.id).map((child) => (
                        <option key={child.id} value={child.id}>
                          {child.name}
                        </option>
                      ))
                    ) : (
                      <option value={parent.id}>{parent.name}</option>
                    )}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                이미지
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              {form.image_url ? (
                <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  <div className="relative h-36 w-full">
                    <Image
                      src={form.image_url}
                      alt="미리보기"
                      fill
                      className="object-cover"
                      sizes="400px"
                    />
                  </div>
                  <div className="absolute top-1.5 right-1.5 flex gap-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white/90 hover:bg-white rounded-md px-2 py-1 text-xs text-gray-700 shadow-sm border border-gray-200"
                    >
                      변경
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, image_url: "" }))}
                      className="bg-white/90 hover:bg-white rounded-md p-1 text-gray-700 shadow-sm border border-gray-200"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUploading}
                  className="w-full h-36 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-gray-300 hover:bg-gray-50 transition-colors text-gray-400 disabled:opacity-50"
                >
                  {imageUploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      <span className="text-xs">업로드 중...</span>
                    </>
                  ) : (
                    <>
                      <ImagePlus size={22} />
                      <span className="text-xs">클릭하여 이미지 업로드</span>
                      <span className="text-xs text-gray-300">JPG, PNG, WebP · 최대 5MB</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                상품 설명
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="간단한 상품 설명 (선택)"
                className="input resize-none h-20 text-sm"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <label className="text-xs font-medium text-gray-600">
                활성 상태
              </label>
              <button
                type="button"
                onClick={() =>
                  setForm({ ...form, is_active: !form.is_active })
                }
                className={`transition-colors ${
                  form.is_active
                    ? "text-green-500"
                    : "text-gray-300"
                }`}
              >
                {form.is_active ? (
                  <ToggleRight size={26} />
                ) : (
                  <ToggleLeft size={26} />
                )}
              </button>
              <span className="text-xs text-gray-500">
                {form.is_active ? "활성 (사용자에게 노출)" : "비활성 (숨김)"}
              </span>
            </div>
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
              {saving
                ? "저장 중..."
                : editingId !== null
                ? "수정 완료"
                : "상품 추가"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
