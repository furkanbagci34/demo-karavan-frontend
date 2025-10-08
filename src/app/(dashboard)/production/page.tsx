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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Factory,
    Play,
    Pause,
    CheckCircle,
    Clock,
    AlertTriangle,
    MapPin,
    Timer,
    Loader2,
    Settings,
    RefreshCw,
    Maximize,
    Minimize,
} from "lucide-react";
import React, { useState } from "react";
import { ProductionOperation, ProductionStatus } from "@/lib/api/types";
import { useProduction } from "@/hooks/api/useProduction";
import { PauseOperationModal } from "@/components/production/PauseOperationModal";
import { StartOperationModal } from "@/components/production/StartOperationModal";
import { CompleteOperationModal } from "@/components/production/CompleteOperationModal";
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
                badgeColor: "bg-blue-100 text-blue-800",
                rowColor: "border-l-4 border-l-blue-500 bg-blue-50",
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
        case "awaiting_quality_control":
            return {
                badgeColor: "bg-purple-100 text-purple-800",
                rowColor: "border-l-4 border-l-purple-500 bg-purple-50",
                icon: Clock,
                text: "Kalite Kontrol Bekleniyor",
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
    isResuming?: boolean;
    isCompleting?: boolean;
}> = ({ operation, onStart, onPause, onComplete, isLoading = false, isPausing = false, isCompleting = false }) => {
    const statusConfig = getStatusConfig(operation.status);
    const StatusIcon = statusConfig.icon;

    return (
        <div className={`border rounded-lg p-4 ${statusConfig.rowColor} flex gap-4`}>
            {/* Production Number Badge - En solda, card'ın başlangıcında ortalı */}
            {operation.production_number && (
                <div className="flex items-center justify-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg flex-shrink-0">
                        {operation.production_number}
                    </div>
                </div>
            )}
            
            {/* Ana İçerik */}
            <div className="flex-1">
                {/* Header Section - Always visible */}
                <div className="flex items-center gap-3 mb-4">
                    <StatusIcon className="h-4 w-4 text-gray-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm text-gray-900 truncate">
                                {operation.name}
                                {operation.offer_number && ` - ${operation.offer_number}`}
                                {operation.customer_name && ` (${operation.customer_name})`}
                            </h3>
                            {/* Durum kutucuğu */}
                            <span
                                className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.badgeColor} self-start`}
                            >
                                {statusConfig.text}
                            </span>
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                            {operation.vehicle_name} • İstasyon: {operation.station_name}
                        </div>
                    </div>
                </div>

                {/* Stats and Actions Section - Responsive layout */}
                <div className="flex flex-col lg:flex-row gap-4">
                {/* Stats Section - Grid layout for better tablet view */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 flex-1">
                    {/* Geçen Süre - Kutucuk içinde */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <div className="text-xs text-gray-500">Geçen Süre</div>
                        </div>
                        <div className="font-semibold text-sm">{formatTime(operation.elapsed_time)}</div>
                    </div>

                    {/* Hedef Süre - Kutucuk içinde */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Timer className="h-4 w-4 text-gray-500" />
                            <div className="text-xs text-gray-500">Hedef Süre</div>
                        </div>
                        <div className="font-semibold text-sm">
                            {operation.target_duration_formatted || formatTime(operation.target_time)}
                        </div>
                    </div>

                    {/* İlerleme - Kutucuk içinde */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center col-span-2 lg:col-span-1">
                        <div className="text-xs text-gray-500 mb-1">İlerleme</div>
                        <div className="font-semibold text-sm">{operation.progress}%</div>
                    </div>
                </div>

                {/* Action Buttons - Responsive button layout */}
                <div className="flex flex-row sm:flex-row gap-2 lg:flex-col xl:flex-row">
                    {/* Başlat/Devam Et Butonu */}
                    <Button
                        size="lg"
                        onClick={() => onStart(operation.id)}
                        className={`flex-1 sm:w-32 lg:w-full xl:w-32 px-6 py-4 text-base font-medium h-12 ${
                            operation.start_time
                                ? operation.status === "in_progress"
                                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                                    : "bg-blue-600 hover:bg-blue-700 text-white"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                        disabled={
                            isLoading ||
                            operation.status === "completed" ||
                            operation.status === "in_progress" ||
                            operation.status === "awaiting_quality_control" ||
                            (operation.start_time ? operation.status !== "paused" : false)
                        }
                    >
                        {isLoading && (operation.status === "pending" || operation.start_time) ? (
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        ) : (
                            <Play className="h-5 w-5 mr-2" />
                        )}
                        {operation.start_time ? "Devam Et" : "Başlat"}
                    </Button>

                    {/* Durdur Butonu */}
                    <Button
                        size="lg"
                        onClick={() => onPause(operation.id)}
                        className="flex-1 sm:w-32 lg:w-full xl:w-32 bg-red-600 hover:bg-red-700 text-white px-6 py-4 text-base font-medium h-12"
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
                        className="flex-1 sm:w-32 lg:w-full xl:w-32 bg-green-600 hover:bg-green-700 text-white px-6 py-4 text-base font-medium h-12"
                        disabled={
                            isLoading ||
                            operation.status === "completed" ||
                            operation.status === "pending" ||
                            operation.status === "awaiting_quality_control"
                        }
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
        </div>
    );
};

