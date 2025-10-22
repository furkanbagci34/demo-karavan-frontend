import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

// Üretim planları rapor listesi için tip
export interface ProductionExecutionReport {
    id: number;
    production_plan_id: number;
    offer_id: number | null;
    customer_id: number | null;
    vehicle_acceptance_id: number | null;
    status: string;
    description: string | null;
    number: number | null;
    started_at: string | null;
    paused_at: string | null;
    completed_at: string | null;
    cancelled_at: string | null;
    created_at: string;
    updated_at: string;
    production_plan_name: string;
    vehicle_id: number;
    vehicle_name: string;
    vehicle_brand_model: string;
    customer_name: string | null;
    customer_email: string | null;
    offer_number: string | null;
    offer_total_amount: string | null;
    plate_number: string | null;
    acceptance_date: string | null;
    created_by_name: string;
    total_operations: number;
    completed_operations: number;
    in_progress_operations: number;
    pending_operations: number;
    total_duration: number;
    progress_percentage: number;
}

// Üretim planı detaylı rapor için tip
export interface ProductionExecutionDetailReport {
    id: number;
    production_plan_id: number;
    offer_id: number | null;
    customer_id: number | null;
    vehicle_acceptance_id: number | null;
    status: string;
    description: string | null;
    number: number | null;
    started_at: string | null;
    paused_at: string | null;
    completed_at: string | null;
    cancelled_at: string | null;
    created_at: string;
    updated_at: string;
    production_plan_name: string;
    vehicle_id: number;
    vehicle_name: string;
    vehicle_brand_model: string;
    customer_name: string | null;
    customer_email: string | null;
    offer_number: string | null;
    offer_total_amount: string | null;
    plate_number: string | null;
    acceptance_date: string | null;
    created_by_name: string;
    updated_by_name: string;
    operations: OperationDetailReport[];
    statistics: {
        total_operations: number;
        completed_operations: number;
        in_progress_operations: number;
        pending_operations: number;
        awaiting_quality_operations: number;
        total_duration: number;
        progress_percentage: number;
    };
}

export interface OperationDetailReport {
    id: number;
    station_id: number;
    original_station_id: number;
    operation_id: number;
    original_operation_id: number;
    sort_order: number;
    target_duration: number;
    quality_control: boolean;
    status: string;
    start_time: string | null;
    end_time: string | null;
    duration: number;
    quality_check_passed: boolean | null;
    quality_notes: string | null;
    operation_notes: string | null;
    assigned_worker_ids: number[];
    created_at: string;
    updated_at: string;
    station_name: string;
    operation_name: string;
    original_operation_name: string;
    production_number: number;
    created_by_name: string;
    updated_by_name: string;
    assigned_workers: Array<{
        id: number;
        name: string;
        surname: string;
        email: string;
        specialization: string;
        experience_years: number;
    }>;
    // Duraklatılma bilgileri
    total_pause_duration: number;
    pause_count: number;
    pause_details: Array<{
        id: number;
        pause_time: string;
        resume_time: string;
        duration_minutes: number;
        pause_reason: string | null;
        paused_by: number | null;
    }> | null;
}

export const useReports = () => {
    // Tüm üretim planlarını raporlama için getir
    const useProductionExecutionsReport = () => {
        return useQuery<ProductionExecutionReport[]>({
            queryKey: ["reports", "production-executions"],
            queryFn: async () => {
                try {
                    // apiClient.get() zaten response.data'yı return ediyor
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const data = (await apiClient.get(API_ENDPOINTS.reports.getProductionExecutions)) as any[];

                    // Backend'den gelen string değerleri number'a çevir
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const processedData = (data || []).map((item: any) => ({
                        ...item,
                        total_operations: parseInt(item.total_operations) || 0,
                        completed_operations: parseInt(item.completed_operations) || 0,
                        in_progress_operations: parseInt(item.in_progress_operations) || 0,
                        pending_operations: parseInt(item.pending_operations) || 0,
                        total_duration: parseInt(item.total_duration) || 0,
                        progress_percentage: parseFloat(item.progress_percentage) || 0,
                    }));

                    return processedData;
                } catch (error) {
                    console.error("Reports API Error:", error);
                    throw error;
                }
            },
            staleTime: 5 * 60 * 1000, // 5 dakika fresh kal
            gcTime: 10 * 60 * 1000, // 10 dakika cache'de tut
            refetchOnMount: true, // Mount'ta yeniden çek
            refetchOnWindowFocus: false, // Window focus'ta yeniden çekme
            refetchOnReconnect: true, // Reconnect'te yeniden çek
            refetchInterval: false, // Otomatik yenileme yok
            retry: 1, // 1 kez tekrar dene
        });
    };

    // Detaylı üretim raporu getir
    const useProductionExecutionDetailReport = (executionId: number | null) => {
        return useQuery<ProductionExecutionDetailReport>({
            queryKey: ["reports", "production-execution-detail", executionId],
            queryFn: async () => {
                if (!executionId) throw new Error("Execution ID is required");
                // apiClient.get() zaten response.data'yı return ediyor
                const data = (await apiClient.get(
                    API_ENDPOINTS.reports.getProductionExecutionDetail(executionId.toString())
                )) as ProductionExecutionDetailReport;
                return data;
            },
            enabled: !!executionId,
            staleTime: 5 * 60 * 1000, // 5 dakika fresh kal
            gcTime: 10 * 60 * 1000, // 10 dakika cache'de tut
            refetchOnMount: true, // Mount'ta yeniden çek
            refetchOnWindowFocus: false, // Window focus'ta yeniden çekme
            refetchOnReconnect: true, // Reconnect'te yeniden çek
            refetchInterval: false, // Otomatik yenileme yok
            retry: 1, // 1 kez tekrar dene
        });
    };

    // Operasyon duraklatılma detayları için hook
    const useOperationPauses = (operationId: number) => {
        return useQuery<
            Array<{
                id: number;
                pause_time: string;
                resume_time: string;
                duration_minutes: number;
                pause_reason: string | null;
                paused_by: number | null;
                paused_by_name: string | null;
                paused_by_surname: string | null;
            }>
        >({
            queryKey: ["reports", "operation-pauses", operationId],
            queryFn: async () => {
                try {
                    const data = (await apiClient.get(
                        API_ENDPOINTS.reports.getOperationPauses(operationId.toString())
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    )) as any;
                    return data;
                } catch (error) {
                    console.error("Error fetching operation pauses:", error);
                    throw error;
                }
            },
            staleTime: 2 * 60 * 1000, // 2 dakika
            gcTime: 5 * 60 * 1000, // 5 dakika
            refetchOnMount: true,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            refetchInterval: false,
            retry: 3,
            networkMode: "online",
        });
    };

    return {
        useProductionExecutionsReport,
        useProductionExecutionDetailReport,
        useOperationPauses,
    };
};
