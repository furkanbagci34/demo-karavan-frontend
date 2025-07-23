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
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Pencil, Trash2, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Pagination } from "@/components/ui/pagination";
import { useOffers } from "@/hooks/api/useOffers";
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
import { formatNumber } from "@/lib/utils";

const PAGE_SIZE = 10;

// Status renklerini belirleyen fonksiyonlar
const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case "beklemede":
            return "bg-yellow-100 text-yellow-800";
        case "tamamlandı":
            return "bg-green-100 text-green-800";
        case "üretimde":
            return "bg-purple-100 text-purple-800";
        case "iptal edildi":
            return "bg-blue-100 text-blue-800";
        case "gönderildi":
            return "bg-blue-100 text-blue-800";
        case "reddedildi":
            return "bg-red-100 text-red-800";
        case "onaylandı":
            return "bg-green-100 text-green-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
};

// Satır arka plan rengini belirleyen fonksiyon
const getRowBackgroundColor = (status: string) => {
    switch (status.toLowerCase()) {
        case "beklemede":
            return "bg-yellow-50 hover:bg-yellow-100";
        case "tamamlandı":
            return "bg-green-50 hover:bg-green-100";
        case "üretimde":
            return "bg-purple-50 hover:bg-purple-100";
        case "iptal edildi":
            return "bg-blue-50 hover:bg-blue-100";
        case "gönderildi":
            return "bg-blue-50 hover:bg-blue-100";
        case "reddedildi":
            return "bg-red-50 hover:bg-red-100";
        case "onaylandı":
            return "bg-green-50 hover:bg-green-100";
        default:
            return "bg-gray-50 hover:bg-gray-100";
    }
};

const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
        case "beklemede":
            return "Beklemede";
        case "tamamlandı":
            return "Tamamlandı";
        case "üretimde":
            return "Üretimde";
        case "iptal edildi":
            return "İptal Edildi";
        case "gönderildi":
            return "Gönderildi";
        case "reddedildi":
            return "Reddedildi";
        case "onaylandı":
            return "Onaylandı";
        default:
            return status;
    }
};

interface Offer {
    id: number;
    offer_number: string;
    customer_id?: number;
    customer_name?: string;
    subtotal: number;
    discount_amount: number;
    net_total: number;
    vat_rate: number;
    vat_amount: number;
    total_amount: number;
    status: string;
    valid_until?: string;
    notes?: string;
    item_count: number;
    total_items_price: number;
    created_at: string;
    updated_at: string;
}

