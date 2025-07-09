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
import React, { useEffect, useState } from "react";
import { useProducts } from "@/hooks/api/useProducts";
import { Product } from "@/lib/api/types";

const productSchema = z.object({
    name: z.string().min(1, "Ürün adı gereklidir").max(100, "Ürün adı çok uzun"),
    stockCode: z.string().max(50, "Stok kodu çok uzun").optional(),
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
    const id = params.id as string;
    const { getProductById, updateProduct, isLoadingUpdate } = useProducts();
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoadingProduct, setIsLoadingProduct] = useState(true);
    const [productData, setProductData] = useState<Product | null>(null);
    const [isFormInitialized, setIsFormInitialized] = useState(false);
    const [isImageInitialized, setIsImageInitialized] = useState(false);

    const form = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: "",
            stockCode: "",
            purchasePrice: 0,
            salePrice: 0,
            stockQuantity: 0,
            description: "",
            image: "",
        },
    });

    // Ürünü yükle
    useEffect(() => {
        const loadProduct = async () => {
            try {
                const data = await getProductById(id);
                setProductData(data);
                // imagePreview'i sadece ilk yüklemede set et
                if (!isImageInitialized) {
                    setImagePreview(data.image || null);
                    setIsImageInitialized(true);
                }
            } catch (error: unknown) {
                console.error("Ürün yüklenirken hata:", error);
                const errorMessage = error instanceof Error ? error.message : "Ürün yüklenemedi";
                toast.error("Ürün bulunamadı", {
                    description: errorMessage,
                });
                router.replace("/product");
            } finally {
                setIsLoadingProduct(false);
            }
        };

        if (id) {
            loadProduct();
        }
    }, [id, getProductById, router, isImageInitialized]);

    // Ürün yüklendiğinde form'u doldur (sadece bir kez)
    useEffect(() => {
        if (productData && !isFormInitialized) {
            // Form'u tek seferde doldur (daha hızlı)
            const formData = {
                name: productData.name,
                stockCode: productData.code || "",
                purchasePrice: productData.purchase_price || 0,
                salePrice: productData.sale_price || 0,
                stockQuantity: productData.stock_quantity || 0,
                description: productData.description || "",
            };

            form.reset(formData);
            setIsFormInitialized(true);
        }
    }, [productData, isFormInitialized, form]);

    const compressImage = (file: File, callback: (compressedImage: string) => void) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        const img = new Image();

        img.onload = () => {
            // Maksimum boyutlar
            const maxWidth = 800;
            const maxHeight = 800;

            let { width, height } = img;

            // Boyutları orantılı olarak küçült
            if (width > height) {
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;

            // Resmi çiz
            ctx.drawImage(img, 0, 0, width, height);

            // JPEG formatında sıkıştır (0.7 kalite)
            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
            callback(compressedDataUrl);
        };

        img.src = URL.createObjectURL(file);
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Dosya boyutu kontrolü (max 2MB - add sayfasıyla aynı)
            if (file.size > 2 * 1024 * 1024) {
                toast.error("Dosya boyutu 2MB'dan büyük olamaz");
                return;
            }

            // Dosya türü kontrolü
            if (!file.type.startsWith("image/")) {
                toast.error("Sadece resim dosyaları kabul edilir");
                return;
            }

            // Resmi sıkıştır (callback kullanarak daha hızlı)
            compressImage(file, (compressedImage) => {
                setImagePreview(compressedImage);
            });
        }
    };

    const removeImage = () => {
        setImagePreview(null);
    };

    const onSubmit = async (data: ProductFormData) => {
        try {
            // Tüm alanları gönder, backend sadece değişenleri güncelleyecek
            const updateData: Record<string, unknown> = {
                name: data.name,
                code: data.stockCode || null,
                purchasePrice: data.purchasePrice,
                salePrice: data.salePrice,
                stockQuantity: data.stockQuantity,
                description: data.description || null,
                image: imagePreview,
            };

            await updateProduct(id, updateData);

            toast.success("Ürün başarıyla güncellendi!", {
                description: `${data.name} ürünü güncellendi.`,
            });

            // Ürün listesine geri dön
            router.push("/product");
        } catch (error: unknown) {
            console.error("Ürün güncelleme hatası:", error);
            const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu, lütfen tekrar deneyin.";
            toast.error("Ürün güncellenemedi", {
                description: errorMessage,
            });
        }
    };

    // Loading durumunda loading göster
    if (isLoadingProduct) {
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
                    <div className="flex items-center justify-center h-64">
                        <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            <span>Ürün yükleniyor...</span>
                        </div>
                    </div>
                </div>
            </>
        );
    }

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
                                                <FormLabel>Stok Kodu (İsteğe Bağlı)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Stok kodunu giriniz (opsiyonel)" {...field} />
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
                                disabled={form.formState.isSubmitting || isLoadingUpdate}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {form.formState.isSubmitting || isLoadingUpdate ? "Güncelleniyor..." : "Güncelle"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </>
    );
}
