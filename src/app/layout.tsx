import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import "@/styles/globals.css";
import { ClientProviders } from "@/providers/client-providers";

const geistSans = Geist({
    subsets: ["latin"],
    variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
    subsets: ["latin"],
    variable: "--font-geist-mono",
});

export const metadata: Metadata = {
    title: "MefSystem Karavan",
    description: "MefSystem Karavan Yönetim Paneli",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="tr" className={`${geistSans.variable} ${geistMono.variable}`}>
            <body className="antialiased">
                <ClientProviders>{children}</ClientProviders>
            </body>
        </html>
    );
}
