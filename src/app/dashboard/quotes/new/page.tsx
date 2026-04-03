"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCustomers } from "@/actions/customers";
import { lookupFilterPrice } from "@/actions/products";
import { createQuote } from "@/actions/quotes";
import {
  FileText,
  Plus,
  Trash2,
  Search,
  Calculator,
  Send,
  AlertCircle,
} from "lucide-react";

type Customer = {
  id: string;
  name: string;
  paymentPlan: string;
  discountRate: number;
};

type QuoteItem = {
  filterCode: string;
  customerCode: string;
  quantity: number;
  unitPrice: number;
  unitPriceWithKdv: number;
  totalNet: number;
  listPrice: number;
  source: string;
  loading: boolean;
  error: string;
};

export default function NewQuotePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"NAKIT" | "VADELI" | "EURO">("NAKIT");
  const [euroRate, setEuroRate] = useState(38);
  const [usdRate, setUsdRate] = useState(36);
  const [kdvRate] = useState(0.20);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<QuoteItem[]>([
    createEmptyItem(),
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function createEmptyItem(): QuoteItem {
    return {
      filterCode: "",
      customerCode: "",
      quantity: 1,
      unitPrice: 0,
      unitPriceWithKdv: 0,
      totalNet: 0,
      listPrice: 0,
      source: "",
      loading: false,
      error: "",
    };
  }

  useEffect(() => {
    getCustomers().then(setCustomers);
  }, []);

  useEffect(() => {
    if (customerSearch.length >= 1) {
      const filtered = customers.filter((c) =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase())
      );
      setFilteredCustomers(filtered.slice(0, 10));
      setShowCustomerDropdown(true);
    } else {
      setShowCustomerDropdown(false);
    }
  }, [customerSearch, customers]);

  useEffect(() => {
    if (selectedCustomer) {
      setPaymentMethod(selectedCustomer.paymentPlan as "NAKIT" | "VADELI" | "EURO");
    }
  }, [selectedCustomer]);

  function selectCustomer(customer: Customer) {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setShowCustomerDropdown(false);
  }

  async function lookupPrice(index: number) {
    const item = items[index];
    if (!item.filterCode || !selectedCustomer) return;

    const newItems = [...items];
    newItems[index] = { ...item, loading: true, error: "" };
    setItems(newItems);

    const result = await lookupFilterPrice(
      item.filterCode,
      paymentMethod,
      selectedCustomer.discountRate,
      euroRate,
      usdRate
    );

    if (result) {
      const unitPriceWithKdv =
        paymentMethod === "NAKIT" || paymentMethod === "VADELI"
          ? Math.ceil(result.unitPrice * (1 + kdvRate))
          : result.unitPrice;

      newItems[index] = {
        ...newItems[index],
        unitPrice: result.unitPrice,
        unitPriceWithKdv,
        totalNet: result.unitPrice * item.quantity,
        listPrice: result.listPrice || 0,
        source: result.source,
        loading: false,
        error: "",
      };
    } else {
      newItems[index] = {
        ...newItems[index],
        loading: false,
        error: "Ürün bulunamadı",
        unitPrice: 0,
        unitPriceWithKdv: 0,
        totalNet: 0,
        listPrice: 0,
        source: "",
      };
    }
    setItems(newItems);
  }

  function updateItem(index: number, field: string, value: string | number) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "quantity") {
      newItems[index].totalNet = newItems[index].unitPrice * (value as number);
    }

    setItems(newItems);
  }

  function addItem() {
    setItems([...items, createEmptyItem()]);
  }

  function removeItem(index: number) {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  }

  async function lookupAllPrices() {
    for (let i = 0; i < items.length; i++) {
      if (items[i].filterCode && !items[i].unitPrice) {
        await lookupPrice(i);
      }
    }
  }

  const totalNet = items.reduce((sum, item) => sum + item.totalNet, 0);
  const totalWithKdv =
    paymentMethod === "NAKIT" || paymentMethod === "VADELI"
      ? Math.ceil(totalNet * (1 + kdvRate))
      : totalNet;

  async function handleSubmit() {
    if (!selectedCustomer) {
      setError("Lütfen bir müşteri seçin");
      return;
    }

    const validItems = items.filter((item) => item.filterCode && item.unitPrice > 0);
    if (validItems.length === 0) {
      setError("Lütfen en az bir ürün ekleyin ve fiyat sorgulayın");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const quote = await createQuote({
        customerId: selectedCustomer.id,
        paymentMethod,
        euroRate,
        usdRate,
        notes,
        items: validItems.map((item) => ({
          filterCode: item.filterCode,
          customerCode: item.customerCode,
          quantity: item.quantity,
        })),
      });

      router.push(`/dashboard/quotes/${quote.id}`);
    } catch (err) {
      setError("Teklif oluşturulurken bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-7 h-7" /> Yeni Teklif Oluştur
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Müşteri seçin, filtre kodlarını girin ve teklif oluşturun
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Customer & Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">Müşteri ve Ödeme Bilgileri</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Customer Search */}
          <div className="lg:col-span-2 relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Müşteri *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  if (selectedCustomer && e.target.value !== selectedCustomer.name) {
                    setSelectedCustomer(null);
                  }
                }}
                onFocus={() => customerSearch && setShowCustomerDropdown(true)}
                placeholder="Müşteri adı yazarak arayın..."
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {showCustomerDropdown && filteredCustomers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => selectCustomer(customer)}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm border-b border-slate-100 last:border-0"
                  >
                    <p className="font-medium text-slate-900">{customer.name}</p>
                    <p className="text-xs text-slate-500">
                      {customer.paymentPlan} • %{(customer.discountRate * 100).toFixed(0)} iskonto
                    </p>
                  </button>
                ))}
              </div>
            )}
            {selectedCustomer && (
              <p className="text-xs text-green-600 mt-1">
                ✓ Seçilen: {selectedCustomer.name} (İskonto: %{(selectedCustomer.discountRate * 100).toFixed(0)})
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Ödeme Şekli
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as "NAKIT" | "VADELI" | "EURO")}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="NAKIT">Nakit</option>
              <option value="VADELI">Vadeli</option>
              <option value="EURO">Euro</option>
            </select>
          </div>

          {/* Euro Rate */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Euro Kuru (₺)
            </label>
            <input
              type="number"
              step="0.01"
              value={euroRate}
              onChange={(e) => setEuroRate(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              USD Kuru (₺)
            </label>
            <input
              type="number"
              step="0.01"
              value={usdRate}
              onChange={(e) => setUsdRate(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notlar
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Teklif notu..."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Quote Items */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Teklif Kalemleri</h2>
          <div className="flex gap-2">
            <button
              onClick={lookupAllPrices}
              disabled={!selectedCustomer}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Calculator className="w-4 h-4" />
              Tümünü Hesapla
            </button>
            <button
              onClick={addItem}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Satır Ekle
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 w-8">No</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Müşteri Kodu</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Filtre No *</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 w-20">Adet</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500">Birim Fiyat</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500">KDV Dahil</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500">Toplam Net</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500">Kaynak</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 w-20">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, index) => (
                <tr key={index} className={item.error ? "bg-red-50" : ""}>
                  <td className="px-3 py-2 text-sm text-slate-500">{index + 1}</td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.customerCode}
                      onChange={(e) => updateItem(index, "customerCode", e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Opsiyonel"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.filterCode}
                      onChange={(e) =>
                        updateItem(index, "filterCode", e.target.value.toUpperCase())
                      }
                      onBlur={() => lookupPrice(index)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="örn: P550148"
                    />
                    {item.error && (
                      <p className="text-xs text-red-500 mt-0.5">{item.error}</p>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const q = parseInt(e.target.value) || 1;
                        updateItem(index, "quantity", q);
                        const newItems = [...items];
                        newItems[index].totalNet = newItems[index].unitPrice * q;
                        setItems(newItems);
                      }}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 py-2 text-sm text-right font-medium">
                    {item.loading ? (
                      <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin ml-auto" />
                    ) : item.unitPrice > 0 ? (
                      item.unitPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-3 py-2 text-sm text-right">
                    {item.unitPriceWithKdv > 0
                      ? item.unitPriceWithKdv.toLocaleString("tr-TR", { minimumFractionDigits: 2 })
                      : "-"}
                  </td>
                  <td className="px-3 py-2 text-sm text-right font-medium">
                    {item.totalNet > 0
                      ? item.totalNet.toLocaleString("tr-TR", { minimumFractionDigits: 2 })
                      : "-"}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {item.source && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          item.source === "DONALDSON"
                            ? "bg-blue-100 text-blue-700"
                            : item.source === "MAHLE"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {item.source}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded disabled:opacity-30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary & Submit */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">Toplam Net:</span>
              <span className="text-lg font-bold text-slate-900">
                {totalNet.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}{" "}
                {paymentMethod === "EURO" ? "€" : "₺"}
              </span>
            </div>
            {(paymentMethod === "NAKIT" || paymentMethod === "VADELI") && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-500">KDV Dahil Toplam:</span>
                <span className="text-xl font-bold text-blue-600">
                  {totalWithKdv.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                </span>
              </div>
            )}
            <p className="text-xs text-slate-400">
              * Teklif opsiyonu:{" "}
              {paymentMethod === "NAKIT" || paymentMethod === "VADELI" ? "1 gün" : "3 gün"}{" "}
              • Nakliye alıcıya aittir
              {paymentMethod === "EURO" &&
                " • Euro fiyat, fatura tarihindeki Ziraat Bankası döviz satış kurundan faturalanır"}
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedCustomer}
            className="flex items-center gap-2 px-8 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white rounded-xl font-medium transition-colors"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Teklif Oluştur
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
