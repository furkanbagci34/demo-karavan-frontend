"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Package } from "lucide-react";
import { useOffers } from "@/hooks/api/useOffers";

interface OfferProductsModalProps {
    isOpen: boolean;
    onClose: () => void;
    offerNumber: string | null;
}

interface OfferProduct {
    id: number;
    name: string;
    image: string;
    quantity: number;
}

export const OfferProductsModal: React.FC<OfferProductsModalProps> = ({ isOpen, onClose, offerNumber }) => {
    const { getOfferProductsByOfferNumber } = useOffers();
    const [products, setProducts] = useState<OfferProduct[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchProducts = async () => {
            if (offerNumber && isOpen) {
                setLoading(true);
                try {
                    const data = await getOfferProductsByOfferNumber(offerNumber);
                    setProducts(data);
                } catch (error) {
                    console.error("Ürünler yüklenirken hata:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchProducts();
    }, [offerNumber, isOpen, getOfferProductsByOfferNumber]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] sm:max-w-6xl lg:max-w-7xl max-h-[95vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Teklif Ürünleri - {offerNumber}</DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <span className="ml-3 text-muted-foreground">Ürünler yükleniyor...</span>
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Package className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Bu teklif için ürün bulunamadı.</p>
                    </div>
                ) : (
                    <div className="overflow-y-auto pr-2 space-y-3" style={{ maxHeight: "calc(85vh - 120px)" }}>
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className="border rounded-lg p-4 flex items-center gap-4 bg-white hover:bg-gray-50 transition-colors"
                            >
                                {/* Ürün Fotoğrafı */}
                                <div className="flex-shrink-0 w-20 h-20 relative bg-gray-100 rounded-md overflow-hidden">
                                    <Image
                                        src={
                                            product.image.startsWith("data:") || product.image.startsWith("http")
                                                ? product.image
                                                : `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}/${
                                                      product.image
                                                  }`
                                        }
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = "/images/no-image-placeholder.svg";
                                        }}
                                    />
                                </div>

                                {/* Ürün Bilgileri */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-base text-gray-900 mb-1 truncate">
                                        {product.name}
                                    </h3>
                                    <p className="text-sm text-gray-600">Miktar: {product.quantity} adet</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