export default function ProductionPage() {
    const {
        operations,
        userStations,
        isLoading,
        isLoadingStations,
        startOperation,
        pauseOperation,
        resumeOperation,
        completeOperation,
        isStarting,
        isPausing,
        isResuming,
        isCompleting,
    } = useProduction();

    // Number filtreleme state'i
    const [selectedNumber, setSelectedNumber] = useState<number | null>(null);

    // Mevcut number'ları al
    const availableNumbers = Array.from(new Set(operations.map(op => op.production_number).filter(Boolean))).sort((a, b) => (a || 0) - (b || 0));

    // Filtrelenmiş operasyonlar
    const filteredOperations = selectedNumber 
        ? operations.filter(op => op.production_number === selectedNumber)
        : operations;

    // Modal states
    const [showStartModal, setShowStartModal] = useState(false);
    const [showPauseModal, setShowPauseModal] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [selectedOperation, setSelectedOperation] = useState<ProductionOperation | null>(null);

    // Fullscreen state
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Operation durumunu güncelle - start_time varsa resume, yoksa start
    const handleStart = async (id: number) => {
        const operation = operations.find((op) => op.id === id);
        if (!operation) return;

        try {
            if (operation.start_time) {
                // Eğer operasyon daha önce başlamışsa, devam ettir
                await resumeOperation(id);
            } else if (operation.status === "pending") {
                // Eğer operasyon hiç başlamamışsa, başlat modalını aç
                setSelectedOperation(operation);
                setShowStartModal(true);
            }
        } catch (error) {
            console.error("Operasyon işlemi hatası:", error);
        }
    };

    const handlePause = (id: number) => {
        const operation = operations.find((op) => op.id === id);
        if (operation) {
            setSelectedOperation(operation);
            setShowPauseModal(true);
        }
    };

    const handleComplete = (id: number) => {
        const operation = operations.find((op) => op.id === id);
        if (operation) {
            setSelectedOperation(operation);
            setShowCompleteModal(true);
        }
    };

    const handleConfirmComplete = async () => {
        if (!selectedOperation) return;

        try {
            await completeOperation(selectedOperation.id);
            setShowCompleteModal(false);
            setSelectedOperation(null);
        } catch (error) {
            console.error("Operasyon tamamlama hatası:", error);
        }
    };

    // Modal handlers
    const handleStartWithWorker = async (workerIds: number[], workerNames: string[]) => {
        if (!selectedOperation) return;

        try {
            await startOperation(selectedOperation.id, workerIds);
            toast.success("Operasyon başlatıldı", {
                description: `${selectedOperation.name} operasyonu ${workerNames.join(", ")} tarafından başlatıldı.`,
            });
        } catch (error) {
            console.error("Operasyon başlatma hatası:", error);
        }
    };

    const handlePauseWithReason = async (reason: string) => {
        if (!selectedOperation) return;

        try {
            await pauseOperation(selectedOperation.id, reason);
            toast.success("Operasyon durduruldu", {
                description: `${selectedOperation.name} operasyonu durduruldu. Neden: ${reason}`,
            });
        } catch (error) {
            console.error("Operasyon durdurma hatası:", error);
        }
    };

    // Refresh fonksiyonu
    const handleRefresh = () => {
        window.location.reload();
    };

    // Fullscreen toggle fonksiyonu
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b">
                <div className="flex items-center gap-2 px-4 flex-1">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden sm:block">
                                <BreadcrumbLink href="/dashboard">Anasayfa</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden sm:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Üretim</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 px-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        className="flex items-center gap-2"
                        title="Yenile"
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span className="hidden sm:inline">Yenile</span>
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleFullscreen}
                        className="flex items-center gap-2"
                        title={isFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran"}
                    >
                        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                        <span className="hidden sm:inline">{isFullscreen ? "Çık" : "Tam Ekran"}</span>
                    </Button>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <Factory className="h-6 w-6" />
                        Üretim
                    </h1>
                    <div className="flex items-center gap-2">
                        {isLoadingStations ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>İstasyonlar yükleniyor...</span>
                            </div>
                        ) : userStations.length > 0 ? (
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-gray-700">Listelenen:</span>
                                <div className="flex flex-wrap gap-1">
                                    {userStations.map((station) => (
                                        <span
                                            key={station.id}
                                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                        >
                                            {station.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-red-600">
                                <AlertTriangle className="h-4 w-4" />
                                <span>Yetkili istasyon bulunamadı</span>
                            </div>
                        )}
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

                {/* Number Filtreleme Butonları */}
                {!isLoading && availableNumbers.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-sm font-medium text-gray-700">Numara Filtresi:</h3>
                            <div className="flex items-center gap-2">
                                {/* Tümünü Göster Butonu */}
                                <button
                                    onClick={() => setSelectedNumber(null)}
                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                        selectedNumber === null
                                            ? 'bg-gray-800 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    Tümü
                                </button>
                                
                                {/* Number Butonları */}
                                {availableNumbers.map((number) => (
                                    <button
                                        key={number}
                                        onClick={() => setSelectedNumber(number || null)}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                                            selectedNumber === number
                                                ? 'bg-blue-100 text-blue-600 border-2 border-blue-300'
                                                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                        }`}
                                    >
                                        {number}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {/* Filtreleme Sonucu Bilgisi */}
                        {selectedNumber && (
                            <div className="text-sm text-gray-600 mb-3">
                                <span className="font-medium">Numara {selectedNumber}</span> için {filteredOperations.length} operasyon gösteriliyor
                            </div>
                        )}
                    </div>
                )}

                {/* Operations List */}
                {!isLoading && (
                    <div className="space-y-3">
                        {filteredOperations.map((operation) => (
                            <ProductionOperationCard
                                key={operation.id}
                                operation={operation}
                                onStart={handleStart}
                                onPause={handlePause}
                                onComplete={handleComplete}
                                isLoading={isStarting || isPausing || isResuming || isCompleting}
                                isPausing={isPausing}
                                isResuming={isResuming}
                                isCompleting={isCompleting}
                            />
                        ))}
                    </div>
                )}

                {/* Boş Durum */}
                {!isLoading && filteredOperations.length === 0 && (
                    <Card>
                        <CardContent className="p-8">
                            <div className="text-center">
                                <Factory className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                {selectedNumber ? (
                                    <>
                                        <h3 className="text-lg font-semibold mb-2">Numara {selectedNumber} için operasyon bulunamadı</h3>
                                        <p className="text-muted-foreground mb-4">
                                            Seçilen numara için aktif operasyon bulunmuyor.
                                        </p>
                                        <button
                                            onClick={() => setSelectedNumber(null)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Tüm Operasyonları Göster
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-lg font-semibold mb-2">Aktif operasyon bulunamadı</h3>
                                        <p className="text-muted-foreground">
                                            Şu anda size atanmış aktif bir üretim operasyonu bulunmamaktadır.
                                        </p>
                                    </>
                                )}
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

            <CompleteOperationModal
                isOpen={showCompleteModal}
                onClose={() => {
                    setShowCompleteModal(false);
                    setSelectedOperation(null);
                }}
                onConfirm={handleConfirmComplete}
                operationName={selectedOperation?.name || ""}
                isCompleting={isCompleting}
                hasQualityControl={selectedOperation?.quality_control || false}
            />
        </>
    );
}
