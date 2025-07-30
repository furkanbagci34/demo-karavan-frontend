"use client";

import { useState, useEffect } from "react";
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
import { Car, MapPin, Wrench, Trash2, X, GripVertical, Save } from "lucide-react";
import { useVehicles } from "@/hooks/api/useVehicles";
import { useStations } from "@/hooks/api/useStations";
import { useOperations } from "@/hooks/api/useOperations";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

export default function ManufacturePage() {
    const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
    const [selectedStations, setSelectedStations] = useState<number[]>([]);
    const [stations, setStations] = useState<Station[]>([]);
    const [draggedStation, setDraggedStation] = useState<string | null>(null);
    const [draggedOperation, setDraggedOperation] = useState<{ stationId: string; operationIndex: number } | null>(
        null
    );

    const [openOperationPopover, setOpenOperationPopover] = useState<{ [stationId: number]: boolean }>({});

    // API hooks
    const { vehicles, isLoading: vehiclesLoading } = useVehicles();
    const { get: stationsQuery, isLoading: stationsLoading } = useStations();
    const { operations, isLoading: operationsLoading } = useOperations();

    const stationsData = stationsQuery.data || [];

    // Seçilen istasyonlar değiştiğinde operasyonları güncelle
    useEffect(() => {
        if (selectedStations.length > 0) {
            const newStations: Station[] = [];
            selectedStations.forEach((stationId, index) => {
                const stationData = stationsData.find((s) => s.id === stationId);

                // Mevcut istasyonun operasyonlarını koru
                const existingStation = stations.find((s) => s.stationId === stationId);

                newStations.push({
                    id: `station-${index}`,
                    stationId: stationId,
                    stationName: stationData ? stationData.name : "",
                    operations: existingStation ? existingStation.operations : [],
                });
            });
            setStations(newStations);
        } else {
            setStations([]);
        }
    }, [selectedStations, stationsData]);

    // Araç seçildiğinde
    const handleVehicleSelect = (vehicleId: string) => {
        const vehicle = vehicles.find((v) => v.id === parseInt(vehicleId));
        if (vehicle) {
            setSelectedVehicle(parseInt(vehicleId));
        }
    };

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
                // Aynı istasyon içinde operasyon taşıma
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
                    // Farklı istasyonlar arası operasyon taşıma
                    const updatedStations = stations.map((station) => {
                        if (station.id === draggedOperation.stationId) {
                            // Remove from source
                            const updatedOperations = station.operations.filter(
                                (_, index) => index !== draggedOperation.operationIndex
                            );
                            return { ...station, operations: updatedOperations };
                        }
                        if (station.id === targetStationId) {
                            // Add to target
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

    // Reçeteyi kaydet
    const handleSaveRecipe = () => {
        if (!selectedVehicle) {
            toast.error("Lütfen bir araç seçin");
            return;
        }

        if (stations.some((station) => station.stationId === 0)) {
            toast.error("Lütfen tüm istasyonları seçin");
            return;
        }

        if (stations.some((station) => station.operations.length === 0)) {
            toast.error("Lütfen her istasyona en az bir operasyon ekleyin");
            return;
        }

        if (stations.some((station) => station.operations.some((op) => op.operationId === 0))) {
            toast.error("Lütfen tüm operasyonları seçin");
            return;
        }

        const recipe = {
            vehicleId: selectedVehicle,
            vehicleName: vehicles.find((v) => v.id === selectedVehicle)?.name,
            stations: stations,
        };

        console.log("Üretim Reçetesi:", recipe);
        toast.success("Üretim reçetesi başarıyla oluşturuldu!", {
            description: `${recipe.vehicleName} için ${stations.length} istasyonlu reçete kaydedildi.`,
        });
    };

    // Operasyon seçimi popover'ını aç/kapat
    const toggleOperationPopover = (stationId: number, open: boolean) => {
        setOpenOperationPopover((prev) => ({
            ...prev,
            [stationId]: open,
        }));
    };

    const isLoading = vehiclesLoading || stationsLoading || operationsLoading;

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
                {/* Başlık */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl sm:text-3xl font-bold">Üretim Planı Hazırlama</h1>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                        <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                            Yükleniyor...
                        </div>
                    </div>
                ) : (
                    <div className="w-full">
                        {/* Araç ve İstasyon Sayısı Seçimi */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {/* Araç Seçimi */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Car className="h-5 w-5" />
                                        Araç Seçimi
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <Label>Araç</Label>
                                        <Select
                                            onValueChange={handleVehicleSelect}
                                            value={selectedVehicle?.toString() || ""}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Araç seçiniz" />
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
                                </CardContent>
                            </Card>

                            {/* İstasyon Seçimi */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5" />
                                        İstasyon Seçimi
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <Label>Hangi istasyonlarda üretim yapılacak?</Label>
                                        <Select
                                            onValueChange={(value) => {
                                                const stationId = parseInt(value);
                                                if (!selectedStations.includes(stationId)) {
                                                    setSelectedStations([...selectedStations, stationId]);
                                                }
                                            }}
                                            value=""
                                            disabled={!selectedVehicle}
                                        >
                                            <SelectTrigger>
                                                <SelectValue
                                                    placeholder={selectedVehicle ? "İstasyon seçin" : "Önce araç seçin"}
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {stationsData.map((stationData) => (
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
                                                            (s) => s.id === stationId
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
                                                                        // İstasyonu kaldırmadan önce operasyonları koru
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
                        {selectedVehicle && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold">İstasyonlar ve Operasyonlar</h2>
                                    <Button
                                        onClick={handleSaveRecipe}
                                        className="bg-green-600 hover:bg-green-700"
                                        disabled={
                                            stations.some((station) => station.stationId === 0) ||
                                            stations.some((station) => station.operations.length === 0) ||
                                            stations.some((station) =>
                                                station.operations.some((op) => op.operationId === 0)
                                            )
                                        }
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        Reçeteyi Kaydet
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {stations.map((station, stationIndex) => {
                                        return (
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
                                                                    open={
                                                                        openOperationPopover[station.stationId] || false
                                                                    }
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

                                                    {/* Seçilen İstasyon ve Operasyonlar */}
                                                    {(station.stationName ||
                                                        station.operations.some((op) => op.operationName)) && (
                                                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t">
                                                            {station.stationName && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    <MapPin className="h-3 w-3 mr-1" />
                                                                    {station.stationName}
                                                                </Badge>
                                                            )}
                                                            {station.operations.map(
                                                                (operation, opIndex) =>
                                                                    operation.operationName && (
                                                                        <Badge
                                                                            key={opIndex}
                                                                            variant="outline"
                                                                            className="text-xs"
                                                                        >
                                                                            <Wrench className="h-3 w-3 mr-1" />
                                                                            {operation.operationName}
                                                                        </Badge>
                                                                    )
                                                            )}
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
