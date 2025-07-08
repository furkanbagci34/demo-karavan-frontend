"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Trash2, Plus, Minus, ShoppingCart, Check, ChevronsUpDown, Package, Search, FileText } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

// Mock ürün verileri
const mockProducts = [
    {
        id: 1,
        name: "KABLO PAPUÇ, KABLO BAĞI, MAKARON VS.",
        description: "Çeşitli kablo bağlantı malzemeleri",
        price: 22.68,
        image: "/images/product-placeholder.jpg",
    },
    {
        id: 2,
        name: "SCHNEIDER C16A 30MA KAÇAK AKIM SIGORTASI",
        description: "Schneider marka kaçak akım sigortası",
        price: 44.4,
        image: "/images/product-placeholder.jpg",
    },
    {
        id: 3,
        name: "SCHNEIDER 2PC16 SIGORTA",
        description: "Schneider marka 2P C16 sigorta",
        price: 42.51,
        image: "/images/product-placeholder.jpg",
    },
    {
        id: 4,
        name: "SIGORTA KUTUSU PRIZ",
        description: "Sigorta kutusu priz sistemi",
        price: 12.28,
        image: "/images/product-placeholder.jpg",
    },
    {
        id: 5,
        name: "OCTOOPI KONTROL PANELİ DİJİTAL",
        description: "Dijital kontrol panel sistemi",
        price: 391.71,
        image: "/images/product-placeholder.jpg",
    },
];

interface OfferItem {
    id: number;
    productId: number;
    name: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    image: string;
}

