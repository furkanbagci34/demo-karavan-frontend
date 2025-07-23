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
import { Input } from "@/components/ui/input";
import { Plus, Users, Pencil, Trash2, Loader2, AlertTriangle, Mail, Phone, Search, X } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState, useMemo } from "react";
import { Pagination } from "@/components/ui/pagination";
import { useCustomers } from "@/hooks/api/useCustomers";
import { Customer } from "@/lib/api/types";
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

const PAGE_SIZE = 10;

// Türkçe karakterleri normalize eden fonksiyon
const normalizeTurkishText = (text: string): string => {
    return text
        .replace(/İ/g, 'i')
        .replace(/I/g, 'ı')
        .replace(/Ğ/g, 'ğ')
        .replace(/Ü/g, 'ü')
        .replace(/Ş/g, 'ş')
        .replace(/Ö/g, 'ö')
        .replace(/Ç/g, 'ç')
        .toLowerCase();
};

export default function CustomerListPage() {
    const [currentPage, setCurrentPage] = React.useState(1);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const { customers, deleteCustomer, isLoading } = useCustomers();

    // Filtrelenmiş müşteriler
    const filteredCustomers = useMemo(() => {
        if (!searchTerm.trim()) {
            return customers;
        }

        const searchNormalized = normalizeTurkishText(searchTerm.trim());
        return customers.filter((customer) => {
            const nameMatch = normalizeTurkishText(customer.name).includes(searchNormalized);
            const emailMatch = customer.email ? normalizeTurkishText(customer.email).includes(searchNormalized) : false;
            const phoneMatch = customer.phone_number ? normalizeTurkishText(customer.phone_number).includes(searchNormalized) : false;
            return nameMatch || emailMatch || phoneMatch;
        });
    }, [customers, searchTerm]);

    // Arama terimi değiştiğinde ilk sayfaya dön
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Müşteri silme dialog'unu aç
    const openDeleteDialog = (customer: Customer) => {
        setCustomerToDelete(customer);
        setIsDeleteDialogOpen(true);
    };

    // Müşteri silme fonksiyonu
    const handleDeleteCustomer = async () => {
        if (!customerToDelete) return;

        try {
            await deleteCustomer(customerToDelete.id.toString());
            toast.success("Müşteri başarıyla silindi", {
                description: `${customerToDelete.name} müşterisi artık listede görünmeyecek.`,
            });

            // Dialog'u kapat (React Query otomatik olarak listeyi güncelleyecek)
            setIsDeleteDialogOpen(false);
            setCustomerToDelete(null);
        } catch (error: unknown) {
            console.error("Müşteri silme hatası:", error);
            const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu, lütfen tekrar deneyin.";
            toast.error("Müşteri silinemedi", {
                description: errorMessage,
            });
        }
    };

    // Arama terimini temizle
    const clearSearch = () => {
        setSearchTerm("");
    };

    // Pagination hesaplamaları
    const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
    const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
                                <BreadcrumbPage>Müşteriler</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <Users className="h-6 w-6" />
                        Müşteriler
                    </h1>
                    <Button asChild className="w-full sm:w-auto">
                        <Link href="/customer/add">
                            <Plus className="h-4 w-4 mr-2" />
                            Yeni Müşteri Ekle
                        </Link>
                    </Button>
                </div>

                {/* Arama Alanı */}
                <div className="relative">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Müşteri adı, e-posta veya telefon ile arayın..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-10"
                        />
                        {searchTerm && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearSearch}
                                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    {searchTerm && (
                        <p className="text-sm text-muted-foreground mt-2">
                            {filteredCustomers.length} müşteri bulundu
                            {filteredCustomers.length !== customers.length && ` (${customers.length} toplam müşteri)`}
                        </p>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Müşteri Listesi</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Desktop Tablo Görünümü */}
                        <div className="hidden lg:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Müşteri Adı</TableHead>
                                        <TableHead>E-posta</TableHead>
                                        <TableHead>Telefon</TableHead>
                                        <TableHead>Açıklama</TableHead>
                                        <TableHead className="text-center">Durum</TableHead>
                                        <TableHead className="text-center w-20">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Müşteriler yükleniyor...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedCustomers.map((customer) => (
                                            <TableRow key={customer.id}>
                                                <TableCell className="font-medium">{customer.name}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                                        {customer.email}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {customer.phone_number ? (
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                                            {customer.phone_number}
                                                        </div>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </TableCell>
                                                <TableCell
                                                    className="max-w-[200px] truncate"
                                                    title={customer.description}
                                                >
                                                    {customer.description || "-"}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            customer.is_active
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {customer.is_active ? "Aktif" : "Pasif"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="flex items-center justify-center gap-2">
                                                    <Link
                                                        href={`/customer/edit/${customer.id}`}
                                                        title="Düzenle"
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        className="text-red-600 hover:text-red-800 cursor-pointer"
                                                        title="Sil"
                                                        onClick={() => openDeleteDialog(customer)}
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
                            {isLoading ? (
                                <div className="p-8 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Müşteriler yükleniyor...
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                                    {paginatedCustomers.map((customer) => (
                                        <Card key={customer.id} className="overflow-hidden">
                                            <div className="p-4">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-sm truncate">
                                                            {customer.name}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                            <Mail className="h-3 w-3" />
                                                            {customer.email}
                                                        </div>
                                                        {customer.phone_number && (
                                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                                <Phone className="h-3 w-3" />
                                                                {customer.phone_number}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span
                                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                                                            customer.is_active
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {customer.is_active ? "Aktif" : "Pasif"}
                                                    </span>
                                                </div>
                                                {customer.description && (
                                                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                                                        {customer.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/customer/edit/${customer.id}`}
                                                        title="Düzenle"
                                                        className="text-blue-600 hover:text-blue-800 p-1"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        className="text-red-600 hover:text-red-800 cursor-pointer p-1"
                                                        title="Sil"
                                                        onClick={() => openDeleteDialog(customer)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>

                        {!isLoading && filteredCustomers.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                                {searchTerm ? "Arama kriterlerinize uygun müşteri bulunamadı." : "Kayıtlı müşteri bulunamadı."}
                            </div>
                        )}
                        {!isLoading && filteredCustomers.length > 0 && totalPages > 1 && (
                            <div className="py-4 flex justify-center">
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

            {/* Müşteri Silme Dialog'u */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Müşteriyi Sil
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>{customerToDelete?.name}</strong> müşterisini silmek istediğinizden emin misiniz?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteCustomer}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
