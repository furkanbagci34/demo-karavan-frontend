import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { Product, CreateProductData, UpdateProductData, ApiResponse } from "@/lib/api/types";

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
    const getProductById = async (id: string): Promise<Product> => {
        const response = await apiClient.get<Product>(API_ENDPOINTS.products.getById(id));
        return response;
    };

    return {
        products,
        createProduct: createProductMutation.mutateAsync,
        updateProduct: (id: string, data: UpdateProductData) => updateProductMutation.mutateAsync({ id, data }),
        deleteProduct: deleteProductMutation.mutateAsync,
        getProductById,
        isLoading,
        isLoadingCreate: createProductMutation.isPending,
        isLoadingUpdate: updateProductMutation.isPending,
        isLoadingDelete: deleteProductMutation.isPending,
        error: error?.message || null,
    };
};
