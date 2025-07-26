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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Warehouse, Save } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useWarehouses } from "@/hooks/api/useWarehouses";
import { Warehouse as WarehouseType } from "@/lib/api/types";

const warehouseSchema = z.object({
    name: z.string().min(1, "Depo adı gereklidir").max(500, "Depo adı çok uzun"),
    description: z.string().optional(),
    isActive: z.boolean(),
});

type WarehouseFormData = z.infer<typeof warehouseSchema>;

export default function EditWarehousePage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { getWarehouseById, updateWarehouse, isLoadingUpdate } = useWarehouses();
    const [isLoadingWarehouse, setIsLoadingWarehouse] = useState(true);
    const [warehouseData, setWarehouseData] = useState<WarehouseType | null>(null);
    const [isFormInitialized, setIsFormInitialized] = useState(false);

    const form = useForm<WarehouseFormData>({
        resolver: zodResolver(warehouseSchema),
        defaultValues: {
            name: "",
            description: "",
            isActive: true,
        },
    });

    // Depoyu yükle
    useEffect(() => {
        const loadWarehouse = async () => {
            try {
                const data = await getWarehouseById(id);
                setWarehouseData(data);
            } catch (error: unknown) {
                console.error("Depo yüklenirken hata:", error);
                const errorMessage = error instanceof Error ? error.message : "Depo yüklenemedi";
                toast.error("Depo bulunamadı", {
                    description: errorMessage,
                });
                router.replace("/warehouse");
            } finally {
                setIsLoadingWarehouse(false);
            }
        };

        if (id) {
            loadWarehouse();
        }
    }, [id, getWarehouseById, router]);

    // Depo yüklendiğinde form'u doldur (sadece bir kez)
    useEffect(() => {
        if (warehouseData && !isFormInitialized) {
            // Form'u tek seferde doldur (daha hızlı)
            const formData = {
                name: warehouseData.name,
                description: warehouseData.description || "",
                isActive: warehouseData.is_active,
            };

            form.reset(formData);
            setIsFormInitialized(true);
        }
    }, [warehouseData, isFormInitialized, form]);

    const onSubmit = async (data: WarehouseFormData) => {
        try {
            // Tüm alanları gönder, backend sadece değişenleri güncelleyecek
            const updateData: Record<string, unknown> = {
                name: data.name,
                description: data.description || undefined,
                is_active: data.isActive,
            };

            await updateWarehouse(id, updateData);

            toast.success("Depo başarıyla güncellendi!", {
                description: `${data.name} deposu güncellendi.`,
            });

            // Depo listesine geri dön
            router.push("/warehouse");
        } catch (error: unknown) {
            console.error("Depo güncelleme hatası:", error);
            const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu, lütfen tekrar deneyin.";
            toast.error("Depo güncellenemedi", {
                description: errorMessage,
            });
        }
    };

    // Loading durumunda loading göster
    if (isLoadingWarehouse) {
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
                                    <BreadcrumbLink href="/warehouse">Depolar</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden sm:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Depo Düzenle</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                    <div className="flex items-center justify-center h-64">
                        <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            <span>Depo yükleniyor...</span>
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
                                <BreadcrumbLink href="/warehouse">Depolar</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden sm:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Depo Düzenle</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl sm:text-3xl font-bold">Depo Düzenle</h1>
                </div>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 xl:grid-cols-1 gap-6">
                            {/* Depo Bilgileri */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Warehouse className="h-5 w-5" />
                                        Depo Bilgileri
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Depo Adı</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Depo adını giriniz" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Açıklama</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Depo hakkında açıklama giriniz (opsiyonel)"
                                                        className="min-h-20"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="isActive"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Depo Durumu</FormLabel>
                                                    <div className="text-sm text-muted-foreground">
                                                        Depoyu aktif veya pasif hale getirin
                                                    </div>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-end gap-4 sm:space-x-4 sm:space-y-0">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() => router.push("/warehouse")}
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
