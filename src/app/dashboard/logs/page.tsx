import { getAuditLogs } from "@/actions/admin";
import { ScrollText } from "lucide-react";
import Link from "next/link";

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; entity?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const { logs, total, pages } = await getAuditLogs(page, params.entity);

  const actionColors: Record<string, string> = {
    CREATE: "bg-green-100 text-green-700",
    UPDATE: "bg-blue-100 text-blue-700",
    DELETE: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ScrollText className="w-7 h-7" /> İşlem Kayıtları
        </h1>
        <p className="text-slate-500 text-sm mt-1">{total} kayıt</p>
      </div>

      {/* Entity Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { value: "", label: "Tümü" },
          { value: "Quote", label: "Teklifler" },
          { value: "Customer", label: "Müşteriler" },
          { value: "User", label: "Kullanıcılar" },
          { value: "StockItem", label: "Stok" },
        ].map((filter) => (
          <Link
            key={filter.value}
            href={`/dashboard/logs${filter.value ? `?entity=${filter.value}` : ""}`}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              (params.entity || "") === filter.value
                ? "bg-blue-500 text-white"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Tarih</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Kullanıcı</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">İşlem</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Varlık</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Detaylar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Kayıt bulunamadı
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString("tr-TR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {log.user?.name || "Sistem"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        actionColors[log.action] || "bg-slate-100 text-slate-700"
                      }`}>
                        {log.action === "CREATE" ? "Oluşturma" : log.action === "UPDATE" ? "Güncelleme" : "Silme"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{log.entity}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 max-w-md truncate">
                      {log.details || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: Math.min(pages, 10) }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/dashboard/logs?page=${p}${params.entity ? `&entity=${params.entity}` : ""}`}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                p === page
                  ? "bg-blue-500 text-white"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
