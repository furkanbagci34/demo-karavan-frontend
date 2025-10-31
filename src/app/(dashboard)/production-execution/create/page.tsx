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
    Trash2,
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
import { useStations } from "@/hooks/api/useStations";
import { useOperations } from "@/hooks/api/useOperations";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Check, ChevronsUpDown } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { CreateProductionExecutionData } from "@/lib/api/types";

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
    number: number | null;
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
            station_id: number;
            target_duration: number;
        }>;
    }>;
}

interface EditableOperation {
    id: string; // Unique ID for React keys (could be temporary for new operations)
    stationId: number;
    operationId: number;
    originalOperationId?: number; // operations tablosundaki gerçek operation ID
    originalStationId?: number; // operations tablosundaki gerçek station ID
    operationName: string;
    stationName: string;
    sortOrder: number;
    targetDuration?: number;
    qualityControl: boolean;
}

interface ManualStation {
    id: string; // Temporary ID for React keys
    stationId: number;
    stationName: string;
}

export default function ProductionExecutionPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();

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
        number: null,
    });

    const [description, setDescription] = useState<string>("");

    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<SelectedTemplate | null>(null);
    const [productionStatus, setProductionStatus] = useState<"idle" | "running" | "paused">("idle");

    // Operasyon düzenleme state'leri
    const [editableOperations, setEditableOperations] = useState<EditableOperation[]>([]);
    const [isEditingOperations, setIsEditingOperations] = useState(false);
    const [draggedOperationId, setDraggedOperationId] = useState<string | null>(null);

    // Manuel istasyon ve operasyon ekleme state'leri
    const [manualStations, setManualStations] = useState<ManualStation[]>([]);
    const [openStationCombobox, setOpenStationCombobox] = useState(false);
    const [openOperationCombobox, setOpenOperationCombobox] = useState<{ [stationId: string]: boolean }>({});

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
    const { get: stationsQuery } = useStations();
    const { operations, isLoading: operationsLoading } = useOperations();

    const productionTemplates = productionTemplatesQuery.data || [];
    const stations = stationsQuery.data || [];

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
            setSelectedTemplate(templateData as unknown as SelectedTemplate);
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
                        originalStationId: operation.station_id, // Bu gerçek stations tablosundaki ID
                        operationName: operation.operation_name,
                        stationName: station.station_name,
                        sortOrder: operation.sort_order,
                        qualityControl: operation.quality_control,
                        targetDuration: operation.target_duration,
                    });
                });
            });
            console.log(selectedTemplate.stations);

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
        if (templateId === "none" || templateId === "") {
            setSelectedTemplateId(null);
            return;
        }
        const template = productionTemplates.find((t) => t.id === parseInt(templateId));
        if (template) {
            setSelectedTemplateId(template.id);
        }
    };

    // Manuel istasyon ekle
    const handleAddManualStation = (stationId: number) => {
        const station = stations.find((s) => s.id === stationId);
        if (!station) return;

        // Zaten eklenmiş mi kontrol et (template'ten veya manuel)
        const isAlreadyAdded =
            manualStations.some((ms) => ms.stationId === stationId) ||
            (selectedTemplate?.stations?.some((s) => s.id === stationId) ?? false);

        if (isAlreadyAdded) {
            toast.error("Bu istasyon zaten eklenmiş");
            return;
        }

        const newManualStation: ManualStation = {
            id: `manual-${stationId}-${Date.now()}`,
            stationId: station.id,
            stationName: station.name,
        };

        setManualStations([...manualStations, newManualStation]);
        setOpenStationCombobox(false);
        toast.success(`${station.name} istasyonu eklendi`);
    };

    // Manuel istasyon sil
    const handleRemoveManualStation = (stationId: string) => {
        // Bu istasyona ait operasyonları da sil
        const station = manualStations.find((ms) => ms.id === stationId);
        if (station) {
            const newOperations = editableOperations.filter((op) => op.stationId !== station.stationId);
            setEditableOperations(newOperations);
        }

        setManualStations(manualStations.filter((ms) => ms.id !== stationId));
    };

    // İstasyona operasyon ekle
    const handleAddOperationToStation = (stationId: number, operationId: number) => {
        const operation = operations.find((op) => op.id === operationId);
        const dbStation = stations.find((s) => s.id === stationId);
        const manualStation = manualStations.find((ms) => ms.stationId === stationId);

        if (!operation || (!dbStation && !manualStation)) return;

        const stationName = manualStation?.stationName || dbStation?.name || "";

        // Aynı operasyon aynı istasyona zaten eklenmiş mi kontrol et
        const isAlreadyAdded = editableOperations.some(
            (op) =>
                op.stationId === stationId && (op.originalOperationId === operationId || op.operationId === operationId)
        );

        if (isAlreadyAdded) {
            toast.error("Bu operasyon bu istasyona zaten eklenmiş");
            return;
        }

        const newOperation: EditableOperation = {
            id: `manual-op-${stationId}-${operationId}-${Date.now()}`,
            stationId: stationId,
            operationId: operationId,
            originalOperationId: operationId,
            originalStationId: stationId,
            operationName: operation.name,
            stationName: stationName,
            sortOrder: editableOperations.length + 1,
            qualityControl: operation.quality_control,
            targetDuration: operation.target_duration,
        };

        setEditableOperations([...editableOperations, newOperation]);
        setOpenOperationCombobox((prev) => ({ ...prev, [stationId.toString()]: false }));
        toast.success(`${operation.name} operasyonu eklendi`);
    };

    // Üretimi başlat
    const handleStartProduction = async () => {
        if (!vehicleInfo.vehicleId) {
            toast.error("Lütfen bir model seçin");
            return;
        }

        // En az bir operasyon olmalı
        if (editableOperations.length === 0) {
            toast.error("Lütfen en az bir operasyon ekleyin");
            return;
        }

        if (!vehicleInfo.number) {
            toast.error("Lütfen bir numara seçin");
            return;
        }

        // Teklif numarası veya plaka numarası zorunlu (ikisinden birisi)
        if (!vehicleInfo.offerId && !vehicleInfo.vehicleAcceptanceId) {
            toast.error("Lütfen teklif numarası veya plaka numarası seçin");
            return;
        }

        try {
            // Düzenlenmiş operasyonları backend formatına dönüştür
            const operations = editableOperations.map((op, index) => ({
                stationId: op.stationId,
                operationId: op.operationId, // Template operation ID
                originalOperationId: op.originalOperationId || op.operationId, // operations tablosundaki gerçek ID
                originalStationId: op.originalStationId || op.stationId, // stations tablosundaki gerçek ID
                sortOrder: index + 1, // Yeni sıra numarası
                targetDuration: op.targetDuration,
                qualityControl: op.qualityControl,
            }));

            // Backend'e gönderilecek veri
            const productionExecutionData: CreateProductionExecutionData = {
                ...(selectedTemplate?.id && { productionPlanId: selectedTemplate.id }),
                vehicleId: vehicleInfo.vehicleId!,
                ...(vehicleInfo.offerId && { offerId: vehicleInfo.offerId }),
                ...(vehicleInfo.customerId && { customerId: vehicleInfo.customerId }),
                ...(vehicleInfo.vehicleAcceptanceId && { vehicleAcceptanceId: vehicleInfo.vehicleAcceptanceId }),
                status: "running" as const,
                ...(description && { description }),
                number: vehicleInfo.number!,
                operations: operations,
            };

            await createProductionExecution.mutateAsync(productionExecutionData);
            queryClient.invalidateQueries({ queryKey: ["production"] });
            // Rapor cache'ini temizle
            queryClient.invalidateQueries({ queryKey: ["reports"] });

            setTimeout(() => {
                router.push("/production-execution");
            }, 500);
        } catch (error) {
            console.error("Üretim başlatma hatası:", error);
            toast.error("Üretim başlatma hatası");
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
            number: null,
        });
        setDescription("");
        setSelectedTemplateId(null);
        setProductionStatus("idle");
        setManualStations([]);
        setEditableOperations([]);
        setOpenOfferCombobox(false);
        setOpenCustomerCombobox(false);
        setOpenPlateCombobox(false);
        setOpenStationCombobox(false);
        setOpenOperationCombobox({});
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

    // Plaka ve şase numarası için filtreleme state'i
    const [plateSearchValue, setPlateSearchValue] = useState("");

    // Plaka/şase numarasına göre filtrelenmiş araç kabul listesi
    const filteredVehicleAcceptances = vehicleAcceptances.filter((acc) => {
        if (!plateSearchValue) return true;
        const searchLower = plateSearchValue.toLowerCase().trim();
        const hasPlate = acc.plate_number && acc.plate_number.trim() !== "";
        const hasChassis = acc.chassis_number && acc.chassis_number.trim() !== "";

        // Arama yapılıyorsa, plaka veya şase numarasında eşleşme olmalı
        if (searchLower) {
            const plateMatch = hasPlate && acc.plate_number!.toLowerCase().includes(searchLower);
            const chassisMatch = hasChassis && acc.chassis_number!.toLowerCase().includes(searchLower);
            return plateMatch || chassisMatch;
        }

        // Arama yoksa, plaka veya şase numarası olan tüm araçları göster
        return hasPlate || hasChassis;
    });

    const isLoading =
        vehiclesLoading ||
        productionTemplatesQuery.isLoading ||
        offersLoading ||
        vehicleAcceptancesLoading ||
        customersLoading ||
        stationsQuery.isLoading ||
        operationsLoading;

    // Tüm istasyonları birleştir (template'ten gelenler + manuel eklenenler)
    const getAllStations = () => {
        const templateStationIds = new Set(selectedTemplate?.stations?.map((s) => s.id) || []);

        // Template'ten gelen istasyonlar
        const templateStations =
            selectedTemplate?.stations?.map((s) => ({
                id: s.id,
                name: s.station_name,
            })) || [];

        // Manuel eklenen istasyonlar (template'te olmayanlar)
        const additionalManualStations = manualStations
            .filter((ms) => !templateStationIds.has(ms.stationId))
            .map((ms) => ({
                id: ms.stationId,
                name: ms.stationName,
            }));

        return [...templateStations, ...additionalManualStations];
    };

    // İstasyonun manuel eklenip eklenmediğini kontrol et
    const isStationManual = (stationId: number) => {
        return manualStations.some((ms) => ms.stationId === stationId);
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
                                disabled={createProductionExecution.isPending}
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
                            <></>
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
                                            <Label htmlFor="vehicle" className="text-sm font-medium w-32 flex-shrink-0">
                                                Model Seçimi <span className="text-red-500">*</span>
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
                                            <Label className="text-sm font-medium w-32 flex-shrink-0">
                                                Üretim Şablonu
                                            </Label>
                                            <Select
                                                onValueChange={handleTemplateSelect}
                                                value={selectedTemplateId?.toString()}
                                                disabled={!vehicleInfo.vehicleId}
                                            >
                                                <SelectTrigger className="h-12 flex-1">
                                                    <SelectValue
                                                        placeholder={
                                                            vehicleInfo.vehicleId
                                                                ? "Üretim şablonu seçin (isteğe bağlı)"
                                                                : "Önce model seçin"
                                                        }
                                                    />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">
                                                        <span className="text-muted-foreground">
                                                            Şablon seçmeden devam et
                                                        </span>
                                                    </SelectItem>
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
                                                Bu model için henüz üretim şablonu bulunmuyor. İstediğiniz istasyonları
                                                manuel olarak ekleyebilirsiniz.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Açıklama ve Numara Alanları - Altında */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Açıklama Alanı */}
                                    <div className="space-y-2">
                                        <div className="flex items-start gap-3">
                                            <Label
                                                htmlFor="description"
                                                className="text-sm font-medium flex items-center gap-2 w-32 flex-shrink-0 pt-3"
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

                                    {/* Numara Seçimi */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <Label htmlFor="number" className="text-sm font-medium w-32 flex-shrink-0">
                                                Numara <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                onValueChange={(value) =>
                                                    setVehicleInfo((prev) => ({ ...prev, number: parseInt(value) }))
                                                }
                                                value={vehicleInfo.number?.toString() || ""}
                                            >
                                                <SelectTrigger className="h-12 flex-1">
                                                    <SelectValue placeholder="Numara seçiniz (1-10)" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                                                        <SelectItem key={num} value={num.toString()}>
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">
                                                                    {num}
                                                                </div>
                                                                <span className="font-medium">Numara {num}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
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

                                    {/* Plaka/Şase Numarası Combobox */}
                                    <div className="space-y-2">
                                        <Label htmlFor="plateNumber">Plaka/Şase Numarası</Label>
                                        <Popover
                                            open={openPlateCombobox}
                                            onOpenChange={(open) => {
                                                setOpenPlateCombobox(open);
                                                if (!open) {
                                                    setPlateSearchValue("");
                                                }
                                            }}
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openPlateCombobox}
                                                    className="w-full justify-between"
                                                >
                                                    {(() => {
                                                        const selectedAcceptance = vehicleAcceptances.find(
                                                            (va) => va.id === vehicleInfo.vehicleAcceptanceId
                                                        );
                                                        if (selectedAcceptance) {
                                                            if (
                                                                selectedAcceptance.plate_number &&
                                                                selectedAcceptance.chassis_number
                                                            ) {
                                                                return `${selectedAcceptance.plate_number} (Şase: ${selectedAcceptance.chassis_number})`;
                                                            } else if (selectedAcceptance.plate_number) {
                                                                return selectedAcceptance.plate_number;
                                                            } else if (selectedAcceptance.chassis_number) {
                                                                return `Şase: ${selectedAcceptance.chassis_number}`;
                                                            }
                                                        }
                                                        return (
                                                            vehicleInfo.plateNumber ||
                                                            "Plaka veya şase numarası seçin..."
                                                        );
                                                    })()}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full p-0">
                                                <Command shouldFilter={false}>
                                                    <CommandInput
                                                        placeholder="Plaka veya şase numarası ara..."
                                                        value={plateSearchValue}
                                                        onValueChange={setPlateSearchValue}
                                                    />
                                                    <CommandEmpty>
                                                        <div className="p-2">
                                                            <p className="text-sm text-muted-foreground mb-2">
                                                                Eşleşen plaka/şase bulunamadı
                                                            </p>
                                                            {plateSearchValue && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => {
                                                                        setVehicleInfo((prev) => ({
                                                                            ...prev,
                                                                            plateNumber: plateSearchValue,
                                                                        }));
                                                                        setOpenPlateCombobox(false);
                                                                    }}
                                                                    className="w-full"
                                                                >
                                                                    {plateSearchValue} olarak kullan
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </CommandEmpty>
                                                    <CommandList>
                                                        <CommandGroup>
                                                            {filteredVehicleAcceptances.map((acceptance) => {
                                                                const hasPlate =
                                                                    acceptance.plate_number &&
                                                                    acceptance.plate_number.trim() !== "";
                                                                const hasChassis =
                                                                    acceptance.chassis_number &&
                                                                    acceptance.chassis_number.trim() !== "";

                                                                return (
                                                                    <CommandItem
                                                                        key={acceptance.id}
                                                                        value={`${acceptance.plate_number || ""} ${
                                                                            acceptance.chassis_number || ""
                                                                        }`}
                                                                        onSelect={() => {
                                                                            setVehicleInfo((prev) => ({
                                                                                ...prev,
                                                                                plateNumber:
                                                                                    acceptance.plate_number || "",
                                                                                vehicleAcceptanceId:
                                                                                    acceptance.id || null,
                                                                            }));
                                                                            setOpenPlateCombobox(false);
                                                                            setPlateSearchValue("");
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={`mr-2 h-4 w-4 ${
                                                                                vehicleInfo.vehicleAcceptanceId ===
                                                                                acceptance.id
                                                                                    ? "opacity-100"
                                                                                    : "opacity-0"
                                                                            }`}
                                                                        />
                                                                        <div className="flex flex-col">
                                                                            {hasPlate ? (
                                                                                <>
                                                                                    <span className="font-medium">
                                                                                        {acceptance.plate_number}
                                                                                    </span>
                                                                                    {hasChassis && (
                                                                                        <span className="text-xs text-muted-foreground">
                                                                                            Şase:{" "}
                                                                                            {acceptance.chassis_number}
                                                                                        </span>
                                                                                    )}
                                                                                </>
                                                                            ) : hasChassis ? (
                                                                                <span className="font-medium">
                                                                                    Şase: {acceptance.chassis_number}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="font-medium text-muted-foreground">
                                                                                    Plaka/Şase bilgisi yok
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
                                </div>
                            </CardContent>
                        </Card>

                        {/* Alt Kısım - Üretim Operasyonları */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Wrench className="h-5 w-5" />
                                            Üretim Operasyonları
                                        </CardTitle>
                                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-2">
                                            {selectedTemplate && <span>{selectedTemplate.name}</span>}
                                            <Badge variant="outline">{editableOperations.length} Operasyon</Badge>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {/* Manuel İstasyon Ekle */}
                                        <Popover open={openStationCombobox} onOpenChange={setOpenStationCombobox}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                    <MapPin className="h-4 w-4 mr-2" />
                                                    İstasyon Ekle
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80 p-0">
                                                <Command>
                                                    <CommandInput placeholder="İstasyon ara..." />
                                                    <CommandEmpty>
                                                        <div className="p-2">
                                                            <p className="text-sm text-muted-foreground">
                                                                İstasyon bulunamadı
                                                            </p>
                                                        </div>
                                                    </CommandEmpty>
                                                    <CommandList>
                                                        <CommandGroup>
                                                            {stations
                                                                .filter((station) => {
                                                                    // Template'ten gelen istasyonları ve manuel eklenen istasyonları filtrele
                                                                    const isInTemplate =
                                                                        selectedTemplate?.stations?.some(
                                                                            (s) => s.id === station.id
                                                                        );
                                                                    const isManualAdded = manualStations.some(
                                                                        (ms) => ms.stationId === station.id
                                                                    );
                                                                    return (
                                                                        !isInTemplate &&
                                                                        !isManualAdded &&
                                                                        station.is_active
                                                                    );
                                                                })
                                                                .map((station) => (
                                                                    <CommandItem
                                                                        key={station.id}
                                                                        value={station.name}
                                                                        onSelect={() =>
                                                                            handleAddManualStation(station.id)
                                                                        }
                                                                    >
                                                                        <Check className={`mr-2 h-4 w-4 opacity-0`} />
                                                                        <MapPin className="w-4 h-4 mr-2" />
                                                                        <span>{station.name}</span>
                                                                    </CommandItem>
                                                                ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>

                                        {editableOperations.length > 0 && (
                                            <Button
                                                onClick={handleEditOperationsToggle}
                                                variant={isEditingOperations ? "default" : "outline"}
                                                size="sm"
                                            >
                                                <Pencil className="h-4 w-4 mr-2" />
                                                {isEditingOperations ? "Düzenlemeyi Bitir" : "Düzenle"}
                                            </Button>
                                        )}
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
                                        {getAllStations().length > 0 ? (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                                {getAllStations().map((station, stationIndex) => {
                                                    // Bu istasyona ait operasyonları editableOperations'tan al
                                                    const stationOperations = editableOperations.filter(
                                                        (op) => op.stationId === station.id
                                                    );

                                                    const isManual = isStationManual(station.id);

                                                    return (
                                                        <div
                                                            key={`station-${station.id}`}
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
                                                                        <span className="truncate">{station.name}</span>
                                                                    </h4>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {stationOperations.length} operasyon
                                                                    </p>
                                                                </div>
                                                                {/* Manuel istasyon silme butonu */}
                                                                {isManual && isEditingOperations && (
                                                                    <Button
                                                                        onClick={() => {
                                                                            const manualStation = manualStations.find(
                                                                                (ms) => ms.stationId === station.id
                                                                            );
                                                                            if (manualStation) {
                                                                                handleRemoveManualStation(
                                                                                    manualStation.id
                                                                                );
                                                                            }
                                                                        }}
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </Button>
                                                                )}
                                                            </div>

                                                            {/* Operasyon Ekle Butonu */}
                                                            <Popover
                                                                open={
                                                                    openOperationCombobox[station.id.toString()] ||
                                                                    false
                                                                }
                                                                onOpenChange={(open) =>
                                                                    setOpenOperationCombobox((prev) => ({
                                                                        ...prev,
                                                                        [station.id.toString()]: open,
                                                                    }))
                                                                }
                                                            >
                                                                <PopoverTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="w-full"
                                                                    >
                                                                        <Wrench className="h-3 w-3 mr-2" />
                                                                        Operasyon Ekle
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-80 p-0">
                                                                    <Command>
                                                                        <CommandInput placeholder="Operasyon ara..." />
                                                                        <CommandEmpty>
                                                                            <div className="p-2">
                                                                                <p className="text-sm text-muted-foreground">
                                                                                    Operasyon bulunamadı
                                                                                </p>
                                                                            </div>
                                                                        </CommandEmpty>
                                                                        <CommandList>
                                                                            <CommandGroup>
                                                                                {operations
                                                                                    .filter((operation) => {
                                                                                        // Bu istasyona zaten eklenmiş mi kontrol et
                                                                                        const isAlreadyAdded =
                                                                                            editableOperations.some(
                                                                                                (op) =>
                                                                                                    op.stationId ===
                                                                                                        station.id &&
                                                                                                    (op.originalOperationId ===
                                                                                                        operation.id ||
                                                                                                        op.operationId ===
                                                                                                            operation.id)
                                                                                            );
                                                                                        return (
                                                                                            !isAlreadyAdded &&
                                                                                            operation.is_active
                                                                                        );
                                                                                    })
                                                                                    .map((operation) => (
                                                                                        <CommandItem
                                                                                            key={operation.id}
                                                                                            value={operation.name}
                                                                                            onSelect={() =>
                                                                                                handleAddOperationToStation(
                                                                                                    station.id,
                                                                                                    operation.id
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            <Check
                                                                                                className={`mr-2 h-4 w-4 opacity-0`}
                                                                                            />
                                                                                            <Wrench className="w-4 h-4 mr-2" />
                                                                                            <span className="flex-1">
                                                                                                {operation.name}
                                                                                            </span>
                                                                                            {operation.quality_control && (
                                                                                                <Badge
                                                                                                    variant="outline"
                                                                                                    className="text-xs bg-orange-100 text-orange-700 border-orange-300"
                                                                                                >
                                                                                                    KK
                                                                                                </Badge>
                                                                                            )}
                                                                                        </CommandItem>
                                                                                    ))}
                                                                            </CommandGroup>
                                                                        </CommandList>
                                                                    </Command>
                                                                </PopoverContent>
                                                            </Popover>

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
                                                                                    (op) => op.id === operation.id
                                                                                );
                                                                            const localIndex =
                                                                                stationOperations.findIndex(
                                                                                    (op) => op.id === operation.id
                                                                                );

                                                                            return (
                                                                                <div
                                                                                    key={operation.id}
                                                                                    draggable={isEditingOperations}
                                                                                    onDragStart={(e) =>
                                                                                        handleDragStart(e, operation.id)
                                                                                    }
                                                                                    onDragEnd={handleDragEnd}
                                                                                    onDragOver={handleDragOver}
                                                                                    onDrop={(e) =>
                                                                                        handleDrop(e, operation.id)
                                                                                    }
                                                                                    className={`flex items-start gap-2 p-2 rounded-md border-l-3 transition-all duration-200 ${
                                                                                        operation.qualityControl
                                                                                            ? "bg-orange-50 border-l-orange-400"
                                                                                            : "bg-green-50 border-l-green-400"
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
                                                                                                    KK
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
                                                <p className="text-sm">
                                                    {selectedTemplate
                                                        ? "Bu şablonda operasyon bulunamadı"
                                                        : "Henüz istasyon eklenmedi"}
                                                </p>
                                                <p className="text-xs mt-2">
                                                    Üstteki İstasyon Ekle butonunu kullanarak istasyon ekleyebilirsiniz
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </>
    );
}
