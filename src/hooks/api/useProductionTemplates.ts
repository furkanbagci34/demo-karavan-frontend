import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { ProductionPlan, CreateProductionPlanData, UpdateProductionPlanData, ApiResponse } from "@/lib/api/types";
import { toast } from "sonner";

export const useProductionTemplates = () => {
    const queryClient = useQueryClient();

    const create = useMutation({
        mutationFn: async (data: CreateProductionPlanData): Promise<ApiResponse<{ templateId: number }>> => {
            const backendData = {
                name: data.name,
                vehicleId: data.vehicleId,
                description: data.description,
                stations: data.stations,
            };

            const response = await apiClient.post<ApiResponse<{ templateId: number }>>(
                API_ENDPOINTS.productionTemplates.create,
                backendData
            );

            return response;
        },
        onSuccess: () => {
            toast.success("Üretim şablonu başarıyla oluşturuldu.");
            queryClient.invalidateQueries({ queryKey: ["productionTemplates"] });
        },
        onError: (error: unknown) => {
            const errorMessage =
                typeof error === "object" &&
                error !== null &&
                "response" in error &&
                typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === "string"
                    ? (error as { response?: { data?: { message?: string } } }).response!.data!.message!
                    : "Üretim şablonu oluşturulurken bir hata oluştu.";
            toast.error(errorMessage);
        },
    });

    const update = useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: number;
            data: UpdateProductionPlanData;
        }): Promise<ApiResponse<ProductionPlan>> => {
            const response = await apiClient.put<ApiResponse<ProductionPlan>>(
                API_ENDPOINTS.productionTemplates.update(id.toString()),
                data as Record<string, unknown>
            );
            return response;
        },
        onSuccess: () => {
            toast.success("Üretim şablonu başarıyla güncellendi.");
            queryClient.invalidateQueries({ queryKey: ["productionTemplates"] });
        },
        onError: (error: unknown) => {
            let errorMessage = "Üretim şablonu güncellenirken bir hata oluştu.";
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
                API_ENDPOINTS.productionTemplates.delete(id.toString())
            );
            return response;
        },
        onSuccess: () => {
            toast.success("Üretim şablonu başarıyla silindi.");
            queryClient.invalidateQueries({ queryKey: ["productionTemplates"] });
        },
        onError: (error: unknown) => {
            let errorMessage = "Üretim şablonu silinirken bir hata oluştu.";
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
        queryKey: ["productionTemplates"],
        queryFn: async (): Promise<ProductionPlan[]> => {
            const response = await apiClient.get<ProductionPlan[]>(API_ENDPOINTS.productionTemplates.getAll);
            return response;
        },
    });

    const useProductionTemplateById = (id: number | null) => {
        return useQuery({
            queryKey: ["productionTemplates", id],
            queryFn: async (): Promise<ProductionPlan> => {
                const response = await apiClient.get<ProductionPlan>(
                    API_ENDPOINTS.productionTemplates.getById(id!.toString())
                );
                return response;
            },
            enabled: !!id,
        });
    };

    const useProductionTemplatesByVehicle = (vehicleId: number | null) => {
        return useQuery({
            queryKey: ["productionTemplates", "vehicle", vehicleId],
            queryFn: async (): Promise<ProductionPlan[]> => {
                const response = await apiClient.get<ProductionPlan[]>(
                    API_ENDPOINTS.productionTemplates.getByVehicle(vehicleId!.toString())
                );
                return response;
            },
            enabled: !!vehicleId,
        });
    };

    return {
        create,
        update,
        remove,
        get,
        useProductionTemplateById,
        useProductionTemplatesByVehicle,
    };
};
