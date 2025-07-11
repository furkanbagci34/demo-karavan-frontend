import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    purchase_price?: number;
    image: string;
}

export interface OfferItem {
    id?: number;
    productId: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    discountAmount?: number;
    discountType?: string;
    discountValue?: number;
    sortOrder?: number;
}

export interface Offer {
    id: number;
    offer_number: string;
    customer_id?: number;
    customer_name?: string;
    subtotal: number;
    discount_amount: number;
    discount_type?: string;
    discount_value?: number;
    net_total: number;
    vat_rate: number;
    vat_amount: number;
    total_amount: number;
    status: string;
    valid_until?: string;
    notes?: string;
    item_count: number;
    total_items_price: number;
    created_at: string;
    updated_at: string;
    items?: OfferItem[] | unknown[]; // Backend'den gelen items array
}

interface CreateOfferData {
    offerNumber?: string;
    customerId?: number;
    subtotal: number;
    discountType?: string;
    discountValue?: number;
    discountMethod?: string;
    discountAmount: number;
    netTotal: number;
    vatRate: number;
    vatAmount: number;
    totalAmount: number;
    status?: string;
    validUntil?: string;
    notes?: string;
    items: OfferItem[];
}

export const useOffers = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getProductsForOffer = useCallback(async (search?: string) => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.get<Product[]>(API_ENDPOINTS.offers.getProducts(search));
            setProducts(response);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Ürünler yüklenirken bir hata oluştu";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const createOffer = useCallback(async (offerData: CreateOfferData) => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.post<{ message: string; offerId: number }>(
                API_ENDPOINTS.offers.create,
                offerData as unknown as Record<string, unknown>
            );
            return response;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Teklif oluşturulurken bir hata oluştu";
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateOffer = useCallback(async (offerId: number, offerData: Partial<CreateOfferData>) => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.put<{ message: string; offerId: number }>(
                API_ENDPOINTS.offers.update(offerId.toString()),
                offerData
            );
            return response;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Teklif güncellenirken bir hata oluştu";
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getOfferById = useCallback(async (offerId: number): Promise<Offer | null> => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.get<Offer>(API_ENDPOINTS.offers.getById(offerId.toString()));
            return response;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Teklif yüklenirken bir hata oluştu";
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getAllOffers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.get<Offer[]>(API_ENDPOINTS.offers.getAll);
            return response;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Teklifler yüklenirken bir hata oluştu";
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteOffer = useCallback(async (offerId: number) => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.delete<{ message: string }>(
                API_ENDPOINTS.offers.delete(offerId.toString())
            );
            return response;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Teklif silinirken bir hata oluştu";
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        products,
        loading,
        error,
        getProductsForOffer,
        createOffer,
        updateOffer,
        getOfferById,
        getAllOffers,
        deleteOffer,
    };
};
