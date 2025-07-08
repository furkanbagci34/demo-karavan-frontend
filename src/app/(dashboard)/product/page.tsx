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
import { Plus, Package, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import React from "react";
import { Pagination } from "@/components/ui/pagination";

// Dumi ürün verisi
const mockProducts = [
    {
        id: 1,
        name: "12V LED Şerit",
        stockCode: "LED-001",
        stockQuantity: 120,
        purchasePrice: 2.5,
        salePrice: 4.2,
        description: "Su geçirmez, 5 metre.",
        image: "/images/product-placeholder.jpg",
    },
    {
        id: 2,
        name: "Akü 100Ah",
        stockCode: "AKU-100",
        stockQuantity: 15,
        purchasePrice: 80,
        salePrice: 120,
        description: "Derin döngü, bakım gerektirmez.",
        image: "/images/product-placeholder.jpg",
    },
    {
        id: 3,
        name: "Güneş Paneli 150W",
        stockCode: "GUN-150",
        stockQuantity: 8,
        purchasePrice: 60,
        salePrice: 95,
        description: "Monokristal, yüksek verim.",
        image: "/images/product-placeholder.jpg",
    },
    {
        id: 4,
        name: "Sigorta Kutusu",
        stockCode: "SIG-BOX",
        stockQuantity: 40,
        purchasePrice: 5,
        salePrice: 9.5,
        description: "6'lı modül, şeffaf kapak.",
        image: "/images/product-placeholder.jpg",
    },
];

const PAGE_SIZE = 3;

export default function ProductListPage() {
    const [currentPage, setCurrentPage] = React.useState(1);
    const totalPages = Math.ceil(mockProducts.length / PAGE_SIZE);
    const paginatedProducts = mockProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
                                {paginatedProducts.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="w-12 h-12 aspect-square object-cover rounded border"
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell>{product.stockCode}</TableCell>
                                        <TableCell className="text-right">{product.stockQuantity}</TableCell>
                                        <TableCell className="text-right">
                                            {product.purchasePrice.toLocaleString("tr-TR", {
                                                minimumFractionDigits: 2,
                                            })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {product.salePrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={product.description}>
                                            {product.description}
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
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {mockProducts.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">Kayıtlı ürün bulunamadı.</div>
                        )}
                        <div className="py-4 flex justify-center">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
