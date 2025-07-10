"use client";

import { useEffect, useState, use } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useCustomers } from "@/hooks/api/useCustomers";
import { Customer } from "@/lib/api/types";
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
import { PhoneInput } from "@/components/ui/phone-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Users, Save, Edit } from "lucide-react";

// Form doğrulama şeması
const customerSchema = z.object({
    name: z.string().min(2, "Müşteri adı en az 2 karakter olmalıdır").max(500, "Müşteri adı çok uzun"),
    email: z.string().email("Geçerli bir e-posta adresi giriniz").optional().or(z.literal("")),
    phoneNumber: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface EditCustomerPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function EditCustomerPage({ params }: EditCustomerPageProps) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { updateCustomer, getCustomerById, isLoading } = useCustomers();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);
    const [isFormInitialized, setIsFormInitialized] = useState(false);

    const form = useForm<CustomerFormData>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            name: "",
            email: "",
            phoneNumber: "",
            description: "",
            isActive: true,
        },
    });

    // Müşteri bilgilerini yükle
    useEffect(() => {
        const loadCustomer = async () => {
            try {
                const customerData = await getCustomerById(resolvedParams.id);
                setCustomer(customerData);
            } catch (error: unknown) {
                console.error("Müşteri yükleme hatası:", error);
                const errorMessage = error instanceof Error ? error.message : "Müşteri bulunamadı.";
                toast.error("Müşteri yüklenemedi", {
                    description: errorMessage,
                });
                router.push("/customer");
            } finally {
                setIsLoadingCustomer(false);
            }
        };

        if (resolvedParams.id) {
            loadCustomer();
        }
    }, [resolvedParams.id, getCustomerById, router]);

    // Müşteri yüklendiğinde form'u doldur (sadece bir kez)
    useEffect(() => {
        if (customer && !isFormInitialized) {
            // Form'u tek seferde doldur (daha hızlı)
            const formData = {
                name: customer.name,
                email: customer.email,
                phoneNumber: customer.phone_number || "",
                description: customer.description || "",
                isActive: customer.is_active,
            };

            form.reset(formData);
            setIsFormInitialized(true);
        }
    }, [customer, isFormInitialized, form]);

    const onSubmit = async (data: CustomerFormData) => {
        try {
            // Tüm alanları gönder, backend sadece değişenleri güncelleyecek
            const customerData: Record<string, unknown> = {
                name: data.name,
                email: data.email || null,
                phoneNumber: data.phoneNumber || null,
                description: data.description || null,
                isActive: data.isActive,
            };

            await updateCustomer(resolvedParams.id, customerData);

            toast.success("Müşteri başarıyla güncellendi!", {
                description: `${data.name} müşterisi güncellendi.`,
            });

            // Müşteriler sayfasına yönlendir
            router.push("/customer");
        } catch (error: unknown) {
            console.error("Müşteri güncelleme hatası:", error);
            const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu, lütfen tekrar deneyin.";
            toast.error("Müşteri güncellenemedi", {
                description: errorMessage,
            });
        }
    };

    // Loading durumunda loading göster
    if (isLoadingCustomer) {
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
                                    <BreadcrumbLink href="/customer">Müşteriler</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden sm:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Müşteri Düzenle</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                    <div className="flex items-center justify-center h-64">
                        <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            <span>Müşteri yükleniyor...</span>
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
                                <BreadcrumbLink href="/customer">Müşteriler</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden sm:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Müşteri Düzenle</BreadcrumbPage>
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
                        Müşteri Düzenle
                    </h1>
                </div>

                {/* Form */}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {/* Sol Kolon - Müşteri Bilgileri */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Müşteri Bilgileri
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Müşteri Adı *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Müşteri adını giriniz" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>E-posta Adresi</FormLabel>
                                                <FormControl>
                                                    <Input type="email" placeholder="ornek@email.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="phoneNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Telefon Numarası</FormLabel>
                                                <FormControl>
                                                    <PhoneInput
                                                        placeholder="+90 542 294 0610"
                                                        value={field.value}
                                                        onChange={(value) => field.onChange(value)}
                                                    />
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
                                                        placeholder="Müşteri hakkında açıklama giriniz (isteğe bağlı)"
                                                        className="min-h-[100px]"
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
                                                    <FormLabel className="text-base">Müşteri Durumu</FormLabel>
                                                    <div className="text-sm text-muted-foreground">
                                                        Müşterinin aktif olup olmadığını belirler
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
                                        <Users className="h-5 w-5" />
                                        Müşteri Bilgileri
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-blue-50 rounded-lg">
                                            <h4 className="font-medium text-blue-900 mb-2">Müşteri Detayları</h4>
                                            <div className="space-y-2 text-sm text-blue-800">
                                                <div>
                                                    <strong>Müşteri ID:</strong> {customer?.id}
                                                </div>
                                                <div>
                                                    <strong>Oluşturulma Tarihi:</strong>{" "}
                                                    {customer?.created_at
                                                        ? new Date(customer.created_at).toLocaleDateString("tr-TR")
                                                        : "-"}
                                                </div>
                                                <div>
                                                    <strong>Son Güncelleme:</strong>{" "}
                                                    {customer?.updated_at
                                                        ? new Date(customer.updated_at).toLocaleDateString("tr-TR")
                                                        : "-"}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-green-50 rounded-lg">
                                            <h4 className="font-medium text-green-900 mb-2">Düzenleme Kuralları</h4>
                                            <ul className="space-y-1 text-sm text-green-800">
                                                <li>• Müşteri adı en az 2 karakter olmalıdır</li>
                                                <li>• E-posta adresi benzersiz olmalıdır</li>
                                                <li>• Telefon numarası isteğe bağlıdır</li>
                                                <li>• Açıklama alanı isteğe bağlıdır</li>
                                                <li>• Müşteri durumunu aktif/pasif yapabilirsiniz</li>
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
                                onClick={() => router.push("/customer")}
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
