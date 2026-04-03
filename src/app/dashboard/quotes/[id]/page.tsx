"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getQuote, updateQuoteStatus, deleteQuote } from "@/actions/quotes";
import {
  FileText,
  ArrowLeft,
  Send,
  CheckCircle,
  XCircle,
  Trash2,
  Printer,
} from "lucide-react";

type QuoteData = Awaited<ReturnType<typeof getQuote>>;

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [quote, setQuote] = useState<QuoteData>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getQuote(params.id as string).then((data) => {
      setQuote(data);
      setLoading(false);
    });
  }, [params.id]);

  async function handleStatusChange(status: "SENT" | "APPROVED" | "REJECTED") {
    if (!quote) return;
    await updateQuoteStatus(quote.id, status);
    const updated = await getQuote(quote.id);
    setQuote(updated);
  }

  async function handleDelete() {
    if (!quote) return;
    if (confirm("Bu teklifi silmek istediğinizden emin misiniz?")) {
      await deleteQuote(quote.id);
      router.push("/dashboard/quotes");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="text-center py-20 text-slate-500">Teklif bulunamadı</div>
    );
  }

  const statusColors: Record<string, string> = {
    DRAFT: "bg-yellow-100 text-yellow-700",
    SENT: "bg-blue-100 text-blue-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
    EXPIRED: "bg-slate-100 text-slate-700",
  };

  const statusLabels: Record<string, string> = {
    DRAFT: "Taslak",
    SENT: "Gönderildi",
    APPROVED: "Onaylandı",
    REJECTED: "Reddedildi",
    EXPIRED: "Süresi Doldu",
  };

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/quotes")}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6" />
              {quote.quoteNumber}
            </h1>
            <p className="text-slate-500 text-sm">
              {new Date(quote.createdAt).toLocaleDateString("tr-TR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${statusColors[quote.status]}`}>
            {statusLabels[quote.status]}
          </span>
          {quote.status === "DRAFT" && (
            <>
              <button
                onClick={() => handleStatusChange("SENT")}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Send className="w-4 h-4" />
                Gönder
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          {quote.status === "SENT" && (
            <>
              <button
                onClick={() => handleStatusChange("APPROVED")}
                className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Onayla
              </button>
              <button
                onClick={() => handleStatusChange("REJECTED")}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Reddet
              </button>
            </>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Printer className="w-4 h-4" />
            Yazdır
          </button>
        </div>
      </div>

      {/* Quote Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Müşteri</p>
          <p className="font-semibold text-slate-900">{quote.customer.name}</p>
          {quote.customer.phone && (
            <p className="text-sm text-slate-500 mt-1">{quote.customer.phone}</p>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Ödeme Bilgileri</p>
          <p className="font-semibold text-slate-900">
            {quote.paymentMethod === "NAKIT"
              ? "Nakit"
              : quote.paymentMethod === "VADELI"
              ? "Vadeli"
              : "Euro"}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            İskonto: %{(quote.discountRate * 100).toFixed(0)}
            {quote.euroRate && ` • €1 = ${quote.euroRate}₺`}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Hazırlayan</p>
          <p className="font-semibold text-slate-900">{quote.user.name}</p>
          <p className="text-sm text-slate-500 mt-1">{quote.user.email}</p>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Teklif Kalemleri ({quote.items.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">No</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Filtre Kodu</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Müşteri Kodu</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500">Adet</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Birim Fiyat</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">KDV Dahil B.F.</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Toplam Net</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500">Kaynak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quote.items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-500">{item.lineNumber}</td>
                  <td className="px-4 py-3 font-mono text-sm font-medium text-slate-900">
                    {item.filterCode}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{item.customerCode || "-"}</td>
                  <td className="px-4 py-3 text-sm text-center">{item.quantity}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">
                    {item.unitPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-slate-600">
                    {item.unitPriceWithKdv.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">
                    {item.totalNetPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        item.supplierSource === "DONALDSON"
                          ? "bg-blue-100 text-blue-700"
                          : item.supplierSource === "MAHLE"
                          ? "bg-green-100 text-green-700"
                          : item.supplierSource === "BAVERIA"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.supplierSource || "-"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="bg-slate-50 px-5 py-4 border-t border-slate-200">
          <div className="flex justify-end gap-8">
            <div>
              <p className="text-sm text-slate-500">Toplam Net Fiyat</p>
              <p className="text-lg font-bold text-slate-900">
                {quote.totalNetPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}{" "}
                {quote.paymentMethod === "EURO" ? "€" : "₺"}
              </p>
            </div>
            {quote.paymentMethod !== "EURO" && (
              <div>
                <p className="text-sm text-slate-500">KDV Dahil Toplam</p>
                <p className="text-xl font-bold text-blue-600">
                  {quote.totalWithKdv.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      {quote.notes && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Notlar</p>
          <p className="text-sm text-slate-700">{quote.notes}</p>
        </div>
      )}

      {/* Terms */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
        <p className="text-sm text-blue-800">
          * Teklif opsiyonu{" "}
          {quote.paymentMethod === "NAKIT" || quote.paymentMethod === "VADELI"
            ? "1 gündür"
            : "3 gündür"}
          .
          <br />* Nakliye tarafınıza aittir.
          {quote.paymentMethod === "EURO" && (
            <>
              <br />* Teklif Euro verilmiş olup fatura tarihindeki Ziraat Bankası
              döviz satış kuru üzerinden fatura edilecektir.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
