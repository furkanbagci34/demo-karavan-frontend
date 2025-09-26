"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    Car,
    FileText,
    Wrench,
    MapPin,
    Play,
    AlertCircle,
    Loader2,
    Pause,
    Trash2,
    Square,
    Pencil,
    GripVertical,
    X,
    MessageSquare,
} from "lucide-react";
import { useVehicles } from "@/hooks/api/useVehicles";
import { useProductionTemplates } from "@/hooks/api/useProductionTemplates";
import { useOffers } from "@/hooks/api/useOffers";
import { useVehicleAcceptance } from "@/hooks/api/useVehicleAcceptance";
import { useCustomers } from "@/hooks/api/useCustomers";
import { useProductionExecution } from "@/hooks/api/useProductionExecution";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Check, ChevronsUpDown } from "lucide-react";

interface VehicleInfo {
    vehicleId: number | null;
    vehicleName: string;
    vehicleBrand: string;
    offerId: number | null;
    offerNumber: string;
    customerId: number | null;
    customerName: string;
    plateNumber: string;
    vehicleAcceptanceId: number | null;
}

interface SelectedTemplate {
    id: number;
    name: string;
    vehicle_name: string;
    stations: Array<{
        id: number;
        station_name: string;
        sort_order: number;
        operations: Array<{
            id: number;
            operation_name: string;
            quality_control: boolean;
            sort_order: number;
            operation_id: number;
        }>;
    }>;
}

interface EditableOperation {
    id: string; // Unique ID for React keys (could be temporary for new operations)
    stationId: number;
    operationId: number;
    originalOperationId?: number; // operations tablosundaki gerçek operation ID
    operationName: string;
    stationName: string;
    sortOrder: number;
    targetDuration?: number;
    qualityControl: boolean;
    isNew?: boolean; // For tracking newly added operations
}

