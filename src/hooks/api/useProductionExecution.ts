import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import {
    ProductionExecution,
    CreateProductionExecutionData,
    UpdateProductionExecutionData,
    UpdateOperationExecutionData,
    ApiResponse,
} from "@/lib/api/types";
import { toast } from "sonner";

export const useProductionExecution = () => {
    const queryClient = useQueryClient();

    // Yeni üretim execution oluştur
    const create = useMutation({
        mutationFn: async (data: CreateProductionExecutionData): Promise<ApiResponse<{ executionId: number }>> => {
            const response = await apiClient.post<ApiResponse<{ executionId: number }>>(
                API_ENDPOINTS.productionExecution.create,
                data
            );
            return response;
        },
        onSuccess: () => {
            toast.success("Üretim planı başarıyla başlatıldı.");
            queryClient.invalidateQueries({ queryKey: ["productionExecutions"] });
            queryClient.invalidateQueries({ queryKey: ["activeProductionExecutions"] });
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

    // Üretim execution güncelle (durum değişiklikleri)
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
                data
            );
            return response;
        },
        onSuccess: () => {
            toast.success("Üretim planı başarıyla güncellendi.");
            queryClient.invalidateQueries({ queryKey: ["productionExecutions"] });
            queryClient.invalidateQueries({ queryKey: ["activeProductionExecutions"] });
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

    // Operasyon durumu güncelle
    const updateOperation = useMutation({
        mutationFn: async ({
            executionId,
            operationId,
            data,
        }: {
            executionId: number;
            operationId: number;
            data: UpdateOperationExecutionData;
        }): Promise<ApiResponse<{ success: boolean }>> => {
            const response = await apiClient.put<ApiResponse<{ success: boolean }>>(
                API_ENDPOINTS.productionExecution.updateOperation(executionId.toString(), operationId.toString()),
                data
            );
            return response;
        },
        onSuccess: () => {
            toast.success("Operasyon durumu güncellendi.");
            queryClient.invalidateQueries({ queryKey: ["productionExecutions"] });
            queryClient.invalidateQueries({ queryKey: ["activeProductionExecutions"] });
        },
        onError: (error: unknown) => {
            let errorMessage = "Operasyon güncellenirken bir hata oluştu.";
            if (typeof error === "object" && error !== null && "response" in error) {
                const errObj = error as { response?: { data?: { message?: string } } };
                if (typeof errObj.response?.data?.message === "string") {
                    errorMessage = errObj.response.data.message;
                }
            }
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
            queryClient.invalidateQueries({ queryKey: ["activeProductionExecutions"] });
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

    // Tüm üretim execution'ları getir
    const getAll = useQuery({
        queryKey: ["productionExecutions"],
        queryFn: async (): Promise<ProductionExecution[]> => {
            const response = await apiClient.get<ProductionExecution[]>(API_ENDPOINTS.productionExecution.getAll);
            return response;
        },
    });

    // Aktif üretim execution'ları getir
    const getActive = useQuery({
        queryKey: ["activeProductionExecutions"],
        queryFn: async (): Promise<ProductionExecution[]> => {
            const response = await apiClient.get<ProductionExecution[]>(API_ENDPOINTS.productionExecution.getActive);
            return response;
        },
        refetchInterval: 5000, // 5 saniyede bir güncelle
    });

    // ID ile üretim execution getir
    const useProductionExecutionById = (id: number | null) => {
        return useQuery({
            queryKey: ["productionExecutions", id],
            queryFn: async (): Promise<ProductionExecution> => {
                const response = await apiClient.get<ProductionExecution>(
                    API_ENDPOINTS.productionExecution.getById(id!.toString())
                );
                return response;
            },
            enabled: !!id,
        });
    };

    return {
        create,
        update,
        updateOperation,
        remove,
        getAll,
        getActive,
        useProductionExecutionById,
    };
};
