import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { OfferStatus } from "@/lib/enums";
import { getErrorMessage } from "@/lib/utils";

export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    purchase_price?: number;
    image: string;
    unit?: string; // Ürün birimi (Adet, Saat vb.)
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
    vehicle_id?: number;
    customer_name?: string;
    subtotal: number;
    discount_amount: number;
    discount_type?: string;
    discount_value?: number;
    net_total: number;
    vat_rate: number;
    vat_amount: number;
    total_amount: number | string;
    status: string;
    valid_until?: string;
    notes?: string;
    item_count?: number;
    total_items_price?: number;
    created_at: string;
    updated_at?: string;
    items?: OfferItem[] | unknown[];
}

export interface OfferHistory {
    description: string;
    created_by_name: string;
    created_at: string;
}

export interface OfferPublic {
    uid: string;
    offer_number: string;
    subtotal: number;
    discount_type: string;
    discount_value: number;
    discount_amount: number;
    net_total: number;
    vat_rate: number;
    vat_amount: number;
    total_amount: number;
    status: string;
    valid_until: string;
    notes: string;
    created_at: string;
    customer_name: string;
    vehicle_brand: string;
    vehicle_model: string;
    vehicle_color: string;
    vehicle_engine_no: string;
    vehicle_chassis_no: string;
    vehicle_plate: string;
}

export interface OfferContract {
    id: number;
    uid: string;
    offer_id: number;
    customer_tckn: string;
    customer_address: string;
    vehicle_brand: string;
    vehicle_model: string;
    vehicle_color: string;
    vehicle_engine_no: string;
    vehicle_chassis_no: string;
    vehicle_plate: string;
    created_by: number;
    created_at: string;
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
            const errorMessage = getErrorMessage(err, "Ürünler yüklenirken bir hata oluştu");
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const getLastOfferId = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.get<{ lastId: number }>(API_ENDPOINTS.offers.getLastId);
            return response;
        } catch (err: unknown) {
            const errorMessage = getErrorMessage(err, "Son teklif ID'si alınırken bir hata oluştu");
            setError(errorMessage);
            throw err;
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
            const errorMessage = getErrorMessage(err, "Teklif oluşturulurken bir hata oluştu");
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
            const errorMessage = getErrorMessage(err, "Teklif güncellenirken bir hata oluştu");
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
            const errorMessage = getErrorMessage(err, "Teklif yüklenirken bir hata oluştu");
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
            const errorMessage = getErrorMessage(err, "Teklifler yüklenirken bir hata oluştu");
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
            const errorMessage = getErrorMessage(err, "Teklif silinirken bir hata oluştu");
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const sendOffer = useCallback(async (offerId: number, hidePricing: boolean = false) => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.post<{ message: string }>(
                API_ENDPOINTS.offers.sendOffer(offerId.toString()),
                { hidePricing }
            );
            return response;
        } catch (err: unknown) {
            const errorMessage = getErrorMessage(err, "Teklif gönderilirken bir hata oluştu");
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const sendContract = useCallback(
        async (contractData: {
            offerId: number;
            customerTckn: string;
            customerAddress: string;
            vehicleBrand: string;
            vehicleModel: string;
            vehicleColor: string;
            vehicleEngineNo: string;
            vehicleChassisNo: string;
            vehiclePlate: string;
        }) => {
            try {
                setLoading(true);
                setError(null);

                const response = await apiClient.post<{ message: string }>(
                    API_ENDPOINTS.offers.sendContract(contractData.offerId.toString()),
                    contractData
                );
                return response;
            } catch (err: unknown) {
                const errorMessage = getErrorMessage(err, "Sözleşme gönderilirken bir hata oluştu");
                setError(errorMessage);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [setLoading, setError]
    );

    const getOfferHistory = useCallback(async (offerId: number): Promise<OfferHistory[]> => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.get<OfferHistory[]>(API_ENDPOINTS.offers.getHistory(offerId.toString()));
            return response;
        } catch (err: unknown) {
            const errorMessage = getErrorMessage(err, "İşlem geçmişi yüklenirken bir hata oluştu");
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getContractByUid = useCallback(async (uid: string): Promise<OfferPublic | null> => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.get<OfferPublic>(API_ENDPOINTS.offers.getContractByUid(uid));
            return response;
        } catch (err: unknown) {
            const errorMessage = getErrorMessage(err, "Sözleşme yüklenirken bir hata oluştu");
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateOfferStatus = useCallback(async (uid: string, status: OfferStatus) => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.put<{ message: string }>(API_ENDPOINTS.offers.updateStatus(uid), {
                status,
            });
            return response;
        } catch (err: unknown) {
            const errorMessage = getErrorMessage(err, "Teklif durumu güncellenirken bir hata oluştu");
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getContractByOfferId = useCallback(
        async (offerId: number): Promise<OfferContract | null> => {
            try {
                setLoading(true);
                setError(null);

                const response = await apiClient.get<OfferContract>(
                    API_ENDPOINTS.offers.getContractByOfferId(offerId.toString())
                );
                return response;
            } catch (err: unknown) {
                const errorMessage = getErrorMessage(err, "Sözleşme yüklenirken bir hata oluştu");
                setError(errorMessage);
                return null; // Hata durumunda null döndür
            } finally {
                setLoading(false);
            }
        },
        [setLoading, setError]
    );

    const getOffersByCustomerId = useCallback(async (customerId: number): Promise<Offer[]> => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.get<Offer[]>(API_ENDPOINTS.offers.getByCustomerId(customerId.toString()));
            return response;
        } catch (err: unknown) {
            const errorMessage = getErrorMessage(err, "Müşteri teklifleri yüklenirken bir hata oluştu");
            setError(errorMessage);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        products,
        loading,
        error,
        getProductsForOffer,
        getLastOfferId,
        createOffer,
        updateOffer,
        getOfferById,
        getContractByUid,
        getContractByOfferId,
        getOffersByCustomerId,
        updateOfferStatus,
        getAllOffers,
        deleteOffer,
        sendOffer,
        getOfferHistory,
        sendContract,
    };
};
