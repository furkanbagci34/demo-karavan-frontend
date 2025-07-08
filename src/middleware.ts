import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_PAGES = ["/login", "/register"];

const isAuthPage = (path: string) => AUTH_PAGES.some((p) => path.startsWith(p));

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get("token")?.value;

    // Token yoksa ve auth sayfası DEĞİLSE login'e yönlendir
    if (!token && !isAuthPage(pathname)) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Token varsa ve auth sayfasına erişmeye çalışıyorsa ana sayfaya (/) yönlendir
    if (token && isAuthPage(pathname)) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

// Middleware'in çalışacağı yolları belirt
export const config = {
    matcher: [
        // Public dosyalar ve API rotaları için middleware çalışmaz
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
