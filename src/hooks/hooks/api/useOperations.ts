import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { Operation, CreateOperationData, ApiResponse } from "@/lib/api/types";

export const useOperations = () => {
    const queryClient = useQueryClient();

    // Operasyonları getir (React Query ile cache'le)
    const {
        data: operations = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ["operations"],
        queryFn: async (): Promise<Operation[]> => {
            const response = await apiClient.get<Operation[]>(API_ENDPOINTS.operations.getAll);
            return response;
        },
        staleTime: 30 * 1000, // 30 saniye cache
        refetchOnWindowFocus: false,
    });

    // Operasyon oluştur
    const createOperationMutation = useMutation({
        mutationFn: async (data: CreateOperationData): Promise<ApiResponse<{ operationId: number }>> => {
            const backendData = {
                name: data.name,
                qualityControl: data.qualityControl,
                targetDuration: data.targetDuration,
            };

            const response = await apiClient.post<ApiResponse<{ operationId: number }>>(
                API_ENDPOINTS.operations.create,
                backendData
            );

            return response;
        },
        onSuccess: () => {
            // Operasyon listesini yenile
            queryClient.invalidateQueries({ queryKey: ["operations"] });
        },
    });

    // Operasyon güncelle
    const updateOperationMutation = useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: string;
            data: Record<string, unknown>;
        }): Promise<ApiResponse<{ operation: Operation }>> => {
            const response = await apiClient.put<ApiResponse<{ operation: Operation }>>(
                API_ENDPOINTS.operations.update(id),
                data
            );

            return response;
        },
        onSuccess: () => {
            // Operasyon listesini yenile
            queryClient.invalidateQueries({ queryKey: ["operations"] });
        },
    });

    // Operasyon sil
    const deleteOperationMutation = useMutation({
        mutationFn: async (id: string): Promise<ApiResponse<{ message: string }>> => {
            const response = await apiClient.delete<ApiResponse<{ message: string }>>(
                API_ENDPOINTS.operations.delete(id)
            );

            return response;
        },
        onSuccess: () => {
            // Operasyon listesini yenile
            queryClient.invalidateQueries({ queryKey: ["operations"] });
        },
    });

    // Tekil operasyon getir
    const getOperationById = useCallback(async (id: string): Promise<Operation> => {
        const response = await apiClient.get<Operation>(API_ENDPOINTS.operations.getById(id));
        return response;
    }, []);

    return {
        operations,
        createOperation: createOperationMutation.mutateAsync,
        updateOperation: (id: string, data: Record<string, unknown>) =>
            updateOperationMutation.mutateAsync({ id, data }),
        deleteOperation: deleteOperationMutation.mutateAsync,
        getOperationById,
        isLoading,
        isLoadingCreate: createOperationMutation.isPending,
        isLoadingUpdate: updateOperationMutation.isPending,
        isLoadingDelete: deleteOperationMutation.isPending,
        error: error?.message || null,
    };
};
