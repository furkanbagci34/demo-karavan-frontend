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
import { Plus, Warehouse, Pencil, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Pagination } from "@/components/ui/pagination";
import { useWarehouses } from "@/hooks/api/useWarehouses";
import { Warehouse as WarehouseType } from "@/lib/api/types";
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

export default function WarehouseListPage() {
    const [currentPage, setCurrentPage] = React.useState(1);
    const [warehouseToDelete, setWarehouseToDelete] = useState<WarehouseType | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const { warehouses, deleteWarehouse, isLoading } = useWarehouses();

    // Depo pasif hale getirme dialog'unu aç
    const openDeleteDialog = (warehouse: WarehouseType) => {
        setWarehouseToDelete(warehouse);
        setIsDeleteDialogOpen(true);
    };

    // Depo pasif hale getirme fonksiyonu
    const handleDeleteWarehouse = async () => {
        if (!warehouseToDelete) return;

        try {
            await deleteWarehouse(warehouseToDelete.id.toString());
            toast.success("Depo başarıyla silindi", {
                description: `${warehouseToDelete.name} deposu artık listede görünmeyecek.`,
            });

            // Dialog'u kapat (React Query otomatik olarak listeyi güncelleyecek)
            setIsDeleteDialogOpen(false);
            setWarehouseToDelete(null);
        } catch (error: unknown) {
            console.error("Depo pasif hale getirme hatası:", error);
            const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu, lütfen tekrar deneyin.";
            toast.error("Depo pasif hale getirilemedi", {
                description: errorMessage,
            });
        }
    };

    // Pagination hesaplamaları
    const totalPages = Math.max(1, Math.ceil(warehouses.length / PAGE_SIZE));
    const paginatedWarehouses = warehouses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
                            <BreadcrumbItem>
                                <BreadcrumbPage>Depolar</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <Warehouse className="h-6 w-6" />
                        Depolar
                    </h1>
                    <Button asChild className="w-full sm:w-auto">
                        <Link href="/warehouse/add">
                            <Plus className="h-4 w-4 mr-2" />
                            Yeni Depo Ekle
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Depo Listesi</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Desktop Tablo Görünümü */}
                        <div className="hidden lg:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Depo Adı</TableHead>
                                        <TableHead>Durum</TableHead>
                                        <TableHead>Açıklama</TableHead>
                                        <TableHead>Oluşturulma Tarihi</TableHead>
                                        <TableHead className="text-center w-20">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Depolar yükleniyor...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedWarehouses.map((warehouse) => (
                                            <TableRow key={warehouse.id}>
                                                <TableCell className="font-medium">{warehouse.name}</TableCell>
                                                <TableCell>
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            warehouse.is_active
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {warehouse.is_active ? "Aktif" : "Pasif"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {warehouse.description || "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(warehouse.created_at).toLocaleDateString("tr-TR")}
                                                </TableCell>
                                                <TableCell className="flex items-center justify-center gap-2">
                                                    <Link
                                                        href={`/warehouse/edit/${warehouse.id}`}
                                                        title="Düzenle"
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        className="text-red-600 hover:text-red-800 cursor-pointer"
                                                        title="Pasif Hale Getir"
                                                        onClick={() => openDeleteDialog(warehouse)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
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
                                        Depolar yükleniyor...
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                                    {paginatedWarehouses.map((warehouse) => (
                                        <Card key={warehouse.id} className="overflow-hidden">
                                            <div className="flex items-start gap-3 p-4">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium text-sm truncate">{warehouse.name}</h3>
                                                    {warehouse.description && (
                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                            {warehouse.description}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span
                                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                warehouse.is_active
                                                                    ? "bg-green-100 text-green-800"
                                                                    : "bg-red-100 text-red-800"
                                                            }`}
                                                        >
                                                            {warehouse.is_active ? "Aktif" : "Pasif"}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(warehouse.created_at).toLocaleDateString("tr-TR")}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Link
                                                            href={`/warehouse/edit/${warehouse.id}`}
                                                            title="Düzenle"
                                                            className="text-blue-600 hover:text-blue-800"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            className="text-red-600 hover:text-red-800 cursor-pointer"
                                                            title="Pasif Hale Getir"
                                                            onClick={() => openDeleteDialog(warehouse)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center p-4 border-t">
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

            {/* Silme Dialog'u */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Depo Pasif Hale Getir</AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>{warehouseToDelete?.name}</strong> deposunu pasif hale getirmek istediğinizden emin
                            misiniz? Bu işlem geri alınabilir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteWarehouse} className="bg-red-600 hover:bg-red-700">
                            Pasif Hale Getir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
