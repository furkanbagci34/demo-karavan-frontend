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
import { Package, Loader2, Search, X, Check, Warehouse } from "lucide-react";
import React, { useState, useMemo, useCallback } from "react";
import { useProducts } from "@/hooks/api/useProducts";
// GroupedProductStock type'ı useProducts hook'undan geliyor
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/use-debounce";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

// Warehouse stock input component props interface
interface WarehouseStockInputProps {
    productId: number;
    warehouseId: number;
    warehouseName: string;
    value: string;
    isUpdating: boolean;
    wasRecentlyUpdated: boolean;
    onChange: (productId: number, warehouseId: number, value: string) => void;
}

// Warehouse stock input component
const WarehouseStockInput = React.memo(
    ({
        productId,
        warehouseId,
        warehouseName,
        value,
        isUpdating,
        wasRecentlyUpdated,
        onChange,
    }: WarehouseStockInputProps) => {
        return (
            <div className="space-y-1">
                {/* Header: Depo Adı + Status */}
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-gray-800 truncate">{warehouseName}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {isUpdating ? (
                            <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                        ) : wasRecentlyUpdated ? (
                            <Check className="h-3 w-3 text-green-600" />
                        ) : null}
                    </div>
                </div>

                {/* Input */}
                <div className="relative">
                    <Input
                        type="text"
                        inputMode="numeric"
                        value={value}
                        onChange={(e) => onChange(productId, warehouseId, e.target.value)}
                        className={`text-center h-9 text-sm font-medium transition-all ${
                            wasRecentlyUpdated
                                ? "border-green-500 bg-green-50 text-green-800"
                                : Number(value) <= 0 && value.trim() !== ""
                                ? "border-red-500 bg-red-50 text-red-800"
                                : "border-gray-300 hover:border-gray-400 focus:border-blue-500"
                        }`}
                        placeholder="0"
                        autoComplete="off"
                    />
                </div>
            </div>
        );
    }
);

WarehouseStockInput.displayName = "WarehouseStockInput";

