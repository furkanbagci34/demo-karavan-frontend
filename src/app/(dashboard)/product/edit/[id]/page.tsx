"use client";

import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Package, Upload, ImageIcon, Save, X } from "lucide-react";
import React from "react";

// Dumi ürün verisi (gerçek DB yerine)
const mockProducts = [
    {
        id: 1,
        name: "12V LED Şerit",
        stockCode: "LED-001",
        stockQuantity: 120,
        purchasePrice: 2.5,
        salePrice: 4.2,
        description: "Su geçirmez, 5 metre.",
        image: "/images/product-placeholder.jpg",
    },
    {
        id: 2,
        name: "Akü 100Ah",
        stockCode: "AKU-100",
        stockQuantity: 15,
        purchasePrice: 80,
        salePrice: 120,
        description: "Derin döngü, bakım gerektirmez.",
        image: "/images/product-placeholder.jpg",
    },
    {
        id: 3,
        name: "Güneş Paneli 150W",
        stockCode: "GUN-150",
        stockQuantity: 8,
        purchasePrice: 60,
        salePrice: 95,
        description: "Monokristal, yüksek verim.",
        image: "/images/product-placeholder.jpg",
    },
    {
        id: 4,
        name: "Sigorta Kutusu",
        stockCode: "SIG-BOX",
        stockQuantity: 40,
        purchasePrice: 5,
        salePrice: 9.5,
        description: "6'lı modül, şeffaf kapak.",
        image: "/images/product-placeholder.jpg",
    },
];

const productSchema = z.object({
    name: z.string().min(1, "Ürün adı gereklidir").max(100, "Ürün adı çok uzun"),
    stockCode: z.string().min(1, "Stok kodu gereklidir").max(50, "Stok kodu çok uzun"),
    purchasePrice: z.coerce.number().min(0, "Alış fiyatı 0'dan küçük olamaz").max(999999, "Alış fiyatı çok yüksek"),
    salePrice: z.coerce.number().min(0, "Satış fiyatı 0'dan küçük olamaz").max(999999, "Satış fiyatı çok yüksek"),
    stockQuantity: z.coerce.number().min(0, "Stok miktarı 0'dan küçük olamaz").max(999999, "Stok miktarı çok yüksek"),
    description: z.string().optional(),
    image: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const id = Number(params.id);
    const product = mockProducts.find((p) => p.id === id);
    const [imagePreview, setImagePreview] = React.useState<string | null>(product?.image || null);

    const form = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: product
            ? {
                  name: product.name,
                  stockCode: product.stockCode,
                  purchasePrice: product.purchasePrice,
                  salePrice: product.salePrice,
                  stockQuantity: product.stockQuantity,
                  description: product.description,
                  image: product.image,
              }
            : {
                  name: "",
                  stockCode: "",
                  purchasePrice: 0,
                  salePrice: 0,
                  stockQuantity: 0,
                  description: "",
                  image: "",
              },
    });

    React.useEffect(() => {
        if (!product) {
            toast.error("Ürün bulunamadı");
            router.replace("/product");
        }
    }, [product, router]);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Dosya boyutu 5MB'dan büyük olamaz");
                return;
            }
            if (!file.type.startsWith("image/")) {
                toast.error("Sadece resim dosyaları kabul edilir");
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImagePreview(null);
    };

    const onSubmit = async (data: ProductFormData) => {
        try {
            // Güncellenen verileri konsola yazdır
            console.log("Güncellenen Ürün:", data);
            toast.success("Ürün başarıyla güncellendi!", {
                description: `${data.name} ürünü güncellendi.`,
            });
            // router.push("/product"); // İstersen otomatik listeye dönebilir
        } catch {
            toast.error("Ürün güncellenemedi", {
                description: "Bir hata oluştu, lütfen tekrar deneyin.",
            });
        }
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
                            <BreadcrumbItem className="hidden sm:block">
                                <BreadcrumbLink href="/product">Ürünler</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden sm:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Ürün Düzenle</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl sm:text-3xl font-bold">Ürün Düzenle</h1>
                </div>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {/* Sol Kolon - Ürün Bilgileri */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="h-5 w-5" />
                                        Ürün Bilgileri
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Ürün Adı</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ürün adını giriniz" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="stockCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Stok Kodu</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Stok kodunu giriniz" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="purchasePrice"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Alış Fiyatı (€)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            placeholder="0.00"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="salePrice"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Satış Fiyatı (€)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            placeholder="0.00"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="stockQuantity"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Stok Miktarı</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" min="0" placeholder="0" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Açıklama</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Ürün açıklamasını giriniz (isteğe bağlı)"
                                                        className="min-h-[100px]"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                            {/* Sağ Kolon - Fotoğraf Yükleme */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ImageIcon className="h-5 w-5" />
                                        Ürün Fotoğrafı
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {imagePreview ? (
                                            <div className="relative">
                                                <img
                                                    src={imagePreview}
                                                    alt="Ürün önizleme"
                                                    className="w-full aspect-square max-w-xs object-cover rounded-lg border mx-auto"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    className="absolute top-2 right-2"
                                                    onClick={removeImage}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 sm:p-12">
                                                <div className="flex flex-col items-center text-center space-y-4">
                                                    <Upload className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50" />
                                                    <div className="space-y-2">
                                                        <p className="text-sm font-medium">
                                                            Fotoğraf yüklemek için tıklayın
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            PNG, JPG, JPEG dosyaları kabul edilir (Max 5MB)
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-center">
                                            <Label htmlFor="image-upload" className="cursor-pointer">
                                                <Button type="button" variant="outline" className="w-full" asChild>
                                                    <span>
                                                        <Upload className="h-4 w-4 mr-2" />
                                                        {imagePreview ? "Fotoğrafı Değiştir" : "Fotoğraf Seç"}
                                                    </span>
                                                </Button>
                                            </Label>
                                            <Input
                                                id="image-upload"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-end gap-4 sm:space-x-4 sm:space-y-0">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() => router.push("/product")}
                            >
                                Vazgeç
                            </Button>
                            <Button
                                type="submit"
                                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                                disabled={form.formState.isSubmitting}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {form.formState.isSubmitting ? "Güncelleniyor..." : "Güncelle"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </>
    );
}
