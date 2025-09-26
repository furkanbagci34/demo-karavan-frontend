"use client";

import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Car, CheckCircle2, Factory, Loader2, Search, FileText } from "lucide-react";
import { useVehicleAcceptance } from "@/hooks/api/useVehicleAcceptance";
import { toast } from "sonner";

interface ProductionSendModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSendToProduction: (vehicleAcceptanceId: number, productionNotes: string) => void;
    offerId?: number;
}

export const ProductionSendModal: React.FC<ProductionSendModalProps> = ({ isOpen, onClose, onSendToProduction }) => {
    const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [productionNotes, setProductionNotes] = useState("");
    const { vehicleAcceptances, isLoading } = useVehicleAcceptance();

    const handleSendToProduction = async () => {
        if (!selectedVehicleId) {
            toast.error("Araç Seçilmedi", {
                description: "Lütfen üretime gönderilecek aracı seçin.",
            });
            return;
        }

        try {
            setSending(true);
            await onSendToProduction(selectedVehicleId, productionNotes);

            // Başarılı gönderimde notları da logla
            if (productionNotes.trim()) {
                console.log("Üretim Notları:", productionNotes);
            }

            handleClose();
        } catch (error) {
            console.error("Üretime gönderme hatası:", error);
        } finally {
            setSending(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("tr-TR");
    };

    // Filtrelenmiş araç listesi
    const filteredVehicles = useMemo(() => {
        if (!searchTerm.trim()) {
            return vehicleAcceptances;
        }

        const searchLower = searchTerm.toLowerCase();
        return vehicleAcceptances.filter(
            (vehicle) =>
                vehicle.plate_number.toLowerCase().includes(searchLower) ||
                (vehicle.description && vehicle.description.toLowerCase().includes(searchLower))
        );
    }, [vehicleAcceptances, searchTerm]);

    const handleClose = () => {
        onClose();
        setSelectedVehicleId(null);
        setSearchTerm("");
        setProductionNotes("");
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-5xl w-[85vw] max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Factory className="h-5 w-5" />
                        Üretime Gönder
                    </DialogTitle>
                    <DialogDescription>
                        Teklifi üretime göndermek için araç kabul listesinden bir araç seçin ve üretim notları ekleyin.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col space-y-4">
                    {/* Search Section */}
                    {!isLoading && vehicleAcceptances.length > 0 && (
                        <div className="flex-shrink-0 space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-lg">Araç Kabul Listesi</h3>
                                <Badge variant="outline" className="text-sm">
                                    {filteredVehicles.length} araç
                                </Badge>
                            </div>

                            {/* Search Input */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Plaka numarası veya açıklama ile ara..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            <span>Araç kabul listesi yükleniyor...</span>
                        </div>
                    )}

                    {/* Vehicle Acceptance List */}
                    {!isLoading && vehicleAcceptances.length > 0 && (
                        <div className="flex-1 overflow-y-auto">
                            <div className="space-y-4">
                                {filteredVehicles.map((vehicle) => (
                                    <Card
                                        key={vehicle.id}
                                        className={`cursor-pointer transition-all duration-200 ${
                                            selectedVehicleId === vehicle.id
                                                ? "ring-2 ring-blue-500 border-blue-300 bg-blue-50 shadow-md"
                                                : "hover:border-gray-300 hover:shadow-md border-gray-200"
                                        }`}
                                        onClick={() => setSelectedVehicleId(vehicle.id!)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-4">
                                                {/* Sol - Araç Icon */}
                                                <div
                                                    className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                        selectedVehicleId === vehicle.id
                                                            ? "bg-blue-500 text-white"
                                                            : "bg-blue-100 text-blue-600"
                                                    }`}
                                                >
                                                    <Car className="h-6 w-6" />
                                                </div>

                                                {/* Orta - Araç Bilgileri */}
                                                <div className="flex-1 min-w-0">
                                                    {/* Plaka ve Badge'ler */}
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-lg font-bold text-gray-900">
                                                            {vehicle.plate_number}
                                                        </h3>
                                                        <Badge variant="outline" className="text-xs">
                                                            ID: {vehicle.id}
                                                        </Badge>
                                                        <Badge className="text-xs bg-green-100 text-green-700">
                                                            ✓ Kabul Edildi
                                                        </Badge>
                                                    </div>

                                                    {/* Bilgi Grid - Yatay dizilim */}
                                                    <div className="flex items-center gap-8">
                                                        <div className="text-center">
                                                            <div className="text-xs text-gray-500 mb-1">
                                                                Kabul Tarihi
                                                            </div>
                                                            <div className="font-semibold text-sm text-gray-900">
                                                                {formatDate(vehicle.date)}
                                                            </div>
                                                        </div>

                                                        <div className="text-center">
                                                            <div className="text-xs text-gray-500 mb-1">
                                                                Giriş Saati
                                                            </div>
                                                            <div className="font-semibold text-sm text-gray-900">
                                                                {vehicle.tse_entry_datetime
                                                                    ? new Date(
                                                                          vehicle.tse_entry_datetime
                                                                      ).toLocaleTimeString("tr-TR", {
                                                                          hour: "2-digit",
                                                                          minute: "2-digit",
                                                                      })
                                                                    : "-"}
                                                            </div>
                                                        </div>

                                                        <div className="text-center">
                                                            <div className="text-xs text-gray-500 mb-1">Giriş KM</div>
                                                            <div className="font-semibold text-sm text-gray-900">
                                                                {vehicle.entry_km
                                                                    ? `${vehicle.entry_km.toLocaleString()} km`
                                                                    : "-"}
                                                            </div>
                                                        </div>

                                                        <div className="text-center">
                                                            <div className="text-xs text-gray-500 mb-1">Yakıt</div>
                                                            <div className="font-semibold text-sm text-gray-900">
                                                                {vehicle.fuel_level}/4
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Açıklama */}
                                                    {vehicle.description && (
                                                        <div className="mt-2 text-xs text-gray-600">
                                                            <span className="font-medium">Not:</span>{" "}
                                                            {vehicle.description}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Sağ - Seçim Checkbox */}
                                                <div className="flex items-center">
                                                    <div
                                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                                            selectedVehicleId === vehicle.id
                                                                ? "bg-blue-500 border-blue-500"
                                                                : "border-gray-300 hover:border-blue-400"
                                                        }`}
                                                    >
                                                        {selectedVehicleId === vehicle.id && (
                                                            <CheckCircle2 className="h-4 w-4 text-white" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* No Results State */}
                    {!isLoading && vehicleAcceptances.length > 0 && filteredVehicles.length === 0 && (
                        <div className="text-center py-8">
                            <Search className="h-8 w-8 mx-auto text-gray-400 mb-3" />
                            <h3 className="text-base font-semibold text-gray-900 mb-1">Araç Bulunamadı</h3>
                            <p className="text-sm text-gray-600">araması için sonuç bulunamadı.</p>
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && vehicleAcceptances.length === 0 && (
                        <div className="text-center py-12">
                            <Car className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Araç Kabul Bulunamadı</h3>
                            <p className="text-gray-600">
                                Üretime göndermek için önce araç kabul işlemi yapmanız gerekiyor.
                            </p>
                        </div>
                    )}

                    {/* Production Notes Section */}
                    {!isLoading && vehicleAcceptances.length > 0 && (
                        <div className="flex-shrink-0">
                            <Separator className="my-6" />
                            <div className="bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-200 rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900">Üretim Notları</h3>
                                    </div>
                                </div>
                                <Textarea
                                    placeholder="Üretim ile ilgili notlarınızı ekleyiniz."
                                    value={productionNotes}
                                    onChange={(e) => setProductionNotes(e.target.value)}
                                    className="min-h-[120px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons - Fixed at bottom */}
                <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            {selectedVehicleId ? (
                                <span className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    Araç seçildi, üretime gönderebilirsiniz
                                </span>
                            ) : (
                                <span className="text-gray-500">Lütfen bir araç seçin</span>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={handleClose} disabled={sending} className="px-6 py-2.5">
                                İptal
                            </Button>
                            <Button
                                onClick={handleSendToProduction}
                                disabled={!selectedVehicleId || sending}
                                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-8 py-2.5 text-base font-medium shadow-lg"
                            >
                                {sending ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                        Gönderiliyor...
                                    </>
                                ) : (
                                    <>
                                        <Factory className="h-5 w-5 mr-2" />
                                        Üretime Gönder
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
