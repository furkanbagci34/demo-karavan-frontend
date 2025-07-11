"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export interface DashboardSummary {
    totalCustomers: number;
    totalOffers: number;
    totalProducts: number;
    totalRevenue: number;
}

export interface MonthlyRevenue {
    month: string;
    revenue: number;
}

export interface TopProduct {
    product_name: string;
    order_count: number;
    total_revenue: number;
}

export interface RecentOffer {
    id: number;
    total_amount: number;
    status: string;
    created_at: string;
    customer_name: string;
}

export interface CustomerActivity {
    customer_name: string;
    offer_count: number;
    total_spent: number;
    last_activity: string;
}

export interface OfferStatusDistribution {
    status: string;
    count: number;
    percentage: number;
}

export function useDashboardSummary() {
    const {
        data: summary = null,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["dashboard", "summary"],
        queryFn: async (): Promise<DashboardSummary> => {
            const response = await apiClient.get<DashboardSummary>(API_ENDPOINTS.dashboard.summary);
            return response;
        },
        staleTime: 30 * 1000, // 30 saniye cache
        refetchOnWindowFocus: false,
    });

    return {
        summary,
        isLoading,
        error: error?.message || null,
    };
}

export function useMonthlyRevenue() {
    const {
        data: monthlyRevenue = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ["dashboard", "monthly-revenue"],
        queryFn: async (): Promise<MonthlyRevenue[]> => {
            const response = await apiClient.get<MonthlyRevenue[]>(API_ENDPOINTS.dashboard.monthlyRevenue);
            return response;
        },
        staleTime: 5 * 60 * 1000, // 5 dakika cache
        refetchOnWindowFocus: false,
    });

    return {
        monthlyRevenue,
        isLoading,
        error: error?.message || null,
    };
}

export function useTopProducts() {
    const {
        data: topProducts = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ["dashboard", "top-products"],
        queryFn: async (): Promise<TopProduct[]> => {
            const response = await apiClient.get<TopProduct[]>(API_ENDPOINTS.dashboard.topProducts);
            return response;
        },
        staleTime: 5 * 60 * 1000, // 5 dakika cache
        refetchOnWindowFocus: false,
    });

    return {
        topProducts,
        isLoading,
        error: error?.message || null,
    };
}

export function useRecentOffers() {
    const {
        data: recentOffers = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ["dashboard", "recent-offers"],
        queryFn: async (): Promise<RecentOffer[]> => {
            const response = await apiClient.get<RecentOffer[]>(API_ENDPOINTS.dashboard.recentOffers);
            return response;
        },
        staleTime: 2 * 60 * 1000, // 2 dakika cache
        refetchOnWindowFocus: false,
    });

    return {
        recentOffers,
        isLoading,
        error: error?.message || null,
    };
}

export function useCustomerActivity() {
    const {
        data: customerActivity = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ["dashboard", "customer-activity"],
        queryFn: async (): Promise<CustomerActivity[]> => {
            const response = await apiClient.get<CustomerActivity[]>(API_ENDPOINTS.dashboard.customerActivity);
            return response;
        },
        staleTime: 5 * 60 * 1000, // 5 dakika cache
        refetchOnWindowFocus: false,
    });

    return {
        customerActivity,
        isLoading,
        error: error?.message || null,
    };
}

export function useOfferStatusDistribution() {
    const {
        data: offerStatusDistribution = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ["dashboard", "offer-status-distribution"],
        queryFn: async (): Promise<OfferStatusDistribution[]> => {
            const response = await apiClient.get<OfferStatusDistribution[]>(
                API_ENDPOINTS.dashboard.offerStatusDistribution
            );
            return response;
        },
        staleTime: 5 * 60 * 1000, // 5 dakika cache
        refetchOnWindowFocus: false,
    });

    return {
        offerStatusDistribution,
        isLoading,
        error: error?.message || null,
    };
}
