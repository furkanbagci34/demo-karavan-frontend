import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { Warehouse, CreateWarehouseData, UpdateWarehouseData, ApiResponse } from "@/lib/api/types";

export const useWarehouses = () => {
    const queryClient = useQueryClient();

    // Depoları getir (React Query ile cache'le)
    const {
        data: warehouses = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ["warehouses"],
        queryFn: async (): Promise<Warehouse[]> => {
            const response = await apiClient.get<Warehouse[]>(API_ENDPOINTS.warehouses.getAll);
            return response;
        },
        staleTime: 30 * 1000, // 30 saniye cache
        refetchOnWindowFocus: false,
    });

    // Depo oluştur
    const createWarehouseMutation = useMutation({
        mutationFn: async (data: CreateWarehouseData): Promise<ApiResponse<{ warehouseId: number }>> => {
            const backendData = {
                name: data.name,
                description: data.description,
                isActive: data.isActive,
            };

            const response = await apiClient.post<ApiResponse<{ warehouseId: number }>>(
                API_ENDPOINTS.warehouses.create,
                backendData
            );

            return response;
        },
        onSuccess: () => {
            // Depo listesini yenile
            queryClient.invalidateQueries({ queryKey: ["warehouses"] });
        },
    });

    // Depo güncelle
    const updateWarehouseMutation = useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: string;
            data: UpdateWarehouseData;
        }): Promise<ApiResponse<{ warehouse: Warehouse }>> => {
            const response = await apiClient.put<ApiResponse<{ warehouse: Warehouse }>>(
                API_ENDPOINTS.warehouses.update(id),
                data as Record<string, unknown>
            );

            return response;
        },
        onSuccess: () => {
            // Depo listesini yenile
            queryClient.invalidateQueries({ queryKey: ["warehouses"] });
        },
    });

    // Depo sil (pasif hale getir)
    const deleteWarehouseMutation = useMutation({
        mutationFn: async (id: string): Promise<ApiResponse<{ message: string }>> => {
            const response = await apiClient.delete<ApiResponse<{ message: string }>>(
                API_ENDPOINTS.warehouses.delete(id)
            );

            return response;
        },
        onSuccess: () => {
            // Depo listesini yenile
            queryClient.invalidateQueries({ queryKey: ["warehouses"] });
        },
    });

    // Tekil depo getir
    const getWarehouseById = useCallback(async (id: string): Promise<Warehouse> => {
        const response = await apiClient.get<Warehouse>(API_ENDPOINTS.warehouses.getById(id));
        return response;
    }, []);

    return {
        warehouses,
        createWarehouse: createWarehouseMutation.mutateAsync,
        updateWarehouse: (id: string, data: UpdateWarehouseData) => updateWarehouseMutation.mutateAsync({ id, data }),
        deleteWarehouse: deleteWarehouseMutation.mutateAsync,
        getWarehouseById,
        isLoading,
        isLoadingCreate: createWarehouseMutation.isPending,
        isLoadingUpdate: updateWarehouseMutation.isPending,
        isLoadingDelete: deleteWarehouseMutation.isPending,
        error: error?.message || null,
    };
};
