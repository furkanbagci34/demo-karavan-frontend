/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileBarChart, Loader2, Search, Eye, Calendar, Factory, Clock, PlayCircle, Car, User } from "lucide-react";
import { useReports } from "@/hooks/api/useReports";
import { useQueryClient } from "@tanstack/react-query";

export default function ReportsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");

    const { useProductionExecutionsReport } = useReports();
    const { data: executions, isLoading, error } = useProductionExecutionsReport();

    // Manual refresh fonksiyonu
    const handleRefresh = () => {
        // Cache'i invalidate et ve yeniden çek
        queryClient.invalidateQueries({ queryKey: ["reports", "production-executions"] });
    };

    // Arama filtresi
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filteredExecutions = executions?.filter((execution: any) => {
        if (!searchTerm.trim()) return true;

        const searchLower = searchTerm.toLowerCase();
        return (
            execution.production_plan_name?.toLowerCase().includes(searchLower) ||
            execution.vehicle_name?.toLowerCase().includes(searchLower) ||
            execution.customer_name?.toLowerCase().includes(searchLower) ||
            execution.offer_number?.toLowerCase().includes(searchLower) ||
            execution.plate_number?.toLowerCase().includes(searchLower) ||
            execution.number?.toString().includes(searchLower) ||
            execution.created_by_name?.toLowerCase().includes(searchLower)
        );
    });

    // Status renkleri
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "idle":
                return (
                    <Badge variant="outline" className="bg-gray-100">
                        Boşta
                    </Badge>
                );
            case "running":
                return <Badge className="bg-blue-500">Devam Ediyor</Badge>;
            case "paused":
                return <Badge className="bg-yellow-500">Duraklatıldı</Badge>;
            case "completed":
                return <Badge className="bg-green-500">Tamamlandı</Badge>;
            case "cancelled":
                return <Badge variant="destructive">İptal Edildi</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    // Tarih formatlama
    const formatDate = (dateString: string | null) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden sm:block">
                                <BreadcrumbLink href="/dashboard">Anasayfa</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden sm:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Raporlar</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                {/* Başlık */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <FileBarChart className="h-6 w-6 text-blue-600" />
                        Üretim Raporları
                    </h1>
                    <Button onClick={handleRefresh} variant="outline" disabled={isLoading} className="gap-2">
                        <Loader2 className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        Yenile
                    </Button>
                </div>

                {/* Ana İçerik */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Factory className="h-5 w-5" />
                            Üretim Planları
                        </CardTitle>
                        <CardDescription>
                            Tüm üretim planlarını görüntüleyin ve detaylı raporlarını inceleyin
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Arama */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Şablon, model, müşteri, teklif no, plaka veya numara ile ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Loading State */}
                        {isLoading && (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
                                <span className="text-gray-600">Raporlar yükleniyor...</span>
                            </div>
                        )}

                        {/* Error State */}
                        {error && (
                            <div className="text-center py-12">
                                <div className="text-red-600 mb-4">
                                    <h3 className="text-lg font-semibold">Hata Oluştu</h3>
                                    <p className="text-sm mt-2">Raporlar yüklenirken bir hata oluştu.</p>
                                    <p className="text-xs mt-1 text-gray-500">
                                        {error instanceof Error ? error.message : "Bilinmeyen hata"}
                                    </p>
                                </div>
                                <Button onClick={() => window.location.reload()} variant="outline">
                                    Sayfayı Yenile
                                </Button>
                            </div>
                        )}

                        {/* Tablo */}
                        {!isLoading && !error && filteredExecutions && filteredExecutions.length > 0 && (
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50">
                                            <TableHead className="text-center w-16">No</TableHead>
                                            <TableHead>Üretim Şablonu</TableHead>
                                            <TableHead>Model</TableHead>
                                            <TableHead>Müşteri</TableHead>
                                            <TableHead className="text-center">Operasyonlar</TableHead>
                                            <TableHead className="text-center">İlerleme</TableHead>
                                            <TableHead className="text-center">Durum</TableHead>
                                            <TableHead>Oluşturma Tarihi</TableHead>
                                            <TableHead className="text-center w-32">İşlemler</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredExecutions.map((execution: any) => (
                                            <TableRow key={execution.id} className="hover:bg-gray-50">
                                                <TableCell className="text-center">
                                                    {execution.number ? (
                                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm mx-auto">
                                                            {execution.number}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Factory className="h-4 w-4 text-gray-400" />
                                                        <span className="font-medium">
                                                            {execution.production_plan_name}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Car className="h-4 w-4 text-gray-400" />
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-sm">
                                                                {execution.vehicle_name}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {execution.vehicle_brand_model}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-gray-400" />
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-sm">
                                                                {execution.customer_name || "-"}
                                                            </span>
                                                            {execution.offer_number && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    Teklif: {execution.offer_number}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className="font-semibold">
                                                            {execution.completed_operations}/
                                                            {execution.total_operations}
                                                        </span>
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            {execution.in_progress_operations > 0 && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs px-1 py-0 h-5 bg-blue-50"
                                                                >
                                                                    <PlayCircle className="h-3 w-3 mr-1" />
                                                                    {execution.in_progress_operations}
                                                                </Badge>
                                                            )}
                                                            {execution.pending_operations > 0 && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs px-1 py-0 h-5 bg-gray-50"
                                                                >
                                                                    <Clock className="h-3 w-3 mr-1" />
                                                                    {execution.pending_operations}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                                                                style={{
                                                                    width: `${execution.progress_percentage}%`,
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-semibold text-gray-700">
                                                            {execution.progress_percentage}%
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {getStatusBadge(execution.status)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Calendar className="h-4 w-4 text-gray-400" />
                                                        <div className="flex flex-col">
                                                            <span>{formatDate(execution.created_at)}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {execution.created_by_name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Button
                                                        onClick={() => router.push(`/reports/${execution.id}`)}
                                                        size="sm"
                                                        variant="outline"
                                                        className="gap-2"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        Detay
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {/* Boş State */}
                        {!isLoading && !error && (!filteredExecutions || filteredExecutions.length === 0) && (
                            <div className="text-center py-12">
                                <FileBarChart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-600 mb-2">
                                    {searchTerm
                                        ? "Arama kriterlerine uygun rapor bulunamadı"
                                        : "Henüz rapor bulunmuyor"}
                                </p>
                                {searchTerm && (
                                    <Button variant="outline" onClick={() => setSearchTerm("")}>
                                        Filtreyi Temizle
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Sonuç Sayısı */}
                        {!isLoading && !error && filteredExecutions && filteredExecutions.length > 0 && (
                            <div className="flex items-center justify-between pt-2">
                                <p className="text-sm text-muted-foreground">
                                    Toplam {filteredExecutions.length} rapor gösteriliyor
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
