"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
    FileBarChart,
    Loader2,
    Search,
    ArrowLeft,
    Factory,
    CheckCircle2,
    Clock,
    PlayCircle,
    Car,
    User,
    MapPin,
    Wrench,
    CircleDashed,
    PauseCircle,
    XCircle,
    Users,
    Timer,
    FileText,
    Award,
    Target,
    Pause,
    AlertCircle,
} from "lucide-react";
import { useReports } from "@/hooks/api/useReports";

// Yardımcı fonksiyonlar
const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("tr-TR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
};

const formatDuration = (minutes: number) => {
    if (!minutes || minutes === 0) return "0 dk";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
        return `${hours}s ${mins}dk`;
    }
    return `${mins}dk`;
};

// Hedeflenen süre toplamını hesapla
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const calculateTotalTargetDuration = (operations: any[]) => {
    return operations.reduce((total, operation) => {
        return total + (operation.target_duration || 0);
    }, 0);
};

// Duraklatılma Detayları Modal Component
function PauseDetailsModal({ operationId, operationName }: { operationId: number; operationName: string }) {
    const { useOperationPauses } = useReports();
    const { data: pauses, isLoading, error } = useOperationPauses(operationId);

    return (
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    Duraklatılma Detayları - {operationName}
                </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="ml-2">Yükleniyor...</span>
                    </div>
                ) : error ? (
                    <div className="text-center py-8 text-red-600">Duraklatılma bilgileri yüklenirken hata oluştu</div>
                ) : pauses && pauses.length > 0 ? (
                    <div className="space-y-3">
                        {pauses.map((pause, index) => (
                            <div
                                key={pause.id || index}
                                className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500 font-medium">Duraklatılma Zamanı:</span>
                                        <div className="font-medium text-gray-900">
                                            {formatDateTime(pause.pause_time)}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 font-medium">Devam Zamanı:</span>
                                        <div className="font-medium text-gray-900">
                                            {formatDateTime(pause.resume_time)}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 font-medium">Duraklatılma Süresi:</span>
                                        <div className="font-medium text-red-600">
                                            {formatDuration(pause.duration_minutes)}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 font-medium">Duraklatılma Sebebi:</span>
                                        <div className="font-medium text-gray-900">
                                            {pause.pause_reason || "Belirtilmemiş"}
                                        </div>
                                    </div>
                                </div>
                                {pause.paused_by_name && (
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                        <span className="text-gray-500 font-medium">Duraklatan:</span>
                                        <div className="font-medium text-gray-900">
                                            {pause.paused_by_name} {pause.paused_by_surname}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        Bu operasyon için duraklatılma kaydı bulunamadı
                    </div>
                )}
            </div>
        </DialogContent>
    );
}

export default function ReportDetailPage() {
    const params = useParams();
    const router = useRouter();
    const executionId = parseInt(params.id as string);
    const [searchTerm, setSearchTerm] = useState("");

    const { useProductionExecutionDetailReport } = useReports();
    const { data: report, isLoading } = useProductionExecutionDetailReport(executionId);

    // Arama filtresi ve sıralama
    const filteredOperations = useMemo(() => {
        if (!report?.operations) return [];

        let filtered = report.operations;

        // Arama terimi varsa filtrele
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            filtered = report.operations.filter(
                (op) =>
                    op.operation_name?.toLowerCase().includes(searchLower) ||
                    op.original_operation_name?.toLowerCase().includes(searchLower) ||
                    op.station_name?.toLowerCase().includes(searchLower) ||
                    op.sort_order.toString().includes(searchLower) ||
                    op.assigned_workers?.some(
                        (w) =>
                            w.name.toLowerCase().includes(searchLower) || w.surname.toLowerCase().includes(searchLower)
                    )
            );
        }

        // Sıralama: Tamamlanan operasyonlar en altta, diğerleri sort_order'a göre
        return filtered.sort((a, b) => {
            // Tamamlanan operasyonları en altta göster
            if (a.status === "completed" && b.status !== "completed") {
                return 1; // a'yı b'den sonra göster
            }
            if (a.status !== "completed" && b.status === "completed") {
                return -1; // b'yi a'dan sonra göster
            }

            // Her ikisi de tamamlanmış veya tamamlanmamışsa sort_order'a göre sırala
            return a.sort_order - b.sort_order;
        });
    }, [report?.operations, searchTerm]);

    // Status renkleri ve iconlar
    const getStatusConfig = (status: string) => {
        switch (status) {
            case "pending":
                return {
                    badge: (
                        <Badge variant="outline" className="bg-gray-100">
                            Beklemede
                        </Badge>
                    ),
                    icon: <CircleDashed className="h-4 w-4 text-gray-500" />,
                    bg: "",
                };
            case "in_progress":
                return {
                    badge: <Badge className="bg-blue-500">Devam Ediyor</Badge>,
                    icon: <PlayCircle className="h-4 w-4 text-blue-600" />,
                    bg: "bg-blue-50/50",
                };
            case "completed":
                return {
                    badge: <Badge className="bg-green-500">Tamamlandı</Badge>,
                    icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
                    bg: "bg-green-50/50",
                };
            case "paused":
                return {
                    badge: <Badge className="bg-yellow-500">Duraklatıldı</Badge>,
                    icon: <PauseCircle className="h-4 w-4 text-yellow-600" />,
                    bg: "bg-yellow-50/50",
                };
            case "skipped":
                return {
                    badge: <Badge variant="destructive">Atlandı</Badge>,
                    icon: <XCircle className="h-4 w-4 text-red-600" />,
                    bg: "",
                };
            case "awaiting_quality_control":
                return {
                    badge: <Badge className="bg-purple-500">KK Bekleniyor</Badge>,
                    icon: <Clock className="h-4 w-4 text-purple-600" />,
                    bg: "bg-purple-50/50",
                };
            default:
                return {
                    badge: <Badge variant="outline">{status}</Badge>,
                    icon: <CircleDashed className="h-4 w-4 text-gray-500" />,
                    bg: "",
                };
        }
    };

    // Tarih formatlama
    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    // Süre formatlama
    const formatDuration = (minutes: number) => {
        if (!minutes) return "0dk";
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}s ${mins}dk`;
        }
        return `${mins}dk`;
    };

    // Genel üretim durumu badge
    const getProductionStatusBadge = (status: string) => {
        switch (status) {
            case "idle":
                return (
                    <Badge variant="outline" className="bg-gray-100 text-gray-800">
                        Boşta
                    </Badge>
                );
            case "running":
                return <Badge className="bg-blue-500">Devam Ediyor</Badge>;
            case "paused":
                return <Badge className="bg-yellow-500">Duraklatıldı</Badge>;
            case "completed":
                return <Badge className="bg-green-500">Tamamlandı</Badge>;
            case "cancelled":
                return <Badge variant="destructive">İptal Edildi</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

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
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/reports">Raporlar</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden sm:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Detay</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                <div className="flex flex-1 flex-col p-4 sm:p-6">
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
                        <span className="text-gray-600">Rapor yükleniyor...</span>
                    </div>
                </div>
            </>
        );
    }

    if (!report) {
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
                                    <BreadcrumbLink href="/reports">Raporlar</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden sm:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Detay</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                <div className="flex flex-1 flex-col p-4 sm:p-6">
                    <div className="text-center py-12">
                        <FileBarChart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600">Rapor bulunamadı</p>
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
                                <BreadcrumbLink href="/reports">Raporlar</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden sm:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Detaylı Rapor</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                {/* Başlık ve Geri Butonu */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <FileBarChart className="h-6 w-6 text-blue-600" />
                        Üretim Detay Raporu
                    </h1>
                    <Button variant="outline" onClick={() => router.back()} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Geri
                    </Button>
                </div>

                {/* Üretim Özet Bilgileri - Sade Tasarım */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-wrap items-center gap-6 mb-4">
                            {/* Üretim Şablonu */}
                            <div className="flex items-center gap-2">
                                <Factory className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-muted-foreground">Şablon:</span>
                                <span className="font-medium">{report.production_plan_name}</span>
                            </div>

                            {/* Model */}
                            <div className="flex items-center gap-2">
                                <Car className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-muted-foreground">Model:</span>
                                <span className="font-medium">{report.vehicle_name}</span>
                            </div>

                            {/* Numara */}
                            {report.number && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">No:</span>
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 font-bold text-sm">{report.number}</span>
                                    </div>
                                </div>
                            )}

                            {/* Müşteri */}
                            {report.customer_name && (
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm text-muted-foreground">Müşteri:</span>
                                    <span className="font-medium">{report.customer_name}</span>
                                </div>
                            )}

                            {/* Teklif */}
                            {report.offer_number && (
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm text-muted-foreground">Teklif:</span>
                                    <span className="font-medium">{report.offer_number}</span>
                                </div>
                            )}

                            {/* Plaka */}
                            {report.plate_number && (
                                <div className="flex items-center gap-2">
                                    <Car className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm text-muted-foreground">Plaka:</span>
                                    <span className="font-medium">{report.plate_number}</span>
                                </div>
                            )}

                            {/* Durum */}
                            <div className="flex items-center gap-2">{getProductionStatusBadge(report.status)}</div>
                        </div>

                        {/* Açıklama */}
                        {report.description && (
                            <div className="pt-4 border-t">
                                <p className="text-sm text-muted-foreground">Açıklama: {report.description}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* İstatistikler */}
                {report.statistics && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
                        <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">Toplam</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {report.statistics.total_operations}
                                        </p>
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
                                        <p className="text-2xl font-bold text-green-900">
                                            {report.statistics.completed_operations}
                                        </p>
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
                                        <p className="text-2xl font-bold text-blue-900">
                                            {report.statistics.in_progress_operations}
                                        </p>
                                    </div>
                                    <PlayCircle className="h-8 w-8 text-blue-400" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-700 mb-1">Beklemede</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {report.statistics.pending_operations}
                                        </p>
                                    </div>
                                    <CircleDashed className="h-8 w-8 text-gray-400" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-purple-700 mb-1">KK Bekleniyor</p>
                                        <p className="text-2xl font-bold text-purple-900">
                                            {report.statistics.awaiting_quality_operations}
                                        </p>
                                    </div>
                                    <Clock className="h-8 w-8 text-purple-400" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-orange-700 mb-1">Geçen Süre</p>
                                        <p className="text-2xl font-bold text-orange-900">
                                            {formatDuration(report.statistics.total_duration)}
                                        </p>
                                    </div>
                                    <Timer className="h-8 w-8 text-orange-400" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-blue-700 mb-1">Hedef Süre</p>
                                        <p className="text-2xl font-bold text-blue-900">
                                            {formatDuration(calculateTotalTargetDuration(report.operations))}
                                        </p>
                                    </div>
                                    <Target className="h-8 w-8 text-blue-400" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Operasyonlar Detayı */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Wrench className="h-5 w-5" />
                                    Operasyon Detayları
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Tüm operasyonların detaylı bilgileri
                                </p>
                            </div>
                            <Badge variant="outline" className="text-lg px-3 py-1">
                                {report.statistics.progress_percentage}% Tamamlandı
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Arama */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Operasyon adı, istasyon, usta adı ile ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Operasyonlar Tablosu */}
                        {filteredOperations && filteredOperations.length > 0 ? (
                            <div className="border rounded-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50">
                                                <TableHead className="text-center w-12">No</TableHead>
                                                <TableHead className="text-center w-12">#</TableHead>
                                                <TableHead className="min-w-[200px]">Operasyon</TableHead>
                                                <TableHead className="text-center">İstasyon</TableHead>
                                                <TableHead className="min-w-[180px]">Ustalar</TableHead>
                                                <TableHead className="text-center">Durum</TableHead>
                                                <TableHead className="text-center">Başlangıç</TableHead>
                                                <TableHead className="text-center">Bitiş</TableHead>
                                                <TableHead className="text-center">Hedef Süre</TableHead>
                                                <TableHead className="text-center">Geçen Süre</TableHead>
                                                <TableHead className="text-center">Duraklatılma</TableHead>
                                                <TableHead className="text-center">KK</TableHead>
                                                <TableHead className="text-center">Onaylayan</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredOperations.map((operation) => {
                                                const statusConfig = getStatusConfig(operation.status);
                                                return (
                                                    <TableRow key={operation.id} className={statusConfig.bg}>
                                                        {/* Üretim Numarası */}
                                                        <TableCell className="text-center">
                                                            {operation.production_number ? (
                                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm mx-auto">
                                                                    {operation.production_number}
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>

                                                        {/* Sıra */}
                                                        <TableCell className="text-center font-bold">
                                                            {operation.sort_order}
                                                        </TableCell>

                                                        {/* Operasyon Adı */}
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Wrench className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">
                                                                        {operation.operation_name ||
                                                                            operation.original_operation_name}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </TableCell>

                                                        {/* İstasyon */}
                                                        <TableCell className="text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <MapPin className="h-4 w-4 text-gray-400" />
                                                                <span className="text-sm">
                                                                    {operation.station_name || "-"}
                                                                </span>
                                                            </div>
                                                        </TableCell>

                                                        {/* Ustalar */}
                                                        <TableCell>
                                                            {operation.assigned_workers &&
                                                            operation.assigned_workers.length > 0 ? (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {operation.assigned_workers.map((worker) => (
                                                                        <Badge
                                                                            key={worker.id}
                                                                            variant="outline"
                                                                            className="text-xs bg-blue-50"
                                                                        >
                                                                            <Users className="h-3 w-3 mr-1" />
                                                                            {worker.name} {worker.surname}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground text-sm">
                                                                    Atanmadı
                                                                </span>
                                                            )}
                                                        </TableCell>

                                                        {/* Durum */}
                                                        <TableCell className="text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                {statusConfig.icon}
                                                                {statusConfig.badge}
                                                            </div>
                                                        </TableCell>

                                                        {/* Başlangıç */}
                                                        <TableCell className="text-center text-sm">
                                                            {formatDateTime(operation.start_time)}
                                                        </TableCell>

                                                        {/* Bitiş */}
                                                        <TableCell className="text-center text-sm">
                                                            {formatDateTime(operation.end_time)}
                                                        </TableCell>

                                                        {/* Hedef Süre */}
                                                        <TableCell className="text-center">
                                                            {operation.target_duration ? (
                                                                <Badge variant="outline" className="bg-blue-50">
                                                                    <Target className="h-3 w-3 mr-1" />
                                                                    {formatDuration(operation.target_duration)}
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>

                                                        {/* Geçen Süre */}
                                                        <TableCell className="text-center">
                                                            {operation.duration ? (
                                                                <Badge variant="outline" className="bg-orange-50">
                                                                    <Timer className="h-3 w-3 mr-1" />
                                                                    {formatDuration(operation.duration)}
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>

                                                        {/* Duraklatılma */}
                                                        <TableCell className="text-center">
                                                            {operation.pause_count > 0 ? (
                                                                <div className="space-y-1">
                                                                    <Dialog>
                                                                        <DialogTrigger asChild>
                                                                            <Badge
                                                                                variant="outline"
                                                                                className="bg-red-50 text-red-700 cursor-pointer hover:bg-red-100"
                                                                            >
                                                                                <Pause className="h-3 w-3 mr-1" />
                                                                                {operation.pause_count} kez
                                                                            </Badge>
                                                                        </DialogTrigger>
                                                                        <PauseDetailsModal
                                                                            operationId={operation.id}
                                                                            operationName={
                                                                                operation.operation_name ||
                                                                                operation.original_operation_name
                                                                            }
                                                                        />
                                                                    </Dialog>
                                                                    {operation.total_pause_duration > 0 && (
                                                                        <div className="text-xs text-red-600">
                                                                            {formatDuration(
                                                                                operation.total_pause_duration
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    <div className="text-xs text-gray-500">
                                                                        Detaylar için tıklayın
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>

                                                        {/* Kalite Kontrol */}
                                                        <TableCell className="text-center">
                                                            {operation.quality_control ? (
                                                                operation.quality_check_passed === true ? (
                                                                    <Badge className="bg-green-500">
                                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                        Onaylandı
                                                                    </Badge>
                                                                ) : operation.quality_check_passed === false ? (
                                                                    <Badge variant="destructive">
                                                                        <XCircle className="h-3 w-3 mr-1" />
                                                                        Reddedildi
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge className="bg-purple-500">
                                                                        <Clock className="h-3 w-3 mr-1" />
                                                                        Beklemede
                                                                    </Badge>
                                                                )
                                                            ) : (
                                                                <span className="text-muted-foreground text-xs">-</span>
                                                            )}
                                                        </TableCell>

                                                        {/* Onaylayan */}
                                                        <TableCell className="text-center text-sm">
                                                            {operation.status === "completed" &&
                                                            operation.updated_by_name ? (
                                                                <div className="flex items-center justify-center gap-1">
                                                                    <Award className="h-3 w-3 text-gray-400" />
                                                                    {operation.updated_by_name}
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-600">
                                    {searchTerm
                                        ? "Arama kriterlerine uygun operasyon bulunamadı"
                                        : "Operasyon bulunamadı"}
                                </p>
                            </div>
                        )}

                        {/* Sonuç Sayısı */}
                        {filteredOperations && filteredOperations.length > 0 && (
                            <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
                                <span>Toplam {filteredOperations.length} operasyon gösteriliyor</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