export default function OfferListPage() {
    const [currentPage, setCurrentPage] = React.useState(1);
    const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const { getAllOffers, deleteOffer, loading } = useOffers();
    const [offers, setOffers] = useState<Offer[]>([]);

    // Teklifleri yükle
    useEffect(() => {
        const loadOffers = async () => {
            try {
                const offersData = await getAllOffers();
                setOffers(offersData);
            } catch (error) {
                console.error("Teklifler yüklenirken hata:", error);
                toast.error("Teklifler yüklenemedi", {
                    description: "Teklif listesi alınırken bir hata oluştu.",
                });
            }
        };

        loadOffers();
    }, [getAllOffers]);

    // Teklif silme dialog'unu aç
    const openDeleteDialog = (offer: Offer) => {
        setOfferToDelete(offer);
        setIsDeleteDialogOpen(true);
    };

    // Teklif silme fonksiyonu
    const handleDeleteOffer = async () => {
        if (!offerToDelete) return;

        try {
            await deleteOffer(offerToDelete.id);
            toast.success("Teklif başarıyla silindi", {
                description: `${offerToDelete.offer_number} teklifi artık listede görünmeyecek.`,
            });

            // Dialog'u kapat ve listeyi yenile
            setIsDeleteDialogOpen(false);
            setOfferToDelete(null);

            // Listeyi yenile
            const offersData = await getAllOffers();
            setOffers(offersData);
        } catch (error: unknown) {
            console.error("Teklif silme hatası:", error);
            const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu, lütfen tekrar deneyin.";
            toast.error("Teklif silinemedi", {
                description: errorMessage,
            });
        }
    };

    // Pagination hesaplamaları
    const totalPages = Math.max(1, Math.ceil(offers.length / PAGE_SIZE));
    const paginatedOffers = offers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
                                <BreadcrumbPage>Teklifler</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <FileText className="h-6 w-6" />
                        Teklifler
                    </h1>
                    <Button
                        asChild
                        className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md border-0"
                    >
                        <Link href="/offer/add">
                            <Plus className="h-4 w-4 mr-2" />
                            Yeni Teklif Oluştur
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Teklif Listesi</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Desktop Tablo Görünümü */}
                        <div className="hidden lg:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Teklif No</TableHead>
                                        <TableHead>Müşteri</TableHead>
                                        <TableHead>Durum</TableHead>
                                        <TableHead className="text-right">Brüt Toplam (€)</TableHead>
                                        <TableHead className="text-right">İndirim (€)</TableHead>
                                        <TableHead className="text-right">Net Toplam (€)</TableHead>
                                        <TableCell className="text-right">KDV (€)</TableCell>
                                        <TableHead className="text-right">Genel Toplam (€)</TableHead>
                                        <TableHead>Geçerlilik</TableHead>
                                        <TableHead className="text-center w-20">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center py-8">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Teklifler yükleniyor...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : offers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center py-8">
                                                <div className="flex items-center justify-center gap-2">
                                                    <AlertTriangle className="h-4 w-4" />
                                                    Henüz teklif bulunmuyor
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedOffers.map((offer) => (
                                            <TableRow key={offer.id} className={getRowBackgroundColor(offer.status)}>
                                                <TableCell className="font-medium">{offer.offer_number}</TableCell>
                                                <TableCell>{offer.customer_name || "-"}</TableCell>
                                                <TableCell>
                                                    <Badge className={getStatusColor(offer.status)}>
                                                        {getStatusText(offer.status)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatNumber(offer.subtotal)}
                                                </TableCell>
                                                <TableCell className="text-right text-red-600">
                                                    -{formatNumber(offer.discount_amount)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatNumber(offer.net_total)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatNumber(offer.vat_amount)}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatNumber(offer.total_amount)}
                                                </TableCell>
                                                <TableCell>
                                                    {offer.valid_until
                                                        ? new Date(offer.valid_until).toLocaleDateString("tr-TR")
                                                        : "-"}
                                                </TableCell>
                                                <TableCell className="flex items-center justify-center gap-2">
                                                    <Link
                                                        href={`/offer/edit/${offer.id}`}
                                                        title="Düzenle"
                                                        className="text-green-600 hover:text-green-800"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        className="text-red-600 hover:text-red-800 cursor-pointer"
                                                        title="Sil"
                                                        onClick={() => openDeleteDialog(offer)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobil/Tablet Kart Görünümü */}
                        <div className="lg:hidden">
                            {loading ? (
                                <div className="p-8 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Teklifler yükleniyor...
                                    </div>
                                </div>
                            ) : offers.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        Henüz teklif bulunmuyor
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 p-4">
                                    {paginatedOffers.map((offer) => (
                                        <Card
                                            key={offer.id}
                                            className={`overflow-hidden ${getRowBackgroundColor(offer.status)}`}
                                        >
                                            <div className="p-4 space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h3 className="font-medium text-lg">{offer.offer_number}</h3>
                                                        <p className="text-sm text-slate-600">
                                                            {offer.customer_name || "Müşteri belirtilmemiş"}
                                                        </p>
                                                    </div>
                                                    <Badge className={getStatusColor(offer.status)}>
                                                        {getStatusText(offer.status)}
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">Brüt Toplam:</span>
                                                        <span className="font-medium">
                                                            €{formatNumber(offer.subtotal)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">İndirim:</span>
                                                        <span className="font-medium text-red-600">
                                                            -€{formatNumber(offer.discount_amount)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">Net Toplam:</span>
                                                        <span className="font-medium">
                                                            €{formatNumber(offer.net_total)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">KDV:</span>
                                                        <span className="font-medium">
                                                            €{formatNumber(offer.vat_amount)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between col-span-2">
                                                        <span className="text-slate-600 font-medium">
                                                            Genel Toplam:
                                                        </span>
                                                        <span className="font-bold">
                                                            €{formatNumber(offer.total_amount)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-2 border-t">
                                                    <div className="text-xs text-slate-500">
                                                        Geçerlilik:{" "}
                                                        {offer.valid_until
                                                            ? new Date(offer.valid_until).toLocaleDateString("tr-TR")
                                                            : "Belirtilmemiş"}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={`/offer/edit/${offer.id}`}
                                                            title="Düzenle"
                                                            className="text-green-600 hover:text-green-800"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            className="text-red-600 hover:text-red-800 cursor-pointer"
                                                            title="Sil"
                                                            onClick={() => openDeleteDialog(offer)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
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
                        <AlertDialogTitle>Teklifi Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>{offerToDelete?.offer_number}</strong> teklifini silmek istediğinizden emin misiniz?
                            Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteOffer} className="bg-red-600 hover:bg-red-700">
                            Teklifi Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
