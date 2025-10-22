import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { Vehicle, CreateVehicleData, UpdateVehicleData, ApiResponse } from "@/lib/api/types";

export const useVehicles = () => {
    const queryClient = useQueryClient();

    // Araçları getir (React Query ile cache'le)
    const {
        data: vehicles = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ["vehicles"],
        queryFn: async (): Promise<Vehicle[]> => {
            const response = await apiClient.get<Vehicle[]>(API_ENDPOINTS.vehicles.getAll);
            return response;
        },
        staleTime: 30 * 1000, // 30 saniye cache
        refetchOnWindowFocus: false,
    });

    // Araç oluştur
    const createVehicleMutation = useMutation({
        mutationFn: async (data: CreateVehicleData): Promise<ApiResponse<{ vehicleId: number }>> => {
            const backendData = {
                name: data.name,
                brandModel: data.brandModel,
                image: data.image,
                isActive: data.isActive,
            };

            const response = await apiClient.post<ApiResponse<{ vehicleId: number }>>(
                API_ENDPOINTS.vehicles.create,
                backendData
            );

            return response;
        },
        onSuccess: () => {
            // Araç listesini yenile
            queryClient.invalidateQueries({ queryKey: ["vehicles"] });
        },
    });

    // Araç güncelle
    const updateVehicleMutation = useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: string;
            data: UpdateVehicleData;
        }): Promise<ApiResponse<{ vehicle: Vehicle }>> => {
            const response = await apiClient.put<ApiResponse<{ vehicle: Vehicle }>>(
                API_ENDPOINTS.vehicles.update(id),
                data as Record<string, unknown>
            );

            return response;
        },
        onSuccess: () => {
            // Araç listesini yenile
            queryClient.invalidateQueries({ queryKey: ["vehicles"] });
        },
    });

    // Araç sil
    const deleteVehicleMutation = useMutation({
        mutationFn: async (id: string): Promise<ApiResponse<{ message: string }>> => {
            const response = await apiClient.delete<ApiResponse<{ message: string }>>(
                API_ENDPOINTS.vehicles.delete(id)
            );

            return response;
        },
        onSuccess: () => {
            // Araç listesini yenile
            queryClient.invalidateQueries({ queryKey: ["vehicles"] });
        },
    });

    // Tekil araç getir
    const getVehicleById = useCallback(async (id: string): Promise<Vehicle> => {
        const response = await apiClient.get<Vehicle>(API_ENDPOINTS.vehicles.getById(id));
        return response;
    }, []);

    return {
        vehicles,
        createVehicle: createVehicleMutation.mutateAsync,
        updateVehicle: (id: string, data: UpdateVehicleData) => updateVehicleMutation.mutateAsync({ id, data }),
        deleteVehicle: deleteVehicleMutation.mutateAsync,
        getVehicleById,
        isLoading,
        isLoadingCreate: createVehicleMutation.isPending,
        isLoadingUpdate: updateVehicleMutation.isPending,
        isLoadingDelete: deleteVehicleMutation.isPending,
        error: error?.message || null,
    };
};
