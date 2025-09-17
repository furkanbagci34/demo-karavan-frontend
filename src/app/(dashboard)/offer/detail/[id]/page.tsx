"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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

import { Pagination } from "@/components/ui/pagination";
import {
    Trash2,
    Plus,
    Minus,
    ShoppingCart,
    ChevronsUpDown,
    Package,
    Search,
    FileText,
    Loader2,
    History,
    Save,
    Send,
    UserRoundPen,
    Pencil,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useOffers, type Offer, type OfferHistory } from "@/hooks/api/useOffers";
import { useCustomers } from "@/hooks/api/useCustomers";
import { useProducts } from "@/hooks/api/useProducts";
import { useVehicles } from "@/hooks/api/useVehicles";
import { useVehicleParts } from "@/hooks/api/useVehicleParts";
import { VehiclePart, Product } from "@/lib/api/types";
import { OfferStatus } from "@/lib/enums";

import { useIsMobile } from "@/hooks/use-mobile";
import { generateOfferPdf } from "@/components/OfferPdfPreview";
import { ProductionSendModal } from "@/components/ProductionSendModal";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

// Status renklerini belirleyen fonksiyon
const getStatusColor = (status: string) => {
    switch (status) {
        case OfferStatus.TASLAK:
            return "bg-yellow-100 text-yellow-800 border-yellow-300";
        case OfferStatus.GONDERILDI:
            return "bg-blue-100 text-blue-800 border-blue-300";
        case OfferStatus.ONAYLANDI:
            return "bg-green-100 text-green-800 border-green-300";
        case OfferStatus.IPTAL_EDILDI:
            return "bg-blue-100 text-blue-800 border-blue-300";
        case OfferStatus.TAMAMLANDI:
            return "bg-green-100 text-green-800 border-green-300";
        case OfferStatus.ÜRETIMDE:
            return "bg-purple-100 text-purple-800 border-purple-300";
        case OfferStatus.REDDEDILDI:
            return "bg-red-100 text-red-800 border-red-300";
        default:
            return "bg-gray-100 text-gray-800 border-gray-300";
    }
};

const getStatusDotColor = (status: string) => {
    switch (status) {
        case OfferStatus.TASLAK:
            return "bg-yellow-500";
        case OfferStatus.GONDERILDI:
            return "bg-blue-500";
        case OfferStatus.ONAYLANDI:
            return "bg-green-500";
        case OfferStatus.IPTAL_EDILDI:
            return "bg-blue-500";
        case OfferStatus.TAMAMLANDI:
            return "bg-green-500";
        case OfferStatus.ÜRETIMDE:
            return "bg-purple-500";
        case OfferStatus.REDDEDILDI:
            return "bg-red-500";
        default:
            return "bg-gray-500";
    }
};

// Card arka plan rengini belirleyen fonksiyon
const getCardBackgroundColor = (status: string) => {
    switch (status) {
        case OfferStatus.TASLAK:
            return "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200";
        case OfferStatus.GONDERILDI:
            return "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200";
        case OfferStatus.ONAYLANDI:
            return "bg-gradient-to-br from-green-50 to-green-100 border-green-200";
        case OfferStatus.TAMAMLANDI:
            return "bg-gradient-to-br from-green-50 to-green-100 border-green-200";
        case OfferStatus.ÜRETIMDE:
            return "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200";
        case OfferStatus.IPTAL_EDILDI:
            return "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200";
        case OfferStatus.REDDEDILDI:
            return "bg-gradient-to-br from-red-50 to-red-100 border-red-200";
        default:
            return "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200";
    }
};

// İkon rengini belirleyen fonksiyon
const getIconColor = (status: string) => {
    switch (status) {
        case OfferStatus.TASLAK:
            return "bg-yellow-100 text-yellow-600";
        case OfferStatus.GONDERILDI:
            return "bg-blue-100 text-blue-600";
        case OfferStatus.ONAYLANDI:
            return "bg-green-100 text-green-600";
        case OfferStatus.TAMAMLANDI:
            return "bg-green-100 text-green-600";
        case OfferStatus.ÜRETIMDE:
            return "bg-purple-100 text-purple-600";
        case OfferStatus.IPTAL_EDILDI:
            return "bg-blue-100 text-blue-600";
        case OfferStatus.REDDEDILDI:
            return "bg-red-100 text-red-600";
        default:
            return "bg-yellow-100 text-yellow-600";
    }
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
    itemDiscountAmount?: number;
    itemDiscountType?: string;
    itemDiscountValue?: number;
}

