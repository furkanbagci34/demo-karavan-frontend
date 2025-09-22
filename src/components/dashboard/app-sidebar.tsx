"use client";

import * as React from "react";
import { type LucideIcon, Newspaper, House, Users, FileText, Factory, Car, Warehouse } from "lucide-react";

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
        group: "Menü",
        items: [
            {
                title: "Anasayfa",
                url: "/dashboard",
                icon: House,
            },
            {
                title: "Müşteriler",
                url: "/customer",
                icon: Users,
                items: [
                    {
                        title: "Müşteri Listesi",
                        url: "/customer",
                    },
                ],
            },
            {
                title: "Ürünler",
                url: "/product",
                icon: Newspaper,
                items: [
                    {
                        title: "Ürün Listesi",
                        url: "/product",
                    },
                    {
                        title: "Ürün Stok Durumu",
                        url: "/product/stock",
                    },
                ],
            },
            {
                title: "Teklifler",
                url: "/offer",
                icon: FileText,
                items: [
                    {
                        title: "Teklif Listesi",
                        url: "/offer",
                    },
                ],
            },
            {
                title: "Depolar",
                url: "/warehouse",
                icon: Warehouse,
                items: [
                    {
                        title: "Depo Listesi",
                        url: "/warehouse",
                    },
                ],
            },
            {
                title: "Araçlar",
                url: "/vehicle",
                icon: Car,
                items: [
                    {
                        title: "Araç Listesi",
                        url: "/vehicle",
                    },
                    {
                        title: "Araç Parçaları",
                        url: "/vehicle/parts",
                    },
                    {
                        title: "Araç Kabul",
                        url: "/vehicle-acceptance",
                    },
                ],
            },
            {
                title: "Üretim",
                url: "/production",
                icon: Factory,
                items: [
                    {
                        title: "Üretim Ekranı",
                        url: "/production",
                    },
                    {
                        title: "Üretim Şablonu",
                        url: "/production-templates",
                    },
                    {
                        title: "İstasyonlar",
                        url: "/stations",
                    },
                    {
                        title: "Operasyonlar",
                        url: "/operations",
                    },
                ],
            },
            {
                title: "Kullanıcılar",
                url: "/users",
                icon: Users,
            },
        ],
    },
];

// Normal kullanıcılar için kullanılacak menüler
const userMenus: MenuGroup[] = [
    {
        group: "Menü",
        items: [
            {
                title: "Anasayfa",
                url: "/dashboard",
                icon: House,
            },
            {
                title: "Müşteriler",
                url: "/customer",
                icon: Users,
                items: [
                    {
                        title: "Müşteri Listesi",
                        url: "/customer",
                    },
                ],
            },
            {
                title: "Ürünler",
                url: "/product",
                icon: Newspaper,
                items: [
                    {
                        title: "Ürün Listesi",
                        url: "/product",
                    },
                    {
                        title: "Ürün Stok Durumu",
                        url: "/product/stock",
                    },
                ],
            },
            {
                title: "Teklifler",
                url: "/offer",
                icon: FileText,
                items: [
                    {
                        title: "Teklif Listesi",
                        url: "/offer",
                    },
                ],
            },
            {
                title: "Depolar",
                url: "/warehouse",
                icon: Warehouse,
                items: [
                    {
                        title: "Depo Listesi",
                        url: "/warehouse",
                    },
                ],
            },
            {
                title: "Araçlar",
                url: "/vehicle",
                icon: Car,
                items: [
                    {
                        title: "Araç Listesi",
                        url: "/vehicle",
                    },
                    {
                        title: "Araç Parçaları",
                        url: "/vehicle/parts",
                    },
                    {
                        title: "Araç Kabul",
                        url: "/vehicle-acceptance",
                    },
                ],
            },
            {
                title: "Üretim",
                url: "/production",
                icon: Factory,
                items: [
                    {
                        title: "Üretim Ekranı",
                        url: "/production",
                    },
                    {
                        title: "Üretim Şablonu",
                        url: "/production-templates",
                    },
                    {
                        title: "İstasyonlar",
                        url: "/stations",
                    },
                    {
                        title: "Operasyonlar",
                        url: "/operations",
                    },
                ],
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
                <div className="px-4 py-2 flex items-center justify-between">
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
