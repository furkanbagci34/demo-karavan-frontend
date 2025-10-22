import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import {
    Product,
    CreateProductData,
    UpdateProductData,
    ApiResponse,
    ProductStockStatus,
    GroupedProductStock,
    UpdateStockQuantityData,
} from "@/lib/api/types";

export const useProducts = () => {
    const queryClient = useQueryClient();

    // Ürünleri getir (React Query ile cache'le)
    const {
        data: products = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ["products"],
        queryFn: async (): Promise<Product[]> => {
            const response = await apiClient.get<Product[]>(API_ENDPOINTS.products.getAll);
            return response;
        },
        staleTime: 30 * 1000, // 30 saniye cache
        refetchOnWindowFocus: false,
    });

    // Ürün oluştur
    const createProductMutation = useMutation({
        mutationFn: async (data: CreateProductData): Promise<ApiResponse<{ productId: number }>> => {
            const backendData = {
                name: data.name,
                code: data.code,
                purchasePrice: data.purchasePrice,
                salePrice: data.salePrice,
                distributorPrice: data.distributorPrice,
                stockQuantity: data.stockQuantity,
                description: data.description,
                image: data.image,
                unit: data.unit,
                isActive: data.isActive,
            };

            const response = await apiClient.post<ApiResponse<{ productId: number }>>(
                API_ENDPOINTS.products.create,
                backendData
            );

            return response;
        },
        onSuccess: () => {
            // Ürün listesini yenile
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
    });

    // Ürün güncelle
    const updateProductMutation = useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: string;
            data: UpdateProductData;
        }): Promise<ApiResponse<{ product: Product }>> => {
            const response = await apiClient.put<ApiResponse<{ product: Product }>>(
                API_ENDPOINTS.products.update(id),
                data as Record<string, unknown>
            );

            return response;
        },
        onSuccess: () => {
            // Ürün listesini yenile
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
    });

    // Ürün sil
    const deleteProductMutation = useMutation({
        mutationFn: async (id: string): Promise<ApiResponse<{ message: string }>> => {
            const response = await apiClient.delete<ApiResponse<{ message: string }>>(
                API_ENDPOINTS.products.delete(id)
            );

            return response;
        },
        onSuccess: () => {
            // Ürün listesini yenile
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
    });

    // Tekil ürün getir
    const getProductById = useCallback(async (id: string): Promise<Product> => {
        const response = await apiClient.get<Product>(API_ENDPOINTS.products.getById(id));
        return response;
    }, []);

    const updateProductStockQuantity = async (
        id: string,
        quantity: number
    ): Promise<ApiResponse<{ message: string }>> => {
        const response = await apiClient.put<ApiResponse<{ message: string }>>(
            API_ENDPOINTS.products.updateStockQuantity(id),
            { quantity }
        );
        return response;
    };

    // Depo bazlı stok durumlarını getir
    const {
        data: stockStatuses = [],
        isLoading: isLoadingStockStatuses,
        error: stockStatusError,
    } = useQuery({
        queryKey: ["product-stock-statuses"],
        queryFn: async (): Promise<ProductStockStatus[]> => {
            const response = await apiClient.get<ProductStockStatus[]>(API_ENDPOINTS.products.getStockStatusAll);
            return response;
        },
        staleTime: 30 * 1000,
        refetchOnWindowFocus: false,
    });

    // Stok verilerini ürün bazında grupla
    const groupedStockData = useMemo((): GroupedProductStock[] => {
        const grouped = stockStatuses.reduce((acc, status) => {
            const key = status.id;
            if (!acc[key]) {
                acc[key] = {
                    productId: status.id,
                    productName: status.name,
                    productCode: status.code || undefined,
                    productImage: status.image || undefined,
                    warehouses: [],
                };
            }
            acc[key].warehouses.push({
                warehouseId: status.warehouse_id,
                warehouseName: status.warehouse_name,
                quantity: status.stock_quantity,
            });
            return acc;
        }, {} as Record<number, GroupedProductStock>);

        return Object.values(grouped);
    }, [stockStatuses]);

    // Depo bazlı stok güncelleme
    const updateProductStockQuantityMutation = useMutation({
        mutationFn: async ({
            productId,
            data,
        }: {
            productId: string;
            data: UpdateStockQuantityData;
        }): Promise<ApiResponse<{ message: string }>> => {
            const response = await apiClient.put<ApiResponse<{ message: string }>>(
                API_ENDPOINTS.products.updateStockQuantity(productId),
                data as Record<string, unknown>
            );
            return response;
        },
        onSuccess: () => {
            // Stok durumlarını yenile
            queryClient.invalidateQueries({ queryKey: ["product-stock-statuses"] });
        },
    });

    const updateWarehouseStock = useCallback(
        async (productId: string, data: UpdateStockQuantityData): Promise<ApiResponse<{ message: string }>> => {
            return updateProductStockQuantityMutation.mutateAsync({ productId, data });
        },
        [updateProductStockQuantityMutation]
    );

    return {
        products,
        createProduct: createProductMutation.mutateAsync,
        updateProduct: (id: string, data: UpdateProductData) => updateProductMutation.mutateAsync({ id, data }),
        deleteProduct: deleteProductMutation.mutateAsync,
        getProductById,
        updateProductStockQuantity,
        // Yeni depo bazlı stok fonksiyonları
        stockStatuses,
        groupedStockData,
        updateWarehouseStock,
        isLoading,
        isLoadingCreate: createProductMutation.isPending,
        isLoadingUpdate: updateProductMutation.isPending,
        isLoadingDelete: deleteProductMutation.isPending,
        isLoadingStockStatuses,
        isLoadingStockUpdate: updateProductStockQuantityMutation.isPending,
        error: error?.message || null,
        stockStatusError: stockStatusError?.message || null,
    };
};

