"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useOperations } from "@/hooks/api/useOperations";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Settings, Save, Plus } from "lucide-react";

// Form doğrulama şeması
const operationSchema = z.object({
    name: z.string().min(2, "Operasyon adı en az 2 karakter olmalıdır").max(50, "Operasyon adı çok uzun"),
    qualityControl: z.boolean(),
    targetDuration: z.number().min(1, "Hedef süre en az 1 dakika olmalıdır").optional(),
});

type OperationFormData = z.infer<typeof operationSchema>;

export default function AddOperationPage() {
    const router = useRouter();
    const { createOperation, isLoading } = useOperations();

    const form = useForm<OperationFormData>({
        resolver: zodResolver(operationSchema),
        defaultValues: {
            name: "",
            qualityControl: false,
            targetDuration: undefined,
        },
    });

    const onSubmit = async (data: OperationFormData) => {
        try {
            const operationData = {
                name: data.name,
                qualityControl: data.qualityControl,
                targetDuration: data.targetDuration,
            };

            await createOperation(operationData);

            toast.success("Operasyon başarıyla eklendi!", {
                description: `${data.name} operasyonu sisteme kaydedildi.`,
            });

            // Operasyonlar sayfasına yönlendir
            router.push("/operations");
        } catch (error: unknown) {
            console.error("Operasyon ekleme hatası:", error);
            const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu, lütfen tekrar deneyin.";
            toast.error("Operasyon eklenemedi", {
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
                                <BreadcrumbLink href="/manufacture">Üretim</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden sm:block" />
                            <BreadcrumbItem className="hidden sm:block">
                                <BreadcrumbLink href="/operations">Operasyonlar</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden sm:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Operasyon Ekle</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                {/* Başlık */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <Plus className="h-6 w-6" />
                        Operasyon Ekle
                    </h1>
                </div>

                {/* Form */}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {/* Sol Kolon - Operasyon Bilgileri */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Settings className="h-5 w-5" />
                                        Operasyon Bilgileri
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Operasyon Adı *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Operasyon adını giriniz" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="targetDuration"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Hedef Süre (Dakika)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            placeholder="Hedef süreyi dakika cinsinden giriniz (isteğe bağlı)"
                                                            min="1"
                                                            {...field}
                                                            onChange={(e) =>
                                                                field.onChange(
                                                                    e.target.value
                                                                        ? parseInt(e.target.value)
                                                                        : undefined
                                                                )
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="qualityControl"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Kalite Kontrol</FormLabel>
                                                    <div className="text-sm text-muted-foreground">
                                                        Bu operasyonun kalite kontrole tabi tutulup tutulmadığını
                                                        belirler
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

                            {/* Sağ Kolon - Bilgi Kartı */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Settings className="h-5 w-5" />
                                        Bilgi
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4 text-sm text-muted-foreground">
                                        <div className="p-4 bg-blue-50 rounded-lg">
                                            <h4 className="font-medium text-blue-900 mb-2">
                                                Operasyon Ekleme Kuralları
                                            </h4>
                                            <ul className="space-y-1 text-blue-800">
                                                <li>• Operasyon adı en az 2 karakter olmalıdır</li>
                                                <li>• Operasyon adı maksimum 50 karakter olabilir</li>
                                                <li>• Operasyon adı benzersiz olmalıdır</li>
                                                <li>• Operasyon ekledikten sonra düzenleyebilirsiniz</li>
                                            </ul>
                                        </div>

                                        <div className="p-4 bg-green-50 rounded-lg">
                                            <h4 className="font-medium text-green-900 mb-2">Önemli Notlar</h4>
                                            <ul className="space-y-1 text-green-800">
                                                <li>• Operasyon bilgileri güvenli şekilde saklanır</li>
                                                <li>• Operasyon adı sistem genelinde kullanılır</li>
                                                <li>• Operasyon ekledikten sonra düzenleyebilirsiniz</li>
                                            </ul>
                                        </div>
                                    </div>
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
                                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto "
                                disabled={isLoading || form.formState.isSubmitting}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {isLoading || form.formState.isSubmitting ? "Kaydediliyor..." : "Operasyonu Kaydet"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </>
    );
}
