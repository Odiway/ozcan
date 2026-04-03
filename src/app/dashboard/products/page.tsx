"use client";

import { useState, useEffect } from "react";
import { searchProducts, getDonaldsonProducts, getMahleProducts, getBaveriaProducts } from "@/actions/products";
import { Search, Package, ChevronLeft, ChevronRight } from "lucide-react";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "donaldson" | "mahle" | "baveria">("all");
  const [results, setResults] = useState<{ donaldson: any[]; mahle: any[]; baveria: any[] }>({
    donaldson: [],
    mahle: [],
    baveria: [],
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [activeTab, page]);

  async function loadProducts() {
    setLoading(true);
    if (activeTab === "all" || search.length >= 2) {
      const data = await searchProducts(search || "a");
      setResults(data);
    } else if (activeTab === "donaldson") {
      const data = await getDonaldsonProducts(page, search || undefined);
      setResults({ ...results, donaldson: data.products });
      setTotalPages(data.pages);
    } else if (activeTab === "mahle") {
      const data = await getMahleProducts(page, search || undefined);
      setResults({ ...results, mahle: data.products });
      setTotalPages(data.pages);
    } else if (activeTab === "baveria") {
      const data = await getBaveriaProducts(page, search || undefined);
      setResults({ ...results, baveria: data.products });
      setTotalPages(data.pages);
    }
    setLoading(false);
  }

  function handleSearch() {
    setPage(1);
    loadProducts();
  }

  const tabs = [
    { id: "all", name: "Tüm Aramalar" },
    { id: "donaldson", name: "Donaldson" },
    { id: "mahle", name: "MAHLE" },
    { id: "baveria", name: "Baveria-Woodson" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Package className="w-7 h-7" /> Ürün Kataloğu
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Donaldson, MAHLE ve Baveria-Woodson ürünlerini arayın
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Filtre kodu veya açıklama ile ara..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
        >
          Ara
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as typeof activeTab);
              setPage(1);
            }}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Yükleniyor...</div>
      ) : (
        <>
          {/* Donaldson Results */}
          {(activeTab === "all" || activeTab === "donaldson") && results.donaldson.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 overflow-hidden">
              <div className="px-5 py-4 bg-blue-50 border-b border-blue-100">
                <h3 className="font-semibold text-blue-900">
                  Donaldson ({results.donaldson.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Parça No</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Açıklama</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Net Fiyat (€)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results.donaldson.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-sm font-medium text-slate-900">{p.partNumber}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{p.description || "-"}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">
                          €{p.netPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MAHLE Results */}
          {(activeTab === "all" || activeTab === "mahle") && results.mahle.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 overflow-hidden">
              <div className="px-5 py-4 bg-green-50 border-b border-green-100">
                <h3 className="font-semibold text-green-900">
                  MAHLE ({results.mahle.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">MAHLE Ref</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Ürün Adı</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Araç Grubu</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Durum</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Fiyat (€)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results.mahle.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-sm font-medium text-slate-900">{p.mahleRef}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{p.productName || "-"}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{p.vehicleGroup || "-"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            p.availability === "Available"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {p.availability || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">
                          €{p.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Baveria Results */}
          {(activeTab === "all" || activeTab === "baveria") && results.baveria.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 overflow-hidden">
              <div className="px-5 py-4 bg-orange-50 border-b border-orange-100">
                <h3 className="font-semibold text-orange-900">
                  Baveria-Woodson ({results.baveria.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Filtre Kodu</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Woodson Kodu</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Fiyat ($)</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">İskonto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results.baveria.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-sm font-medium text-slate-900">{p.filterCode}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{p.woodsonCode || "-"}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">
                          ${p.unitPriceUsd.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-slate-600">
                          %{(p.discountRate * 100).toFixed(0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination for single tab views */}
          {activeTab !== "all" && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-600">
                Sayfa {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* No results */}
          {results.donaldson.length === 0 &&
            results.mahle.length === 0 &&
            results.baveria.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>Ürün bulunamadı. Lütfen farklı bir arama yapın.</p>
              </div>
            )}
        </>
      )}
    </div>
  );
}
