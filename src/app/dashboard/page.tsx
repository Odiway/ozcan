import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  Users,
  FileText,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  const [
    customerCount,
    quoteCount,
    recentQuotes,
    donaldsonCount,
    mahleCount,
    baveriaCount,
    draftQuotes,
    approvedQuotes,
  ] = await Promise.all([
    prisma.customer.count({ where: { active: true } }),
    prisma.quote.count(),
    prisma.quote.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true } },
        user: { select: { name: true } },
      },
    }),
    prisma.donaldsonProduct.count(),
    prisma.mahleProduct.count(),
    prisma.baveriaProduct.count(),
    prisma.quote.count({ where: { status: "DRAFT" } }),
    prisma.quote.count({ where: { status: "APPROVED" } }),
  ]);

  const stats = [
    {
      name: "Toplam Müşteri",
      value: customerCount,
      icon: Users,
      color: "bg-blue-500",
      href: "/dashboard/customers",
    },
    {
      name: "Toplam Teklif",
      value: quoteCount,
      icon: FileText,
      color: "bg-green-500",
      href: "/dashboard/quotes",
    },
    {
      name: "Taslak Teklifler",
      value: draftQuotes,
      icon: Clock,
      color: "bg-yellow-500",
      href: "/dashboard/quotes?status=DRAFT",
    },
    {
      name: "Onaylanan Teklifler",
      value: approvedQuotes,
      icon: CheckCircle,
      color: "bg-emerald-500",
      href: "/dashboard/quotes?status=APPROVED",
    },
    {
      name: "Ürün Kataloğu",
      value: donaldsonCount + mahleCount + baveriaCount,
      icon: Package,
      color: "bg-purple-500",
      href: "/dashboard/products",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Hoş Geldiniz, {session?.user?.name}
        </h1>
        <p className="text-slate-500 mt-1">
          Özcan Filtre Yönetim Paneli
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className={`${stat.color} p-2.5 rounded-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.name}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quotes */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Son Teklifler</h2>
            <Link
              href="/dashboard/quotes"
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              Tümünü Gör
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentQuotes.length === 0 ? (
              <p className="p-5 text-slate-500 text-sm text-center">
                Henüz teklif oluşturulmamış
              </p>
            ) : (
              recentQuotes.map((quote) => (
                <Link
                  key={quote.id}
                  href={`/dashboard/quotes/${quote.id}`}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-900 text-sm">
                      {quote.quoteNumber}
                    </p>
                    <p className="text-xs text-slate-500">
                      {quote.customer.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900 text-sm">
                      {quote.totalWithKdv.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      ₺
                    </p>
                    <span
                      className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                        quote.status === "APPROVED"
                          ? "bg-green-100 text-green-700"
                          : quote.status === "SENT"
                          ? "bg-blue-100 text-blue-700"
                          : quote.status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {quote.status === "DRAFT"
                        ? "Taslak"
                        : quote.status === "SENT"
                        ? "Gönderildi"
                        : quote.status === "APPROVED"
                        ? "Onaylandı"
                        : quote.status === "REJECTED"
                        ? "Reddedildi"
                        : "Süresi Doldu"}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Product Catalog Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-5 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">Ürün Kataloğu Özeti</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-slate-700">Donaldson</span>
              </div>
              <span className="font-medium text-slate-900">
                {donaldsonCount.toLocaleString()} ürün
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-slate-700">MAHLE</span>
              </div>
              <span className="font-medium text-slate-900">
                {mahleCount.toLocaleString()} ürün
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-sm text-slate-700">Baveria-Woodson</span>
              </div>
              <span className="font-medium text-slate-900">
                {baveriaCount.toLocaleString()} ürün
              </span>
            </div>
            <div className="pt-4 border-t border-slate-200">
              <Link
                href="/dashboard/quotes/new"
                className="w-full block text-center py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Yeni Teklif Oluştur
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
