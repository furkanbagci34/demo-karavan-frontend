"use client";

import React from "react";
import { useDashboardSummary, useMonthlyRevenue, useTopProducts, useRecentOffers } from "@/hooks/api/useDashboard";
import DashboardStatCard from "@/components/dashboard/DashboardStatCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import TopProductsList from "@/components/dashboard/TopProductsList";
import RecentOffersList from "@/components/dashboard/RecentOffersList";
import { Users, FileText, Package, Euro, Factory, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/api/useAuth";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";

export default function DashboardPage() {
    const { user } = useAuth();
    const { summary, isLoading: summaryLoading, error: summaryError } = useDashboardSummary();
    const { monthlyRevenue, isLoading: revenueLoading } = useMonthlyRevenue();
    const { topProducts, isLoading: productsLoading } = useTopProducts();
    const { recentOffers, isLoading: offersLoading } = useRecentOffers();

    // Role 3 için özel dashboard tasarımı
    const isRole3 = user?.role === "user";

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b md:hidden">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Genel Bakış</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>
            <div className="p-4 md:p-8">
                <h1 className="text-2xl md:text-4xl font-bold mb-4 md:mb-8 text-slate-800">
                    {isRole3 ? "Üretim Operatörü Paneli 🏭" : "Hoşgeldiniz 👋"}
                </h1>

                {isRole3 ? (
                    // Role 3 için özel dashboard tasarımı
                    <div className="space-y-6">
                        {/* Üretim İstatistikleri */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            <DashboardStatCard
                                title="Aktif Operasyonlar"
                                value="12"
                                icon={<Factory />}
                                color="#2563eb"
                                description="Şu anda devam eden operasyonlar"
                            />
                            <DashboardStatCard
                                title="Bekleyen İşler"
                                value="8"
                                icon={<Clock />}
                                color="#f59e42"
                                description="Başlamayı bekleyen operasyonlar"
                            />
                            <DashboardStatCard
                                title="Tamamlanan İşler"
                                value="45"
                                icon={<CheckCircle />}
                                color="#10b981"
                                description="Bugün tamamlanan operasyonlar"
                            />
                            <DashboardStatCard
                                title="Kalite Kontrol"
                                value="3"
                                icon={<AlertTriangle />}
                                color="#e11d48"
                                description="Kalite kontrol bekleyen işler"
                            />
                        </div>

                        {/* Üretim Durumu */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Günlük Üretim Grafiği */}
                            <div className="bg-white rounded-lg shadow-sm border p-6">
                                <h3 className="text-lg font-semibold mb-4">Günlük Üretim Durumu</h3>
                                <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                                    <div className="text-center">
                                        <Factory className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-500">Üretim grafiği burada görünecek</p>
                                    </div>
                                </div>
                            </div>

                            {/* İstasyon Durumları */}
                            <div className="bg-white rounded-lg shadow-sm border p-6">
                                <h3 className="text-lg font-semibold mb-4">İstasyon Durumları</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                            <span className="font-medium">İstasyon 1 - Montaj</span>
                                        </div>
                                        <span className="text-sm text-gray-600">Aktif</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                            <span className="font-medium">İstasyon 2 - Test</span>
                                        </div>
                                        <span className="text-sm text-gray-600">Beklemede</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                            <span className="font-medium">İstasyon 3 - Kalite</span>
                                        </div>
                                        <span className="text-sm text-gray-600">Arızalı</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Son Operasyonlar */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h3 className="text-lg font-semibold mb-4">Son Operasyonlar</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2">Operasyon</th>
                                            <th className="text-left py-2">Durum</th>
                                            <th className="text-left py-2">Başlangıç</th>
                                            <th className="text-left py-2">Süre</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b">
                                            <td className="py-2">Karavan Montajı - A101</td>
                                            <td className="py-2">
                                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                                                    Aktif
                                                </span>
                                            </td>
                                            <td className="py-2 text-gray-600">09:30</td>
                                            <td className="py-2 text-gray-600">2 saat 15 dk</td>
                                        </tr>
                                        <tr className="border-b">
                                            <td className="py-2">Elektrik Testi - B202</td>
                                            <td className="py-2">
                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                                                    Beklemede
                                                </span>
                                            </td>
                                            <td className="py-2 text-gray-600">-</td>
                                            <td className="py-2 text-gray-600">-</td>
                                        </tr>
                                        <tr>
                                            <td className="py-2">Kalite Kontrol - C303</td>
                                            <td className="py-2">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                                                    Tamamlandı
                                                </span>
                                            </td>
                                            <td className="py-2 text-gray-600">08:00</td>
                                            <td className="py-2 text-gray-600">1 saat 30 dk</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Normal admin/user dashboard tasarımı
                    <>
                        {/* Summary Cards */}
                        {summaryLoading && <div className="text-center py-8">Yükleniyor...</div>}
                        {summaryError && <div className="text-red-500 mb-4">{summaryError}</div>}
                        {summary && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-4 md:mb-8">
                                <DashboardStatCard
                                    title="Toplam Müşteri"
                                    value={summary.totalCustomers}
                                    icon={<Users />}
                                    color="#2563eb"
                                    description="Kayıtlı müşteri sayısı"
                                />
                                <DashboardStatCard
                                    title="Toplam Teklif"
                                    value={summary.totalOffers}
                                    icon={<FileText />}
                                    color="#f59e42"
                                    description="Oluşturulan teklif sayısı"
                                />
                                <DashboardStatCard
                                    title="Toplam Ürün"
                                    value={summary.totalProducts}
                                    icon={<Package />}
                                    color="#10b981"
                                    description="Katalogdaki ürün sayısı"
                                />
                                <DashboardStatCard
                                    title="Toplam Ciro"
                                    value={summary.totalRevenue.toLocaleString("tr-TR", {
                                        style: "currency",
                                        currency: "EUR",
                                    })}
                                    icon={<Euro />}
                                    color="#e11d48"
                                    description="Tüm tekliflerin toplam tutarı"
                                />
                            </div>
                        )}

                        {/* Charts and Lists */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                            {/* Revenue Chart */}
                            <RevenueChart data={monthlyRevenue} isLoading={revenueLoading} />

                            {/* Top Products */}
                            <TopProductsList data={topProducts} isLoading={productsLoading} />

                            {/* Recent Offers */}
                            <RecentOffersList data={recentOffers} isLoading={offersLoading} />
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
