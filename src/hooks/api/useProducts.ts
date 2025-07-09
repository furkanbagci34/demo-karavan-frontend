import { useState } from "react";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { Product, CreateProductData, UpdateProductData, ApiResponse } from "@/lib/api/types";

export const useProducts = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createProduct = async (data: CreateProductData): Promise<ApiResponse<{ productId: number }>> => {
        setIsLoading(true);
        setError(null);

        try {
            // Backend'e gönderilecek veriyi dönüştür
            const backendData = {
                name: data.name,
                code: data.code,
                purchasePrice: data.purchasePrice,
                salePrice: data.salePrice,
                stockQuantity: data.stockQuantity,
                description: data.description,
                image: data.image,
                isActive: data.isActive,
            };

            const response = await apiClient.post<ApiResponse<{ productId: number }>>(
                API_ENDPOINTS.products.create,
                backendData
            );

            return response;
        } catch (err: any) {
            const errorMessage = err.message || "Ürün oluşturulurken bir hata oluştu";
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const getAllProducts = async (): Promise<Product[]> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await apiClient.get<Product[]>(API_ENDPOINTS.products.getAll);
            return response;
        } catch (err: any) {
            const errorMessage = err.message || "Ürünler yüklenirken bir hata oluştu";
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const getProductById = async (id: string): Promise<Product> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await apiClient.get<Product>(API_ENDPOINTS.products.getById(id));
            return response;
        } catch (err: any) {
            const errorMessage = err.message || "Ürün yüklenirken bir hata oluştu";
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const updateProduct = async (id: string, data: UpdateProductData): Promise<ApiResponse<{ product: Product }>> => {
        setIsLoading(true);
        setError(null);

        try {
            // Backend'e gönderilecek veriyi dönüştür
            const backendData = {
                name: data.name,
                code: data.code,
                purchasePrice: data.purchasePrice,
                salePrice: data.salePrice,
                stockQuantity: data.stockQuantity,
                description: data.description,
                image: data.image,
                isActive: data.isActive,
            };

            const response = await apiClient.put<ApiResponse<{ product: Product }>>(
                API_ENDPOINTS.products.update(id),
                backendData
            );

            return response;
        } catch (err: any) {
            const errorMessage = err.message || "Ürün güncellenirken bir hata oluştu";
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const deleteProduct = async (id: string): Promise<ApiResponse<{ message: string }>> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await apiClient.delete<ApiResponse<{ message: string }>>(
                API_ENDPOINTS.products.delete(id)
            );

            return response;
        } catch (err: any) {
            const errorMessage = err.message || "Ürün silinirken bir hata oluştu";
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        createProduct,
        getAllProducts,
        getProductById,
        updateProduct,
        deleteProduct,
        isLoading,
        error,
    };
};
