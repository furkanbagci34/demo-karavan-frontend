import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
        onError: (error: unknown) => {
            const errorMessage =
                typeof error === "object" &&
                error !== null &&
                "response" in error &&
                typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === "string"
                    ? (error as { response?: { data?: { message?: string } } }).response!.data!.message!
                    : "İstasyon oluşturulurken bir hata oluştu.";
            toast.error(errorMessage);
        },
    });

    const update = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: UpdateStationData }): Promise<ApiResponse<Station>> => {
            const response = await apiClient.put<ApiResponse<Station>>(
                API_ENDPOINTS.stations.update(id.toString()),
                data as Record<string, unknown>
            );
            return response;
        },
        onSuccess: () => {
            toast.success("İstasyon başarıyla güncellendi.");
            queryClient.invalidateQueries({ queryKey: ["stations"] });
        },
        onError: (error: unknown) => {
            let errorMessage = "İstasyon güncellenirken bir hata oluştu.";
            if (typeof error === "object" && error !== null && "response" in error) {
                const errObj = error as { response?: { data?: { message?: string } } };
                if (typeof errObj.response?.data?.message === "string") {
                    errorMessage = errObj.response.data.message;
                }
            }
            toast.error(errorMessage);
        },
    });

    const remove = useMutation({
        mutationFn: async (id: number): Promise<ApiResponse<{ success: boolean }>> => {
            const response = await apiClient.delete<ApiResponse<{ success: boolean }>>(
                API_ENDPOINTS.stations.delete(id.toString())
            );
            return response;
        },
        onSuccess: () => {
            toast.success("İstasyon başarıyla silindi.");
            queryClient.invalidateQueries({ queryKey: ["stations"] });
        },
        onError: (error: unknown) => {
            let errorMessage = "İstasyon silinirken bir hata oluştu.";
            if (typeof error === "object" && error !== null && "response" in error) {
                const errObj = error as { response?: { data?: { message?: string } } };
                if (typeof errObj.response?.data?.message === "string") {
                    errorMessage = errObj.response.data.message;
                }
            }
            toast.error(errorMessage);
        },
    });

    const get = useQuery({
        queryKey: ["stations"],
        queryFn: async (): Promise<Station[]> => {
            const response = await apiClient.get<Station[]>(API_ENDPOINTS.stations.getAll);
            return response;
        },
    });

    const useStationById = (id: number | null) => {
        return useQuery({
            queryKey: ["stations", id],
            queryFn: async (): Promise<Station> => {
                const response = await apiClient.get<Station>(API_ENDPOINTS.stations.getById(id!.toString()));
                return response;
            },
            enabled: !!id,
        });
    };

    return {
        create,
        update,
        remove,
        get,
        useStationById,
        isLoading: create.isPending || update.isPending || remove.isPending,
    };
};
