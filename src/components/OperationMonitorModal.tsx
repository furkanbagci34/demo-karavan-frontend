"use client";

import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    CheckCircle2,
    Clock,
    Loader2,
    Search,
    ListChecks,
    PlayCircle,
    PauseCircle,
    XCircle,
    CircleDashed,
    Factory,
} from "lucide-react";
import { OperationExecutionStatus } from "@/lib/api/types";
import { useProductionExecution } from "@/hooks/api/useProductionExecution";
import { useProduction } from "@/hooks/api/useProduction";

interface OperationMonitorModalProps {
    isOpen: boolean;
    onClose: () => void;
    executionId: number | null;
    productionPlanName?: string;
}

// Status renklerini belirleyen fonksiyon
const getStatusColor = (status: OperationExecutionStatus) => {
    switch (status) {
        case "pending":
            return "bg-gray-100 text-gray-800";
        case "in_progress":
            return "bg-blue-100 text-blue-800";
        case "completed":
            return "bg-green-100 text-green-800";
        case "paused":
            return "bg-yellow-100 text-yellow-800";
        case "skipped":
            return "bg-red-100 text-red-800";
        case "awaiting_quality_control":
            return "bg-purple-100 text-purple-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
};

// Status icon'unu belirleyen fonksiyon
const getStatusIcon = (status: OperationExecutionStatus) => {
    switch (status) {
        case "pending":
            return <CircleDashed className="h-4 w-4 text-gray-500" />;
        case "in_progress":
            return <PlayCircle className="h-4 w-4 text-blue-600" />;
        case "completed":
            return <CheckCircle2 className="h-4 w-4 text-green-600" />;
        case "paused":
            return <PauseCircle className="h-4 w-4 text-yellow-600" />;
        case "skipped":
            return <XCircle className="h-4 w-4 text-red-600" />;
        case "awaiting_quality_control":
            return <Clock className="h-4 w-4 text-purple-600" />;
        default:
            return <CircleDashed className="h-4 w-4 text-gray-500" />;
    }
};

// Status metni
const getStatusText = (status: OperationExecutionStatus) => {
    switch (status) {
        case "pending":
            return "Beklemede";
        case "in_progress":
            return "Devam Ediyor";
        case "completed":
            return "Tamamlandı";
        case "paused":
            return "Duraklatıldı";
        case "skipped":
            return "Atlandı";
        case "awaiting_quality_control":
            return "Kalite Kontrol Bekleniyor";
        default:
            return status;
    }
};

// Süreyi formatlayan fonksiyon (saniye -> saat:dakika:saniye)
const formatDuration = (seconds: number) => {
    if (!seconds) return "0s";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours}s`);
    if (minutes > 0) parts.push(`${minutes}d`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}sn`);

    return parts.join(" ");
};

