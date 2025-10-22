import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_PAGES = ["/login", "/register"];
const PUBLIC_PAGES = ["/offer-detail", "/unauthorized"];

const isAuthPage = (path: string) => AUTH_PAGES.some((p) => path.startsWith(p));
const isPublicPage = (path: string) => PUBLIC_PAGES.some((p) => path.startsWith(p));

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get("token")?.value;

    // Token yoksa ve auth sayfası DEĞİLSE ve public sayfa DEĞİLSE login'e yönlendir
    if (!token && !isAuthPage(pathname) && !isPublicPage(pathname)) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (token && isAuthPage(pathname)) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // Token varsa ve public sayfa değilse, menü yetkilerini kontrol et
    if (token && !isAuthPage(pathname) && !isPublicPage(pathname)) {
        const allowedMenusCookie = request.cookies.get("allowed_menus")?.value;

        if (allowedMenusCookie) {
            try {
                const allowedMenus: string[] = JSON.parse(allowedMenusCookie);

                // Boş array ise (admin gibi) tüm erişimlere izin ver
                if (allowedMenus.length > 0) {
                    const hasAccess = checkUrlAccess(pathname, allowedMenus);

                    if (!hasAccess) {
                        return NextResponse.redirect(new URL("/unauthorized", request.url));
                    }
                }
            } catch (error) {
                console.error("[Middleware] Failed to parse allowed_menus cookie:", error);
            }
        }
    }

    return NextResponse.next();
}

/**
 * URL'in erişim yetkisi olup olmadığını kontrol eder
 */
function checkUrlAccess(url: string, allowedMenuIds: string[]): boolean {
    // Ana dizin - dashboard yetkisi olan kullanıcılar erişebilir
    if (url === "/") {
        return allowedMenuIds.includes("dashboard");
    }

    // Dashboard
    if (url === "/dashboard" || url.startsWith("/dashboard/")) {
        return allowedMenuIds.includes("dashboard");
    }

    // Customers
    if (url === "/customer" || url.startsWith("/customer/")) {
        return allowedMenuIds.includes("customers");
    }

    // Products
    if (url === "/product" || url.startsWith("/product/")) {
        return allowedMenuIds.includes("products");
    }

    // Offers
    if (url === "/offer" || url.startsWith("/offer/")) {
        return allowedMenuIds.includes("offers");
    }

    // Warehouses
    if (url === "/warehouse" || url.startsWith("/warehouse/")) {
        return allowedMenuIds.includes("warehouses");
    }

    // Vehicles (includes vehicle-acceptance)
    if (url === "/vehicle" || url.startsWith("/vehicle/")) {
        return allowedMenuIds.includes("vehicles");
    }

    if (url === "/vehicle-acceptance" || url.startsWith("/vehicle-acceptance/")) {
        return allowedMenuIds.includes("vehicles");
    }

    // Production
    if (url === "/production" || url.startsWith("/production/")) {
        return allowedMenuIds.includes("production");
    }

    if (url === "/production-execution" || url.startsWith("/production-execution/")) {
        return allowedMenuIds.includes("production");
    }

    if (url === "/production-templates" || url.startsWith("/production-templates/")) {
        return allowedMenuIds.includes("production");
    }

    // Stations
    if (url === "/stations" || url.startsWith("/stations/")) {
        return allowedMenuIds.includes("production");
    }

    // Operations
    if (url === "/operations" || url.startsWith("/operations/")) {
        return allowedMenuIds.includes("production");
    }

    // Users
    if (url === "/users" || url.startsWith("/users/")) {
        return allowedMenuIds.includes("users");
    }

    // Reports
    if (url === "/reports" || url.startsWith("/reports/")) {
        return allowedMenuIds.includes("reports");
    }

    // Account (herkes kendi hesabına erişebilir)
    if (url === "/account" || url.startsWith("/account/")) {
        return true;
    }

    // Account (herkes kendi hesabına erişebilir)
    if (url === "/quality-control" || url.startsWith("/quality-control/")) {
        return true;
    }

    // Menüde tanımlı olmayan bir sayfa - erişime izin verme
    return false;
}

// Middleware'in çalışacağı yolları belirt
export const config = {
    matcher: [
        // Public dosyalar ve API rotaları için middleware çalışmaz
        "/((?!api|_next/static|_next/image|fumagpt.ico|images).*)",
    ],
};
