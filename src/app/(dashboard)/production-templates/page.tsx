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
import { Plus, Settings, Pencil, Trash2, Loader2, AlertTriangle, Search, X, Car, MapPin } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState, useMemo } from "react";
import { Pagination } from "@/components/ui/pagination";
import { useProductionTemplates } from "@/hooks/api/useProductionTemplates";
import { ProductionPlan } from "@/lib/api/types";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export default function ProductionTemplatesListPage() {
    const [currentPage, setCurrentPage] = React.useState(1);
    const [templateToDelete, setTemplateToDelete] = useState<ProductionPlan | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const { get, remove } = useProductionTemplates();

    // Filtrelenmiş şablonlar
    const filteredTemplates = useMemo(() => {
        if (!get.data) return [];

        if (!searchTerm.trim()) {
            return get.data;
        }

        const searchNormalized = normalizeTurkishText(searchTerm.trim());
        return get.data.filter((template) => {
            const nameMatch = normalizeTurkishText(template.name).includes(searchNormalized);
            const vehicleMatch = normalizeTurkishText(template.vehicle_name).includes(searchNormalized);
            return nameMatch || vehicleMatch;
        });
    }, [get.data, searchTerm]);

    // Arama terimi değiştiğinde ilk sayfaya dön
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Şablon silme dialog'unu aç
    const openDeleteDialog = (template: ProductionPlan) => {
        setTemplateToDelete(template);
        setIsDeleteDialogOpen(true);
    };

    // Şablon silme fonksiyonu
    const handleDeleteTemplate = async () => {
        if (!templateToDelete) return;

        try {
            await remove.mutateAsync(templateToDelete.id);
            toast.success("Üretim şablonu başarıyla silindi", {
                description: `${templateToDelete.name} şablonu artık listede görünmeyecek.`,
            });

            // Dialog'u kapat (React Query otomatik olarak listeyi güncelleyecek)
            setIsDeleteDialogOpen(false);
            setTemplateToDelete(null);
        } catch (error: unknown) {
            console.error("Üretim şablonu silme hatası:", error);
            const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu, lütfen tekrar deneyin.";
            toast.error("Üretim şablonu silinemedi", {
                description: errorMessage,
            });
        }
    };

    // Arama terimini temizle
    const clearSearch = () => {
        setSearchTerm("");
    };

    // Pagination hesaplamaları
    const totalPages = Math.max(1, Math.ceil(filteredTemplates.length / PAGE_SIZE));
    const paginatedTemplates = filteredTemplates.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
                                <BreadcrumbLink href="/production-templates">Üretim Şablonları</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden sm:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Üretim Şablonları</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <MapPin className="h-6 w-6" />
                        Üretim Şablonları
                    </h1>
                    <Button asChild className="w-full sm:w-auto">
                        <Link href="/production-templates/add">
                            <Plus className="h-4 w-4 mr-2" />
                            Yeni Üretim Şablonu
                        </Link>
                    </Button>
                </div>

                {/* Arama Alanı */}
                <div className="relative">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Şablon adı veya araç adı ile arayın..."
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
                            {filteredTemplates.length} şablon bulundu
                            {filteredTemplates.length !== get.data?.length && ` (${get.data?.length} toplam şablon)`}
                        </p>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Üretim Şablonları Listesi</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Desktop Tablo Görünümü */}
                        <div className="hidden lg:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Şablon Adı</TableHead>
                                        <TableHead>Araç</TableHead>
                                        <TableHead>Oluşturulma Tarihi</TableHead>
                                        <TableHead>Son Güncelleme</TableHead>
                                        <TableHead className="text-center">Durum</TableHead>
                                        <TableHead className="text-center w-20">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {get.isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Üretim şablonları yükleniyor...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedTemplates.map((template) => (
                                            <TableRow key={template.id}>
                                                <TableCell className="font-medium">{template.name}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <Car className="h-4 w-4 text-muted-foreground" />
                                                            <span className="font-medium">{template.vehicle_name}</span>
                                                        </div>
                                                        {template.vehicle_brand_model && (
                                                            <span className="text-xs text-muted-foreground ml-6">
                                                                {template.vehicle_brand_model}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(template.created_at).toLocaleDateString("tr-TR")}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(template.updated_at).toLocaleDateString("tr-TR")}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            template.is_active
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {template.is_active ? "Aktif" : "Pasif"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="flex items-center justify-center">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">İşlemler</span>
                                                                <Settings className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link
                                                                    href={`/production-templates/edit/${template.id}`}
                                                                    className="flex items-center"
                                                                >
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    <span>Düzenle</span>
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-red-600 focus:text-red-600"
                                                                onClick={() => openDeleteDialog(template)}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                <span>Sil</span>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobil/Tablet Kart Görünümü */}
                        <div className="lg:hidden">
                            {get.isLoading ? (
                                <div className="p-8 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Üretim şablonları yükleniyor...
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                                    {paginatedTemplates.map((template) => (
                                        <Card key={template.id} className="overflow-hidden">
                                            <div className="p-4">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-sm truncate">
                                                            {template.name}
                                                        </h3>
                                                        <div className="flex flex-col gap-1 mt-1">
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <Car className="h-3 w-3" />
                                                                <span className="font-medium">
                                                                    {template.vehicle_name}
                                                                </span>
                                                            </div>
                                                            {template.vehicle_brand_model && (
                                                                <span className="text-xs text-muted-foreground ml-5">
                                                                    {template.vehicle_brand_model}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <Settings className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link
                                                                    href={`/production-templates/edit/${template.id}`}
                                                                    className="flex items-center"
                                                                >
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    <span>Düzenle</span>
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-red-600 focus:text-red-600"
                                                                onClick={() => openDeleteDialog(template)}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                <span>Sil</span>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                    <span>
                                                        Oluşturulma:{" "}
                                                        {new Date(template.created_at).toLocaleDateString("tr-TR")}
                                                    </span>
                                                    <span
                                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                            template.is_active
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {template.is_active ? "Aktif" : "Pasif"}
                                                    </span>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center">
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                )}

                {/* Boş Durum */}
                {!get.isLoading && filteredTemplates.length === 0 && (
                    <Card>
                        <CardContent className="p-8">
                            <div className="text-center">
                                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Üretim şablonu bulunamadı</h3>
                                <p className="text-muted-foreground mb-4">
                                    {searchTerm
                                        ? `"${searchTerm}" araması için sonuç bulunamadı.`
                                        : "Henüz hiç üretim şablonu oluşturulmamış."}
                                </p>
                                {!searchTerm && (
                                    <Button asChild>
                                        <Link href="/production-templates/add">
                                            <Plus className="h-4 w-4 mr-2" />
                                            İlk Üretim Şablonunu Oluştur
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Silme Dialog'u */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Üretim şablonunu silmek istediğinize emin misiniz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu işlem geri alınamaz. <strong>{templateToDelete?.name}</strong> şablonu kalıcı olarak
                            silinecektir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteTemplate}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={remove.isPending}
                        >
                            {remove.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Siliniyor...
                                </>
                            ) : (
                                "Evet, Sil"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
