import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { VehiclePart, CreateVehiclePartData, UpdateVehiclePartData, ApiResponse } from "@/lib/api/types";

export const useVehicleParts = (vehicleId?: string) => {
    const queryClient = useQueryClient();

    // Vehicle parts getir (React Query ile cache'le)
    const {
        data: vehicleParts = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ["vehicle-parts", vehicleId],
        queryFn: async (): Promise<VehiclePart[]> => {
            if (!vehicleId) return [];
            const response = await apiClient.get<VehiclePart[]>(API_ENDPOINTS.vehicles.getParts(vehicleId));
            return response;
        },
        enabled: !!vehicleId,
        staleTime: 30 * 1000, // 30 saniye cache
        refetchOnWindowFocus: false,
    });

    // Vehicle part oluştur/güncelle
    const createVehiclePartMutation = useMutation({
        mutationFn: async (data: CreateVehiclePartData): Promise<ApiResponse<{ vehiclePartId: number }>> => {
            const backendData = {
                vehicleId: data.vehicleId,
                productIds: data.productIds,
            };

            const response = await apiClient.post<ApiResponse<{ vehiclePartId: number }>>(
                API_ENDPOINTS.vehicles.addPart(vehicleId!),
                backendData
            );

            return response;
        },
        onSuccess: () => {
            // Vehicle parts listesini yenile
            queryClient.invalidateQueries({ queryKey: ["vehicle-parts", vehicleId] });
            // Vehicles listesini de yenile
            queryClient.invalidateQueries({ queryKey: ["vehicles"] });
        },
    });

    // Vehicle part güncelle
    const updateVehiclePartMutation = useMutation({
        mutationFn: async ({
            partId,
            data,
        }: {
            partId: string;
            data: UpdateVehiclePartData;
        }): Promise<ApiResponse<{ vehiclePart: VehiclePart }>> => {
            const response = await apiClient.put<ApiResponse<{ vehiclePart: VehiclePart }>>(
                API_ENDPOINTS.vehicles.updatePart(vehicleId!, partId),
                data as Record<string, unknown>
            );

            return response;
        },
        onSuccess: () => {
            // Vehicle parts listesini yenile
            queryClient.invalidateQueries({ queryKey: ["vehicle-parts", vehicleId] });
        },
    });

    // Vehicle part sil
    const deleteVehiclePartMutation = useMutation({
        mutationFn: async (partId: string): Promise<ApiResponse<{ message: string }>> => {
            const response = await apiClient.delete<ApiResponse<{ message: string }>>(
                API_ENDPOINTS.vehicles.deletePart(vehicleId!, partId)
            );

            return response;
        },
        onSuccess: () => {
            // Vehicle parts listesini yenile
            queryClient.invalidateQueries({ queryKey: ["vehicle-parts", vehicleId] });
        },
    });

    // Tekil vehicle part getir
    const getVehiclePartById = async (partId: string): Promise<VehiclePart> => {
        const response = await apiClient.get<VehiclePart>(API_ENDPOINTS.vehicles.getPartById(vehicleId!, partId));
        return response;
    };

    return {
        vehicleParts,
        createVehiclePart: createVehiclePartMutation.mutateAsync,
        updateVehiclePart: (partId: string, data: UpdateVehiclePartData) =>
            updateVehiclePartMutation.mutateAsync({ partId, data }),
        deleteVehiclePart: deleteVehiclePartMutation.mutateAsync,
        getVehiclePartById,
        isLoading,
        isLoadingCreate: createVehiclePartMutation.isPending,
        isLoadingUpdate: updateVehiclePartMutation.isPending,
        isLoadingDelete: deleteVehiclePartMutation.isPending,
        error: error?.message || null,
    };
};
