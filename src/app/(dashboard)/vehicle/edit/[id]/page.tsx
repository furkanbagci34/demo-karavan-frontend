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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Car, Upload, ImageIcon, Save, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useVehicles } from "@/hooks/api/useVehicles";
import { Vehicle } from "@/lib/api/types";

const vehicleSchema = z.object({
    name: z.string().min(1, "Araç adı gereklidir").max(500, "Araç adı çok uzun"),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

export default function EditVehiclePage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { getVehicleById, updateVehicle, isLoadingUpdate } = useVehicles();
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoadingVehicle, setIsLoadingVehicle] = useState(true);
    const [vehicleData, setVehicleData] = useState<Vehicle | null>(null);
    const [isFormInitialized, setIsFormInitialized] = useState(false);
    const [isImageInitialized, setIsImageInitialized] = useState(false);

    const form = useForm<VehicleFormData>({
        resolver: zodResolver(vehicleSchema),
        defaultValues: {
            name: "",
        },
    });

    // Aracı yükle
    useEffect(() => {
        const loadVehicle = async () => {
            try {
                const data = await getVehicleById(id);
                setVehicleData(data);
                // imagePreview'i sadece ilk yüklemede set et
                if (!isImageInitialized) {
                    setImagePreview(data.image || null);
                    setIsImageInitialized(true);
                }
            } catch (error: unknown) {
                console.error("Araç yüklenirken hata:", error);
                const errorMessage = error instanceof Error ? error.message : "Araç yüklenemedi";
                toast.error("Araç bulunamadı", {
                    description: errorMessage,
                });
                router.replace("/vehicle");
            } finally {
                setIsLoadingVehicle(false);
            }
        };

        if (id) {
            loadVehicle();
        }
    }, [id, getVehicleById, router, isImageInitialized]);

    // Araç yüklendiğinde form'u doldur (sadece bir kez)
    useEffect(() => {
        if (vehicleData && !isFormInitialized) {
            // Form'u tek seferde doldur (daha hızlı)
            const formData = {
                name: vehicleData.name,
            };

            form.reset(formData);
            setIsFormInitialized(true);
        }
    }, [vehicleData, isFormInitialized, form]);

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
                // Input'u temizle
                event.target.value = "";
                return;
            }

            // Dosya türü kontrolü
            if (!file.type.startsWith("image/")) {
                toast.error("Sadece resim dosyaları kabul edilir");
                // Input'u temizle
                event.target.value = "";
                return;
            }

            // Resmi sıkıştır (callback kullanarak daha hızlı)
            compressImage(file, (compressedImage) => {
                setImagePreview(compressedImage);
            });
        }
        // Input'u temizle ki aynı dosya tekrar seçilebilsin
        event.target.value = "";
    };

    const removeImage = () => {
        setImagePreview(null);
    };

    const onSubmit = async (data: VehicleFormData) => {
        try {
            // Tüm alanları gönder, backend sadece değişenleri güncelleyecek
            const updateData: Record<string, unknown> = {
                name: data.name,
                image: imagePreview,
            };

            await updateVehicle(id, updateData);

            toast.success("Araç başarıyla güncellendi!", {
                description: `${data.name} aracı güncellendi.`,
            });

            // Araç listesine geri dön
            router.push("/vehicle");
        } catch (error: unknown) {
            console.error("Araç güncelleme hatası:", error);
            const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu, lütfen tekrar deneyin.";
            toast.error("Araç güncellenemedi", {
                description: errorMessage,
            });
        }
    };

    // Loading durumunda loading göster
    if (isLoadingVehicle) {
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
                                    <BreadcrumbLink href="/vehicle">Araçlar</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden sm:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Araç Düzenle</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                    <div className="flex items-center justify-center h-64">
                        <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            <span>Araç yükleniyor...</span>
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
                                <BreadcrumbLink href="/vehicle">Araçlar</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden sm:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Araç Düzenle</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl sm:text-3xl font-bold">Araç Düzenle</h1>
                </div>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {/* Sol Kolon - Araç Bilgileri */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Car className="h-5 w-5" />
                                        Araç Bilgileri
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Araç Adı</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Araç adını giriniz" {...field} />
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
                                        Araç Fotoğrafı
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {imagePreview ? (
                                            <div className="relative">
                                                <img
                                                    src={imagePreview}
                                                    alt="Araç önizleme"
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
                                                            PNG, JPG, JPEG dosyaları kabul edilir (Max 2MB)
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
                                onClick={() => router.push("/vehicle")}
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
