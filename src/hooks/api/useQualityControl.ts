import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
    QualityControlItem,
    QualityControlGroupedByVehicle,
    CreateQualityControlItemData,
    ProductionPlanForQC,
    SubmitQualityControlData,
    QualityControlRecord,
    QualityControlStats,
    QualityControlPlanStats,
} from "@/lib/api/types";
import { toast } from "sonner";

export function useQualityControl() {
    const queryClient = useQueryClient();

    // Araç modeli bazında gruplandırılmış kalite kontrol maddelerini getir
    const {
        data: groupedQualityControlItems = [],
        isLoading: isLoadingGrouped,
        refetch: refetchGrouped,
    } = useQuery({
        queryKey: ["quality-control", "grouped"],
        queryFn: async () => {
            const response = await apiClient.get<QualityControlGroupedByVehicle[]>(
                API_ENDPOINTS.qualityControl.getGroupedByVehicle
            );
            return response;
        },
    });

    // Belirli bir araca ait kalite kontrol maddelerini getir
    const useQualityControlItemsByVehicle = (vehicleId: number | null) => {
        return useQuery({
            queryKey: ["quality-control", "vehicle", vehicleId],
            queryFn: async () => {
                if (!vehicleId) return [];
                const response = await apiClient.get<QualityControlItem[]>(
                    API_ENDPOINTS.qualityControl.getByVehicle(vehicleId.toString())
                );
                return response;
            },
            enabled: !!vehicleId,
        });
    };

    // Yeni kalite kontrol maddesi oluştur
    const createMutation = useMutation({
        mutationFn: async (data: CreateQualityControlItemData) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response = await apiClient.post(API_ENDPOINTS.qualityControl.create, data as any);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["quality-control"] });
            toast.success("Kalite kontrol maddesi başarıyla oluşturuldu");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Kalite kontrol maddesi oluşturulurken bir hata oluştu");
        },
    });

    // Kalite kontrol maddesinin durumunu değiştir
    const toggleStatusMutation = useMutation({
        mutationFn: async (id: number) => {
            const response = await apiClient.put(API_ENDPOINTS.qualityControl.toggleStatus(id.toString()), {});
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["quality-control"] });
            toast.success("Durum başarıyla güncellendi");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Durum güncellenirken bir hata oluştu");
        },
    });

    // Kalite kontrol maddesini sil
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const response = await apiClient.delete(API_ENDPOINTS.qualityControl.delete(id.toString()));
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["quality-control"] });
            toast.success("Kalite kontrol maddesi başarıyla silindi");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Kalite kontrol maddesi silinirken bir hata oluştu");
        },
    });

    // Kalite kontrol için üretim planlarını getir
    const useProductionPlansForQC = () => {
        return useQuery({
            queryKey: ["quality-control", "production-executions"],
            queryFn: async () => {
                const response = await apiClient.get<ProductionPlanForQC[]>(
                    API_ENDPOINTS.qualityControl.getProductionPlans
                );
                return response;
            },
        });
    };

    // Kalite kontrol kaydet
    const submitQCMutation = useMutation({
        mutationFn: async (data: SubmitQualityControlData) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response = await apiClient.post(API_ENDPOINTS.qualityControl.submit, data as any);
            return response;
        },
        onSuccess: (_, variables) => {
            // Tüm kalite kontrol cache'lerini temizle
            queryClient.invalidateQueries({ queryKey: ["quality-control"] });

            // Özellikle bu plan için olan cache'leri temizle
            queryClient.invalidateQueries({
                queryKey: ["quality-control", "records", variables.productionExecutionId],
            });
            queryClient.invalidateQueries({
                queryKey: ["quality-control", "latest-status", variables.productionExecutionId],
            });
            queryClient.invalidateQueries({
                queryKey: ["quality-control", "plan-stats", variables.productionExecutionId],
            });

            // Üretim planları cache'ini de temizle
            queryClient.invalidateQueries({
                queryKey: ["quality-control", "production-executions"],
            });

            toast.success("Kalite kontrol başarıyla kaydedildi");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Kalite kontrol kaydedilirken bir hata oluştu");
        },
    });

    // Üretim planının kalite kontrol kayıtlarını getir (tüm geçmiş)
    const useQCRecords = (productionExecutionId: number | null) => {
        return useQuery({
            queryKey: ["quality-control", "records", productionExecutionId],
            queryFn: async () => {
                if (!productionExecutionId) return [];
                const response = await apiClient.get<QualityControlRecord[]>(
                    API_ENDPOINTS.qualityControl.getRecords(productionExecutionId.toString())
                );
                return response;
            },
            enabled: !!productionExecutionId,
        });
    };

    // Üretim planının en son kalite kontrol durumunu getir
    const useLatestQCStatus = (productionExecutionId: number | null) => {
        return useQuery({
            queryKey: ["quality-control", "latest-status", productionExecutionId],
            queryFn: async () => {
                if (!productionExecutionId) return [];
                const response = await apiClient.get<QualityControlRecord[]>(
                    API_ENDPOINTS.qualityControl.getLatestStatus(productionExecutionId.toString())
                );
                return response;
            },
            enabled: !!productionExecutionId,
        });
    };

    // Kalite kontrol istatistiklerini getir
    const useQCStats = () => {
        return useQuery({
            queryKey: ["quality-control", "stats"],
            queryFn: async () => {
                const response = await apiClient.get<QualityControlStats>(API_ENDPOINTS.qualityControl.getStats);
                return response;
            },
        });
    };

    // Belirli bir plan için kalite kontrol istatistiklerini getir
    const useQCPlanStats = (productionExecutionId: number | null) => {
        return useQuery({
            queryKey: ["quality-control", "plan-stats", productionExecutionId],
            queryFn: async () => {
                if (!productionExecutionId) return null;
                const response = await apiClient.get<QualityControlPlanStats>(
                    API_ENDPOINTS.qualityControl.getPlanStats(productionExecutionId.toString())
                );
                return response;
            },
            enabled: !!productionExecutionId,
        });
    };

    // Cache temizleme fonksiyonu
    const invalidateAllQC = () => {
        queryClient.invalidateQueries({ queryKey: ["quality-control"] });
    };

    return {
        groupedQualityControlItems,
        isLoadingGrouped,
        refetchGrouped,
        createItem: createMutation.mutateAsync,
        toggleStatus: toggleStatusMutation.mutateAsync,
        deleteItem: deleteMutation.mutateAsync,
        submitQC: submitQCMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isTogglingStatus: toggleStatusMutation.isPending,
        isDeleting: deleteMutation.isPending,
        isSubmittingQC: submitQCMutation.isPending,
        useQualityControlItemsByVehicle,
        useProductionPlansForQC,
        useQCRecords,
        useLatestQCStatus,
        useQCStats,
        useQCPlanStats,
        invalidateAllQC,
    };
}
