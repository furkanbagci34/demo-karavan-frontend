import { ReactNode } from "react";
import { AuthCarousel } from "@/components/auth/auth-carousel";

interface AuthLayoutProps {
    children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            <div className="bg-muted/30 relative hidden lg:block">
                <div className="absolute inset-0 bg-gradient-to-t from-background/10 to-background/5 backdrop-blur-[2px]" />
                <AuthCarousel />
            </div>
            <div className="relative flex flex-col items-center justify-center px-6 md:px-10">
                <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:16px_16px]" />
                <div className="relative w-full max-w-[440px] overflow-hidden">{children}</div>
            </div>
        </div>
    );
}