export default function EditOfferPage() {
    const params = useParams();
    const router = useRouter();

    // offerId'yi memoize et - gereksiz re-calculation'ları önler
    const offerId = useMemo(() => {
        const id = Number(params.id);
        return id;
    }, [params.id]);

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
    const [discountMethod, setDiscountMethod] = useState<"total" | "distribute" | null>("total");
    const [pdfMode, setPdfMode] = useState<"detailed" | "summary" | "nameOnly">("detailed");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [originalOffer, setOriginalOffer] = useState<Offer | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ index: number; name: string; image: string } | null>(null);
    const [showEmailUpdateDialog, setShowEmailUpdateDialog] = useState(false);
    const [localEmail, setLocalEmail] = useState(""); // Local state for input
    const [updatingEmail, setUpdatingEmail] = useState(false);

    // Confirmation dialog states
    const [showSendConfirmDialog, setShowSendConfirmDialog] = useState(false);
    const [showEmailConfirmDialog, setShowEmailConfirmDialog] = useState(false);

    // Contract modal states
    const [showContractModal, setShowContractModal] = useState(false);
    const [showContractConfirmModal, setShowContractConfirmModal] = useState(false);

    // Production modal state
    const [showProductionModal, setShowProductionModal] = useState(false);
    const [contractForm, setContractForm] = useState({
        customerTckn: "",
        customerAddress: "",
        vehicleBrand: "",
        vehicleModel: "",
        vehicleColor: "",
        vehicleEngineNo: "",
        vehicleChassisNo: "",
        vehiclePlate: "",
    });
    const [isSending, setIsSending] = useState(false);

    // History modal states
    const [showHistoryDialog, setShowHistoryDialog] = useState(false);
    const [historyData, setHistoryData] = useState<OfferHistory[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
    const historyItemsPerPage = 10;
    const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
    const [pendingVehicleId, setPendingVehicleId] = useState<number | null>(null);

    // Email input handler - sadece local state günceller, performanslı
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalEmail(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !updatingEmail) {
            e.preventDefault();
            handleUpdateEmail();
        }
    };

    // Dialog açıldığında local state'i sıfırla
    const openEmailDialog = () => {
        setLocalEmail("");
        setShowEmailUpdateDialog(true);
    };

    const {
        getOfferById,
        updateOffer,
        sendOffer,
        getOfferHistory,
        sendContract,
        getContractByOfferId,
        updateOfferStatusById,
    } = useOffers();
    const { products, isLoading: productsLoading } = useProducts();
    const { customers, isLoading: customersLoading, updateCustomer } = useCustomers();
    const { vehicles, isLoading: vehiclesLoading } = useVehicles();
    const { vehicleParts, isLoading: vehiclePartsLoading } = useVehicleParts(selectedVehicleId?.toString());
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

    // Teklif verilerini yükle
    useEffect(() => {
        const loadOffer = async () => {
            if (!offerId || isNaN(offerId)) return;

            try {
                setLoading(true);
                const offerData = await getOfferById(offerId);

                if (offerData) {
                    setOriginalOffer(offerData);
                    setOfferNumber(offerData.offer_number || "");
                    setValidUntil(offerData.valid_until ? offerData.valid_until.split("T")[0] : "");
                    setNotes(offerData.notes || "");
                    setSelectedCustomerId(offerData.customer_id || null);
                    setSelectedVehicleId(offerData.vehicle_id || null);

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
                                unit: (typedItem.productUnit as string) || "Adet", // Ürün birimini al
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
                console.error("Teklif yüklenemedi", error);
                toast.error("Teklif yüklenemedi", {
                    description: "Teklif bilgileri alınırken bir hata oluştu.",
                });
                router.push("/offer");
            } finally {
                setLoading(false);
            }
        };

        loadOffer();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [offerId]); // Sadece offerId yeterli - getOfferById ve router zaten stable

    // Araç parçalarını teklife ekleyen fonksiyon
    const addVehiclePartsToOffer = useCallback(
        (vehiclePartsData: VehiclePart[]) => {
            // Bu fonksiyon sadece parça ekleme işlemi yapar, kontrol useEffect'te yapılır

            // Araç parçalarını teklife ekle
            vehiclePartsData.forEach((vehiclePart: VehiclePart) => {
                if (vehiclePart.products && vehiclePart.products.length > 0) {
                    vehiclePart.products.forEach((product: Product) => {
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

                        // Araç parçasından gelen miktar
                        const vehiclePartQuantity = vehiclePart.quantities?.[product.id.toString()] || 1;

                        setOfferItems((prev) => {
                            // Aynı ürün zaten eklenmişse miktarını artır
                            const existingItemIndex = prev.findIndex((item) => item.productId === product.id);
                            if (existingItemIndex >= 0) {
                                const updated = [...prev];
                                // Mevcut miktara araç parçasından gelen miktarı ekle
                                updated[existingItemIndex].quantity += vehiclePartQuantity;
                                updated[existingItemIndex].totalPrice =
                                    updated[existingItemIndex].unitPrice * updated[existingItemIndex].quantity;
                                updated[existingItemIndex].totalPurchasePrice =
                                    updated[existingItemIndex].purchasePrice * updated[existingItemIndex].quantity;
                                return updated;
                            } else {
                                // Yeni ürün oluştur ve ekle
                                const newItem: OfferItem = {
                                    id: Date.now() + Math.random(),
                                    productId: product.id,
                                    name: product.name || "Ürün",
                                    description:
                                        product.description || product.code || product.name || "Ürün açıklaması",
                                    quantity: vehiclePartQuantity,
                                    unitPrice: unitPrice,
                                    totalPrice: unitPrice * vehiclePartQuantity,
                                    purchasePrice: purchasePrice,
                                    totalPurchasePrice: purchasePrice * vehiclePartQuantity,
                                    image: product.image || "/images/no-image-placeholder.svg",
                                    unit: product.unit || "Adet",
                                };
                                return [...prev, newItem];
                            }
                        });
                    });
                }
            });
        },
        [setOfferItems]
    );

    // Araç seçimi değiştiğinde çalışacak fonksiyon
    const handleVehicleSelect = useCallback(
        (vehicleId: number | null) => {
            const previousVehicleId = selectedVehicleId;
            setSelectedVehicleId(vehicleId);

            // Sadece yeni bir araç seçildiğinde parçaları eklemek için pending işlemi başlat
            if (vehicleId && vehicleId !== previousVehicleId) {
                setPendingVehicleId(vehicleId);
            }
        },
        [selectedVehicleId]
    );

    // vehicleParts güncellendiğinde pending işlemi kontrol et
    useEffect(() => {
        // Eğer pending yoksa veya loading yapılıyorsa bekle
        if (!pendingVehicleId || vehiclePartsLoading) return;

        // Seçili araç ile pending araç eşleşmeli
        if (selectedVehicleId !== pendingVehicleId) return;

        // Gerçek parça kontrolü: vehicleParts içinde products olan kayıt var mı?
        const hasProducts = vehicleParts.some((part) => part.products && part.products.length > 0);

        if (hasProducts) {
            // Parçalar bulundu, ekle
            addVehiclePartsToOffer(vehicleParts);
            toast.success("Araç parçaları teklife eklendi", {
                description: `${
                    vehicles.find((v) => v.id === pendingVehicleId)?.name
                } aracının parçaları teklif listesine eklendi.`,
            });
        } else {
            // Parça bulunamadı
            toast.info("Bu araç için parça bulunamadı", {
                description: "Seçilen araçta kayıtlı parça bulunmuyor.",
            });
        }

        // Pending işlemi tamamlandı
        setPendingVehicleId(null);
    }, [vehicleParts, vehiclePartsLoading, pendingVehicleId, selectedVehicleId, addVehiclePartsToOffer, vehicles]);

    const handleAddProduct = useCallback(
        (productId: number) => {
            const product = filteredProducts.find((p) => p.id === productId);
            if (!product) return;

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

            setOfferItems((prevItems) => {
                const existingItemIndex = prevItems.findIndex((item) => item.productId === product.id);

                if (existingItemIndex >= 0) {
                    const updatedItems = [...prevItems];
                    updatedItems[existingItemIndex].quantity += 1;
                    const unitPrice = updatedItems[existingItemIndex].unitPrice;
                    const purchasePrice = updatedItems[existingItemIndex].purchasePrice;
                    updatedItems[existingItemIndex].totalPrice = updatedItems[existingItemIndex].quantity * unitPrice;
                    updatedItems[existingItemIndex].totalPurchasePrice =
                        updatedItems[existingItemIndex].quantity * purchasePrice;
                    return updatedItems;
                } else {
                    const newItem: OfferItem = {
                        id: Date.now(),
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

                    return [...prevItems, newItem];
                }
            });

            setSelectedProductId(null);
            setOpen(false);
        },
        [filteredProducts]
    );

    const handleRemoveItem = useCallback(
        (index: number) => {
            const itemToRemove = offerItems[index];
            setItemToDelete({ index, name: itemToRemove.name, image: itemToRemove.image });
            setShowDeleteDialog(true);
        },
        [offerItems]
    );

    const confirmDeleteItem = useCallback(() => {
        if (itemToDelete) {
            setOfferItems((prevItems) => prevItems.filter((_, i) => i !== itemToDelete.index));
            toast.success("Ürün kaldırıldı", {
                description: `${itemToDelete.name} teklif listesinden kaldırıldı.`,
            });
        }
        setShowDeleteDialog(false);
        setItemToDelete(null);
    }, [itemToDelete]);

    const handleQuantityChange = useCallback(
        (index: number, newQuantity: number) => {
            if (newQuantity <= 0) {
                handleRemoveItem(index);
                return;
            }

            setOfferItems((prevItems) => {
                const updatedItems = [...prevItems];
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

                return updatedItems;
            });
        },
        [handleRemoveItem]
    );

    const handlePriceChange = useCallback((index: number, newPrice: number) => {
        if (newPrice < 0 || isNaN(newPrice)) return;

        setOfferItems((prevItems) => {
            const updatedItems = [...prevItems];
            updatedItems[index].unitPrice = newPrice;

            const quantity =
                typeof updatedItems[index].quantity === "number" && !isNaN(updatedItems[index].quantity)
                    ? updatedItems[index].quantity
                    : 0;

            updatedItems[index].totalPrice = quantity * newPrice;

            return updatedItems;
        });
    }, []);

    // Hesaplama fonksiyonlarını useMemo ile optimize et
    const grossTotal = useMemo(() => {
        return offerItems.reduce((total, item) => {
            const itemTotal = typeof item.totalPrice === "number" && !isNaN(item.totalPrice) ? item.totalPrice : 0;
            return total + itemTotal;
        }, 0);
    }, [offerItems]);

    const purchaseTotal = useMemo(() => {
        return offerItems.reduce((total, item) => {
            const itemTotal =
                typeof item.totalPurchasePrice === "number" && !isNaN(item.totalPurchasePrice)
                    ? item.totalPurchasePrice
                    : 0;
            return total + itemTotal;
        }, 0);
    }, [offerItems]);

    const discount = useMemo(() => {
        if (!discountType || discountValue <= 0) return 0;

        if (discountType === "percentage") {
            return (grossTotal * discountValue) / 100;
        } else {
            return Math.min(discountValue, grossTotal);
        }
    }, [discountType, discountValue, grossTotal]);

    const calculateItemDiscount = useMemo(() => {
        return (itemTotal: number, itemIndex?: number) => {
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

            if (grossTotal === 0) return 0;

            return (itemTotal / grossTotal) * discount;
        };
    }, [offerItems, discountType, discountMethod, discountValue, grossTotal, discount]);

    const netTotal = useMemo(() => {
        const discountAmount = discountMethod === "total" ? discount : 0;
        return grossTotal - discountAmount; // KDV hariç net toplam
    }, [grossTotal, discount, discountMethod]);

    const vatAmount = useMemo(() => {
        return netTotal * 0.2; // %20 KDV
    }, [netTotal]);

    const finalTotal = useMemo(() => {
        return netTotal + vatAmount; // KDV dahil genel toplam
    }, [netTotal, vatAmount]);

    // Backward compatibility için wrapper fonksiyonlar
    const calculateGrossTotal = () => grossTotal;
    const calculatePurchaseTotal = () => purchaseTotal;
    const calculateDiscount = () => discount;
    const calculateNetTotal = () => netTotal;
    const calculateVAT = () => vatAmount;
    const calculateFinalTotal = () => finalTotal;

    // Status durumlarına göre disable kontrolü
    const isCustomerVehicleEditable = originalOffer?.status === OfferStatus.TASLAK;
    const isProductEditable =
        originalOffer?.status === OfferStatus.TASLAK || originalOffer?.status === OfferStatus.REDDEDILDI;

    const handleValidUntilChange = useCallback((value: string) => {
        setValidUntil(value);
    }, []);

    const handleNotesChange = useCallback((value: string) => {
        setNotes(value);
    }, []);

    const handleDiscountTypeChange = useCallback((type: "percentage" | "amount") => {
        setDiscountType(type);
        setDiscountValue(0);
        setDiscountMethod("total");
    }, []);

    const handleDiscountValueChange = useCallback((value: number) => {
        setDiscountValue(value);
    }, []);

    // Memoized handlers - cache them properly to avoid recreation
    const quantityChangeHandlers = useMemo(() => {
        return offerItems.map((_, index) => (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = parseInt(e.target.value) || 0;
            handleQuantityChange(index, value);
        });
    }, [offerItems, handleQuantityChange]);

    const priceChangeHandlers = useMemo(() => {
        return offerItems.map((_, index) => (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = parseFloat(e.target.value) || 0;
            handlePriceChange(index, value);
        });
    }, [offerItems, handlePriceChange]);

    const quantityIncrementHandlers = useMemo(() => {
        return offerItems.map((item, index) => () => {
            handleQuantityChange(index, item.quantity + 1);
        });
    }, [offerItems, handleQuantityChange]);

    const quantityDecrementHandlers = useMemo(() => {
        return offerItems.map((item, index) => () => {
            handleQuantityChange(index, item.quantity - 1);
        });
    }, [offerItems, handleQuantityChange]);

    const removeItemHandlers = useMemo(() => {
        return offerItems.map((_, index) => () => handleRemoveItem(index));
    }, [offerItems, handleRemoveItem]);

    const imageErrorHandler = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const target = e.target as HTMLImageElement;
        target.src = "/images/no-image-placeholder.svg";
    }, []);

    // Memoize item discounts to prevent recalculation on every render
    const itemDiscounts = useMemo(() => {
        return offerItems.map((item, index) => calculateItemDiscount(item.totalPrice, index));
    }, [offerItems, calculateItemDiscount]);

    const handleUpdateOffer = async () => {
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
            subtotal: calculateGrossTotal(),
            discountType: discountType || undefined,
            discountValue: discountValue,
            discountAmount: calculateDiscount(),
            netTotal: calculateNetTotal(),
            vatRate: 20.0,
            vatAmount: calculateVAT(),
            totalAmount: calculateFinalTotal(),
            status: originalOffer?.status || OfferStatus.TASLAK,
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
            vehicleId: selectedVehicleId || undefined,
        };

        try {
            const result = await updateOffer(offerId, offerData);

            if (result) {
                toast.success("Teklif başarıyla güncellendi!", {
                    description: "Teklif bilgileri başarıyla güncellendi.",
                });
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

    const handleStatusUpdate = async (newStatus: OfferStatus) => {
        if (!originalOffer?.id) {
            toast.error("Teklif bulunamadı", {
                description: "Teklif bilgileri yüklenemedi",
            });
            return;
        }

        if (newStatus === originalOffer.status) {
            return;
        }

        // Eğer ÜRETIMDE durumu seçilirse modal'ı aç
        if (newStatus === OfferStatus.ÜRETIMDE) {
            setShowProductionModal(true);
            return;
        }

        try {
            setSaving(true);

            await updateOfferStatusById(originalOffer.id, newStatus);

            // Local state'i güncelle
            if (originalOffer) {
                originalOffer.status = newStatus;
            }

            toast.success("Durum başarıyla güncellendi!", {
                description: `Teklif durumu "${newStatus}" olarak güncellendi.`,
            });
        } catch (error) {
            console.error("Durum güncellenirken hata:", error);
            const errorMessage = error instanceof Error ? error.message : "Durum güncellenirken bir hata oluştu";
            toast.error("Durum güncellenemedi", {
                description: errorMessage,
            });
        } finally {
            setSaving(false);
        }
    };

    const handleSendToProduction = async (vehicleAcceptanceId: number) => {
        if (!originalOffer?.id) {
            toast.error("Teklif bulunamadı");
            return;
        }

        try {
            setSaving(true);

            // Teklif durumunu ÜRETIMDE olarak güncelle
            await updateOfferStatusById(originalOffer.id, OfferStatus.ÜRETIMDE);

            // Local state'i güncelle
            if (originalOffer) {
                originalOffer.status = OfferStatus.ÜRETIMDE;
            }

            toast.success("Teklif üretime gönderildi!", {
                description: `Teklif seçilen araç (ID: ${vehicleAcceptanceId}) ile üretime gönderildi.`,
            });
        } catch (error) {
            console.error("Üretime gönderme hatası:", error);
            const errorMessage = error instanceof Error ? error.message : "Üretime gönderilirken bir hata oluştu";
            toast.error("Üretime gönderilemedi", {
                description: errorMessage,
            });
            throw error; // Modal'da error handling için
        } finally {
            setSaving(false);
        }
    };

    const handleSendOffer = () => {
        // 1. Müşteri seçimi kontrolü
        if (!selectedCustomerId) {
            toast.error("👤 Müşteri Seçilmedi", {
                description: "Teklif göndermek için önce bir müşteri seçmeniz gerekiyor.",
            });
            return;
        }

        // 2. Ürün kontrolü
        if (offerItems.length === 0) {
            toast.error("📦 Ürün Eklenmedi", {
                description: "Teklif göndermek için en az bir ürün eklemeniz gerekiyor.",
            });
            return;
        }

        // 3. Müşteri email kontrol
        const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
        if (!selectedCustomer) {
            toast.error("⚠️ Müşteri Bulunamadı", {
                description: "Seçili müşteri sistemde bulunamadı. Lütfen farklı bir müşteri seçin.",
            });
            return;
        }

        if (selectedCustomer.email && selectedCustomer.email.trim()) {
            // Email varsa confirmation dialog'unu göster
            setShowSendConfirmDialog(true);
        } else {
            // Email yoksa direkt email güncelleme dialog'unu aç
            openEmailDialog();
        }
    };

    const confirmSendOffer = async () => {
        const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
        if (!selectedCustomer) {
            toast.error("⚠️ Müşteri Bulunamadı", {
                description: "Seçili müşteri sistemde bulunamadı. Lütfen farklı bir müşteri seçin.",
            });
            return;
        }

        try {
            setIsSending(true);

            // Önce teklifi güncelle
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
                status: OfferStatus.GONDERILDI, // Status'u güncelle
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
                vehicleId: selectedVehicleId || undefined,
            };

            // Teklifi güncelle
            await updateOffer(offerId, offerData);

            // Sonra gönder
            await sendOffer(offerId, pdfMode !== "detailed");

            toast.success("✅ Teklif Başarıyla Gönderildi", {
                description: `${selectedCustomer.name} adlı müşteriye teklif e-posta ile gönderildi`,
            });

            // İşlem başarılı, dialog'u kapat ve yönlendir
            setShowSendConfirmDialog(false);

            setTimeout(() => {
                router.push("/offer");
            }, 1000);
        } catch (error: unknown) {
            console.error("Teklif gönderilirken hata:", error);
            const errorMessage = error instanceof Error ? error.message : "Teklif gönderilirken bir hata oluştu";
            toast.error("❌ Teklif Gönderilemedi", {
                description: errorMessage,
            });
        } finally {
            setIsSending(false); // Loading state'ini sıfırla
        }
    };

    const handleUpdateEmailClick = () => {
        // Önce confirmation dialog'unu göster
        setShowEmailConfirmDialog(true);
    };

    const handleUpdateEmail = async () => {
        // Local email'i kullan
        const emailToUpdate = localEmail.trim();

        if (!selectedCustomerId || !emailToUpdate) {
            toast.error("⚠️ Email Gerekli", {
                description: "Lütfen geçerli bir email adresi girin",
            });
            return;
        }

        // Email format kontrolü
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailToUpdate)) {
            toast.error("❌ Geçersiz Email Formatı", {
                description: "Lütfen geçerli bir email formatı girin (örnek: kullanici@domain.com)",
            });
            return;
        }

        try {
            setUpdatingEmail(true);
            setShowEmailConfirmDialog(false);

            await updateCustomer(selectedCustomerId.toString(), { email: emailToUpdate });

            toast.success("📧 Email Başarıyla Güncellendi", {
                description: "Müşteri email adresi başarıyla güncellendi ve kaydedildi",
            });

            setShowEmailUpdateDialog(false);
            setLocalEmail("");

            // Email güncellendikten sonra teklifi gönder
            try {
                // Önce teklifi güncelle
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
                    status: OfferStatus.GONDERILDI,
                    validUntil: validUntil || undefined,
                    notes: notes || undefined,
                    items: offerItems.map((item, index) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.totalPrice,
                        discountAmount:
                            discountMethod === "distribute" ? calculateItemDiscount(item.totalPrice, index) : 0,
                        discountType: discountMethod === "distribute" ? discountType || undefined : undefined,
                        discountValue: discountMethod === "distribute" ? discountValue : 0,
                    })),
                };

                await updateOffer(offerId, offerData);
                await sendOffer(offerId, pdfMode !== "detailed");

                const updatedCustomer = customers.find((c) => c.id === selectedCustomerId);
                toast.success("✅ Teklif Başarıyla Gönderildi", {
                    description: `${updatedCustomer?.name} adlı müşteriye teklif e-posta ile gönderildi`,
                });

                // Teklif listesine yönlendir
                router.push("/offer");
            } catch (sendError) {
                console.error("Teklif gönderilirken hata:", sendError);
                toast.error("❌ Teklif Gönderilemedi", {
                    description: "Email güncellendi ancak teklif gönderilirken bir hata oluştu.",
                });
            }
        } catch (error) {
            console.error("Email güncellenirken hata:", error);
            toast.error("❌ Email Güncellenemedi", {
                description: "Email güncellenirken bir hata oluştu. Lütfen tekrar deneyin.",
            });
        } finally {
            setUpdatingEmail(false);
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
                    unit: item.unit, // Ürün birimini ekle
                };
            }),
            gross: calculateGrossTotal(),
            discount: calculateDiscount(),
            net: calculateNetTotal(),
            vat: calculateVAT(),
            total: calculateFinalTotal(),
            notes: notes,
            hidePricing: pdfMode !== "detailed",
            mode: pdfMode,
        };

        generateOfferPdf(offerData);
    };

    const handleShowHistory = async () => {
        setShowHistoryDialog(true);
        setHistoryLoading(true);
        setHistoryCurrentPage(1);

        try {
            const history = await getOfferHistory(offerId);
            setHistoryData(history);
        } catch (error) {
            console.error("İşlem geçmişi yüklenirken hata:", error);
            toast.error("❌ İşlem Geçmişi Yüklenemedi", {
                description: "İşlem geçmişi yüklenirken bir hata oluştu. Lütfen tekrar deneyin.",
            });
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleSendContract = async () => {
        try {
            setShowContractModal(true);

            // Contract verilerini al
            const contractData = await getContractByOfferId(offerId);

            if (contractData) {
                // Eğer data varsa form'u doldur
                setContractForm({
                    customerTckn: contractData.customer_tckn || "",
                    customerAddress: contractData.customer_address || "",
                    vehicleBrand: contractData.vehicle_brand || "",
                    vehicleModel: contractData.vehicle_model || "",
                    vehicleColor: contractData.vehicle_color || "",
                    vehicleEngineNo: contractData.vehicle_engine_no || "",
                    vehicleChassisNo: contractData.vehicle_chassis_no || "",
                    vehiclePlate: contractData.vehicle_plate || "",
                });
            }
        } catch (error) {
            console.error("Sözleşme verileri yüklenirken hata:", error);
            // Hata durumunda da modal'ı aç, form'u boş bırak
            // Kullanıcı manuel olarak doldurabilir
        }
    };

    const handleContractFormChange = (field: string, value: string) => {
        try {
            setContractForm((prev) => ({
                ...prev,
                [field]: value,
            }));
        } catch (error) {
            console.warn("Form güncelleme hatası:", error);
            // Hatayı sessizce yoksay, extension hatalarından etkilenmeyelim
        }
    };

    const handleContractFormSubmit = () => {
        // İlk modalı kapat, onay modalını aç
        setShowContractModal(false);
        setShowContractConfirmModal(true);
    };

    const handleContractConfirm = async () => {
        try {
            setIsSending(true);

            const contractData = {
                offerId: offerId,
                customerTckn: contractForm.customerTckn,
                customerAddress: contractForm.customerAddress,
                vehicleBrand: contractForm.vehicleBrand,
                vehicleModel: contractForm.vehicleModel,
                vehicleColor: contractForm.vehicleColor,
                vehicleEngineNo: contractForm.vehicleEngineNo,
                vehicleChassisNo: contractForm.vehicleChassisNo,
                vehiclePlate: contractForm.vehiclePlate,
            };

            await sendContract(contractData);
            toast.success("Sözleşme Başarıyla Gönderildi");
            setShowContractConfirmModal(false);
            // Form'u temizle
            setContractForm({
                customerTckn: "",
                customerAddress: "",
                vehicleBrand: "",
                vehicleModel: "",
                vehicleColor: "",
                vehicleEngineNo: "",
                vehicleChassisNo: "",
                vehiclePlate: "",
            });
        } catch (error) {
            console.error("Sözleşme gönderilirken hata:", error);
            toast.error("❌ Sözleşme Gönderilemedi", {
                description: "Sözleşme gönderilirken bir hata oluştu. Lütfen tekrar deneyin.",
            });
        } finally {
            setIsSending(false);
        }
    };

    const handleContractEdit = () => {
        // Onay modalını kapat, form modalını aç
        setShowContractConfirmModal(false);
        setShowContractModal(true);
    };

    const handleContractCancel = () => {
        // Her iki modalı da kapat ve form'u temizle
        setShowContractModal(false);
        setShowContractConfirmModal(false);
        setContractForm({
            customerTckn: "",
            customerAddress: "",
            vehicleBrand: "",
            vehicleModel: "",
            vehicleColor: "",
            vehicleEngineNo: "",
            vehicleChassisNo: "",
            vehiclePlate: "",
        });
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
                                    <BreadcrumbPage className="text-slate-900 font-medium">Teklif Detay</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 p-4">
                <div className="max-w-full mx-auto space-y-2">
                    {/* Page Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Teklif Detay</h1>
                        </div>
                    </div>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                        {/* Left Column - Main Content */}
                        <div className="xl:col-span-3 space-y-4">
                            {/* Teklif Bilgileri */}
                            <Card className="border-slate-200 shadow-sm">
                                <CardHeader className="pb-1">
                                    <CardTitle className="flex items-center justify-between text-lg font-semibold text-slate-900">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <FileText className="h-4 w-4 text-blue-600" />
                                            </div>
                                            Teklif Bilgileri
                                        </div>
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-md">
                                            <span className="text-blue-600 font-semibold">Teklif No:</span>
                                            <span className="text-slate-800 font-mono">{offerNumber}</span>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-slate-700">
                                                Müşteri Seçimi <span className="text-red-500">*</span>
                                            </label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        disabled={!isCustomerVehicleEditable}
                                                        className={`w-full justify-between h-9 text-left font-normal hover:bg-slate-50 ${
                                                            !selectedCustomerId
                                                                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                                                                : "border-slate-300"
                                                        } ${
                                                            !isCustomerVehicleEditable
                                                                ? "opacity-50 cursor-not-allowed"
                                                                : ""
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
                                                        disabled={!isCustomerVehicleEditable}
                                                        className={`w-full justify-between h-9 text-left font-normal border-slate-300 hover:bg-slate-50 ${
                                                            !isCustomerVehicleEditable
                                                                ? "opacity-50 cursor-not-allowed"
                                                                : ""
                                                        }`}
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
                                                                    onSelect={() => handleVehicleSelect(null)}
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
                                                                        onSelect={() => handleVehicleSelect(vehicle.id)}
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
                                                onChange={(e) => handleValidUntilChange(e.target.value)}
                                                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 h-9"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-slate-700">Notlar</label>
                                            <Input
                                                placeholder="Teklif notları..."
                                                value={notes}
                                                onChange={(e) => handleNotesChange(e.target.value)}
                                                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 h-9"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Ürün Ekleme Formu */}
                            <Card className="border-slate-200 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                            <Package className="h-4 w-4 text-green-600" />
                                        </div>
                                        Ürün Ekle
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <Popover open={open} onOpenChange={setOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={open}
                                                    disabled={!isProductEditable}
                                                    className={`w-full justify-between h-12 text-left font-normal border-slate-300 hover:bg-slate-50 ${
                                                        !isProductEditable ? "opacity-50 cursor-not-allowed" : ""
                                                    }`}
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
                                                                            onError={imageErrorHandler}
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
                                <CardHeader>
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
                                                                onError={imageErrorHandler}
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
                                                                    disabled={!isProductEditable}
                                                                    className={`h-8 w-8 p-0 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 flex-shrink-0 ${
                                                                        !isProductEditable
                                                                            ? "opacity-50 cursor-not-allowed"
                                                                            : ""
                                                                    }`}
                                                                    onClick={removeItemHandlers[index]}
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
                                                                            onClick={quantityDecrementHandlers[index]}
                                                                            disabled={isProductEditable}
                                                                        >
                                                                            <Minus className="h-3 w-3" />
                                                                        </Button>
                                                                        <Input
                                                                            type="number"
                                                                            value={item.quantity}
                                                                            onChange={quantityChangeHandlers[index]}
                                                                            className="w-16 h-8 text-center border-slate-300"
                                                                            min="1"
                                                                        />
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="h-8 w-8 p-0 border-slate-300"
                                                                            onClick={quantityIncrementHandlers[index]}
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
                                                                        onChange={priceChangeHandlers[index]}
                                                                        disabled={!isProductEditable}
                                                                        className={`w-24 h-8 border-slate-300 ${
                                                                            !isProductEditable
                                                                                ? "opacity-50 cursor-not-allowed"
                                                                                : ""
                                                                        }`}
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
                                                                    itemDiscounts[index] > 0 && (
                                                                        <div className="flex items-center justify-between pt-1">
                                                                            <span className="text-xs text-red-600">
                                                                                İndirim:
                                                                            </span>
                                                                            <span className="text-sm font-medium text-red-600">
                                                                                -€
                                                                                {formatNumber(itemDiscounts[index])}
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
                                                                        onError={imageErrorHandler}
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
                                                                            onClick={quantityDecrementHandlers[index]}
                                                                            disabled={!isProductEditable}
                                                                        >
                                                                            <Minus className="h-3 w-3" />
                                                                        </Button>
                                                                        <Input
                                                                            type="number"
                                                                            value={item.quantity}
                                                                            onChange={quantityChangeHandlers[index]}
                                                                            className="w-16 h-8 text-center border-slate-300"
                                                                            min="1"
                                                                            disabled={!isProductEditable}
                                                                        />
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="h-8 w-8 p-0 border-slate-300"
                                                                            onClick={quantityIncrementHandlers[index]}
                                                                            disabled={!isProductEditable}
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
                                                                    onChange={priceChangeHandlers[index]}
                                                                    className="w-28 border-slate-300"
                                                                    placeholder="0.00"
                                                                    disabled={!isProductEditable}
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
                                                                    {itemDiscounts[index] > 0 ? (
                                                                        <>
                                                                            -€
                                                                            {formatNumber(itemDiscounts[index])}
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
                                                                    onClick={removeItemHandlers[index]}
                                                                    disabled={!isProductEditable}
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
                                <div
                                    className={`${getCardBackgroundColor(
                                        originalOffer?.status || OfferStatus.TASLAK
                                    )} border rounded-lg p-4`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-8 h-8 ${getIconColor(
                                                    originalOffer?.status || OfferStatus.TASLAK
                                                )} rounded-lg flex items-center justify-center`}
                                            >
                                                <FileText className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900 text-sm">
                                                    Teklif İşlemleri
                                                </h3>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                className={`${getStatusColor(
                                                    originalOffer?.status || OfferStatus.TASLAK
                                                )} border-1 font-medium text-xs px-2 py-1`}
                                            >
                                                {originalOffer?.status || OfferStatus.TASLAK}
                                            </Badge>

                                            <TooltipProvider>
                                                <Popover>
                                                    <Tooltip delayDuration={0}>
                                                        <PopoverTrigger asChild>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 w-6 p-0 hover:bg-slate-100"
                                                                >
                                                                    <Pencil className="h-3 w-3 text-slate-600" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                        </PopoverTrigger>
                                                        <TooltipContent>
                                                            <p>Durum güncelle</p>
                                                        </TooltipContent>
                                                        <PopoverContent className="w-52 p-0" align="start">
                                                            <div className="p-3">
                                                                <h4 className="text-sm font-medium text-slate-900 mb-3">
                                                                    Durum Güncelle
                                                                </h4>
                                                                <div className="space-y-1">
                                                                    {Object.values(OfferStatus).map((status) => (
                                                                        <Button
                                                                            key={status}
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className={`w-full justify-start text-xs h-9 px-3 ${
                                                                                originalOffer?.status === status
                                                                                    ? "bg-blue-50 text-blue-900 border border-blue-200"
                                                                                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                                                            }`}
                                                                            onClick={() => handleStatusUpdate(status)}
                                                                        >
                                                                            <div className="flex items-center justify-between w-full">
                                                                                <div className="flex items-center">
                                                                                    <div
                                                                                        className={`w-3 h-3 rounded-full mr-3 shadow-sm ${getStatusDotColor(
                                                                                            status
                                                                                        )}`}
                                                                                    />
                                                                                    <span className="font-medium">
                                                                                        {status}
                                                                                    </span>
                                                                                </div>
                                                                                {originalOffer?.status === status && (
                                                                                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                                                                        <svg
                                                                                            className="w-2.5 h-2.5 text-white"
                                                                                            fill="currentColor"
                                                                                            viewBox="0 0 20 20"
                                                                                        >
                                                                                            <path
                                                                                                fillRule="evenodd"
                                                                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                                                clipRule="evenodd"
                                                                                            />
                                                                                        </svg>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </Button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </PopoverContent>
                                                    </Tooltip>
                                                </Popover>
                                            </TooltipProvider>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Primary Action - Save Changes */}
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="w-full text-white shadow-md border-0 h-10 font-medium"
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
                                                    <Save className="w-4 h-4" />
                                                    Değişiklikleri Kaydet
                                                </>
                                            )}
                                        </Button>

                                        {/* Communication Actions - Complementary Pair */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                variant="default"
                                                size="sm"
                                                className="h-10 font-medium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm transition-all duration-200 hover:shadow-md border-0"
                                                onClick={handleSendOffer}
                                                disabled={saving}
                                            >
                                                <Send className="w-4 h-4" />
                                                Teklifi Gönder
                                            </Button>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                className="h-10 font-medium bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-sm transition-all duration-200 hover:shadow-md border-0"
                                                onClick={handleSendContract}
                                            >
                                                <UserRoundPen className="w-4 h-4" />
                                                Sözleşme Gönder
                                            </Button>
                                        </div>

                                        {/* Secondary Actions */}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full h-10 font-medium border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all duration-200"
                                            onClick={handleShowHistory}
                                        >
                                            <History className="w-4 h-4" />
                                            İşlem Geçmişi
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
                                                            PDF Tipi
                                                        </span>
                                                        <p className="text-xs text-slate-500">
                                                            Detaylı, toplam veya yalnızca ürün adı
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                <Button
                                                    type="button"
                                                    variant={pdfMode === "detailed" ? "default" : "outline"}
                                                    size="sm"
                                                    className="h-9"
                                                    onClick={() => setPdfMode("detailed")}
                                                >
                                                    Detaylı
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={pdfMode === "summary" ? "default" : "outline"}
                                                    size="sm"
                                                    className="h-9"
                                                    onClick={() => setPdfMode("summary")}
                                                >
                                                    Miktar
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={pdfMode === "nameOnly" ? "default" : "outline"}
                                                    size="sm"
                                                    className="h-9"
                                                    onClick={() => setPdfMode("nameOnly")}
                                                >
                                                    Üretim
                                                </Button>
                                            </div>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 h-10 font-medium"
                                                onClick={handleViewPdf}
                                            >
                                                <FileText className="w-4 h-4" />
                                                PDF Görüntüle
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
                                                        onClick={() => handleDiscountTypeChange("percentage")}
                                                        className="flex-1 h-8 text-xs"
                                                    >
                                                        Yüzdesel (%)
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant={discountType === "amount" ? "default" : "outline"}
                                                        size="sm"
                                                        disabled={offerItems.length === 0}
                                                        onClick={() => handleDiscountTypeChange("amount")}
                                                        className="flex-1 h-8 text-xs"
                                                    >
                                                        Tutarsal (€)
                                                    </Button>
                                                </div>
                                            </div>

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
                                                            handleDiscountValueChange(parseFloat(e.target.value) || 0)
                                                        }
                                                        disabled={!isProductEditable}
                                                        className={`border-slate-300 focus:border-red-500 focus:ring-red-500 h-8 text-xs ${
                                                            !isProductEditable ? "opacity-50 cursor-not-allowed" : ""
                                                        }`}
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
                                                        disabled={!isProductEditable}
                                                        onClick={() => {
                                                            setDiscountType(null);
                                                            setDiscountValue(0);
                                                            setDiscountMethod(null);
                                                        }}
                                                        className={`h-7 text-xs text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 ${
                                                            !isProductEditable ? "opacity-50 cursor-not-allowed" : ""
                                                        }`}
                                                    >
                                                        İndirimi Kaldır
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Summary Card */}
                                <Card className="border-slate-200 shadow-sm">
                                    <CardHeader>
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
                                        onError={imageErrorHandler}
                                    />
                                </div>
                            )}
                            <div className="flex-1">
                                <AlertDialogTitle>
                                    {itemToDelete
                                        ? `"${itemToDelete.name}" ürününü kaldırmak istediğinize emin misiniz?`
                                        : "Hata"}
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

            <AlertDialog
                open={showEmailUpdateDialog}
                onOpenChange={(open) => {
                    setShowEmailUpdateDialog(open);
                    // localEmail'i sadece iptal butonuna basıldığında sıfırla
                    // confirmation dialog'u açılırken sıfırlama
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-semibold text-slate-900">
                            Müşteri Email Güncelle
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base text-slate-700 mt-2">
                            Teklifi göndermek için müşteri email adresini güncelleyin.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {selectedCustomerId && (
                        <div className="space-y-3 px-6">
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-amber-800">Müşteri Bilgisi</span>
                                </div>
                                <p className="text-lg font-semibold text-amber-900">
                                    {customers.find((c) => c.id === selectedCustomerId)?.name}
                                </p>
                            </div>
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-red-800">Email Durumu</span>
                                </div>
                                <p className="text-sm text-red-700">Bu müşterinin email adresi bulunmuyor</p>
                            </div>
                        </div>
                    )}
                    <div className="py-4 px-6">
                        <label className="text-sm font-medium text-slate-700 mb-2 block">
                            Email Adresi <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="email"
                            placeholder="ornek@email.com"
                            value={localEmail}
                            onChange={handleEmailChange}
                            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            disabled={updatingEmail}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => {
                                setShowEmailUpdateDialog(false);
                                setLocalEmail("");
                            }}
                            disabled={updatingEmail}
                        >
                            İptal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleUpdateEmailClick}
                            disabled={updatingEmail || !localEmail.trim()}
                        >
                            {updatingEmail ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Güncelleniyor...
                                </>
                            ) : (
                                "Email Güncelle"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Teklif Gönder Confirmation Dialog */}
            <Dialog
                open={showSendConfirmDialog}
                onOpenChange={(open) => {
                    // Loading sırasında dialog kapatılmasını engelle
                    if (!isSending) {
                        setShowSendConfirmDialog(open);
                    }
                }}
            >
                <DialogContent
                    className="max-w-md"
                    onPointerDownOutside={(e) => {
                        // Loading sırasında dialog dışına tıklanmasını engelle
                        if (isSending) {
                            e.preventDefault();
                        }
                    }}
                    onInteractOutside={(e) => {
                        // Loading sırasında dışarıdaki etkileşimleri engelle
                        if (isSending) {
                            e.preventDefault();
                        }
                    }}
                >
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-4 h-4 text-blue-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                    />
                                </svg>
                            </div>
                            Teklifi Gönder
                        </DialogTitle>
                        <DialogDescription className="text-base text-slate-700 mt-2">
                            Teklifi göndermeden önce bilgileri kontrol edin.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Müşteri Bilgisi */}
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-sm font-medium text-blue-800">Müşteri</span>
                            </div>
                            <p className="text-lg font-semibold text-blue-900">
                                {selectedCustomerId
                                    ? customers.find((c) => c.id === selectedCustomerId)?.name
                                    : "Müşteri seçilmedi"}
                            </p>
                        </div>

                        {/* Fiyat Özeti */}
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-sm font-medium text-green-800">Fiyat Özeti</span>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-green-700">Brüt Toplam:</span>
                                    <span className="font-medium text-green-900">
                                        €{formatNumber(calculateGrossTotal())}
                                    </span>
                                </div>
                                {calculateDiscount() > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-green-700">İndirim:</span>
                                        <span className="font-medium text-red-600">
                                            -€{formatNumber(calculateDiscount())}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-green-700">Net Toplam:</span>
                                    <span className="font-medium text-green-900">
                                        €{formatNumber(calculateNetTotal())}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-green-700">KDV (%20):</span>
                                    <span className="font-medium text-green-900">€{formatNumber(calculateVAT())}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-green-300">
                                    <span className="font-semibold text-green-800">Genel Toplam:</span>
                                    <span className="text-lg font-bold text-green-900">
                                        €{formatNumber(calculateFinalTotal())}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Ürün Sayısı */}
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">Toplam Ürün:</span>
                                <span className="font-medium text-slate-900">{offerItems.length} adet</span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowSendConfirmDialog(false)}
                            disabled={isSending}
                            className={isSending ? "opacity-50 cursor-not-allowed" : ""}
                        >
                            İptal
                        </Button>
                        <Button
                            onClick={confirmSendOffer}
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={isSending}
                        >
                            {isSending ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    <span>Gönderiliyor...</span>
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                        />
                                    </svg>
                                    Gönder
                                </div>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Email Güncelle Confirmation Dialog */}
            <AlertDialog open={showEmailConfirmDialog} onOpenChange={setShowEmailConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-4 h-4 text-amber-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                    />
                                </svg>
                            </div>
                            Email Güncelleme Onayı
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base text-slate-700 mt-2">
                            Bu işlem müşterinin email adresini kalıcı olarak güncelleyecektir. Emin misiniz?
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {selectedCustomerId && (
                        <div className="space-y-3 py-4">
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-amber-800">Müşteri</span>
                                </div>
                                <p className="text-lg font-semibold text-amber-900">
                                    {customers.find((c) => c.id === selectedCustomerId)?.name}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-blue-800">Yeni Email</span>
                                </div>
                                <p className="text-base font-medium text-blue-900">{localEmail}</p>
                            </div>
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowEmailConfirmDialog(false)}>İptal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleUpdateEmail} className="bg-amber-600 hover:bg-amber-700">
                            Email Güncelle
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* İşlem Geçmişi Modal */}
            <AlertDialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
                <AlertDialogContent className="w-[95vw] sm:w-[45vw] max-w-none sm:max-w-none max-h-[85vh] overflow-hidden">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <History className="w-4 h-4 text-blue-600" />
                            </div>
                            İşlem Geçmişi
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base text-slate-700">
                            Bu teklifin işlem geçmişini görüntüleyebilirsiniz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="flex-1 overflow-auto">
                        {historyLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>İşlem geçmişi yükleniyor...</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                {historyData.length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                                            <History className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <p className="text-slate-600">Henüz işlem geçmişi bulunmuyor.</p>
                                    </div>
                                ) : (
                                    <>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-1/2">Açıklama</TableHead>
                                                    <TableHead className="w-1/4">İşlemi Yapan</TableHead>
                                                    <TableHead className="w-1/4">Tarih</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {historyData
                                                    .slice(
                                                        (historyCurrentPage - 1) * historyItemsPerPage,
                                                        historyCurrentPage * historyItemsPerPage
                                                    )
                                                    .map((item, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell className="font-medium text-slate-900">
                                                                {item.description}
                                                            </TableCell>
                                                            <TableCell className="text-slate-700">
                                                                {item.created_by_name}
                                                            </TableCell>
                                                            <TableCell className="text-slate-600 font-mono text-sm">
                                                                {new Date(item.created_at).toLocaleString("tr-TR")}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                            </TableBody>
                                        </Table>

                                        {/* Pagination */}
                                        {historyData.length > historyItemsPerPage && (
                                            <div className="mt-4">
                                                <Pagination
                                                    currentPage={historyCurrentPage}
                                                    totalPages={Math.ceil(historyData.length / historyItemsPerPage)}
                                                    onPageChange={setHistoryCurrentPage}
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowHistoryDialog(false)}>Kapat</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Contract Modal */}
            <Dialog open={showContractModal} onOpenChange={setShowContractModal}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-gray-900">Sözleşme Bilgileri</DialogTitle>
                        <DialogDescription className="text-gray-600">
                            Sözleşme göndermek için aşağıdaki bilgileri doldurun.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        {/* Müşteri TCKN */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-gray-700">Müşteri TCKN *</label>
                            <Input
                                value={contractForm.customerTckn}
                                onChange={(e) => handleContractFormChange("customerTckn", e.target.value)}
                                maxLength={11}
                                className="w-full"
                                autoComplete="off"
                                spellCheck={false}
                            />
                        </div>

                        {/* Müşteri Adresi */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-gray-700">Müşteri Adresi *</label>
                            <textarea
                                value={contractForm.customerAddress}
                                onChange={(e) => handleContractFormChange("customerAddress", e.target.value)}
                                className="w-full min-h-[80px] px-3 py-2 border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                                rows={2}
                                autoComplete="off"
                                spellCheck={false}
                            />
                        </div>

                        {/* Araç Markası */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Araç Markası *</label>
                            <Input
                                value={contractForm.vehicleBrand}
                                onChange={(e) => handleContractFormChange("vehicleBrand", e.target.value)}
                                className="w-full"
                                autoComplete="off"
                                spellCheck={false}
                            />
                        </div>

                        {/* Araç Modeli */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Araç Modeli *</label>
                            <Input
                                value={contractForm.vehicleModel}
                                onChange={(e) => handleContractFormChange("vehicleModel", e.target.value)}
                                className="w-full"
                                autoComplete="off"
                                spellCheck={false}
                            />
                        </div>

                        {/* Araç Rengi */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Araç Rengi *</label>
                            <Input
                                value={contractForm.vehicleColor}
                                onChange={(e) => handleContractFormChange("vehicleColor", e.target.value)}
                                className="w-full"
                                autoComplete="off"
                                spellCheck={false}
                            />
                        </div>

                        {/* Motor Numarası */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Motor Numarası *</label>
                            <Input
                                value={contractForm.vehicleEngineNo}
                                onChange={(e) => handleContractFormChange("vehicleEngineNo", e.target.value)}
                                className="w-full"
                                autoComplete="off"
                                spellCheck={false}
                            />
                        </div>

                        {/* Şasi Numarası */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Şasi Numarası *</label>
                            <Input
                                value={contractForm.vehicleChassisNo}
                                onChange={(e) => handleContractFormChange("vehicleChassisNo", e.target.value)}
                                className="w-full"
                                autoComplete="off"
                                spellCheck={false}
                            />
                        </div>

                        {/* Plaka */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Plaka *</label>
                            <Input
                                value={contractForm.vehiclePlate}
                                onChange={(e) => handleContractFormChange("vehiclePlate", e.target.value)}
                                className="w-full"
                                autoComplete="off"
                                spellCheck={false}
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowContractModal(false);
                                setContractForm({
                                    customerTckn: "",
                                    customerAddress: "",
                                    vehicleBrand: "",
                                    vehicleModel: "",
                                    vehicleColor: "",
                                    vehicleEngineNo: "",
                                    vehicleChassisNo: "",
                                    vehiclePlate: "",
                                });
                            }}
                        >
                            İptal
                        </Button>
                        <Button
                            onClick={handleContractFormSubmit}
                            disabled={
                                !contractForm.customerTckn ||
                                !contractForm.customerAddress ||
                                !contractForm.vehicleBrand ||
                                !contractForm.vehicleModel ||
                                !contractForm.vehicleColor ||
                                !contractForm.vehicleEngineNo ||
                                !contractForm.vehicleChassisNo ||
                                !contractForm.vehiclePlate
                            }
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            Devam Et
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Contract Confirmation Modal */}
            <Dialog open={showContractConfirmModal} onOpenChange={setShowContractConfirmModal}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-gray-900">
                            Sözleşme Bilgileri Onayı
                        </DialogTitle>
                        <DialogDescription className="text-gray-600">
                            Lütfen girilen bilgileri kontrol edin ve onaylayın.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Müşteri TCKN */}
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium text-gray-700">Müşteri TCKN</label>
                                <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md">
                                    <span className="text-gray-900">{contractForm.customerTckn}</span>
                                </div>
                            </div>

                            {/* Müşteri Adresi */}
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium text-gray-700">Müşteri Adresi</label>
                                <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md min-h-[80px]">
                                    <span className="text-gray-900 whitespace-pre-wrap">
                                        {contractForm.customerAddress}
                                    </span>
                                </div>
                            </div>

                            {/* Araç Markası */}
                            <div>
                                <label className="text-sm font-medium text-gray-700">Araç Markası</label>
                                <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md">
                                    <span className="text-gray-900">{contractForm.vehicleBrand}</span>
                                </div>
                            </div>

                            {/* Araç Modeli */}
                            <div>
                                <label className="text-sm font-medium text-gray-700">Araç Modeli</label>
                                <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md">
                                    <span className="text-gray-900">{contractForm.vehicleModel}</span>
                                </div>
                            </div>

                            {/* Araç Rengi */}
                            <div>
                                <label className="text-sm font-medium text-gray-700">Araç Rengi</label>
                                <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md">
                                    <span className="text-gray-900">{contractForm.vehicleColor}</span>
                                </div>
                            </div>

                            {/* Motor Numarası */}
                            <div>
                                <label className="text-sm font-medium text-gray-700">Motor Numarası</label>
                                <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md">
                                    <span className="text-gray-900">{contractForm.vehicleEngineNo}</span>
                                </div>
                            </div>

                            {/* Şasi Numarası */}
                            <div>
                                <label className="text-sm font-medium text-gray-700">Şasi Numarası</label>
                                <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md">
                                    <span className="text-gray-900">{contractForm.vehicleChassisNo}</span>
                                </div>
                            </div>

                            {/* Plaka */}
                            <div>
                                <label className="text-sm font-medium text-gray-700">Plaka</label>
                                <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md">
                                    <span className="text-gray-900">{contractForm.vehiclePlate}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={handleContractCancel} disabled={isSending}>
                            İptal
                        </Button>
                        <Button variant="outline" onClick={handleContractEdit} disabled={isSending}>
                            Bilgileri Düzenle
                        </Button>
                        <Button
                            onClick={handleContractConfirm}
                            disabled={isSending}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isSending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {isSending ? "Gönderiliyor..." : "Onayla ve Gönder"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Production Send Modal */}
            <ProductionSendModal
                isOpen={showProductionModal}
                onClose={() => setShowProductionModal(false)}
                onSendToProduction={handleSendToProduction}
                offerId={originalOffer?.id}
            />
        </div>
    );
}
