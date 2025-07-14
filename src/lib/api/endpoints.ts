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
    customers: {
        create: "/api/customers",
        getAll: "/api/customers",
        getById: (id: string) => `/api/customers/${id}`,
        update: (id: string) => `/api/customers/${id}`,
        delete: (id: string) => `/api/customers/${id}`,
    },
    offers: {
        getProducts: (search?: string) =>
            `/api/offers/products${search ? `?search=${encodeURIComponent(search)}` : ""}`,
        create: "/api/offers",
        getAll: "/api/offers",
        getById: (id: string) => `/api/offers/${id}`,
        update: (id: string) => `/api/offers/${id}`,
        delete: (id: string) => `/api/offers/${id}`,
    },
    vehicles: {
        create: "/api/vehicles",
        getAll: "/api/vehicles",
        getById: (id: string) => `/api/vehicles/${id}`,
        update: (id: string) => `/api/vehicles/${id}`,
        delete: (id: string) => `/api/vehicles/${id}`,
        // Vehicle Parts endpoints
        getParts: (vehicleId: string) => `/api/vehicles/${vehicleId}/parts`,
        addPart: (vehicleId: string) => `/api/vehicles/${vehicleId}/parts`,
        updatePart: (vehicleId: string, partId: string) => `/api/vehicles/${vehicleId}/parts/${partId}`,
        deletePart: (vehicleId: string, partId: string) => `/api/vehicles/${vehicleId}/parts/${partId}`,
        getPartById: (vehicleId: string, partId: string) => `/api/vehicles/${vehicleId}/parts/${partId}`,
    },
    dashboard: {
        summary: "/api/dashboard/summary",
        monthlyRevenue: "/api/dashboard/monthly-revenue",
        topProducts: "/api/dashboard/top-products",
        recentOffers: "/api/dashboard/recent-offers",
        customerActivity: "/api/dashboard/customer-activity",
        offerStatusDistribution: "/api/dashboard/offer-status-distribution",
    },
} as const;
