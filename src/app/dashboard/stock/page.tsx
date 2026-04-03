"use client";

import { useState, useEffect } from "react";
import { getStockItems, updateStockQuantity, createStockItem, bulkNormalizeCodes } from "@/actions/stock";
import { Search, Plus, Save, Warehouse, RefreshCw, X } from "lucide-react";

type StockItem = {
  id: string;
  filterCode: string;
  normalizedCode: string | null;
  donaldsonCode: string | null;
  mahleCode: string | null;
  quantity: number;
};

export default function StockPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    filterCode: "",
    donaldsonCode: "",
    mahleCode: "",
    quantity: 0,
  });

  useEffect(() => {
    loadItems();
  }, [search]);

  async function loadItems() {
    setLoading(true);
    const data = await getStockItems(search || undefined);
    setItems(data);
    setLoading(false);
  }

  async function handleQuantityChange(id: string, quantity: number) {
    await updateStockQuantity(id, quantity);
    loadItems();
  }

  async function handleNormalize() {
    const result = await bulkNormalizeCodes();
    alert(`${result.updated} adet kod normalize edildi.`);
    loadItems();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createStockItem(form);
    setShowModal(false);
    setForm({ filterCode: "", donaldsonCode: "", mahleCode: "", quantity: 0 });
    loadItems();
  }

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Warehouse className="w-7 h-7" /> Stok Yönetimi
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {items.length} ürün • Toplam: {totalQuantity} adet
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleNormalize}
            className="flex items-center gap-2 px-3 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Kodları Normalize Et
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Stok Ekle
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtre kodu ile ara..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Filtre Kodu</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Normalize Kod</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Donaldson</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">MAHLE</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Adet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Yükleniyor...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Stok kaydı bulunamadı
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-sm font-medium text-slate-900">
                      {item.filterCode}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-slate-500">
                      {item.normalizedCode || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {item.donaldsonCode || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.mahleCode || "-"}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        defaultValue={item.quantity}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          if (val !== item.quantity) {
                            handleQuantityChange(item.id, val);
                          }
                        }}
                        className="w-20 mx-auto block px-2 py-1.5 border border-slate-200 rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Stok Ekle</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Filtre Kodu *</label>
                <input
                  type="text"
                  value={form.filterCode}
                  onChange={(e) => setForm({ ...form, filterCode: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Donaldson Kodu</label>
                  <input
                    type="text"
                    value={form.donaldsonCode}
                    onChange={(e) => setForm({ ...form, donaldsonCode: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">MAHLE Kodu</label>
                  <input
                    type="text"
                    value={form.mahleCode}
                    onChange={(e) => setForm({ ...form, mahleCode: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Adet</label>
                <input
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
