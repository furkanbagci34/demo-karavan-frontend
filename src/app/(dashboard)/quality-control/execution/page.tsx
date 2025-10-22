"use client";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    ClipboardCheck,
    CheckCircle,
    XCircle,
    Clock,
    Car,
    Building,
    Loader2,
    AlertCircle,
    CheckSquare,
    XSquare,
    History,
    RefreshCw,
    BarChart3,
} from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { useQualityControl } from "@/hooks/api/useQualityControl";
import { ProductionPlanForQC } from "@/lib/api/types";

// Status renk helper'ları
const getStatusConfig = (
    status: string,
    qcStats?: { total_items: number; pending_items: number; approved_items: number; rejected_items: number }
) => {
    const isCompleted = qcStats && qcStats.total_items > 0 && qcStats.pending_items === 0;
    const isAllApproved =
        qcStats && qcStats.total_items > 0 && qcStats.rejected_items === 0 && qcStats.pending_items === 0;

    if (isAllApproved) {
        return {
            badgeColor: "bg-green-100 text-green-800",
            rowColor: "border-2 border-green-500 bg-green-50",
            icon: CheckCircle,
            text: "Tamamlandı",
        };
    }

    if (isCompleted) {
        return {
            badgeColor: "bg-green-100 text-green-800",
            rowColor: "border-l-4 border-l-green-500 bg-green-50",
            icon: CheckCircle,
            text: "Tamamlandı",
        };
    }

    switch (status) {
        case "in_progress":
            return {
                badgeColor: "bg-blue-100 text-blue-800",
                rowColor: "border-l-4 border-l-blue-500 bg-blue-50",
                icon: Clock,
                text: "Devam Ediyor",
            };
        case "completed":
            return {
                badgeColor: "bg-green-100 text-green-800",
                rowColor: "border-l-4 border-l-green-500 bg-green-50",
                icon: CheckCircle,
                text: "Tamamlandı",
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

// Tarih formatı
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

// Üretim Planı Card Component - Profesyonel Mobil Tasarım
const ProductionPlanCard: React.FC<{
    plan: ProductionPlanForQC;
    onStartQC: (plan: ProductionPlanForQC) => void;
    onViewHistory: (plan: ProductionPlanForQC) => void;
    qcStats?: {
        total_items: number;
        checked_items: number;
        approved_items: number;
        rejected_items: number;
        pending_items: number;
    };
}> = ({ plan, onStartQC, onViewHistory, qcStats }) => {
    const statusConfig = getStatusConfig(plan.status, qcStats);
    const StatusIcon = statusConfig.icon;

    return (
        <Card className={`overflow-hidden transition-all duration-200 hover:shadow-md ${statusConfig.rowColor}`}>
            {/* Compact Header Section */}
            <div className="p-3">
                <div className="flex items-center gap-3 mb-2">
                    {/* Plan Numarası */}
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs sm:text-sm flex-shrink-0">
                        {plan.plan_number}
                    </div>

                    {/* Plan Bilgileri */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                            <h3 className="font-semibold text-sm text-gray-900 truncate">{plan.plan_name}</h3>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <StatusIcon className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                                {plan.vehicle_name} • {plan.customer_name}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Kalite Kontrol İstatistikleri - Compact */}
                {qcStats && qcStats.total_items > 0 && (
                    <div className="mb-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 rounded-lg">
                        <div className="flex items-center gap-1 mb-1">
                            <BarChart3 className="h-3 w-3 text-blue-600" />
                            <span className="text-xs font-semibold text-blue-800">Kalite Kontrol</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1 sm:gap-2">
                            <div className="text-center p-1 bg-white/60 rounded border border-white/80">
                                <div className="text-sm font-bold text-gray-800">{qcStats.total_items}</div>
                                <div className="text-xs text-gray-600">Toplam</div>
                            </div>
                            <div className="text-center p-1 bg-green-50 rounded border border-green-200">
                                <div className="text-sm font-bold text-green-700">{qcStats.approved_items}</div>
                                <div className="text-xs text-green-600">Onay</div>
                            </div>
                            <div className="text-center p-1 bg-red-50 rounded border border-red-200">
                                <div className="text-sm font-bold text-red-700">{qcStats.rejected_items}</div>
                                <div className="text-xs text-red-600">Red</div>
                            </div>
                            <div className="text-center p-1 bg-orange-50 rounded border border-orange-200">
                                <div className="text-sm font-bold text-orange-700">{qcStats.pending_items}</div>
                                <div className="text-xs text-orange-600">Bekle</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Detaylar - Ultra Compact */}
                <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-2">
                    <div className="bg-white/60 border border-gray-200/60 rounded p-1 sm:p-2">
                        <div className="flex items-center gap-1 mb-0.5">
                            <Car className="h-3 w-3 text-gray-500 flex-shrink-0" />
                            <span className="text-xs text-gray-500">Araç</span>
                        </div>
                        <div
                            className="font-medium text-xs text-gray-900 truncate"
                            title={plan.vehicle_brand_model || plan.vehicle_name}
                        >
                            {plan.vehicle_brand_model || plan.vehicle_name}
                        </div>
                    </div>

                    <div className="bg-white/60 border border-gray-200/60 rounded p-1 sm:p-2">
                        <div className="flex items-center gap-1 mb-0.5">
                            <Building className="h-3 w-3 text-gray-500 flex-shrink-0" />
                            <span className="text-xs text-gray-500">Müşteri</span>
                        </div>
                        <div className="font-medium text-xs text-gray-900 truncate" title={plan.customer_name}>
                            {plan.customer_name}
                        </div>
                    </div>

                    <div className="bg-white/60 border border-gray-200/60 rounded p-1 sm:p-2">
                        <div className="flex items-center gap-1 mb-0.5">
                            <Clock className="h-3 w-3 text-gray-500 flex-shrink-0" />
                            <span className="text-xs text-gray-500">Tarih</span>
                        </div>
                        <div className="font-medium text-xs text-gray-900">{formatDate(plan.created_at)}</div>
                    </div>
                </div>

                {/* Action Buttons - Enhanced Design */}
                <div className="flex gap-2">
                    <Button
                        onClick={() => onStartQC(plan)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white h-8 text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 rounded-lg"
                    >
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Kalite Kontrol Gir</span>
                        <span className="sm:hidden">Kontrol</span>
                    </Button>
                    {qcStats && qcStats.total_items > 0 && (
                        <Button
                            variant="outline"
                            onClick={() => onViewHistory(plan)}
                            className="px-3 h-8 text-sm font-medium border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 rounded-lg"
                        >
                            <History className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Geçmiş</span>
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
};

// Plan Card with Stats Component
const PlanCardWithStats: React.FC<{
    plan: ProductionPlanForQC;
    onStartQC: (plan: ProductionPlanForQC) => void;
    onViewHistory: (plan: ProductionPlanForQC) => void;
}> = ({ plan, onStartQC, onViewHistory }) => {
    const { useQCPlanStats } = useQualityControl();
    const { data: qcStats } = useQCPlanStats(plan.id);

    return (
        <ProductionPlanCard
            plan={plan}
            onStartQC={onStartQC}
            onViewHistory={onViewHistory}
            qcStats={qcStats || undefined}
        />
    );
};

// Kalite Kontrol Form Component
const QualityControlForm: React.FC<{
    plan: ProductionPlanForQC;
    onClose: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSave: (checks: any[]) => void;
    isSaving: boolean;
}> = ({ plan, onClose, onSave, isSaving }) => {
    const { useQualityControlItemsByVehicle, useLatestQCStatus } = useQualityControl();

    // Bu plan için kalite kontrol maddelerini getir
    const { data: qcItems = [], isLoading: qcItemsLoading } = useQualityControlItemsByVehicle(plan.vehicle_id);
    const { data: latestStatus = [] } = useLatestQCStatus(plan.id);

    // Form state
    const [checks, setChecks] = useState<Record<number, { status: "approved" | "rejected"; reason?: string }>>({});
    const hasInitialized = useRef(false);

    // Latest status'u form state'e yükle - sadece bir kez
    useEffect(() => {
        if (latestStatus.length > 0 && !hasInitialized.current) {
            const initialChecks: Record<number, { status: "approved" | "rejected"; reason?: string }> = {};
            latestStatus.forEach((record) => {
                initialChecks[record.quality_control_item_id] = {
                    status: record.status,
                    reason: record.rejection_reason || undefined,
                };
            });
            setChecks(initialChecks);
            hasInitialized.current = true;
        }
    }, [latestStatus]);

    const handleStatusChange = (itemId: number, status: "approved" | "rejected") => {
        setChecks((prev) => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                status,
                reason: status === "rejected" ? prev[itemId]?.reason || "" : undefined,
            },
        }));
    };

    const handleReasonChange = (itemId: number, reason: string) => {
        setChecks((prev) => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                reason,
            },
        }));
    };

    const handleSave = () => {
        const checksArray = Object.entries(checks).map(([itemId, check]) => ({
            itemId: parseInt(itemId),
            status: check.status,
            rejectionReason: check.status === "rejected" ? check.reason : undefined,
        }));
        onSave(checksArray);
    };

    if (qcItemsLoading) {
        return (
            <Card>
                <CardContent className="p-8">
                    <div className="flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <ClipboardCheck className="h-5 w-5" />
                            Kalite Kontrol - {plan.plan_name}
                        </CardTitle>
                        <CardDescription>
                            {plan.vehicle_name} • {plan.customer_name}
                        </CardDescription>
                    </div>
                    <Button variant="outline" onClick={onClose}>
                        <XCircle className="h-4 w-4 mr-2" />
                        Kapat
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {qcItems.length === 0 ? (
                    <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <h3 className="text-lg font-semibold mb-2">Kalite Kontrol Maddesi Bulunamadı</h3>
                        <p className="text-muted-foreground mb-4">
                            Bu araç modeli için henüz kalite kontrol maddesi tanımlanmamış.
                        </p>
                        <Button asChild>
                            <Link href="/quality-control/add">
                                <ClipboardCheck className="h-4 w-4 mr-2" />
                                Madde Ekle
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            {qcItems.map((item) => (
                                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-sm mb-1">{item.name}</h4>
                                            {item.description && (
                                                <p className="text-xs text-muted-foreground">{item.description}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!item.is_active && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Pasif
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <RadioGroup
                                        value={checks[item.id]?.status || ""}
                                        onValueChange={(value) =>
                                            handleStatusChange(item.id, value as "approved" | "rejected")
                                        }
                                        className="flex flex-col sm:flex-row gap-3 sm:gap-4"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="approved" id={`${item.id}-approved`} />
                                            <Label
                                                htmlFor={`${item.id}-approved`}
                                                className="flex items-center gap-2 text-green-600 cursor-pointer"
                                            >
                                                <CheckSquare className="h-4 w-4" />
                                                <span className="text-sm">Onayla</span>
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="rejected" id={`${item.id}-rejected`} />
                                            <Label
                                                htmlFor={`${item.id}-rejected`}
                                                className="flex items-center gap-2 text-red-600 cursor-pointer"
                                            >
                                                <XSquare className="h-4 w-4" />
                                                <span className="text-sm">Reddet</span>
                                            </Label>
                                        </div>
                                    </RadioGroup>

                                    {checks[item.id]?.status === "rejected" && (
                                        <div className="space-y-2">
                                            <Label htmlFor={`${item.id}-reason`} className="text-sm">
                                                Red Nedeni <span className="text-red-500">*</span>
                                            </Label>
                                            <Textarea
                                                id={`${item.id}-reason`}
                                                placeholder="Red nedenini açıklayın..."
                                                value={checks[item.id]?.reason || ""}
                                                onChange={(e) => handleReasonChange(item.id, e.target.value)}
                                                className="min-h-[80px]"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button variant="outline" onClick={onClose}>
                                İptal
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                )}
                                Kaydet
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

// Geçmiş Kayıtları Component
const QCHistoryModal: React.FC<{
    plan: ProductionPlanForQC | null;
    isOpen: boolean;
    onClose: () => void;
}> = ({ plan, isOpen, onClose }) => {
    const { useQCRecords } = useQualityControl();
    const { data: records = [], isLoading } = useQCRecords(plan?.id || null);

    if (!isOpen || !plan) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-in fade-in duration-200">
            <Card className="w-full max-w-4xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <History className="h-5 w-5 flex-shrink-0" />
                                <span className="truncate">Kalite Kontrol Geçmişi</span>
                            </CardTitle>
                            <CardDescription className="text-sm mt-1 truncate">
                                {plan.plan_name} • {plan.vehicle_name}
                            </CardDescription>
                        </div>
                        <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                            <XCircle className="h-4 w-4 mr-2" />
                            Kapat
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : records.length === 0 ? (
                        <div className="text-center py-8">
                            <History className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                            <h3 className="text-lg font-semibold mb-2">Geçmiş Kayıt Bulunamadı</h3>
                            <p className="text-muted-foreground">
                                Bu üretim planı için henüz kalite kontrol kaydı bulunmuyor.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {records.map((record) => (
                                <div key={record.id} className="border rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-sm">{record.item_name}</h4>
                                            {record.item_description && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {record.item_description}
                                                </p>
                                            )}
                                        </div>
                                        <Badge
                                            variant={record.status === "approved" ? "default" : "destructive"}
                                            className="text-xs"
                                        >
                                            {record.status === "approved" ? "Onaylandı" : "Reddedildi"}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{record.checked_by_name}</span>
                                        <span>{formatDate(record.checked_at)}</span>
                                    </div>
                                    {record.rejection_reason && (
                                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                                            <strong>Red Nedeni:</strong> {record.rejection_reason}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default function QualityControlExecutionPage() {
    const { useProductionPlansForQC, submitQC, isSubmittingQC, invalidateAllQC } = useQualityControl();

    // Data fetching
    const { data: productionPlans = [], isLoading: plansLoading, refetch: refetchPlans } = useProductionPlansForQC();

    // State
    const [selectedPlan, setSelectedPlan] = useState<ProductionPlanForQC | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [historyPlan, setHistoryPlan] = useState<ProductionPlanForQC | null>(null);

    // Kalite kontrol formunu aç
    const handleStartQC = (plan: ProductionPlanForQC) => {
        setSelectedPlan(plan);
    };

    // Geçmiş kayıtlarını aç
    const handleViewHistory = (plan: ProductionPlanForQC) => {
        setHistoryPlan(plan);
        setShowHistory(true);
    };

    // Kalite kontrol kaydet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSaveQC = async (checks: any[]) => {
        if (!selectedPlan) return;

        try {
            await submitQC({
                productionExecutionId: selectedPlan.id,
                checks,
            });
            setSelectedPlan(null);
            refetchPlans();
        } catch (error) {
            console.error("Kalite kontrol kaydetme hatası:", error);
        }
    };

    // Refresh fonksiyonu
    const handleRefresh = () => {
        // Cache'i temizle ve verileri yeniden yükle
        invalidateAllQC();
        refetchPlans();
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
                                <BreadcrumbLink href="/quality-control">Kalite Kontrol</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden sm:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Kalite Kontrol</BreadcrumbPage>
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
                </div>
            </header>

            <div className="flex flex-1 flex-col p-3 sm:p-4 space-y-3 sm:space-y-4">
                {/* Header Section - Compact */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                            <ClipboardCheck className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                            Kalite Kontrol
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Üretim planları için kalite kontrol işlemleri yapın
                        </p>
                    </div>
                </div>

                {/* Loading State */}
                {plansLoading && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                        {[...Array(4)].map((_, index) => (
                            <Card key={index} className="p-3">
                                <div className="animate-pulse">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                                        <div className="flex-1">
                                            <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                                            <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1 mb-2">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="bg-gray-100 rounded p-1">
                                                <div className="h-2 bg-gray-200 rounded w-1/2 mb-0.5"></div>
                                                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-1">
                                        <div className="h-7 bg-gray-200 rounded flex-1"></div>
                                        <div className="h-7 bg-gray-200 rounded w-16"></div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Production Plans List */}
                {!plansLoading && !selectedPlan && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                        {productionPlans.map((plan) => (
                            <PlanCardWithStats
                                key={plan.id}
                                plan={plan}
                                onStartQC={handleStartQC}
                                onViewHistory={handleViewHistory}
                            />
                        ))}
                    </div>
                )}

                {/* Boş Durum */}
                {!plansLoading && productionPlans.length === 0 && !selectedPlan && (
                    <Card>
                        <CardContent className="p-8">
                            <div className="text-center">
                                <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Üretim Planı Bulunamadı</h3>
                                <p className="text-muted-foreground">
                                    Kalite kontrol yapılabilecek aktif üretim planı bulunmamaktadır.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Kalite Kontrol Formu */}
                {selectedPlan && (
                    <QualityControlForm
                        plan={selectedPlan}
                        onClose={() => setSelectedPlan(null)}
                        onSave={handleSaveQC}
                        isSaving={isSubmittingQC}
                    />
                )}
            </div>

            {/* Geçmiş Kayıtları Modal */}
            <QCHistoryModal
                plan={historyPlan}
                isOpen={showHistory}
                onClose={() => {
                    setShowHistory(false);
                    setHistoryPlan(null);
                }}
            />
        </>
    );
}
