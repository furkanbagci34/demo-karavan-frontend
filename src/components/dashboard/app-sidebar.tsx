"use client";

import * as React from "react";

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
import { getFilteredMenus } from "@/lib/menu-manager";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LogoFull, LogoIcon } from "./logo";

export function AppSidebar() {
    const { user } = useAuth();
    const pathname = usePathname();
    const { state } = useSidebar();

    // Yol adına göre aktif durumları güncelle
    const menuWithActiveState = React.useMemo(() => {
        // Kullanıcının izinli olduğu menüleri al
        const menus = getFilteredMenus(user?.allowed_menus);

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
    }, [pathname, user?.allowed_menus]);

    // Temel kullanıcı bilgileri

    if (!user) return null;

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <div
                    className={
                        state === "expanded"
                            ? "px-4 py-2 flex items-center justify-between"
                            : "px-4 py-2 flex items-center justify-center"
                    }
                >
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
