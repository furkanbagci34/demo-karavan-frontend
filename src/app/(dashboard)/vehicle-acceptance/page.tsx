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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Car, Pencil, Trash2, Loader2, AlertTriangle, Settings, Calendar, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useVehicleAcceptance } from "@/hooks/api/useVehicleAcceptance";
import { VehicleAcceptance } from "@/lib/api/types";
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

const PAGE_SIZE = 10;

export default function VehicleAcceptancePage() {
    const router = useRouter();
    const [currentPage, setCurrentPage] = React.useState(1);
    const [vehicleAcceptanceToDelete, setVehicleAcceptanceToDelete] = useState<VehicleAcceptance | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // useVehicleAcceptance hook'unu kullan
    const { vehicleAcceptances, isLoading, error, deleteVehicleAcceptance, isLoadingDelete } = useVehicleAcceptance();

    const handleRowClick = (vehicleAcceptanceId: number | undefined) => {
        if (vehicleAcceptanceId) {
            router.push(`/vehicle-acceptance/edit/${vehicleAcceptanceId}`);
        }
    };

    // Araç kabul silme dialog'unu aç
    const openDeleteDialog = (vehicleAcceptance: VehicleAcceptance) => {
        setVehicleAcceptanceToDelete(vehicleAcceptance);
        setIsDeleteDialogOpen(true);
    };

    // Araç kabul silme fonksiyonu
    const handleDeleteVehicleAcceptance = async () => {
        if (!vehicleAcceptanceToDelete) return;

        try {
            if (vehicleAcceptanceToDelete.id) {
                await deleteVehicleAcceptance(vehicleAcceptanceToDelete.id.toString());

                toast.success("Araç kabulü başarıyla silindi", {
                    description: `VA-${vehicleAcceptanceToDelete.id} araç kabulü artık listede görünmeyecek.`,
                });
            }

            // Dialog'u kapat
            setIsDeleteDialogOpen(false);
            setVehicleAcceptanceToDelete(null);
        } catch (error: unknown) {
            console.error("Araç kabulü silme hatası:", error);
            const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu, lütfen tekrar deneyin.";
            toast.error("Araç kabulü silinemedi", {
                description: errorMessage,
            });
        }
    };

    // Error handling
    useEffect(() => {
        if (error) {
            console.error("Araç kabulü yüklenirken hata:", error);
            toast.error("Araç kabulü yüklenemedi", {
                description: "Araç kabulü listesi alınırken bir hata oluştu.",
            });
        }
    }, [error]);

    // Pagination hesaplamaları
    const totalPages = Math.max(1, Math.ceil(vehicleAcceptances.length / PAGE_SIZE));
    const paginatedVehicleAcceptances = vehicleAcceptances.slice(
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
                                <BreadcrumbPage>Araç Kabul</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <Car className="h-6 w-6" />
                        Araç Kabul Listesi
                    </h1>
                    <Button
                        onClick={() => router.push("/vehicle-acceptance/add")}
                        className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md border-0"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Yeni Araç Kabul
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Araç Kabul Listesi</CardTitle>
                        <CardDescription>
                            Araç kabul düzenleme sayfasına gitmek için satırın üzerine tıklayınız.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Desktop Tablo Görünümü */}
                        <div className="hidden lg:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Araç Bilgisi</TableHead>
                                        <TableHead>Oluşturan Kullanıcı</TableHead>
                                        <TableHead>Oluşturma Tarihi</TableHead>
                                        <TableHead className="text-center w-20">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Araç kabul listesi yükleniyor...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : vehicleAcceptances.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8">
                                                <div className="flex items-center justify-center gap-2">
                                                    <AlertTriangle className="h-4 w-4" />
                                                    Henüz araç kabul kaydı bulunmuyor
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedVehicleAcceptances.map((vehicleAcceptance) => (
                                            <TableRow
                                                key={vehicleAcceptance.id}
                                                className={`cursor-pointer`}
                                                onClick={() => handleRowClick(vehicleAcceptance.id)}
                                            >
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="font-medium">
                                                            Plaka: {vehicleAcceptance.plate_number}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            KM: {vehicleAcceptance.entry_km || 0}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {vehicleAcceptance.created_user ||
                                                        vehicleAcceptance.created_by_name ||
                                                        "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {vehicleAcceptance.created_at
                                                        ? new Date(vehicleAcceptance.created_at).toLocaleString("tr-TR")
                                                        : "-"}
                                                </TableCell>
                                                <TableCell className="flex items-center justify-center">
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
                                                            <DropdownMenuItem asChild>
                                                                <Link
                                                                    href={`/vehicle-acceptance/edit/${vehicleAcceptance.id}`}
                                                                    className="flex items-center"
                                                                >
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    <span>Düzenle</span>
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-red-600 focus:text-red-600"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openDeleteDialog(vehicleAcceptance);
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

                        {/* Mobil/Tablet Kart Görünümü */}
                        <div className="lg:hidden">
                            {isLoading ? (
                                <div className="p-8 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Araç kabul listesi yükleniyor...
                                    </div>
                                </div>
                            ) : vehicleAcceptances.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        Henüz araç kabul kaydı bulunmuyor
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 p-4">
                                    {paginatedVehicleAcceptances.map((vehicleAcceptance) => (
                                        <Card
                                            key={vehicleAcceptance.id}
                                            className={`overflow-hidden cursor-pointer`}
                                            onClick={() => handleRowClick(vehicleAcceptance.id)}
                                        >
                                            <div className="p-4 space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h3 className="font-medium text-lg">
                                                            VA-{vehicleAcceptance.id}
                                                        </h3>
                                                        <p className="text-sm text-slate-600">
                                                            {vehicleAcceptance.created_user ||
                                                                vehicleAcceptance.created_by_name}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">Plaka:</span>
                                                        <span className="font-medium font-mono">
                                                            {vehicleAcceptance.plate_number}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">KM:</span>
                                                        <span className="font-medium">
                                                            {vehicleAcceptance.entry_km || 0}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">Oluşturma:</span>
                                                        <span className="font-medium">
                                                            {vehicleAcceptance.created_at
                                                                ? new Date(vehicleAcceptance.created_at).toLocaleString(
                                                                      "tr-TR"
                                                                  )
                                                                : "-"}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">Yakıt:</span>
                                                        <span className="font-medium">
                                                            {vehicleAcceptance.fuel_level}/20
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">Oluşturan:</span>
                                                        <span className="font-medium">
                                                            {vehicleAcceptance.created_user ||
                                                                vehicleAcceptance.created_by_name ||
                                                                "-"}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-2 border-t">
                                                    <div className="text-xs text-slate-500">
                                                        Kabul:{" "}
                                                        {vehicleAcceptance.date
                                                            ? new Date(vehicleAcceptance.date).toLocaleDateString(
                                                                  "tr-TR"
                                                              )
                                                            : "Belirtilmemiş"}
                                                    </div>
                                                    <div className="flex items-center justify-end">
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
                                                                <DropdownMenuItem asChild>
                                                                    <Link
                                                                        href={`/vehicle-acceptance/edit/${vehicleAcceptance.id}`}
                                                                        className="flex items-center"
                                                                    >
                                                                        <Pencil className="mr-2 h-4 w-4" />
                                                                        <span>Düzenle</span>
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-red-600 focus:text-red-600"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openDeleteDialog(vehicleAcceptance);
                                                                    }}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    <span>Sil</span>
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
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
                        <AlertDialogTitle>Araç Kabulü Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>VA-{vehicleAcceptanceToDelete?.id}</strong> araç kabulünü silmek istediğinizden emin
                            misiniz? Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteVehicleAcceptance}
                            disabled={isLoadingDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isLoadingDelete ? "Siliniyor..." : "Araç Kabulünü Sil"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
