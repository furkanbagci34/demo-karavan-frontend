"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { OfferStatus } from "@/lib/enums";

interface RecentOffer {
    id: number;
    total_amount: number;
    status: string;
    created_at: string;
    customer_name: string;
}

interface RecentOffersListProps {
    data: RecentOffer[];
    isLoading: boolean;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case OfferStatus.TASLAK:
            return "bg-yellow-100 text-yellow-800";
        case OfferStatus.GONDERILDI:
            return "bg-blue-100 text-blue-800";
        case OfferStatus.ONAYLANDI:
            return "bg-green-100 text-green-800";
        case OfferStatus.REDDEDILDI:
            return "bg-red-100 text-red-800";
        case OfferStatus.TAMAMLANDI:
            return "bg-gray-100 text-gray-800";
        default:
            return "bg-blue-100 text-blue-800";
    }
};

const getStatusText = (status: string) => {
    switch (status) {
        case OfferStatus.TASLAK:
            return "Beklemede";
        case OfferStatus.GONDERILDI:
            return "Gönderildi";
        case OfferStatus.ONAYLANDI:
            return "Onaylandı";
        case OfferStatus.REDDEDILDI:
            return "Reddedildi";
        case OfferStatus.TAMAMLANDI:
            return "Tamamlandı";
        default:
            return status;
    }
};

export default function RecentOffersList({ data, isLoading }: RecentOffersListProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Son Teklifler
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
                        <FileText className="h-5 w-5" />
                        Son Teklifler
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

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Son Teklifler
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {data.map((offer) => (
                        <div key={offer.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <div className="font-medium">Teklif #{offer.id}</div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <User className="h-3 w-3" />
                                        {offer.customer_name}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-medium">
                                    {offer.total_amount.toLocaleString("tr-TR", { style: "currency", currency: "EUR" })}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge className={getStatusColor(offer.status)}>
                                        {getStatusText(offer.status)}
                                    </Badge>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {new Date(offer.created_at).toLocaleDateString("tr-TR")}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
