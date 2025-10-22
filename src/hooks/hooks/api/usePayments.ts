import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { getErrorMessage } from "@/lib/utils";

export interface Payment {
    id: number;
    customer_id: number;
    offer_id?: number;
    offer_number?: string;
    payment_amount: number | string;
    payment_date: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

export interface CreatePaymentData {
    customerId: number;
    offerId?: number;
    paymentAmount: number;
    paymentDate: string;
    description?: string;
}

export const usePayments = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createPayment = useCallback(async (paymentData: CreatePaymentData) => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.post<{ message: string; paymentId: number }>(
                API_ENDPOINTS.payment.create,
                paymentData as unknown as Record<string, unknown>
            );
            return response;
        } catch (err: unknown) {
            const errorMessage = getErrorMessage(err, "Tahsilat oluşturulurken bir hata oluştu");
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getPaymentsByCustomerId = useCallback(async (customerId: number): Promise<Payment[]> => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.get<Payment[]>(
                API_ENDPOINTS.payment.getByCustomerId(customerId.toString())
            );
            return response;
        } catch (err: unknown) {
            const errorMessage = getErrorMessage(err, "Tahsilatlar yüklenirken bir hata oluştu");
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deletePayment = useCallback(async (paymentId: number) => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.delete<{ message: string }>(
                API_ENDPOINTS.payment.delete(paymentId.toString())
            );
            return response;
        } catch (err: unknown) {
            const errorMessage = getErrorMessage(err, "Tahsilat silinirken bir hata oluştu");
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        createPayment,
        getPaymentsByCustomerId,
        deletePayment,
    };
};
