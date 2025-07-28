"use client";

import { useEffect, useState, use } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useOperations } from "@/hooks/api/useOperations";
import { Operation } from "@/lib/api/types";
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
import { Settings, Save, Edit } from "lucide-react";

// Form doğrulama şeması
const operationSchema = z.object({
    name: z.string().min(2, "Operasyon adı en az 2 karakter olmalıdır").max(50, "Operasyon adı çok uzun"),
    isActive: z.boolean(),
    qualityControl: z.boolean(),
    targetDuration: z.number().min(1, "Hedef süre en az 1 dakika olmalıdır").optional(),
});

type OperationFormData = z.infer<typeof operationSchema>;

interface EditOperationPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function EditOperationPage({ params }: EditOperationPageProps) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { updateOperation, getOperationById, isLoading } = useOperations();
    const [operation, setOperation] = useState<Operation | null>(null);
    const [isLoadingOperation, setIsLoadingOperation] = useState(true);
    const [isFormInitialized, setIsFormInitialized] = useState(false);

    const form = useForm<OperationFormData>({
        resolver: zodResolver(operationSchema),
        defaultValues: {
            name: "",
            isActive: true,
            qualityControl: false,
            targetDuration: undefined,
        },
    });

    // Operasyon bilgilerini yükle
    useEffect(() => {
        const loadOperation = async () => {
            try {
                const operationData = await getOperationById(resolvedParams.id);
                setOperation(operationData);
            } catch (error: unknown) {
                console.error("Operasyon yükleme hatası:", error);
                const errorMessage = error instanceof Error ? error.message : "Operasyon bulunamadı.";
                toast.error("Operasyon yüklenemedi", {
                    description: errorMessage,
                });
                router.push("/operations");
            } finally {
                setIsLoadingOperation(false);
            }
        };

        if (resolvedParams.id) {
            loadOperation();
        }
    }, [resolvedParams.id, getOperationById, router]);

    // Operasyon yüklendiğinde form'u doldur (sadece bir kez)
    useEffect(() => {
        if (operation && !isFormInitialized) {
            // Form'u tek seferde doldur (daha hızlı)
            const formData = {
                name: operation.name,
                isActive: operation.is_active,
                qualityControl: operation.quality_control,
                targetDuration: operation.target_duration,
            };

            form.reset(formData);
            setIsFormInitialized(true);
        }
    }, [operation, isFormInitialized, form]);

    const onSubmit = async (data: OperationFormData) => {
        try {
            // Tüm alanları gönder, backend sadece değişenleri güncelleyecek
            const operationData: Record<string, unknown> = {
                name: data.name,
                isActive: data.isActive,
                qualityControl: data.qualityControl,
                targetDuration: data.targetDuration,
            };

            await updateOperation(resolvedParams.id, operationData);

            toast.success("Operasyon başarıyla güncellendi!", {
                description: `${data.name} operasyonu güncellendi.`,
            });

            // Operasyonlar sayfasına yönlendir
            router.push("/operations");
        } catch (error: unknown) {
            console.error("Operasyon güncelleme hatası:", error);
            const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu, lütfen tekrar deneyin.";
            toast.error("Operasyon güncellenemedi", {
                description: errorMessage,
            });
        }
    };

    // Loading durumunda loading göster
    if (isLoadingOperation) {
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
                                    <BreadcrumbPage>Operasyon Düzenle</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                    <div className="flex items-center justify-center h-64">
                        <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            <span>Operasyon yükleniyor...</span>
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
                                <BreadcrumbLink href="/manufacture">Üretim</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden sm:block" />
                            <BreadcrumbItem className="hidden sm:block">
                                <BreadcrumbLink href="/operations">Operasyonlar</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden sm:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Operasyon Düzenle</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                {/* Başlık */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <Edit className="h-6 w-6" />
                        Operasyon Düzenle
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
                                        name="isActive"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Operasyon Durumu</FormLabel>
                                                    <div className="text-sm text-muted-foreground">
                                                        Operasyonun aktif olup olmadığını belirler
                                                    </div>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

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
                                        Operasyon Bilgileri
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-blue-50 rounded-lg">
                                            <h4 className="font-medium text-blue-900 mb-2">Operasyon Detayları</h4>
                                            <div className="space-y-2 text-sm text-blue-800">
                                                <div>
                                                    <strong>Operasyon ID:</strong> {operation?.id}
                                                </div>
                                                <div>
                                                    <strong>Oluşturulma Tarihi:</strong>{" "}
                                                    {operation?.created_at
                                                        ? new Date(operation.created_at).toLocaleDateString("tr-TR")
                                                        : "-"}
                                                </div>
                                                <div>
                                                    <strong>Son Güncelleme:</strong>{" "}
                                                    {operation?.updated_at
                                                        ? new Date(operation.updated_at).toLocaleDateString("tr-TR")
                                                        : "-"}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-green-50 rounded-lg">
                                            <h4 className="font-medium text-green-900 mb-2">Düzenleme Kuralları</h4>
                                            <ul className="space-y-1 text-sm text-green-800">
                                                <li>• Operasyon adı en az 2 karakter olmalıdır</li>
                                                <li>• Operasyon adı maksimum 50 karakter olabilir</li>
                                                <li>• Operasyon adı benzersiz olmalıdır</li>
                                                <li>• Operasyon durumunu aktif/pasif yapabilirsiniz</li>
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Alt Butonlar */}
                        <div className="flex flex-col sm:flex-row justify-end gap-4 sm:space-x-4 sm:space-y-0">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() => router.push("/operations")}
                            >
                                İptal
                            </Button>
                            <Button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                                disabled={isLoading || form.formState.isSubmitting}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {isLoading || form.formState.isSubmitting
                                    ? "Güncelleniyor..."
                                    : "Değişiklikleri Kaydet"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </>
    );
}