// Tarih formatlama (daha kompakt)
const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month} ${hours}:${minutes}`;
};

export const OperationMonitorModal: React.FC<OperationMonitorModalProps> = ({
    isOpen,
    onClose,
    executionId,
    productionPlanName,
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [approvingOperationId, setApprovingOperationId] = useState<number | null>(null);
    const { useProductionExecutionById } = useProductionExecution();
    const { approveQualityControl } = useProduction();

    // Execution detayını çek (operations dahil)
    const { data: executionDetail, isLoading: isLoadingDetail } = useProductionExecutionById(executionId || 0);
    const operations = executionDetail?.operations || [];

    // Kalite kontrol onaylama
    const handleApproveQuality = async (operationId: number) => {
        setApprovingOperationId(operationId);
        try {
            await approveQualityControl(operationId);
        } catch (error) {
            console.error("Kalite kontrol onaylama hatası:", error);
        } finally {
            setApprovingOperationId(null);
        }
    };

    // Filtrelenmiş operasyon listesi
    const filteredOperations = useMemo(() => {
        if (!searchTerm.trim()) {
            return operations;
        }

        const searchLower = searchTerm.toLowerCase();
        return operations.filter(
            (operation) =>
                operation.original_operation_name?.toLowerCase().includes(searchLower) ||
                operation.operation_name?.toLowerCase().includes(searchLower) ||
                operation.station_name?.toLowerCase().includes(searchLower) ||
                getStatusText(operation.status).toLowerCase().includes(searchLower) ||
                operation.sort_order.toString().includes(searchLower)
        );
    }, [operations, searchTerm]);

    // Durum istatistikleri
    const stats = useMemo(() => {
        return {
            total: operations.length,
            completed: operations.filter((op) => op.status === "completed").length,
            inProgress: operations.filter((op) => op.status === "in_progress").length,
            paused: operations.filter((op) => op.status === "paused").length,
            pending: operations.filter((op) => op.status === "pending").length,
            awaitingQuality: operations.filter((op) => op.status === "awaiting_quality_control").length,
        };
    }, [operations]);

    const handleClose = () => {
        onClose();
        setSearchTerm("");
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-[95vw] sm:max-w-6xl lg:max-w-7xl max-h-[95vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <ListChecks className="h-5 w-5" />
                        Operasyon İzleme
                    </DialogTitle>
                    <DialogDescription>
                        {productionPlanName ? `${productionPlanName} - ` : ""}Üretim planına ait operasyonları
                        görüntüleyin ve takip edin.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col space-y-4 min-h-0">
                    {/* İstatistik Kartları */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 flex-shrink-0">
                        <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">Toplam</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                    </div>
                                    <Factory className="h-8 w-8 text-gray-400" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-50 to-green-100">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-green-700 mb-1">Tamamlandı</p>
                                        <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
                                    </div>
                                    <CheckCircle2 className="h-8 w-8 text-green-400" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-blue-700 mb-1">Devam Ediyor</p>
                                        <p className="text-2xl font-bold text-blue-900">{stats.inProgress}</p>
                                    </div>
                                    <PlayCircle className="h-8 w-8 text-blue-400" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-yellow-700 mb-1">Duraklatıldı</p>
                                        <p className="text-2xl font-bold text-yellow-900">{stats.paused}</p>
                                    </div>
                                    <PauseCircle className="h-8 w-8 text-yellow-400" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-700 mb-1">Beklemede</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                                    </div>
                                    <CircleDashed className="h-8 w-8 text-gray-400" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-purple-700 mb-1">Kalite Kontrol</p>
                                        <p className="text-2xl font-bold text-purple-900">{stats.awaitingQuality}</p>
                                    </div>
                                    <Clock className="h-8 w-8 text-purple-400" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Separator className="flex-shrink-0" />

                    {/* Loading State */}
                    {isLoadingDetail && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
                            <span className="text-gray-600">Operasyonlar yükleniyor...</span>
                        </div>
                    )}

                    {/* Search Section */}
                    {!isLoadingDetail && operations.length > 0 && (
                        <div className="flex-shrink-0 space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-lg">Operasyon Listesi</h3>
                                <Badge variant="outline" className="text-sm">
                                    {filteredOperations.length} operasyon
                                </Badge>
                            </div>

                            {/* Search Input */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Operasyon adı, sıra numarası, durum ile ara..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    )}

                    {/* Operation List - Simple Table */}
                    {!isLoadingDetail && operations.length > 0 && (
                        <div className="flex-1 overflow-auto border rounded-lg min-h-0">
                            <Table>
                                <TableHeader className="sticky top-0 z-10">
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="text-center w-12 bg-gray-50">No</TableHead>
                                        <TableHead className="text-center w-16 bg-gray-50">#</TableHead>
                                        <TableHead className="bg-gray-50">Operasyon Adı</TableHead>
                                        <TableHead className="text-center bg-gray-50">Durum</TableHead>
                                        <TableHead className="text-center bg-gray-50">Kalite Kontrol</TableHead>
                                        <TableHead className="text-center bg-gray-50">Başlangıç</TableHead>
                                        <TableHead className="text-center bg-gray-50">Bitiş</TableHead>
                                        <TableHead className="text-center bg-gray-50">Süre</TableHead>
                                        <TableHead className="text-center w-32 bg-gray-50">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOperations.map((operation) => (
                                        <TableRow
                                            key={operation.id}
                                            className={`
                                                ${operation.status === "completed" ? "bg-green-50/50" : ""}
                                                ${operation.status === "in_progress" ? "bg-blue-50/50" : ""}
                                                ${operation.status === "paused" ? "bg-yellow-50/50" : ""}
                                                ${
                                                    operation.status === "awaiting_quality_control"
                                                        ? "bg-purple-50/50"
                                                        : ""
                                                }
                                            `}
                                        >
                                            <TableCell className="text-center">
                                                {operation.production_number ? (
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm mx-auto">
                                                        {operation.production_number}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center font-bold">
                                                {operation.sort_order}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(operation.status)}
                                                    <span className="font-medium">
                                                        {operation.original_operation_name ||
                                                            operation.operation_name ||
                                                            "İsimsiz Operasyon"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={getStatusColor(operation.status)}>
                                                    {getStatusText(operation.status)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {!operation.quality_control ? (
                                                    <div className="flex items-center justify-center gap-1 text-gray-400">
                                                        <span className="text-xs">Gerekli Değil</span>
                                                    </div>
                                                ) : operation.quality_check_passed === true ? (
                                                    <div className="flex items-center justify-center gap-1 text-green-600">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        <span className="text-xs font-medium">Onaylandı</span>
                                                    </div>
                                                ) : operation.quality_check_passed === false ? (
                                                    <div className="flex items-center justify-center gap-1 text-red-600">
                                                        <XCircle className="h-4 w-4" />
                                                        <span className="text-xs font-medium">Reddedildi</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-1 text-yellow-600">
                                                        <CircleDashed className="h-4 w-4" />
                                                        <span className="text-xs font-medium">Bekliyor</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center text-sm">
                                                {formatDateTime(operation.start_time)}
                                            </TableCell>
                                            <TableCell className="text-center text-sm">
                                                {formatDateTime(operation.end_time)}
                                            </TableCell>
                                            <TableCell className="text-center text-sm font-medium">
                                                {formatDuration(operation.duration)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {operation.quality_control &&
                                                (operation.quality_check_passed === null ||
                                                    operation.quality_check_passed === undefined ||
                                                    operation.quality_check_passed === false) ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 px-2 text-xs"
                                                        onClick={() => handleApproveQuality(operation.id)}
                                                        disabled={approvingOperationId === operation.id}
                                                    >
                                                        {approvingOperationId === operation.id ? (
                                                            <>
                                                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                                Onaylanıyor...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                Onayla
                                                            </>
                                                        )}
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-gray-400">-</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* No Results State */}
                    {!isLoadingDetail && operations.length > 0 && filteredOperations.length === 0 && (
                        <div className="text-center py-8">
                            <Search className="h-8 w-8 mx-auto text-gray-400 mb-3" />
                            <h3 className="text-base font-semibold text-gray-900 mb-1">Operasyon Bulunamadı</h3>
                            <p className="text-sm text-gray-600">
                                &ldquo;{searchTerm}&rdquo; araması için sonuç bulunamadı.
                            </p>
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoadingDetail && operations.length === 0 && (
                        <div className="text-center py-12">
                            <ListChecks className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Operasyon Bulunamadı</h3>
                            <p className="text-gray-600">Bu üretim planına ait henüz operasyon bulunmuyor.</p>
                        </div>
                    )}
                </div>

                {/* Action Buttons - Fixed at bottom */}
                <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-end">
                        <Button variant="outline" onClick={handleClose} className="px-6 py-2.5">
                            Kapat
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