export default function CreateOfferPage() {
    const [open, setOpen] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [offerItems, setOfferItems] = useState<OfferItem[]>([]);

    const handleAddProduct = (productId: number) => {
        const product = mockProducts.find((p) => p.id === productId);
        if (!product) return;

        // Aynı ürün zaten eklenmişse miktarını artır
        const existingItemIndex = offerItems.findIndex((item) => item.productId === product.id);

        if (existingItemIndex >= 0) {
            handleQuantityChange(existingItemIndex, offerItems[existingItemIndex].quantity + 1);
        } else {
            const newItem: OfferItem = {
                id: Date.now(),
                productId: product.id,
                name: product.name,
                description: product.description,
                quantity: 1,
                unitPrice: product.price,
                totalPrice: product.price,
                image: product.image,
            };

            setOfferItems([...offerItems, newItem]);
        }

        setSelectedProductId(null);
        setOpen(false);
    };

    const handleRemoveItem = (index: number) => {
        const updatedItems = offerItems.filter((_, i) => i !== index);
        setOfferItems(updatedItems);
    };

    const handleQuantityChange = (index: number, newQuantity: number) => {
        if (newQuantity <= 0) {
            handleRemoveItem(index);
            return;
        }

        const updatedItems = [...offerItems];
        updatedItems[index].quantity = newQuantity;
        updatedItems[index].totalPrice = newQuantity * updatedItems[index].unitPrice;
        setOfferItems(updatedItems);
    };

    const handlePriceChange = (index: number, newPrice: number) => {
        if (newPrice < 0) return;

        const updatedItems = [...offerItems];
        updatedItems[index].unitPrice = newPrice;
        updatedItems[index].totalPrice = updatedItems[index].quantity * newPrice;
        setOfferItems(updatedItems);
    };

    const calculateGrossTotal = () => {
        return offerItems.reduce((total, item) => total + item.totalPrice, 0);
    };

    const calculateDiscount = () => {
        // İndirim manuel olarak girilecek, şimdilik 0
        return 0;
    };

    const calculateNetTotal = () => {
        return calculateGrossTotal() - calculateDiscount();
    };

    const calculateVAT = () => {
        return calculateNetTotal() * 0.2; // %20 KDV
    };

    const calculateFinalTotal = () => {
        return calculateNetTotal() + calculateVAT();
    };

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/dashboard">Anasayfa</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Teklif Oluştur</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-6 space-y-6">
                {/* Başlık ve PDF Butonu */}
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Teklif Oluştur</h1>
                    <Button variant="secondary" size="lg" className="bg-green-600 hover:bg-green-700 text-white">
                        <FileText className="h-4 w-4 mr-2" />
                        PDF Olarak İndir
                    </Button>
                </div>

                {/* Ürün Ekleme Formu */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Ürün Ekle
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <label className="text-sm font-medium">Ürün Ara ve Seç</label>
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={open}
                                        className="w-full justify-between h-12 text-left font-normal"
                                    >
                                        {selectedProductId
                                            ? mockProducts.find((product) => product.id === selectedProductId)?.name
                                            : "Ürün ara veya seç..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[600px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Ürün adı ile ara..." className="h-12" />
                                        <CommandEmpty>
                                            <div className="flex flex-col items-center py-6 text-center">
                                                <Search className="h-8 w-8 text-muted-foreground mb-2" />
                                                <p className="text-sm text-muted-foreground">Ürün bulunamadı</p>
                                            </div>
                                        </CommandEmpty>
                                        <CommandGroup>
                                            <CommandList className="max-h-[300px]">
                                                {mockProducts.map((product) => (
                                                    <CommandItem
                                                        key={product.id}
                                                        value={`${product.name} ${product.description}`}
                                                        onSelect={() => {
                                                            handleAddProduct(product.id);
                                                        }}
                                                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/50"
                                                    >
                                                        <div className="flex-shrink-0 w-12 h-12 bg-muted rounded-lg flex items-center justify-center border">
                                                            <Package className="h-6 w-6 text-muted-foreground" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-medium text-sm leading-tight truncate">
                                                                        {product.name}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                                        {product.description}
                                                                    </p>
                                                                </div>
                                                                <div className="ml-3 flex-shrink-0 text-right">
                                                                    <div className="font-bold text-primary">
                                                                        €{formatNumber(product.price)}
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        Birim Fiyat
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex-shrink-0 ml-3">
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                                <Plus className="h-4 w-4 text-primary group-hover:text-primary-foreground" />
                                                            </div>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandList>
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Search className="h-3 w-3" />
                                <span>Ürün adı yazarak arama yapabilir veya listeden seçebilirsiniz</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Teklif Tablosu */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Teklif Detayları</CardTitle>
                            <Badge variant="outline" className="text-sm">
                                {offerItems.length} ürün eklendi
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {offerItems.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium mb-2">Henüz ürün eklenmedi</p>
                                <p className="text-sm">Yukarıdaki formdan ürün ekleyerek başlayın</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-16">Sıra</TableHead>
                                            <TableHead className="w-20">Resim</TableHead>
                                            <TableHead>Ürün</TableHead>
                                            <TableHead className="w-32">Miktar</TableHead>
                                            <TableHead className="w-32">Birim Fiyat</TableHead>
                                            <TableHead className="w-32">Toplam (KDV Hariç)</TableHead>
                                            <TableHead className="w-20">İşlem</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {offerItems.map((item, index) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{index + 1}</TableCell>
                                                <TableCell>
                                                    <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                                                        <span className="text-xs text-muted-foreground">IMG</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium text-sm leading-tight">{item.name}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {item.description}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            onClick={() =>
                                                                handleQuantityChange(index, item.quantity - 1)
                                                            }
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </Button>
                                                        <Input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => {
                                                                const value = parseInt(e.target.value) || 0;
                                                                handleQuantityChange(index, value);
                                                            }}
                                                            className="w-16 h-8 text-center"
                                                            min="1"
                                                        />
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            onClick={() =>
                                                                handleQuantityChange(index, item.quantity + 1)
                                                            }
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        value={item.unitPrice}
                                                        onChange={(e) => {
                                                            const value = parseFloat(e.target.value) || 0;
                                                            handlePriceChange(index, value);
                                                        }}
                                                        className="w-28"
                                                        step="0.01"
                                                        min="0"
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    €{formatNumber(item.totalPrice)}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                        onClick={() => handleRemoveItem(index)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Toplam Özeti */}
                {offerItems.length > 0 && (
                    <div className="flex justify-end">
                        <Card className="w-1/4">
                            <CardContent className="pt-6">
                                <div className="space-y-3">
                                    <div className="text-right space-y-2">
                                        <div className="text-base">
                                            <span className="text-muted-foreground">Brüt </span>
                                            <span className="font-medium">€{formatNumber(calculateGrossTotal())}</span>
                                        </div>
                                        <div className="text-base">
                                            <span className="text-muted-foreground">İndirim </span>
                                            <span className="font-medium text-red-600">
                                                €{formatNumber(calculateDiscount())}
                                            </span>
                                        </div>
                                        <div className="text-base">
                                            <span className="text-muted-foreground">Net </span>
                                            <span className="font-medium">€{formatNumber(calculateNetTotal())}</span>
                                        </div>
                                        <div className="text-base">
                                            <span className="text-muted-foreground">KDV (%20) </span>
                                            <span className="font-medium">€{formatNumber(calculateVAT())}</span>
                                        </div>
                                        <Separator />
                                        <div className="text-xl font-bold">
                                            <span className="text-muted-foreground">Toplam </span>
                                            <span className="text-primary">€{formatNumber(calculateFinalTotal())}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </>
    );
}
