import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { API_ENDPOINTS } from "./endpoints";
import { ApiError } from "./types";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.fumagpt.com";

type RequestData = Record<string, unknown>;

class ApiClient {
    private client: AxiosInstance;
    private static instance: ApiClient;

    private constructor() {
        this.client = axios.create({
            baseURL: API_URL,
            headers: {
                "Content-Type": "application/json",
            },
        });

        this.setupInterceptors();
    }

    public static getInstance(): ApiClient {
        if (!ApiClient.instance) {
            ApiClient.instance = new ApiClient();
        }
        return ApiClient.instance;
    }

    private saveToken(token: string): void {
        try {
            Cookies.set("token", token, { expires: 7 });
        } catch (e) {
            console.error("Token kaydedilirken hata oluştu:", e);
        }
    }

    private clearToken(): void {
        try {
            Cookies.remove("token");
        } catch (e) {
            console.error("Token temizlenirken hata oluştu:", e);
        }
    }

    private getToken(): string | null {
        try {
            return Cookies.get("token") || null;
        } catch (e) {
            console.error("Token alınırken hata oluştu:", e);
            return null;
        }
    }

    private setupInterceptors() {
        // Request interceptor
        this.client.interceptors.request.use(
            (config) => {
                const token = this.getToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor
        this.client.interceptors.response.use(
            (response) => response,
            async (error: AxiosError<ApiError>) => {
                if (error.response?.status === 401) {
                    try {
                        const refreshToken = Cookies.get("refreshToken");
                        if (refreshToken) {
                            const response = await this.client.post(API_ENDPOINTS.users.login, { refreshToken });
                            this.saveToken(response.data.token);
                            error.config!.headers.Authorization = `Bearer ${response.data.token}`;
                            return this.client(error.config!);
                        }
                    } catch {
                        this.clearToken();
                        window.location.href = "/login";
                    }
                }
                return Promise.reject(error);
            }
        );
    }

    public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response = await this.client.get<T>(url, config);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    public async post<T>(url: string, data?: RequestData, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response = await this.client.post<T>(url, data, config);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    public async put<T>(url: string, data?: RequestData, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response = await this.client.put<T>(url, data, config);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response = await this.client.delete<T>(url, config);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    private handleError(error: unknown): ApiError {
        if (axios.isAxiosError(error)) {
            return {
                message: error.response?.data?.message || "Bir hata oluştu",
                status: error.response?.status || 500,
                errors: error.response?.data?.errors,
            };
        }
        return {
            message: "Beklenmeyen bir hata oluştu",
            status: 500,
        };
    }
}

export const apiClient = ApiClient.getInstance();
