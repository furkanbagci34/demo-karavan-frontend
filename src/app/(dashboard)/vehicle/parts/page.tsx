"use client";

import { useState } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, Package, Plus, Trash2, Loader2, Search, Settings } from "lucide-react";
import { useVehicles } from "@/hooks/api/useVehicles";
import { useVehicleParts } from "@/hooks/api/useVehicleParts";
import { useProducts } from "@/hooks/api/useProducts";

export default function VehiclePartsPage() {
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

    const { vehicles, isLoading: isLoadingVehicles } = useVehicles();
    const { products, isLoading: isLoadingProducts } = useProducts();
    const {
        vehicleParts,
        createVehiclePart,
        updateVehiclePart,
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

                {/* Araç Seçimi - İyileştirilmiş Tasarım */}
                <Card className="border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors duration-300">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Car className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Araç Seçimi</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Parçalarını yönetmek istediğiniz aracı seçin
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <Label htmlFor="vehicle-select" className="text-sm font-medium mb-2 block">
                                        Araç Seçin
                                    </Label>
                                    <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                                        <SelectTrigger className="w-full h-12 text-base">
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
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={
                                                                    vehicle.image || "/images/no-image-placeholder.svg"
                                                                }
                                                                alt={vehicle.name}
                                                                className="w-8 h-8 rounded object-cover"
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.src = "/images/no-image-placeholder.svg";
                                                                }}
                                                            />
                                                            <span className="font-medium">{vehicle.name}</span>
                                                        </div>
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
                            </div>

                            {/* Seçili Araç Bilgileri */}
                            {selectedVehicle && (
                                <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 border border-primary/20">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <img
                                                src={selectedVehicle.image || "/images/no-image-placeholder.svg"}
                                                alt={selectedVehicle.name}
                                                className="w-16 h-16 aspect-square object-cover rounded-lg border-2 border-primary/20 shadow-sm"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = "/images/no-image-placeholder.svg";
                                                }}
                                            />
                                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                                <span className="text-xs font-bold text-primary-foreground">
                                                    {vehicleParts.length > 0
                                                        ? vehicleParts[0]?.products?.length || 0
                                                        : 0}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg text-primary">
                                                {selectedVehicle.name}
                                            </h3>
                                            <div className="flex items-center gap-4 mt-1">
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <Package className="h-4 w-4" />
                                                    <span>
                                                        {vehicleParts.length > 0
                                                            ? `${vehicleParts[0]?.products?.length || 0} parça`
                                                            : "Henüz parça eklenmemiş"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <Settings className="h-4 w-4" />
                                                    <span>Parça Yönetimi</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="text-xs">
                                                Aktif
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Parça Listesi - İyileştirilmiş Tasarım */}
                {selectedVehicleId && (
                    <Card className="shadow-sm border-0 bg-gradient-to-br from-background to-muted/20">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-secondary">
                                        <Package className="h-5 w-5 text-secondary-foreground" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Parça Listesi</CardTitle>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Araca eklenen parçaları yönetin
                                        </p>
                                    </div>
                                </div>
                                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="shadow-sm">
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
                                                                {/* Ürün Resmi - Daha küçük */}
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 p-4">
                                    {vehicleParts[0]?.products?.map((product) => (
                                        <Card
                                            key={product.id}
                                            className="overflow-hidden hover:shadow-md transition-shadow duration-200 group"
                                        >
                                            <div className="relative">
                                                {/* Ürün Resmi - Daha küçük ve düzenli */}
                                                <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                                                    <img
                                                        src={product.image || "/images/no-image-placeholder.svg"}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = "/images/no-image-placeholder.svg";
                                                        }}
                                                    />
                                                    {/* Miktar Badge'i */}
                                                    <div className="absolute top-2 left-2">
                                                        <Badge variant="secondary" className="text-xs font-medium">
                                                            {vehicleParts[0]?.quantities?.[product.id.toString()] || 1}
                                                        </Badge>
                                                    </div>
                                                    {/* Silme Butonu */}
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-7 w-7 p-0"
                                                        onClick={() => handleRemoveProductFromVehicle(product.id)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="p-3 space-y-2">
                                                <div>
                                                    <h3 className="font-medium text-sm line-clamp-2 leading-tight">
                                                        {product.name}
                                                    </h3>
                                                    {product.code && (
                                                        <p className="text-xs text-muted-foreground font-mono mt-1">
                                                            {product.code}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between">
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
                                                        <span className="text-xs font-medium px-2">
                                                            {vehicleParts[0]?.quantities?.[product.id.toString()] || 1}
                                                        </span>
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
                                    <div className="max-w-sm mx-auto">
                                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Package className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="font-medium text-lg mb-2">Henüz parça eklenmemiş</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Bu araca henüz parça eklenmemiş. Parça Ekle butonuna tıklayarak ürün
                                            ekleyebilirsiniz.
                                        </p>
                                        <Button onClick={() => setIsAddDialogOpen(true)} className="shadow-sm">
                                            <Plus className="h-4 w-4 mr-2" />
                                            İlk Parçayı Ekle
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
