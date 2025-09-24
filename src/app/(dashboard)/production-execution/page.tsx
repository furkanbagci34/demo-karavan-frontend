"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Plus,
    Pencil,
    Trash2,
    Loader2,
    AlertTriangle,
    Settings,
    FileText,
    Car,
    User,
    Clock,
    Target,
    Activity,
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { useProductionExecution } from "@/hooks/api/useProductionExecution";
import { ProductionExecution, ProductionExecutionStatus } from "@/lib/api/types";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const PAGE_SIZE = 10;


// Status renklerini belirleyen fonksiyonlar
const getStatusColor = (status: ProductionExecutionStatus) => {
    switch (status) {
        case "idle":
            return "bg-gray-100 text-gray-800";
        case "running":
            return "bg-green-100 text-green-800";
        case "paused":
            return "bg-yellow-100 text-yellow-800";
        case "completed":
            return "bg-blue-100 text-blue-800";
        case "cancelled":
            return "bg-red-100 text-red-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
};

// Status display text
const getStatusText = (status: ProductionExecutionStatus) => {
    switch (status) {
        case "idle":
            return "Beklemede";
        case "running":
            return "Çalışıyor";
        case "paused":
            return "Duraklatıldı";
        case "completed":
            return "Tamamlandı";
        case "cancelled":
            return "İptal Edildi";
        default:
            return status;
    }
};

export default function ProductionExecutionListPage() {
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [executionToDelete, setExecutionToDelete] = useState<ProductionExecution | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const { getAll, remove } = useProductionExecution();
    const { data: productionExecutions = [], isLoading } = getAll;


    // Sil dialog'unu aç
    const openDeleteDialog = (execution: ProductionExecution) => {
        setExecutionToDelete(execution);
        setIsDeleteDialogOpen(true);
    };

    // Üretim planı silme fonksiyonu
    const handleDeleteExecution = async () => {
        if (!executionToDelete) return;

        try {
            await remove.mutateAsync(executionToDelete.id);
            toast.success("Üretim planı başarıyla silindi");
            setIsDeleteDialogOpen(false);
            setExecutionToDelete(null);
        } catch (error: unknown) {
            console.error("Üretim planı silme hatası:", error);
            const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu, lütfen tekrar deneyin.";
            toast.error("Üretim planı silinemedi", {
                description: errorMessage,
            });
        }
    };

    // Düzenleme sayfasına git
    const handleRowClick = (executionId: number) => {
        router.push(`/production-execution/edit/${executionId}`);
    };

    // Pagination hesaplamaları
    const totalPages = Math.max(1, Math.ceil(productionExecutions.length / PAGE_SIZE));
    const paginatedExecutions = productionExecutions.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    // Sayfa değiştiğinde scroll'u yukarı çek
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [currentPage]);

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
                                <BreadcrumbPage>Üretim Planları</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <Activity className="h-6 w-6 text-blue-600" />
                        Üretim Planları
                    </h1>
                            <Button
                        onClick={() => router.push("/production-execution/create")}
                        className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md border-0"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Yeni Üretim Planı Oluştur
                        </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Üretim Planları Listesi</CardTitle>
                        <CardDescription>
                            Üretim planı detayına gitmek için satırın üzerine tıklayınız.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Desktop Table */}
                        <div className="hidden lg:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50 hover:bg-gray-50 border-b-2 border-gray-200">
                                        <TableHead className="text-center font-semibold text-gray-700 py-4 px-3">
                                            Plan Adı
                                        </TableHead>
                                        <TableHead className="text-center font-semibold text-gray-700 py-4 px-3">
                                            Araç
                                        </TableHead>
                                        <TableHead className="text-center font-semibold text-gray-700 py-4 px-3">
                                            Müşteri
                                        </TableHead>
                                        <TableHead className="text-center font-semibold text-gray-700 py-4 px-3">
                                            Durum
                                        </TableHead>
                                        <TableHead className="text-center font-semibold text-gray-700 py-4 px-3">
                                            İlerleme
                                        </TableHead>
                                        <TableHead className="text-center font-semibold text-gray-700 py-4 px-3">
                                            Oluşturan
                                        </TableHead>
                                        <TableHead className="text-center font-semibold text-gray-700 py-4 px-3">
                                            Oluşturulma Tarihi
                                        </TableHead>
                                        <TableHead className="text-center font-semibold text-gray-700 py-4 px-3 w-20">
                                            İşlemler
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Üretim planları yükleniyor...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : productionExecutions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8">
                                                <div className="flex items-center justify-center gap-2">
                                                    <AlertTriangle className="h-4 w-4" />
                                                    Henüz üretim planı bulunmuyor
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedExecutions.map((execution) => (
                                            <TableRow
                                                key={execution.id}
                                                className="cursor-pointer text-center hover:bg-gray-50"
                                                onClick={() => handleRowClick(execution.id)}
                                            >
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2 justify-center">
                                                        <FileText className="h-4 w-4 text-blue-600" />
                                                        <span className="font-mono text-sm">
                                                            {execution.production_plan_name || `Plan #${execution.id}`}
                                                                    </span>
                                                            </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-center">
                                                        <div className="font-medium">
                                                            {execution.vehicle_name || "-"}
                                                        </div>
                                                        {execution.vehicle_brand_model && (
                                                            <div className="text-xs text-muted-foreground">
                                                                {execution.vehicle_brand_model}
                                                            </div>
                                        )}
                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {execution.customer_name || "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getStatusColor(execution.status)}>
                                                        {getStatusText(execution.status)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <Progress
                                                            value={execution.progress_percentage || 0}
                                                            className="h-2"
                                                        />
                                                        <div className="flex justify-between text-xs text-muted-foreground">
                                                            <span>
                                                                {execution.completed_operations || 0}/
                                                                {execution.total_operations || 0}
                                                            </span>
                                                            <span>{execution.progress_percentage || 0}%</span>
                                                        </div>
                                                                        </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {execution.created_by_name || "-"}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-1 text-sm">
                                                        <Clock className="h-3 w-3 text-gray-400" />
                                                        <span>
                                                            {format(new Date(execution.created_at), "dd.MM.yyyy HH:mm", {
                                                                locale: tr,
                                                            })}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <span className="sr-only">İşlemler</span>
                                                                <Settings className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    router.push(`/production-execution/edit/${execution.id}`);
                                                                }}
                                                            >
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                <span>Düzenle</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-red-600 focus:text-red-600"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openDeleteDialog(execution);
                                                                }}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                <span>Sil</span>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="lg:hidden">
                            {isLoading ? (
                            <div className="p-8 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Üretim planları yükleniyor...
                                </div>
                            </div>
                            ) : productionExecutions.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        Henüz üretim planı bulunmuyor
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 p-4">
                                    {paginatedExecutions.map((execution) => (
                                    <Card
                                        key={execution.id}
                                        className="cursor-pointer hover:bg-gray-50"
                                        onClick={() => handleRowClick(execution.id)}
                                    >
                                        <div className="p-4 space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-blue-600" />
                                                        <h3 className="font-medium text-sm">
                                                            {execution.production_plan_name ||
                                                                `Plan #${execution.id}`}
                                                        </h3>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Car className="h-3 w-3" />
                                                        <span>
                                                            {execution.vehicle_name || "Araç belirtilmemiş"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Badge className={getStatusColor(execution.status)}>
                                                    {getStatusText(execution.status)}
                                                </Badge>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div className="flex items-center gap-1">
                                                        <User className="h-3 w-3 text-gray-400" />
                                                        <span className="text-muted-foreground">Müşteri:</span>
                                                    </div>
                                                    <span className="font-medium">
                                                        {execution.customer_name || "-"}
                                                    </span>

                                                    <div className="flex items-center gap-1">
                                                        <Target className="h-3 w-3 text-gray-400" />
                                                        <span className="text-muted-foreground">İlerleme:</span>
                                                    </div>
                                                    <span className="font-medium">
                                                        {execution.completed_operations || 0}/
                                                        {execution.total_operations || 0} (
                                                        {execution.progress_percentage || 0}%)
                                                    </span>
                                                </div>

                                                <Progress
                                                    value={execution.progress_percentage || 0}
                                                    className="h-2"
                                                />
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Clock className="h-3 w-3" />
                                                        <span>
                                                            {format(new Date(execution.created_at), "dd.MM.yyyy HH:mm", {
                                                                locale: tr,
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Oluşturan: {execution.created_by_name || "-"}
                                                    </div>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <span className="sr-only">İşlemler</span>
                                                            <Settings className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/production-execution/edit/${execution.id}`);
                                                            }}
                                                        >
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            <span>Düzenle</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-600"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openDeleteDialog(execution);
                                                            }}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            <span>Sil</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                                </div>
                                )}
                        </div>
                        {/* Pagination */}
                        {totalPages > 1 && (
                        <div className="p-4 border-t">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Üretim Planını Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>
                                {executionToDelete?.production_plan_name ||
                                    `Plan #${executionToDelete?.id}`}
                            </strong>{" "}
                            üretim planını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteExecution}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Üretim Planını Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
