"use client";

import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { Settings, Save } from "lucide-react";
import { useEffect, useState } from "react";

interface SettingsForm {
  site_name: string;
  copyright: string;
  footer_text: string;
  footer_extra: string;
}

const defaultForm: SettingsForm = {
  site_name: "",
  copyright: "",
  footer_text: "",
  footer_extra: "",
};

export default function SettingsPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState<SettingsForm>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("key, value")
      .then(({ data }) => {
        if (data) {
          const map = Object.fromEntries(data.map((d) => [d.key, d.value]));
          setForm({
            site_name: map.site_name ?? "",
            copyright: map.copyright ?? "",
            footer_text: map.footer_text ?? "",
            footer_extra: map.footer_extra ?? "",
          });
        }
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const updates = Object.entries(form).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("site_settings")
      .upsert(updates, { onConflict: "key" });

    if (error) {
      showToast("저장에 실패했습니다.", "error");
    } else {
      showToast("설정이 저장되었습니다.", "success");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-gray-400">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Settings size={20} className="text-gray-400" />
        <h1 className="text-xl font-bold text-gray-900">사이트 설정</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
        {/* 기본 설정 */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">기본 설정</h2>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              사이트 이름
            </label>
            <input
              type="text"
              value={form.site_name}
              onChange={(e) => setForm({ ...form, site_name: e.target.value })}
              placeholder="사이트 이름"
              className="input text-sm"
            />
          </div>
        </div>

        {/* 하단 설정 */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">사이트 하단 (Footer)</h2>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              카피라이트
            </label>
            <input
              type="text"
              value={form.copyright}
              onChange={(e) => setForm({ ...form, copyright: e.target.value })}
              placeholder="© 2024 쇼핑링크. All rights reserved."
              className="input text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              하단에 표시되는 저작권 문구입니다
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              하단 안내 문구
            </label>
            <input
              type="text"
              value={form.footer_text}
              onChange={(e) => setForm({ ...form, footer_text: e.target.value })}
              placeholder="본 사이트는 외부 쇼핑몰 링크를 제공하는 서비스입니다."
              className="input text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              추가 문구 (선택)
            </label>
            <textarea
              value={form.footer_extra}
              onChange={(e) =>
                setForm({ ...form, footer_extra: e.target.value })
              }
              placeholder="추가로 표시할 문구가 있으면 입력하세요..."
              className="input resize-none h-20 text-sm"
            />
          </div>
        </div>

        {/* 미리보기 */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
          <h2 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
            하단 미리보기
          </h2>
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-gray-700">
                  {form.site_name || "사이트 이름"}
                </p>
                {form.footer_text && (
                  <p className="text-xs text-gray-500">{form.footer_text}</p>
                )}
                {form.footer_extra && (
                  <p className="text-xs text-gray-500">{form.footer_extra}</p>
                )}
              </div>
              <p className="text-xs text-gray-400">
                {form.copyright || "© 2024 사이트명. All rights reserved."}
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary text-sm py-2.5 px-6"
        >
          <Save size={15} className="mr-1.5" />
          {saving ? "저장 중..." : "변경사항 저장"}
        </button>
      </form>
    </div>
  );
}
