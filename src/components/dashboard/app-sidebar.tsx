"use client";

import * as React from "react";
import { Settings2, LayoutDashboard, type LucideIcon, Webhook } from "lucide-react";

import { NavMain } from "@/components/dashboard/nav-main";
import { NavUser } from "@/components/dashboard/nav-user";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/api/useAuth";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LogoFull, LogoIcon } from "./logo";

// Menü öğelerinin tiplerini tanımlayalım
interface SubMenuItem {
    title: string;
    url: string;
    isActive?: boolean;
}

interface MenuItem {
    title: string;
    url: string;
    icon: LucideIcon;
    items?: SubMenuItem[];
    isActive?: boolean;
}

interface MenuGroup {
    group: string;
    items: MenuItem[];
}

// Admin için kullanılacak menüler
const adminMenus: MenuGroup[] = [
    {
        group: "Panel",
        items: [
            {
                title: "Dashboard",
                url: "/dashboard",
                icon: LayoutDashboard,
                items: [
                    {
                        title: "Genel Bakış",
                        url: "/dashboard",
                    },
                    {
                        title: "Kullanıcılar",
                        url: "/users",
                    },
                ],
            },
            {
                title: "Sistem",
                url: "#",
                icon: Settings2,
                items: [
                    {
                        title: "Genel Ayarlar",
                        url: "/dashboard/settings",
                    },
                    {
                        title: "Ödeme Geçmişi",
                        url: "/dashboard/payment-history",
                    },
                ],
            },
        ],
    },
];

// Normal kullanıcılar için kullanılacak menüler
const userMenus: MenuGroup[] = [
    {
        group: "Panel",
        items: [
            {
                title: "Genel Bakış",
                url: "/dashboard",
                icon: LayoutDashboard,
            },
            {
                title: "Test Sayfası",
                url: "/my-apis",
                icon: Webhook,
            },
        ],
    },
];

export function AppSidebar() {
    const { user } = useAuth();
    const pathname = usePathname();
    const { state } = useSidebar();

    // Yol adına göre aktif durumları güncelle
    const menuWithActiveState = React.useMemo(() => {
        const menus = user?.role === "admin" ? adminMenus : userMenus;

        return menus.map((group) => ({
            ...group,
            items: group.items.map((item) => {
                const processedSubItems = item.items?.map((subItem) => ({
                    ...subItem,
                    isActive: subItem.isActive ?? pathname === subItem.url,
                }));

                const hasActiveChild = processedSubItems?.some((subItem) => subItem.isActive);

                return {
                    ...item,
                    isActive: item.isActive ?? hasActiveChild ?? (pathname.includes(item.url) && item.url !== "#"),
                    items: processedSubItems,
                };
            }),
        }));
    }, [pathname, user?.role]);

    // Temel kullanıcı bilgileri

    if (!user) return null;

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <div className="px-4 py-2">
                    <Link href="/dashboard" className="flex items-center justify-center">
                        {state === "expanded" ? <LogoFull /> : <LogoIcon />}
                    </Link>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <NavMain menuGroups={menuWithActiveState} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
