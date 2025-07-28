import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { Station, CreateStationData, UpdateStationData, ApiResponse } from "@/lib/api/types";
import { toast } from "sonner";

export const useStations = () => {
    const queryClient = useQueryClient();

    const create = useMutation({
        mutationFn: async (data: CreateStationData): Promise<ApiResponse<{ stationId: number }>> => {
            const backendData = {
                name: data.name,
            };

            const response = await apiClient.post<ApiResponse<{ stationId: number }>>(
                API_ENDPOINTS.stations.create,
                backendData
            );

            return response;
        },
        onSuccess: () => {
            toast.success("İstasyon başarıyla oluşturuldu.");
            queryClient.invalidateQueries({ queryKey: ["stations"] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "İstasyon oluşturulurken bir hata oluştu.");
        },
    });

    const update = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: UpdateStationData }): Promise<ApiResponse<any>> => {
            const response = await apiClient.put<ApiResponse<any>>(
                API_ENDPOINTS.stations.update(id.toString()),
                data as any
            );
            return response;
        },
        onSuccess: () => {
            toast.success("İstasyon başarıyla güncellendi.");
            queryClient.invalidateQueries({ queryKey: ["stations"] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "İstasyon güncellenirken bir hata oluştu.");
        },
    });

    const remove = useMutation({
        mutationFn: async (id: number): Promise<ApiResponse<any>> => {
            const response = await apiClient.delete<ApiResponse<any>>(API_ENDPOINTS.stations.delete(id.toString()));
            return response;
        },
        onSuccess: () => {
            toast.success("İstasyon başarıyla silindi.");
            queryClient.invalidateQueries({ queryKey: ["stations"] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "İstasyon silinirken bir hata oluştu.");
        },
    });

    const get = useQuery({
        queryKey: ["stations"],
        queryFn: async (): Promise<Station[]> => {
            const response = await apiClient.get<Station[]>(API_ENDPOINTS.stations.getAll);
            return response;
        },
    });

    const getById = useCallback((id: number | null) => {
        return useQuery({
            queryKey: ["stations", id],
            queryFn: async (): Promise<Station> => {
                const response = await apiClient.get<Station>(API_ENDPOINTS.stations.getById(id!.toString()));
                return response;
            },
            enabled: !!id,
        });
    }, []);

    return {
        create,
        update,
        remove,
        get,
        getById,
        isLoading: create.isPending || update.isPending || remove.isPending,
    };
};
