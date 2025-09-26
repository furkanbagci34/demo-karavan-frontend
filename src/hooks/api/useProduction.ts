import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProductionOperation, Station, OperationPause } from "@/lib/api/types";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { toast } from "sonner";

// Mock ve localStorage kaldırıldı; yalnızca BE kullanılır

export const useProduction = () => {
    const queryClient = useQueryClient();

    // Get active operations for current user
    const getActiveOperations = useQuery({
        queryKey: ["production", "active-operations"],
        queryFn: async (): Promise<ProductionOperation[]> => {
            const data = await apiClient.get<ProductionOperation[]>(API_ENDPOINTS.production.getActiveOperations);
            return data;
        },
        staleTime: 30 * 1000, // 30 saniye cache
        refetchInterval: 30 * 1000, // Her 30 saniyede bir yenile
    });

    // Get user authorized stations
    const getUserStations = useQuery({
        queryKey: ["production", "user-stations"],
        queryFn: async (): Promise<Station[]> => {
            const data = await apiClient.get<Station[]>(API_ENDPOINTS.production.getUserStations);
            return data;
        },
        staleTime: 5 * 60 * 1000, // 5 dakika cache
    });

    // Start operation
    const startOperation = useMutation({
        mutationFn: async ({ operationId, workerIds }: { operationId: number; workerIds: number[] }): Promise<void> => {
            await apiClient.post(API_ENDPOINTS.production.startOperation(operationId.toString()), {
                workerIds,
            });
        },
        onSuccess: () => {
            toast.success("Operasyon başlatıldı");
            queryClient.invalidateQueries({ queryKey: ["production"] });
            queryClient.invalidateQueries({ queryKey: ["production-execution"] });
        },
        onError: () => {
            toast.error("Operasyon başlatılırken bir hata oluştu");
        },
    });

    // Pause operation
    const pauseOperation = useMutation({
        mutationFn: async ({ operationId, reason }: { operationId: number; reason?: string }): Promise<void> => {
            await apiClient.post(API_ENDPOINTS.production.pauseOperation(operationId.toString()), {
                reason,
            });
        },
        onSuccess: () => {
            toast.success("Operasyon durduruldu");
            queryClient.invalidateQueries({ queryKey: ["production"] });
            queryClient.invalidateQueries({ queryKey: ["production-execution"] });
        },
        onError: () => {
            toast.error("Operasyon durdurulurken bir hata oluştu");
        },
    });

    // Resume operation
    const resumeOperation = useMutation({
        mutationFn: async (operationId: number): Promise<void> => {
            await apiClient.post(API_ENDPOINTS.production.resumeOperation(operationId.toString()));
        },
        onSuccess: () => {
            toast.success("Operasyon devam ettirildi");
            queryClient.invalidateQueries({ queryKey: ["production"] });
            queryClient.invalidateQueries({ queryKey: ["production-execution"] });
        },
        onError: () => {
            toast.error("Operasyon devam ettirilirken bir hata oluştu");
        },
    });

    // Complete operation
    const completeOperation = useMutation({
        mutationFn: async (operationId: number): Promise<void> => {
            await apiClient.post(API_ENDPOINTS.production.completeOperation(operationId.toString()));
        },
        onSuccess: () => {
            toast.success("Operasyon tamamlandı");
            queryClient.invalidateQueries({ queryKey: ["production"] });
            queryClient.invalidateQueries({ queryKey: ["production-execution"] });
        },
        onError: () => {
            toast.error("Operasyon tamamlanırken bir hata oluştu");
        },
    });

    // Update operation progress
    const updateProgress = useMutation({
        mutationFn: async ({ operationId, progress }: { operationId: number; progress: number }): Promise<void> => {
            await apiClient.put(API_ENDPOINTS.production.updateProgress(operationId.toString()), {
                progress,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["production"] });
            queryClient.invalidateQueries({ queryKey: ["production-execution"] });
        },
        onError: () => {
            toast.error("İlerleme güncellenirken bir hata oluştu");
        },
    });

    return {
        // Queries
        operations: getActiveOperations.data || [],
        userStations: getUserStations.data || [],
        isLoading: getActiveOperations.isLoading,
        isLoadingStations: getUserStations.isLoading,
        error: getActiveOperations.error,

        // Mutations
        startOperation: (operationId: number, workerIds: number[]) =>
            startOperation.mutateAsync({ operationId, workerIds }),
        pauseOperation: (operationId: number, reason?: string) => pauseOperation.mutateAsync({ operationId, reason }),
        resumeOperation: resumeOperation.mutateAsync,
        completeOperation: completeOperation.mutateAsync,
        updateProgress: (operationId: number, progress: number) =>
            updateProgress.mutateAsync({ operationId, progress }),

        // Loading states
        isStarting: startOperation.isPending,
        isPausing: pauseOperation.isPending,
        isResuming: resumeOperation.isPending,
        isCompleting: completeOperation.isPending,
        isUpdatingProgress: updateProgress.isPending,
    };
};

// Operasyon geçmişi için ayrı hook
export const useOperationPauses = (operationId: number) => {
    const getOperationPauses = useQuery({
        queryKey: ["production", "operation-pauses", operationId],
        queryFn: async (): Promise<OperationPause[]> => {
            const data = await apiClient.get<OperationPause[]>(
                API_ENDPOINTS.production.getOperationPauses(operationId.toString())
            );
            return data;
        },
        enabled: !!operationId,
        staleTime: 30 * 1000, // 30 saniye cache
    });

    return {
        pauses: getOperationPauses.data || [],
        isLoading: getOperationPauses.isLoading,
        error: getOperationPauses.error,
    };
};
