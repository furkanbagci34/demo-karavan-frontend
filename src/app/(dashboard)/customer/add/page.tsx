"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useCustomers } from "@/hooks/api/useCustomers";
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
import { Users, Save, UserPlus } from "lucide-react";

// Form doğrulama şeması
const customerSchema = z.object({
    name: z.string().min(2, "Müşteri adı en az 2 karakter olmalıdır").max(500, "Müşteri adı çok uzun"),
    email: z.string().email("Geçerli bir e-posta adresi giriniz").optional().or(z.literal("")),
    phoneNumber: z.string().optional(),
    description: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export default function AddCustomerPage() {
    const router = useRouter();
    const { createCustomer, isLoading } = useCustomers();

    const form = useForm<CustomerFormData>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            name: "",
            email: "",
            phoneNumber: "",
            description: "",
        },
    });

    const onSubmit = async (data: CustomerFormData) => {
        try {
            const customerData = {
                name: data.name,
                email: data.email || undefined,
                phoneNumber: data.phoneNumber || undefined,
                description: data.description || undefined,
            };

            await createCustomer(customerData);

            toast.success("Müşteri başarıyla eklendi!", {
                description: `${data.name} müşterisi sisteme kaydedildi.`,
            });

            // Müşteriler sayfasına yönlendir
            router.push("/customer");
        } catch (error: unknown) {
            console.error("Müşteri ekleme hatası:", error);
            const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu, lütfen tekrar deneyin.";
            toast.error("Müşteri eklenemedi", {
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
                                <BreadcrumbLink href="/customer">Müşteriler</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden sm:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Müşteri Ekle</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                {/* Başlık */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <UserPlus className="h-6 w-6" />
                        Müşteri Ekle
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
                                </CardContent>
                            </Card>

                            {/* Sağ Kolon - Bilgi Kartı */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Bilgi
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4 text-sm text-muted-foreground">
                                        <div className="p-4 bg-blue-50 rounded-lg">
                                            <h4 className="font-medium text-blue-900 mb-2">Müşteri Ekleme Kuralları</h4>
                                            <ul className="space-y-1 text-blue-800">
                                                <li>• Müşteri adı en az 2 karakter olmalıdır</li>
                                                <li>• E-posta adresi isteğe bağlıdır (benzersiz olmalıdır)</li>
                                                <li>• Telefon numarası isteğe bağlıdır</li>
                                                <li>• Açıklama alanı isteğe bağlıdır</li>
                                            </ul>
                                        </div>

                                        <div className="p-4 bg-green-50 rounded-lg">
                                            <h4 className="font-medium text-green-900 mb-2">Önemli Notlar</h4>
                                            <ul className="space-y-1 text-green-800">
                                                <li>• Müşteri bilgileri güvenli şekilde saklanır</li>
                                                <li>• E-posta adresi iletişim için kullanılır</li>
                                                <li>• Müşteri ekledikten sonra düzenleyebilirsiniz</li>
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
                                onClick={() => {
                                    form.reset();
                                }}
                            >
                                Temizle
                            </Button>
                            <Button
                                type="submit"
                                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                                disabled={isLoading || form.formState.isSubmitting}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {isLoading || form.formState.isSubmitting ? "Kaydediliyor..." : "Müşteriyi Kaydet"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </>
    );
}
