"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/api/useAuth";

export default function UnauthorizedPage() {
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        // Eğer kullanıcı yoksa login'e yönlendir
        if (!user) {
            router.push("/login");
        }
    }, [user, router]);

    const handleGoHome = () => {
        // Eğer kullanıcının default_page'i varsa oraya git, yoksa dashboard'a git
        const defaultPage = user?.default_page || "/dashboard";
        router.push(defaultPage);
    };

    const handleGoBack = () => {
        router.back();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
                <div className="mb-6 flex justify-center">
                    <div className="rounded-full bg-red-100 p-6">
                        <AlertCircle className="h-16 w-16 text-red-600" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-2">Erişim Reddedildi</h1>

                <p className="text-gray-600 mb-2">Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.</p>

                <p className="text-sm text-gray-500 mb-8">
                    Eğer bu sayfaya erişmeniz gerektiğini düşünüyorsanız, lütfen sistem yöneticinizle iletişime geçin.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={handleGoBack} variant="outline" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Geri Dön
                    </Button>

                    <Button onClick={handleGoHome} className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Ana Sayfaya Dön
                    </Button>
                </div>

                {user && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                            Giriş yapılmış kullanıcı:{" "}
                            <span className="font-medium">
                                {user.name} {user.surname}
                            </span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
