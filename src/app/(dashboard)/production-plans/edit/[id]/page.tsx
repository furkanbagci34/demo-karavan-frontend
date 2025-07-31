"use client";

import { useState, useEffect, use } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useProductionPlans } from "@/hooks/api/useProductionPlans";
import { useVehicles } from "@/hooks/api/useVehicles";
import { useStations } from "@/hooks/api/useStations";
import { useOperations } from "@/hooks/api/useOperations";
import { ProductionPlan } from "@/lib/api/types";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Car, MapPin, Wrench, Trash2, X, GripVertical, Save, Edit, AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";

// Form doğrulama şeması
const productionPlanSchema = z.object({
    name: z.string().min(2, "Plan adı en az 2 karakter olmalıdır").max(500, "Plan adı çok uzun"),
    vehicleId: z.number().min(1, "Lütfen bir araç seçin"),
    isActive: z.boolean(),
});

type ProductionPlanFormData = z.infer<typeof productionPlanSchema>;

interface StationOperation {
    operationId: number;
    operationName: string;
    quality_control: boolean;
}

interface Station {
    id: string;
    stationId: number;
    stationName: string;
    operations: StationOperation[];
}

interface EditProductionPlanPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function EditProductionPlanPage({ params }: EditProductionPlanPageProps) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { update, useProductionPlanById } = useProductionPlans();
    const { vehicles, isLoading: vehiclesLoading } = useVehicles();
    const { get: stationsQuery, isLoading: stationsLoading } = useStations();
    const { operations, isLoading: operationsLoading } = useOperations();

    const [productionPlan, setProductionPlan] = useState<ProductionPlan | null>(null);
    const [isLoadingPlan, setIsLoadingPlan] = useState(true);
    const [isFormInitialized, setIsFormInitialized] = useState(false);
    const [selectedStations, setSelectedStations] = useState<number[]>([]);
    const [stations, setStations] = useState<Station[]>([]);
    const [draggedStation, setDraggedStation] = useState<string | null>(null);
    const [draggedOperation, setDraggedOperation] = useState<{ stationId: string; operationIndex: number } | null>(
        null
    );
    const [openOperationPopover, setOpenOperationPopover] = useState<{ [stationId: number]: boolean }>({});

    const productionPlanQuery = useProductionPlanById(parseInt(resolvedParams.id));
    const stationsData = stationsQuery.data || [];

    const form = useForm<ProductionPlanFormData>({
        resolver: zodResolver(productionPlanSchema),
        defaultValues: {
            name: "",
            vehicleId: 0,
            isActive: true,
        },
    });

    // Üretim planı bilgilerini yükle
    useEffect(() => {
        if (productionPlanQuery.data && !productionPlan) {
            setProductionPlan(productionPlanQuery.data);
            setIsLoadingPlan(false);
        }
    }, [productionPlanQuery.data, productionPlan]);

    // Üretim planı yüklendiğinde form'u ve istasyonları doldur
    useEffect(() => {
        if (productionPlan && !isFormInitialized) {
            // Form'u doldur
            const formData = {
                name: productionPlan.name,
                vehicleId: productionPlan.vehicle_id,
                isActive: productionPlan.is_active,
            };
            form.reset(formData);

            // İstasyonları doldur
            if (productionPlan.stations) {
                const stationIds = productionPlan.stations.map((station) => station.station_id);
                setSelectedStations(stationIds);

                const stationObjects: Station[] = productionPlan.stations.map((station, index) => ({
                    id: `station-${index}`,
                    stationId: station.station_id,
                    stationName: station.station_name,
                    operations: station.operations.map((operation, opIndex) => ({
                        operationId: operation.operation_id,
                        operationName: operation.operation_name,
                        quality_control: operation.quality_control,
                    })),
                }));
                setStations(stationObjects);
            }

            setIsFormInitialized(true);
        }
    }, [productionPlan, isFormInitialized, form]);

    // Form değerlerini manuel olarak set et
    useEffect(() => {
        if (productionPlan && isFormInitialized) {
            form.setValue("name", productionPlan.name);
            form.setValue("vehicleId", productionPlan.vehicle_id);
            form.setValue("isActive", productionPlan.is_active);
        }
    }, [productionPlan, isFormInitialized, form]);

    // İstasyonlar yüklendiğinde operasyonları koru
    useEffect(() => {
        if (isFormInitialized && productionPlan?.stations && stations.length === 0) {
            const stationObjects: Station[] = productionPlan.stations.map((station, index) => ({
                id: `station-${index}`,
                stationId: station.station_id,
                stationName: station.station_name,
                operations: station.operations.map((operation) => ({
                    operationId: operation.operation_id,
                    operationName: operation.operation_name,
                    quality_control: operation.quality_control,
                })),
            }));
            setStations(stationObjects);
        }
    }, [isFormInitialized, productionPlan, stations.length]);

    // Seçilen istasyonlar değiştiğinde operasyonları güncelle
    useEffect(() => {
        if (selectedStations.length > 0 && isFormInitialized) {
            const newStations: Station[] = [];
            selectedStations.forEach((stationId, index) => {
                const stationData = stationsData.find((s: any) => s.id === stationId);
                const existingStation = stations.find((s) => s.stationId === stationId);

                newStations.push({
                    id: `station-${index}`,
                    stationId: stationId,
                    stationName: stationData ? stationData.name : "",
                    operations: existingStation ? existingStation.operations : [],
                });
            });
            setStations(newStations);
        } else if (selectedStations.length === 0 && isFormInitialized) {
            setStations([]);
        }
    }, [selectedStations, stationsData, isFormInitialized]);

    // Operasyon ekle
    const addOperation = (stationId: number, operationId: number) => {
        const operation = operations.find((o) => o.id === operationId);
        if (operation) {
            const updatedStations = stations.map((station) => {
                if (station.stationId === stationId) {
                    return {
                        ...station,
                        operations: [
                            ...station.operations,
                            {
                                operationId: operation.id,
                                operationName: operation.name,
                                quality_control: operation.quality_control,
                            },
                        ],
                    };
                }
                return station;
            });
            setStations(updatedStations);
        }
    };

    // Operasyonu kaldır
    const removeOperation = (stationId: number, operationIndex: number) => {
        const updatedStations = stations.map((station) => {
            if (station.stationId === stationId) {
                const updatedOperations = station.operations.filter((_, index) => index !== operationIndex);
                return {
                    ...station,
                    operations: updatedOperations,
                };
            }
            return station;
        });
        setStations(updatedStations);
    };

    // Drag & Drop Handlers
    const handleStationDragStart = (e: React.DragEvent, stationId: string) => {
        setDraggedStation(stationId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleStationDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleStationDrop = (e: React.DragEvent, targetStationId: string) => {
        e.preventDefault();
        if (draggedStation && draggedStation !== targetStationId) {
            const draggedIndex = stations.findIndex((s) => s.id === draggedStation);
            const targetIndex = stations.findIndex((s) => s.id === targetStationId);

            const updatedStations = [...stations];
            const [draggedStationData] = updatedStations.splice(draggedIndex, 1);
            updatedStations.splice(targetIndex, 0, draggedStationData);

            setStations(updatedStations);
        }
        setDraggedStation(null);
    };

    const handleOperationDragStart = (e: React.DragEvent, stationId: string, operationIndex: number) => {
        e.stopPropagation();
        setDraggedOperation({ stationId, operationIndex });
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", `${stationId}-${operationIndex}`);
    };

    const handleOperationDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleOperationDrop = (e: React.DragEvent, targetStationId: string, targetOperationIndex: number) => {
        e.preventDefault();
        e.stopPropagation();

        if (draggedOperation) {
            const sourceStation = stations.find((s) => s.id === draggedOperation.stationId);
            const targetStation = stations.find((s) => s.id === targetStationId);

            if (sourceStation && targetStation) {
                if (draggedOperation.stationId === targetStationId) {
                    const updatedStations = stations.map((station) => {
                        if (station.id === targetStationId) {
                            const updatedOperations = [...station.operations];
                            const [draggedOperationData] = updatedOperations.splice(draggedOperation.operationIndex, 1);
                            updatedOperations.splice(targetOperationIndex, 0, draggedOperationData);
                            return { ...station, operations: updatedOperations };
                        }
                        return station;
                    });
                    setStations(updatedStations);
                } else {
                    const updatedStations = stations.map((station) => {
                        if (station.id === draggedOperation.stationId) {
                            const updatedOperations = station.operations.filter(
                                (_, index) => index !== draggedOperation.operationIndex
                            );
                            return { ...station, operations: updatedOperations };
                        }
                        if (station.id === targetStationId) {
                            const draggedOperationData = sourceStation.operations[draggedOperation.operationIndex];
                            const updatedOperations = [...station.operations];
                            updatedOperations.splice(targetOperationIndex, 0, draggedOperationData);
                            return { ...station, operations: updatedOperations };
                        }
                        return station;
                    });
                    setStations(updatedStations);
                }
            }
        }
        setDraggedOperation(null);
    };

    // Operasyon seçimi popover'ını aç/kapat
    const toggleOperationPopover = (stationId: number, open: boolean) => {
        setOpenOperationPopover((prev) => ({
            ...prev,
            [stationId]: open,
        }));
    };

    const onSubmit = async (data: ProductionPlanFormData) => {
        if (stations.some((station) => station.stationId === 0)) {
            toast.error("Lütfen tüm istasyonları seçin");
            return;
        }

        if (stations.some((station) => station.operations.length === 0)) {
            toast.error("Lütfen her istasyona en az bir operasyon ekleyin");
            return;
        }

        try {
            const productionPlanData = {
                name: data.name,
                vehicleId: data.vehicleId,
                isActive: data.isActive,
                stations: stations.map((station) => ({
                    stationId: station.stationId,
                    operations: station.operations.map((operation, index) => ({
                        operationId: operation.operationId,
                        sortOrder: index,
                    })),
                })),
            };

            await update.mutateAsync({ id: parseInt(resolvedParams.id), data: productionPlanData });

            toast.success("Üretim planı başarıyla güncellendi!", {
                description: `${data.name} planı güncellendi.`,
            });

            router.push("/production-plans");
        } catch (error: unknown) {
            console.error("Üretim planı güncelleme hatası:", error);
            const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu, lütfen tekrar deneyin.";
            toast.error("Üretim planı güncellenemedi", {
                description: errorMessage,
            });
        }
    };

    const isLoading =
        vehiclesLoading || stationsLoading || operationsLoading || isLoadingPlan || productionPlanQuery.isLoading;

    // Loading durumunda loading göster
    if (isLoading) {
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
                                    <BreadcrumbLink href="/production-plans">Üretim Planları</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden sm:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Üretim Planı Düzenle</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                    <div className="flex items-center justify-center h-64">
                        <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            <span>Üretim planı yükleniyor...</span>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (!productionPlan) {
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
                                    <BreadcrumbLink href="/production-plans">Üretim Planları</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden sm:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Üretim Planı Düzenle</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Üretim planı bulunamadı</h3>
                            <p className="text-muted-foreground mb-4">
                                Aradığınız üretim planı mevcut değil veya silinmiş olabilir.
                            </p>
                            <Button onClick={() => router.push("/production-plans")}>Üretim Planlarına Dön</Button>
                        </div>
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
                            <BreadcrumbItem className="hidden sm:block">
                                <BreadcrumbLink href="/production-plans">Üretim Planları</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden sm:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Üretim Planı Düzenle</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                {/* Başlık */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <Edit className="h-6 w-6" />
                        Üretim Planı Düzenle
                    </h1>
                </div>

                {/* Form */}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {/* Sol Kolon - Plan Bilgileri */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5" />
                                        Plan Bilgileri
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Plan Adı - Tam Genişlik */}
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Plan Adı *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Üretim planı adını giriniz" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Araç ve Plan Durumu - Yan Yana */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="vehicleId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Araç *</FormLabel>
                                                    <Select
                                                        onValueChange={(value) => field.onChange(parseInt(value))}
                                                        value={field.value > 0 ? field.value.toString() : ""}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="h-12">
                                                                <SelectValue placeholder="Araç seçiniz" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {vehicles.map((vehicle) => (
                                                                <SelectItem
                                                                    key={vehicle.id}
                                                                    value={vehicle.id.toString()}
                                                                >
                                                                    <div className="flex items-center gap-3 w-full py-1">
                                                                        <div className="w-8 h-8 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
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
                                                                        <div className="flex flex-col min-w-0 flex-1">
                                                                            <span className="font-medium truncate">
                                                                                {vehicle.name}
                                                                            </span>
                                                                            {vehicle.brand_model && (
                                                                                <span className="text-xs text-muted-foreground truncate">
                                                                                    {vehicle.brand_model}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="isActive"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Plan Durumu</FormLabel>
                                                    <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/50">
                                                        <div className="space-y-0.5">
                                                            <div className="text-sm font-medium">Aktif Plan</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                Üretim planının aktif olup olmadığını belirler
                                                            </div>
                                                        </div>
                                                        <FormControl>
                                                            <Switch
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Sağ Kolon - İstasyon Seçimi */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5" />
                                        İstasyon Seçimi
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <FormLabel>Hangi istasyonlarda üretim yapılacak?</FormLabel>
                                        <Select
                                            onValueChange={(value) => {
                                                const stationId = parseInt(value);
                                                if (!selectedStations.includes(stationId)) {
                                                    setSelectedStations([...selectedStations, stationId]);
                                                }
                                            }}
                                            value=""
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="İstasyon seçin" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {stationsData.map((stationData: any) => (
                                                    <SelectItem
                                                        key={stationData.id}
                                                        value={stationData.id.toString()}
                                                        disabled={selectedStations.includes(stationData.id)}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="w-4 h-4" />
                                                            <span>{stationData.name}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        {/* Seçilen İstasyonlar */}
                                        {selectedStations.length > 0 && (
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium">Seçilen İstasyonlar</Label>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedStations.map((stationId, index) => {
                                                        const stationData = stationsData.find(
                                                            (s: any) => s.id === stationId
                                                        );
                                                        return (
                                                            <Badge
                                                                key={stationId}
                                                                variant="secondary"
                                                                className="flex items-center gap-1"
                                                            >
                                                                <span>
                                                                    {index + 1}. {stationData?.name}
                                                                </span>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const updatedStations = stations.filter(
                                                                            (s) => s.stationId !== stationId
                                                                        );
                                                                        setStations(updatedStations);
                                                                        setSelectedStations(
                                                                            selectedStations.filter(
                                                                                (id) => id !== stationId
                                                                            )
                                                                        );
                                                                    }}
                                                                    className="h-4 w-4 p-0 ml-1 hover:bg-red-100"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            </Badge>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* İstasyonlar ve Operasyonlar */}
                        {form.watch("vehicleId") > 0 && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold">İstasyonlar ve Operasyonlar</h2>
                                    <Button
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-700"
                                        disabled={
                                            update.isPending ||
                                            stations.some((station) => station.stationId === 0) ||
                                            stations.some((station) => station.operations.length === 0)
                                        }
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {update.isPending ? "Güncelleniyor..." : "Değişiklikleri Kaydet"}
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {stations.map((station, stationIndex) => (
                                        <Card
                                            key={station.id}
                                            className={`transition-all ${
                                                draggedStation === station.id ? "opacity-50" : ""
                                            }`}
                                            draggable
                                            onDragStart={(e) => handleStationDragStart(e, station.id)}
                                            onDragOver={handleStationDragOver}
                                            onDrop={(e) => handleStationDrop(e, station.id)}
                                        >
                                            <CardHeader className="pb-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                                                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                                                            {stationIndex + 1}
                                                        </div>
                                                        <div>
                                                            <CardTitle className="text-lg">
                                                                {station.stationName}
                                                            </CardTitle>
                                                            <p className="text-sm text-muted-foreground">
                                                                Sürükleyerek sıralamayı değiştirin
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {/* Operasyonlar */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-sm font-medium">Operasyonlar</Label>
                                                        <div className="flex items-center gap-2">
                                                            <Popover
                                                                open={openOperationPopover[station.stationId] || false}
                                                                onOpenChange={(open) =>
                                                                    toggleOperationPopover(station.stationId, open)
                                                                }
                                                            >
                                                                <PopoverTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        role="combobox"
                                                                        aria-expanded={
                                                                            openOperationPopover[station.stationId]
                                                                        }
                                                                        className="w-48 justify-between"
                                                                    >
                                                                        <span>Operasyon seçin</span>
                                                                        <Wrench className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-48 p-0">
                                                                    <Command>
                                                                        <CommandInput placeholder="Operasyon ara..." />
                                                                        <CommandList>
                                                                            <CommandEmpty>
                                                                                Operasyon bulunamadı.
                                                                            </CommandEmpty>
                                                                            <CommandGroup>
                                                                                {operations.map((operation) => {
                                                                                    const isSelected =
                                                                                        station.operations.some(
                                                                                            (op) =>
                                                                                                op.operationId ===
                                                                                                operation.id
                                                                                        );
                                                                                    return (
                                                                                        <CommandItem
                                                                                            key={operation.id}
                                                                                            value={operation.name}
                                                                                            disabled={isSelected}
                                                                                            onSelect={() => {
                                                                                                if (!isSelected) {
                                                                                                    addOperation(
                                                                                                        station.stationId,
                                                                                                        operation.id
                                                                                                    );
                                                                                                    toggleOperationPopover(
                                                                                                        station.stationId,
                                                                                                        false
                                                                                                    );
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            <div className="flex items-center gap-2 w-full">
                                                                                                <Wrench className="w-4 h-4" />
                                                                                                <span>
                                                                                                    {operation.name}
                                                                                                </span>
                                                                                                {isSelected && (
                                                                                                    <span className="ml-auto text-xs text-muted-foreground">
                                                                                                        Ekli
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

                                                    {station.operations.length === 0 ? (
                                                        <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                                                            <Wrench className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                            <p className="text-sm">Henüz operasyon eklenmedi</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {station.operations.map((operation, operationIndex) => (
                                                                <div
                                                                    key={operationIndex}
                                                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-move transition-colors ${
                                                                        operation.quality_control
                                                                            ? "bg-orange-50 border-orange-200 hover:bg-orange-100"
                                                                            : "bg-green-50 border-green-200 hover:bg-green-100"
                                                                    }`}
                                                                    draggable
                                                                    onDragStart={(e) =>
                                                                        handleOperationDragStart(
                                                                            e,
                                                                            station.id,
                                                                            operationIndex
                                                                        )
                                                                    }
                                                                    onDragOver={handleOperationDragOver}
                                                                    onDrop={(e) =>
                                                                        handleOperationDrop(
                                                                            e,
                                                                            station.id,
                                                                            operationIndex
                                                                        )
                                                                    }
                                                                    onDragEnd={() => setDraggedOperation(null)}
                                                                >
                                                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                                                    <div
                                                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                                                                            operation.quality_control
                                                                                ? "bg-orange-500"
                                                                                : "bg-green-500"
                                                                        }`}
                                                                    >
                                                                        {operationIndex + 1}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <Wrench
                                                                                className={`w-4 h-4 ${
                                                                                    operation.quality_control
                                                                                        ? "text-orange-600"
                                                                                        : "text-green-600"
                                                                                }`}
                                                                            />
                                                                            <span className="font-medium">
                                                                                {operation.operationName}
                                                                            </span>
                                                                            {operation.quality_control && (
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className="text-xs bg-orange-100 text-orange-700 border-orange-300"
                                                                                >
                                                                                    Kalite Kontrol
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            removeOperation(
                                                                                station.stationId,
                                                                                operationIndex
                                                                            );
                                                                        }}
                                                                        className="text-red-600 hover:text-red-700 h-8 w-8 p-0 ml-auto"
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Alt Butonlar */}
                        <div className="flex flex-col sm:flex-row justify-end gap-4 sm:space-x-4 sm:space-y-0">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() => router.push("/production-plans")}
                            >
                                İptal
                            </Button>
                            <Button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                                disabled={
                                    update.isPending ||
                                    stations.some((station) => station.stationId === 0) ||
                                    stations.some((station) => station.operations.length === 0)
                                }
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {update.isPending ? "Güncelleniyor..." : "Değişiklikleri Kaydet"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </>
    );
}
