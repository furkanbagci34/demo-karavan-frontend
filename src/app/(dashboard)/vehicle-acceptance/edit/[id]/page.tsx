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
import { useVehicleAcceptance } from "@/hooks/api/useVehicleAcceptance";
import {
    CreateVehicleAcceptanceData,
    UpdateVehicleAcceptanceData,
    VehicleFeature,
    VehicleAcceptance,
} from "@/lib/api/types";
import { toast } from "sonner";

type DamageMarker = {
    id: string;
    x: number;
    y: number;
    type: "dot" | "cross" | "line";
};

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
    } = useVehicleAcceptance();

    const [damageMarkers, setDamageMarkers] = useState<DamageMarker[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Form state'leri
    const [date, setDate] = useState(() => {
        try {
            return new Date().toISOString().split("T")[0];
        } catch (error) {
            return "";
        }
    });
    const [plateNumber, setPlateNumber] = useState("");
    const [entryKm, setEntryKm] = useState("");
    const [exitKm, setExitKm] = useState("");
    const [tseEntryDateTime, setTseEntryDateTime] = useState("");
    const [tseExitDateTime, setTseExitDateTime] = useState("");
    const [deliveryDate, setDeliveryDate] = useState("");
    const [description, setDescription] = useState("");
    const [fuelLevel, setFuelLevel] = useState(0);
    const [markerType, setMarkerType] = useState<"cross" | "line">("cross");

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
        console.log("🔄 useEffect çalıştı - isEditMode:", isEditMode, "ID:", id);
        
        if (isEditMode && id) {
            console.log("📝 Edit modu aktif, veri yükleniyor...");
            loadVehicleAcceptanceData();
        } else {
            console.log("🆕 Yeni kayıt modu aktif, varsayılan değerler kullanılıyor");
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

    const loadVehicleAcceptanceData = async () => {
        try {
            setIsLoading(true);

            const data = await getVehicleAcceptanceById(id);

            if (!data) {
                toast.error("Araç kabul verisi bulunamadı");
                return;
            }

            // Form alanlarını doldur - tüm alanları kontrol et
            const newDate = data.date || "";
            const newPlateNumber = data.plate_number || "";
            const newEntryKm = data.entry_km !== undefined && data.entry_km !== null ? data.entry_km.toString() : "";
            const newExitKm = data.exit_km !== undefined && data.exit_km !== null ? data.exit_km.toString() : "";
            const newTseEntryDateTime = data.tse_entry_datetime || "";
            const newTseExitDateTime = data.tse_exit_datetime || "";
            const newDeliveryDate = data.delivery_date || "";
            const newDescription = data.description || "";
            const newFuelLevel = data.fuel_level !== undefined && data.fuel_level !== null ? data.fuel_level : 0;

            // State'leri güncelle
            setDate(newDate);
            setPlateNumber(newPlateNumber);
            setEntryKm(newEntryKm);
            setExitKm(newExitKm);
            setTseEntryDateTime(newTseEntryDateTime);
            setTseExitDateTime(newTseExitDateTime);
            setDeliveryDate(newDeliveryDate);
            setDescription(newDescription);
            setFuelLevel(newFuelLevel);

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
                const markers = data.damage_markers.map((marker: any) => ({
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
        if (!(plateNumber || "").trim()) {
            toast.error("Plaka numarası zorunludur");
            return;
        }

        try {
            const formData = {
                date: date || "",
                plate_number: (plateNumber || "").trim().toUpperCase(),
                entry_km: entryKm ? parseInt(entryKm) : undefined,
                exit_km: exitKm ? parseInt(exitKm) : undefined,
                tse_entry_datetime: tseEntryDateTime || undefined,
                tse_exit_datetime: tseExitDateTime || undefined,
                delivery_date: deliveryDate || undefined,
                description: (description || "").trim() || undefined,
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
            };

            if (isEditMode) {
                await updateVehicleAcceptance(id, formData as UpdateVehicleAcceptanceData);
                toast.success("Araç kabul formu başarıyla güncellendi");
            } else {
                await createVehicleAcceptance(formData as CreateVehicleAcceptanceData);
                toast.success("Araç kabul formu başarıyla kaydedildi");
            }

            // Listeye yönlendir
            router.push("/vehicle-acceptance");
        } catch (error) {
            console.error("Form gönderme hatası:", error);
            toast.error(isEditMode ? "Form güncellenirken bir hata oluştu" : "Form gönderilirken bir hata oluştu");
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

                {/* Debug bilgileri - sadece development'ta göster */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="bg-gray-100 p-4 rounded-lg border no-print">
                        <h3 className="font-semibold mb-2">🐛 Debug Bilgileri</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <strong>isEditMode:</strong> {isEditMode ? 'true' : 'false'}<br/>
                                <strong>ID:</strong> {id}<br/>
                                <strong>isLoading:</strong> {isLoading ? 'true' : 'false'}<br/>
                                <strong>isLoadingCreate:</strong> {isLoadingCreate ? 'true' : 'false'}<br/>
                                <strong>isLoadingUpdate:</strong> {isLoadingUpdate ? 'true' : 'false'}
                            </div>
                            <div>
                                <strong>Date:</strong> {date || 'boş'}<br/>
                                <strong>Plate:</strong> {plateNumber || 'boş'}<br/>
                                <strong>Entry KM:</strong> {entryKm || 'boş'}<br/>
                                <strong>Exit KM:</strong> {exitKm || 'boş'}<br/>
                                <strong>Fuel Level:</strong> {fuelLevel}
                            </div>
                        </div>
                    </div>
                )}

                {/* Yazdırma başlığı */}
                <div className="print-only mb-4">
                    <h1 className="text-2xl font-bold print-title">
                        {isEditMode ? "Araç Kabul Düzenle" : "Yeni Araç Kabul Formu"}
                    </h1>
                    <img
                        src="/images/demonte-icon.png"
                        alt="Logo"
                        width={60}
                        height={60}
                        className="print-logo-fixed"
                        style={{ objectFit: "contain" }}
                    />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        {isEditMode ? "Araç Kabul Düzenle" : "Yeni Araç Kabul Formu"}
                    </h1>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                        <Button variant="outline" size="sm" onClick={() => router.push("/vehicle-acceptance")}>
                            Listeye Dön
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => window.print()}>
                            Yazdır
                        </Button>
                        <Button size="sm" onClick={handleSubmit} disabled={isLoadingCreate || isLoadingUpdate}>
                            {isLoadingCreate || isLoadingUpdate
                                ? "Kaydediliyor..."
                                : isEditMode
                                ? "Değişiklikleri Kaydet"
                                : "Formu Kaydet"}
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
                                            className="bg-gray-50 print:h-5 print:text-xs print:p-0 print:m-0 print:border-0"
                                            disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                        />
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
                                            className="print:h-5 print:text-xs print:p-0 print:m-0 print:border-0"
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
                                            className="print:h-5 print:text-xs print:p-0 print:m-0 print:border-0"
                                            disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                        />
                                    </div>

                                    {/* TSE Kamera Giriş */}
                                    <div className="space-y-2 print:space-y-0 print:m-0">
                                        <Label htmlFor="tseEntryDateTime" className="print:text-xs print:m-0 print:p-0">
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
                                        <Label htmlFor="tseExitDateTime" className="print:text-xs print:m-0 print:p-0">
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
                                            className="print:h-5 print:text-xs print:p-0 print:m-0 print:border-0"
                                            disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                        />
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
                                <span className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                                    {(damageMarkers || []).length}
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 print:space-y-1 print:p-1">
                        {/* İşaret tipi seçimi */}
                        <div className="flex items-center gap-3 no-print">
                            <span className="text-sm text-muted-foreground">İşaret tipi:</span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    className={`px-2 py-1 rounded border text-sm ${
                                        markerType === "cross" ? "bg-gray-900 text-white" : "bg-white"
                                    }`}
                                    onClick={() => setMarkerType("cross")}
                                    disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                >
                                    X
                                </button>
                                <button
                                    type="button"
                                    className={`px-2 py-1 rounded border text-sm ${
                                        markerType === "line" ? "bg-gray-900 text-white" : "bg-white"
                                    }`}
                                    onClick={() => setMarkerType("line")}
                                    disabled={isLoading || isLoadingCreate || isLoadingUpdate}
                                >
                                    ─
                                </button>
                            </div>
                        </div>
                        {/* Açıklama */}
                        <div className="text-sm text-muted-foreground no-print">
                            Araç üzerine tıklayarak hasar işareti koyun, mevcut işarete tekrar tıklayarak kaldırın
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
                                                    className="w-6 h-6 text-red-500 stroke-3 print:w-3 print:h-3"
                                                >
                                                    <line x1="6" y1="6" x2="18" y2="18" />
                                                </svg>
                                            ) : (
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    className="w-6 h-6 text-blue-600 stroke-3 print:w-3 print:h-3"
                                                >
                                                    <line x1="4" y1="12" x2="20" y2="12" />
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
        </>
    );
}
