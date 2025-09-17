"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Pause, Loader2, AlertTriangle, Clock, Settings, FileText } from "lucide-react";
import { toast } from "sonner";

interface PauseOperationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPauseOperation: (reason: string, description: string) => void;
    operationName: string;
    operationId: number;
}

// Durdurma nedenleri
const pauseReasons = [
    { id: "malzeme_bekleme", label: "Malzeme bekleme", icon: Clock },
    { id: "ariza", label: "Arıza", icon: AlertTriangle },
    { id: "mola", label: "Mola", icon: Pause },
    { id: "diger", label: "Diğer", icon: Settings },
];

export const PauseOperationModal: React.FC<PauseOperationModalProps> = ({
    isOpen,
    onClose,
    onPauseOperation,
    operationName,
    operationId,
}) => {
    const [selectedReason, setSelectedReason] = useState<string>("");
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);

    const handlePause = async () => {
        if (!selectedReason) {
            toast.error("Durdurma Nedeni Seçilmedi", {
                description: "Lütfen operasyonu durdurma nedeninizi seçin.",
            });
            return;
        }

        try {
            setSaving(true);
            await onPauseOperation(selectedReason, description);
            handleClose();
        } catch (error) {
            console.error("Operasyon durdurma hatası:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        onClose();
        setSelectedReason("");
        setDescription("");
    };

    const getReasonLabel = (reasonId: string) => {
        return pauseReasons.find((reason) => reason.id === reasonId)?.label || reasonId;
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl w-[90vw]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Pause className="h-5 w-5 text-red-600" />
                        Operasyonu Durdur
                    </DialogTitle>
                    <DialogDescription>
                        <span className="font-semibold">{operationName}</span> operasyonunu durdurma nedeninizi seçin ve
                        açıklama ekleyin.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Durdurma Nedeni Seçimi */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Durdurma nedeni:</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {pauseReasons.map((reason) => {
                                const IconComponent = reason.icon;
                                return (
                                    <div
                                        key={reason.id}
                                        className={`cursor-pointer border-2 rounded-lg p-4 transition-all duration-200 ${
                                            selectedReason === reason.id
                                                ? "border-red-500 bg-red-50"
                                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                        }`}
                                        onClick={() => setSelectedReason(reason.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                    selectedReason === reason.id
                                                        ? "bg-red-500 text-white"
                                                        : "bg-gray-100 text-gray-600"
                                                }`}
                                            >
                                                <IconComponent className="h-5 w-5" />
                                            </div>
                                            <span
                                                className={`font-medium ${
                                                    selectedReason === reason.id ? "text-red-900" : "text-gray-700"
                                                }`}
                                            >
                                                {reason.label}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <Separator />

                    {/* Detay Açıklama */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <FileText className="h-4 w-4" />
                            <label className="text-sm font-medium text-gray-900">Detay (opsiyonel)</label>
                        </div>
                        <Textarea
                            placeholder={`${getReasonLabel(
                                selectedReason
                            )} ile ilgili detayları buraya yazabilirsiniz...`}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="min-h-[100px] resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Bu açıklama operasyon geçmişinde görüntülenecektir.
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={handleClose} disabled={saving}>
                        İptal
                    </Button>
                    <Button
                        onClick={handlePause}
                        disabled={!selectedReason || saving}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Durduruluyor...
                            </>
                        ) : (
                            <>
                                <Pause className="h-4 w-4 mr-2" />
                                Operasyonu Durdur
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
