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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ArrowLeft, Loader2, ClipboardCheck, Trash2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { useQualityControl } from "@/hooks/api/useQualityControl";
import { useVehicles } from "@/hooks/api/useVehicles";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { QualityControlItem } from "@/lib/api/types";
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

export default function AddQualityControlPage() {
    const searchParams = useSearchParams();
    const { createItem, isCreating, deleteItem, isDeleting, toggleStatus, useQualityControlItemsByVehicle } =
        useQualityControl();
    const { vehicles, isLoading: vehiclesLoading } = useVehicles();

    // URL'den gelen vehicleId'yi direkt initial state olarak set et
    const getInitialVehicleId = () => {
        const vehicleIdParam = searchParams.get("vehicleId");
        if (vehicleIdParam) {
            const vehicleId = parseInt(vehicleIdParam, 10);
            return !isNaN(vehicleId) ? vehicleId : null;
        }
        return null;
    };

    const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(getInitialVehicleId());
    const [formData, setFormData] = useState({
        name: "",
        description: "",
    });
    const [itemToDelete, setItemToDelete] = useState<QualityControlItem | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Seçili araca ait maddeleri getir
    const {
        data: vehicleItems = [],
        refetch,
        isLoading: vehicleItemsLoading,
    } = useQualityControlItemsByVehicle(selectedVehicleId);

    const handleInputChange = (field: string, value: string | boolean) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleVehicleChange = (vehicleId: string) => {
        setSelectedVehicleId(parseInt(vehicleId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Form validasyonu
        if (!selectedVehicleId || !formData.name) {
            toast.error("Lütfen araç modeli seçin ve madde adı girin");
            return;
        }

        try {
            await createItem({
                vehicleId: selectedVehicleId,
                name: formData.name,
                description: formData.description || undefined,
            });

            // Formu temizle
            setFormData({
                name: "",
                description: "",
            });

            // Listeyi yenile
            refetch();
        } catch (error) {
            console.error("Kalite kontrol maddesi oluşturma hatası:", error);
        }
    };

    const handleOpenDeleteDialog = (item: QualityControlItem) => {
        setItemToDelete(item);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteItem = async () => {
        if (!itemToDelete) return;

        try {
            await deleteItem(itemToDelete.id);
            setIsDeleteDialogOpen(false);
            setItemToDelete(null);
            refetch();
        } catch (error) {
            console.error("Kalite kontrol maddesi silme hatası:", error);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("tr-TR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
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
                                <BreadcrumbLink href="/quality-control">Kalite Kontrol</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden sm:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Yeni Madde Ekle</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <ClipboardCheck className="h-7 w-7 text-blue-600" />
                            Kalite Kontrol Tanımlama - Ekle
                        </h1>
                        <p className="text-muted-foreground">
                            Araç modeli seçin ve hızlıca kalite kontrol maddeleri ekleyin
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/quality-control">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Tüm Maddeler
                        </Link>
                    </Button>
                </div>

                {/* Hızlı Ekleme Formu - Mobil Uyumlu */}
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardContent className="pt-4 pb-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-2 items-end">
                                {/* Araç Modeli */}
                                <div className="sm:col-span-2 lg:col-span-3 space-y-1">
                                    <Label className="text-xs text-muted-foreground">Model</Label>
                                    <Select
                                        value={selectedVehicleId?.toString() || ""}
                                        onValueChange={handleVehicleChange}
                                        disabled={vehiclesLoading}
                                    >
                                        <SelectTrigger className="h-9 text-sm w-full">
                                            <SelectValue placeholder="Seçin..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {vehicles.map((vehicle) => (
                                                <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                                                    {vehicle.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Madde Adı */}
                                <div className="sm:col-span-2 lg:col-span-4 space-y-1">
                                    <Label className="text-xs text-muted-foreground">
                                        Madde Adı <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => handleInputChange("name", e.target.value)}
                                        placeholder="Gaz Kontrolü..."
                                        required
                                        disabled={isCreating || !selectedVehicleId}
                                        className="h-9 text-sm"
                                    />
                                </div>

                                {/* Açıklama */}
                                <div className="sm:col-span-2 lg:col-span-4 space-y-1">
                                    <Label className="text-xs text-muted-foreground">Açıklama</Label>
                                    <Input
                                        value={formData.description}
                                        onChange={(e) => handleInputChange("description", e.target.value)}
                                        placeholder="Opsiyonel..."
                                        disabled={isCreating || !selectedVehicleId}
                                        className="h-9 text-sm"
                                    />
                                </div>

                                {/* Ekle Butonu */}
                                <div className="sm:col-span-2 lg:col-span-1">
                                    <Button
                                        type="submit"
                                        disabled={isCreating || !selectedVehicleId}
                                        className="w-full h-9"
                                    >
                                        {isCreating ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Plus className="h-4 w-4" />
                                        )}
                                        <span className="ml-2 hidden sm:inline">Ekle</span>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </form>

                {selectedVehicleId && (
                    <>
                        {/* Seçili Modele Ait Maddeler Listesi */}
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <ClipboardCheck className="h-4 w-4" />
                                            Bu Modele Ait Maddeler
                                        </CardTitle>
                                        <CardDescription className="text-sm mt-1">
                                            {vehicles.find((v) => v.id === selectedVehicleId)?.name}
                                        </CardDescription>
                                    </div>
                                    <Badge variant="secondary" className="w-fit">
                                        {vehicleItems.length} Madde
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {vehicleItemsLoading ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
                                        <p className="text-sm text-muted-foreground">Maddeler yükleniyor...</p>
                                    </div>
                                ) : vehicleItems.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                                        <h3 className="text-base font-semibold mb-1">Henüz madde eklenmemiş</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Yukarıdaki formu kullanarak madde ekleyin
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Mobil Görünüm */}
                                        <div className="block lg:hidden space-y-3">
                                            {vehicleItems.map((item, index) => (
                                                <div
                                                    key={item.id}
                                                    className={`border rounded-lg p-3 space-y-2 bg-card hover:bg-accent/50 transition-colors ${
                                                        !item.is_active ? "opacity-50" : ""
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex items-start gap-2 flex-1 min-w-0">
                                                            <span className="text-xs font-medium text-muted-foreground mt-0.5">
                                                                #{index + 1}
                                                            </span>
                                                            <div className="flex-1 min-w-0">
                                                                <h4
                                                                    className={`font-medium text-sm mb-1 ${
                                                                        !item.is_active
                                                                            ? "line-through text-muted-foreground"
                                                                            : ""
                                                                    }`}
                                                                >
                                                                    {item.name}
                                                                </h4>
                                                                {item.description && (
                                                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                                                        {item.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Checkbox
                                                            checked={item.is_active}
                                                            onCheckedChange={() => toggleStatus(item.id)}
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between pt-2 border-t">
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(item.created_at).toLocaleDateString("tr-TR")}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                            onClick={() => handleOpenDeleteDialog(item)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Desktop/Tablet Görünüm */}
                                        <div className="hidden lg:block rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-12">#</TableHead>
                                                        <TableHead>Madde Adı</TableHead>
                                                        <TableHead className="hidden xl:table-cell">Açıklama</TableHead>
                                                        <TableHead className="w-24">Durum</TableHead>
                                                        <TableHead className="hidden xl:table-cell w-40">
                                                            Tarih
                                                        </TableHead>
                                                        <TableHead className="text-right w-24">İşlem</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {vehicleItems.map((item, index) => (
                                                        <TableRow
                                                            key={item.id}
                                                            className={!item.is_active ? "opacity-50" : ""}
                                                        >
                                                            <TableCell className="font-medium text-sm">
                                                                {index + 1}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div
                                                                    className={`font-medium text-sm ${
                                                                        !item.is_active
                                                                            ? "line-through text-muted-foreground"
                                                                            : ""
                                                                    }`}
                                                                >
                                                                    {item.name}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="hidden xl:table-cell">
                                                                <div className="max-w-xs truncate text-xs text-muted-foreground">
                                                                    {item.description || "-"}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Checkbox
                                                                    checked={item.is_active}
                                                                    onCheckedChange={() => toggleStatus(item.id)}
                                                                />
                                                            </TableCell>
                                                            <TableCell className="hidden xl:table-cell">
                                                                <div className="text-xs text-muted-foreground">
                                                                    {formatDate(item.created_at)}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-8 w-8 p-0"
                                                                        asChild
                                                                    ></Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                                        onClick={() => handleOpenDeleteDialog(item)}
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Kalite Kontrol Maddesini Sil
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>{itemToDelete?.name}</strong> adlı kalite kontrol maddesini silmek istediğinizden
                            emin misiniz? Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteItem}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Siliniyor...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Sil
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
