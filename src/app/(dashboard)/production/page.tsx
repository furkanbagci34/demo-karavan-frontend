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
import { OfferProductsModal } from "@/components/production/OfferProductsModal";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

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
    onOfferNumberClick: (offerNumber: string) => void;
    isLoading?: boolean;
    isPausing?: boolean;
    isResuming?: boolean;
    isCompleting?: boolean;
}> = ({
    operation,
    onStart,
    onPause,
    onComplete,
    onOfferNumberClick,
    isLoading = false,
    isPausing = false,
    isCompleting = false,
}) => {
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
                                {operation.offer_number && (
                                    <>
                                        {" - "}
                                        <button
                                            onClick={() => onOfferNumberClick(operation.offer_number!)}
                                            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                                        >
                                            {operation.offer_number}
                                        </button>
                                    </>
                                )}
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
    const queryClient = useQueryClient();
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

    // Filtreleme state'leri
    const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
    const [selectedStationId, setSelectedStationId] = useState<number | null>(null);

    // Mevcut number'ları al
    const availableNumbers = Array.from(new Set(operations.map((op) => op.production_number).filter(Boolean))).sort(
        (a, b) => (a || 0) - (b || 0)
    );

    // Filtrelenmiş operasyonlar - hem numara hem istasyon
    const filteredOperations = operations.filter((op) => {
        const matchesNumber = selectedNumber ? op.production_number === selectedNumber : true;
        const matchesStation = selectedStationId
            ? op.station_name === userStations.find((s) => s.id === selectedStationId)?.name
            : true;
        return matchesNumber && matchesStation;
    });

    // Modal states
    const [showStartModal, setShowStartModal] = useState(false);
    const [showPauseModal, setShowPauseModal] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [selectedOperation, setSelectedOperation] = useState<ProductionOperation | null>(null);

    // Offer products modal state
    const [showOfferProductsModal, setShowOfferProductsModal] = useState(false);
    const [selectedOfferNumber, setSelectedOfferNumber] = useState<string | null>(null);

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
            // Rapor cache'ini temizle
            queryClient.invalidateQueries({ queryKey: ["reports"] });
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
            // Rapor cache'ini temizle
            queryClient.invalidateQueries({ queryKey: ["reports"] });
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
            // Rapor cache'ini temizle
            queryClient.invalidateQueries({ queryKey: ["reports"] });
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

    // Offer number click handler
    const handleOfferNumberClick = (offerNumber: string) => {
        setSelectedOfferNumber(offerNumber);
        setShowOfferProductsModal(true);
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
                {/* Üretim Başlığı */}
                <div className="flex items-center gap-2">
                    <Factory className="h-8 w-8" />
                    <h1 className="text-2xl sm:text-3xl font-bold">Üretim</h1>
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

                {/* Filtreleme Bölümü */}
                {!isLoading && (availableNumbers.length > 0 || userStations.length > 0) && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        {/* Numara Filtreleme - Sola yaslı */}
                        {availableNumbers.length > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">Numara:</span>
                                <button
                                    onClick={() => setSelectedNumber(null)}
                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                        selectedNumber === null
                                            ? "bg-gray-800 text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                                >
                                    Tümü
                                </button>
                                {availableNumbers.map((number) => (
                                    <button
                                        key={number}
                                        onClick={() => setSelectedNumber(number || null)}
                                        className={`rounded-full flex items-center justify-center font-bold transition-all ${
                                            selectedNumber === number
                                                ? "w-12 h-12 text-lg bg-blue-600 text-white border-2 border-blue-700 shadow-lg scale-110"
                                                : "w-10 h-10 text-sm bg-blue-100 text-blue-600 hover:bg-blue-200 hover:scale-105"
                                        }`}
                                    >
                                        {number}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* İstasyon Filtreleme - Sağa yaslı */}
                        {isLoadingStations ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>İstasyonlar yükleniyor...</span>
                            </div>
                        ) : userStations.length > 0 ? (
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">İstasyon:</span>
                                <button
                                    onClick={() => setSelectedStationId(null)}
                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                        selectedStationId === null
                                            ? "bg-gray-800 text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                                >
                                    Tümü
                                </button>
                                {userStations.map((station) => (
                                    <button
                                        key={station.id}
                                        onClick={() =>
                                            setSelectedStationId(selectedStationId === station.id ? null : station.id)
                                        }
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all cursor-pointer ${
                                            selectedStationId === station.id
                                                ? "bg-purple-600 text-white border-2 border-purple-700 shadow-md"
                                                : "bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-200"
                                        }`}
                                    >
                                        {station.name}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-red-600">
                                <AlertTriangle className="h-4 w-4" />
                                <span>Yetkili istasyon bulunamadı</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Filtreleme Sonucu Bilgisi */}
                {!isLoading && (selectedNumber || selectedStationId) && (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">
                            <span className="font-semibold text-gray-900">{filteredOperations.length}</span> operasyon
                            gösteriliyor
                        </span>
                        {selectedNumber && (
                            <span className="text-gray-500">
                                • Numara: <span className="font-medium text-blue-600">{selectedNumber}</span>
                            </span>
                        )}
                        {selectedStationId && (
                            <span className="text-gray-500">
                                • İstasyon:{" "}
                                <span className="font-medium text-purple-600">
                                    {userStations.find((s) => s.id === selectedStationId)?.name}
                                </span>
                            </span>
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
                                onOfferNumberClick={handleOfferNumberClick}
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
                                {selectedNumber || selectedStationId ? (
                                    <>
                                        <h3 className="text-lg font-semibold mb-2">
                                            {selectedNumber && selectedStationId
                                                ? `Numara ${selectedNumber} ve ${
                                                      userStations.find((s) => s.id === selectedStationId)?.name
                                                  } istasyonu için operasyon bulunamadı`
                                                : selectedNumber
                                                ? `Numara ${selectedNumber} için operasyon bulunamadı`
                                                : `${
                                                      userStations.find((s) => s.id === selectedStationId)?.name
                                                  } istasyonu için operasyon bulunamadı`}
                                        </h3>
                                        <p className="text-muted-foreground mb-4">
                                            Seçilen kriterlere uygun aktif operasyon bulunmuyor.
                                        </p>
                                        <div className="flex gap-2 justify-center">
                                            {selectedNumber && (
                                                <button
                                                    onClick={() => setSelectedNumber(null)}
                                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                                >
                                                    Numara Filtresini Kaldır
                                                </button>
                                            )}
                                            {selectedStationId && (
                                                <button
                                                    onClick={() => setSelectedStationId(null)}
                                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                                >
                                                    İstasyon Filtresini Kaldır
                                                </button>
                                            )}
                                            {(selectedNumber || selectedStationId) && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedNumber(null);
                                                        setSelectedStationId(null);
                                                    }}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                    Tüm Filtreleri Kaldır
                                                </button>
                                            )}
                                        </div>
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

            <OfferProductsModal
                isOpen={showOfferProductsModal}
                onClose={() => {
                    setShowOfferProductsModal(false);
                    setSelectedOfferNumber(null);
                }}
                offerNumber={selectedOfferNumber}
            />
        </>
    );
}
