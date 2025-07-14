"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, Package, Plus, Trash2, Loader2, Search } from "lucide-react";
import { useVehicles } from "@/hooks/api/useVehicles";
import { useVehicleParts } from "@/hooks/api/useVehicleParts";
import { useProducts } from "@/hooks/api/useProducts";
import { Vehicle, Product } from "@/lib/api/types";

export default function VehiclePartsPage() {
    const router = useRouter();
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
    const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});

    const { vehicles, isLoading: isLoadingVehicles } = useVehicles();
    const { products, isLoading: isLoadingProducts } = useProducts();
    const {
        vehicleParts,
        createVehiclePart,
        updateVehiclePart,
        deleteVehiclePart,
        isLoading: isLoadingParts,
        isLoadingCreate,
    } = useVehicleParts(selectedVehicleId);

    // Seçili aracın bilgilerini al
    const selectedVehicle = vehicles.find((v) => v.id.toString() === selectedVehicleId);

    // Filtrelenmiş ürünler
    const filteredProducts = products.filter(
        (product) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.code && product.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Ürün seçimi toggle
    const toggleProductSelection = (productId: number) => {
        setSelectedProductIds((prev) =>
            prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
        );
    };

    // Miktar değiştirme
    const updateProductQuantity = (productId: number, quantity: number) => {
        if (quantity < 1) return;
        setProductQuantities((prev) => ({
            ...prev,
            [productId.toString()]: quantity,
        }));
    };

    // Tüm ürünleri seç/kaldır
    const toggleAllProducts = () => {
        if (selectedProductIds.length === filteredProducts.length) {
            setSelectedProductIds([]);
        } else {
            const allProductIds = filteredProducts.map((p) => p.id);
            setSelectedProductIds(allProductIds);
        }
    };

    // Ürünleri araca ekle
    const handleAddProducts = async () => {
        if (!selectedVehicleId) {
            toast.error("Lütfen bir araç seçin");
            return;
        }

        if (selectedProductIds.length === 0) {
            toast.error("Lütfen en az bir ürün seçin");
            return;
        }

        try {
            await createVehiclePart({
                vehicleId: parseInt(selectedVehicleId),
                productIds: selectedProductIds,
            });

            toast.success("Ürünler başarıyla araca eklendi!", {
                description: `${selectedProductIds.length} ürün araca eklendi.`,
            });

            // Dialog'u kapat ve seçimleri temizle
            setIsAddDialogOpen(false);
            setSelectedProductIds([]);
            setSearchTerm("");
        } catch (error: unknown) {
            console.error("Ürün ekleme hatası:", error);
            const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu, lütfen tekrar deneyin.";
            toast.error("Ürünler eklenemedi", {
                description: errorMessage,
            });
        }
    };

    // Parça silme
    const handleDeletePart = async (partId: string) => {
        try {
            await deleteVehiclePart(partId);
            toast.success("Parça başarıyla silindi");
        } catch (error: unknown) {
            console.error("Parça silme hatası:", error);
            const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu, lütfen tekrar deneyin.";
            toast.error("Parça silinemedi", {
                description: errorMessage,
            });
        }
    };

    // Ürünü product_ids array'inden çıkarıp güncelle
    const handleRemoveProductFromVehicle = async (productId: number) => {
        if (!vehicleParts[0]) return;
        const partId = vehicleParts[0].id.toString();
        const currentProductIds = vehicleParts[0].product_ids;
        const updatedProductIds = currentProductIds.filter((id: number) => id !== productId);

        // Quantities'den de çıkar
        const currentQuantities = vehicleParts[0].quantities || {};
        const updatedQuantities = { ...currentQuantities };
        delete updatedQuantities[productId.toString()];

        try {
            await updateVehiclePart(partId, {
                productIds: updatedProductIds,
                quantities: updatedQuantities,
            });
            toast.success("Ürün başarıyla araçtan çıkarıldı");
        } catch (error: unknown) {
            console.error("Ürün çıkarma hatası:", error);
            const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu, lütfen tekrar deneyin.";
            toast.error("Ürün çıkarılamadı", {
                description: errorMessage,
            });
        }
    };

    // Miktar güncelleme
    const handleUpdateProductQuantity = async (productId: number, newQuantity: number) => {
        if (!vehicleParts[0] || newQuantity < 1) return;

        const partId = vehicleParts[0].id.toString();
        const currentQuantities = vehicleParts[0].quantities || {};
        const updatedQuantities = {
            ...currentQuantities,
            [productId.toString()]: newQuantity,
        };

        try {
            await updateVehiclePart(partId, { quantities: updatedQuantities });
            toast.success("Miktar güncellendi");
        } catch (error: unknown) {
            console.error("Miktar güncelleme hatası:", error);
            const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu, lütfen tekrar deneyin.";
            toast.error("Miktar güncellenemedi", {
                description: errorMessage,
            });
        }
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
                            <BreadcrumbItem className="hidden sm:block">
                                <BreadcrumbLink href="/vehicle">Araçlar</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden sm:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Araç Parçaları</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <Car className="h-6 w-6" />
                        Araç Parçaları
                    </h1>
                </div>

                {/* Araç Seçimi */}
                <Card>
                    <CardHeader>
                        <CardTitle>Araç Seçimi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <Label htmlFor="vehicle-select">Araç Seçin</Label>
                                <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Araç seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {isLoadingVehicles ? (
                                            <SelectItem value="loading" disabled>
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Araçlar yükleniyor...
                                                </div>
                                            </SelectItem>
                                        ) : vehicles.length > 0 ? (
                                            vehicles.map((vehicle) => (
                                                <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                                                    {vehicle.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="no-vehicles" disabled>
                                                Araç bulunamadı
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            {selectedVehicle && (
                                <div className="flex items-center gap-2">
                                    <img
                                        src={selectedVehicle.image || "/images/no-image-placeholder.svg"}
                                        alt={selectedVehicle.name}
                                        className="w-12 h-12 aspect-square object-cover rounded border"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = "/images/no-image-placeholder.svg";
                                        }}
                                    />
                                    <div>
                                        <p className="font-medium">{selectedVehicle.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {vehicleParts.length > 0
                                                ? `${vehicleParts[0]?.products?.length || 0} parça`
                                                : "Henüz parça eklenmemiş"}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Parça Listesi */}
                {selectedVehicleId && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Parça Listesi</CardTitle>
                                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Parça Ekle
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>Ürün Seçimi</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            {/* Arama */}
                                            <div className="relative">
                                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Ürün ara..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="pl-10"
                                                />
                                            </div>

                                            {/* Ürün Listesi */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id="select-all"
                                                            checked={
                                                                selectedProductIds.length === filteredProducts.length &&
                                                                filteredProducts.length > 0
                                                            }
                                                            onCheckedChange={toggleAllProducts}
                                                        />
                                                        <Label htmlFor="select-all" className="text-sm font-medium">
                                                            Tümünü Seç
                                                        </Label>
                                                    </div>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {selectedProductIds.length} seçili
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                                                    {isLoadingProducts ? (
                                                        <div className="col-span-full flex items-center justify-center py-8">
                                                            <div className="flex items-center gap-2">
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                Ürünler yükleniyor...
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        filteredProducts.map((product) => (
                                                            <div
                                                                key={product.id}
                                                                className={`group relative flex flex-col p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                                                                    selectedProductIds.includes(product.id)
                                                                        ? "border-primary bg-primary/5 shadow-sm"
                                                                        : "border-border hover:border-primary/50"
                                                                }`}
                                                                onClick={() => toggleProductSelection(product.id)}
                                                            >
                                                                {/* Ürün Resmi */}
                                                                <div className="aspect-square mb-3 rounded-md overflow-hidden bg-muted">
                                                                    <img
                                                                        src={
                                                                            product.image ||
                                                                            "/images/no-image-placeholder.svg"
                                                                        }
                                                                        alt={product.name}
                                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                                        onError={(e) => {
                                                                            const target = e.target as HTMLImageElement;
                                                                            target.src =
                                                                                "/images/no-image-placeholder.svg";
                                                                        }}
                                                                    />
                                                                </div>

                                                                {/* Seçim Checkbox'ı */}
                                                                <div className="absolute top-2 right-2">
                                                                    <Checkbox
                                                                        checked={selectedProductIds.includes(
                                                                            product.id
                                                                        )}
                                                                        onCheckedChange={() =>
                                                                            toggleProductSelection(product.id)
                                                                        }
                                                                        className="bg-background/80 backdrop-blur-sm"
                                                                    />
                                                                </div>

                                                                {/* Ürün Bilgileri */}
                                                                <div className="flex-1 space-y-1">
                                                                    <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                                                                        {product.name}
                                                                    </h3>
                                                                    {product.code && (
                                                                        <p className="text-xs text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded inline-block">
                                                                            {product.code}
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                {/* Hover Overlay */}
                                                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg" />
                                                            </div>
                                                        ))
                                                    )}
                                                </div>

                                                {/* Boş durum */}
                                                {!isLoadingProducts && filteredProducts.length === 0 && (
                                                    <div className="text-center py-8">
                                                        <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                                                        <p className="text-muted-foreground text-sm">
                                                            {searchTerm
                                                                ? "Arama kriterlerine uygun ürün bulunamadı"
                                                                : "Henüz ürün eklenmemiş"}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Butonlar */}
                                            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setIsAddDialogOpen(false);
                                                        setSelectedProductIds([]);
                                                        setSearchTerm("");
                                                    }}
                                                    className="w-full sm:w-auto"
                                                >
                                                    İptal
                                                </Button>
                                                <Button
                                                    onClick={handleAddProducts}
                                                    disabled={isLoadingCreate || selectedProductIds.length === 0}
                                                    className="w-full sm:w-auto"
                                                >
                                                    {isLoadingCreate ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            Ekleniyor...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Seçili Ürünleri Ekle ({selectedProductIds.length})
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoadingParts ? (
                                <div className="p-8 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Parçalar yükleniyor...
                                    </div>
                                </div>
                            ) : vehicleParts.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                                    {vehicleParts[0]?.products?.map((product) => (
                                        <Card key={product.id} className="overflow-hidden">
                                            <div className="aspect-square relative">
                                                <img
                                                    src={product.image || "/images/no-image-placeholder.svg"}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = "/images/no-image-placeholder.svg";
                                                    }}
                                                />
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    className="absolute top-2 right-2"
                                                    onClick={() => handleRemoveProductFromVehicle(product.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="p-3">
                                                <h3 className="font-medium text-sm truncate">{product.name}</h3>
                                                {product.code && (
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {product.code}
                                                    </p>
                                                )}
                                                <div className="flex items-center justify-between mt-2">
                                                    <p className="text-xs text-muted-foreground">
                                                        Miktar:{" "}
                                                        {vehicleParts[0]?.quantities?.[product.id.toString()] || 1}
                                                    </p>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 text-xs"
                                                            onClick={() => {
                                                                const currentQty =
                                                                    vehicleParts[0]?.quantities?.[
                                                                        product.id.toString()
                                                                    ] || 1;
                                                                handleUpdateProductQuantity(product.id, currentQty + 1);
                                                            }}
                                                        >
                                                            +
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 text-xs"
                                                            onClick={() => {
                                                                const currentQty =
                                                                    vehicleParts[0]?.quantities?.[
                                                                        product.id.toString()
                                                                    ] || 1;
                                                                if (currentQty > 1) {
                                                                    handleUpdateProductQuantity(
                                                                        product.id,
                                                                        currentQty - 1
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            -
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                    <p className="text-muted-foreground">Henüz parça eklenmemiş</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        "Parça Ekle" butonuna tıklayarak ürün ekleyebilirsiniz
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Araç seçilmemişse bilgi mesajı */}
                {!selectedVehicleId && (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <Car className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground">Lütfen bir araç seçin</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Yukarıdaki araç seçimi dropdown'ından bir araç seçerek parça ekleyebilirsiniz
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
