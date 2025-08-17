"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
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

type DamageMarker = {
    id: string;
    x: number;
    y: number;
    type: "dot" | "cross" | "line";
};

export default function VehicleAcceptancePage() {
    const [damageMarkers, setDamageMarkers] = useState<DamageMarker[]>([]);

    // Form state'leri
    const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [plateNumber, setPlateNumber] = useState("");
    const [entryKm, setEntryKm] = useState("");
    const [exitKm, setExitKm] = useState("");
    const [tseEntryDateTime, setTseEntryDateTime] = useState("");
    const [tseExitDateTime, setTseExitDateTime] = useState("");
    const [deliveryDate, setDeliveryDate] = useState("");
    const [description, setDescription] = useState("");
    const [fuelLevel, setFuelLevel] = useState(0);
    const [markerType, setMarkerType] = useState<"cross" | "line">("cross");

    const addDamageMarker = (x: number, y: number) => {
        const newMarker: DamageMarker = {
            id: `marker-${Date.now()}`,
            x,
            y,
            type: markerType,
        };

        setDamageMarkers((prev) => [...prev, newMarker]);
    };

    const removeDamageMarker = (markerId: string) => {
        setDamageMarkers((prev) => prev.filter((m) => m.id !== markerId));
    };

    const handleVehicleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // SVG viewBox'ı 752x496 olduğu için koordinatları normalize et
        const normalizedX = (x / rect.width) * 752;
        const normalizedY = (y / rect.height) * 496;

        // Eğer bu koordinatta zaten bir işaret varsa, onu kaldır
        const existingMarker = damageMarkers.find((marker) => {
            const tolerance = 20; // 20 piksel tolerans
            return Math.abs(marker.x - normalizedX) < tolerance && Math.abs(marker.y - normalizedY) < tolerance;
        });

        if (existingMarker) {
            removeDamageMarker(existingMarker.id);
        } else {
            addDamageMarker(normalizedX, normalizedY);
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
                                <BreadcrumbPage>Araç Kabul</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6 print-container">
                {/* Yazdırma başlığı */}
                <div className="print-only mb-4">
                    <h1 className="text-2xl font-bold print-title">Araç Kabul Formu</h1>
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
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">Araç Kabul Formu</h1>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                        <Button variant="outline" size="sm" onClick={() => window.print()}>
                            Yazdır
                        </Button>
                        <Button size="sm">Değişiklikleri Kaydet</Button>
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
                                                className="w-4 h-4 text-blue-600"
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="celikJant"
                                                value="yok"
                                                defaultChecked
                                                className="w-4 h-4 text-blue-600"
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
                                                className="w-4 h-4 text-blue-600"
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="garantiBelgesi"
                                                defaultChecked
                                                value="yok"
                                                className="w-4 h-4 text-blue-600"
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
                                                className="w-4 h-4 text-blue-600"
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="jantKapagi"
                                                defaultChecked
                                                value="yok"
                                                className="w-4 h-4 text-blue-600"
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
                                                className="w-4 h-4 text-blue-600"
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="koltukKilifi"
                                                defaultChecked
                                                value="yok"
                                                className="w-4 h-4 text-blue-600"
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
                                                className="w-4 h-4 text-blue-600"
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="paspas"
                                                defaultChecked
                                                value="yok"
                                                className="w-4 h-4 text-blue-600"
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
                                                className="w-4 h-4 text-blue-600"
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="ruhsat"
                                                defaultChecked
                                                value="yok"
                                                className="w-4 h-4 text-blue-600"
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
                                                className="w-4 h-4 text-blue-600"
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="stepne"
                                                defaultChecked
                                                value="yok"
                                                className="w-4 h-4 text-blue-600"
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
                                                className="w-4 h-4 text-blue-600"
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="trafikSigortasi"
                                                defaultChecked
                                                value="yok"
                                                className="w-4 h-4 text-blue-600"
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
                                                className="w-4 h-4 text-blue-600"
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="trafikSeti"
                                                defaultChecked
                                                value="yok"
                                                className="w-4 h-4 text-blue-600"
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
                                                className="w-4 h-4 text-blue-600"
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="yanginTupu"
                                                defaultChecked
                                                value="yok"
                                                className="w-4 h-4 text-blue-600"
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
                                                className="w-4 h-4 text-blue-600"
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="yedekAnahtar"
                                                defaultChecked
                                                value="yok"
                                                className="w-4 h-4 text-blue-600"
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
                                                className="w-4 h-4 text-blue-600"
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="zincir"
                                                defaultChecked
                                                value="yok"
                                                className="w-4 h-4 text-blue-600"
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
                                                className="w-4 h-4 text-blue-600"
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <input
                                                type="radio"
                                                name="kriko"
                                                defaultChecked
                                                value="yok"
                                                className="w-4 h-4 text-blue-600"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t">
                                        <div className="text-center mb-3">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Benzin Seviyesi</h4>
                                            <p className="text-xs text-gray-500 mb-3">
                                                {fuelLevel > 0
                                                    ? `${fuelLevel}/20 - %${Math.round((fuelLevel / 20) * 100)}`
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
                                                            index < fuelLevel
                                                                ? "bg-blue-500 border-blue-600"
                                                                : "bg-gray-200 border-gray-300 hover:bg-gray-300"
                                                        }`}
                                                        onClick={() => setFuelLevel(index + 1)}
                                                        title={`${index + 1}/20`}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Sıfırlama Butonu */}
                                        <div className="text-center mt-2">
                                            <button
                                                type="button"
                                                onClick={() => setFuelLevel(0)}
                                                className="text-xs text-gray-500 hover:text-gray-700 underline"
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
                            {damageMarkers.length > 0 && (
                                <span className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                                    {damageMarkers.length}
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
                                >
                                    X
                                </button>
                                <button
                                    type="button"
                                    className={`px-2 py-1 rounded border text-sm ${
                                        markerType === "line" ? "bg-gray-900 text-white" : "bg-white"
                                    }`}
                                    onClick={() => setMarkerType("line")}
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
                                <div className="relative cursor-pointer" onClick={handleVehicleClick}>
                                    <Image
                                        src="/images/arac.svg"
                                        alt="Araç krokisi"
                                        width={752}
                                        height={496}
                                        className="w-full h-auto print:w-xl"
                                        priority
                                    />

                                    {/* Hasar işaretleri */}
                                    {damageMarkers.map((marker) => (
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
                                                    <line x1="18" y1="6" x2="6" y2="18" />
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

                {/* Teslim Eden ve Teslim Alan - Sayfanın en altında */}
                <div className="mt-8 print:mt-0 print:mb-0">
                    <div className="grid grid-cols-2 gap-8 print:gap-4">
                        <div className="text-center">
                            <h3 className="text-lg font-semibold border-b-2 border-gray-400 pb-2 print:text-base print:pb-1">
                                TESLİM EDEN
                            </h3>
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-semibold border-b-2 border-gray-400 pb-2 print:text-base print:pb-1">
                                TESLİM ALAN
                            </h3>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
