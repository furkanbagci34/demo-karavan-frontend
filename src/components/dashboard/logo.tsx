"use client";

import { cn } from "@/lib/utils";

export function LogoFull({ className }: { className?: string }) {
    return (
        <svg
            width="140"
            height="32"
            viewBox="0 0 140 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn("h-8 w-auto", className)}
        >
            <rect width="32" height="32" rx="8" fill="currentColor" className="text-primary" />
            <path d="M8 8H24V12H12V14H20V18H12V24H8V8Z" fill="white" />
            <text x="40" y="22" className="text-xl font-bold" fill="currentColor">
                FumaGPT
            </text>
        </svg>
    );
}

export function LogoIcon({ className }: { className?: string }) {
    return (
        <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn("h-8 w-8", className)}
            style={{ minWidth: "32px" }}
        >
            <rect width="32" height="32" rx="8" fill="currentColor" className="text-primary" />
            <path d="M8 8H24V12H12V14H20V18H12V24H8V8Z" fill="white" />
        </svg>
    );
}
