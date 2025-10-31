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

export const useVehicleAcceptance = () => {
    const queryClient = useQueryClient();

    // Tüm araç kabul listesini getir (React Query ile cache'le)
    const {
        data: vehicleAcceptances = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ["vehicleAcceptances"],
        queryFn: async (): Promise<VehicleAcceptance[]> => {
            const response = await apiClient.get<VehicleAcceptance[]>(API_ENDPOINTS.vehicleAcceptance.getAll);
            return response;
        },
        staleTime: 30 * 1000, // 30 saniye cache
        refetchOnWindowFocus: false,
    });

    // Araç kabul oluştur
    const createVehicleAcceptanceMutation = useMutation({
        mutationFn: async (
            data: CreateVehicleAcceptanceData
        ): Promise<ApiResponse<{ vehicleAcceptanceId: number }>> => {
            const backendData = {
                date: data.date,
                form_type: data.form_type,
                plate_number: data.plate_number,
                chassis_number: data.chassis_number,
                customer_id: data.customer_id,
                entry_km: data.entry_km,
                exit_km: data.exit_km,
                tse_entry_datetime: data.tse_entry_datetime,
                tse_exit_datetime: data.tse_exit_datetime,
                delivery_date: data.delivery_date,
                description: data.description,
                delivered_by: data.delivered_by,
                signature: data.signature,
                fuel_level: data.fuel_level,
                features: data.features,
                damage_markers: data.damage_markers,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                pdf_base64: (data as any).pdf_base64,
            };

            const response = await apiClient.post<ApiResponse<{ vehicleAcceptanceId: number }>>(
                API_ENDPOINTS.vehicleAcceptance.create,
                backendData
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
                data as Record<string, unknown>
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

    return {
        // Query data
        vehicleAcceptances,

        // Mutation methods
        createVehicleAcceptance: createVehicleAcceptanceMutation.mutateAsync,
        updateVehicleAcceptance: (id: string, data: UpdateVehicleAcceptanceData) =>
            updateVehicleAcceptanceMutation.mutateAsync({ id, data }),
        deleteVehicleAcceptance: deleteVehicleAcceptanceMutation.mutateAsync,

        // Callback methods
        getVehicleAcceptanceById,
        sendVehicleAcceptanceEmail: async (id: string, pdfBase64: string) => {
            const response = await apiClient.post<ApiResponse<{ message: string }>>(
                API_ENDPOINTS.vehicleAcceptance.sendEmail(id),
                { pdfBase64 }
            );
            return response;
        },

        // Loading states
        isLoading,
        isLoadingCreate: createVehicleAcceptanceMutation.isPending,
        isLoadingUpdate: updateVehicleAcceptanceMutation.isPending,
        isLoadingDelete: deleteVehicleAcceptanceMutation.isPending,

        // Error handling
        error: error?.message || null,
    };
};
