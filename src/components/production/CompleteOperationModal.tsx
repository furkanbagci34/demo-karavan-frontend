"use client";

import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, AlertTriangle } from "lucide-react";

interface CompleteOperationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    operationName: string;
    isCompleting: boolean;
}

export const CompleteOperationModal: React.FC<CompleteOperationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    operationName,
    isCompleting,
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md w-[90vw]" onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Operasyonu Tamamla
                    </DialogTitle>
                    <DialogDescription>
                        <span className="font-semibold">{operationName}</span> operasyonunu tamamlamak istediğinizden
                        emin misiniz?
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Uyarı Mesajı */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-yellow-800">
                                <p className="font-medium mb-1">Dikkat!</p>
                                <p>Bu işlem geri alınamaz. Operasyon tamamlandıktan sonra durum değiştirilemez.</p>
                            </div>
                        </div>
                    </div>

                    {/* Operasyon Bilgileri */}
                    <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm text-gray-700">
                            <p>
                                <span className="font-medium">Operasyon:</span> {operationName}
                            </p>
                            <p>
                                <span className="font-medium">Durum:</span> Tamamlanacak
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={onClose} disabled={isCompleting}>
                        İptal
                    </Button>
                    <Button onClick={onConfirm} disabled={isCompleting} className="bg-green-600 hover:bg-green-700">
                        {isCompleting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Tamamlanıyor...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Evet, Tamamla
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
