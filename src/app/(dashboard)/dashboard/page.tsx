"use client";

import React from "react";
import { useDashboardSummary, useMonthlyRevenue, useTopProducts, useRecentOffers } from "@/hooks/api/useDashboard";
import DashboardStatCard from "@/components/dashboard/DashboardStatCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import TopProductsList from "@/components/dashboard/TopProductsList";
import RecentOffersList from "@/components/dashboard/RecentOffersList";
import { Users, FileText, Package, Euro } from "lucide-react";

export default function DashboardPage() {
    const { summary, isLoading: summaryLoading, error: summaryError } = useDashboardSummary();
    const { monthlyRevenue, isLoading: revenueLoading } = useMonthlyRevenue();
    const { topProducts, isLoading: productsLoading } = useTopProducts();
    const { recentOffers, isLoading: offersLoading } = useRecentOffers();

    return (
        <div style={{ padding: 32 }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 32, color: "#1e293b" }}>Hoşgeldiniz 👋</h1>

            {/* Summary Cards */}
            {summaryLoading && <div>Yükleniyor...</div>}
            {summaryError && <div style={{ color: "red", marginBottom: 16 }}>{summaryError}</div>}
            {summary && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                        gap: 32,
                        marginBottom: 32,
                    }}
                >
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
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
                    gap: 32,
                }}
            >
                {/* Revenue Chart */}
                <RevenueChart data={monthlyRevenue} isLoading={revenueLoading} />

                {/* Top Products */}
                <TopProductsList data={topProducts} isLoading={productsLoading} />

                {/* Recent Offers */}
                <RecentOffersList data={recentOffers} isLoading={offersLoading} />
            </div>
        </div>
    );
}
