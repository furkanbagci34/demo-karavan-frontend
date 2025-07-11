"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Trash2, Plus, Minus, ShoppingCart, ChevronsUpDown, Package, Search, FileText, Loader2 } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useOffers, type Offer } from "@/hooks/api/useOffers";
import { useCustomers } from "@/hooks/api/useCustomers";
import { useIsMobile } from "@/hooks/use-mobile";
import { generateOfferPdf } from "@/components/OfferPdfPreview";

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
    itemDiscountAmount?: number;
    itemDiscountType?: string;
    itemDiscountValue?: number;
}

export default function EditOfferPage() {
    const params = useParams();
    const router = useRouter();
    const offerId = Number(params.id);

    const [open, setOpen] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [offerItems, setOfferItems] = useState<OfferItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [offerNumber, setOfferNumber] = useState("");
    const [validUntil, setValidUntil] = useState("");
    const [notes, setNotes] = useState("");
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
    const [discountType, setDiscountType] = useState<"percentage" | "amount" | null>(null);
    const [discountValue, setDiscountValue] = useState<number>(0);
    const [discountMethod, setDiscountMethod] = useState<"total" | "distribute" | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [originalOffer, setOriginalOffer] = useState<Offer | null>(null);

    const {
        products,
        loading: productsLoading,
        error: productsError,
        getProductsForOffer,
        getOfferById,
        updateOffer,
    } = useOffers();
    const { customers, isLoading: customersLoading } = useCustomers();
    const isMobile = useIsMobile();

    // Teklif verilerini yükle
    useEffect(() => {
        const loadOffer = async () => {
            if (!offerId) return;

            try {
                setLoading(true);
                const offerData = await getOfferById(offerId);

                if (offerData) {
                    setOriginalOffer(offerData);
                    setOfferNumber(offerData.offer_number || "");
                    setValidUntil(offerData.valid_until ? offerData.valid_until.split("T")[0] : "");
                    setNotes(offerData.notes || "");
                    setSelectedCustomerId(offerData.customer_id || null);

                    // İndirim bilgilerini ayarla
                    if (offerData.discount_amount > 0) {
                        // Backend'den gelen indirim tipini kullan
                        if (offerData.discount_type === "percentage") {
                            setDiscountType("percentage");
                            setDiscountValue(offerData.discount_value || 0);
                        } else if (offerData.discount_type === "amount") {
                            setDiscountType("amount");
                            setDiscountValue(offerData.discount_amount);
                        } else {
                            // Eski veriler için fallback
                            const discountPercentage = (offerData.discount_amount / offerData.subtotal) * 100;
                            if (discountPercentage <= 100) {
                                setDiscountType("percentage");
                                setDiscountValue(discountPercentage);
                            } else {
                                setDiscountType("amount");
                                setDiscountValue(offerData.discount_amount);
                            }
                        }

                        // İndirim yöntemini belirle - eğer herhangi bir item'da indirim varsa "distribute", yoksa "total"
                        const hasItemDiscounts =
                            offerData.items &&
                            offerData.items.some(
                                (item: unknown) =>
                                    typeof item === "object" &&
                                    item !== null &&
                                    "discountAmount" in item &&
                                    typeof (item as { discountAmount?: number }).discountAmount === "number" &&
                                    (item as { discountAmount: number }).discountAmount > 0
                            );
                        setDiscountMethod(hasItemDiscounts ? "distribute" : "total");
                    }

                    // Ürünleri yükle
                    if (offerData.items && offerData.items.length > 0) {
                        const items: OfferItem[] = offerData.items.map((item: unknown) => {
                            const typedItem = item as Record<string, unknown>;
                            return {
                                id: (typedItem.id as number) || Date.now(),
                                productId: typedItem.productId as number,
                                name: (typedItem.productName as string) || "",
                                description: (typedItem.productDescription as string) || "",
                                quantity: typedItem.quantity as number,
                                unitPrice: typedItem.unitPrice as number,
                                totalPrice: typedItem.totalPrice as number,
                                purchasePrice: (typedItem.purchasePrice as number) || 0,
                                totalPurchasePrice:
                                    ((typedItem.purchasePrice as number) || 0) * (typedItem.quantity as number),
                                image: (typedItem.productImage as string) || "/images/no-image-placeholder.svg",
                                // İndirim bilgilerini de ekle
                                itemDiscountAmount: (typedItem.discountAmount as number) || 0,
                                itemDiscountType: typedItem.discountType as string,
                                itemDiscountValue: (typedItem.discountValue as number) || 0,
                            };
                        });
                        setOfferItems(items);
                    }
                }
            } catch (error) {
                console.error("Teklif yüklenirken hata:", error);
                toast.error("Teklif yüklenemedi", {
                    description: "Teklif bilgileri alınırken bir hata oluştu.",
                });
                router.push("/offer");
            } finally {
                setLoading(false);
            }
        };

        loadOffer();
    }, [offerId, getOfferById, router]);

    // Sayfa yüklendiğinde ürünleri getir
    useEffect(() => {
        getProductsForOffer();
    }, [getProductsForOffer]);

    // Arama yapıldığında ürünleri filtrele
    useEffect(() => {
        if (searchTerm.trim()) {
            getProductsForOffer(searchTerm);
        } else {
            getProductsForOffer();
        }
    }, [searchTerm, getProductsForOffer]);

    const handleAddProduct = (productId: number) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return;

        let unitPrice: number;
        if (typeof product.price === "string") {
            unitPrice = parseFloat(product.price);
        } else if (typeof product.price === "number") {
            unitPrice = product.price;
        } else {
            unitPrice = 0;
        }

        if (isNaN(unitPrice) || unitPrice < 0) {
            console.error("Geçersiz fiyat:", product.price);
            return;
        }

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

        const existingItemIndex = offerItems.findIndex((item) => item.productId === product.id);

        if (existingItemIndex >= 0) {
            handleQuantityChange(existingItemIndex, offerItems[existingItemIndex].quantity + 1);
        } else {
            const newItem: OfferItem = {
                id: Date.now(),
                productId: product.id,
                name: product.name,
                description: product.description,
                quantity: 1,
                unitPrice: unitPrice,
                totalPrice: unitPrice,
                purchasePrice: purchasePrice,
                totalPurchasePrice: purchasePrice,
                image: product.image,
            };

            setOfferItems([...offerItems, newItem]);
        }

        setSelectedProductId(null);
        setOpen(false);
    };

    const handleRemoveItem = (index: number) => {
        const updatedItems = offerItems.filter((_, i) => i !== index);
        setOfferItems(updatedItems);
    };

    const handleQuantityChange = (index: number, newQuantity: number) => {
        if (newQuantity <= 0) {
            handleRemoveItem(index);
            return;
        }

        const updatedItems = [...offerItems];
        updatedItems[index].quantity = newQuantity;

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
        if (!discountType || discountValue <= 0) return 0;

        const grossTotal = calculateGrossTotal();

        if (discountType === "percentage") {
            return (grossTotal * discountValue) / 100;
        } else {
            return Math.min(discountValue, grossTotal);
        }
    };

    const calculateItemDiscount = (itemTotal: number, itemIndex?: number) => {
        // Eğer mevcut item'da indirim varsa onu kullan
        if (
            itemIndex !== undefined &&
            offerItems[itemIndex]?.itemDiscountAmount &&
            offerItems[itemIndex].itemDiscountAmount > 0
        ) {
            return offerItems[itemIndex].itemDiscountAmount;
        }

        // Yoksa yeni hesaplama yap
        if (!discountType || discountMethod !== "distribute" || discountValue <= 0) return 0;

        const grossTotal = calculateGrossTotal();
        if (grossTotal === 0) return 0;

        const totalDiscount = calculateDiscount();
        return (itemTotal / grossTotal) * totalDiscount;
    };

    const calculateNetTotal = () => {
        const grossTotal = calculateGrossTotal();
        const discount = discountMethod === "total" ? calculateDiscount() : 0;
        return grossTotal - discount;
    };

    const calculateVAT = () => {
        return calculateNetTotal() * 0.2; // %20 KDV
    };

    const calculateFinalTotal = () => {
        const netTotal = calculateNetTotal();
        const vat = calculateVAT();
        return netTotal + vat;
    };

    const handleUpdateOffer = async () => {
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
            subtotal: calculateGrossTotal(),
            discountType: discountType || undefined,
            discountValue: discountValue,
            discountAmount: calculateDiscount(),
            netTotal: calculateNetTotal(),
            vatRate: 20.0,
            vatAmount: calculateVAT(),
            totalAmount: calculateFinalTotal(),
            status: originalOffer?.status || "draft",
            validUntil: validUntil || undefined,
            notes: notes || undefined,
            items: offerItems.map((item, index) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                discountAmount: discountMethod === "distribute" ? calculateItemDiscount(item.totalPrice, index) : 0,
                discountType: discountMethod === "distribute" ? discountType || undefined : undefined,
                discountValue: discountMethod === "distribute" ? discountValue : 0,
            })),
        };

        try {
            const result = await updateOffer(offerId, offerData);

            if (result) {
                toast.success("Teklif başarıyla güncellendi!", {
                    description: "Teklif bilgileri başarıyla güncellendi.",
                });
                router.push("/offer");
            } else {
                toast.error("Teklif güncellenemedi", {
                    description: "Beklenmeyen bir hata oluştu",
                });
            }
        } catch (error: unknown) {
            console.error("Teklif güncellenirken hata:", error);
            const errorMessage = error instanceof Error ? error.message : "Teklif güncellenirken bir hata oluştu";
            toast.error("Teklif güncellenemedi", {
                description: errorMessage,
            });
        } finally {
            setSaving(false);
        }
    };

    const handleViewPdf = () => {
        if (!originalOffer) return;

        const today = new Date();
        const offerDate = today.toLocaleDateString("tr-TR");

        const offerData = {
            offerNo: offerNumber,
            offerDate: offerDate,
            offerValidUntil: validUntil ? new Date(validUntil).toLocaleDateString("tr-TR") : "Belirtilmemiş",
            customerName:
                customers.find((c) => c.id === selectedCustomerId)?.name ||
                originalOffer.customer_name ||
                "Müşteri belirtilmemiş",
            products: offerItems.map((item, index) => {
                let oldPrice = undefined;
                let price = item.unitPrice;
                let total = item.totalPrice;

                // Eğer satırlara dağıtılmış indirim varsa
                if (discountMethod === "distribute" && discountType && discountValue > 0) {
                    const itemDiscount = calculateItemDiscount(item.totalPrice, index);
                    if (itemDiscount > 0) {
                        oldPrice = item.unitPrice;
                        price = item.unitPrice - itemDiscount / item.quantity;
                        total = price * item.quantity;
                    }
                }
                // Eğer item'da mevcut indirim varsa
                else if (item.itemDiscountAmount && item.itemDiscountAmount > 0) {
                    oldPrice = item.unitPrice;
                    price = item.unitPrice - item.itemDiscountAmount / item.quantity;
                    total = price * item.quantity;
                }

                return {
                    id: item.productId,
                    name: item.name,
                    quantity: item.quantity,
                    price,
                    oldPrice,
                    total,
                    imageUrl: item.image,
                };
            }),
            gross: calculateGrossTotal(),
            discount: calculateDiscount(),
            net: calculateNetTotal(),
            vat: calculateVAT(),
            total: calculateFinalTotal(),
            notes: notes,
        };

        generateOfferPdf(offerData);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Teklif yükleniyor...</span>
                </div>
            </div>
        );
    }

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
                                    <BreadcrumbLink href="/offer" className="text-slate-600 hover:text-slate-900">
                                        Teklifler
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-slate-900 font-medium">
                                        Teklif Düzenle
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
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">Teklif Düzenle</h1>
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-slate-700">
                                                Teklif Numarası
                                            </label>
                                            <Input
                                                placeholder="OFF-2024-001"
                                                value={offerNumber}
                                                onChange={(e) => setOfferNumber(e.target.value)}
                                                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 h-9"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-slate-700">Müşteri Seçimi</label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className="w-full justify-between h-9 text-left font-normal border-slate-300 hover:bg-slate-50"
                                                    >
                                                        {selectedCustomerId
                                                            ? customers.find(
                                                                  (customer) => customer.id === selectedCustomerId
                                                              )?.name
                                                            : "Müşteri seçin (opsiyonel)..."}
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
                                                                <CommandItem
                                                                    onSelect={() => setSelectedCustomerId(null)}
                                                                    className="flex items-center gap-2"
                                                                >
                                                                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex items-center justify-center">
                                                                        {!selectedCustomerId && (
                                                                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-sm text-slate-500">
                                                                        Müşteri seçme
                                                                    </span>
                                                                </CommandItem>
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
                                                            ) : productsError ? (
                                                                <>
                                                                    <Search className="h-8 w-8 text-muted-foreground mb-2" />
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {productsError}
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
                                                            {products.map((product) => (
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
                                                                                        typeof product.price ===
                                                                                            "number"
                                                                                            ? product.price
                                                                                            : typeof product.price ===
                                                                                              "string"
                                                                                            ? parseFloat(
                                                                                                  product.price
                                                                                              ) || 0
                                                                                            : 0
                                                                                    )}
                                                                                </div>
                                                                                <div className="text-xs text-muted-foreground hidden md:block">
                                                                                    Birim Fiyat
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
                                            Ürün ekledikten sonra &quot;Güncelle&quot; butonuna basarak teklifi
                                            güncelleyin.
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
                                                                    calculateItemDiscount(item.totalPrice, index) >
                                                                        0 && (
                                                                        <div className="flex items-center justify-between pt-1">
                                                                            <span className="text-xs text-red-600">
                                                                                İndirim:
                                                                            </span>
                                                                            <span className="text-sm font-medium text-red-600">
                                                                                -€
                                                                                {formatNumber(
                                                                                    calculateItemDiscount(
                                                                                        item.totalPrice,
                                                                                        index
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
                                                        <TableHead className="w-32 text-slate-700">Miktar</TableHead>
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
                                                                            const value = parseInt(e.target.value) || 0;
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
                                                                    {calculateItemDiscount(item.totalPrice, index) >
                                                                    0 ? (
                                                                        <>
                                                                            -€
                                                                            {formatNumber(
                                                                                calculateItemDiscount(
                                                                                    item.totalPrice,
                                                                                    index
                                                                                )
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
                                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                            <FileText className="h-4 w-4 text-yellow-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 text-sm">Teklif İşlemleri</h3>
                                            <p className="text-xs text-slate-600">
                                                Teklifinizi güncelleyin veya görüntüleyin
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-md border-0 h-10 font-medium"
                                            onClick={handleUpdateOffer}
                                            disabled={saving}
                                        >
                                            {saving ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                    Güncelleniyor...
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
                                                    Güncelle
                                                </>
                                            )}
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 h-10 font-medium"
                                            onClick={handleViewPdf}
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
                                                        onClick={() => {
                                                            setDiscountType("percentage");
                                                            setDiscountValue(0);
                                                            setDiscountMethod(null);
                                                        }}
                                                        className="flex-1 h-8 text-xs"
                                                    >
                                                        Yüzdesel (%)
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant={discountType === "amount" ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => {
                                                            setDiscountType("amount");
                                                            setDiscountValue(0);
                                                            setDiscountMethod(null);
                                                        }}
                                                        className="flex-1 h-8 text-xs"
                                                    >
                                                        Tutarsal (€)
                                                    </Button>
                                                </div>
                                            </div>

                                            {discountType && (
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
                                                        <Button
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
                                            )}

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
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                <span className="text-green-700 font-medium">
                                                    {originalOffer?.status || "Draft"}
                                                </span>
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
        </div>
    );
}
