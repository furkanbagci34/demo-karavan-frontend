"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface MonthlyRevenue {
    month: string;
    revenue: number;
}

interface RevenueChartProps {
    data: MonthlyRevenue[];
    isLoading: boolean;
}

export default function RevenueChart({ data, isLoading }: RevenueChartProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Aylık Gelir Trendi
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-center justify-center">
                        <div className="text-muted-foreground">Yükleniyor...</div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Aylık Gelir Trendi
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-center justify-center">
                        <div className="text-muted-foreground">Veri bulunamadı</div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const maxRevenue = Math.max(...data.map((d) => d.revenue));
    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Aylık Gelir Trendi
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="text-2xl font-bold">
                        {totalRevenue.toLocaleString("tr-TR", { style: "currency", currency: "EUR" })}
                    </div>
                    <div className="space-y-2">
                        {data.map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="text-sm font-medium">
                                        {new Date(item.month).toLocaleDateString("tr-TR", {
                                            year: "numeric",
                                            month: "long",
                                        })}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {item.revenue.toLocaleString("tr-TR", { style: "currency", currency: "EUR" })}
                                    </div>
                                </div>
                                <div className="flex-1 ml-4">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{
                                                width: `${maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
