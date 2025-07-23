"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Minus, ShoppingCart, ChevronsUpDown, Package, Search, FileText } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useOffers } from "@/hooks/api/useOffers";
import { useCustomers } from "@/hooks/api/useCustomers";
import { useVehicles } from "@/hooks/api/useVehicles";
import { useVehicleParts } from "@/hooks/api/useVehicleParts";
import { useProducts } from "@/hooks/api/useProducts";
import { useIsMobile } from "@/hooks/use-mobile";
import { generateOfferPdf } from "@/components/OfferPdfPreview";
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

interface OfferItem {
    id: number;
    productId: number;
    name: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    purchasePrice: number;
    totalPurchasePrice: number;
    image: string;
    unit?: string; // Ürün birimi (Adet, Saat vb.)
}

export default function CreateOfferPage() {
    const [open, setOpen] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [offerItems, setOfferItems] = useState<OfferItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [offerNumber, setOfferNumber] = useState("");
    const [validUntil, setValidUntil] = useState(() => {
        const today = new Date();
        const validDate = new Date(today);
        validDate.setDate(today.getDate() + 15);
        return validDate.toISOString().split("T")[0];
    });
    const [notes, setNotes] = useState("");
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
    const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
    const [discountType, setDiscountType] = useState<"percentage" | "amount" | null>(null);
    const [discountValue, setDiscountValue] = useState<number>(0);
    const [discountMethod, setDiscountMethod] = useState<"total" | "distribute" | null>("total");
    const [showPricingInPdf, setShowPricingInPdf] = useState(true); // PDF'de fiyat gösterimi için switch

    const [saving, setSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false); // Yeni teklif başlangıçta kaydedilmemiş
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ index: number; name: string; image: string } | null>(null);

    const { getLastOfferId, createOffer } = useOffers();
    const { products, isLoading: productsLoading } = useProducts();
    const { customers, isLoading: customersLoading } = useCustomers();
    const { vehicles, isLoading: vehiclesLoading } = useVehicles();
    const { vehicleParts } = useVehicleParts(selectedVehicleId?.toString());
    const isMobile = useIsMobile();

    // Filtrelenmiş ürünler
    const filteredProducts = useMemo(() => {
        if (!searchTerm.trim()) {
            return products;
        }

        const searchNormalized = normalizeTurkishText(searchTerm.trim());
        return products.filter((product) => {
            const nameMatch = normalizeTurkishText(product.name).includes(searchNormalized);
            const codeMatch = product.code ? normalizeTurkishText(product.code).includes(searchNormalized) : false;
            const descriptionMatch = product.description
                ? normalizeTurkishText(product.description).includes(searchNormalized)
                : false;
            return nameMatch || codeMatch || descriptionMatch;
        });
    }, [products, searchTerm]);

    // Sayfa yüklendiğinde teklif numarasını oluştur
    useEffect(() => {
        generateOfferNumber();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Araç seçildiğinde parçalarını teklife ekle
    useEffect(() => {
        if (selectedVehicleId && vehicleParts.length > 0) {
            // Araç parçalarını teklife ekle (handleAddProduct mantığıyla)
            vehicleParts.forEach((vehiclePart) => {
                if (vehiclePart.products && vehiclePart.products.length > 0) {
                    vehiclePart.products.forEach((product) => {
                        // handleAddProduct mantığını kullan
                        // Fiyatı number'a çevir ve güvenlik kontrolü yap
                        let unitPrice: number;
                        if (typeof product.sale_price === "string") {
                            unitPrice = parseFloat(product.sale_price);
                        } else if (typeof product.sale_price === "number") {
                            unitPrice = product.sale_price;
                        } else {
                            unitPrice = 0;
                        }

                        if (isNaN(unitPrice) || unitPrice < 0) {
                            console.error("Geçersiz fiyat:", product.sale_price);
                            return;
                        }

                        // Alış fiyatını al
                        let purchasePrice: number;
                        if (typeof product.purchase_price === "string") {
                            purchasePrice = parseFloat(product.purchase_price);
                        } else if (typeof product.purchase_price === "number") {
                            purchasePrice = product.purchase_price;
                        } else {
                            purchasePrice = 0;
                        }

                        if (isNaN(purchasePrice) || purchasePrice < 0) {
                            purchasePrice = 0;
                        }

                        // Yeni ürün oluştur ve ekle
                        const newItem: OfferItem = {
                            id: Date.now() + Math.random(),
                            productId: product.id,
                            name: product.name || "Ürün",
                            description: product.description || product.code || product.name || "Ürün açıklaması",
                            quantity: vehiclePart.quantities?.[product.id.toString()] || 1,
                            unitPrice: unitPrice,
                            totalPrice: unitPrice * (vehiclePart.quantities?.[product.id.toString()] || 1),
                            purchasePrice: purchasePrice,
                            totalPurchasePrice: purchasePrice * (vehiclePart.quantities?.[product.id.toString()] || 1),
                            image: product.image || "/images/no-image-placeholder.svg",
                            unit: product.unit || "Adet", // Ürün birimini al
                        };

                        setOfferItems((prev) => {
                            // Aynı ürün zaten eklenmişse miktarını artır
                            const existingItemIndex = prev.findIndex((item) => item.productId === product.id);
                            if (existingItemIndex >= 0) {
                                const updated = [...prev];
                                updated[existingItemIndex].quantity += 1;
                                updated[existingItemIndex].totalPrice =
                                    updated[existingItemIndex].unitPrice * updated[existingItemIndex].quantity;
                                updated[existingItemIndex].totalPurchasePrice =
                                    updated[existingItemIndex].purchasePrice * updated[existingItemIndex].quantity;
                                return updated;
                            } else {
                                return [...prev, newItem];
                            }
                        });
                    });
                }
            });

            toast.success("Araç parçaları teklife eklendi", {
                description: `${
                    vehicles.find((v) => v.id === selectedVehicleId)?.name
                } aracının parçaları teklif listesine eklendi.`,
            });
        }
    }, [selectedVehicleId, vehicleParts, vehicles]);

    const handleAddProduct = (productId: number) => {
        const product = filteredProducts.find((p) => p.id === productId);
        if (!product) return;

        // Fiyatı number'a çevir ve güvenlik kontrolü yap
        let unitPrice: number;
        if (typeof product.sale_price === "string") {
            unitPrice = parseFloat(product.sale_price);
        } else if (typeof product.sale_price === "number") {
            unitPrice = product.sale_price;
        } else {
            unitPrice = 0;
        }

        if (isNaN(unitPrice) || unitPrice < 0) {
            console.error("Geçersiz fiyat:", product.sale_price);
            return;
        }

        // Alış fiyatını al
        let purchasePrice: number;
        if (typeof product.purchase_price === "string") {
            purchasePrice = parseFloat(product.purchase_price);
        } else if (typeof product.purchase_price === "number") {
            purchasePrice = product.purchase_price;
        } else {
            purchasePrice = 0;
        }

        if (isNaN(purchasePrice) || purchasePrice < 0) {
            purchasePrice = 0;
        }

        // Aynı ürün zaten eklenmişse miktarını artır
        const existingItemIndex = offerItems.findIndex((item) => item.productId === product.id);

        if (existingItemIndex >= 0) {
            handleQuantityChange(existingItemIndex, offerItems[existingItemIndex].quantity + 1);
        } else {
            const newItem: OfferItem = {
                id: Date.now() + Math.random(),
                productId: product.id,
                name: product.name,
                description: product.description || "",
                quantity: 1,
                unitPrice: unitPrice,
                totalPrice: unitPrice,
                purchasePrice: purchasePrice,
                totalPurchasePrice: purchasePrice,
                image: product.image || "/images/no-image-placeholder.svg",
                unit: product.unit || "Adet", // Ürün birimini al
            };

            setOfferItems([...offerItems, newItem]);
        }

        setSelectedProductId(null);
        setOpen(false);
    };

    const handleRemoveItem = (index: number) => {
        const itemToRemove = offerItems[index];
        setItemToDelete({ index, name: itemToRemove.name, image: itemToRemove.image });
        setShowDeleteDialog(true);
    };

    const confirmDeleteItem = () => {
        if (itemToDelete) {
            const updatedItems = offerItems.filter((_, i) => i !== itemToDelete.index);
            setOfferItems(updatedItems);
            toast.success("Ürün kaldırıldı", {
                description: `${itemToDelete.name} teklif listesinden kaldırıldı.`,
            });
        }
        setShowDeleteDialog(false);
        setItemToDelete(null);
    };

    const handleQuantityChange = (index: number, newQuantity: number) => {
        if (newQuantity <= 0) {
            handleRemoveItem(index);
            return;
        }

        const updatedItems = [...offerItems];
        updatedItems[index].quantity = newQuantity;

        // Güvenli hesaplama
        const unitPrice =
            typeof updatedItems[index].unitPrice === "number" && !isNaN(updatedItems[index].unitPrice)
                ? updatedItems[index].unitPrice
                : 0;
        const purchasePrice =
            typeof updatedItems[index].purchasePrice === "number" && !isNaN(updatedItems[index].purchasePrice)
                ? updatedItems[index].purchasePrice
                : 0;
        updatedItems[index].totalPrice = newQuantity * unitPrice;
        updatedItems[index].totalPurchasePrice = newQuantity * purchasePrice;

        setOfferItems(updatedItems);
    };

    const handlePriceChange = (index: number, newPrice: number) => {
        if (newPrice < 0 || isNaN(newPrice)) return;

        const updatedItems = [...offerItems];
        updatedItems[index].unitPrice = newPrice;

        // Güvenli hesaplama
        const quantity =
            typeof updatedItems[index].quantity === "number" && !isNaN(updatedItems[index].quantity)
                ? updatedItems[index].quantity
                : 0;
        updatedItems[index].totalPrice = quantity * newPrice;

        setOfferItems(updatedItems);
    };

    const calculateGrossTotal = () => {
        return offerItems.reduce((total, item) => {
            const itemTotal = typeof item.totalPrice === "number" && !isNaN(item.totalPrice) ? item.totalPrice : 0;
            return total + itemTotal;
        }, 0);
    };

    const calculatePurchaseTotal = () => {
        return offerItems.reduce((total, item) => {
            const itemTotal =
                typeof item.totalPurchasePrice === "number" && !isNaN(item.totalPurchasePrice)
                    ? item.totalPurchasePrice
                    : 0;
            return total + itemTotal;
        }, 0);
    };

    const calculateDiscount = () => {
        if (!discountType || discountValue === 0) return 0;

        const finalTotal = calculateGrossTotal() + calculateGrossTotal() * 0.2; // Brüt + KDV

        if (discountType === "amount") {
            // Tutarsal indirim - toplam tutarın (KDV dahil) yüzdesi
            return Math.min(discountValue, finalTotal);
        } else if (discountType === "percentage") {
            // Yüzdesel indirim - toplam tutarın (KDV dahil) yüzdesi
            return (finalTotal * discountValue) / 100;
        }

        return 0;
    };

    const calculateItemDiscount = (itemTotal: number) => {
        if (!discountType || discountValue === 0 || discountMethod !== "distribute") return 0;

        const grossTotal = calculateGrossTotal();
        if (grossTotal === 0) return 0;

        if (discountType === "percentage") {
            // Satırsal yüzdesel indirim - her satıra orantılı dağıt
            const itemDiscountPercentage = (itemTotal / grossTotal) * discountValue;
            return (itemTotal * itemDiscountPercentage) / 100;
        } else if (discountType === "amount") {
            // Satırsal tutarsal indirim - her satıra orantılı dağıt
            const totalDiscount = Math.min(discountValue, grossTotal);
            return (itemTotal / grossTotal) * totalDiscount;
        }

        return 0;
    };

    const calculateNetTotal = () => {
        const grossTotal = calculateGrossTotal();
        const vat = grossTotal * 0.2; // %20 KDV
        const finalTotal = grossTotal + vat;
        const discount = discountMethod === "total" ? calculateDiscount() : 0;
        return finalTotal - discount;
    };

    const calculateVAT = () => {
        const grossTotal = calculateGrossTotal();
        return grossTotal * 0.2; // %20 KDV
    };

    const calculateFinalTotal = () => {
        return calculateNetTotal(); // Artık net total zaten KDV dahil toplam - indirim
    };

    const handleClearAll = () => {
        setOfferItems([]);
        setSelectedCustomerId(null);
        setSelectedVehicleId(null);
        setDiscountType(null);
        setDiscountValue(0);
        setDiscountMethod(null);
        setNotes("");
        toast.success("Tüm liste temizlendi", {
            description: "Teklif listesi başarıyla sıfırlandı.",
        });
    };

    const handleSaveOffer = async () => {
        if (!selectedCustomerId) {
            toast.error("Müşteri seçilmedi", {
                description: "Lütfen bir müşteri seçin",
            });
            return;
        }

        if (offerItems.length === 0) {
            toast.error("Ürün eklenmedi", {
                description: "Lütfen en az bir ürün ekleyin",
            });
            return;
        }

        setSaving(true);

        const offerData = {
            offerNumber: offerNumber || undefined,
            customerId: selectedCustomerId || undefined,
            vehicleId: selectedVehicleId || undefined,
            subtotal: calculateGrossTotal(),
            discountType: discountType || undefined,
            discountValue: discountValue,
            discountAmount: calculateDiscount(),
            netTotal: calculateNetTotal(),
            vatRate: 20.0,
            vatAmount: calculateVAT(),
            totalAmount: calculateFinalTotal(),
            status: "beklemede",
            validUntil: validUntil || undefined,
            notes: notes || undefined,
            items: offerItems.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                discountAmount: discountMethod === "distribute" ? calculateItemDiscount(item.totalPrice) : 0,
                discountType: discountMethod === "distribute" ? discountType || undefined : undefined,
                discountValue: discountMethod === "distribute" ? discountValue : 0,
            })),
        };

        try {
            const result = await createOffer(offerData);

            if (result && result.offerId) {
                setIsSaved(true); // Teklif başarıyla kaydedildi
                toast.success("Teklif başarıyla oluşturuldu!", {
                    description: "Yeni teklif sisteme kaydedildi.",
                });

                // Teklif kaydedildikten sonra yeni teklif numarası oluştur
                await generateOfferNumber();
            } else {
                toast.error("Teklif kaydedilemedi", {
                    description: "Beklenmeyen bir hata oluştu",
                });
            }
        } catch (error: unknown) {
            console.error("Teklif kaydedilirken hata:", error);
            const errorMessage = error instanceof Error ? error.message : "Teklif kaydedilirken bir hata oluştu";
            toast.error("Teklif kaydedilemedi", {
                description: errorMessage,
            });
        } finally {
            setSaving(false);
        }
    };

    const generateOfferNumber = async () => {
        try {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, "0");
            const day = String(today.getDate()).padStart(2, "0");
            const dateString = `${year}-${month}-${day}`;

            const lastOfferResponse = await getLastOfferId();
            const nextId = lastOfferResponse.lastId || 1;

            setOfferNumber(`${dateString}-${nextId}`);
        } catch (error) {
            console.error("Teklif numarası oluşturulurken hata:", error);
            // Fallback olarak timestamp kullan
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, "0");
            const day = String(today.getDate()).padStart(2, "0");
            setOfferNumber(`${year}-${month}-${day}-${Date.now()}`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 shadow-sm">
                <div className="flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="h-6" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/dashboard" className="text-slate-600 hover:text-slate-900">
                                        Anasayfa
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-slate-900 font-medium">
                                        Teklif Oluştur
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 p-4">
                <div className="max-w-full mx-auto space-y-6">
                    {/* Page Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">Teklif Oluştur</h1>
                        </div>
                    </div>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                        {/* Left Column - Main Content */}
                        <div className="xl:col-span-3 space-y-4">
                            {/* Teklif Bilgileri */}
                            <Card className="border-slate-200 shadow-sm">
                                <CardHeader className="pb-1">
                                    <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <FileText className="h-4 w-4 text-blue-600" />
                                        </div>
                                        Teklif Bilgileri
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-1">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-slate-700">
                                                Teklif Numarası
                                            </label>
                                            <Input
                                                placeholder="OFF-2024-001"
                                                value={offerNumber}
                                                disabled
                                                onChange={(e) => setOfferNumber(e.target.value)}
                                                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 h-9"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-slate-700">
                                                Müşteri Seçimi <span className="text-red-500">*</span>
                                            </label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={`w-full justify-between h-9 text-left font-normal hover:bg-slate-50 ${
                                                            !selectedCustomerId
                                                                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                                                                : "border-slate-300"
                                                        }`}
                                                    >
                                                        {selectedCustomerId
                                                            ? customers.find(
                                                                  (customer) => customer.id === selectedCustomerId
                                                              )?.name
                                                            : "Müşteri seçin (zorunlu)..."}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-full p-0" align="start">
                                                    <Command>
                                                        <CommandInput placeholder="Müşteri ara..." className="h-9" />
                                                        <CommandEmpty>
                                                            {customersLoading ? (
                                                                <div className="flex items-center justify-center py-4">
                                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                                                    <span className="ml-2 text-sm">Yükleniyor...</span>
                                                                </div>
                                                            ) : (
                                                                <div className="py-4 text-center text-sm text-muted-foreground">
                                                                    Müşteri bulunamadı
                                                                </div>
                                                            )}
                                                        </CommandEmpty>
                                                        <CommandGroup>
                                                            <CommandList className="max-h-[200px]">
                                                                {customers.map((customer) => (
                                                                    <CommandItem
                                                                        key={customer.id}
                                                                        onSelect={() =>
                                                                            setSelectedCustomerId(customer.id)
                                                                        }
                                                                        className="flex items-center gap-2"
                                                                    >
                                                                        <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex items-center justify-center">
                                                                            {selectedCustomerId === customer.id && (
                                                                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <div className="font-medium text-sm">
                                                                                {customer.name}
                                                                            </div>
                                                                            <div className="text-xs text-slate-500">
                                                                                {customer.email}
                                                                            </div>
                                                                        </div>
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandList>
                                                        </CommandGroup>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-slate-700">Araç Seçimi</label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className="w-full justify-between h-9 text-left font-normal border-slate-300 hover:bg-slate-50"
                                                    >
                                                        {selectedVehicleId
                                                            ? vehicles.find(
                                                                  (vehicle) => vehicle.id === selectedVehicleId
                                                              )?.name
                                                            : "Araç seçin (opsiyonel)..."}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-full p-0" align="start">
                                                    <Command>
                                                        <CommandInput placeholder="Araç ara..." className="h-9" />
                                                        <CommandEmpty>
                                                            {vehiclesLoading ? (
                                                                <div className="flex items-center justify-center py-4">
                                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                                                    <span className="ml-2 text-sm">Yükleniyor...</span>
                                                                </div>
                                                            ) : (
                                                                <div className="py-4 text-center text-sm text-muted-foreground">
                                                                    Araç bulunamadı
                                                                </div>
                                                            )}
                                                        </CommandEmpty>
                                                        <CommandGroup>
                                                            <CommandList className="max-h-[200px]">
                                                                <CommandItem
                                                                    onSelect={() => setSelectedVehicleId(null)}
                                                                    className="flex items-center gap-2"
                                                                >
                                                                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex items-center justify-center">
                                                                        {!selectedVehicleId && (
                                                                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-sm text-slate-500">
                                                                        Araç seçme
                                                                    </span>
                                                                </CommandItem>
                                                                {vehicles.map((vehicle) => (
                                                                    <CommandItem
                                                                        key={vehicle.id}
                                                                        onSelect={() =>
                                                                            setSelectedVehicleId(vehicle.id)
                                                                        }
                                                                        className="flex items-center gap-2"
                                                                    >
                                                                        <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex items-center justify-center">
                                                                            {selectedVehicleId === vehicle.id && (
                                                                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <div className="font-medium text-sm">
                                                                                {vehicle.name}
                                                                            </div>
                                                                            <div className="text-xs text-slate-500">
                                                                                {vehicle.is_active ? "Aktif" : "Pasif"}
                                                                            </div>
                                                                        </div>
                                                                        {vehicle.image && (
                                                                            <div className="w-6 h-6 rounded border overflow-hidden flex-shrink-0">
                                                                                <img
                                                                                    src={vehicle.image}
                                                                                    alt={vehicle.name}
                                                                                    className="w-full h-full object-cover"
                                                                                    onError={(e) => {
                                                                                        const target =
                                                                                            e.target as HTMLImageElement;
                                                                                        target.src =
                                                                                            "/images/no-image-placeholder.svg";
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandList>
                                                        </CommandGroup>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-slate-700">
                                                Geçerlilik Tarihi
                                            </label>
                                            <Input
                                                type="date"
                                                value={validUntil}
                                                onChange={(e) => setValidUntil(e.target.value)}
                                                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 h-9"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-slate-700">Notlar</label>
                                            <Input
                                                placeholder="Teklif notları..."
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 h-9"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Ürün Ekleme Formu */}
                            <Card className="border-slate-200 shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                            <Package className="h-4 w-4 text-green-600" />
                                        </div>
                                        Ürün Ekle
                                    </CardTitle>
                                    <p className="text-sm text-slate-600">Ürün arayın ve teklife ekleyin</p>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <label className="text-sm font-medium text-slate-700">Ürün Ara ve Seç</label>
                                        <Popover open={open} onOpenChange={setOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={open}
                                                    className="w-full justify-between h-12 text-left font-normal border-slate-300 hover:bg-slate-50"
                                                >
                                                    {selectedProductId
                                                        ? products.find((product) => product.id === selectedProductId)
                                                              ?.name
                                                        : "Ürün ara veya seç..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-[calc(100vw-2rem)] md:w-[600px] p-0"
                                                align="start"
                                            >
                                                <Command>
                                                    <CommandInput
                                                        placeholder="Ürün adı ile ara..."
                                                        className="h-12"
                                                        value={searchTerm}
                                                        onValueChange={setSearchTerm}
                                                    />
                                                    <CommandEmpty>
                                                        <div className="flex flex-col items-center py-6 text-center">
                                                            {productsLoading ? (
                                                                <>
                                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        Ürünler yükleniyor...
                                                                    </p>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Search className="h-8 w-8 text-muted-foreground mb-2" />
                                                                    <p className="text-sm text-muted-foreground">
                                                                        Ürün bulunamadı
                                                                    </p>
                                                                </>
                                                            )}
                                                        </div>
                                                    </CommandEmpty>
                                                    <CommandGroup>
                                                        <CommandList className="max-h-[300px]">
                                                            {filteredProducts.map((product) => (
                                                                <CommandItem
                                                                    key={product.id}
                                                                    value={`${product.name} ${product.description}`}
                                                                    onSelect={() => {
                                                                        handleAddProduct(product.id);
                                                                    }}
                                                                    className="flex items-center gap-2 md:gap-3 p-2 md:p-3 cursor-pointer hover:bg-accent/50"
                                                                >
                                                                    <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-muted rounded-lg flex items-center justify-center border overflow-hidden relative">
                                                                        <img
                                                                            src={
                                                                                product.image ||
                                                                                "/images/no-image-placeholder.svg"
                                                                            }
                                                                            alt={product.name}
                                                                            className="w-full h-full object-cover"
                                                                            onError={(e) => {
                                                                                const target =
                                                                                    e.target as HTMLImageElement;
                                                                                target.src =
                                                                                    "/images/no-image-placeholder.svg";
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-1 md:gap-0">
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="font-medium text-xs md:text-sm leading-tight truncate">
                                                                                    {product.name}
                                                                                </p>
                                                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 hidden md:block">
                                                                                    {product.description}
                                                                                </p>
                                                                            </div>
                                                                            <div className="flex-shrink-0 text-right">
                                                                                <div className="font-bold text-primary text-xs md:text-sm">
                                                                                    €
                                                                                    {formatNumber(
                                                                                        typeof product.sale_price ===
                                                                                            "number"
                                                                                            ? product.sale_price
                                                                                            : typeof product.sale_price ===
                                                                                              "string"
                                                                                            ? parseFloat(
                                                                                                  product.sale_price
                                                                                              ) || 0
                                                                                            : 0
                                                                                    )}
                                                                                </div>
                                                                                <div className="text-xs text-muted-foreground hidden md:block">
                                                                                    Birim Fiyat
                                                                                </div>
                                                                                <div className="text-xs text-slate-500 hidden md:block">
                                                                                    {product.unit || "adet"}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-shrink-0 ml-1 md:ml-3">
                                                                        <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                                            <Plus className="h-3 w-3 md:h-4 md:w-4 text-primary group-hover:text-primary-foreground" />
                                                                        </div>
                                                                    </div>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandList>
                                                    </CommandGroup>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>

                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Search className="h-3 w-3 flex-shrink-0" />
                                            <span className="hidden sm:inline">
                                                Ürün adı yazarak arama yapabilir veya listeden seçebilirsiniz
                                            </span>
                                            <span className="sm:hidden">Ürün ara ve seç</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Teklif Tablosu */}
                            <Card className="border-slate-200 shadow-sm">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                                <ShoppingCart className="h-4 w-4 text-purple-600" />
                                            </div>
                                            Teklif Detayları
                                        </CardTitle>
                                        {offerItems.length > 0 && (
                                            <Badge variant="outline" className="text-sm border-slate-300">
                                                {offerItems.length} ürün eklendi
                                            </Badge>
                                        )}
                                    </div>
                                    {offerItems.length === 0 && (
                                        <p className="text-sm text-slate-600">
                                            Ürün ekledikten sonra &quot;Kaydet&quot; butonuna basarak teklifi kaydedin.
                                        </p>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    {offerItems.length === 0 ? (
                                        <div className="text-center py-12 text-slate-500">
                                            <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p className="text-lg font-medium mb-2">Henüz ürün eklenmedi</p>
                                            <p className="text-sm">Yukarıdaki formdan ürün ekleyerek başlayın</p>
                                        </div>
                                    ) : isMobile ? (
                                        // Mobil görünüm - Kartlar
                                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                            {offerItems.map((item, index) => (
                                                <Card key={item.id} className="p-4 border-slate-200">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-shrink-0 w-16 h-16 bg-slate-100 rounded-md flex items-center justify-center overflow-hidden relative">
                                                            <img
                                                                src={item.image || "/images/no-image-placeholder.svg"}
                                                                alt={item.name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.src = "/images/no-image-placeholder.svg";
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-medium text-sm leading-tight mb-1">
                                                                        {item.name}
                                                                    </p>
                                                                    <p className="text-xs text-slate-500 line-clamp-2">
                                                                        {item.description}
                                                                    </p>
                                                                </div>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 flex-shrink-0"
                                                                    onClick={() => handleRemoveItem(index)}
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>

                                                            <div className="space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-sm text-slate-600">
                                                                        Miktar:
                                                                    </span>
                                                                    <div className="flex items-center gap-2">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="h-8 w-8 p-0 border-slate-300"
                                                                            onClick={() =>
                                                                                handleQuantityChange(
                                                                                    index,
                                                                                    item.quantity - 1
                                                                                )
                                                                            }
                                                                        >
                                                                            <Minus className="h-3 w-3" />
                                                                        </Button>
                                                                        <Input
                                                                            type="number"
                                                                            value={item.quantity}
                                                                            onChange={(e) => {
                                                                                const value =
                                                                                    parseInt(e.target.value) || 0;
                                                                                handleQuantityChange(index, value);
                                                                            }}
                                                                            className="w-16 h-8 text-center border-slate-300"
                                                                            min="1"
                                                                        />
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="h-8 w-8 p-0 border-slate-300"
                                                                            onClick={() =>
                                                                                handleQuantityChange(
                                                                                    index,
                                                                                    item.quantity + 1
                                                                                )
                                                                            }
                                                                        >
                                                                            <Plus className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-xs text-slate-500">
                                                                        Birim:
                                                                    </span>
                                                                    <span className="text-xs font-medium text-slate-700">
                                                                        {item.unit || "adet"}
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-sm text-slate-600">
                                                                        Birim Fiyat:
                                                                    </span>
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        min="0"
                                                                        value={item.unitPrice}
                                                                        onChange={(e) => {
                                                                            const value =
                                                                                parseFloat(e.target.value) || 0;
                                                                            handlePriceChange(index, value);
                                                                        }}
                                                                        className="w-24 h-8 border-slate-300"
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>

                                                                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                                                                    <span className="text-sm font-medium text-slate-700">
                                                                        Toplam:
                                                                    </span>
                                                                    <span className="text-lg font-bold text-blue-600">
                                                                        €
                                                                        {formatNumber(
                                                                            typeof item.totalPrice === "number" &&
                                                                                !isNaN(item.totalPrice)
                                                                                ? item.totalPrice
                                                                                : 0
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                {discountMethod === "distribute" &&
                                                                    calculateItemDiscount(item.totalPrice) > 0 && (
                                                                        <div className="flex items-center justify-between pt-1">
                                                                            <span className="text-xs text-red-600">
                                                                                İndirim:
                                                                            </span>
                                                                            <span className="text-sm font-medium text-red-600">
                                                                                -€
                                                                                {formatNumber(
                                                                                    calculateItemDiscount(
                                                                                        item.totalPrice
                                                                                    )
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        // Desktop görünüm - Tablo
                                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="border-slate-200">
                                                        <TableHead className="w-16 text-slate-700">Sıra</TableHead>
                                                        <TableHead className="w-20 text-slate-700">Resim</TableHead>
                                                        <TableHead className="text-slate-700">Ürün</TableHead>
                                                        <TableHead className="w-32 text-slate-700">
                                                            Miktar (Birim)
                                                        </TableHead>
                                                        <TableHead className="w-32 text-slate-700">
                                                            Birim Fiyat
                                                        </TableHead>
                                                        <TableHead className="w-32 text-slate-700">
                                                            Toplam (KDV Hariç)
                                                        </TableHead>
                                                        {discountMethod === "distribute" && (
                                                            <TableHead className="w-24 text-slate-700">
                                                                İndirim
                                                            </TableHead>
                                                        )}
                                                        <TableHead className="w-20 text-slate-700">İşlem</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {offerItems.map((item, index) => (
                                                        <TableRow key={item.id} className="border-slate-200">
                                                            <TableCell className="font-medium text-slate-700">
                                                                {index + 1}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="w-12 h-12 bg-slate-100 rounded-md flex items-center justify-center overflow-hidden relative">
                                                                    <img
                                                                        src={
                                                                            item.image ||
                                                                            "/images/no-image-placeholder.svg"
                                                                        }
                                                                        alt={item.name}
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => {
                                                                            const target = e.target as HTMLImageElement;
                                                                            target.src =
                                                                                "/images/no-image-placeholder.svg";
                                                                        }}
                                                                    />
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div>
                                                                    <p className="font-medium text-sm leading-tight text-slate-900">
                                                                        {item.name}
                                                                    </p>
                                                                    <p className="text-xs text-slate-500 mt-1">
                                                                        {item.description}
                                                                    </p>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="h-8 w-8 p-0 border-slate-300"
                                                                            onClick={() =>
                                                                                handleQuantityChange(
                                                                                    index,
                                                                                    item.quantity - 1
                                                                                )
                                                                            }
                                                                        >
                                                                            <Minus className="h-3 w-3" />
                                                                        </Button>
                                                                        <Input
                                                                            type="number"
                                                                            value={item.quantity}
                                                                            onChange={(e) => {
                                                                                const value =
                                                                                    parseInt(e.target.value) || 0;
                                                                                handleQuantityChange(index, value);
                                                                            }}
                                                                            className="w-16 h-8 text-center border-slate-300"
                                                                            min="1"
                                                                        />
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="h-8 w-8 p-0 border-slate-300"
                                                                            onClick={() =>
                                                                                handleQuantityChange(
                                                                                    index,
                                                                                    item.quantity + 1
                                                                                )
                                                                            }
                                                                        >
                                                                            <Plus className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                    <div className="text-xs text-slate-500 text-center">
                                                                        {item.unit || "adet"}
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    value={item.unitPrice}
                                                                    onChange={(e) => {
                                                                        const value = parseFloat(e.target.value) || 0;
                                                                        handlePriceChange(index, value);
                                                                    }}
                                                                    className="w-28 border-slate-300"
                                                                    placeholder="0.00"
                                                                />
                                                            </TableCell>
                                                            <TableCell className="font-medium text-slate-900">
                                                                €
                                                                {formatNumber(
                                                                    typeof item.totalPrice === "number" &&
                                                                        !isNaN(item.totalPrice)
                                                                        ? item.totalPrice
                                                                        : 0
                                                                )}
                                                            </TableCell>
                                                            {discountMethod === "distribute" && (
                                                                <TableCell className="text-red-600 font-medium">
                                                                    {calculateItemDiscount(item.totalPrice) > 0 ? (
                                                                        <>
                                                                            -€
                                                                            {formatNumber(
                                                                                calculateItemDiscount(item.totalPrice)
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <span className="text-slate-400">-</span>
                                                                    )}
                                                                </TableCell>
                                                            )}
                                                            <TableCell>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                                                                    onClick={() => handleRemoveItem(index)}
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column - Summary */}
                        <div className="xl:col-span-1">
                            <div className="sticky top-6 space-y-3">
                                {/* Action Buttons */}
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <FileText className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 text-sm">Teklif İşlemleri</h3>
                                            <p className="text-xs text-slate-600">
                                                Teklifinizi kaydedin veya görüntüleyin
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md border-0 h-10 font-medium"
                                            onClick={handleSaveOffer}
                                            disabled={saving}
                                        >
                                            {saving ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                    Kaydediliyor...
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-4 h-4 mr-2">
                                                        <svg
                                                            className="w-4 h-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                                                            />
                                                        </svg>
                                                    </div>
                                                    Kaydet
                                                </>
                                            )}
                                        </Button>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4">
                                                        <svg
                                                            className="w-4 h-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-slate-700">
                                                            {showPricingInPdf ? "Detaylı PDF" : "Toplam PDF"}
                                                        </span>
                                                        <p className="text-xs text-slate-500">
                                                            {showPricingInPdf
                                                                ? "Fiyat ve miktar detayları gösterilir"
                                                                : "Sadece ürün adı ve miktar gösterilir"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Switch
                                                    checked={showPricingInPdf}
                                                    onCheckedChange={setShowPricingInPdf}
                                                    className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-200"
                                                />
                                            </div>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 h-10 font-medium"
                                                onClick={() => {
                                                    if (!isSaved) {
                                                        toast.error("İlk önce teklifi kaydetmelisiniz", {
                                                            description:
                                                                "PDF görüntülemeden önce lütfen teklifi kaydedin.",
                                                        });
                                                        return;
                                                    }
                                                    if (offerItems.length === 0) {
                                                        toast.error("Ürün eklenmedi", {
                                                            description:
                                                                "PDF görüntülemek için lütfen en az bir ürün ekleyin.",
                                                        });
                                                        return;
                                                    }

                                                    generateOfferPdf({
                                                        offerNo: offerNumber,
                                                        offerDate: new Date().toLocaleDateString("tr-TR"),
                                                        offerValidUntil: validUntil,
                                                        customerName:
                                                            customers.find((c) => c.id === selectedCustomerId)?.name ||
                                                            "Müşteri Adı",

                                                        products: offerItems.map((item) => {
                                                            let oldPrice = undefined;
                                                            let price = item.unitPrice;
                                                            if (
                                                                discountType &&
                                                                discountValue > 0 &&
                                                                discountMethod === "distribute"
                                                            ) {
                                                                const itemDiscount = calculateItemDiscount(
                                                                    item.totalPrice
                                                                );
                                                                oldPrice = item.unitPrice;
                                                                price = item.unitPrice - itemDiscount / item.quantity;
                                                            }
                                                            return {
                                                                id: item.id,
                                                                name: item.name,
                                                                quantity: item.quantity,
                                                                price,
                                                                oldPrice,
                                                                total: price * item.quantity,
                                                                imageUrl: item.image,
                                                                unit: item.unit, // Ürün birimini ekle
                                                            };
                                                        }),
                                                        notes: notes,
                                                        gross: calculateGrossTotal(),
                                                        discount: calculateDiscount(),
                                                        net: calculateNetTotal(),
                                                        vat: calculateVAT(),
                                                        total: calculateFinalTotal(),
                                                        hidePricing: !showPricingInPdf, // Switch durumuna göre fiyat gösterimi
                                                    });
                                                }}
                                                disabled={offerItems.length === 0}
                                            >
                                                <div className="w-4 h-4 mr-2">
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                        />
                                                    </svg>
                                                </div>
                                                PDF Görüntüle
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 h-10 font-medium mt-2 relative z-10"
                                                onClick={handleClearAll}
                                            >
                                                <div className="w-4 h-4 mr-2">
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                        />
                                                    </svg>
                                                </div>
                                                Temizle
                                            </Button>
                                        </div>
                                    </div>

                                    {/* İndirim Bölümü */}
                                    <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-5 h-5 bg-red-100 rounded-lg flex items-center justify-center">
                                                <svg
                                                    className="h-3 w-3 text-red-600"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                                    />
                                                </svg>
                                            </div>
                                            <h3 className="text-sm font-semibold text-slate-900">İndirim Uygula</h3>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-slate-700">
                                                    İndirim Tipi
                                                </label>
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        variant={discountType === "percentage" ? "default" : "outline"}
                                                        size="sm"
                                                        disabled={offerItems.length === 0}
                                                        onClick={() => {
                                                            setDiscountType("percentage");
                                                            setDiscountValue(0);
                                                            setDiscountMethod("total");
                                                        }}
                                                        className="flex-1 h-8 text-xs"
                                                    >
                                                        Yüzdesel (%)
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant={discountType === "amount" ? "default" : "outline"}
                                                        size="sm"
                                                        disabled={offerItems.length === 0}
                                                        onClick={() => {
                                                            setDiscountType("amount");
                                                            setDiscountValue(0);
                                                            setDiscountMethod("total");
                                                        }}
                                                        className="flex-1 h-8 text-xs"
                                                    >
                                                        Tutarsal (€)
                                                    </Button>
                                                </div>
                                            </div>

                                            {/*{discountType && (
                                                <div className="space-y-2">
                                                    <label className="text-xs font-medium text-slate-700">
                                                        İndirim Yöntemi
                                                    </label>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            type="button"
                                                            variant={discountMethod === "total" ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => setDiscountMethod("total")}
                                                            className="flex-1 h-8 text-xs"
                                                        >
                                                            Genel Toplam
                                                        </Button>
                                                        {/*<Button
                                                            type="button"
                                                            variant={
                                                                discountMethod === "distribute" ? "default" : "outline"
                                                            }
                                                            size="sm"
                                                            onClick={() => setDiscountMethod("distribute")}
                                                            className="flex-1 h-8 text-xs"
                                                        >
                                                            Satırlara Dağıt
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}*/}

                                            {discountType && discountMethod && (
                                                <div className="space-y-2">
                                                    <label className="text-xs font-medium text-slate-700">
                                                        {discountType === "percentage"
                                                            ? "İndirim Oranı (%)"
                                                            : "İndirim Tutarı (€)"}
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        step={discountType === "percentage" ? "0.1" : "0.01"}
                                                        min="0"
                                                        max={discountType === "percentage" ? "100" : undefined}
                                                        value={discountValue}
                                                        onChange={(e) =>
                                                            setDiscountValue(parseFloat(e.target.value) || 0)
                                                        }
                                                        className="border-slate-300 focus:border-red-500 focus:ring-red-500 h-8 text-xs"
                                                        placeholder={discountType === "percentage" ? "10" : "50"}
                                                    />
                                                </div>
                                            )}

                                            {discountType && discountMethod && discountValue > 0 && (
                                                <div className="space-y-2">
                                                    <label className="text-xs font-medium text-slate-700">
                                                        İndirim Önizleme
                                                    </label>
                                                    <div className="h-8 flex items-center px-3 bg-red-100 border border-red-300 rounded-md">
                                                        <span className="text-xs font-medium text-red-700">
                                                            {discountMethod === "total"
                                                                ? `-€${formatNumber(calculateDiscount())}`
                                                                : `Satırlara dağıtılacak: €${formatNumber(
                                                                      calculateDiscount()
                                                                  )}`}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {discountType && (
                                                <div className="flex justify-end">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setDiscountType(null);
                                                            setDiscountValue(0);
                                                            setDiscountMethod(null);
                                                        }}
                                                        className="h-7 text-xs text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                                                    >
                                                        İndirimi Kaldır
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-blue-200">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-600">Durum:</span>
                                            <div className="flex items-center gap-1">
                                                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                                                <span className="text-yellow-700 font-medium">Beklemede</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Summary Card */}
                                <Card className="border-slate-200 shadow-sm">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                                <FileText className="h-4 w-4 text-orange-600" />
                                            </div>
                                            Toplam Özeti
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-slate-600">Alış Toplamı (Brüt):</span>
                                                <span className="text-sm font-medium text-slate-900">
                                                    €{formatNumber(calculatePurchaseTotal())}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-slate-600">Brüt Toplam:</span>
                                                <span className="text-sm font-medium text-slate-900">
                                                    €{formatNumber(calculateGrossTotal())}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-slate-600">İndirim:</span>
                                                <span className="text-sm font-medium text-red-600">
                                                    €{formatNumber(calculateDiscount())}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-slate-600">Net Toplam:</span>
                                                <span className="text-sm font-medium text-slate-900">
                                                    €{formatNumber(calculateNetTotal())}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-slate-600">KDV (%20):</span>
                                                <span className="text-sm font-medium text-slate-900">
                                                    €{formatNumber(calculateVAT())}
                                                </span>
                                            </div>
                                            <Separator className="bg-slate-200" />
                                            <div className="flex justify-between items-center pt-2">
                                                <span className="text-base font-semibold text-slate-900">
                                                    Genel Toplam:
                                                </span>
                                                <span className="text-xl font-bold text-blue-600">
                                                    €{formatNumber(calculateFinalTotal())}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-center gap-4 mb-4">
                            {itemToDelete && (
                                <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden relative">
                                    <img
                                        src={itemToDelete.image || "/images/no-image-placeholder.svg"}
                                        alt={itemToDelete.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = "/images/no-image-placeholder.svg";
                                        }}
                                    />
                                </div>
                            )}
                            <div className="flex-1">
                                <AlertDialogTitle>
                                    {itemToDelete?.name} ürününü kaldırmak istediğinize emin misiniz?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Bu işlem geri alınamaz. Ürün teklif listesinden kaldırılacak.
                                </AlertDialogDescription>
                            </div>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>İptal</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteItem}>Kaldır</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
