"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Warehouse,
  Truck,
  Shield,
  ScrollText,
  LogOut,
  Menu,
  X,
  Filter,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "Panel", href: "/dashboard", icon: LayoutDashboard },
  { name: "Teklif Oluştur", href: "/dashboard/quotes/new", icon: FileText },
  { name: "Teklifler", href: "/dashboard/quotes", icon: ScrollText },
  { name: "Müşteriler", href: "/dashboard/customers", icon: Users },
  {
    name: "Ürün Katalog",
    href: "/dashboard/products",
    icon: Package,
    children: [
      { name: "Tüm Ürünler", href: "/dashboard/products" },
      { name: "Donaldson", href: "/dashboard/products/donaldson" },
      { name: "MAHLE", href: "/dashboard/products/mahle" },
      { name: "Baveria-Woodson", href: "/dashboard/products/baveria" },
    ],
  },
  { name: "Stok Yönetimi", href: "/dashboard/stock", icon: Warehouse },
  { name: "Kargo Hesapla", href: "/dashboard/shipping", icon: Truck },
];

const adminNavigation = [
  { name: "Kullanıcılar", href: "/dashboard/users", icon: Shield },
  { name: "İşlem Kayıtları", href: "/dashboard/logs", icon: ScrollText },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const isAdmin = session?.user?.role === "ADMIN";
  const isManager = session?.user?.role === "MANAGER" || isAdmin;

  const toggleExpand = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const NavContent = () => (
    <>
      <div className="flex items-center gap-3 px-4 py-6 border-b border-slate-700">
        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
          <Filter className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-white font-bold text-sm">Özcan Filtre</h2>
          <p className="text-slate-400 text-xs">Yönetim Sistemi</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedItems.includes(item.name);

          return (
            <div key={item.name}>
              {hasChildren ? (
                <>
                  <button
                    onClick={() => toggleExpand(item.name)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-500/20 text-blue-400"
                        : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                    }`}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="flex-1 text-left">{item.name}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isExpanded && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                            pathname === child.href
                              ? "bg-blue-500/20 text-blue-400"
                              : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
                          }`}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {item.name}
                </Link>
              )}
            </div>
          );
        })}

        {isManager && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Yönetim
              </p>
            </div>
            {adminNavigation.map((item) => {
              if (item.href === "/dashboard/users" && !isAdmin) return null;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {session?.user?.name?.charAt(0) || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{session?.user?.name}</p>
            <p className="text-xs text-slate-400 truncate">
              {session?.user?.role === "ADMIN"
                ? "Yönetici"
                : session?.user?.role === "MANAGER"
                ? "Müdür"
                : "Satış Temsilcisi"}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Çıkış Yap
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 rounded-lg text-white shadow-lg"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-800 flex flex-col transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <NavContent />
      </aside>
    </>
  );
}
