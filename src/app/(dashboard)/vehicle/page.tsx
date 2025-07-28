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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Car, Pencil, Trash2, Loader2, Settings } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Pagination } from "@/components/ui/pagination";
import { useVehicles } from "@/hooks/api/useVehicles";
import { Vehicle } from "@/lib/api/types";
import { toast } from "sonner";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PAGE_SIZE = 10;

export default function VehicleListPage() {
    const [currentPage, setCurrentPage] = React.useState(1);
    const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedVehicleImage, setSelectedVehicleImage] = useState<{ src: string; alt: string } | null>(null);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const { vehicles, deleteVehicle, isLoading } = useVehicles();

    // Araç pasif hale getirme dialog'unu aç
    const openDeleteDialog = (vehicle: Vehicle) => {
        setVehicleToDelete(vehicle);
        setIsDeleteDialogOpen(true);
    };

    // Araç pasif hale getirme fonksiyonu
    const handleDeleteVehicle = async () => {
        if (!vehicleToDelete) return;

        try {
            await deleteVehicle(vehicleToDelete.id.toString());
            toast.success("Araç başarıyla silindi", {
                description: `${vehicleToDelete.name} aracı artık listede görünmeyecek.`,
            });

            // Dialog'u kapat (React Query otomatik olarak listeyi güncelleyecek)
            setIsDeleteDialogOpen(false);
            setVehicleToDelete(null);
        } catch (error: unknown) {
            console.error("Araç pasif hale getirme hatası:", error);
            const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu, lütfen tekrar deneyin.";
            toast.error("Araç pasif hale getirilemedi", {
                description: errorMessage,
            });
        }
    };

    // Resim tıklama fonksiyonu
    const handleImageClick = (vehicle: Vehicle) => {
        if (vehicle.image) {
            setSelectedVehicleImage({
                src: vehicle.image,
                alt: vehicle.name,
            });
            setIsImageModalOpen(true);
        }
    };

    // Pagination hesaplamaları
    const totalPages = Math.max(1, Math.ceil(vehicles.length / PAGE_SIZE));
    const paginatedVehicles = vehicles.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
                                <BreadcrumbPage>Araçlar</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <Car className="h-6 w-6" />
                        Araçlar
                    </h1>
                    <Button asChild className="w-full sm:w-auto">
                        <Link href="/vehicle/add">
                            <Plus className="h-4 w-4 mr-2" />
                            Yeni Araç Ekle
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Araç Listesi</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Desktop Tablo Görünümü */}
                        <div className="hidden lg:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16">Fotoğraf</TableHead>
                                        <TableHead>Araç Adı</TableHead>
                                        <TableHead>Marka Model</TableHead>
                                        <TableHead>Durum</TableHead>
                                        <TableHead>Oluşturulma Tarihi</TableHead>
                                        <TableHead className="text-center w-20">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Araçlar yükleniyor...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedVehicles.map((vehicle) => (
                                            <TableRow key={vehicle.id}>
                                                <TableCell>
                                                    <img
                                                        src={vehicle.image || "/images/no-image-placeholder.svg"}
                                                        alt={vehicle.name}
                                                        className={`w-12 h-12 aspect-square object-cover rounded border ${
                                                            vehicle.image
                                                                ? "cursor-pointer hover:opacity-80 transition-opacity"
                                                                : ""
                                                        }`}
                                                        onClick={() => vehicle.image && handleImageClick(vehicle)}
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = "/images/no-image-placeholder.svg";
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">{vehicle.name}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {vehicle.brand_model || "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            vehicle.is_active
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {vehicle.is_active ? "Aktif" : "Pasif"}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(vehicle.created_at).toLocaleDateString("tr-TR")}
                                                </TableCell>
                                                <TableCell className="flex items-center justify-center">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">İşlemler</span>
                                                                <Settings className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link
                                                                    href={`/vehicle/edit/${vehicle.id}`}
                                                                    className="flex items-center"
                                                                >
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    <span>Düzenle</span>
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-red-600 focus:text-red-600"
                                                                onClick={() => openDeleteDialog(vehicle)}
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
                                        Araçlar yükleniyor...
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                                    {paginatedVehicles.map((vehicle) => (
                                        <Card key={vehicle.id} className="overflow-hidden">
                                            <div className="flex items-start gap-3 p-4">
                                                <img
                                                    src={vehicle.image || "/images/no-image-placeholder.svg"}
                                                    alt={vehicle.name}
                                                    className={`w-16 h-16 aspect-square object-cover rounded border flex-shrink-0 ${
                                                        vehicle.image
                                                            ? "cursor-pointer hover:opacity-80 transition-opacity"
                                                            : ""
                                                    }`}
                                                    onClick={() => vehicle.image && handleImageClick(vehicle)}
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = "/images/no-image-placeholder.svg";
                                                    }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium text-sm truncate">{vehicle.name}</h3>
                                                    {vehicle.brand_model && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {vehicle.brand_model}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span
                                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                vehicle.is_active
                                                                    ? "bg-green-100 text-green-800"
                                                                    : "bg-red-100 text-red-800"
                                                            }`}
                                                        >
                                                            {vehicle.is_active ? "Aktif" : "Pasif"}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(vehicle.created_at).toLocaleDateString("tr-TR")}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-end">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                    <span className="sr-only">İşlemler</span>
                                                                    <Settings className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem asChild>
                                                                    <Link
                                                                        href={`/vehicle/edit/${vehicle.id}`}
                                                                        className="flex items-center"
                                                                    >
                                                                        <Pencil className="mr-2 h-4 w-4" />
                                                                        <span>Düzenle</span>
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-red-600 focus:text-red-600"
                                                                    onClick={() => openDeleteDialog(vehicle)}
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
                            <div className="flex justify-center p-4 border-t">
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

            {/* Silme Dialog'u */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Araç Pasif Hale Getir</AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>{vehicleToDelete?.name}</strong> aracını pasif hale getirmek istediğinizden emin
                            misiniz? Bu işlem geri alınabilir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteVehicle} className="bg-red-600 hover:bg-red-700">
                            Pasif Hale Getir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Resim Modal'ı */}
            <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedVehicleImage?.alt}</DialogTitle>
                    </DialogHeader>
                    <div className="flex justify-center">
                        <img
                            src={selectedVehicleImage?.src}
                            alt={selectedVehicleImage?.alt}
                            className="max-w-full max-h-96 object-contain rounded"
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
