"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

export function LogoFull({ className }: { className?: string }) {
    return (
        <div className={cn("h-10 w-auto flex items-center", className)}>
            <Image src="/images/lovasoftware-logo-yatay.png" alt="LovaSoftware" width={300} height={60} priority />
        </div>
    );
}

export function LogoIcon({ className }: { className?: string }) {
    return (
        <div className={cn("h-8 w-8 flex items-center justify-center", className)} style={{ minWidth: "32px" }}>
            <Image
                src="/images/lovasoftware-icon.png"
                alt="LovaSoftware"
                width={32}
                height={32}
                className="h-8 w-8"
                priority
            />
        </div>
    );
}
