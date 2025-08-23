"use client";

import React from "react";
import { useDashboardSummary, useMonthlyRevenue, useTopProducts, useRecentOffers } from "@/hooks/api/useDashboard";
import DashboardStatCard from "@/components/dashboard/DashboardStatCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import TopProductsList from "@/components/dashboard/TopProductsList";
import RecentOffersList from "@/components/dashboard/RecentOffersList";
import { Users, FileText, Package, Euro } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
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
    const { summary, isLoading: summaryLoading, error: summaryError } = useDashboardSummary();
    const { monthlyRevenue, isLoading: revenueLoading } = useMonthlyRevenue();
    const { topProducts, isLoading: productsLoading } = useTopProducts();
    const { recentOffers, isLoading: offersLoading } = useRecentOffers();

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
                <h1 className="text-2xl md:text-4xl font-bold mb-4 md:mb-8 text-slate-800">Hoşgeldiniz 👋</h1>

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
                            value={summary.totalRevenue.toLocaleString("tr-TR", { style: "currency", currency: "EUR" })}
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
            </div>
        </>
    );
}
