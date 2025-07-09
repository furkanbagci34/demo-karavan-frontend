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
import { Plus, Package, Pencil, Trash2, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Pagination } from "@/components/ui/pagination";
import { useProducts } from "@/hooks/api/useProducts";
import { Product } from "@/lib/api/types";
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

export default function ProductListPage() {
    const [currentPage, setCurrentPage] = React.useState(1);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const { products, deleteProduct, isLoading } = useProducts();

    // Ürün pasif hale getirme dialog'unu aç
    const openDeleteDialog = (product: Product) => {
        setProductToDelete(product);
        setIsDeleteDialogOpen(true);
    };

    // Ürün pasif hale getirme fonksiyonu
    const handleDeleteProduct = async () => {
        if (!productToDelete) return;

        try {
            await deleteProduct(productToDelete.id.toString());
            toast.success("Ürün başarıyla silindi", {
                description: `${productToDelete.name} ürünü artık listede görünmeyecek.`,
            });

            // Dialog'u kapat (React Query otomatik olarak listeyi güncelleyecek)
            setIsDeleteDialogOpen(false);
            setProductToDelete(null);
        } catch (error: unknown) {
            console.error("Ürün pasif hale getirme hatası:", error);
            const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu, lütfen tekrar deneyin.";
            toast.error("Ürün pasif hale getirilemedi", {
                description: errorMessage,
            });
        }
    };

    // Pagination hesaplamaları
    const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
    const paginatedProducts = products.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
                                <BreadcrumbPage>Ürünler</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <Package className="h-6 w-6" />
                        Ürünler
                    </h1>
                    <Button asChild className="w-full sm:w-auto">
                        <Link href="/product/add">
                            <Plus className="h-4 w-4 mr-2" />
                            Yeni Ürün Ekle
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Ürün Listesi</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Desktop Tablo Görünümü */}
                        <div className="hidden lg:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16">Fotoğraf</TableHead>
                                        <TableHead>Ürün Adı</TableHead>
                                        <TableHead>Stok Kodu</TableHead>
                                        <TableHead className="text-right">Stok</TableHead>
                                        <TableHead className="text-right">Alış (€)</TableHead>
                                        <TableHead className="text-right">Satış (€)</TableHead>
                                        <TableHead>Açıklama</TableHead>
                                        <TableHead className="text-center w-20">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Ürünler yükleniyor...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedProducts.map((product) => (
                                            <TableRow key={product.id}>
                                                <TableCell>
                                                    <img
                                                        src={product.image || "/images/no-image-placeholder.svg"}
                                                        alt={product.name}
                                                        className="w-12 h-12 aspect-square object-cover rounded border"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = "/images/no-image-placeholder.svg";
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">{product.name}</TableCell>
                                                <TableCell>{product.code || "-"}</TableCell>
                                                <TableCell className="text-right">
                                                    {product.stock_quantity || 0}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {product.purchase_price
                                                        ? product.purchase_price.toLocaleString("tr-TR", {
                                                              minimumFractionDigits: 2,
                                                          })
                                                        : "-"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {product.sale_price
                                                        ? product.sale_price.toLocaleString("tr-TR", {
                                                              minimumFractionDigits: 2,
                                                          })
                                                        : "-"}
                                                </TableCell>
                                                <TableCell
                                                    className="max-w-[200px] truncate"
                                                    title={product.description}
                                                >
                                                    {product.description || "-"}
                                                </TableCell>
                                                <TableCell className="flex items-center justify-center gap-2">
                                                    <Link
                                                        href={`/product/edit/${product.id}`}
                                                        title="Düzenle"
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        className="text-red-600 hover:text-red-800 cursor-pointer"
                                                        title="Pasif Hale Getir"
                                                        onClick={() => openDeleteDialog(product)}
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
                                        Ürünler yükleniyor...
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                                    {paginatedProducts.map((product) => (
                                        <Card key={product.id} className="overflow-hidden">
                                            <div className="flex items-start gap-3 p-4">
                                                <img
                                                    src={product.image || "/images/no-image-placeholder.svg"}
                                                    alt={product.name}
                                                    className="w-16 h-16 aspect-square object-cover rounded border flex-shrink-0"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = "/images/no-image-placeholder.svg";
                                                    }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Stok: {product.stock_quantity || 0}
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-2 text-xs">
                                                        <span className="text-muted-foreground">
                                                            Alış:{" "}
                                                            {product.purchase_price
                                                                ? product.purchase_price.toLocaleString("tr-TR", {
                                                                      minimumFractionDigits: 2,
                                                                  })
                                                                : "-"}
                                                            €
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            Satış:{" "}
                                                            {product.sale_price
                                                                ? product.sale_price.toLocaleString("tr-TR", {
                                                                      minimumFractionDigits: 2,
                                                                  })
                                                                : "-"}
                                                            €
                                                        </span>
                                                    </div>
                                                    {product.description && (
                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                            {product.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <Link
                                                        href={`/product/edit/${product.id}`}
                                                        title="Düzenle"
                                                        className="text-blue-600 hover:text-blue-800 p-1"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        className="text-red-600 hover:text-red-800 cursor-pointer p-1"
                                                        title="Pasif Hale Getir"
                                                        onClick={() => openDeleteDialog(product)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>

                        {!isLoading && products.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">Kayıtlı ürün bulunamadı.</div>
                        )}
                        {!isLoading && products.length > 0 && totalPages > 1 && (
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

            {/* Ürün Pasif Hale Getirme Dialog'u */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Ürünü Sil
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>{productToDelete?.name}</strong> ürününü silmek istediğinizden emin misiniz?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteProduct}
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
