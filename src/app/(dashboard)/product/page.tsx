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
import { Plus, Package, Pencil, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Pagination } from "@/components/ui/pagination";
import { useProducts } from "@/hooks/api/useProducts";
import { Product } from "@/lib/api/types";
import { toast } from "sonner";

const PAGE_SIZE = 10;

export default function ProductListPage() {
    const [currentPage, setCurrentPage] = React.useState(1);
    const [products, setProducts] = useState<Product[]>([]);
    const { getAllProducts, deleteProduct, isLoading } = useProducts();

    // Ürünleri yükle
    useEffect(() => {
        const loadProducts = async () => {
            try {
                const productsData = await getAllProducts();
                setProducts(productsData);
            } catch (error: any) {
                console.error("Ürünler yüklenirken hata:", error);
                toast.error("Ürünler yüklenemedi", {
                    description: error.message || "Bir hata oluştu, lütfen tekrar deneyin.",
                });
            }
        };

        loadProducts();
    }, []); // Sadece component mount olduğunda çalışsın

    // Ürün silme fonksiyonu
    const handleDeleteProduct = async (productId: number, productName: string) => {
        if (!confirm(`${productName} ürününü silmek istediğinizden emin misiniz?`)) {
            return;
        }

        try {
            await deleteProduct(productId.toString());
            toast.success("Ürün başarıyla silindi", {
                description: `${productName} ürünü silindi.`,
            });

            // State'den ürünü kaldır (API çağrısı yapmadan)
            setProducts(prevProducts => prevProducts.filter(product => product.id !== productId));
        } catch (error: any) {
            console.error("Ürün silme hatası:", error);
            toast.error("Ürün silinemedi", {
                description: error.message || "Bir hata oluştu, lütfen tekrar deneyin.",
            });
        }
    };

    // Pagination hesaplamaları
    const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
    const paginatedProducts = products.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // Sayfa değiştiğinde scroll'u yukarı çek
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
                    <CardContent className="overflow-x-auto p-0">
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
                                    <TableHead className="text-center w-20">İşlem</TableHead>
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
                                                    src={product.image || "/images/product-placeholder.jpg"}
                                                    alt={product.name}
                                                    className="w-12 h-12 aspect-square object-cover rounded border"
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell>{product.code || "-"}</TableCell>
                                            <TableCell className="text-right">{product.stock_quantity || 0}</TableCell>
                                            <TableCell className="text-right">
                                                {product.purchase_price ? product.purchase_price.toLocaleString("tr-TR", {
                                                    minimumFractionDigits: 2,
                                                }) : "-"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {product.sale_price ? product.sale_price.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "-"}
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate" title={product.description}>
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
                                                    className="text-red-600 hover:text-red-800"
                                                    title="Sil"
                                                    onClick={() => handleDeleteProduct(product.id, product.name)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
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
        </>
    );
}
