import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { User } from "@/types/user";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

type LoginCredentials = {
    [key: string]: unknown;
    email: string;
    password: string;
};

type RegisterData = {
    [key: string]: unknown;
    email: string;
    password: string;
    name: string;
    surname: string;
};

export const useAuth = () => {
    const { data: user, isLoading } = useQuery({
        queryKey: ["user"],
        queryFn: async () => {
            try {
                // Token kontrolü
                const token = Cookies.get("token");
                if (!token) {
                    return null;
                }

                // Profil bilgilerini al
                const user = await apiClient.get<User>(API_ENDPOINTS.users.profile);
                return user;
            } catch {
                // Hata durumunda token'ı temizle
                Cookies.remove("token");
                return null;
            }
        },
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 dakika
    });

    return {
        user,
        loading: isLoading,
    };
};

export const useLogin = (options?: { onSuccess?: () => void; onError?: (error: unknown) => void }) => {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: async (credentials: LoginCredentials) => {
            const response = await apiClient.post<{ token: string }>(API_ENDPOINTS.users.login, credentials);
            return response;
        },
        onSuccess: async (data) => {
            Cookies.set("token", data.token, { expires: 7 });

            try {
                const user = await apiClient.get<User>(API_ENDPOINTS.users.profile);
                queryClient.setQueryData(["user"], user);

                // Kullanıcının menülerini cookie'ye kaydet
                if (user.allowed_menus && user.allowed_menus.length > 0) {
                    Cookies.set("allowed_menus", JSON.stringify(user.allowed_menus), { expires: 7 });
                } else {
                    // Admin veya sınırsız erişim - boş array kaydet
                    Cookies.set("allowed_menus", JSON.stringify([]), { expires: 7 });
                }

                // Default page varsa kaydet
                if (user.default_page) {
                    router.push(user.default_page);
                } else {
                    router.push("/dashboard");
                }

                options?.onSuccess?.();
            } catch (error) {
                console.error("Kullanıcı bilgileri alınamadı:", error);

                Cookies.remove("token");
                Cookies.remove("allowed_menus");
                options?.onError?.(error);
            }
        },
        onError: (error) => {
            options?.onError?.(error);
        },
    });
};

export const useRegister = (options?: { onError?: (error: unknown) => void }) => {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: async (data: RegisterData) => {
            const response = await apiClient.post<{ token: string; message: string; userId: number }>(
                API_ENDPOINTS.users.register,
                data
            );
            return response;
        },
        onSuccess: async (data) => {
            Cookies.set("token", data.token, { expires: 7 });

            try {
                const user = await apiClient.get<User>(API_ENDPOINTS.users.profile);
                queryClient.setQueryData(["user"], user);

                // Kullanıcının menülerini cookie'ye kaydet
                if (user.allowed_menus && user.allowed_menus.length > 0) {
                    Cookies.set("allowed_menus", JSON.stringify(user.allowed_menus), { expires: 7 });
                } else {
                    // Admin veya sınırsız erişim - boş array kaydet
                    Cookies.set("allowed_menus", JSON.stringify([]), { expires: 7 });
                }
            } catch (error) {
                console.error("Kullanıcı bilgileri alınamadı:", error);
            }

            // Default page varsa oraya git
            const user = queryClient.getQueryData<User>(["user"]);
            if (user?.default_page) {
                router.push(user.default_page);
            } else {
                router.push("/dashboard");
            }
        },
        onError: (error) => {
            options?.onError?.(error);
        },
    });
};

export const useLogout = () => {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: async () => {
            await apiClient.post(API_ENDPOINTS.users.logout);
        },
        onSuccess: () => {
            // Token ve menüleri sil
            Cookies.remove("token");
            Cookies.remove("allowed_menus");
            // User state'ini temizle
            queryClient.setQueryData(["user"], null);
            // Login sayfasına yönlendir
            router.push("/login");
        },
    });
};

export const useCurrentUser = () => {
    return useQuery({
        queryKey: ["currentUser"],
        queryFn: async () => {
            return await apiClient.get<User>(API_ENDPOINTS.users.profile);
        },
    });
};

export const useProfile = () => {
    return useQuery({
        queryKey: ["profile"],
        queryFn: async () => {
            return await apiClient.get<User>(API_ENDPOINTS.users.profile);
        },
    });
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, data }: { userId: string; data: Partial<User> }) =>
            apiClient.put<User>(API_ENDPOINTS.users.update(userId), data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["profile"] });
        },
    });
};
