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
import { Plus, FileText, Pencil, Trash2, Loader2, AlertTriangle, Settings, ChevronsUpDown, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Pagination } from "@/components/ui/pagination";
import { useOffers } from "@/hooks/api/useOffers";
import { useCustomers } from "@/hooks/api/useCustomers";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { OfferStatus } from "@/lib/enums";

const PAGE_SIZE = 10;

// Status renklerini belirleyen fonksiyonlar
const getStatusColor = (status: string) => {
    switch (status) {
        case OfferStatus.TASLAK:
            return "bg-yellow-100 text-yellow-800";
        case OfferStatus.GONDERILDI:
            return "bg-blue-100 text-blue-800";
        case OfferStatus.ONAYLANDI:
            return "bg-green-100 text-green-800";
        case OfferStatus.IPTAL_EDILDI:
            return "bg-blue-100 text-blue-800";
        case OfferStatus.TAMAMLANDI:
            return "bg-green-100 text-green-800";
        case OfferStatus.ÜRETIMDE:
            return "bg-purple-100 text-purple-800";
        case OfferStatus.REDDEDILDI:
            return "bg-red-100 text-red-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
};

// Satır arka plan rengini belirleyen fonksiyon
const getRowBackgroundColor = (status: string) => {
    switch (status) {
        case OfferStatus.TASLAK:
            return "bg-yellow-50 hover:bg-yellow-100";
        case OfferStatus.GONDERILDI:
            return "bg-blue-50 hover:bg-blue-100";
        case OfferStatus.ONAYLANDI:
            return "bg-green-50 hover:bg-green-100";
        case OfferStatus.TAMAMLANDI:
            return "bg-green-50 hover:bg-green-100";
        case OfferStatus.ÜRETIMDE:
            return "bg-purple-50 hover:bg-purple-100";
        case OfferStatus.IPTAL_EDILDI:
            return "bg-blue-50 hover:bg-blue-100";
        case OfferStatus.REDDEDILDI:
            return "bg-red-50 hover:bg-red-100";
        default:
            return "bg-gray-50 hover:bg-gray-100";
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
    const router = useRouter();
    const [currentPage, setCurrentPage] = React.useState(1);
    const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isCreateOfferModalOpen, setIsCreateOfferModalOpen] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
    const [isCreatingOffer, setIsCreatingOffer] = useState(false);
    const [isCustomerSelectorOpen, setIsCustomerSelectorOpen] = useState(false);
    const { getAllOffers, deleteOffer, createOffer, getLastOfferId, loading } = useOffers();
    const { customers, isLoading: customersLoading } = useCustomers();
    const [offers, setOffers] = useState<Offer[]>([]);

    const handleRowClick = (offerId: number) => {
        router.push(`/offer/detail/${offerId}`);
    };

    // Teklifleri yükle
    useEffect(() => {
        const loadOffers = async () => {
            try {
                const offersData = await getAllOffers();
                setOffers(offersData as Offer[]);
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
            setOffers(offersData as Offer[]);
        } catch (error: unknown) {
            console.error("Teklif silme hatası:", error);
            const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu, lütfen tekrar deneyin.";
            toast.error("Teklif silinemedi", {
                description: errorMessage,
            });
        }
    };

    // Yeni teklif oluşturma modal'ını aç
    const openCreateOfferModal = () => {
        setSelectedCustomerId(null);
        setIsCustomerSelectorOpen(false);
        setIsCreateOfferModalOpen(true);
    };

    // Yeni teklif oluşturma fonksiyonu
    const handleCreateOffer = async () => {
        if (!selectedCustomerId) {
            toast.error("Müşteri seçilmedi", {
                description: "Lütfen bir müşteri seçin",
            });
            return;
        }

        setIsCreatingOffer(true);

        try {
            // Teklif numarası oluştur
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, "0");
            const day = String(today.getDate()).padStart(2, "0");
            const dateString = `${year}-${month}-${day}`;

            const lastOfferResponse = await getLastOfferId();
            const nextId = lastOfferResponse.lastId || 1;
            const offerNumber = `${dateString}-${nextId}`;

            // Geçerlilik tarihi - 15 gün sonra
            const validDate = new Date();
            validDate.setDate(validDate.getDate() + 15);
            const validUntil = validDate.toISOString().split("T")[0];

            // Boş teklif verisi oluştur
            const offerData = {
                offerNumber,
                customerId: selectedCustomerId,
                subtotal: 0,
                discountAmount: 0,
                netTotal: 0,
                vatRate: 20.0,
                vatAmount: 0,
                totalAmount: 0,
                status: OfferStatus.TASLAK,
                validUntil,
                items: [],
            };

            const result = await createOffer(offerData);

            if (result && result.offerId) {
                toast.success("Yeni teklif oluşturuldu!", {
                    description: "Teklif detay sayfasına yönlendiriliyorsunuz.",
                });

                // Modal'ı kapat
                setIsCreateOfferModalOpen(false);
                setSelectedCustomerId(null);

                // Teklif detay sayfasına yönlendir
                router.push(`/offer/detail/${result.offerId}`);
            } else {
                toast.error("Teklif oluşturulamadı", {
                    description: "Beklenmeyen bir hata oluştu",
                });
            }
        } catch (error: unknown) {
            console.error("Teklif oluşturma hatası:", error);
            const errorMessage = error instanceof Error ? error.message : "Teklif oluşturulurken bir hata oluştu";
            toast.error("Teklif oluşturulamadı", {
                description: errorMessage,
            });
        } finally {
            setIsCreatingOffer(false);
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
                        onClick={openCreateOfferModal}
                        className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md border-0"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Yeni Teklif Oluştur
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Teklif Listesi</CardTitle>
                        <CardDescription>Teklif detayına gitmek için satırın üzerine tıklayınız.</CardDescription>
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
                                        <TableHead className="text-center w-20">Sil</TableHead>
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
                                            <TableRow
                                                key={offer.id}
                                                className={`${getRowBackgroundColor(offer.status)} cursor-pointer`}
                                                onClick={() => handleRowClick(offer.id)}
                                            >
                                                <TableCell className="font-medium">{offer.offer_number}</TableCell>
                                                <TableCell>{offer.customer_name || "-"}</TableCell>
                                                <TableCell>
                                                    <Badge className={getStatusColor(offer.status)}>
                                                        {offer.status}
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
                                                <TableCell className="flex items-center justify-center">
                                                    <Button
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openDeleteDialog(offer);
                                                        }}
                                                    >
                                                        <span className="sr-only">Sil</span>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
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
                                            className={`overflow-hidden ${getRowBackgroundColor(
                                                offer.status
                                            )} cursor-pointer`}
                                            onClick={() => handleRowClick(offer.id)}
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
                                                        {offer.status}
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
                                                                        href={`/offer/detail/${offer.id}`}
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
                                                                        openDeleteDialog(offer);
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

            {/* Create Offer Modal */}
            <AlertDialog open={isCreateOfferModalOpen} onOpenChange={setIsCreateOfferModalOpen}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <Plus className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <AlertDialogTitle className="text-lg font-semibold text-slate-900">
                                    Yeni Teklif Oluştur
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-sm text-slate-600">
                                    Hangi müşteri için teklif oluşturmak istiyorsunuz?
                                </AlertDialogDescription>
                            </div>
                        </div>
                    </AlertDialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                Müşteri Seçimi <span className="text-red-500">*</span>
                            </label>
                            <Popover
                                open={isCustomerSelectorOpen}
                                onOpenChange={setIsCustomerSelectorOpen}
                                modal={true}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={isCustomerSelectorOpen}
                                        className={`w-full justify-between h-10 text-left font-normal ${
                                            !selectedCustomerId
                                                ? "border-red-300 focus:border-red-500 focus:ring-red-500 text-slate-500"
                                                : "border-slate-300"
                                        }`}
                                    >
                                        {selectedCustomerId
                                            ? customers.find((customer) => customer.id === selectedCustomerId)?.name
                                            : "Müşteri seçin..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Müşteri ara..." className="h-9" />
                                        <CommandEmpty>
                                            {customersLoading ? (
                                                <div className="flex items-center justify-center py-4">
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                    <span className="text-sm">Yükleniyor...</span>
                                                </div>
                                            ) : (
                                                <div className="py-4 text-center text-sm text-muted-foreground">
                                                    Müşteri bulunamadı
                                                </div>
                                            )}
                                        </CommandEmpty>
                                        <CommandGroup>
                                            <CommandList className="max-h-[200px] overflow-y-auto">
                                                {customers.map((customer) => (
                                                    <CommandItem
                                                        key={customer.id}
                                                        onSelect={() => {
                                                            setSelectedCustomerId(customer.id);
                                                            setIsCustomerSelectorOpen(false);
                                                        }}
                                                        className="flex items-center gap-3 p-3 cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-3 flex-1">
                                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                                <User className="h-4 w-4 text-blue-600" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="font-medium text-sm">
                                                                    {customer.name}
                                                                </div>
                                                                <div className="text-xs text-slate-500">
                                                                    {customer.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {selectedCustomerId === customer.id && (
                                                            <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                                            </div>
                                                        )}
                                                    </CommandItem>
                                                ))}
                                            </CommandList>
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {selectedCustomerId && (
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                    <span className="text-sm font-medium text-green-800">
                                        {customers.find((c) => c.id === selectedCustomerId)?.name} seçildi
                                    </span>
                                </div>
                                <p className="text-xs text-green-700 mt-1 ml-6">
                                    Bu müşteri için yeni bir taslak teklif oluşturulacak.
                                </p>
                            </div>
                        )}
                    </div>

                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel
                            onClick={() => {
                                setSelectedCustomerId(null);
                                setIsCustomerSelectorOpen(false);
                                setIsCreateOfferModalOpen(false);
                            }}
                            className="flex-1"
                        >
                            İptal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCreateOffer}
                            disabled={!selectedCustomerId || isCreatingOffer}
                            className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                        >
                            {isCreatingOffer ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Oluşturuluyor...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Teklif Oluşturmaya Başla
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

