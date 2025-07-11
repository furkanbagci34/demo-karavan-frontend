"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp } from "lucide-react";

interface TopProduct {
    product_name: string;
    order_count: number;
    total_revenue: number;
}

interface TopProductsListProps {
    data: TopProduct[];
    isLoading: boolean;
}

export default function TopProductsList({ data, isLoading }: TopProductsListProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        En Çok Satan Ürünler
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
                        <Package className="h-5 w-5" />
                        En Çok Satan Ürünler
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

    const maxRevenue = Math.max(...data.map((d) => d.total_revenue));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    En Çok Satan Ürünler
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {data.map((product, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                                    <TrendingUp className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <div className="font-medium">{product.product_name}</div>
                                    <div className="text-sm text-muted-foreground">{product.order_count} sipariş</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-medium">
                                    {product.total_revenue.toLocaleString("tr-TR", {
                                        style: "currency",
                                        currency: "EUR",
                                    })}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {maxRevenue > 0 ? Math.round((product.total_revenue / maxRevenue) * 100) : 0}% pay
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
