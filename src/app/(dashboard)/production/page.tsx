"use client";

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
import { Progress } from "@/components/ui/progress";
import {
    Factory,
    Play,
    Pause,
    CheckCircle,
    Clock,
    AlertTriangle,
    Car,
    MapPin,
    Timer,
    Loader2,
    Settings,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { ProductionOperation, ProductionStatus } from "@/lib/api/types";
import { useProduction } from "@/hooks/api/useProduction";
import { PauseOperationModal } from "@/components/production/PauseOperationModal";
import { StartOperationModal } from "@/components/production/StartOperationModal";
import { toast } from "sonner";

// Status renk ve icon helper'ları - fotoğraftaki gibi satır renkleri
const getStatusConfig = (status: ProductionStatus) => {
    switch (status) {
        case "pending":
            return {
                badgeColor: "bg-gray-100 text-gray-800",
                rowColor: "border-l-4 border-l-gray-400 bg-gray-50",
                icon: Clock,
                text: "Bekliyor",
            };
        case "in_progress":
            return {
                badgeColor: "bg-orange-100 text-orange-800",
                rowColor: "border-l-4 border-l-orange-500 bg-orange-50",
                icon: Settings,
                text: "Devam Ediyor",
            };
        case "completed":
            return {
                badgeColor: "bg-green-100 text-green-800",
                rowColor: "border-l-4 border-l-green-500 bg-green-50",
                icon: CheckCircle,
                text: "Tamamlandı",
            };
        case "paused":
            return {
                badgeColor: "bg-red-100 text-red-800",
                rowColor: "border-l-4 border-l-red-500 bg-red-50",
                icon: Pause,
                text: "Durduruldu",
            };
        case "error":
            return {
                badgeColor: "bg-red-100 text-red-800",
                rowColor: "border-l-4 border-l-red-500 bg-red-50",
                icon: AlertTriangle,
                text: "Hata",
            };
        default:
            return {
                badgeColor: "bg-gray-100 text-gray-800",
                rowColor: "border-l-4 border-l-gray-400 bg-gray-50",
                icon: Clock,
                text: "Bilinmeyen",
            };
    }
};

// Zaman formatı helper'ı
const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}:${mins.toString().padStart(2, "0")}` : `${mins} dk`;
};

// Operation Card Component - Liste formatında fotoğraftaki gibi
const ProductionOperationCard: React.FC<{
    operation: ProductionOperation;
    onStart: (id: number) => void;
    onPause: (id: number) => void;
    onComplete: (id: number) => void;
    isLoading?: boolean;
    isPausing?: boolean;
    isCompleting?: boolean;
}> = ({ operation, onStart, onPause, onComplete, isLoading = false, isPausing = false, isCompleting = false }) => {
    const statusConfig = getStatusConfig(operation.status);
    const StatusIcon = statusConfig.icon;

    return (
        <div className={`border rounded-lg p-4 ${statusConfig.rowColor}`}>
            <div className="flex items-center gap-4">
                {/* Sol - Numara ve Operasyon Bilgisi */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold">
                        {operation.id}
                    </div>
                    <StatusIcon className="h-4 w-4 text-gray-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm text-gray-900 truncate">{operation.name}</h3>
                            {/* Durum kutucuğu */}
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.badgeColor}`}>
                                {statusConfig.text}
                            </span>
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                            {operation.plan_name} • {operation.vehicle_name} • İstasyon: {operation.station_name}
                        </div>
                    </div>
                </div>

                {/* Geçen Süre - Kutucuk içinde */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center min-w-[100px]">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <div className="text-xs text-gray-500">Geçen Süre</div>
                    </div>
                    <div className="font-semibold text-sm">{formatTime(operation.elapsed_time)}</div>
                </div>

                {/* Hedef Süre - Kutucuk içinde */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center min-w-[100px]">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <Timer className="h-4 w-4 text-gray-500" />
                        <div className="text-xs text-gray-500">Hedef Süre</div>
                    </div>
                    <div className="font-semibold text-sm">{formatTime(operation.target_time)}</div>
                </div>

                {/* İlerleme - Kutucuk içinde */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center min-w-[100px]">
                    <div className="text-xs text-gray-500 mb-1">İlerleme</div>
                    <div className="font-semibold text-sm">{operation.progress}%</div>
                </div>

                {/* Action Buttons - Fotoğraftaki gibi her satırda 3 buton */}
                <div className="flex gap-2">
                    {/* Başlat Butonu */}
                    <Button
                        size="lg"
                        onClick={() => onStart(operation.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-base font-medium h-12"
                        disabled={isLoading || operation.status === "completed" || operation.status === "in_progress"}
                    >
                        {isLoading && (operation.status === "pending" || operation.status === "paused") ? (
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        ) : (
                            <Play className="h-5 w-5 mr-2" />
                        )}
                        Başlat
                    </Button>

                    {/* Durdur Butonu */}
                    <Button
                        size="lg"
                        onClick={() => onPause(operation.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-base font-medium h-12"
                        disabled={isLoading || operation.status !== "in_progress"}
                    >
                        {isLoading && operation.status === "in_progress" && isPausing ? (
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        ) : (
                            <Pause className="h-5 w-5 mr-2" />
                        )}
                        Durdur
                    </Button>

                    {/* Tamamla Butonu */}
                    <Button
                        size="lg"
                        onClick={() => onComplete(operation.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-base font-medium h-12"
                        disabled={isLoading || operation.status === "completed" || operation.status === "pending"}
                    >
                        {isLoading &&
                        (operation.status === "in_progress" || operation.status === "paused") &&
                        isCompleting ? (
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        ) : (
                            <CheckCircle className="h-5 w-5 mr-2" />
                        )}
                        Tamamla
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default function ProductionPage() {
    const {
        operations,
        isLoading,
        startOperation,
        pauseOperation,
        completeOperation,
        isStarting,
        isPausing,
        isCompleting,
    } = useProduction();

    // Modal states
    const [showStartModal, setShowStartModal] = useState(false);
    const [showPauseModal, setShowPauseModal] = useState(false);
    const [selectedOperation, setSelectedOperation] = useState<ProductionOperation | null>(null);

    // Operation durumunu güncelle
    const handleStart = (id: number) => {
        const operation = operations.find((op) => op.id === id);
        if (operation) {
            setSelectedOperation(operation);
            setShowStartModal(true);
        }
    };

    const handlePause = (id: number) => {
        const operation = operations.find((op) => op.id === id);
        if (operation) {
            setSelectedOperation(operation);
            setShowPauseModal(true);
        }
    };

    const handleComplete = async (id: number) => {
        try {
            await completeOperation(id);
        } catch (error) {
            console.error("Operasyon tamamlama hatası:", error);
        }
    };

    // Modal handlers
    const handleStartWithWorker = async (workerIds: number[], workerNames: string[]) => {
        if (!selectedOperation) return;

        try {
            await startOperation(selectedOperation.id);
            toast.success("Operasyon başlatıldı", {
                description: `${selectedOperation.name} operasyonu ${workerNames.join(", ")} tarafından başlatıldı.`,
            });
        } catch (error) {
            console.error("Operasyon başlatma hatası:", error);
        }
    };

    const handlePauseWithReason = async (reason: string, description: string) => {
        if (!selectedOperation) return;

        try {
            await pauseOperation(selectedOperation.id);
            toast.success("Operasyon durduruldu", {
                description: `${selectedOperation.name} operasyonu durduruldu. Neden: ${reason}`,
            });
        } catch (error) {
            console.error("Operasyon durdurma hatası:", error);
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
                            <BreadcrumbItem>
                                <BreadcrumbPage>Üretim Ekranı</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <Factory className="h-6 w-6" />
                        Üretim Ekranı
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>İstasyon: Montaj İstasyonu</span>
                    </div>
                </div>

                {/* Operasyonlarım Başlığı */}
                <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <h2 className="text-lg font-semibold">Operasyonlarım</h2>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, index) => (
                            <div key={index} className="border rounded-lg p-4 bg-gray-50 border-l-4 border-l-gray-400">
                                <div className="flex items-center justify-center h-16">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Operations List */}
                {!isLoading && (
                    <div className="space-y-3">
                        {operations.map((operation) => (
                            <ProductionOperationCard
                                key={operation.id}
                                operation={operation}
                                onStart={handleStart}
                                onPause={handlePause}
                                onComplete={handleComplete}
                                isLoading={isStarting || isPausing || isCompleting}
                                isPausing={isPausing}
                                isCompleting={isCompleting}
                            />
                        ))}
                    </div>
                )}

                {/* Boş Durum */}
                {!isLoading && operations.length === 0 && (
                    <Card>
                        <CardContent className="p-8">
                            <div className="text-center">
                                <Factory className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Aktif operasyon bulunamadı</h3>
                                <p className="text-muted-foreground">
                                    Şu anda size atanmış aktif bir üretim operasyonu bulunmamaktadır.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Modals */}
            <StartOperationModal
                isOpen={showStartModal}
                onClose={() => {
                    setShowStartModal(false);
                    setSelectedOperation(null);
                }}
                onStartOperation={handleStartWithWorker}
                operationName={selectedOperation?.name || ""}
                operationId={selectedOperation?.id || 0}
            />

            <PauseOperationModal
                isOpen={showPauseModal}
                onClose={() => {
                    setShowPauseModal(false);
                    setSelectedOperation(null);
                }}
                onPauseOperation={handlePauseWithReason}
                operationName={selectedOperation?.name || ""}
                operationId={selectedOperation?.id || 0}
            />
        </>
    );
}
