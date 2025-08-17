import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import {
    VehicleAcceptance,
    CreateVehicleAcceptanceData,
    UpdateVehicleAcceptanceData,
    ApiResponse,
} from "@/lib/api/types";
import { RequestData } from "@/lib/api/client";

export const useVehicleAcceptance = () => {
    const queryClient = useQueryClient();

    // Araç kabul oluştur
    const createVehicleAcceptanceMutation = useMutation({
        mutationFn: async (
            data: CreateVehicleAcceptanceData
        ): Promise<ApiResponse<{ vehicleAcceptanceId: number }>> => {
            const response = await apiClient.post<ApiResponse<{ vehicleAcceptanceId: number }>>(
                API_ENDPOINTS.vehicleAcceptance.create,
                data as unknown as RequestData
            );
            return response;
        },
        onSuccess: () => {
            // Araç kabul listesini yenile
            queryClient.invalidateQueries({ queryKey: ["vehicleAcceptances"] });
        },
    });

    // Araç kabul güncelle
    const updateVehicleAcceptanceMutation = useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: string;
            data: UpdateVehicleAcceptanceData;
        }): Promise<ApiResponse<{ vehicleAcceptance: VehicleAcceptance }>> => {
            const response = await apiClient.put<ApiResponse<{ vehicleAcceptance: VehicleAcceptance }>>(
                API_ENDPOINTS.vehicleAcceptance.update(id),
                data as unknown as RequestData
            );
            return response;
        },
        onSuccess: () => {
            // Araç kabul listesini yenile
            queryClient.invalidateQueries({ queryKey: ["vehicleAcceptances"] });
        },
    });

    // Araç kabul sil
    const deleteVehicleAcceptanceMutation = useMutation({
        mutationFn: async (id: string): Promise<ApiResponse<{ message: string }>> => {
            const response = await apiClient.delete<ApiResponse<{ message: string }>>(
                API_ENDPOINTS.vehicleAcceptance.delete(id)
            );
            return response;
        },
        onSuccess: () => {
            // Araç kabul listesini yenile
            queryClient.invalidateQueries({ queryKey: ["vehicleAcceptances"] });
        },
    });

    // Tekil araç kabul getir
    const getVehicleAcceptanceById = useCallback(async (id: string): Promise<VehicleAcceptance> => {
        const response = await apiClient.get<VehicleAcceptance>(API_ENDPOINTS.vehicleAcceptance.getById(id));
        return response;
    }, []);

    // Plaka numarasına göre araç kabul getir
    const getVehicleAcceptanceByPlateNumber = useCallback(async (plateNumber: string): Promise<VehicleAcceptance[]> => {
        const response = await apiClient.get<VehicleAcceptance[]>(
            API_ENDPOINTS.vehicleAcceptance.getByPlateNumber(plateNumber)
        );
        return response;
    }, []);

    // Tarih aralığına göre araç kabul getir
    const getVehicleAcceptanceByDateRange = useCallback(
        async (startDate: string, endDate: string): Promise<VehicleAcceptance[]> => {
            const response = await apiClient.get<VehicleAcceptance[]>(
                API_ENDPOINTS.vehicleAcceptance.getByDateRange(startDate, endDate)
            );
            return response;
        },
        []
    );

    return {
        createVehicleAcceptance: createVehicleAcceptanceMutation.mutateAsync,
        updateVehicleAcceptance: (id: string, data: UpdateVehicleAcceptanceData) =>
            updateVehicleAcceptanceMutation.mutateAsync({ id, data }),
        deleteVehicleAcceptance: deleteVehicleAcceptanceMutation.mutateAsync,
        getVehicleAcceptanceById,
        getVehicleAcceptanceByPlateNumber,
        getVehicleAcceptanceByDateRange,
        isLoadingCreate: createVehicleAcceptanceMutation.isPending,
        isLoadingUpdate: updateVehicleAcceptanceMutation.isPending,
        isLoadingDelete: deleteVehicleAcceptanceMutation.isPending,
    };
};
