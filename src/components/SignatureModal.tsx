"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SignatureCanvas from "react-signature-canvas";

interface SignatureModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (signature: string) => void;
    onClear?: () => void;
    initialSignature?: string;
}

export const SignatureModal = ({ open, onOpenChange, onSave, onClear, initialSignature }: SignatureModalProps) => {
    const signatureRef = useRef<SignatureCanvas>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    useEffect(() => {
        if (open && signatureRef.current) {
            if (initialSignature && initialSignature.trim()) {
                // İmza yüklenirken küçük bir gecikme ekleyelim ki canvas hazır olsun
                setTimeout(() => {
                    if (signatureRef.current) {
                        signatureRef.current.clear();
                        signatureRef.current.fromDataURL(initialSignature);
                        setIsEmpty(false);
                    }
                }, 100);
            } else {
                signatureRef.current.clear();
                setIsEmpty(true);
            }
        }
    }, [open, initialSignature]);

    const handleClear = () => {
        if (signatureRef.current) {
            signatureRef.current.clear();
            setIsEmpty(true);
            // Eğer mevcut imza varsa, onu da temizle
            if (initialSignature && initialSignature.trim()) {
                onClear?.();
            }
        }
    };

    const handleSave = () => {
        if (signatureRef.current && !signatureRef.current.isEmpty()) {
            const signature = signatureRef.current.toDataURL("image/png");
            onSave(signature);
            onOpenChange(false);
        }
    };

    const handleEnd = () => {
        if (signatureRef.current) {
            setIsEmpty(signatureRef.current.isEmpty());
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-w-[95vw]">
                <DialogHeader>
                    <DialogTitle>
                        {initialSignature && initialSignature.trim() ? "İmzayı Düzenle" : "İmza At"}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {initialSignature && initialSignature.trim() && (
                        <div className="border rounded-lg p-3 bg-gray-50">
                            <p className="text-xs text-gray-600 mb-2">Mevcut İmza:</p>
                            <img src={initialSignature} alt="Mevcut İmza" className="h-20 border rounded bg-white" />
                        </div>
                    )}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white p-2 relative overflow-hidden">
                        <div
                            className="relative w-full"
                            style={{
                                touchAction: "none",
                                userSelect: "none",
                                WebkitUserSelect: "none",
                                MozUserSelect: "none",
                                msUserSelect: "none",
                                position: "relative",
                            }}
                            onMouseLeave={() => {
                                // Mouse çıktığında çizimi durdur
                                if (signatureRef.current) {
                                    const canvas = signatureRef.current.getCanvas();
                                    const ctx = canvas.getContext("2d");
                                    if (ctx) {
                                        ctx.beginPath();
                                    }
                                }
                            }}
                            onMouseUp={() => {
                                // Mouse bırakıldığında çizimi durdur
                                if (signatureRef.current) {
                                    const canvas = signatureRef.current.getCanvas();
                                    const ctx = canvas.getContext("2d");
                                    if (ctx) {
                                        ctx.beginPath();
                                    }
                                }
                            }}
                            onTouchEnd={() => {
                                // Touch bittiğinde çizimi durdur
                                if (signatureRef.current) {
                                    const canvas = signatureRef.current.getCanvas();
                                    const ctx = canvas.getContext("2d");
                                    if (ctx) {
                                        ctx.beginPath();
                                    }
                                }
                            }}
                            onTouchCancel={() => {
                                // Touch iptal olduğunda çizimi durdur
                                if (signatureRef.current) {
                                    const canvas = signatureRef.current.getCanvas();
                                    const ctx = canvas.getContext("2d");
                                    if (ctx) {
                                        ctx.beginPath();
                                    }
                                }
                            }}
                        >
                            <SignatureCanvas
                                ref={signatureRef}
                                canvasProps={{
                                    width: 700,
                                    height: 250,
                                    className: "signature-canvas w-full h-full",
                                    style: {
                                        touchAction: "none",
                                        userSelect: "none",
                                        WebkitUserSelect: "none",
                                        MozUserSelect: "none",
                                        msUserSelect: "none",
                                        cursor: "crosshair",
                                        display: "block",
                                        maxWidth: "100%",
                                        height: "auto",
                                    },
                                }}
                                backgroundColor="white"
                                onEnd={handleEnd}
                                penColor="black"
                                throttle={8}
                                minWidth={1.5}
                                maxWidth={2.5}
                                velocityFilterWeight={0.7}
                            />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 text-center">Yukarıdaki alana imzanızı atın</p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClear} type="button">
                        Temizle
                    </Button>
                    <Button onClick={handleSave} disabled={isEmpty} type="button">
                        Kaydet
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
