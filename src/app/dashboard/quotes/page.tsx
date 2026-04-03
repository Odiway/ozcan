import { getQuotes } from "@/actions/quotes";
import Link from "next/link";
import { FileText, Plus, Eye } from "lucide-react";

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const { quotes, total, pages } = await getQuotes(
    page,
    params.search,
    params.status
  );

  const statusLabels: Record<string, { label: string; class: string }> = {
    DRAFT: { label: "Taslak", class: "bg-yellow-100 text-yellow-700" },
    SENT: { label: "Gönderildi", class: "bg-blue-100 text-blue-700" },
    APPROVED: { label: "Onaylandı", class: "bg-green-100 text-green-700" },
    REJECTED: { label: "Reddedildi", class: "bg-red-100 text-red-700" },
    EXPIRED: { label: "Süresi Doldu", class: "bg-slate-100 text-slate-700" },
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-7 h-7" /> Teklifler
          </h1>
          <p className="text-slate-500 text-sm mt-1">{total} teklif</p>
        </div>
        <Link
          href="/dashboard/quotes/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Teklif
        </Link>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { value: "", label: "Tümü" },
          { value: "DRAFT", label: "Taslak" },
          { value: "SENT", label: "Gönderildi" },
          { value: "APPROVED", label: "Onaylandı" },
          { value: "REJECTED", label: "Reddedildi" },
        ].map((filter) => (
          <Link
            key={filter.value}
            href={`/dashboard/quotes${filter.value ? `?status=${filter.value}` : ""}`}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              (params.status || "") === filter.value
                ? "bg-blue-500 text-white"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      {/* Quotes Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                  Teklif No
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                  Müşteri
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                  Hazırlayan
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                  Kalemler
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                  Net Tutar
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                  KDV Dahil
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                  Durum
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                  Tarih
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                  İşlem
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    Henüz teklif bulunmuyor
                  </td>
                </tr>
              ) : (
                quotes.map((quote) => {
                  const status = statusLabels[quote.status] || statusLabels.DRAFT;
                  return (
                    <tr key={quote.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-sm font-medium text-slate-900">
                        {quote.quoteNumber}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {quote.customer.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {quote.user.name}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-slate-700">
                        {quote._count.items}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">
                        {quote.totalNetPrice.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-blue-600">
                        {quote.totalWithKdv.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${status.class}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-slate-500">
                        {new Date(quote.createdAt).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/dashboard/quotes/${quote.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Görüntüle
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/dashboard/quotes?page=${p}${
                params.status ? `&status=${params.status}` : ""
              }`}
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
