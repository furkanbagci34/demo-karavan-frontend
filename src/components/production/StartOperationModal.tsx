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
            <DialogContent
                className="max-w-[95vw] sm:max-w-6xl lg:max-w-7xl max-h-[95vh] flex flex-col"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
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

                    {/* Workers Grid Layout */}
                    {!isLoadingAvailable && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {filteredWorkers.map((worker) => (
                                <div
                                    key={worker.id}
                                    className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                                        selectedWorkerIds.includes(worker.id)
                                            ? "ring-2 ring-green-400 shadow-lg"
                                            : "hover:shadow-md"
                                    }`}
                                    onClick={() => handleWorkerToggle(worker.id)}
                                >
                                    <div
                                        className={`p-4 rounded-lg border-2 transition-colors duration-200 ${
                                            selectedWorkerIds.includes(worker.id)
                                                ? "border-green-400 bg-green-50"
                                                : "border-gray-200 bg-white hover:border-gray-300"
                                        }`}
                                    >
                                        {/* Checkbox */}
                                        <div className="absolute top-3 right-3">
                                            <input
                                                type="checkbox"
                                                id={`worker-${worker.id}`}
                                                checked={selectedWorkerIds.includes(worker.id)}
                                                onChange={() => handleWorkerToggle(worker.id)}
                                                className="w-5 h-5 text-green-600 focus:ring-green-500 rounded border-2 border-gray-300"
                                            />
                                        </div>

                                        {/* Avatar */}
                                        <div className="flex justify-center mb-3">
                                            <div
                                                className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg transition-colors duration-200 ${
                                                    selectedWorkerIds.includes(worker.id)
                                                        ? "bg-gradient-to-br from-green-500 to-green-600"
                                                        : "bg-gradient-to-br from-blue-500 to-blue-600"
                                                }`}
                                            >
                                                {worker.name.charAt(0)}
                                                {worker.surname.charAt(0)}
                                            </div>
                                        </div>

                                        {/* Worker Info */}
                                        <div className="text-center space-y-2">
                                            <div className="font-semibold text-gray-900 text-sm leading-tight">
                                                {worker.name} {worker.surname}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate" title={worker.email}>
                                                {worker.email}
                                            </div>
                                            <div className="space-y-1">
                                                <div
                                                    className={`text-xs font-medium px-2 py-1 rounded-full inline-block transition-colors duration-200 ${
                                                        selectedWorkerIds.includes(worker.id)
                                                            ? "text-green-700 bg-green-200"
                                                            : "text-blue-600 bg-blue-100"
                                                    }`}
                                                >
                                                    {worker.specialization}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {worker.experience_years} yıl deneyim
                                                </div>
                                            </div>
                                        </div>

                                        {/* Selection Indicator */}
                                        {selectedWorkerIds.includes(worker.id) && (
                                            <div className="absolute top-2 left-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                                                <svg
                                                    className="w-4 h-4 text-white"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </div>
                                        )}
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
