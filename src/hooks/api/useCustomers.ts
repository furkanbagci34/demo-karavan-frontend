import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { Customer, CreateCustomerData, ApiResponse } from "@/lib/api/types";

export const useCustomers = () => {
    const queryClient = useQueryClient();

    // Müşterileri getir (React Query ile cache'le)
    const {
        data: customers = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ["customers"],
        queryFn: async (): Promise<Customer[]> => {
            const response = await apiClient.get<Customer[]>(API_ENDPOINTS.customers.getAll);
            return response;
        },
        staleTime: 30 * 1000, // 30 saniye cache
        refetchOnWindowFocus: false,
    });

    // Müşteri oluştur
    const createCustomerMutation = useMutation({
        mutationFn: async (data: CreateCustomerData): Promise<ApiResponse<{ customerId: number }>> => {
            const backendData = {
                name: data.name,
                email: data.email,
                phoneNumber: data.phoneNumber,
                description: data.description,
            };

            const response = await apiClient.post<ApiResponse<{ customerId: number }>>(
                API_ENDPOINTS.customers.create,
                backendData
            );

            return response;
        },
        onSuccess: () => {
            // Müşteri listesini yenile
            queryClient.invalidateQueries({ queryKey: ["customers"] });
        },
    });

    // Müşteri güncelle
    const updateCustomerMutation = useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: string;
            data: Record<string, unknown>;
        }): Promise<ApiResponse<{ customer: Customer }>> => {
            const response = await apiClient.put<ApiResponse<{ customer: Customer }>>(
                API_ENDPOINTS.customers.update(id),
                data
            );

            return response;
        },
        onSuccess: () => {
            // Müşteri listesini yenile
            queryClient.invalidateQueries({ queryKey: ["customers"] });
        },
    });

    // Müşteri sil
    const deleteCustomerMutation = useMutation({
        mutationFn: async (id: string): Promise<ApiResponse<{ message: string }>> => {
            const response = await apiClient.delete<ApiResponse<{ message: string }>>(
                API_ENDPOINTS.customers.delete(id)
            );

            return response;
        },
        onSuccess: () => {
            // Müşteri listesini yenile
            queryClient.invalidateQueries({ queryKey: ["customers"] });
        },
    });

    // Tekil müşteri getir
    const getCustomerById = async (id: string): Promise<Customer> => {
        const response = await apiClient.get<Customer>(API_ENDPOINTS.customers.getById(id));
        return response;
    };

    return {
        customers,
        createCustomer: createCustomerMutation.mutateAsync,
        updateCustomer: (id: string, data: Record<string, unknown>) => updateCustomerMutation.mutateAsync({ id, data }),
        deleteCustomer: deleteCustomerMutation.mutateAsync,
        getCustomerById,
        isLoading,
        isLoadingCreate: createCustomerMutation.isPending,
        isLoadingUpdate: updateCustomerMutation.isPending,
        isLoadingDelete: deleteCustomerMutation.isPending,
        error: error?.message || null,
    };
};
