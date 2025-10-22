import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { User, UsersResponse, ApiResponse } from "@/lib/api/types";

export interface UsersQueryParams {
    page?: number;
    limit?: number;
    search?: string;
}

export type CreateUserData = {
    name: string;
    surname: string;
    email: string;
    password: string;
    phoneNumber?: string;
    role?: "admin" | "user";
    allowedMenus?: string[];
    defaultPage?: string;
} & Record<string, unknown>;

export type UpdateUserData = {
    name?: string;
    surname?: string;
    email?: string;
    password?: string;
    phoneNumber?: string;
    isActive?: boolean;
    role?: "admin" | "user";
    allowedMenus?: string[];
    defaultPage?: string;
} & Record<string, unknown>;

export const useUsers = (params: UsersQueryParams = {}) => {
    const queryClient = useQueryClient();
    const { page = 1, limit = 10, search = "" } = params;

    // Kullanıcıları getir (sayfalama ve arama ile)
    const { data: usersResponse, isLoading } = useQuery({
        queryKey: ["users", { page, limit, search }],
        queryFn: async (): Promise<UsersResponse> => {
            const searchParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            if (search.trim()) {
                searchParams.append("search", search.trim());
            }

            const response = await apiClient.get<UsersResponse>(
                `${API_ENDPOINTS.users.getAll}?${searchParams.toString()}`
            );
            return response;
        },
        staleTime: 30 * 1000, // 30 saniye cache
        refetchOnWindowFocus: false,
    });

    // Tekil kullanıcı getir
    const useUser = (id: string) => {
        return useQuery({
            queryKey: ["user", id],
            queryFn: async (): Promise<User> => {
                const response = await apiClient.get<User>(API_ENDPOINTS.users.getById(id));
                return response;
            },
            enabled: !!id,
            staleTime: 5 * 60 * 1000, // 5 dakika cache
        });
    };

    // Kullanıcı güncelle
    const updateUserMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateUserData }): Promise<ApiResponse<User>> => {
            const response = await apiClient.put<ApiResponse<User>>(API_ENDPOINTS.users.update(id), data);
            return response;
        },
        onSuccess: () => {
            // Kullanıcı listesini ve detayını yenile
            queryClient.invalidateQueries({ queryKey: ["users"] });
            queryClient.invalidateQueries({ queryKey: ["user"] });
        },
    });

    // Kullanıcı sil
    const deleteUserMutation = useMutation({
        mutationFn: async (id: string): Promise<ApiResponse<{ message: string }>> => {
            const response = await apiClient.delete<ApiResponse<{ message: string }>>(API_ENDPOINTS.users.delete(id));
            return response;
        },
        onSuccess: () => {
            // Kullanıcı listesini yenile
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });

    // Kullanıcı oluştur
    const createUserMutation = useMutation({
        mutationFn: async (data: CreateUserData): Promise<ApiResponse<User>> => {
            const response = await apiClient.post<ApiResponse<User>>(API_ENDPOINTS.users.register, data);
            return response;
        },
        onSuccess: () => {
            // Kullanıcı listesini yenile
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });

    return {
        // Data
        users: usersResponse?.data || [],
        totalCount: usersResponse?.totalCount || 0,
        totalPages: usersResponse?.totalPages || 0,
        currentPage: usersResponse?.currentPage || 1,
        hasNextPage: usersResponse?.hasNextPage || false,
        hasPreviousPage: usersResponse?.hasPreviousPage || false,

        // Loading states
        isLoading,

        // Mutations
        createUser: createUserMutation.mutate,
        updateUser: updateUserMutation.mutate,
        deleteUser: deleteUserMutation.mutate,
        isCreating: createUserMutation.isPending,
        isUpdating: updateUserMutation.isPending,
        isDeleting: deleteUserMutation.isPending,

        // Helpers
        useUser,
    };
};
