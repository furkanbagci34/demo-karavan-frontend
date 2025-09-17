import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProductionOperation, ProductionStatus, UpdateProductionOperationData } from "@/lib/api/types";
import { toast } from "sonner";

// Mock production operations data - gerçek API olmayacağı için dummy data
const mockProductionOperations: ProductionOperation[] = [
    {
        id: 1,
        name: "TAVAN KESİMİ",
        plan_name: "Plan 1",
        vehicle_name: "Araç A",
        station_name: "Kesim",
        status: "paused",
        progress: 3,
        elapsed_time: 18,
        target_time: 50,
        start_time: "2024-01-15T08:00:00Z",
        assigned_user_id: 1,
        assigned_user_name: "Ahmet Yılmaz",
        created_at: "2024-01-15T07:30:00Z",
        updated_at: "2024-01-15T08:18:00Z",
    },
    {
        id: 2,
        name: "KOLTUK MONTAJ",
        plan_name: "Plan 2",
        vehicle_name: "Araç B",
        station_name: "Montaj",
        status: "completed",
        progress: 100,
        elapsed_time: 20,
        target_time: 20,
        start_time: "2024-01-15T09:00:00Z",
        end_time: "2024-01-15T09:20:00Z",
        assigned_user_id: 1,
        assigned_user_name: "Ahmet Yılmaz",
        created_at: "2024-01-15T08:30:00Z",
        updated_at: "2024-01-15T09:20:00Z",
    },
    {
        id: 3,
        name: "TEMİZLİK",
        plan_name: "Plan 1",
        vehicle_name: "Araç C",
        station_name: "Elektrik",
        status: "completed",
        progress: 100,
        elapsed_time: 50,
        target_time: 50,
        start_time: "2024-01-15T10:00:00Z",
        end_time: "2024-01-15T10:50:00Z",
        assigned_user_id: 1,
        assigned_user_name: "Ahmet Yılmaz",
        created_at: "2024-01-15T09:30:00Z",
        updated_at: "2024-01-15T10:50:00Z",
    },
    {
        id: 4,
        name: "YIKAMA",
        plan_name: "Plan 2",
        vehicle_name: "Araç A",
        station_name: "Temizlik",
        status: "error",
        progress: 1,
        elapsed_time: 15,
        target_time: 50,
        start_time: "2024-01-15T11:00:00Z",
        assigned_user_id: 1,
        assigned_user_name: "Ahmet Yılmaz",
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T11:15:00Z",
    },
    {
        id: 5,
        name: "ÇATI MONTAJ",
        plan_name: "Plan 1",
        vehicle_name: "Araç B",
        station_name: "Kesim",
        status: "in_progress",
        progress: 0,
        elapsed_time: 0,
        target_time: 100,
        start_time: "2024-01-15T12:00:00Z",
        assigned_user_id: 1,
        assigned_user_name: "Ahmet Yılmaz",
        created_at: "2024-01-15T11:30:00Z",
        updated_at: "2024-01-15T12:00:00Z",
    },
    {
        id: 6,
        name: "ZEMİN KAPLAMA",
        plan_name: "Plan 2",
        vehicle_name: "Araç C",
        station_name: "Montaj",
        status: "in_progress",
        progress: 0,
        elapsed_time: 0,
        target_time: 300,
        start_time: "2024-01-15T13:00:00Z",
        assigned_user_id: 1,
        assigned_user_name: "Ahmet Yılmaz",
        created_at: "2024-01-15T12:30:00Z",
        updated_at: "2024-01-15T13:00:00Z",
    },
    {
        id: 7,
        name: "KOLTUK SÖKÜMÜ",
        plan_name: "Plan 1",
        vehicle_name: "Araç A",
        station_name: "Elektrik",
        status: "in_progress",
        progress: 0,
        elapsed_time: 0,
        target_time: 100,
        start_time: "2024-01-15T14:00:00Z",
        assigned_user_id: 1,
        assigned_user_name: "Ahmet Yılmaz",
        created_at: "2024-01-15T13:30:00Z",
        updated_at: "2024-01-15T14:00:00Z",
    },
];

// Local storage key for persisting data
const STORAGE_KEY = "production_operations";

// Helper function to get data from localStorage or use mock data
const getStoredOperations = (): ProductionOperation[] => {
    if (typeof window === "undefined") return mockProductionOperations;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            return mockProductionOperations;
        }
    }
    return mockProductionOperations;
};