export default function ProductStockPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [stockValues, setStockValues] = useState<{ [key: string]: string }>({});
    const [updatingStocks, setUpdatingStocks] = useState<Set<string>>(new Set());
    const [recentlyUpdated, setRecentlyUpdated] = useState<Set<string>>(new Set());
    const [selectedProductImage, setSelectedProductImage] = useState<{ src: string; alt: string } | null>(null);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    const { groupedStockData, updateWarehouseStock, isLoadingStockStatuses } = useProducts();

    // Filtrelenmiş ürünler
    const filteredProducts = useMemo(() => {
        if (!searchTerm.trim()) {
            return groupedStockData;
        }

        const searchNormalized = normalizeTurkishText(searchTerm.trim());
        return groupedStockData.filter((product) => {
            const nameMatch = normalizeTurkishText(product.productName).includes(searchNormalized);
            const codeMatch = product.productCode
                ? normalizeTurkishText(product.productCode).includes(searchNormalized)
                : false;
            return nameMatch || codeMatch;
        });
    }, [groupedStockData, searchTerm]);

    // Mevcut tüm depolar listesi
    const allWarehouses = useMemo(() => {
        const warehouseMap = new Map();
        groupedStockData.forEach((product) => {
            product.warehouses.forEach((warehouse) => {
                warehouseMap.set(warehouse.warehouseId, warehouse.warehouseName);
            });
        });
        return Array.from(warehouseMap.entries()).map(([id, name]) => ({
            id: Number(id),
            name: String(name),
        }));
    }, [groupedStockData]);

    // Ürünler yüklendiğinde initial stock values'ları set et
    React.useEffect(() => {
        if (groupedStockData.length === 0) return;

        const initialValues: { [key: string]: string } = {};
        groupedStockData.forEach((product) => {
            product.warehouses.forEach((warehouse) => {
                const key = `${product.productId}-${warehouse.warehouseId}`;
                initialValues[key] = warehouse.quantity.toString();
            });
        });

        // Sadece ilk kez yüklendiğinde set et
        setStockValues((prev) => {
            const hasExistingData = Object.keys(prev).length > 0;
            if (hasExistingData) return prev;

            // Previous values'ı da güncelle
            previousStockValues.current = { ...initialValues };
            return initialValues;
        });
    }, [groupedStockData.length]);

    // Arama terimini temizle
    const clearSearch = () => {
        setSearchTerm("");
    };

    // Stok değerini güncelle
    const handleStockChange = useCallback((productId: number, warehouseId: number, value: string) => {
        // Sadece rakam kabul et
        const sanitizedValue = value.replace(/[^0-9]/g, "");
        const key = `${productId}-${warehouseId}`;
        setStockValues((prev) => ({
            ...prev,
            [key]: sanitizedValue,
        }));
    }, []);

    // Resim tıklama fonksiyonu
    const handleImageClick = (product: { productImage?: string; productName: string }) => {
        if (product.productImage) {
            setSelectedProductImage({
                src: product.productImage,
                alt: product.productName,
            });
            setIsImageModalOpen(true);
        }
    };
    // Debounced stock update
    const debouncedStockValues = useDebounce(stockValues, 800);

    // Previous values ref to track changes
    const previousStockValues = React.useRef<{ [key: string]: string }>({});

    React.useEffect(() => {
        const updateStock = async (productId: number, warehouseId: number, quantity: string) => {
            if (!quantity.trim() || isNaN(Number(quantity))) return;

            const numericQuantity = Number(quantity);

            // Get current product and warehouse data for API call
            const product = groupedStockData.find((p) => p.productId === productId);
            const warehouse = product?.warehouses.find((w) => w.warehouseId === warehouseId);

            if (!product || !warehouse) return;

            const updateKey = `${productId}-${warehouseId}`;
            setUpdatingStocks((prev) => new Set([...prev, updateKey]));

            try {
                await updateWarehouseStock(productId.toString(), {
                    quantity: numericQuantity,
                    warehouseId: warehouseId,
                });

                // Başarılı güncelleme feedback'i
                setRecentlyUpdated((prev) => new Set([...prev, updateKey]));
                setTimeout(() => {
                    setRecentlyUpdated((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(updateKey);
                        return newSet;
                    });
                }, 2000);

                toast.success("Stok güncellendi", {
                    description: `${product.productName} - ${warehouse.warehouseName} stok miktarı ${numericQuantity} olarak güncellendi.`,
                });
            } catch (error: unknown) {
                console.error("Stok güncelleme hatası:", error);
                const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu, lütfen tekrar deneyin.";
                toast.error("Stok güncellenemedi", {
                    description: errorMessage,
                });

                // Hata durumunda eski değeri geri getir - previous value'dan al
                const key = `${productId}-${warehouseId}`;
                const originalProduct = groupedStockData.find((p) => p.productId === productId);
                const originalWarehouse = originalProduct?.warehouses.find((w) => w.warehouseId === warehouseId);
                const originalValue = originalWarehouse?.quantity?.toString() || "0";

                setStockValues((prev) => ({
                    ...prev,
                    [key]: originalValue,
                }));
            } finally {
                setUpdatingStocks((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(updateKey);
                    return newSet;
                });
            }
        };

        // Sadece gerçekten değişen değerler için güncelleme yap
        Object.entries(debouncedStockValues).forEach(([key, quantity]) => {
            const previousQuantity = previousStockValues.current[key];

            // Sadece değer gerçekten değiştiyse ve boş değilse güncelleme yap
            if (quantity !== previousQuantity && quantity.trim() !== "" && previousQuantity !== undefined) {
                const [productId, warehouseId] = key.split("-").map(Number);
                // API çağrısı yapılacağında previous value'yu güncelle
                previousStockValues.current[key] = quantity;
                updateStock(productId, warehouseId, quantity);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedStockValues, updateWarehouseStock, groupedStockData.length]);

    return (
        <>
            {/* Sticky Header */}
            <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                <div className="flex h-16 shrink-0 items-center gap-2 px-4">
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
                                <BreadcrumbPage>Ürün Stok Durumu</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <Package className="h-6 w-6" />
                        Ürün Stok Durumu
                    </h1>
                </div>

                {/* Depo Bilgisi */}
                {allWarehouses.length > 0 && (
                    <Card className="bg-blue-50 border-blue-200 py-2">
                        <CardContent className="px-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Warehouse className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-blue-900">Aktif Depolar</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {allWarehouses.map((warehouse) => (
                                    <Badge key={warehouse.id} variant="info" className="text-xs">
                                        {warehouse.name}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

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
                            {filteredProducts.length !== groupedStockData.length &&
                                ` (${groupedStockData.length} toplam ürün)`}
                        </p>
                    )}
                </div>

                <Card>
                    <CardHeader className="sticky top-16 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <CardTitle>Depo Bazlı Stok Miktarları</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Desktop Tablo Görünümü */}
                        <div className="hidden lg:block">
                            <div className="max-h-[calc(100vh-350px)] overflow-y-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background z-30">
                                        <TableRow>
                                            <TableHead className="w-16">Fotoğraf</TableHead>
                                            <TableHead className="min-w-[200px]">Ürün Bilgileri</TableHead>
                                            <TableHead className="text-center min-w-[600px]">
                                                Depo Stok Miktarları
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoadingStockStatuses ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-8">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Stok verileri yükleniyor...
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredProducts.map((product) => (
                                                <TableRow key={product.productId}>
                                                    <TableCell>
                                                        <img
                                                            src={
                                                                product.productImage ||
                                                                "/images/no-image-placeholder.svg"
                                                            }
                                                            alt={product.productName}
                                                            className={`w-12 h-12 aspect-square object-cover rounded border ${
                                                                product.productImage
                                                                    ? "cursor-pointer hover:opacity-80 transition-opacity"
                                                                    : ""
                                                            }`}
                                                            onClick={() =>
                                                                product.productImage && handleImageClick(product)
                                                            }
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.src = "/images/no-image-placeholder.svg";
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{product.productName}</div>
                                                            {product.productCode && (
                                                                <div className="text-sm text-muted-foreground">
                                                                    Kod: {product.productCode}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-start gap-4">
                                                            {/* Toplam Stok */}
                                                            <div className="flex-shrink-0">
                                                                <div className="text-xs text-center font-medium text-muted-foreground mb-1">
                                                                    Toplam Stok
                                                                </div>
                                                                <div className="text-lg text-center font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded border">
                                                                    {product.warehouses.reduce(
                                                                        (sum, w) => sum + w.quantity,
                                                                        0
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Depo Stokları */}
                                                            <div className="flex-1">
                                                                <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                                                                    {product.warehouses.map((warehouse) => (
                                                                        <WarehouseStockInput
                                                                            key={`${product.productId}-${warehouse.warehouseId}`}
                                                                            productId={product.productId}
                                                                            warehouseId={warehouse.warehouseId}
                                                                            warehouseName={warehouse.warehouseName}
                                                                            value={
                                                                                stockValues[
                                                                                    `${product.productId}-${warehouse.warehouseId}`
                                                                                ] || ""
                                                                            }
                                                                            isUpdating={updatingStocks.has(
                                                                                `${product.productId}-${warehouse.warehouseId}`
                                                                            )}
                                                                            wasRecentlyUpdated={recentlyUpdated.has(
                                                                                `${product.productId}-${warehouse.warehouseId}`
                                                                            )}
                                                                            onChange={handleStockChange}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
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
                            {isLoadingStockStatuses ? (
                                <div className="p-8 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Stok verileri yükleniyor...
                                    </div>
                                </div>
                            ) : (
                                <div className="max-h-[calc(100vh-350px)] overflow-y-auto">
                                    <div className="grid grid-cols-1 gap-4 p-4">
                                        {filteredProducts.map((product) => (
                                            <Card key={product.productId} className="overflow-hidden">
                                                <div className="p-4">
                                                    {/* Üst kısım: Resim ve Ürün Bilgileri */}
                                                    <div className="flex items-start gap-3 mb-4">
                                                        <img
                                                            src={
                                                                product.productImage ||
                                                                "/images/no-image-placeholder.svg"
                                                            }
                                                            alt={product.productName}
                                                            className={`w-16 h-16 aspect-square object-cover rounded border flex-shrink-0 ${
                                                                product.productImage
                                                                    ? "cursor-pointer hover:opacity-80 transition-opacity"
                                                                    : ""
                                                            }`}
                                                            onClick={() =>
                                                                product.productImage && handleImageClick(product)
                                                            }
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.src = "/images/no-image-placeholder.svg";
                                                            }}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold text-base leading-tight mb-1">
                                                                {product.productName}
                                                            </h3>
                                                            {product.productCode && (
                                                                <p className="text-sm text-muted-foreground">
                                                                    Kod: {product.productCode}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Alt kısım: Toplam Stok ve Depo Stokları */}
                                                    <div className="space-y-4">
                                                        {/* Toplam Stok */}
                                                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                            <div className="flex items-center gap-2">
                                                                <Warehouse className="h-4 w-4 text-blue-600" />
                                                                <span className="text-sm font-medium text-blue-900">
                                                                    Toplam Stok:
                                                                </span>
                                                            </div>
                                                            <div className="text-lg font-bold text-blue-600">
                                                                {product.warehouses.reduce(
                                                                    (sum, w) => sum + w.quantity,
                                                                    0
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Depo Stokları */}
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {product.warehouses.map((warehouse) => (
                                                                <WarehouseStockInput
                                                                    key={`${product.productId}-${warehouse.warehouseId}`}
                                                                    productId={product.productId}
                                                                    warehouseId={warehouse.warehouseId}
                                                                    warehouseName={warehouse.warehouseName}
                                                                    value={
                                                                        stockValues[
                                                                            `${product.productId}-${warehouse.warehouseId}`
                                                                        ] || ""
                                                                    }
                                                                    isUpdating={updatingStocks.has(
                                                                        `${product.productId}-${warehouse.warehouseId}`
                                                                    )}
                                                                    wasRecentlyUpdated={recentlyUpdated.has(
                                                                        `${product.productId}-${warehouse.warehouseId}`
                                                                    )}
                                                                    onChange={handleStockChange}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {!isLoadingStockStatuses && filteredProducts.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                                {searchTerm
                                    ? "Arama kriterlerinize uygun ürün bulunamadı."
                                    : "Kayıtlı ürün bulunamadı."}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Resim Büyütme Modal'ı */}
            <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle>{selectedProductImage?.alt}</DialogTitle>
                    </DialogHeader>
                    <div className="p-6 pt-0">
                        {selectedProductImage && (
                            <div className="flex justify-center">
                                <img
                                    src={selectedProductImage.src}
                                    alt={selectedProductImage.alt}
                                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                                />
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

