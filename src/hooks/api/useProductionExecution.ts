import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import {
    ProductionExecution,
    CreateProductionExecutionData,
    UpdateProductionExecutionData,
    ApiResponse,
} from "@/lib/api/types";
import { toast } from "sonner";

export const useProductionExecution = () => {
    const queryClient = useQueryClient();

    // Yeni üretim execution oluştur
    const create = useMutation({
        mutationFn: async (data: CreateProductionExecutionData): Promise<ApiResponse<{ executionId: number }>> => {
            const backendData = {
                // Map all fields from data to backendData as needed
                // Example (replace with actual fields of CreateProductionExecutionData):
                // name: data.name,
                // description: data.description,
                // ...data
                ...data,
            };
            const response = await apiClient.post<ApiResponse<{ executionId: number }>>(
                API_ENDPOINTS.productionExecution.create,
                backendData
            );
            return response;
        },
        onSuccess: () => {
            toast.success("Üretim planı başarıyla başlatıldı.");
            queryClient.invalidateQueries({ queryKey: ["productionExecutions"] });
            queryClient.invalidateQueries({ queryKey: ["production-plan"] });
        },
        onError: (error: unknown) => {
            const errorMessage =
                typeof error === "object" &&
                error !== null &&
                "response" in error &&
                typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === "string"
                    ? (error as { response?: { data?: { message?: string } } }).response!.data!.message!
                    : "Üretim planı başlatılırken bir hata oluştu.";
            toast.error(errorMessage);
        },
    });

    // Üretim execution sil
    const remove = useMutation({
        mutationFn: async (id: number): Promise<ApiResponse<{ success: boolean }>> => {
            const response = await apiClient.delete<ApiResponse<{ success: boolean }>>(
                API_ENDPOINTS.productionExecution.delete(id.toString())
            );
            return response;
        },
        onSuccess: () => {
            toast.success("Üretim planı başarıyla silindi.");
            queryClient.invalidateQueries({ queryKey: ["productionExecutions"] });
            queryClient.invalidateQueries({ queryKey: ["production-plan"] });
        },
        onError: (error: unknown) => {
            let errorMessage = "Üretim planı silinirken bir hata oluştu.";
            if (typeof error === "object" && error !== null && "response" in error) {
                const errObj = error as { response?: { data?: { message?: string } } };
                if (typeof errObj.response?.data?.message === "string") {
                    errorMessage = errObj.response.data.message;
                }
            }
            toast.error(errorMessage);
        },
    });

    // Tekil üretim execution getir hook'u
    const useProductionExecutionById = (id: number) => {
        return useQuery({
            queryKey: ["productionExecution", id],
            queryFn: async (): Promise<ProductionExecution> => {
                const response = await apiClient.get<ProductionExecution>(
                    API_ENDPOINTS.productionExecution.getById(id.toString())
                );
                return response;
            },
            enabled: !!id,
        });
    };

    // Üretim execution güncelle
    const update = useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: number;
            data: UpdateProductionExecutionData;
        }): Promise<ApiResponse<{ success: boolean }>> => {
            const response = await apiClient.put<ApiResponse<{ success: boolean }>>(
                API_ENDPOINTS.productionExecution.update(id.toString()),
                data as Record<string, unknown>
            );
            return response;
        },
        onSuccess: () => {
            toast.success("Üretim planı başarıyla güncellendi.");
            queryClient.invalidateQueries({ queryKey: ["productionExecutions"] });
            queryClient.invalidateQueries({ queryKey: ["productionExecution"] });
            queryClient.invalidateQueries({ queryKey: ["production-plan"] });
        },
        onError: (error: unknown) => {
            let errorMessage = "Üretim planı güncellenirken bir hata oluştu.";
            if (typeof error === "object" && error !== null && "response" in error) {
                const errObj = error as { response?: { data?: { message?: string } } };
                if (typeof errObj.response?.data?.message === "string") {
                    errorMessage = errObj.response.data.message;
                }
            }
            toast.error(errorMessage);
        },
    });

    // Tüm üretim execution'ları getir
    const getAll = useQuery({
        queryKey: ["productionExecutions"],
        queryFn: async (): Promise<ProductionExecution[]> => {
            const response = await apiClient.get<ProductionExecution[]>(API_ENDPOINTS.productionExecution.getAll);
            return response;
        },
    });

    return {
        create,
        useProductionExecutionById,
        update,
        remove,
        getAll,
        // Compatibility aliases
        productionExecutions: getAll.data || [],
        isLoading: getAll.isLoading,
        error: getAll.error,
    };
};
