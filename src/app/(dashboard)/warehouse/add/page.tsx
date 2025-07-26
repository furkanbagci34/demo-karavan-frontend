"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useWarehouses } from "@/hooks/api/useWarehouses";
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
import { Warehouse, Save } from "lucide-react";

// Form doğrulama şeması
const warehouseSchema = z.object({
    name: z.string().min(1, "Depo adı gereklidir").max(500, "Depo adı çok uzun"),
    description: z.string().optional(),
});

type WarehouseFormData = z.infer<typeof warehouseSchema>;

export default function AddWarehousePage() {
    const router = useRouter();
    const { createWarehouse, isLoadingCreate } = useWarehouses();

    const form = useForm<WarehouseFormData>({
        resolver: zodResolver(warehouseSchema),
        defaultValues: {
            name: "",
            description: "",
        },
    });

    const onSubmit = async (data: WarehouseFormData) => {
        try {
            const warehouseData = {
                name: data.name,
                description: data.description || undefined,
                isActive: true,
            };

            await createWarehouse(warehouseData);

            toast.success("Depo başarıyla eklendi!", {
                description: `${data.name} deposu sisteme kaydedildi.`,
            });

            // Depolar sayfasına yönlendir
            router.push("/warehouse");
        } catch (error: unknown) {
            console.error("Depo ekleme hatası:", error);
            const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu, lütfen tekrar deneyin.";
            toast.error("Depo eklenemedi", {
                description: errorMessage,
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
                                <BreadcrumbLink href="/warehouse">Depolar</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden sm:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Depo Ekle</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                {/* Başlık */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl sm:text-3xl font-bold">Depo Ekle</h1>
                </div>

                {/* Form */}
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
                                </CardContent>
                            </Card>
                        </div>

                        {/* Alt Butonlar */}
                        <div className="flex flex-col sm:flex-row justify-end gap-4 sm:space-x-4 sm:space-y-0 pb-10">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() => {
                                    form.reset();
                                }}
                            >
                                Temizle
                            </Button>
                            <Button
                                type="submit"
                                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                                disabled={isLoadingCreate || form.formState.isSubmitting}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {isLoadingCreate || form.formState.isSubmitting ? "Kaydediliyor..." : "Depoyu Kaydet"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </>
    );
}
