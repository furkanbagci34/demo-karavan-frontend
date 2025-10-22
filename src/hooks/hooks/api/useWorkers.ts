import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export interface Worker {
    id: number;
    name: string;
    surname: string;
    email: string;
    phone?: string;
    specialization: string;
    experience_years: number;
    is_available: boolean;
    created_at: string;
    updated_at: string;
}

export const useWorkers = () => {
    const getWorkers = useQuery({
        queryKey: ["workers"],
        queryFn: async (): Promise<Worker[]> => {
            const data = await apiClient.get<Worker[]>(API_ENDPOINTS.workers.getWorkers);
            return data;
        },
        staleTime: 5 * 60 * 1000, // 5 dakika
    });

    const getAvailableWorkers = useQuery({
        queryKey: ["workers", "available"],
        queryFn: async (): Promise<Worker[]> => {
            const data = await apiClient.get<Worker[]>(API_ENDPOINTS.workers.getAvailableWorkers);
            return data;
        },
        staleTime: 2 * 60 * 1000, // 2 dakika
    });

    return {
        workers: getWorkers.data || [],
        availableWorkers: getAvailableWorkers.data || [],
        isLoading: getWorkers.isLoading,
        isLoadingAvailable: getAvailableWorkers.isLoading,
        error: getWorkers.error || getAvailableWorkers.error,
    };
};
