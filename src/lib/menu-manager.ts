import { type LucideIcon } from "lucide-react";
import * as Icons from "lucide-react";
import menusData from "@/config/menus.json";

// Menü öğelerinin tiplerini tanımlayalım
export interface SubMenuItem {
    id: string;
    title: string;
    url: string;
    isActive?: boolean;
}

export interface MenuItem {
    id: string;
    title: string;
    url: string;
    icon: LucideIcon;
    items?: SubMenuItem[];
    isActive?: boolean;
}

export interface MenuGroup {
    group: string;
    items: MenuItem[];
}

interface MenuDataItem {
    id: string;
    title: string;
    url: string;
    icon: string;
    group: string;
    items: Array<{
        id: string;
        title: string;
        url: string;
    }>;
}

interface MenusData {
    menus: MenuDataItem[];
}

/**
 * Icon ismini alıp Lucide Icon bileşenini döndürür
 */
function getIconComponent(iconName: string): LucideIcon {
    const Icon = (Icons as any)[iconName];
    return Icon || Icons.FileQuestion; // Varsayılan icon
}

/**
 * JSON'dan tüm menüleri okur
 */
export function getAllMenus(): MenuGroup[] {
    const data = menusData as MenusData;
    const groupedMenus: { [key: string]: MenuItem[] } = {};

    data.menus.forEach((menu) => {
        if (!groupedMenus[menu.group]) {
            groupedMenus[menu.group] = [];
        }

        groupedMenus[menu.group].push({
            id: menu.id,
            title: menu.title,
            url: menu.url,
            icon: getIconComponent(menu.icon),
            items: menu.items.map((item) => ({
                id: item.id,
                title: item.title,
                url: item.url,
            })),
        });
    });

    return Object.entries(groupedMenus).map(([group, items]) => ({
        group,
        items,
    }));
}

/**
 * Kullanıcının izinli olduğu menüleri filtreler
 */
export function getFilteredMenus(allowedMenuIds?: string[]): MenuGroup[] {
    // Eğer allowedMenuIds yoksa veya boşsa tüm menüleri döndür (admin gibi)
    if (!allowedMenuIds || allowedMenuIds.length === 0) {
        return getAllMenus();
    }

    const allMenus = getAllMenus();
    const filteredGroups: MenuGroup[] = [];

    allMenus.forEach((group) => {
        const filteredItems: MenuItem[] = [];

        group.items.forEach((item) => {
            // Ana menü ID'si izin listesinde mi kontrol et
            if (allowedMenuIds.includes(item.id)) {
                // Alt menüleri de filtrele
                const filteredSubItems = item.items?.filter((subItem) => allowedMenuIds.includes(subItem.id));

                filteredItems.push({
                    ...item,
                    items: filteredSubItems,
                });
            }
        });

        if (filteredItems.length > 0) {
            filteredGroups.push({
                group: group.group,
                items: filteredItems,
            });
        }
    });

    return filteredGroups;
}

/**
 * Belirli bir URL'in hangi menü öğesine ait olduğunu bulur
 */
export function getMenuByUrl(url: string): { menuId: string; subMenuId?: string } | null {
    const data = menusData as MenusData;

    for (const menu of data.menus) {
        // Alt menülerde ara
        for (const subItem of menu.items) {
            if (url === subItem.url || url.startsWith(subItem.url + "/")) {
                return {
                    menuId: menu.id,
                    subMenuId: subItem.id,
                };
            }
        }

        // Ana menüde ara
        if (url === menu.url || (url.startsWith(menu.url + "/") && menu.items.length === 0)) {
            return {
                menuId: menu.id,
            };
        }
    }

    return null;
}

/**
 * Kullanıcının belirli bir URL'e erişim yetkisi var mı kontrol eder
 */
export function hasAccessToUrl(url: string, allowedMenuIds?: string[]): boolean {
    // Public sayfalar için kontrol (offer-detail gibi)
    const publicPages = ["/offer-detail"];
    if (publicPages.some((page) => url.startsWith(page))) {
        return true;
    }

    // Eğer allowedMenuIds yoksa veya boşsa tüm erişimlere izin ver (admin gibi)
    if (!allowedMenuIds || allowedMenuIds.length === 0) {
        return true;
    }

    const menuInfo = getMenuByUrl(url);
    if (!menuInfo) {
        // Menüde tanımlı olmayan bir sayfa - erişim izni yok
        return false;
    }

    // Alt menü varsa onun ID'sini kontrol et
    if (menuInfo.subMenuId) {
        return allowedMenuIds.includes(menuInfo.subMenuId);
    }

    // Sadece ana menü varsa onu kontrol et
    return allowedMenuIds.includes(menuInfo.menuId);
}

/**
 * Tüm menü URL'lerini düz bir liste olarak döndürür
 */
export function getAllMenuUrls(): string[] {
    const data = menusData as MenusData;
    const urls: string[] = [];

    data.menus.forEach((menu) => {
        if (menu.items.length > 0) {
            menu.items.forEach((item) => {
                urls.push(item.url);
            });
        } else {
            urls.push(menu.url);
        }
    });

    return urls;
}