export default function ProductionExecutionPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>({
        vehicleId: null,
        vehicleName: "",
        vehicleBrand: "",
        offerId: null,
        offerNumber: "",
        customerId: null,
        customerName: "",
        plateNumber: "",
        vehicleAcceptanceId: null,
    });

    const [description, setDescription] = useState<string>("");

    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<SelectedTemplate | null>(null);
    const [productionStatus, setProductionStatus] = useState<"idle" | "running" | "paused">("idle");
    const [currentExecutionId, setCurrentExecutionId] = useState<number | null>(null);

    // Operasyon düzenleme state'leri
    const [editableOperations, setEditableOperations] = useState<EditableOperation[]>([]);
    const [isEditingOperations, setIsEditingOperations] = useState(false);
    const [draggedOperationId, setDraggedOperationId] = useState<string | null>(null);

    // Combobox state'leri
    const [openOfferCombobox, setOpenOfferCombobox] = useState(false);
    const [openCustomerCombobox, setOpenCustomerCombobox] = useState(false);
    const [openPlateCombobox, setOpenPlateCombobox] = useState(false);

    // API hooks
    const { vehicles, isLoading: vehiclesLoading } = useVehicles();
    const { get: productionTemplatesQuery, useProductionTemplateById } = useProductionTemplates();
    const { getAllOffers, loading: offersLoading } = useOffers();
    const { vehicleAcceptances, isLoading: vehicleAcceptancesLoading } = useVehicleAcceptance();
    const { customers, isLoading: customersLoading } = useCustomers();
    const { create: createProductionExecution } = useProductionExecution();

    const productionTemplates = productionTemplatesQuery.data || [];

    // Offers ve vehicle acceptances verilerini yükle
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [offers, setOffers] = useState<any[]>([]);

    useEffect(() => {
        const loadOffers = async () => {
            try {
                const offersData = await getAllOffers();
                setOffers(offersData || []);
            } catch (error) {
                console.error("Teklifler yüklenirken hata:", error);
            }
        };
        loadOffers();
    }, [getAllOffers]);

    // Seçilen template'i yükle
    const { data: templateData, isLoading: templateLoading } = useProductionTemplateById(selectedTemplateId);

    // Template verisi değiştiğinde selectedTemplate'i güncelle
    useEffect(() => {
        if (templateData) {
            setSelectedTemplate(templateData as SelectedTemplate);
        } else if (selectedTemplateId === null) {
            setSelectedTemplate(null);
        }
    }, [templateData, selectedTemplateId]);

    // Template değiştiğinde editableOperations'ı güncelle
    useEffect(() => {
        if (selectedTemplate) {
            const operations: EditableOperation[] = [];
            selectedTemplate.stations?.forEach((station) => {
                station.operations?.forEach((operation) => {
                    operations.push({
                        id: `${station.id}-${operation.id}`,
                        stationId: station.id,
                        operationId: operation.id, // Bu template operation ID'si
                        originalOperationId: operation.operation_id, // Bu gerçek operations tablosundaki ID
                        operationName: operation.operation_name,
                        stationName: station.station_name,
                        sortOrder: operation.sort_order,
                        qualityControl: operation.quality_control,
                        isNew: false,
                    });
                });
            });
            // Sort order'a göre sırala
            operations.sort((a, b) => a.sortOrder - b.sortOrder);
            setEditableOperations(operations);
        } else {
            setEditableOperations([]);
        }
    }, [selectedTemplate]);

    // Araç seçildiğinde bilgileri güncelle
    const handleVehicleSelect = useCallback(
        (vehicleId: string) => {
            const vehicle = vehicles.find((v) => v.id === parseInt(vehicleId));
            if (vehicle) {
                setVehicleInfo((prev) => ({
                    ...prev,
                    vehicleId: vehicle.id,
                    vehicleName: vehicle.name,
                    vehicleBrand: vehicle.brand_model || "",
                }));

                // Araç seçildiğinde o araca ait template'lar varsa ilkini otomatik seç
                const availableTemplates = productionTemplates?.filter((t) => t.vehicle_id === vehicle.id) || [];
                if (availableTemplates.length > 0) {
                    const firstTemplate = availableTemplates[0];
                    setSelectedTemplateId(firstTemplate.id);
                    toast.success("Araç ve üretim şablonu otomatik seçildi", {
                        description: `${vehicle.name} için ${firstTemplate.name} şablonu seçildi.`,
                    });
                }
            }
        },
        [vehicles, productionTemplates]
    );

    // URL parametrelerinden gelen verilerle state'leri doldur
    useEffect(() => {
        const offerId = searchParams.get("offerId");
        const vehicleAcceptanceId = searchParams.get("vehicleAcceptanceId");
        const vehicleId = searchParams.get("vehicleId");
        const urlDescription = searchParams.get("description");

        if (urlDescription) {
            setDescription(urlDescription);
        }

        if (offerId) {
            setVehicleInfo((prev) => ({
                ...prev,
                offerId: offerId ? parseInt(offerId) : null,
            }));
        }

        if (vehicleId && vehicles.length > 0) {
            const vehicle = vehicles.find((v) => v.id === parseInt(vehicleId));
            if (vehicle) {
                setVehicleInfo((prev) => ({
                    ...prev,
                    vehicleId: vehicle.id,
                    vehicleName: vehicle.name,
                    vehicleBrand: vehicle.brand_model || "",
                    vehicleAcceptanceId: vehicleAcceptanceId ? parseInt(vehicleAcceptanceId) : null,
                    offerId: offerId ? parseInt(offerId) : null,
                }));

                // Vehicle selection event'ini tetikle
                handleVehicleSelect(vehicleId);
            }
        }
    }, [searchParams, vehicles, vehicleAcceptances, handleVehicleSelect]);

    // URL'den gelen offerId varsa ve teklif verileri yüklendiyse, teklif numarasını ve müşteriyi otomatik doldur
    useEffect(() => {
        if (!vehicleInfo.offerId) return;
        if (!offers || offers.length === 0) return;

        const matchedOffer = offers.find((o) => o.id === vehicleInfo.offerId);
        if (matchedOffer) {
            setVehicleInfo((prev) => ({
                ...prev,
                offerNumber: matchedOffer.offer_number || prev.offerNumber,
                customerId: matchedOffer.customer_id ?? prev.customerId,
                customerName: matchedOffer.customer_name ?? prev.customerName,
            }));
        }
    }, [vehicleInfo.offerId, offers]);

    // URL'den gelen vehicleAcceptanceId varsa ve kabul listesi yüklendiyse, plaka numarasını otomatik doldur
    useEffect(() => {
        if (!vehicleInfo.vehicleAcceptanceId) return;
        if (!vehicleAcceptances || vehicleAcceptances.length === 0) return;

        const matchedAcceptance = vehicleAcceptances.find((va) => va.id === vehicleInfo.vehicleAcceptanceId);
        if (matchedAcceptance) {
            setVehicleInfo((prev) => ({
                ...prev,
                plateNumber: matchedAcceptance.plate_number || prev.plateNumber,
            }));
        }
    }, [vehicleInfo.vehicleAcceptanceId, vehicleAcceptances]);

    // Üretim şablonu seçildiğinde
    const handleTemplateSelect = (templateId: string) => {
        const template = productionTemplates.find((t) => t.id === parseInt(templateId));
        if (template) {
            setSelectedTemplateId(template.id);
        }
    };

    // Üretimi başlat
    const handleStartProduction = async () => {
        if (!vehicleInfo.vehicleId) {
            toast.error("Lütfen bir model seçin");
            return;
        }

        if (!selectedTemplate) {
            toast.error("Lütfen bir üretim şablonu seçin");
            return;
        }

        try {
            // Düzenlenmiş operasyonları backend formatına dönüştür
            const operations = editableOperations.map((op, index) => ({
                stationId: op.stationId,
                operationId: op.operationId, // Template operation ID
                originalOperationId: op.originalOperationId || op.operationId, // operations tablosundaki gerçek ID
                sortOrder: index + 1, // Yeni sıra numarası
                targetDuration: op.targetDuration,
                qualityControl: op.qualityControl,
            }));

            // Backend'e gönderilecek veri
            const productionExecutionData = {
                productionPlanId: selectedTemplate.id,
                offerId: vehicleInfo.offerId || undefined,
                customerId: vehicleInfo.customerId || undefined,
                vehicleAcceptanceId: vehicleInfo.vehicleAcceptanceId || undefined,
                status: "running" as const,
                description: description || undefined,
                operations: operations,
            };

            await createProductionExecution.mutateAsync(productionExecutionData);

            setTimeout(() => {
                router.push("/production-execution");
            }, 500);
        } catch (error) {
            console.error("Üretim başlatma hatası:", error);
            toast.error("Üretim başlatma hatası");
        }
    };

    // Üretimi durdur
    const handlePauseProduction = async () => {
        if (!currentExecutionId) return;

        try {
            // TODO: Update işlemi kaldırıldı, gerekirse tekrar eklenebilir
            setProductionStatus("paused");
            toast.info("Üretim duraklatıldı");
        } catch (error) {
            console.error("Üretim duraklatma hatası:", error);
        }
    };

    // Üretimi durdur (tamamen)
    const handleStopProduction = async () => {
        if (!currentExecutionId) return;

        try {
            // TODO: Update işlemi kaldırıldı, gerekirse tekrar eklenebilir
            setProductionStatus("idle");
            setCurrentExecutionId(null);
            toast.info("Üretim durduruldu");
        } catch (error) {
            console.error("Üretim durdurma hatası:", error);
        }
    };

    // Üretim planını sil/temizle
    const handleClearProduction = () => {
        setVehicleInfo({
            vehicleId: null,
            vehicleName: "",
            vehicleBrand: "",
            offerId: null,
            offerNumber: "",
            customerId: null,
            customerName: "",
            plateNumber: "",
            vehicleAcceptanceId: null,
        });
        setDescription("");
        setSelectedTemplateId(null);
        setProductionStatus("idle");
        setCurrentExecutionId(null);
        // Combobox'ları kapat
        setOpenOfferCombobox(false);
        setOpenCustomerCombobox(false);
        setOpenPlateCombobox(false);
        toast.success("Üretim planı temizlendi", {
            description: "Tüm alanlar sıfırlandı.",
        });
    };

    // Operasyon düzenleme fonksiyonları
    const handleEditOperationsToggle = () => {
        setIsEditingOperations(!isEditingOperations);
    };

    const handleMoveOperation = (fromIndex: number, toIndex: number) => {
        const newOperations = [...editableOperations];
        const [removed] = newOperations.splice(fromIndex, 1);
        newOperations.splice(toIndex, 0, removed);
        setEditableOperations(newOperations);
    };

    // Drag and Drop fonksiyonları
    const handleDragStart = (e: React.DragEvent, operationId: string) => {
        e.dataTransfer.setData("text/plain", operationId);
        e.dataTransfer.effectAllowed = "move";
        setDraggedOperationId(operationId);
    };

    const handleDragEnd = () => {
        setDraggedOperationId(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, targetOperationId: string) => {
        e.preventDefault();
        const draggedOperationId = e.dataTransfer.getData("text/plain");

        if (draggedOperationId === targetOperationId) {
            setDraggedOperationId(null);
            return;
        }

        const draggedIndex = editableOperations.findIndex((op) => op.id === draggedOperationId);
        const targetIndex = editableOperations.findIndex((op) => op.id === targetOperationId);

        if (draggedIndex !== -1 && targetIndex !== -1) {
            handleMoveOperation(draggedIndex, targetIndex);
        }

        setDraggedOperationId(null);
    };

    const handleDeleteOperation = (index: number) => {
        const newOperations = editableOperations.filter((_, i) => i !== index);
        setEditableOperations(newOperations);
    };

    // Filtrelenmiş şablonlar - seçilen araca göre
    const filteredTemplates = vehicleInfo.vehicleId
        ? productionTemplates.filter((template) => template.vehicle_id === vehicleInfo.vehicleId)
        : [];

    // Benzersiz veriler için helper'lar
    const uniqueOfferNumbers = [...new Set(offers.map((offer) => offer.offer_number))].filter(Boolean);
    const uniquePlateNumbers = [...new Set(vehicleAcceptances.map((acc) => acc.plate_number))].filter(Boolean);

    const isLoading =
        vehiclesLoading ||
        productionTemplatesQuery.isLoading ||
        offersLoading ||
        vehicleAcceptancesLoading ||
        customersLoading;

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
                                <BreadcrumbPage>Üretim Planı</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                {/* Başlık ve Aksiyon Butonları */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <Play className="h-6 w-6 text-blue-600" />
                        Üretim Planı Oluştur
                        {productionStatus !== "idle" && (
                            <Badge
                                variant={productionStatus === "running" ? "default" : "secondary"}
                                className={`ml-2 ${
                                    productionStatus === "running"
                                        ? "bg-green-100 text-green-800 border-green-300"
                                        : "bg-yellow-100 text-yellow-800 border-yellow-300"
                                }`}
                            >
                                {productionStatus === "running" ? "Aktif" : "Duraklatıldı"}
                            </Badge>
                        )}
                    </h1>

                    {/* Aksiyon Butonları */}
                    <div className="flex items-center gap-2">
                        {productionStatus === "idle" ? (
                            <Button
                                onClick={handleStartProduction}
                                disabled={
                                    !vehicleInfo.vehicleId || !selectedTemplate || createProductionExecution.isPending
                                }
                                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                            >
                                {createProductionExecution.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Başlatılıyor...
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-4 w-4 mr-2" />
                                        Başlat
                                    </>
                                )}
                            </Button>
                        ) : (
                            <>
                                {productionStatus === "running" ? (
                                    <Button
                                        onClick={handlePauseProduction}
                                        variant="outline"
                                        className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                                    >
                                        <Pause className="h-4 w-4 mr-2" />
                                        Duraklat
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleStartProduction}
                                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                                    >
                                        <Play className="h-4 w-4 mr-2" />
                                        Devam Et
                                    </Button>
                                )}

                                <Button
                                    onClick={handleStopProduction}
                                    variant="outline"
                                    className="border-red-300 text-red-700 hover:bg-red-50"
                                >
                                    <Square className="h-4 w-4 mr-2" />
                                    Durdur
                                </Button>
                            </>
                        )}

                        <Button
                            onClick={handleClearProduction}
                            variant="outline"
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Temizle
                        </Button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                        <div className="flex items-center gap-2">
                            <Loader2 className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
                            Yükleniyor...
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Üst Kısım - Model ve Şablon Seçimi */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Car className="h-5 w-5" />
                                    Model ve Şablon Seçimi
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Model ve Şablon Seçimi - Yan Yana Uzun */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Model Seçimi */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <Label htmlFor="vehicle" className="text-sm font-medium whitespace-nowrap">
                                                Model Seçimi
                                            </Label>
                                            <Select
                                                onValueChange={handleVehicleSelect}
                                                value={vehicleInfo.vehicleId?.toString() || ""}
                                            >
                                                <SelectTrigger className="h-12 flex-1">
                                                    <SelectValue placeholder="Model seçiniz" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {vehicles.map((vehicle) => (
                                                        <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                                                            <div className="flex items-center gap-3 w-full">
                                                                <div className="w-8 h-8 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                                                                    {vehicle.image ? (
                                                                        <img
                                                                            src={vehicle.image}
                                                                            alt={vehicle.name}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <Car className="w-4 h-4 text-gray-400" />
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">{vehicle.name}</span>
                                                                    {vehicle.brand_model && (
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {vehicle.brand_model}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Şablon Seçimi */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <Label className="text-sm font-medium whitespace-nowrap">
                                                Üretim Şablonu
                                            </Label>
                                            <Select
                                                onValueChange={handleTemplateSelect}
                                                value={selectedTemplateId?.toString() || ""}
                                                disabled={!vehicleInfo.vehicleId}
                                            >
                                                <SelectTrigger className="h-12 flex-1">
                                                    <SelectValue
                                                        placeholder={
                                                            vehicleInfo.vehicleId
                                                                ? "Üretim şablonu seçin"
                                                                : "Önce model seçin"
                                                        }
                                                    />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {filteredTemplates.map((template) => (
                                                        <SelectItem key={template.id} value={template.id.toString()}>
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="w-4 h-4" />
                                                                <span>{template.name}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {vehicleInfo.vehicleId && filteredTemplates.length === 0 && (
                                            <p className="text-sm text-amber-600 flex items-center gap-1">
                                                <AlertCircle className="w-4 h-4" />
                                                Bu model için henüz üretim şablonu bulunmuyor
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Açıklama Alanı - Altında */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <Label
                                            htmlFor="description"
                                            className="text-sm font-medium flex items-center gap-2 whitespace-nowrap"
                                        >
                                            <MessageSquare className="h-4 w-4" />
                                            Açıklama
                                        </Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Üretim planı hakkında notlar yazabilirsiniz..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="min-h-[60px] resize-none text-sm flex-1"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Orta Kısım - Teklif ve Müşteri Bilgileri */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Teklif ve Müşteri Bilgileri
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {/* Teklif Numarası Combobox */}
                                    <div className="space-y-2">
                                        <Label htmlFor="offerNumber">Teklif Numarası</Label>
                                        <Popover open={openOfferCombobox} onOpenChange={setOpenOfferCombobox}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openOfferCombobox}
                                                    className="w-full justify-between"
                                                >
                                                    {vehicleInfo.offerNumber || "Teklif numarası seçin veya yazın..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full p-0">
                                                <Command>
                                                    <CommandInput
                                                        placeholder="Teklif numarası ara veya yaz..."
                                                        value={vehicleInfo.offerNumber}
                                                        onValueChange={(value) => {
                                                            // Manuel yazarken de otomatik müşteri doldurma
                                                            const matchingOffer = offers.find(
                                                                (offer) => offer.offer_number === value
                                                            );

                                                            setVehicleInfo((prev) => ({
                                                                ...prev,
                                                                offerId: matchingOffer?.id || null,
                                                                offerNumber: value,
                                                                // Eşleşen teklif varsa müşteriyi otomatik doldur
                                                                customerId:
                                                                    matchingOffer?.customer_id || prev.customerId,
                                                                customerName:
                                                                    matchingOffer?.customer_name || prev.customerName,
                                                            }));
                                                        }}
                                                    />
                                                    <CommandEmpty>
                                                        <div className="p-2">
                                                            <p className="text-sm text-muted-foreground mb-2">
                                                                Eşleşen teklif bulunamadı
                                                            </p>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => setOpenOfferCombobox(false)}
                                                                className="w-full"
                                                            >
                                                                {vehicleInfo.offerNumber} olarak kullan
                                                            </Button>
                                                        </div>
                                                    </CommandEmpty>
                                                    <CommandList>
                                                        <CommandGroup>
                                                            {uniqueOfferNumbers.map((offerNumber) => {
                                                                const offerData = offers.find(
                                                                    (offer) => offer.offer_number === offerNumber
                                                                );
                                                                return (
                                                                    <CommandItem
                                                                        key={offerNumber}
                                                                        value={offerNumber}
                                                                        onSelect={(value) => {
                                                                            // Seçilen teklifin müşteri bilgisini bul
                                                                            const selectedOffer = offers.find(
                                                                                (offer) => offer.offer_number === value
                                                                            );

                                                                            setVehicleInfo((prev) => ({
                                                                                ...prev,
                                                                                offerId: selectedOffer?.id || null,
                                                                                offerNumber: value,
                                                                                // Eğer teklifte müşteri varsa otomatik doldur
                                                                                customerId:
                                                                                    selectedOffer?.customer_id ||
                                                                                    prev.customerId,
                                                                                customerName:
                                                                                    selectedOffer?.customer_name ||
                                                                                    prev.customerName,
                                                                            }));
                                                                            setOpenOfferCombobox(false);
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={`mr-2 h-4 w-4 ${
                                                                                vehicleInfo.offerNumber === offerNumber
                                                                                    ? "opacity-100"
                                                                                    : "opacity-0"
                                                                            }`}
                                                                        />
                                                                        <div className="flex flex-col">
                                                                            <span className="font-medium">
                                                                                {offerNumber}
                                                                            </span>
                                                                            {offerData?.customer_name && (
                                                                                <span className="text-xs text-muted-foreground">
                                                                                    {offerData.customer_name}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </CommandItem>
                                                                );
                                                            })}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* Müşteri Adı Combobox */}
                                    <div className="space-y-2">
                                        <Label htmlFor="customerName">Müşteri Adı</Label>
                                        <Popover open={openCustomerCombobox} onOpenChange={setOpenCustomerCombobox}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openCustomerCombobox}
                                                    className="w-full justify-between"
                                                >
                                                    {vehicleInfo.customerName || "Müşteri adı seçin veya yazın..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full p-0">
                                                <Command>
                                                    <CommandInput
                                                        placeholder="Müşteri adı ara veya yaz..."
                                                        value={vehicleInfo.customerName}
                                                        onValueChange={(value) =>
                                                            setVehicleInfo((prev) => ({ ...prev, customerName: value }))
                                                        }
                                                    />
                                                    <CommandEmpty>
                                                        <div className="p-2">
                                                            <p className="text-sm text-muted-foreground mb-2">
                                                                Eşleşen müşteri bulunamadı
                                                            </p>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => setOpenCustomerCombobox(false)}
                                                                className="w-full"
                                                            >
                                                                {vehicleInfo.customerName} olarak kullan
                                                            </Button>
                                                        </div>
                                                    </CommandEmpty>
                                                    <CommandList>
                                                        <CommandGroup>
                                                            {customers.map((customer) => (
                                                                <CommandItem
                                                                    key={customer.id}
                                                                    value={customer.name}
                                                                    onSelect={(value) => {
                                                                        const selectedCustomer = customers.find(
                                                                            (c) => c.name === value
                                                                        );
                                                                        setVehicleInfo((prev) => ({
                                                                            ...prev,
                                                                            customerId: selectedCustomer?.id || null,
                                                                            customerName: value,
                                                                        }));
                                                                        setOpenCustomerCombobox(false);
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={`mr-2 h-4 w-4 ${
                                                                            vehicleInfo.customerName === customer.name
                                                                                ? "opacity-100"
                                                                                : "opacity-0"
                                                                        }`}
                                                                    />
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium">
                                                                            {customer.name}
                                                                        </span>
                                                                        {customer.email && (
                                                                            <span className="text-xs text-muted-foreground">
                                                                                {customer.email}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* Plaka Numarası Combobox */}
                                    <div className="space-y-2">
                                        <Label htmlFor="plateNumber">Plaka Numarası</Label>
                                        <Popover open={openPlateCombobox} onOpenChange={setOpenPlateCombobox}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openPlateCombobox}
                                                    className="w-full justify-between"
                                                >
                                                    {vehicleInfo.plateNumber || "Plaka numarası seçin veya yazın..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full p-0">
                                                <Command>
                                                    <CommandInput
                                                        placeholder="Plaka numarası ara veya yaz..."
                                                        value={vehicleInfo.plateNumber}
                                                        onValueChange={(value) =>
                                                            setVehicleInfo((prev) => ({ ...prev, plateNumber: value }))
                                                        }
                                                    />
                                                    <CommandEmpty>
                                                        <div className="p-2">
                                                            <p className="text-sm text-muted-foreground mb-2">
                                                                Eşleşen plaka bulunamadı
                                                            </p>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => setOpenPlateCombobox(false)}
                                                                className="w-full"
                                                            >
                                                                {vehicleInfo.plateNumber} olarak kullan
                                                            </Button>
                                                        </div>
                                                    </CommandEmpty>
                                                    <CommandList>
                                                        <CommandGroup>
                                                            {uniquePlateNumbers.map((plateNumber) => (
                                                                <CommandItem
                                                                    key={plateNumber}
                                                                    value={plateNumber}
                                                                    onSelect={(value) => {
                                                                        const selectedAcceptance =
                                                                            vehicleAcceptances.find(
                                                                                (va) => va.plate_number === value
                                                                            );
                                                                        setVehicleInfo((prev) => ({
                                                                            ...prev,
                                                                            plateNumber: value,
                                                                            vehicleAcceptanceId:
                                                                                selectedAcceptance?.id || null,
                                                                        }));
                                                                        setOpenPlateCombobox(false);
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={`mr-2 h-4 w-4 ${
                                                                            vehicleInfo.plateNumber === plateNumber
                                                                                ? "opacity-100"
                                                                                : "opacity-0"
                                                                        }`}
                                                                    />
                                                                    {plateNumber}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Alt Kısım - Seçilen Şablon Detayları */}
                        {selectedTemplate ? (
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <Wrench className="h-5 w-5" />
                                                Üretim Operasyonları
                                            </CardTitle>
                                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-2">
                                                <span>{selectedTemplate.name}</span>
                                                <Badge variant="outline">{editableOperations.length} Operasyon</Badge>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={handleEditOperationsToggle}
                                                variant={isEditingOperations ? "default" : "outline"}
                                                size="sm"
                                            >
                                                <Pencil className="h-4 w-4 mr-2" />
                                                {isEditingOperations ? "Düzenlemeyi Bitir" : "Düzenle"}
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {templateLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="animate-spin h-4 w-4" />
                                                Şablon yükleniyor...
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {selectedTemplate.stations && selectedTemplate.stations.length > 0 ? (
                                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                                    {selectedTemplate.stations
                                                        .sort((a, b) => a.sort_order - b.sort_order)
                                                        .map((station, stationIndex) => {
                                                            // Bu istasyona ait operasyonları editableOperations'tan al
                                                            const stationOperations = editableOperations.filter(
                                                                (op) => op.stationId === station.id
                                                            );

                                                            return (
                                                                <div
                                                                    key={station.id}
                                                                    className="border rounded-lg p-4 space-y-3 bg-gradient-to-br from-white to-gray-50"
                                                                >
                                                                    {/* İstasyon Başlığı */}
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                                                            {stationIndex + 1}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <h4 className="font-medium flex items-center gap-2 truncate">
                                                                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                                                                <span className="truncate">
                                                                                    {station.station_name}
                                                                                </span>
                                                                            </h4>
                                                                            <p className="text-sm text-muted-foreground">
                                                                                {stationOperations.length} operasyon
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    {/* Operasyonlar */}
                                                                    <div className="space-y-2">
                                                                        {stationOperations.length > 0 ? (
                                                                            stationOperations
                                                                                .sort(
                                                                                    (a, b) =>
                                                                                        editableOperations.indexOf(a) -
                                                                                        editableOperations.indexOf(b)
                                                                                )
                                                                                .map((operation) => {
                                                                                    const operationIndex =
                                                                                        editableOperations.findIndex(
                                                                                            (op) =>
                                                                                                op.id === operation.id
                                                                                        );
                                                                                    const localIndex =
                                                                                        stationOperations.findIndex(
                                                                                            (op) =>
                                                                                                op.id === operation.id
                                                                                        );

                                                                                    return (
                                                                                        <div
                                                                                            key={operation.id}
                                                                                            draggable={
                                                                                                isEditingOperations
                                                                                            }
                                                                                            onDragStart={(e) =>
                                                                                                handleDragStart(
                                                                                                    e,
                                                                                                    operation.id
                                                                                                )
                                                                                            }
                                                                                            onDragEnd={handleDragEnd}
                                                                                            onDragOver={handleDragOver}
                                                                                            onDrop={(e) =>
                                                                                                handleDrop(
                                                                                                    e,
                                                                                                    operation.id
                                                                                                )
                                                                                            }
                                                                                            className={`flex items-start gap-2 p-2 rounded-md border-l-3 transition-all duration-200 ${
                                                                                                operation.qualityControl
                                                                                                    ? "bg-orange-50 border-l-orange-400"
                                                                                                    : "bg-green-50 border-l-green-400"
                                                                                            } ${
                                                                                                operation.isNew
                                                                                                    ? "ring-2 ring-blue-300"
                                                                                                    : ""
                                                                                            } ${
                                                                                                isEditingOperations
                                                                                                    ? "cursor-move hover:shadow-md hover:scale-[1.02]"
                                                                                                    : ""
                                                                                            } ${
                                                                                                draggedOperationId ===
                                                                                                operation.id
                                                                                                    ? "opacity-50 scale-105 shadow-lg"
                                                                                                    : ""
                                                                                            }`}
                                                                                        >
                                                                                            <div className="flex items-center gap-1">
                                                                                                <div
                                                                                                    className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0 ${
                                                                                                        operation.qualityControl
                                                                                                            ? "bg-orange-500"
                                                                                                            : "bg-green-500"
                                                                                                    }`}
                                                                                                >
                                                                                                    {localIndex + 1}
                                                                                                </div>
                                                                                                {isEditingOperations && (
                                                                                                    <GripVertical className="w-4 h-4 text-gray-600 cursor-grab active:cursor-grabbing" />
                                                                                                )}
                                                                                            </div>
                                                                                            <div className="flex-1 min-w-0">
                                                                                                <div className="flex items-start gap-1 flex-wrap">
                                                                                                    <Wrench
                                                                                                        className={`w-3 h-3 mt-0.5 flex-shrink-0 ${
                                                                                                            operation.qualityControl
                                                                                                                ? "text-orange-600"
                                                                                                                : "text-green-600"
                                                                                                        }`}
                                                                                                    />
                                                                                                    <span className="font-medium text-xs leading-tight">
                                                                                                        {
                                                                                                            operation.operationName
                                                                                                        }
                                                                                                    </span>
                                                                                                    {operation.qualityControl && (
                                                                                                        <Badge
                                                                                                            variant="outline"
                                                                                                            className="text-xs bg-orange-100 text-orange-700 border-orange-300 px-1 py-0 h-4"
                                                                                                        >
                                                                                                            QC
                                                                                                        </Badge>
                                                                                                    )}
                                                                                                    {operation.isNew && (
                                                                                                        <Badge
                                                                                                            variant="outline"
                                                                                                            className="text-xs bg-blue-100 text-blue-700 border-blue-300 px-1 py-0 h-4"
                                                                                                        >
                                                                                                            YENİ
                                                                                                        </Badge>
                                                                                                    )}
                                                                                                </div>
                                                                                                {operation.targetDuration && (
                                                                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                                                                        Hedef:{" "}
                                                                                                        {
                                                                                                            operation.targetDuration
                                                                                                        }
                                                                                                        dk
                                                                                                    </p>
                                                                                                )}
                                                                                            </div>

                                                                                            {/* Silme butonu */}
                                                                                            {isEditingOperations && (
                                                                                                <Button
                                                                                                    onClick={() =>
                                                                                                        handleDeleteOperation(
                                                                                                            operationIndex
                                                                                                        )
                                                                                                    }
                                                                                                    variant="ghost"
                                                                                                    size="sm"
                                                                                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                                                >
                                                                                                    <X className="h-3 w-3" />
                                                                                                </Button>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                })
                                                                        ) : (
                                                                            <div className="text-center py-4 text-muted-foreground">
                                                                                <p className="text-xs">
                                                                                    Bu istasyonda operasyon yok
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            ) : (
                                                <div className="text-center py-12 text-muted-foreground">
                                                    <Wrench className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm">Bu şablonda operasyon bulunamadı</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardContent className="text-center py-12">
                                    <div className="text-muted-foreground space-y-2">
                                        <FileText className="w-12 h-12 mx-auto opacity-50" />
                                        <p>Üretim şablonu seçin</p>
                                        <p className="text-sm">Seçilen şablonun operasyonları burada görünecek</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
