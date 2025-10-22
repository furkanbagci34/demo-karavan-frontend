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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, AlertTriangle, Search, Car, ClipboardCheck, ChevronRight, Users } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { useQualityControl } from "@/hooks/api/useQualityControl";
import { useDebounce } from "@/hooks/use-debounce";
import { useRouter } from "next/navigation";

export default function QualityControlPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");

    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const { groupedQualityControlItems, isLoadingGrouped } = useQualityControl();

    // Arama filtresi uygula
    const filteredItems = groupedQualityControlItems.filter((item) => {
        if (!debouncedSearchTerm) return true;
        const searchLower = debouncedSearchTerm.toLowerCase();
        return (
            item.vehicle_name.toLowerCase().includes(searchLower) ||
            item.vehicle_brand_model?.toLowerCase().includes(searchLower) ||
            item.created_by_names?.toLowerCase().includes(searchLower)
        );
    });

    // Tarih formatla
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("tr-TR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const handleRowClick = (vehicleId: number) => {
        router.push(`/quality-control/add?vehicleId=${vehicleId}`);
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
                                <BreadcrumbPage>Kalite Kontrol</BreadcrumbPage>
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
                            Kalite Kontrol Tanımlama
                        </h1>
                        <p className="text-muted-foreground">
                            Araç modellerine göre kalite kontrol maddelerini tanımlayın ve yönetin
                        </p>
                    </div>
                    <Button asChild className="w-fit">
                        <Link href="/quality-control/add">
                            <Plus className="mr-2 h-4 w-4" />
                            Yeni Madde Ekle
                        </Link>
                    </Button>
                </div>

                {/* Search Section */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            Arama
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Model adı, marka veya oluşturan kişi ile ara..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            {debouncedSearchTerm && (
                                <Button variant="outline" onClick={() => setSearchTerm("")} size="sm">
                                    Temizle
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Table Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Car className="h-5 w-5" />
                                Araç Modelleri
                            </span>
                            {debouncedSearchTerm && (
                                <Badge variant="secondary" className="text-xs">
                                    &quot;{debouncedSearchTerm}&quot; için {filteredItems.length} sonuç
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoadingGrouped ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                <span>Yükleniyor...</span>
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">
                                    {debouncedSearchTerm ? "Sonuç bulunamadı" : "Henüz kalite kontrol maddesi yok"}
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    {debouncedSearchTerm
                                        ? "Arama kriterlerinizi değiştirerek tekrar deneyin."
                                        : "İlk kalite kontrol maddesini oluşturmak için yukarıdaki butona tıklayın."}
                                </p>
                                {!debouncedSearchTerm && (
                                    <Button asChild>
                                        <Link href="/quality-control/add">
                                            <Plus className="mr-2 h-4 w-4" />
                                            İlk Maddeyi Oluştur
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Mobil Görünüm */}
                                <div className="block lg:hidden space-y-3">
                                    {filteredItems.map((item) => (
                                        <div
                                            key={item.vehicle_id}
                                            onClick={() => handleRowClick(item.vehicle_id)}
                                            className="border rounded-lg p-3 sm:p-4 space-y-3 bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                    {item.vehicle_image ? (
                                                        <img
                                                            src={item.vehicle_image}
                                                            alt={item.vehicle_name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Car className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-sm mb-1 truncate">
                                                        {item.vehicle_name}
                                                    </h4>
                                                    {item.vehicle_brand_model && (
                                                        <p className="text-xs text-muted-foreground mb-2 truncate">
                                                            {item.vehicle_brand_model}
                                                        </p>
                                                    )}
                                                    <div className="flex flex-wrap gap-1 sm:gap-2">
                                                        <Badge variant="secondary" className="text-xs">
                                                            {item.total_items} Madde
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                            {item.active_items} Aktif
                                                        </Badge>
                                                        {item.inactive_items > 0 && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                {item.inactive_items} Pasif
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                                                <div className="flex items-center gap-1 min-w-0 flex-1">
                                                    <Users className="h-3 w-3 flex-shrink-0" />
                                                    <span className="truncate">{item.created_by_names || "-"}</span>
                                                </div>
                                                <span className="text-xs flex-shrink-0 ml-2">
                                                    {formatDate(item.last_updated)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop/Tablet Görünüm */}
                                <div className="hidden lg:block rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[250px]">Araç Modeli</TableHead>
                                                <TableHead className="hidden xl:table-cell">Oluşturan</TableHead>
                                                <TableHead className="text-center">Toplam</TableHead>
                                                <TableHead className="text-center">Aktif</TableHead>
                                                <TableHead className="text-center">Pasif</TableHead>
                                                <TableHead className="hidden xl:table-cell">Son Güncelleme</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredItems.map((item) => (
                                                <TableRow
                                                    key={item.vehicle_id}
                                                    onClick={() => handleRowClick(item.vehicle_id)}
                                                    className="cursor-pointer hover:bg-accent/50"
                                                >
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                                {item.vehicle_image ? (
                                                                    <img
                                                                        src={item.vehicle_image}
                                                                        alt={item.vehicle_name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <Car className="w-5 h-5 text-gray-400" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium">{item.vehicle_name}</div>
                                                                {item.vehicle_brand_model && (
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {item.vehicle_brand_model}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden xl:table-cell">
                                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                            <Users className="h-3 w-3" />
                                                            <span className="truncate max-w-[200px]">
                                                                {item.created_by_names || "-"}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="secondary" className="font-semibold">
                                                            {item.total_items}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="default" className="bg-green-600">
                                                            {item.active_items}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="secondary">{item.inactive_items}</Badge>
                                                    </TableCell>
                                                    <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                                                        {formatDate(item.last_updated)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
            </div>
        </>
    );
}
