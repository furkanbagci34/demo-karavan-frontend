"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from "@/components/ui/sidebar";

interface MenuItem {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
        title: string;
        url: string;
        isActive?: boolean;
    }[];
}

interface MenuGroup {
    group: string;
    items: MenuItem[];
}

export function NavMain({ menuGroups }: { menuGroups: MenuGroup[] }) {
    const { isMobile, setOpenMobile } = useSidebar();

    // Mobil görünümde menü sekmelerine tıklandığında menüyü kapat
    const handleMobileNavigation = () => {
        if (isMobile) {
            setOpenMobile(false);
        }
    };

    return (
        <>
            {menuGroups.map((menuGroup) => (
                <SidebarGroup key={menuGroup.group}>
                    <SidebarGroupLabel>{menuGroup.group}</SidebarGroupLabel>
                    <SidebarMenu>
                        {menuGroup.items.map((item) =>
                            item.items && item.items.length > 0 ? (
                                <Collapsible key={item.title} asChild defaultOpen={true} className="group/collapsible">
                                    <SidebarMenuItem>
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton
                                                tooltip={item.title}
                                                className={cn(item.isActive && "text-primary font-medium")}
                                            >
                                                {item.icon && <item.icon />}
                                                <span className="font-bold">{item.title}</span>
                                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {item.items?.map((subItem) => (
                                                    <SidebarMenuSubItem key={subItem.title}>
                                                        <SidebarMenuSubButton
                                                            asChild
                                                            className={cn(
                                                                subItem.isActive && "bg-muted text-primary font-medium"
                                                            )}
                                                        >
                                                            <Link
                                                                href={subItem.url}
                                                                className="w-full"
                                                                onClick={handleMobileNavigation}
                                                            >
                                                                <span>{subItem.title}</span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </SidebarMenuItem>
                                </Collapsible>
                            ) : (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        tooltip={item.title}
                                        className={cn(item.isActive && "text-primary font-medium")}
                                    >
                                        <Link
                                            href={item.url}
                                            className="w-full flex items-center"
                                            onClick={handleMobileNavigation}
                                        >
                                            {item.icon && <item.icon className="h-4 w-4" />}
                                            <span className="font-bold">{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )
                        )}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </>
    );
}
