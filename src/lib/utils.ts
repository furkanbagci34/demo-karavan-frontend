import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isValid } from "date-fns";
import { tr } from "date-fns/locale";

// AxiosError için interface tanımı
interface AxiosErrorStructure {
    isAxiosError?: boolean;
    response?: {
        status?: number;
        data?: unknown;
    };
    message?: string;
}

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Tarihi formatlar (date-fns kullanarak)
 * @param dateString ISO formatında tarih string'i
 * @param formatString Format şekli (varsayılan: "d MMMM yyyy")
 * @returns Formatlanmış tarih (ör: 29 Mart 2025)
 */
export function formatDate(dateString: string, formatString: string = "d MMMM yyyy"): string {
    if (!dateString) return "-";

    try {
        const date = parseISO(dateString);
        if (!isValid(date)) return dateString;

        return format(date, formatString, { locale: tr });
    } catch {
        return dateString;
    }
}

/**
 * Tarihi kısa formatlar (date-fns kullanarak)
 * @param dateString ISO formatında tarih string'i
 * @returns Formatlanmış tarih (ör: 29.03.2025)
 */
export function formatShortDate(dateString: string): string {
    return formatDate(dateString, "dd.MM.yyyy");
}

/**
 * Sayıları formatlar (binlik ayraçlar ile)
 * @param value Formatlanacak sayı
 * @returns Formatlanmış sayı (ör: 1.000.000)
 */
export function formatNumber(value: number): string {
    if (value === null || value === undefined) return "-";

    // Türkçe formatında binlik ayracı nokta (.) ve ondalık ayracı virgül (,) olarak kullan
    // Minimum 2 ondalık basamak göster
    return value.toLocaleString("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

/**
 * Para miktarını formatlar (€ simgesi ile)
 * @param value Formatlanacak para miktarı
 * @returns Formatlanmış para (ör: 1.000,00 €)
 */
export function formatCurrency(value: number): string {
    if (value === null || value === undefined) return "-";

    // Euro formatında para formatı
    return (
        value.toLocaleString("tr-TR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }) + " €"
    );
}

/**
 * Enterprise Error Message Extraction Utility
 * Tüm error tiplerini handle eder: AxiosError, Error, string, unknown
 * @param error - Herhangi bir error instance
 * @param fallbackMessage - Default mesaj
 * @returns Kullanıcı dostu error mesajı
 */
export function getErrorMessage(
    error: unknown,
    fallbackMessage: string = "Bir hata oluştu, lütfen tekrar deneyin."
): string {
    // Null/undefined check
    if (!error) {
        return fallbackMessage;
    }

    // String error direkt döndür
    if (typeof error === "string") {
        return error;
    }

    // AxiosError handling - backend structured responses
    if (typeof error === "object" && error !== null && "isAxiosError" in error) {
        const axiosError = error as AxiosErrorStructure;

        // Backend'den gelen structured error response
        const responseData = axiosError.response?.data;
        if (responseData && typeof responseData === "object" && "message" in responseData) {
            const messageValue = (responseData as Record<string, unknown>).message;
            if (typeof messageValue === "string") {
                return messageValue;
            }
        }

        // Backend'den gelen error text
        if (axiosError.response?.data && typeof axiosError.response.data === "string") {
            return axiosError.response.data;
        }

        // HTTP status based messages
        if (axiosError.response?.status) {
            switch (axiosError.response.status) {
                case 400:
                    return "Geçersiz istek. Lütfen girdiğiniz bilgileri kontrol edin.";
                case 401:
                    return "Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.";
                case 403:
                    return "Bu işlem için yetkiniz yok.";
                case 404:
                    return "İstenen kaynak bulunamadı.";
                case 409:
                    return "Bu kayıt zaten mevcut.";
                case 422:
                    return "Girilen veriler geçersiz.";
                case 500:
                    return "Sunucu hatası oluştu. Lütfen tekrar deneyin.";
                default:
                    break;
            }
        }

        // AxiosError message as fallback
        if (axiosError.message) {
            return axiosError.message;
        }
    }

    // Standard Error instance
    if (error instanceof Error) {
        return error.message;
    }

    // Object with message property
    if (typeof error === "object" && error !== null && "message" in error) {
        const messageError = error as { message: unknown };
        if (typeof messageError.message === "string") {
            return messageError.message;
        }
    }

    // Fallback
    return fallbackMessage;
}
