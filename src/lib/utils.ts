import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isValid } from "date-fns";
import { tr } from "date-fns/locale";

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
    return value.toLocaleString("tr-TR");
}
