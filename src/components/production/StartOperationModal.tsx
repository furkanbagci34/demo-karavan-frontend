"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { useWorkers } from "@/hooks/api/useWorkers";

interface StartOperationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartOperation: (workerIds: number[], workerNames: string[]) => void;
    operationName: string;
    operationId: number;
}

export const StartOperationModal: React.FC<StartOperationModalProps> = ({ isOpen, onClose, onStartOperation }) => {
    const [selectedWorkerIds, setSelectedWorkerIds] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [starting, setStarting] = useState(false);

    // API'den worker verilerini çek
    const { availableWorkers, isLoadingAvailable } = useWorkers();

    // Filtrelenmiş worker listesi
    const filteredWorkers = availableWorkers.filter((worker) => {
        if (!searchTerm.trim()) return true;

        const searchLower = searchTerm.toLowerCase();
        return (
            worker.name.toLowerCase().includes(searchLower) ||
            worker.surname.toLowerCase().includes(searchLower) ||
            worker.specialization.toLowerCase().includes(searchLower)
        );
    });

    const handleWorkerToggle = (workerId: number) => {
        setSelectedWorkerIds((prev) =>
            prev.includes(workerId) ? prev.filter((id) => id !== workerId) : [...prev, workerId]
        );
    };

    const handleStart = async () => {
        if (selectedWorkerIds.length === 0) {
            toast.error("Usta Seçilmedi", {
                description: "Lütfen operasyonu yapacak en az bir usta seçin.",
            });
            return;
        }

        const selectedWorkers = availableWorkers.filter((w) => selectedWorkerIds.includes(w.id));
        const workerNames = selectedWorkers.map((w) => `${w.name} ${w.surname}`);

        try {
            setStarting(true);
            await onStartOperation(selectedWorkerIds, workerNames);
            handleClose();
        } catch (error) {
            console.error("Operasyon başlatma hatası:", error);
        } finally {
            setStarting(false);
        }
    };

    const handleClose = () => {
        onClose();
        setSelectedWorkerIds([]);
        setSearchTerm("");
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md w-[90vw]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Play className="h-5 w-5 text-blue-600" />
                        Operasyonu Başlat
                    </DialogTitle>
                    <DialogDescription>İşi yapacak ustayı seçin:</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Loading State */}
                    {isLoadingAvailable && (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-sm text-muted-foreground">Ustalar yükleniyor...</span>
                        </div>
                    )}

                    {/* Workers Radio List - Fotoğraftaki gibi */}
                    {!isLoadingAvailable && (
                        <div className="space-y-3">
                            {filteredWorkers.map((worker) => (
                                <div
                                    key={worker.id}
                                    className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
                                    onClick={() => handleWorkerToggle(worker.id)}
                                >
                                    <input
                                        type="checkbox"
                                        id={`worker-${worker.id}`}
                                        checked={selectedWorkerIds.includes(worker.id)}
                                        onChange={() => handleWorkerToggle(worker.id)}
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">
                                            {worker.name} {worker.surname}
                                        </div>
                                        <div className="text-sm text-gray-500">{worker.email}</div>
                                        <div className="text-xs text-gray-400">
                                            {worker.specialization} • {worker.experience_years} yıl deneyim
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Selected Workers Count */}
                    {selectedWorkerIds.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="text-sm text-blue-800">
                                <span className="font-medium">{selectedWorkerIds.length} usta seçildi:</span>
                                <div className="mt-1 text-xs">
                                    {availableWorkers
                                        .filter((w) => selectedWorkerIds.includes(w.id))
                                        .map((w) => `${w.name} ${w.surname}`)
                                        .join(", ")}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* No Workers State */}
                    {!isLoadingAvailable && filteredWorkers.length === 0 && (
                        <div className="text-center py-6">
                            <User className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600">Müsait usta bulunmamaktadır.</p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={handleClose} disabled={starting}>
                        İptal
                    </Button>
                    <Button
                        onClick={handleStart}
                        disabled={selectedWorkerIds.length === 0 || starting}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {starting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Başlat
                            </>
                        ) : (
                            <>
                                <Play className="h-4 w-4 mr-2" />
                                Başlat
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
