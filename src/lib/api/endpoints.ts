export const API_ENDPOINTS = {
    users: {
        register: "/api/users/register",
        login: "/api/users/login",
        logout: "/api/users/logout",
        profile: "/api/users/profile",
        update: (userId: string) => `/api/users/${userId}`,
    },
    products: {
        create: "/api/products",
        getAll: "/api/products",
        getById: (id: string) => `/api/products/${id}`,
        update: (id: string) => `/api/products/${id}`,
        delete: (id: string) => `/api/products/${id}`,
    },
} as const;
