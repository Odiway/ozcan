"use client";

import { useState } from "react";
import { calculateShipping } from "@/actions/shipping";
import { Truck, Plus, Trash2, Calculator } from "lucide-react";

type Dimension = {
  id: number;
  width: string;
  height: string;
  depth: string;
};

export default function ShippingPage() {
  const [dimensions, setDimensions] = useState<Dimension[]>([
    { id: 1, width: "", height: "", depth: "" },
  ]);
  const [result, setResult] = useState<{
    totalDesi: number;
    netPrice: number;
    kdvIncluded: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  function addRow() {
    setDimensions([
      ...dimensions,
      { id: Date.now(), width: "", height: "", depth: "" },
    ]);
  }

  function removeRow(id: number) {
    if (dimensions.length === 1) return;
    setDimensions(dimensions.filter((d) => d.id !== id));
  }

  function updateDim(id: number, field: string, value: string) {
    setDimensions(
      dimensions.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  }

  async function handleCalculate() {
    const validDims = dimensions
      .filter((d) => d.width && d.height && d.depth)
      .map((d) => ({
        width: parseFloat(d.width),
        height: parseFloat(d.height),
        depth: parseFloat(d.depth),
      }));

    if (validDims.length === 0) return;

    setLoading(true);
    const res = await calculateShipping(validDims);
    setResult(res);
    setLoading(false);
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Truck className="w-7 h-7" /> Kargo Hesaplama
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Paket boyutlarını girerek kargo ücretini hesaplayın
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Paket Ölçüleri (cm)</h2>
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Paket Ekle
          </button>
        </div>

        <div className="space-y-3">
          {dimensions.map((dim, index) => (
            <div key={dim.id} className="flex items-center gap-3">
              <span className="text-sm text-slate-500 w-8">{index + 1}.</span>
              <input
                type="number"
                value={dim.width}
                onChange={(e) => updateDim(dim.id, "width", e.target.value)}
                placeholder="Genişlik"
                className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-slate-400">×</span>
              <input
                type="number"
                value={dim.height}
                onChange={(e) => updateDim(dim.id, "height", e.target.value)}
                placeholder="Yükseklik"
                className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-slate-400">×</span>
              <input
                type="number"
                value={dim.depth}
                onChange={(e) => updateDim(dim.id, "depth", e.target.value)}
                placeholder="Derinlik"
                className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => removeRow(dim.id)}
                disabled={dimensions.length === 1}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleCalculate}
          disabled={loading}
          className="mt-6 w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Calculator className="w-5 h-5" />
              Hesapla
            </>
          )}
        </button>
      </div>

      {result && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Kargo Ücreti Sonucu</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-sm text-slate-500 mb-1">Toplam Desi</p>
              <p className="text-2xl font-bold text-slate-900">{result.totalDesi}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-600 mb-1">Net Fiyat</p>
              <p className="text-2xl font-bold text-blue-700">
                {result.netPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-sm text-green-600 mb-1">KDV Dahil</p>
              <p className="text-2xl font-bold text-green-700">
                {result.kdvIncluded.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
