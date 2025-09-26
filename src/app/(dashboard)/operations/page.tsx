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
import { Plus, Settings, Pencil, Trash2, Loader2, AlertTriangle, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useMemo } from "react";
import { Pagination } from "@/components/ui/pagination";
import { useOperations } from "@/hooks/api/useOperations";
import { Operation } from "@/lib/api/types";
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

export default function OperationsListPage() {
    const router = useRouter();
    const [currentPage, setCurrentPage] = React.useState(1);
    const [operationToDelete, setOperationToDelete] = useState<Operation | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const { operations, deleteOperation, isLoading } = useOperations();

    // Filtrelenmiş operasyonlar
    const filteredOperations = useMemo(() => {
        if (!searchTerm.trim()) {
            return operations;
        }

        const searchNormalized = normalizeTurkishText(searchTerm.trim());
        return operations.filter((operation) => {
            const nameMatch = normalizeTurkishText(operation.name).includes(searchNormalized);
            return nameMatch;
        });
    }, [operations, searchTerm]);

    // Arama terimi değiştiğinde ilk sayfaya dön
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Operasyon silme dialog'unu aç
    const openDeleteDialog = (operation: Operation) => {
        setOperationToDelete(operation);
        setIsDeleteDialogOpen(true);
    };

    // Operasyon silme fonksiyonu
    const handleDeleteOperation = async () => {
        if (!operationToDelete) return;

        try {
            await deleteOperation(operationToDelete.id.toString());
            toast.success("Operasyon başarıyla silindi", {
                description: `${operationToDelete.name} operasyonu artık listede görünmeyecek.`,
            });

            // Dialog'u kapat (React Query otomatik olarak listeyi güncelleyecek)
            setIsDeleteDialogOpen(false);
            setOperationToDelete(null);
        } catch (error: unknown) {
            console.error("Operasyon silme hatası:", error);
            const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu, lütfen tekrar deneyin.";
            toast.error("Operasyon silinemedi", {
                description: errorMessage,
            });
        }
    };

    // Arama terimini temizle
    const clearSearch = () => {
        setSearchTerm("");
    };

    // Düzenleme sayfasına git
    const handleRowClick = (operationId: number) => {
        router.push(`/operations/edit/${operationId}`);
    };

    // Pagination hesaplamaları
    const totalPages = Math.max(1, Math.ceil(filteredOperations.length / PAGE_SIZE));
    const paginatedOperations = filteredOperations.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
                                <BreadcrumbPage>Operasyonlar</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <Settings className="h-6 w-6" />
                        Operasyonlar
                    </h1>
                    <Button asChild className="w-full sm:w-auto">
                        <Link href="/operations/add">
                            <Plus className="h-4 w-4 mr-2" />
                            Yeni Operasyon Ekle
                        </Link>
                    </Button>
                </div>

                {/* Arama Alanı */}
                <div className="relative">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Operasyon adı ile arayın..."
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
                            {filteredOperations.length} operasyon bulundu
                            {filteredOperations.length !== operations.length &&
                                ` (${operations.length} toplam operasyon)`}
                        </p>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Operasyon Listesi</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Desktop Tablo Görünümü */}
                        <div className="hidden lg:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Operasyon Adı</TableHead>
                                        <TableHead className="text-center">Kalite Kontrol</TableHead>
                                        <TableHead className="text-center">Hedef Süre</TableHead>
                                        <TableHead>Oluşturulma Tarihi</TableHead>
                                        <TableHead>Son Güncelleme</TableHead>
                                        <TableHead className="text-center">Durum</TableHead>
                                        <TableHead className="text-center w-20">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Operasyonlar yükleniyor...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedOperations.map((operation) => (
                                            <TableRow
                                                key={operation.id}
                                                className="cursor-pointer hover:bg-gray-50"
                                                onClick={() => handleRowClick(operation.id)}
                                            >
                                                <TableCell className="font-medium">{operation.name}</TableCell>
                                                <TableCell className="text-center">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            operation.quality_control
                                                                ? "bg-blue-100 text-blue-800"
                                                                : "bg-gray-100 text-gray-800"
                                                        }`}
                                                    >
                                                        {operation.quality_control ? "Evet" : "Hayır"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {operation.target_duration
                                                        ? `${operation.target_duration} dk`
                                                        : "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(operation.created_at).toLocaleDateString("tr-TR")}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(operation.updated_at).toLocaleDateString("tr-TR")}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            operation.is_active
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {operation.is_active ? "Aktif" : "Pasif"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="flex items-center justify-center">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <span className="sr-only">İşlemler</span>
                                                                <Settings className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link
                                                                    href={`/operations/edit/${operation.id}`}
                                                                    className="flex items-center"
                                                                >
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    <span>Düzenle</span>
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-red-600 focus:text-red-600"
                                                                onClick={() => openDeleteDialog(operation)}
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
                            {isLoading ? (
                                <div className="p-8 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Operasyonlar yükleniyor...
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                                    {paginatedOperations.map((operation) => (
                                        <Card
                                            key={operation.id}
                                            className="overflow-hidden cursor-pointer hover:bg-gray-50"
                                            onClick={() => handleRowClick(operation.id)}
                                        >
                                            <div className="p-4">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-sm truncate">
                                                            {operation.name}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                            <span>
                                                                Kalite Kontrol:{" "}
                                                                {operation.quality_control ? "Evet" : "Hayır"}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                            <span>
                                                                Hedef Süre:{" "}
                                                                {operation.target_duration
                                                                    ? `${operation.target_duration} dk`
                                                                    : "Belirtilmemiş"}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                            <span>
                                                                Oluşturulma:{" "}
                                                                {new Date(operation.created_at).toLocaleDateString(
                                                                    "tr-TR"
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                            <span>
                                                                Güncelleme:{" "}
                                                                {new Date(operation.updated_at).toLocaleDateString(
                                                                    "tr-TR"
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span
                                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                                                            operation.is_active
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {operation.is_active ? "Aktif" : "Pasif"}
                                                    </span>
                                                </div>
                                                <div className="relative">
                                                    <div className="flex items-center justify-end">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    className="h-8 w-8 p-0"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <span className="sr-only">İşlemler</span>
                                                                    <Settings className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem asChild>
                                                                    <Link
                                                                        href={`/operations/edit/${operation.id}`}
                                                                        className="flex items-center"
                                                                    >
                                                                        <Pencil className="mr-2 h-4 w-4" />
                                                                        <span>Düzenle</span>
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-red-600 focus:text-red-600"
                                                                    onClick={() => openDeleteDialog(operation)}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    <span>Sil</span>
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>

                        {!isLoading && filteredOperations.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                                {searchTerm
                                    ? "Arama kriterlerinize uygun operasyon bulunamadı."
                                    : "Kayıtlı operasyon bulunamadı."}
                            </div>
                        )}
                        {!isLoading && filteredOperations.length > 0 && totalPages > 1 && (
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

            {/* Operasyon Silme Dialog'u */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Operasyonu Sil
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>{operationToDelete?.name}</strong> operasyonunu silmek istediğinizden emin misiniz?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteOperation}
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