// Helper function to save data to localStorage
const saveOperations = (operations: ProductionOperation[]) => {
    if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(operations));
    }
};

export const useProduction = () => {
    const queryClient = useQueryClient();

    // Get active operations for current user
    const getActiveOperations = useQuery({
        queryKey: ["production", "active-operations"],
        queryFn: async (): Promise<ProductionOperation[]> => {
            // Simulate API delay
            await new Promise((resolve) => setTimeout(resolve, 500));
            return getStoredOperations();
        },
        staleTime: 30 * 1000, // 30 saniye cache
        refetchInterval: 30 * 1000, // Her 30 saniyede bir yenile
    });

    // Start operation
    const startOperation = useMutation({
        mutationFn: async (operationId: number): Promise<ProductionOperation> => {
            // Simulate API delay
            await new Promise((resolve) => setTimeout(resolve, 300));

            const operations = getStoredOperations();
            const updatedOperations = operations.map((op) =>
                op.id === operationId
                    ? {
                          ...op,
                          status: "in_progress" as ProductionStatus,
                          start_time: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                      }
                    : op
            );

            saveOperations(updatedOperations);
            return updatedOperations.find((op) => op.id === operationId)!;
        },
        onSuccess: () => {
            toast.success("Operasyon başlatıldı");
            queryClient.invalidateQueries({ queryKey: ["production"] });
        },
        onError: () => {
            toast.error("Operasyon başlatılırken bir hata oluştu");
        },
    });

    // Pause operation
    const pauseOperation = useMutation({
        mutationFn: async (operationId: number): Promise<ProductionOperation> => {
            // Simulate API delay
            await new Promise((resolve) => setTimeout(resolve, 300));

            const operations = getStoredOperations();
            const updatedOperations = operations.map((op) =>
                op.id === operationId
                    ? { ...op, status: "paused" as ProductionStatus, updated_at: new Date().toISOString() }
                    : op
            );

            saveOperations(updatedOperations);
            return updatedOperations.find((op) => op.id === operationId)!;
        },
        onSuccess: () => {
            toast.success("Operasyon durduruldu");
            queryClient.invalidateQueries({ queryKey: ["production"] });
        },
        onError: () => {
            toast.error("Operasyon durdurulurken bir hata oluştu");
        },
    });

    // Complete operation
    const completeOperation = useMutation({
        mutationFn: async (operationId: number): Promise<ProductionOperation> => {
            // Simulate API delay
            await new Promise((resolve) => setTimeout(resolve, 300));

            const operations = getStoredOperations();
            const updatedOperations = operations.map((op) =>
                op.id === operationId
                    ? {
                          ...op,
                          status: "completed" as ProductionStatus,
                          progress: 100,
                          end_time: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                      }
                    : op
            );

            saveOperations(updatedOperations);
            return updatedOperations.find((op) => op.id === operationId)!;
        },
        onSuccess: () => {
            toast.success("Operasyon tamamlandı");
            queryClient.invalidateQueries({ queryKey: ["production"] });
        },
        onError: () => {
            toast.error("Operasyon tamamlanırken bir hata oluştu");
        },
    });

    // Update operation progress
    const updateProgress = useMutation({
        mutationFn: async ({
            operationId,
            data,
        }: {
            operationId: number;
            data: UpdateProductionOperationData;
        }): Promise<ProductionOperation> => {
            // Simulate API delay
            await new Promise((resolve) => setTimeout(resolve, 200));

            const operations = getStoredOperations();
            const updatedOperations = operations.map((op) =>
                op.id === operationId ? { ...op, ...data, updated_at: new Date().toISOString() } : op
            );

            saveOperations(updatedOperations);
            return updatedOperations.find((op) => op.id === operationId)!;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["production"] });
        },
        onError: () => {
            toast.error("İlerleme güncellenirken bir hata oluştu");
        },
    });

    return {
        // Queries
        operations: getActiveOperations.data || [],
        isLoading: getActiveOperations.isLoading,
        error: getActiveOperations.error,

        // Mutations
        startOperation: startOperation.mutateAsync,
        pauseOperation: pauseOperation.mutateAsync,
        completeOperation: completeOperation.mutateAsync,
        updateProgress: (operationId: number, data: UpdateProductionOperationData) =>
            updateProgress.mutateAsync({ operationId, data }),

        // Loading states
        isStarting: startOperation.isPending,
        isPausing: pauseOperation.isPending,
        isCompleting: completeOperation.isPending,
        isUpdatingProgress: updateProgress.isPending,
    };
};
