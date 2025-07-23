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
import { Input } from "@/components/ui/input";
import { Package, Loader2, Search, X, Check, AlertCircle } from "lucide-react";
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useProducts } from "@/hooks/api/useProducts";
import { Product } from "@/lib/api/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";

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

// Stock input component props interface
interface StockInputProps {
    product: Product;
    value: string;
    isUpdating: boolean;
    wasRecentlyUpdated: boolean;
    onChange: (productId: string, value: string) => void;
}

// Stock input component - dışarı çıkarıldı focus sorunu çözülsün diye
const StockInput = React.memo(({ product, value, isUpdating, wasRecentlyUpdated, onChange }: StockInputProps) => {
    const productId = product.id.toString();

    return (
        <div className="relative">
            <Input
                type="text"
                inputMode="numeric"
                value={value}
                onChange={(e) => onChange(productId, e.target.value)}
                className={`text-center pr-8 h-10 ${wasRecentlyUpdated ? "border-green-500 bg-green-50" : ""}`}
                placeholder="0"
                autoComplete="off"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : wasRecentlyUpdated ? (
                    <Check className="h-4 w-4 text-green-600" />
                ) : null}
            </div>
        </div>
    );
});

StockInput.displayName = "StockInput";

export default function ProductStockPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [stockValues, setStockValues] = useState<{ [key: string]: string }>({});
    const [updatingProducts, setUpdatingProducts] = useState<Set<string>>(new Set());
    const [recentlyUpdated, setRecentlyUpdated] = useState<Set<string>>(new Set());

    const previousStockValues = useRef<{ [key: string]: string }>({});
    const { products, updateProductStockQuantity, isLoading } = useProducts();

    // Filtrelenmiş ürünler
    const filteredProducts = useMemo(() => {
        if (!searchTerm.trim()) {
            return products;
        }

        const searchNormalized = normalizeTurkishText(searchTerm.trim());
        return products.filter((product) => {
            const nameMatch = normalizeTurkishText(product.name).includes(searchNormalized);
            const codeMatch = product.code ? normalizeTurkishText(product.code).includes(searchNormalized) : false;
            return nameMatch || codeMatch;
        });
    }, [products, searchTerm]);

    // Ürünler yüklendiğinde initial stock values'ları set et
    useEffect(() => {
        const initialValues: { [key: string]: string } = {};
        products.forEach((product) => {
            initialValues[product.id.toString()] = (product.stock_quantity || 0).toString();
        });
        setStockValues(initialValues);
    }, [products]);

    // Arama terimini temizle
    const clearSearch = () => {
        setSearchTerm("");
    };

    // Stok değerini güncelle
    const handleStockChange = useCallback((productId: string, value: string) => {
        // Sadece rakam ve boşluk kabul et
        const sanitizedValue = value.replace(/[^0-9]/g, "");
        setStockValues((prev) => ({
            ...prev,
            [productId]: sanitizedValue,
        }));
    }, []);

    // Debounced stock update - daha hızlı response için 500ms
    const debouncedStockValues = useDebounce(stockValues, 500);

    useEffect(() => {
        const updateStock = async (productId: string, quantity: string) => {
            if (!quantity.trim() || isNaN(Number(quantity))) return;

            const numericQuantity = Number(quantity);
            const product = products.find((p) => p.id.toString() === productId);

            if (!product || product.stock_quantity === numericQuantity) return;

            setUpdatingProducts((prev) => new Set([...prev, productId]));

            try {
                await updateProductStockQuantity(productId, numericQuantity);

                // Başarılı güncelleme feedback'i
                setRecentlyUpdated((prev) => new Set([...prev, productId]));
                setTimeout(() => {
                    setRecentlyUpdated((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(productId);
                        return newSet;
                    });
                }, 2000);

                toast.success("Stok güncellendi", {
                    description: `${product.name} stok miktarı ${numericQuantity} olarak güncellendi.`,
                });
            } catch (error: unknown) {
                console.error("Stok güncelleme hatası:", error);
                const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu, lütfen tekrar deneyin.";
                toast.error("Stok güncellenemedi", {
                    description: errorMessage,
                });

                // Hata durumunda eski değeri geri getir
                setStockValues((prev) => ({
                    ...prev,
                    [productId]: (product.stock_quantity || 0).toString(),
                }));
            } finally {
                setUpdatingProducts((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(productId);
                    return newSet;
                });
            }
        };

        // Sadece değişen ürünler için güncelleme yap
        Object.entries(debouncedStockValues).forEach(([productId, quantity]) => {
            const previousQuantity = previousStockValues.current[productId];

            // Sadece değer gerçekten değiştiyse ve boş değilse istek at
            if (quantity !== previousQuantity && quantity.trim() !== "") {
                updateStock(productId, quantity);
            }
        });

        // Şu anki değerleri önceki değerler olarak kaydet
        previousStockValues.current = { ...debouncedStockValues };
    }, [debouncedStockValues, products, updateProductStockQuantity]);

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
                                <BreadcrumbLink href="/product">Ürünler</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden sm:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Stok Güncelleme</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <Package className="h-6 w-6" />
                        Stok Güncelleme
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        Stok miktarları otomatik olarak kaydedilir
                    </div>
                </div>

                {/* Arama Alanı */}
                <div className="relative">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Ürün adı veya stok kodu ile arayın..."
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
                            {filteredProducts.length} ürün bulundu
                            {filteredProducts.length !== products.length && ` (${products.length} toplam ürün)`}
                        </p>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Stok Miktarları</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Desktop Tablo Görünümü */}
                        <div className="hidden lg:block">
                            <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background z-10">
                                        <TableRow>
                                            <TableHead className="w-16">Fotoğraf</TableHead>
                                            <TableHead className="min-w-[250px]">Ürün Adı</TableHead>
                                            <TableHead className="w-36 text-center">Stok Miktarı</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-8">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Ürünler yükleniyor...
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredProducts.map((product) => (
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
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{product.name}</div>
                                                            {product.code && (
                                                                <div className="text-sm text-muted-foreground">
                                                                    Kod: {product.code}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <StockInput
                                                            product={product}
                                                            value={stockValues[product.id.toString()] || ""}
                                                            isUpdating={updatingProducts.has(product.id.toString())}
                                                            wasRecentlyUpdated={recentlyUpdated.has(
                                                                product.id.toString()
                                                            )}
                                                            onChange={handleStockChange}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
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
                                <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                                    <div className="grid grid-cols-1 gap-3 p-4">
                                        {filteredProducts.map((product) => (
                                            <Card key={product.id} className="overflow-hidden">
                                                <div className="p-3">
                                                    {/* Üst kısım: Resim ve Ürün Bilgileri */}
                                                    <div className="flex items-start gap-3 mb-3">
                                                        <img
                                                            src={product.image || "/images/no-image-placeholder.svg"}
                                                            alt={product.name}
                                                            className="w-12 h-12 aspect-square object-cover rounded border flex-shrink-0"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.src = "/images/no-image-placeholder.svg";
                                                            }}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold text-sm leading-tight mb-1">
                                                                {product.name}
                                                            </h3>
                                                            {product.code && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    Kod: {product.code}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Alt kısım: Stok Input */}
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-muted-foreground">
                                                            Stok Miktarı:
                                                        </span>
                                                        <div className="w-24">
                                                            <StockInput
                                                                product={product}
                                                                value={stockValues[product.id.toString()] || ""}
                                                                isUpdating={updatingProducts.has(product.id.toString())}
                                                                wasRecentlyUpdated={recentlyUpdated.has(
                                                                    product.id.toString()
                                                                )}
                                                                onChange={handleStockChange}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {!isLoading && filteredProducts.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                                {searchTerm
                                    ? "Arama kriterlerinize uygun ürün bulunamadı."
                                    : "Kayıtlı ürün bulunamadı."}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
