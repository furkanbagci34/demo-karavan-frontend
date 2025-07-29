import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { ProductionPlan, CreateProductionPlanData, UpdateProductionPlanData, ApiResponse } from "@/lib/api/types";
import { toast } from "sonner";

export const useProductionPlans = () => {
    const queryClient = useQueryClient();

    const create = useMutation({
        mutationFn: async (data: CreateProductionPlanData): Promise<ApiResponse<{ planId: number }>> => {
            const backendData = {
                name: data.name,
                vehicleId: data.vehicleId,
                description: data.description,
                stations: data.stations,
            };

            const response = await apiClient.post<ApiResponse<{ planId: number }>>(
                API_ENDPOINTS.productionPlans.create,
                backendData
            );

            return response;
        },
        onSuccess: () => {
            toast.success("Üretim planı başarıyla oluşturuldu.");
            queryClient.invalidateQueries({ queryKey: ["productionPlans"] });
        },
        onError: (error: unknown) => {
            const errorMessage =
                typeof error === "object" &&
                error !== null &&
                "response" in error &&
                typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === "string"
                    ? (error as { response?: { data?: { message?: string } } }).response!.data!.message!
                    : "Üretim planı oluşturulurken bir hata oluştu.";
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
                API_ENDPOINTS.productionPlans.update(id.toString()),
                data as Record<string, unknown>
            );
            return response;
        },
        onSuccess: () => {
            toast.success("Üretim planı başarıyla güncellendi.");
            queryClient.invalidateQueries({ queryKey: ["productionPlans"] });
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

    const remove = useMutation({
        mutationFn: async (id: number): Promise<ApiResponse<{ success: boolean }>> => {
            const response = await apiClient.delete<ApiResponse<{ success: boolean }>>(
                API_ENDPOINTS.productionPlans.delete(id.toString())
            );
            return response;
        },
        onSuccess: () => {
            toast.success("Üretim planı başarıyla silindi.");
            queryClient.invalidateQueries({ queryKey: ["productionPlans"] });
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

    const get = useQuery({
        queryKey: ["productionPlans"],
        queryFn: async (): Promise<ProductionPlan[]> => {
            const response = await apiClient.get<ProductionPlan[]>(API_ENDPOINTS.productionPlans.getAll);
            return response;
        },
    });

    const useProductionPlanById = (id: number | null) => {
        return useQuery({
            queryKey: ["productionPlans", id],
            queryFn: async (): Promise<ProductionPlan> => {
                const response = await apiClient.get<ProductionPlan>(
                    API_ENDPOINTS.productionPlans.getById(id!.toString())
                );
                return response;
            },
            enabled: !!id,
        });
    };

    const useProductionPlansByVehicle = (vehicleId: number | null) => {
        return useQuery({
            queryKey: ["productionPlans", "vehicle", vehicleId],
            queryFn: async (): Promise<ProductionPlan[]> => {
                const response = await apiClient.get<ProductionPlan[]>(
                    API_ENDPOINTS.productionPlans.getByVehicle(vehicleId!.toString())
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
        useProductionPlanById,
        useProductionPlansByVehicle,
    };
};
