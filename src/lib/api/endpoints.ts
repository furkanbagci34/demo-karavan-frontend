export const API_ENDPOINTS = {
    users: {
        register: "/api/users/register",
        login: "/api/users/login",
        logout: "/api/users/logout",
        profile: "/api/users/profile",
        update: (userId: string) => `/api/users/${userId}`,
    },
} as const;
