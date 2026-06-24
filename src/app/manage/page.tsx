import { createClient } from "@/lib/supabase/server";
import { BarChart2, MousePointerClick, Package, Users } from "lucide-react";

async function StatCard({
  title,
  value,
  icon: Icon,
  sub,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{title}</p>
        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
          <Icon size={16} className="text-gray-600" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default async function ManageDashboard() {
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];

  const [
    { count: totalProducts },
    { data: clickData },
    { count: todayVisitors },
    { count: pendingReports },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("products")
      .select("click_count")
      .eq("is_active", true),
    supabase
      .from("visitor_logs")
      .select("*", { count: "exact", head: true })
      .gte("visited_at", `${today}T00:00:00`)
      .lte("visited_at", `${today}T23:59:59`),
    supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const totalClicks =
    clickData?.reduce((sum, p) => sum + (p.click_count ?? 0), 0) ?? 0;

  // 최근 7일 방문자
  const { data: dailyVisitors } = await supabase
    .from("daily_visitors")
    .select("*")
    .limit(7);

  // 상위 클릭 상품
  const { data: topProducts } = await supabase
    .from("products")
    .select("id, title, click_count, category:categories(name)")
    .eq("is_active", true)
    .order("click_count", { ascending: false })
    .limit(5);

  const maxVisits = Math.max(
    ...(dailyVisitors?.map((d) => d.visit_count) ?? [1])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">대시보드</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date().toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="전체 상품"
          value={totalProducts ?? 0}
          icon={Package}
          sub="활성 상품 기준"
        />
        <StatCard
          title="오늘 방문자"
          value={todayVisitors ?? 0}
          icon={Users}
          sub="오늘 기준"
        />
        <StatCard
          title="누적 클릭"
          value={totalClicks.toLocaleString()}
          icon={MousePointerClick}
          sub="전체 상품 합계"
        />
        <StatCard
          title="미처리 오류제기"
          value={pendingReports ?? 0}
          icon={BarChart2}
          sub="검토 필요"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 7일 방문자 */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            최근 7일 방문자
          </h2>
          {dailyVisitors && dailyVisitors.length > 0 ? (
            <div className="space-y-2">
              {[...dailyVisitors].reverse().map((day) => (
                <div key={day.visit_date} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-20 shrink-0">
                    {new Date(day.visit_date).toLocaleDateString("ko-KR", {
                      month: "numeric",
                      day: "numeric",
                    })}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gray-800 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.max(
                          4,
                          (day.visit_count / maxVisits) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-700 font-medium w-8 text-right shrink-0">
                    {day.visit_count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">
              방문 데이터가 없습니다
            </p>
          )}
        </div>

        {/* 상위 클릭 상품 */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            클릭 상위 상품
          </h2>
          {topProducts && topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((product, index) => {
                const cat = Array.isArray(product.category)
                  ? product.category[0]
                  : product.category;
                return (
                  <div key={product.id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-300 w-4 shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.title}
                      </p>
                      {cat && (
                        <p className="text-xs text-gray-400">{cat.name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <MousePointerClick size={12} className="text-gray-400" />
                      <span className="text-xs font-semibold text-gray-700">
                        {product.click_count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">
              클릭 데이터가 없습니다
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
