"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, FileText, Wrench, MapPin, AlertCircle, Loader2, Pencil, GripVertical, X, Save } from "lucide-react";
import { useProductionTemplates } from "@/hooks/api/useProductionTemplates";
import { useOffers } from "@/hooks/api/useOffers";
import { useVehicleAcceptance } from "@/hooks/api/useVehicleAcceptance";
import { useCustomers } from "@/hooks/api/useCustomers";
import { useProductionExecution } from "@/hooks/api/useProductionExecution";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

export default function ProductionExecutionEditPage() {
    const router = useRouter();
    const params = useParams();
    const executionId = params.id as string;

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

    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<SelectedTemplate | null>(null);

    // Operasyon düzenleme state'leri
    const [editableOperations, setEditableOperations] = useState<EditableOperation[]>([]);
    const [isEditingOperations, setIsEditingOperations] = useState(false);
    const [draggedOperationId, setDraggedOperationId] = useState<string | null>(null);

    // Combobox state'leri
    const [openOfferCombobox, setOpenOfferCombobox] = useState(false);
    const [openCustomerCombobox, setOpenCustomerCombobox] = useState(false);
    const [openPlateCombobox, setOpenPlateCombobox] = useState(false);

    // API hooks
    const { get: productionTemplatesQuery, useProductionTemplateById } = useProductionTemplates();
    const { getAllOffers, loading: offersLoading } = useOffers();
    const { vehicleAcceptances, isLoading: vehicleAcceptancesLoading } = useVehicleAcceptance();
    const { customers, isLoading: customersLoading } = useCustomers();
    const { useProductionExecutionById, update } = useProductionExecution();

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

    // Mevcut production execution verilerini yükle
    const { data: executionData, isLoading: executionLoading } = useProductionExecutionById(parseInt(executionId));

    // Production execution verisi geldiğinde form'u doldur
    useEffect(() => {
        if (executionData) {
            setSelectedTemplateId(executionData.production_plan_id);
            
            setVehicleInfo({
                vehicleId: executionData.vehicle_id || null,
                vehicleName: executionData.vehicle_name || "",
                vehicleBrand: executionData.vehicle_brand_model || "",
                offerId: executionData.offer_id || null,
                offerNumber: executionData.offer_number || "",
                customerId: executionData.customer_id || null,
                customerName: executionData.customer_name || "",
                plateNumber: executionData.plate_number || "",
                vehicleAcceptanceId: executionData.vehicle_acceptance_id || null,
            });

            // Operasyonları EditableOperation formatına dönüştür
            if (executionData.operations) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const operations = executionData.operations.map((op: any) => ({
                    id: `existing-${op.id}`,
                    stationId: op.station_id,
                    operationId: op.original_operation_id || op.operation_id, // Gerçek operation ID'yi kullan
                    originalOperationId: op.original_operation_id || op.operation_id, // originalOperationId alanını da ekle
                    operationName: op.original_operation_name || op.operation_name, // Gerçek operation name'ini kullan
                    stationName: op.station_name,
                    sortOrder: op.sort_order,
                    targetDuration: op.target_duration,
                    qualityControl: op.quality_control,
                    isNew: false,
                }));
                setEditableOperations(operations);
            }
        }
    }, [executionData]);

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

    // Kaydetme fonksiyonu
    const handleSave = async () => {
        if (!executionData) {
            toast.error("Execution verisi yüklenmedi");
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
            const updateData = {
                offerId: vehicleInfo.offerId || undefined,
                customerId: vehicleInfo.customerId || undefined,
                vehicleAcceptanceId: vehicleInfo.vehicleAcceptanceId || undefined,
                operations: operations,
            };

            await update.mutateAsync({ id: parseInt(executionId), data: updateData });
            
            // 1.5 saniye sonra yönlendir
            setTimeout(() => {
                router.push("/production-execution");
            }, 500);
        } catch (error) {
            console.error("Üretim planı güncelleme hatası:", error);
            toast.error("Üretim planı güncellenemedi");
        }
    };

    // Operasyon düzenleme fonksiyonları (create sayfasından aynı)
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
        e.dataTransfer.setData('text/plain', operationId);
        e.dataTransfer.effectAllowed = 'move';
        setDraggedOperationId(operationId);
    };

    const handleDragEnd = () => {
        setDraggedOperationId(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetOperationId: string) => {
        e.preventDefault();
        const draggedOperationId = e.dataTransfer.getData('text/plain');
        
        if (draggedOperationId === targetOperationId) {
            setDraggedOperationId(null);
            return;
        }

        const draggedIndex = editableOperations.findIndex(op => op.id === draggedOperationId);
        const targetIndex = editableOperations.findIndex(op => op.id === targetOperationId);

        if (draggedIndex !== -1 && targetIndex !== -1) {
            handleMoveOperation(draggedIndex, targetIndex);
        }
        
        setDraggedOperationId(null);
    };

    const handleDeleteOperation = (index: number) => {
        const newOperations = editableOperations.filter((_, i) => i !== index);
        setEditableOperations(newOperations);
    };


    // Benzersiz veriler için helper'lar
    const uniqueOfferNumbers = [...new Set(offers.map((offer) => offer.offer_number))].filter(Boolean);
    const uniquePlateNumbers = [...new Set(vehicleAcceptances.map((acc) => acc.plate_number))].filter(Boolean);

    const isLoading =
        productionTemplatesQuery.isLoading ||
        offersLoading ||
        vehicleAcceptancesLoading ||
        customersLoading ||
        executionLoading;

    if (executionLoading) {
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
                                    <BreadcrumbLink href="/production-execution">Üretim Planları</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden sm:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Düzenle</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                <div className="flex flex-1 flex-col p-4 sm:p-6">
                    <div className="flex items-center justify-center py-8">
                        <div className="flex items-center gap-2">
                            <Loader2 className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
                            Yükleniyor...
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (!executionData) {
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
                                    <BreadcrumbLink href="/production-execution">Üretim Planları</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden sm:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Düzenle</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                <div className="flex flex-1 flex-col p-4 sm:p-6">
                    <div className="text-center py-12 text-muted-foreground">
                        <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Üretim planı bulunamadı</p>
                    </div>
                </div>
            </>
        );
    }

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
                                <BreadcrumbLink href="/production-execution">Üretim Planları</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden sm:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Düzenle</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                {/* Başlık ve Kaydet Butonu */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <Pencil className="h-6 w-6 text-blue-600" />
                        Üretim Planı Düzenle
                    </h1>

                    <Button
                        onClick={handleSave}
                        disabled={update.isPending}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                    >
                        {update.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Kaydediliyor...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Kaydet
                            </>
                        )}
                    </Button>
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
                        {/* Üst Kısım - Model Bilgileri (Sadece Gösterim) */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Car className="h-5 w-5" />
                                    Model Bilgileri
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-sm font-medium">Model</Label>
                                        <div className="mt-1 p-2 bg-gray-50 rounded border">
                                            {vehicleInfo.vehicleName}
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Marka/Model</Label>
                                        <div className="mt-1 p-2 bg-gray-50 rounded border">
                                            {vehicleInfo.vehicleBrand || "Belirtilmemiş"}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Orta Kısım - Teklif ve Müşteri Bilgileri (Düzenlenebilir) */}
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
                                                            const matchingOffer = offers.find(
                                                                (offer) => offer.offer_number === value
                                                            );

                                                            setVehicleInfo((prev) => ({
                                                                ...prev,
                                                                offerId: matchingOffer?.id || null,
                                                                offerNumber: value,
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
                                                                            const selectedOffer = offers.find(
                                                                                (offer) => offer.offer_number === value
                                                                            );

                                                                            setVehicleInfo((prev) => ({
                                                                                ...prev,
                                                                                offerId: selectedOffer?.id || null,
                                                                                offerNumber: value,
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

                        {/* Alt Kısım - Operasyonlar */}
                        {selectedTemplate && (
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
                                                <Badge variant="outline">
                                                    {editableOperations.length} Operasyon
                                                </Badge>
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
                                                                op => op.stationId === station.id
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
                                                                                .sort((a, b) => editableOperations.indexOf(a) - editableOperations.indexOf(b))
                                                                                .map((operation) => {
                                                                                    const operationIndex = editableOperations.findIndex(op => op.id === operation.id);
                                                                                    const localIndex = stationOperations.findIndex(op => op.id === operation.id);
                                                                                    
                                                                                    return (
                                                                                        <div
                                                                                            key={operation.id}
                                                                                            draggable={isEditingOperations}
                                                                                            onDragStart={(e) => handleDragStart(e, operation.id)}
                                                                                            onDragEnd={handleDragEnd}
                                                                                            onDragOver={handleDragOver}
                                                                                            onDrop={(e) => handleDrop(e, operation.id)}
                                                                                            className={`flex items-start gap-2 p-2 rounded-md border-l-3 transition-all duration-200 ${
                                                                                                operation.qualityControl
                                                                                                    ? "bg-orange-50 border-l-orange-400"
                                                                                                    : "bg-green-50 border-l-green-400"
                                                                                            } ${operation.isNew ? "ring-2 ring-blue-300" : ""} ${
                                                                                                isEditingOperations ? "cursor-move hover:shadow-md hover:scale-[1.02]" : ""
                                                                                            } ${
                                                                                                draggedOperationId === operation.id ? "opacity-50 scale-105 shadow-lg" : ""
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
                                                                                                        {operation.operationName}
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
                                                                                                        Hedef: {operation.targetDuration}dk
                                                                                                    </p>
                                                                                                )}
                                                                                            </div>
                                                                                            
                                                                                            {/* Silme butonu */}
                                                                                            {isEditingOperations && (
                                                                                                <Button
                                                                                                    onClick={() => handleDeleteOperation(operationIndex)}
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
                                                                                <p className="text-xs">Bu istasyonda operasyon yok</p>
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
                        )}
                    </div>
                )}

            </div>
        </>
    );
}
