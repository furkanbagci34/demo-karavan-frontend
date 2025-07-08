"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/api/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading) {
            if (user) {
                router.push("/dashboard");
            } else {
                router.push("/login");
            }
        }
    }, [loading, user, router]);

    if (loading) {
        return (
            <div className="container mx-auto p-4">
                <Skeleton className="h-12 w-full mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-40" />
                    ))}
                </div>
            </div>
        );
    }

    return null;
}
