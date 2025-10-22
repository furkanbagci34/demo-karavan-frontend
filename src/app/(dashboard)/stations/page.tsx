"use client";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Loader2, AlertTriangle, Search, X, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useMemo } from "react";
import { Pagination } from "@/components/ui/pagination";
import { useStations } from "@/hooks/api/useStations";
import { Station } from "@/lib/api/types";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PAGE_SIZE = 10;

// Türkçe karakterleri normalize eden fonksiyon
const normalizeTurkishText = (text: string): string => {
    return text
        .replace(/İ/g, "i")
        .replace(/I/g, "ı")
        .replace(/Ğ/g, "ğ")
        .replace(/Ü/g, "ü")
        .replace(/Ş/g, "ş")
        .replace(/Ö/g, "ö")
        .replace(/Ç/g, "ç")
        .toLowerCase();
};

export default function StationsListPage() {
    const router = useRouter();
    const [currentPage, setCurrentPage] = React.useState(1);
    const [stationToDelete, setStationToDelete] = useState<Station | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const { get, remove, isLoading } = useStations();

    // Filtrelenmiş istasyonlar
    const filteredStations = useMemo(() => {
        if (!get.data) return [];

        if (!searchTerm.trim()) {
            return get.data;
        }

        const searchNormalized = normalizeTurkishText(searchTerm.trim());
        return get.data.filter((station) => {
            const nameMatch = normalizeTurkishText(station.name).includes(searchNormalized);
            return nameMatch;
        });
    }, [get.data, searchTerm]);

    // Arama terimi değiştiğinde ilk sayfaya dön
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // İstasyon silme dialog'unu aç
    const openDeleteDialog = (station: Station) => {
        setStationToDelete(station);
        setIsDeleteDialogOpen(true);
    };

    // İstasyon silme fonksiyonu
    const handleDeleteStation = async () => {
        if (!stationToDelete) return;

        try {
            await remove.mutateAsync(stationToDelete.id);
            toast.success("İstasyon başarıyla silindi", {
                description: `${stationToDelete.name} istasyonu artık listede görünmeyecek.`,
            });

            // Dialog'u kapat (React Query otomatik olarak listeyi güncelleyecek)
            setIsDeleteDialogOpen(false);
            setStationToDelete(null);
        } catch (error: unknown) {
            console.error("İstasyon silme hatası:", error);
            const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu, lütfen tekrar deneyin.";
            toast.error("İstasyon silinemedi", {
                description: errorMessage,
            });
        }
    };

    // Arama terimini temizle
    const clearSearch = () => {
        setSearchTerm("");
    };

    // Düzenleme sayfasına git
    const handleRowClick = (stationId: number) => {
        router.push(`/stations/edit/${stationId}`);
    };

    // Pagination hesaplamaları
    const totalPages = Math.max(1, Math.ceil(filteredStations.length / PAGE_SIZE));
    const paginatedStations = filteredStations.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // Sayfa değiştiğinde scroll'u yukarı çek
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [currentPage]);

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
                            <BreadcrumbItem className="hidden sm:block">
                                <BreadcrumbLink href="/manufacture">Üretim</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden sm:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>İstasyonlar</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <MapPin className="h-6 w-6" />
                        İstasyonlar
                    </h1>
                    <Button asChild className="w-full sm:w-auto">
                        <Link href="/stations/add">
                            <Plus className="h-4 w-4 mr-2" />
                            Yeni İstasyon Ekle
                        </Link>
                    </Button>
                </div>

                {/* Arama Alanı */}
                <div className="relative">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="İstasyon adı ile arayın..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-10"
                        />
                        {searchTerm && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearSearch}
                                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    {searchTerm && (
                        <p className="text-sm text-muted-foreground mt-2">
                            {filteredStations.length} istasyon bulundu
                            {filteredStations.length !== get.data?.length && ` (${get.data?.length} toplam istasyon)`}
                        </p>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>İstasyon Listesi</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Desktop Tablo Görünümü */}
                        <div className="hidden lg:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>İstasyon Adı</TableHead>
                                        <TableHead>Oluşturulma Tarihi</TableHead>
                                        <TableHead>Son Güncelleme</TableHead>
                                        <TableHead className="text-center">Durum</TableHead>
                                        <TableHead className="text-center w-20">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    İstasyonlar yükleniyor...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedStations.map((station) => (
                                            <TableRow
                                                key={station.id}
                                                className="cursor-pointer hover:bg-gray-50"
                                                onClick={() => handleRowClick(station.id)}
                                            >
                                                <TableCell className="font-medium">{station.name}</TableCell>
                                                <TableCell>
                                                    {new Date(station.created_at).toLocaleDateString("tr-TR")}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(station.updated_at).toLocaleDateString("tr-TR")}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            station.is_active
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {station.is_active ? "Aktif" : "Pasif"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="flex items-center justify-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.push(`/stations/edit/${station.id}`);
                                                        }}
                                                        title="Düzenle"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openDeleteDialog(station);
                                                        }}
                                                        title="Sil"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobil/Tablet Kart Görünümü */}
                        <div className="lg:hidden">
                            {isLoading ? (
                                <div className="p-8 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        İstasyonlar yükleniyor...
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                                    {paginatedStations.map((station) => (
                                        <Card
                                            key={station.id}
                                            className="overflow-hidden cursor-pointer hover:bg-gray-50"
                                            onClick={() => handleRowClick(station.id)}
                                        >
                                            <div className="p-4">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-sm truncate">
                                                            {station.name}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                            <span>
                                                                Oluşturulma:{" "}
                                                                {new Date(station.created_at).toLocaleDateString(
                                                                    "tr-TR"
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                            <span>
                                                                Güncelleme:{" "}
                                                                {new Date(station.updated_at).toLocaleDateString(
                                                                    "tr-TR"
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span
                                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                                                            station.is_active
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {station.is_active ? "Aktif" : "Pasif"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.push(`/stations/edit/${station.id}`);
                                                        }}
                                                        title="Düzenle"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openDeleteDialog(station);
                                                        }}
                                                        title="Sil"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>

                        {!isLoading && filteredStations.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                                {searchTerm
                                    ? "Arama kriterlerinize uygun istasyon bulunamadı."
                                    : "Kayıtlı istasyon bulunamadı."}
                            </div>
                        )}
                        {!isLoading && filteredStations.length > 0 && totalPages > 1 && (
                            <div className="py-4 flex justify-center">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* İstasyon Silme Dialog'u */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            İstasyonu Sil
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>{stationToDelete?.name}</strong> istasyonunu silmek istediğinizden emin misiniz?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteStation}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
