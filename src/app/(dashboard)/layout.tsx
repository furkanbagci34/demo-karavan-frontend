"use client";

import { ReactNode } from "react";
import { useAuth } from "@/hooks/api/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    // Sadece kimlik doğrulama uygun değilse yönlendir
    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [loading, user, router]);

    // Yükleme durumunda iskelet göster
    if (loading) {
        return (
            <div className="w-full min-h-screen flex flex-col">
                <main className="flex-1 container mx-auto px-4 py-8">
                    <div className="space-y-6">
                        <Skeleton className="h-10 w-40" />
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-32 rounded-lg" />
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // Kullanıcı giriş yapmışsa, sidebar düzeni ile içeriği göster
    return (
        <SidebarProvider>
            <div className="flex w-full min-h-screen h-full">
                <AppSidebar />
                <SidebarInset className="flex-1 min-h-screen">
                    <div className="flex flex-col h-full min-h-screen">
                        {/* Mobil menü butonu */}
                        <div className="md:hidden flex items-center p-4 border-b bg-white no-print">
                            <SidebarTrigger className="h-9 w-9 p-0" />
                            <span className="ml-3 font-semibold text-lg">Dashboard</span>
                        </div>
                        {children}
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
