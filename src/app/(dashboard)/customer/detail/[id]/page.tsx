"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useCustomers } from "@/hooks/api/useCustomers";
import { usePayments, type Payment, type CreatePaymentData } from "@/hooks/api/usePayments";
import { useOffers, type Offer } from "@/hooks/api/useOffers";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users, Save, CreditCard, Plus, CalendarIcon, Euro, Trash2 } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

// Form doğrulama şeması
const customerSchema = z.object({
    name: z.string().min(2, "Müşteri adı en az 2 karakter olmalıdır").max(500, "Müşteri adı çok uzun"),
    email: z.string().email("Geçerli bir e-posta adresi giriniz").optional().or(z.literal("")),
    phoneNumber: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerDetailPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function CustomerDetailPage({ params }: CustomerDetailPageProps) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { updateCustomer, getCustomerById, isLoading } = useCustomers();
    const { createPayment, getPaymentsByCustomerId, deletePayment } = usePayments();
    const { getOffersByCustomerId } = useOffers();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);
    const [isFormInitialized, setIsFormInitialized] = useState(false);
    const [activeTab, setActiveTab] = useState<"info" | "payments">("info");

    // Payment states
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [customerOffers, setCustomerOffers] = useState<Offer[]>([]);
    const [paymentForm, setPaymentForm] = useState<{
        offerId?: number;
        paymentAmount: string;
        paymentDate: Date;
        description: string;
    }>({
        offerId: undefined,
        paymentAmount: "",
        paymentDate: new Date(),
        description: "",
    });
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Delete payment states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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
                name: customer.name || "",
                email: customer.email || "",
                phoneNumber: customer.phone_number || "",
                description: customer.description || "",
                isActive: customer.is_active,
            };

            form.reset(formData);
            setIsFormInitialized(true);
        }
    }, [customer, isFormInitialized, form]);

    // Payment functions
    const loadPayments = useCallback(async () => {
        if (!customer) return;
        try {
            const paymentsData = await getPaymentsByCustomerId(customer.id);
            setPayments(paymentsData);
        } catch (error) {
            console.error("Tahsilatlar yüklenirken hata:", error);
            toast.error("Tahsilatlar yüklenemedi");
        }
    }, [customer, getPaymentsByCustomerId]);

    const loadCustomerOffers = useCallback(async () => {
        if (!customer) return;
        try {
            const offersData = await getOffersByCustomerId(customer.id);
            setCustomerOffers(offersData);
        } catch (error) {
            console.error("Müşteri teklifleri yüklenirken hata:", error);
        }
    }, [customer, getOffersByCustomerId]);

    // Tab değiştiğinde ilgili verileri yükle
    useEffect(() => {
        if (!customer) return;

        if (activeTab === "payments") {
            loadPayments();
            loadCustomerOffers();
        }
        // 'info' tab'ı için müşteri bilgileri zaten yüklenmiş durumda
    }, [activeTab, customer, loadPayments, loadCustomerOffers]);

    const handlePaymentFormChange = (field: string, value: string | number | Date | undefined) => {
        // Ödeme tutarı için özel işlem
        if (field === "paymentAmount" && typeof value === "string") {
            // Türkçe ondalık ayıracını standart hale getir
            const normalizedValue = value.replace(/,/g, ".");

            // Sadece sayı, nokta ve boş string kabul et
            if (normalizedValue === "" || /^\d*\.?\d*$/.test(normalizedValue)) {
                setPaymentForm((prev) => ({
                    ...prev,
                    [field]: normalizedValue,
                }));
            }
            return;
        }

        setPaymentForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleCreatePayment = async () => {
        if (!customer || !paymentForm.paymentAmount || !paymentForm.paymentDate) {
            toast.error("Lütfen gerekli alanları doldurun");
            return;
        }

        try {
            // Tutarı parse et ve validate et
            const parsedAmount = parseFloat(paymentForm.paymentAmount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                toast.error("Lütfen geçerli bir tutar giriniz");
                return;
            }

            const paymentData: CreatePaymentData = {
                customerId: customer.id,
                paymentAmount: parsedAmount,
                paymentDate: paymentForm.paymentDate.toISOString().split("T")[0],
                description: paymentForm.description || undefined,
                offerId: paymentForm.offerId || undefined,
            };

            await createPayment(paymentData);
            toast.success("Tahsilat başarıyla eklendi");
            setShowPaymentModal(false);
            setPaymentForm({
                offerId: undefined,
                paymentAmount: "",
                paymentDate: new Date(),
                description: "",
            });
            loadPayments(); // Listeyi güncelle
        } catch (error) {
            console.error("Tahsilat eklenirken hata:", error);
            toast.error("Tahsilat eklenemedi");
        }
    };

    const handleDeletePayment = (payment: Payment) => {
        setPaymentToDelete(payment);
        setShowDeleteModal(true);
    };

    const confirmDeletePayment = async () => {
        if (!paymentToDelete) return;

        try {
            setIsDeleting(true);
            await deletePayment(paymentToDelete.id);
            toast.success("Tahsilat başarıyla silindi");
            setShowDeleteModal(false);
            setPaymentToDelete(null);
            loadPayments(); // Listeyi güncelle
        } catch (error) {
            console.error("Tahsilat silinirken hata:", error);
            toast.error("Tahsilat silinemedi");
        } finally {
            setIsDeleting(false);
        }
    };

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
                                    <BreadcrumbPage>Müşteri Detay</BreadcrumbPage>
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
                                <BreadcrumbPage>Müşteri Detay</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 space-y-6">
                {/* Tab Navigation */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            type="button"
                            onClick={() => setActiveTab("info")}
                            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                activeTab === "info"
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            <Users className="h-4 w-4" />
                            Müşteri Bilgileri
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("payments")}
                            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                activeTab === "payments"
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            <CreditCard className="h-4 w-4" />
                            Tahsilatlar
                        </button>
                    </nav>
                </div>

                {/* Tab Content */}
                {activeTab === "info" && (
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
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
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
                )}

                {activeTab === "payments" && (
                    <div className="space-y-6">
                        {/* Toplam Tahsilat Card */}
                        {payments.length > 0 && (
                            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold text-green-800">Toplam Tahsilat</h3>
                                            <p className="text-sm text-green-600 mt-1">{payments.length} ödeme kaydı</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-green-800">
                                                {new Intl.NumberFormat("tr-TR", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                }).format(
                                                    payments.reduce((total, payment) => {
                                                        const amount =
                                                            typeof payment.payment_amount === "string"
                                                                ? parseFloat(payment.payment_amount)
                                                                : payment.payment_amount;
                                                        return total + (isNaN(amount) ? 0 : amount);
                                                    }, 0)
                                                )}{" "}
                                                €
                                            </div>
                                            <p className="text-sm text-green-600 mt-1">Toplam tutar</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="h-5 w-5" />
                                        Tahsilatlar
                                    </CardTitle>
                                    <Button onClick={() => setShowPaymentModal(true)} variant="green">
                                        <Plus className="h-4 w-4" />
                                        Tahsilat Ekle
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {payments.length === 0 ? (
                                    <div className="text-center py-12">
                                        <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">Tahsilat Bilgileri</h3>
                                        <p className="text-gray-500">
                                            Bu müşteriye ait henüz tahsilat kaydı bulunmuyor.
                                        </p>
                                        <Button
                                            onClick={() => setShowPaymentModal(true)}
                                            className="mt-4"
                                            variant="outline"
                                        >
                                            <Plus className="h-4 w-4" />
                                            İlk Tahsilatı Ekle
                                        </Button>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tutar</TableHead>
                                                <TableHead>Teklif No</TableHead>
                                                <TableHead>Ödeme Tarihi</TableHead>
                                                <TableHead>Açıklama</TableHead>
                                                <TableHead>Oluşturulma Tarihi</TableHead>
                                                <TableHead className="w-24">İşlemler</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {payments.map((payment) => (
                                                <TableRow key={payment.id}>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className="bg-green-50 text-green-700 border-green-300 font-medium"
                                                        >
                                                            {new Intl.NumberFormat("tr-TR", {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            }).format(
                                                                typeof payment.payment_amount === "string"
                                                                    ? parseFloat(payment.payment_amount)
                                                                    : payment.payment_amount
                                                            )}{" "}
                                                            €
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {payment.offer_number ? (
                                                            <Badge variant="secondary">{payment.offer_number}</Badge>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <CalendarIcon className="h-4 w-4 text-gray-400" />
                                                            {new Date(payment.payment_date).toLocaleDateString("tr-TR")}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {payment.description || (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-gray-500">
                                                        <div className="text-sm">
                                                            <div>
                                                                {new Date(payment.created_at).toLocaleString("tr-TR")}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeletePayment(payment)}
                                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Payment Modal */}
                <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Tahsilat Ekle
                            </DialogTitle>
                            <DialogDescription>
                                {customer?.name} için yeni bir tahsilat kaydı oluşturun.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            {/* Teklif Seçimi */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Teklif (İsteğe Bağlı)</label>
                                <Select
                                    value={paymentForm.offerId?.toString() || "none"}
                                    onValueChange={(value) =>
                                        handlePaymentFormChange(
                                            "offerId",
                                            value === "none" ? undefined : parseInt(value)
                                        )
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Teklif seçin" />
                                    </SelectTrigger>
                                    <SelectContent className="w-full">
                                        <SelectItem value="none">Teklif Seçilmedi</SelectItem>
                                        {customerOffers.map((offer) => (
                                            <SelectItem key={offer.id} value={offer.id.toString()}>
                                                <div className="w-full flex items-center justify-between">
                                                    <span>
                                                        <strong>Teklif No:</strong> {offer.offer_number} -{" "}
                                                        <strong>Toplam Tutar:</strong>{" "}
                                                        {formatNumber(
                                                            typeof offer.total_amount === "string"
                                                                ? parseFloat(offer.total_amount)
                                                                : offer.total_amount
                                                        )}{" "}
                                                        €
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Ödeme Tarihi ve Tutar */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Ödeme Tarihi *</label>
                                    <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start text-left font-normal h-10"
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {paymentForm.paymentDate ? (
                                                    format(paymentForm.paymentDate, "dd.MM.yyyy", { locale: tr })
                                                ) : (
                                                    <span>Tarih seçin</span>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                className="pointer-events-auto"
                                                mode="single"
                                                selected={paymentForm.paymentDate}
                                                onSelect={(date) => {
                                                    if (date) {
                                                        handlePaymentFormChange("paymentDate", date);
                                                        setShowDatePicker(false);
                                                    }
                                                }}
                                                locale={tr}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Ödeme Tutarı * (€)</label>
                                    <div className="relative">
                                        <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            type="text"
                                            inputMode="decimal"
                                            placeholder="0,00 (örn: 11.000,50 veya 11000.50)"
                                            value={paymentForm.paymentAmount}
                                            onChange={(e) => handlePaymentFormChange("paymentAmount", e.target.value)}
                                            className="pl-10 h-10"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Açıklama */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Açıklama</label>
                                <Textarea
                                    placeholder="Tahsilat ile ilgili açıklama yazın (isteğe bağlı)"
                                    value={paymentForm.description}
                                    onChange={(e) => handlePaymentFormChange("description", e.target.value)}
                                    className="min-h-[80px]"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowPaymentModal(false)}>
                                İptal
                            </Button>
                            <Button
                                type="button"
                                onClick={handleCreatePayment}
                                variant="green"
                                disabled={!paymentForm.paymentAmount}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Tahsilatı Kaydet
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Payment Confirmation Modal */}
                <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Tahsilatı Sil</AlertDialogTitle>
                            <AlertDialogDescription asChild>
                                <div>
                                    <p>Bu tahsilat kaydını silmek istediğinizden emin misiniz?</p>
                                    {paymentToDelete && (
                                        <div className="mt-2 p-2 bg-gray-50 rounded">
                                            <strong>Tutar:</strong>{" "}
                                            {new Intl.NumberFormat("tr-TR", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            }).format(
                                                typeof paymentToDelete.payment_amount === "string"
                                                    ? parseFloat(paymentToDelete.payment_amount)
                                                    : paymentToDelete.payment_amount
                                            )}{" "}
                                            €
                                            <br />
                                            <strong>Tarih:</strong>{" "}
                                            {new Date(paymentToDelete.payment_date).toLocaleDateString("tr-TR")}
                                        </div>
                                    )}
                                    <p className="mt-2">Bu işlem geri alınamaz.</p>
                                </div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>İptal</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmDeletePayment}
                                disabled={isDeleting}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        Siliniyor...
                                    </>
                                ) : (
                                    "Sil"
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </>
    );
}
