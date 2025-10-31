/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
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
import { useCustomers } from "@/hooks/api/useCustomers";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronsUpDown, User } from "lucide-react";
import { useVehicleAcceptance } from "@/hooks/api/useVehicleAcceptance";
import { CreateVehicleAcceptanceData, UpdateVehicleAcceptanceData, VehicleFeature } from "@/lib/api/types";
import { toast } from "sonner";
import { InfoIcon, Loader2 } from "lucide-react";
import { generateVehicleAcceptancePdf, generateVehicleAcceptancePdfBase64 } from "@/components/VehicleAcceptancePdf";
import { useAuth } from "@/hooks/api/useAuth";
import { SignatureModal } from "@/components/SignatureModal";
import { Pen } from "lucide-react";

type DamageMarker = {
    id: string;
    x: number;
    y: number;
    type: "dot" | "cross" | "line";
};

// Backend'den gelen tarih string'lerini HTML input formatına dönüştürür
function padToTwoDigits(value: number): string {
    return String(value).padStart(2, "0");
}

function formatDateForInput(value?: string | null): string {
    if (!value) return "";
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = padToTwoDigits(date.getMonth() + 1);
        const day = padToTwoDigits(date.getDate());
        return `${year}-${month}-${day}`;
    }
    // Fallback: YYYY-MM-DD ile başlıyorsa ilk 10 karakteri kullan
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
        return value.slice(0, 10);
    }
    return "";
}

function formatDateTimeLocalForInput(value?: string | null): string {
    if (!value) return "";
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = padToTwoDigits(date.getMonth() + 1);
        const day = padToTwoDigits(date.getDate());
        const hours = padToTwoDigits(date.getHours());
        const minutes = padToTwoDigits(date.getMinutes());
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    // Fallback: YYYY-MM-DD HH:mm veya YYYY-MM-DDTHH:mm gelir ise normalize et
    const match = value.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
    if (match) {
        return `${match[1]}T${match[2]}`;
    }
    return "";
}

export default function VehicleAcceptanceFormPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const isEditMode = id && id !== "add";

    const {
        createVehicleAcceptance,
        updateVehicleAcceptance,
        getVehicleAcceptanceById,
        isLoadingCreate,
        isLoadingUpdate,
        sendVehicleAcceptanceEmail,
    } = useVehicleAcceptance();

    const { user } = useAuth();

    const [damageMarkers, setDamageMarkers] = useState<DamageMarker[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Form state'leri
    const [date, setDate] = useState(() => {
        try {
            return new Date().toISOString().split("T")[0];
        } catch {
            return "";
        }
    });
    const [plateNumber, setPlateNumber] = useState("");
    const [formType, setFormType] = useState<"yeni_arac" | "servis">("yeni_arac");
    const [chassisNumber, setChassisNumber] = useState("");
    const [entryKm, setEntryKm] = useState("");
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
    const [isCustomerSelectorOpen, setIsCustomerSelectorOpen] = useState(false);
    const { customers, isLoading: customersLoading } = useCustomers();
    const [exitKm, setExitKm] = useState("");
    const [tseEntryDateTime, setTseEntryDateTime] = useState("");
    const [tseExitDateTime, setTseExitDateTime] = useState("");
    const [deliveryDate, setDeliveryDate] = useState("");
    const [description, setDescription] = useState("");
    const [deliveredBy, setDeliveredBy] = useState("");
    const [signature, setSignature] = useState<string>("");
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [fuelLevel, setFuelLevel] = useState(0);
    const [markerType, setMarkerType] = useState<"cross" | "line">("cross");
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const handleOpenConfirm = () => setIsConfirmOpen(true);
    const handleCloseConfirm = () => setIsConfirmOpen(false);

    // Araç özellikleri state'i
    const [vehicleFeatures, setVehicleFeatures] = useState<VehicleFeature | null>({
        celik_jant: false,
        garanti_belgesi: false,
        jant_kapagi: false,
        koltuk_kilifi: false,
        paspas: false,
        ruhsat: false,
        stepne: false,
        trafik_sigortasi: false,
        trafik_seti: false,
        yangin_tupu: false,
        yedek_anahtar: false,
        zincir: false,
        kriko: false,
    });

    // Edit modunda veri yükleme
    useEffect(() => {
        if (isEditMode && id) {
            loadVehicleAcceptanceData();
        } else {
            // Yeni kayıt modunda varsayılan değerleri kullan
            setVehicleFeatures({
                celik_jant: false,
                garanti_belgesi: false,
                jant_kapagi: false,
                koltuk_kilifi: false,
                paspas: false,
                ruhsat: false,
                stepne: false,
                trafik_sigortasi: false,
                trafik_seti: false,
                yangin_tupu: false,
                yedek_anahtar: false,
                zincir: false,
                kriko: false,
            });
            setDamageMarkers([]);
            setFuelLevel(0);
        }
    }, [isEditMode, id]);

    // Müşteri seçildiğinde teslim eden alanını otomatik doldur (sadece boşsa)
    useEffect(() => {
        if (selectedCustomerId && customers.length > 0) {
            const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
            if (selectedCustomer && (!deliveredBy || !deliveredBy.trim())) {
                setDeliveredBy(selectedCustomer.name || "");
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCustomerId, customers]);

    const loadVehicleAcceptanceData = async () => {
        try {
            setIsLoading(true);

            const data = await getVehicleAcceptanceById(id);

            if (!data) {
                toast.error("Araç kabul verisi bulunamadı");
                return;
            }

            // Form alanlarını doldur - tüm alanları kontrol et
            const newDate = formatDateForInput(data.date);
            const newPlateNumber = data.plate_number || "";
            const newFormType = (data as any).form_type || "servis";
            const newChassisNumber = (data as any).chassis_number || "";
            const newEntryKm = data.entry_km !== undefined && data.entry_km !== null ? data.entry_km.toString() : "";
            const newCustomerId = (data as any).customer_id ?? null;
            const newExitKm = data.exit_km !== undefined && data.exit_km !== null ? data.exit_km.toString() : "";
            const newTseEntryDateTime = formatDateTimeLocalForInput(data.tse_entry_datetime);
            const newTseExitDateTime = formatDateTimeLocalForInput(data.tse_exit_datetime);
            const newDeliveryDate = formatDateForInput(data.delivery_date);
            const newDescription = data.description || "";
            const newDeliveredBy = (data as any).delivered_by || "";
            const newSignature = (data as any).signature || "";
            const newFuelLevel = data.fuel_level !== undefined && data.fuel_level !== null ? data.fuel_level : 0;

            // State'leri güncelle
            setDate(newDate);
            setPlateNumber(newPlateNumber);
            setFormType(newFormType);
            setChassisNumber(newChassisNumber);
            setEntryKm(newEntryKm);
            setExitKm(newExitKm);
            setTseEntryDateTime(newTseEntryDateTime);
            setTseExitDateTime(newTseExitDateTime);
            setDeliveryDate(newDeliveryDate);
            setDescription(newDescription);
            setDeliveredBy(newDeliveredBy);
            setSignature(newSignature);
            setFuelLevel(newFuelLevel);
            setSelectedCustomerId(newCustomerId);

            // Araç özelliklerini güvenli şekilde yükle
            if (data.features && typeof data.features === "object") {
                const features = data.features;
                const newVehicleFeatures = {
                    celik_jant: Boolean(features.celik_jant),
                    garanti_belgesi: Boolean(features.garanti_belgesi),
                    jant_kapagi: Boolean(features.jant_kapagi),
                    koltuk_kilifi: Boolean(features.koltuk_kilifi),
                    paspas: Boolean(features.paspas),
                    ruhsat: Boolean(features.ruhsat),
                    stepne: Boolean(features.stepne),
                    trafik_sigortasi: Boolean(features.trafik_sigortasi),
                    trafik_seti: Boolean(features.trafik_seti),
                    yangin_tupu: Boolean(features.yangin_tupu),
                    yedek_anahtar: Boolean(features.yedek_anahtar),
                    zincir: Boolean(features.zincir),
                    kriko: Boolean(features.kriko),
                };

                setVehicleFeatures(newVehicleFeatures);
            } else {
                // Eğer features yoksa varsayılan değerleri kullan
                setVehicleFeatures({
                    celik_jant: false,
                    garanti_belgesi: false,
                    jant_kapagi: false,
                    koltuk_kilifi: false,
                    paspas: false,
                    ruhsat: false,
                    stepne: false,
                    trafik_sigortasi: false,
                    trafik_seti: false,
                    yangin_tupu: false,
                    yedek_anahtar: false,
                    zincir: false,
                    kriko: false,
                });
            }

            // Hasar işaretlerini yükle
            if (data.damage_markers && Array.isArray(data.damage_markers) && data.damage_markers.length > 0) {
                const markers = data.damage_markers.map((marker) => ({
                    id: `marker-${Date.now()}-${Math.random()}`,
                    x: Number(marker.x_coordinate) || 0,
                    y: Number(marker.y_coordinate) || 0,
                    type: marker.marker_type || "cross",
                }));
                setDamageMarkers(markers);
            } else {
                setDamageMarkers([]);
            }
        } catch (error) {
            console.error("Veri yükleme hatası:", error);
            toast.error("Araç kabul verisi yüklenemedi");
        } finally {
            setIsLoading(false);
        }
    };

    const addDamageMarker = (x: number, y: number) => {
        const newMarker: DamageMarker = {
            id: `marker-${Date.now()}`,
            x,
            y,
            type: markerType,
        };

        setDamageMarkers((prev) => [...(prev || []), newMarker]);
    };

    const removeDamageMarker = (markerId: string) => {
        setDamageMarkers((prev) => (prev || []).filter((m) => m.id !== markerId));
    };

    // Araç özelliği güncelleme
    const updateVehicleFeature = (featureName: keyof VehicleFeature, value: boolean) => {
        setVehicleFeatures((prev) => {
            // Eğer prev undefined ise varsayılan değerleri kullan
            const currentFeatures = prev || {
                celik_jant: false,
                garanti_belgesi: false,
                jant_kapagi: false,
                koltuk_kilifi: false,
                paspas: false,
                ruhsat: false,
                stepne: false,
                trafik_sigortasi: false,
                trafik_seti: false,
                yangin_tupu: false,
                yedek_anahtar: false,
                zincir: false,
                kriko: false,
            };

            return {
                ...currentFeatures,
                [featureName]: value,
            };
        });
    };

    const handleVehicleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // SVG viewBox'ı 752x496 olduğu için koordinatları normalize et
        const normalizedX = (x / rect.width) * 752;
        const normalizedY = (y / rect.height) * 496;

        // Eğer bu koordinatta zaten bir işaret varsa, onu kaldır
        const existingMarker = (damageMarkers || []).find((marker) => {
            const tolerance = 20; // 20 piksel tolerans
            return Math.abs(marker.x - normalizedX) < tolerance && Math.abs(marker.y - normalizedY) < tolerance;
        });

        if (existingMarker) {
            removeDamageMarker(existingMarker.id);
        } else {
            addDamageMarker(normalizedX, normalizedY);
        }
    };

    // Form gönderme
    const handleSubmit = async () => {
        const trimmedPlateNumber = (plateNumber || "").trim();
        const trimmedChassisNumber = (chassisNumber || "").trim();

        if (!trimmedPlateNumber && !trimmedChassisNumber) {
            toast.error("Plaka veya şase numarasından en az biri zorunludur");
            return;
        }

        setIsSubmitting(true);
        try {
            const damageCounts = {
                cross: (damageMarkers || []).filter((m) => m.type === "cross").length,
                line: (damageMarkers || []).filter((m) => m.type === "line").length,
                total: (damageMarkers || []).length,
            };
            const pdfBase64 = await generateVehicleAcceptancePdfBase64({
                title: isEditMode ? "Araç Kabul" : "Yeni Araç Kabul",
                date,
                formType: formType,
                plateNumber: plateNumber,
                chassisNumber: chassisNumber,
                customerName: selectedCustomerId ? customers.find((c) => c.id === selectedCustomerId)?.name : undefined,
                entryKm,
                exitKm,
                tseEntryDateTime,
                tseExitDateTime,
                deliveryDate,
                description,
                fuelLevel,
                features: (vehicleFeatures as unknown as Record<string, boolean>) || null,
                damageMarkers: (damageMarkers || []).map((m) => ({ x: m.x, y: m.y, type: m.type })),
                damageMarkerCounts: damageCounts,
                deliveredBy: deliveredBy || undefined,
                receivedBy: user?.name && user?.surname ? `${user.name} ${user.surname}` : undefined,
                signature: signature || undefined,
            });
            const formData = {
                date: date || "",
                form_type: formType,
                plate_number: trimmedPlateNumber ? trimmedPlateNumber.toUpperCase() : undefined,
                chassis_number: trimmedChassisNumber ? trimmedChassisNumber.toUpperCase() : undefined,
                customer_id: selectedCustomerId ?? undefined,
                entry_km: entryKm ? parseInt(entryKm) : undefined,
                exit_km: exitKm ? parseInt(exitKm) : undefined,
                tse_entry_datetime: tseEntryDateTime || undefined,
                tse_exit_datetime: tseExitDateTime || undefined,
                delivery_date: deliveryDate || undefined,
                description: (description || "").trim() || undefined,
                delivered_by: (deliveredBy || "").trim() || undefined,
                signature: signature && signature.trim() ? signature.trim() : undefined,
                fuel_level: fuelLevel || 0,
                features: vehicleFeatures || {
                    celik_jant: false,
                    garanti_belgesi: false,
                    jant_kapagi: false,
                    koltuk_kilifi: false,
                    paspas: false,
                    ruhsat: false,
                    stepne: false,
                    trafik_sigortasi: false,
                    trafik_seti: false,
                    yangin_tupu: false,
                    yedek_anahtar: false,
                    zincir: false,
                    kriko: false,
                },
                damage_markers: (damageMarkers || []).map((marker) => ({
                    x_coordinate: marker.x,
                    y_coordinate: marker.y,
                    marker_type: marker.type,
                })),
                pdf_base64: pdfBase64,
            };

            let savedId: string | null = null;
            if (isEditMode) {
                await updateVehicleAcceptance(id, formData as UpdateVehicleAcceptanceData);
                savedId = id;
                toast.success("Araç kabul formu başarıyla güncellendi");
            } else {
                const resp = await createVehicleAcceptance(formData as CreateVehicleAcceptanceData);
                const createdId = (resp?.data as any)?.vehicleAcceptanceId;
                if (createdId) savedId = String(createdId);
                toast.success("Araç kabul formu başarıyla kaydedildi");
            }

            // Müşteri seçiliyse otomatik mail gönder
            if (selectedCustomerId && savedId) {
                try {
                    await sendVehicleAcceptanceEmail(savedId, (formData as any).pdf_base64);
                    toast.success("Müşteriye e-posta gönderildi");
                } catch (e) {
                    console.error("Otomatik e-posta gönderim hatası:", e);
                    toast.error("E-posta gönderilemedi");
                }
            }

            // Listeye yönlendir
            router.push("/vehicle-acceptance");
        } catch (error) {
            console.error("Form gönderme hatası:", error);
            toast.error(isEditMode ? "Form güncellenirken bir hata oluştu" : "Form gönderilirken bir hata oluştu");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b no-print">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden sm:block">
                                <BreadcrumbLink href="/dashboard">Anasayfa</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden sm:block" />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/vehicle-acceptance">Araç Kabul</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden sm:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{isEditMode ? "Araç Kabul Düzenle" : "Yeni Araç Kabul"}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6 print-container">
                {/* Loading state */}
                {isLoading && (
                    <div className="flex items-center justify-center py-8">
                        <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <span>Araç kabul verisi yükleniyor...</span>
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        {isEditMode ? "Araç Kabul Düzenle" : "Yeni Araç Kabul Formu"}
                    </h1>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                                const damageCounts = {
                                    cross: (damageMarkers || []).filter((m) => m.type === "cross").length,
                                    line: (damageMarkers || []).filter((m) => m.type === "line").length,
                                    total: (damageMarkers || []).length,
                                };
                                await generateVehicleAcceptancePdf({
                                    title: isEditMode ? "Araç Kabul" : "Yeni Araç Kabul",
                                    date,
                                    formType: formType,
                                    plateNumber: plateNumber,
                                    chassisNumber: chassisNumber,
                                    customerName: selectedCustomerId
                                        ? customers.find((c) => c.id === selectedCustomerId)?.name
                                        : undefined,
                                    entryKm,
                                    exitKm,
                                    tseEntryDateTime,
                                    tseExitDateTime,
                                    deliveryDate,
                                    description,
                                    fuelLevel,
                                    features: (vehicleFeatures as unknown as Record<string, boolean>) || null,
                                    damageMarkers: (damageMarkers || []).map((m) => ({ x: m.x, y: m.y, type: m.type })),
                                    damageMarkerCounts: damageCounts,
                                    deliveredBy: deliveredBy || undefined,
                                    receivedBy:
                                        user?.name && user?.surname ? `${user.name} ${user.surname}` : undefined,
                                    signature: signature || undefined,
                                });
                            }}
                        >
                            PDF Göster
                        </Button>
                        {isEditMode && id && (
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={isSendingEmail}
                                onClick={async () => {
                                    if (!isEditMode || !id) return;
                                    setIsSendingEmail(true);
                                    try {
                                        const damageCounts = {
                                            cross: (damageMarkers || []).filter((m) => m.type === "cross").length,
                                            line: (damageMarkers || []).filter((m) => m.type === "line").length,
                                            total: (damageMarkers || []).length,
                                        };
                                        const pdfBase64 = await generateVehicleAcceptancePdfBase64({
                                            title: isEditMode ? "Araç Kabul" : "Yeni Araç Kabul",
                                            date,
                                            formType: formType,
                                            plateNumber: plateNumber,
                                            chassisNumber: chassisNumber,
                                            customerName: selectedCustomerId
                                                ? customers.find((c) => c.id === selectedCustomerId)?.name
                                                : undefined,
                                            entryKm,
                                            exitKm,
                                            tseEntryDateTime,
                                            tseExitDateTime,
                                            deliveryDate,
                                            description,
                                            fuelLevel,
                                            features: (vehicleFeatures as unknown as Record<string, boolean>) || null,
                                            damageMarkers: (damageMarkers || []).map((m) => ({
                                                x: m.x,
                                                y: m.y,
                                                type: m.type,
                                            })),
                                            damageMarkerCounts: damageCounts,
                                            deliveredBy: deliveredBy || undefined,
                                            receivedBy:
                                                user?.name && user?.surname
                                                    ? `${user.name} ${user.surname}`
                                                    : undefined,
                                            signature: signature || undefined,
                                        });
                                        await sendVehicleAcceptanceEmail(id as string, pdfBase64);
                                        toast.success("E-posta gönderildi");
                                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                    } catch (e) {
                                        toast.error("E-posta gönderilirken hata oluştu");
                                    } finally {
                                        setIsSendingEmail(false);
                                    }
                                }}
                            >
                                {isSendingEmail ? (
                                    <span className="inline-flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Gönderiliyor...
                                    </span>
                                ) : (
                                    "Mail Gönder"
                                )}
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => router.push("/vehicle-acceptance")}>
                            Listeye Dön
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleOpenConfirm}
                            disabled={isLoadingCreate || isLoadingUpdate || isSubmitting}
                        >
                            {isLoadingCreate || isLoadingUpdate || isSubmitting ? (
                                <span className="inline-flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {isSubmitting ? "Kaydediliyor ve mail gönderiliyor..." : "Kaydediliyor..."}
                                </span>
                            ) : isEditMode ? (
                                "Değişiklikleri Kaydet"
                            ) : (
                                "Formu Kaydet"
                            )}
                        </Button>
                    </div>
                </div>

                {/* Araç Kabul Formu */}
                <Card className="print-card print-tight print:border-0 print:shadow-none">
                    <CardContent className="print:p-0 print:m-0">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-2 print:gap-1 print:m-0">
                            {/* Sol taraf - Form alanları */}
                            <div className="space-y-4 print:space-y-0 print:m-0">
                                <div className="grid grid-cols-1 gap-4 print:gap-0 print:m-0">
                                    {/* Form Tipi */}
                                    <div className="space-y-2 print:space-y-0 print:m-0">
                                        <Label htmlFor="formType" className="print:text-xs print:m-0 print:p-0">
                                            FORM TİPİ
                                        </Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="formType"
                                                    value="yeni_arac"
                                                    checked={formType === "yeni_arac"}
                                                    onChange={() => setFormType("yeni_arac")}
                                                    className="w-4 h-4 text-blue-600"
                                                    disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                                />
                                                <span>Yeni Araç</span>
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="formType"
                                                    value="servis"
                                                    checked={formType === "servis"}
                                                    onChange={() => setFormType("servis")}
                                                    className="w-4 h-4 text-blue-600"
                                                    disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                                />
                                                <span>Servis</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Müşteri Seçimi ve Teslim Eden yan yana */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2 print:gap-0">
                                        {/* Müşteri Seçimi */}
                                        <div className="space-y-2 print:space-y-0 print:m-0 no-print">
                                            <Label className="print:text-xs print:m-0 print:p-0">MÜŞTERİ</Label>
                                            <Popover
                                                open={isCustomerSelectorOpen}
                                                onOpenChange={setIsCustomerSelectorOpen}
                                                modal={true}
                                            >
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={isCustomerSelectorOpen}
                                                        className={`w-full justify-between h-10 text-left font-normal ${
                                                            !selectedCustomerId
                                                                ? "border-slate-300 text-slate-500"
                                                                : "border-slate-300"
                                                        }`}
                                                        disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                                    >
                                                        {selectedCustomerId
                                                            ? customers.find((c) => c.id === selectedCustomerId)?.name
                                                            : "Müşteri seçin..."}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-full p-0" align="start">
                                                    <Command>
                                                        <CommandInput placeholder="Müşteri ara..." className="h-9" />
                                                        <CommandEmpty>
                                                            {customersLoading ? (
                                                                <div className="flex items-center justify-center py-4">
                                                                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-b-2 border-blue-600" />
                                                                    <span className="text-sm">Yükleniyor...</span>
                                                                </div>
                                                            ) : (
                                                                <div className="py-4 text-center text-sm text-muted-foreground">
                                                                    Müşteri bulunamadı
                                                                </div>
                                                            )}
                                                        </CommandEmpty>
                                                        <CommandGroup>
                                                            <CommandList className="max-h-[240px] overflow-y-auto">
                                                                {customers.map((customer) => (
                                                                    <CommandItem
                                                                        key={customer.id}
                                                                        onSelect={() => {
                                                                            setSelectedCustomerId(customer.id);
                                                                            setIsCustomerSelectorOpen(false);
                                                                        }}
                                                                        className="flex items-center gap-3 p-3 cursor-pointer"
                                                                    >
                                                                        <div className="flex items-center gap-3 flex-1">
                                                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                                                <User className="h-4 w-4 text-blue-600" />
                                                                            </div>
                                                                            <div className="flex-1">
                                                                                <div className="font-medium text-sm">
                                                                                    {customer.name}
                                                                                </div>
                                                                                <div className="text-xs text-slate-500">
                                                                                    {customer.email}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        {selectedCustomerId === customer.id && (
                                                                            <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                                                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                                                            </div>
                                                                        )}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandList>
                                                        </CommandGroup>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>

                                        {/* Teslim Eden */}
                                        <div className="space-y-2 print:space-y-0 print:m-0">
                                            <Label htmlFor="deliveredBy" className="print:text-xs print:m-0 print:p-0">
                                                TESLİM EDEN
                                            </Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="deliveredBy"
                                                    type="text"
                                                    placeholder="Teslim eden kişinin adı soyadı"
                                                    value={deliveredBy}
                                                    onChange={(e) => setDeliveredBy(e.target.value)}
                                                    className="print:h-5 print:text-xs print:p-0 print:m-0 print:border-0 flex-1"
                                                    disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                                />
                                                <Button
                                                    type="button"
                                                    variant={signature && signature.trim() ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setIsSignatureModalOpen(true)}
                                                    className={`no-print shrink-0 ${
                                                        signature && signature.trim()
                                                            ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                                                            : ""
                                                    }`}
                                                    disabled={
                                                        isLoading || isLoadingCreate || isLoadingUpdate || isSubmitting
                                                    }
                                                    title={signature && signature.trim() ? "İmzayı Düzenle" : "İmza At"}
                                                >
                                                    <Pen className="h-4 w-4" />
                                                    {signature && signature.trim() && (
                                                        <span className="ml-1 text-xs">✓</span>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tarih ve Teslim Tarihi yan yana */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2 print:gap-0">
                                        {/* Tarih */}
                                        <div className="space-y-2 print:space-y-0 print:m-0">
                                            <Label htmlFor="date" className="print:text-xs print:m-0 print:p-0">
                                                Tarih
                                            </Label>
                                            <Input
                                                id="date"
                                                type="date"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                className="bg-gray-50 h-9 text-sm print:h-5 print:text-xs print:p-0 print:m-0 print:border-0"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>

                                        {/* Teslim Tarihi */}
                                        <div className="space-y-2 print:space-y-0 print:m-0">
                                            <Label htmlFor="deliveryDate" className="print:text-xs print:m-0 print:p-0">
                                                TESLİM TARİHİ
                                            </Label>
                                            <Input
                                                id="deliveryDate"
                                                type="date"
                                                value={deliveryDate}
                                                onChange={(e) => setDeliveryDate(e.target.value)}
                                                className="h-9 text-sm print:h-5 print:text-xs print:p-0 print:m-0 print:border-0"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>
                                    </div>

                                    {/* Plaka */}
                                    <div className="space-y-2 print:space-y-0 print:m-0">
                                        <Label htmlFor="plateNumber" className="print:text-xs print:m-0 print:p-0">
                                            PLAKA
                                        </Label>
                                        <Input
                                            id="plateNumber"
                                            type="text"
                                            placeholder="34 ABC 123"
                                            value={plateNumber}
                                            onChange={(e) => setPlateNumber(e.target.value)}
                                            className="uppercase print:h-5 print:text-xs print:p-0 print:m-0 print:border-0"
                                            disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                        />
                                    </div>

                                    {/* Şase No */}
                                    <div className="space-y-2 print:space-y-0 print:m-0">
                                        <Label htmlFor="chassisNumber" className="print:text-xs print:m-0 print:p-0">
                                            ŞASE NO
                                        </Label>
                                        <Input
                                            id="chassisNumber"
                                            type="text"
                                            placeholder="Şase No"
                                            value={chassisNumber}
                                            onChange={(e) => setChassisNumber(e.target.value)}
                                            className="uppercase print:h-5 print:text-xs print:p-0 print:m-0 print:border-0"
                                            disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                        />
                                    </div>

                                    {/* KM Alanları: Giriş ve Çıkış yan yana (yarı yarıya) */}
                                    <div className="grid grid-cols-2 gap-4 print:gap-0 print:grid-cols-2">
                                        {/* Giriş KM */}
                                        <div className="space-y-2 print:space-y-0 print:m-0">
                                            <Label htmlFor="entryKm" className="print:text-xs print:m-0 print:p-0">
                                                GİRİŞ KM
                                            </Label>
                                            <Input
                                                id="entryKm"
                                                type="number"
                                                placeholder="0"
                                                value={entryKm}
                                                onChange={(e) => setEntryKm(e.target.value)}
                                                className="h-9 text-sm print:h-5 print:text-xs print:p-0 print:m-0 print:border-0"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>

                                        {/* Çıkış KM */}
                                        <div className="space-y-2 print:space-y-0 print:m-0">
                                            <Label htmlFor="exitKm" className="print:text-xs print:m-0 print:p-0">
                                                ÇIKIŞ KM
                                            </Label>
                                            <Input
                                                id="exitKm"
                                                type="number"
                                                placeholder="0"
                                                value={exitKm}
                                                onChange={(e) => setExitKm(e.target.value)}
                                                className="h-9 text-sm print:h-5 print:text-xs print:p-0 print:m-0 print:border-0"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>
                                    </div>

                                    {/* TSE Kamera Tarihleri: Giriş ve Çıkış yan yana */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2 print:gap-0">
                                        {/* TSE Kamera Giriş */}
                                        <div className="space-y-2 print:space-y-0 print:m-0">
                                            <Label
                                                htmlFor="tseEntryDateTime"
                                                className="print:text-xs print:m-0 print:p-0"
                                            >
                                                TSE KAMERA GİRİŞ TARİHİ
                                            </Label>
                                            <Input
                                                id="tseEntryDateTime"
                                                type="datetime-local"
                                                value={tseEntryDateTime}
                                                onChange={(e) => setTseEntryDateTime(e.target.value)}
                                                className="print:h-5 print:text-xs print:p-0 print:m-0 print:border-0"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>

                                        {/* TSE Kamera Çıkış */}
                                        <div className="space-y-2 print:space-y-0 print:m-0">
                                            <Label
                                                htmlFor="tseExitDateTime"
                                                className="print:text-xs print:m-0 print:p-0"
                                            >
                                                TSE KAMERA ÇIKIŞ TARİHİ
                                            </Label>
                                            <Input
                                                id="tseExitDateTime"
                                                type="datetime-local"
                                                value={tseExitDateTime}
                                                onChange={(e) => setTseExitDateTime(e.target.value)}
                                                className="print:h-5 print:text-xs print:p-0 print:m-0 print:border-0"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>
                                    </div>

                                    {/* Açıklama */}
                                    <div className="space-y-2 print:space-y-0 print:m-0">
                                        <Label htmlFor="description" className="print:text-xs print:m-0 print:p-0">
                                            AÇIKLAMA
                                        </Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Araç kabulüne ilişkin notlar..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={4}
                                            className="print:h-8 print:text-xs print:p-0 print:m-0 print:border-0"
                                            disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Sağ taraf - Araç Özellikleri */}
                            <div className="space-y-4 print:space-y-0 print:m-0">
                                <h3 className="text-lg font-semibold no-print">Araç Özellikleri</h3>

                                {/* Başlık satırı */}
                                <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-700 border-b pb-2 print:pb-0 print:border-0 print:gap-0 print:m-0">
                                    <div className="print:text-xs print:m-0 print:p-0">Özellik</div>
                                    <div className="text-center print:text-xs print:m-0 print:p-0">Var</div>
                                    <div className="text-center print:text-xs print:m-0 print:p-0">Yok</div>
                                </div>

                                {/* Özellik satırları */}
                                <div className="space-y-3 print:space-y-0 print:m-0">
                                    <div className="grid grid-cols-3 gap-4 items-center">
                                        <div className="text-sm">Çelik Jant</div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="celikJant"
                                                value="var"
                                                checked={vehicleFeatures?.celik_jant || false}
                                                onChange={() => updateVehicleFeature("celik_jant", true)}
                                                className="w-4 h-4 text-blue-600"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="celikJant"
                                                value="yok"
                                                checked={!(vehicleFeatures?.celik_jant || false)}
                                                onChange={() => updateVehicleFeature("celik_jant", false)}
                                                className="w-4 h-4 text-blue-600"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 items-center">
                                        <div className="text-sm">Garanti Belgesi</div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="garantiBelgesi"
                                                value="var"
                                                checked={vehicleFeatures?.garanti_belgesi || false}
                                                onChange={() => updateVehicleFeature("garanti_belgesi", true)}
                                                className="w-4 h-4 text-blue-600"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="garantiBelgesi"
                                                value="yok"
                                                checked={!(vehicleFeatures?.garanti_belgesi || false)}
                                                onChange={() => updateVehicleFeature("garanti_belgesi", false)}
                                                className="w-4 h-4 text-blue-600"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 items-center">
                                        <div className="text-sm">Jant Kapağı</div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="jantKapagi"
                                                value="var"
                                                checked={vehicleFeatures?.jant_kapagi || false}
                                                onChange={() => updateVehicleFeature("jant_kapagi", true)}
                                                className="w-4 h-4 text-blue-600"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="jantKapagi"
                                                value="yok"
                                                checked={!(vehicleFeatures?.jant_kapagi || false)}
                                                onChange={() => updateVehicleFeature("jant_kapagi", false)}
                                                className="w-4 h-4 text-blue-600"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 items-center">
                                        <div className="text-sm">Koltuk Kılıfı</div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="koltukKilifi"
                                                value="var"
                                                checked={vehicleFeatures?.koltuk_kilifi || false}
                                                onChange={() => updateVehicleFeature("koltuk_kilifi", true)}
                                                className="w-4 h-4 text-blue-600"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="koltukKilifi"
                                                value="yok"
                                                checked={!(vehicleFeatures?.koltuk_kilifi || false)}
                                                onChange={() => updateVehicleFeature("koltuk_kilifi", false)}
                                                className="w-4 h-4 text-blue-600"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 items-center">
                                        <div className="text-sm">Paspas</div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="paspas"
                                                value="var"
                                                checked={vehicleFeatures?.paspas || false}
                                                onChange={() => updateVehicleFeature("paspas", true)}
                                                className="w-4 h-4 text-blue-600"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="paspas"
                                                value="yok"
                                                checked={!(vehicleFeatures?.paspas || false)}
                                                onChange={() => updateVehicleFeature("paspas", false)}
                                                className="w-4 h-4 text-blue-600"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 items-center">
                                        <div className="text-sm">Ruhsat</div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="ruhsat"
                                                value="var"
                                                checked={vehicleFeatures?.ruhsat || false}
                                                onChange={() => updateVehicleFeature("ruhsat", true)}
                                                className="w-4 h-4 text-blue-600"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="ruhsat"
                                                value="yok"
                                                checked={!(vehicleFeatures?.ruhsat || false)}
                                                onChange={() => updateVehicleFeature("ruhsat", false)}
                                                className="w-4 h-4 text-blue-600"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 items-center">
                                        <div className="text-sm">Stepne</div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="stepne"
                                                value="var"
                                                checked={vehicleFeatures?.stepne || false}
                                                onChange={() => updateVehicleFeature("stepne", true)}
                                                className="w-4 h-4 text-blue-600"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="stepne"
                                                value="yok"
                                                checked={!(vehicleFeatures?.stepne || false)}
                                                onChange={() => updateVehicleFeature("stepne", false)}
                                                className="w-4 h-4 text-blue-600"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 items-center">
                                        <div className="text-sm">Trafik Sigortası</div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="trafikSigortasi"
                                                value="var"
                                                checked={vehicleFeatures?.trafik_sigortasi || false}
                                                onChange={() => updateVehicleFeature("trafik_sigortasi", true)}
                                                className="w-4 h-4 text-blue-600"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="trafikSigortasi"
                                                value="yok"
                                                checked={!(vehicleFeatures?.trafik_sigortasi || false)}
                                                onChange={() => updateVehicleFeature("trafik_sigortasi", false)}
                                                className="w-4 h-4 text-blue-600"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 items-center">
                                        <div className="text-sm">Trafik Seti</div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="trafikSeti"
                                                value="var"
                                                checked={vehicleFeatures?.trafik_seti || false}
                                                onChange={() => updateVehicleFeature("trafik_seti", true)}
                                                className="w-4 h-4 text-blue-600"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="trafikSeti"
                                                value="yok"
                                                checked={!(vehicleFeatures?.trafik_seti || false)}
                                                onChange={() => updateVehicleFeature("trafik_seti", false)}
                                                className="w-4 h-4 text-blue-600"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 items-center">
                                        <div className="text-sm">Yangın Tüpü</div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="yanginTupu"
                                                value="var"
                                                checked={vehicleFeatures?.yangin_tupu || false}
                                                onChange={() => updateVehicleFeature("yangin_tupu", true)}
                                                className="w-4 h-4 text-blue-600"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="yanginTupu"
                                                value="yok"
                                                checked={!(vehicleFeatures?.yangin_tupu || false)}
                                                onChange={() => updateVehicleFeature("yangin_tupu", false)}
                                                className="w-4 h-4 text-blue-600"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 items-center">
                                        <div className="text-sm">Yedek Anahtar</div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="yedekAnahtar"
                                                value="var"
                                                checked={vehicleFeatures?.yedek_anahtar || false}
                                                onChange={() => updateVehicleFeature("yedek_anahtar", true)}
                                                className="w-4 h-4 text-blue-600"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="yedekAnahtar"
                                                value="yok"
                                                checked={!(vehicleFeatures?.yedek_anahtar || false)}
                                                onChange={() => updateVehicleFeature("yedek_anahtar", false)}
                                                className="w-4 h-4 text-blue-600"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 items-center">
                                        <div className="text-sm">Zincir</div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="zincir"
                                                value="var"
                                                checked={vehicleFeatures?.zincir || false}
                                                onChange={() => updateVehicleFeature("zincir", true)}
                                                className="w-4 h-4 text-blue-600"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="zincir"
                                                value="yok"
                                                checked={!(vehicleFeatures?.zincir || false)}
                                                onChange={() => updateVehicleFeature("zincir", false)}
                                                className="w-4 h-4 text-blue-600"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 items-center">
                                        <div className="text-sm">Kriko</div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="kriko"
                                                value="var"
                                                checked={vehicleFeatures?.kriko || false}
                                                onChange={() => updateVehicleFeature("kriko", true)}
                                                className="w-4 h-4 text-blue-600"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="kriko"
                                                value="yok"
                                                checked={!(vehicleFeatures?.kriko || false)}
                                                onChange={() => updateVehicleFeature("kriko", false)}
                                                className="w-4 h-4 text-blue-600"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t">
                                        <div className="text-center mb-3">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Benzin Seviyesi</h4>
                                            <p className="text-xs text-gray-500 mb-3">
                                                {(fuelLevel || 0) > 0
                                                    ? `${fuelLevel || 0}/20 - %${Math.round(
                                                          ((fuelLevel || 0) / 20) * 100
                                                      )}`
                                                    : "Boş"}
                                            </p>
                                        </div>

                                        {/* 20 Kutucuk */}
                                        <div className="flex justify-center">
                                            <div className="grid grid-cols-20 gap-1">
                                                {Array.from({ length: 20 }, (_, index) => (
                                                    <div
                                                        key={index}
                                                        className={`w-3 h-6 border rounded cursor-pointer transition-colors ${
                                                            index < (fuelLevel || 0)
                                                                ? "bg-blue-500 border-blue-600"
                                                                : "bg-gray-200 border-gray-300 hover:bg-gray-300"
                                                        }`}
                                                        onClick={() =>
                                                            !(isLoading || isLoadingCreate || isLoadingUpdate) &&
                                                            setFuelLevel(index + 1)
                                                        }
                                                        title={`${index + 1}/20`}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Sıfırlama Butonu */}
                                        <div className="text-center mt-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    !(isLoading || isLoadingCreate || isLoadingUpdate) &&
                                                    setFuelLevel(0)
                                                }
                                                className="text-xs text-gray-500 hover:text-gray-700 underline"
                                                disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                            >
                                                Sıfırla
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Araç Hasar İşaretleme */}
                <Card className="print-card avoid-break-inside print-no-border">
                    <CardHeader className="no-print">
                        <CardTitle className="flex items-center gap-3">
                            Araç Hasar İşaretleme
                            {(damageMarkers || []).length > 0 && (
                                <div className="flex items-center gap-2">
                                    {/* Göçük sayısı */}
                                    {(damageMarkers || []).filter((marker) => marker.type === "cross").length > 0 && (
                                        <span className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                            {(damageMarkers || []).filter((marker) => marker.type === "cross").length}
                                        </span>
                                    )}
                                    {/* Çizik sayısı */}
                                    {(damageMarkers || []).filter((marker) => marker.type === "line").length > 0 && (
                                        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            {(damageMarkers || []).filter((marker) => marker.type === "line").length}
                                        </span>
                                    )}
                                    <span className="bg-gray-100 text-gray-800 text-sm font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                        Toplam: {(damageMarkers || []).length}
                                    </span>{" "}
                                </div>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 print:space-y-1 print:p-1">
                        {/* Minimal İşaret Tipi Seçimi ve Açıklama */}
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 no-print">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                        <svg
                                            className="w-3 h-3 text-blue-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                            />
                                        </svg>
                                    </div>
                                    <h4 className="text-sm font-medium text-slate-700">Hasar İşaret Tipi</h4>
                                </div>
                                <div className="text-xs text-slate-500 bg-white px-2 py-1 rounded-full border">
                                    {markerType === "cross" ? "Göçük" : "Çizik"}
                                </div>
                            </div>

                            {/* İşaret Tipi Seçimi */}
                            <div className="flex gap-2 mb-3">
                                <button
                                    type="button"
                                    onClick={() => setMarkerType("cross")}
                                    disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-all duration-200 ${
                                        markerType === "cross"
                                            ? "border-red-300 bg-red-50 text-red-700"
                                            : "border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:bg-red-25"
                                    }`}
                                >
                                    <div
                                        className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                                            markerType === "cross"
                                                ? "bg-red-500 text-white"
                                                : "bg-slate-200 text-slate-500"
                                        }`}
                                    >
                                        X
                                    </div>
                                    <span className="text-sm">Göçük</span>
                                    {markerType === "cross" && (
                                        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setMarkerType("line")}
                                    disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-all duration-200 ${
                                        markerType === "line"
                                            ? "border-blue-300 bg-blue-50 text-blue-700"
                                            : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-25"
                                    }`}
                                >
                                    <div
                                        className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                                            markerType === "line"
                                                ? "bg-blue-500 text-white"
                                                : "bg-slate-200 text-slate-500"
                                        }`}
                                    >
                                        ─
                                    </div>
                                    <span className="text-sm">Çizik</span>
                                    {markerType === "line" && (
                                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    )}
                                </button>
                            </div>

                            {/* Minimal Açıklama */}
                            <div className="bg-white rounded-md p-2 border border-slate-200">
                                <div className="flex items-start gap-2">
                                    <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <InfoIcon className="w-2 h-2 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-slate-600">
                                            Araç üzerine tıklayarak hasar işareti koyun, mevcut işarete tekrar
                                            tıklayarak kaldırın.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center print-first print:mt-0">
                            {/* Araç Görseli */}
                            <div className="relative w-full max-w-4xl car-diagram print:max-w-xl">
                                <div
                                    className="relative cursor-pointer"
                                    onClick={
                                        !(isLoading || isLoadingCreate || isLoadingUpdate)
                                            ? handleVehicleClick
                                            : undefined
                                    }
                                >
                                    <Image
                                        src="/images/arac.svg"
                                        alt="Araç krokisi"
                                        width={752}
                                        height={496}
                                        className="w-full h-auto print:w-xl"
                                        priority
                                    />

                                    {/* Hasar işaretleri */}
                                    {(damageMarkers || []).map((marker) => (
                                        <div
                                            key={marker.id}
                                            className="absolute w-6 h-6 cursor-pointer hover:scale-110 transition-transform print:w-3 print:h-3"
                                            style={{
                                                left: `${(marker.x / 752) * 100}%`,
                                                top: `${(marker.y / 496) * 100}%`,
                                                transform: "translate(-50%, -50%)",
                                            }}
                                            title="Hasar işaretini kaldırmak için tekrar tıklayın"
                                        >
                                            {marker.type === "cross" ? (
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    className="w-6 h-6 text-red-500 print:w-3 print:h-3"
                                                >
                                                    <line
                                                        x1="6"
                                                        y1="6"
                                                        x2="18"
                                                        y2="18"
                                                        strokeWidth="3"
                                                        strokeLinecap="round"
                                                    />
                                                    <line
                                                        x1="18"
                                                        y1="6"
                                                        x2="6"
                                                        y2="18"
                                                        strokeWidth="3"
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                            ) : (
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    className="w-6 h-6 text-blue-600 print:w-3 print:h-3"
                                                >
                                                    <line
                                                        x1="4"
                                                        y1="12"
                                                        x2="20"
                                                        y2="12"
                                                        strokeWidth="3"
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Kayıt/Güncelleme Onay Diyaloğu */}
            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>İşlemi Onaylayın</AlertDialogTitle>
                        <AlertDialogDescription>
                            Kaydettiğiniz bilgiler seçili olan müşteriye e-posta olarak gönderilecektir. Devam etmek
                            istiyor musunuz?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCloseConfirm} className="min-w-24" disabled={isSubmitting}>
                            Vazgeç
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="min-w-32"
                            onClick={async () => {
                                handleCloseConfirm();
                                await handleSubmit();
                            }}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <span className="inline-flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Kaydediliyor...
                                </span>
                            ) : (
                                "Onayla ve Kaydet"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* İmza Modal */}
            <SignatureModal
                open={isSignatureModalOpen}
                onOpenChange={setIsSignatureModalOpen}
                onSave={(sig) => {
                    if (sig && sig.trim()) {
                        setSignature(sig.trim());
                        toast.success("İmza kaydedildi");
                    } else {
                        toast.error("İmza kaydedilemedi");
                    }
                }}
                onClear={() => {
                    setSignature("");
                    toast.success("İmza temizlendi");
                }}
                initialSignature={signature}
            />
        </>
    );
}
