"use client";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Save,
    Users,
    Mail,
    Lock,
    Phone,
    ArrowLeft,
    Loader2,
    Menu as MenuIcon,
    Home,
    Shield,
    AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useUsers } from "@/hooks/api/useUsers";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import menusData from "@/config/menus.json";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

interface MenuItem {
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

export default function EditUserPage() {
    const router = useRouter();
    const params = useParams();
    const userId = params.id as string;

    const { updateUser, isUpdating } = useUsers();

    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: "",
        surname: "",
        email: "",
        password: "",
        phoneNumber: "",
        role: "user" as "admin" | "user",
        isActive: true,
        allowedMenus: [] as string[],
        defaultPage: "",
    });

    const menus = menusData.menus as MenuItem[];

    // Kullanıcı verisini çek
    useEffect(() => {
        type UserResponse = {
            name?: string;
            surname?: string;
            email?: string;
            phone_number?: string;
            role?: "admin" | "user";
            is_active?: boolean;
            allowed_menus?: string[];
            default_page?: string;
        };

        const fetchUser = async () => {
            try {
                const userData = (await apiClient.get(API_ENDPOINTS.users.getById(userId))) as UserResponse;
                setFormData({
                    name: userData?.name ?? "",
                    surname: userData?.surname ?? "",
                    email: userData?.email ?? "",
                    password: "",
                    phoneNumber: userData?.phone_number ?? "",
                    role: (userData?.role as "admin" | "user") ?? "user",
                    isActive: userData?.is_active !== false,
                    allowedMenus: userData?.allowed_menus ?? [],
                    defaultPage: userData?.default_page ?? "",
                });
            } catch (error) {
                console.error("Kullanıcı yükleme hatası:", error);
                toast.error("Kullanıcı bilgileri yüklenemedi");
                router.push("/users");
            } finally {
                setIsLoading(false);
            }
        };

        if (userId) {
            fetchUser();
        }
    }, [userId, router]);

    // Tüm menü seçeneklerini flat bir yapıya çevir
    const getAllMenuOptions = () => {
        const options: Array<{ id: string; title: string; url: string }> = [];
        const seenUrls = new Set<string>();

        menus.forEach((menu) => {
            // Ana menüyü ekle (eğer daha önce eklenmemişse)
            if (!seenUrls.has(menu.url)) {
                options.push({
                    id: menu.id,
                    title: menu.title,
                    url: menu.url,
                });
                seenUrls.add(menu.url);
            }

            // Alt menüleri ekle
            if (menu.items && menu.items.length > 0) {
                menu.items.forEach((item) => {
                    // Alt menüyü sadece URL'i daha önce eklenmemişse ekle
                    if (!seenUrls.has(item.url)) {
                        options.push({
                            id: item.id,
                            title: `${menu.title} - ${item.title}`,
                            url: item.url,
                        });
                        seenUrls.add(item.url);
                    }
                });
            }
        });
        return options;
    };

    const allMenuOptions = getAllMenuOptions();

    const handleInputChange = (field: string, value: string | boolean) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleMenuToggle = (menuId: string) => {
        setFormData((prev) => {
            const currentMenus = prev.allowedMenus;
            const isSelected = currentMenus.includes(menuId);

            return {
                ...prev,
                allowedMenus: isSelected ? currentMenus.filter((id) => id !== menuId) : [...currentMenus, menuId],
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Form validasyonu
        if (!formData.name || !formData.surname || !formData.email) {
            toast.error("Lütfen zorunlu alanları doldurun");
            return;
        }

        if (formData.password && formData.password.length < 6) {
            toast.error("Şifre en az 6 karakter olmalıdır");
            return;
        }

        // E-posta validasyonu
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            toast.error("Geçerli bir e-posta adresi giriniz");
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {
            name: formData.name,
            surname: formData.surname,
            email: formData.email,
            phoneNumber: formData.phoneNumber || undefined,
            role: formData.role,
            isActive: formData.isActive,
            allowedMenus: formData.allowedMenus.length > 0 ? formData.allowedMenus : undefined,
            defaultPage: formData.defaultPage || undefined,
        };

        // Sadece şifre girilmişse ekle
        if (formData.password) {
            updateData.password = formData.password;
        }

        updateUser(
            { id: userId, data: updateData },
            {
                onSuccess: () => {
                    toast.success("Kullanıcı başarıyla güncellendi");
                    router.push("/users");
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onError: (error: any) => {
                    console.error("Kullanıcı güncelleme hatası:", error);
                    const errorMessage = error?.message || "Kullanıcı güncellenirken bir hata oluştu";
                    toast.error(errorMessage);
                },
            }
        );
    };

    if (isLoading) {
        return (
            <>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden sm:block">
                                    <BreadcrumbLink href="/dashboard">Anasayfa</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden sm:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/users">Kullanıcılar</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden sm:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Düzenle</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="flex flex-1 items-center justify-center p-8">
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span>Kullanıcı bilgileri yükleniyor...</span>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden sm:block">
                                <BreadcrumbLink href="/dashboard">Anasayfa</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden sm:block" />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/users">Kullanıcılar</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden sm:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Düzenle</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Kullanıcı Düzenle</h1>
                        <p className="text-muted-foreground">Kullanıcı bilgilerini güncelleyin</p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/users">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Geri Dön
                        </Link>
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Temel Bilgiler */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Temel Bilgiler
                            </CardTitle>
                            <CardDescription>Kullanıcının temel bilgilerini güncelleyin</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        Ad <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange("name", e.target.value)}
                                        placeholder="Kullanıcının adı"
                                        required
                                        disabled={isUpdating}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="surname" className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        Soyad <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="surname"
                                        type="text"
                                        value={formData.surname}
                                        onChange={(e) => handleInputChange("surname", e.target.value)}
                                        placeholder="Kullanıcının soyadı"
                                        required
                                        disabled={isUpdating}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    E-posta <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                    placeholder="ornek@demontekaravan.com"
                                    required
                                    disabled={isUpdating}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="flex items-center gap-2">
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                        Yeni Şifre
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => handleInputChange("password", e.target.value)}
                                        placeholder="Değiştirmek için doldurun"
                                        minLength={6}
                                        disabled={isUpdating}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Boş bırakırsanız şifre değiştirilmez
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        Telefon
                                    </Label>
                                    <Input
                                        id="phoneNumber"
                                        type="tel"
                                        value={formData.phoneNumber}
                                        onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                                        placeholder="05XX XXX XX XX"
                                        disabled={isUpdating}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="role" className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-muted-foreground" />
                                        Rol <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={formData.role}
                                        onValueChange={(value: "admin" | "user") => handleInputChange("role", value)}
                                        disabled={isUpdating}
                                    >
                                        <SelectTrigger id="role">
                                            <SelectValue placeholder="Rol seçin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="user">Kullanıcı</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="isActive" className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                                        Durum
                                    </Label>
                                    <div className="flex items-center space-x-2 pt-2">
                                        <Switch
                                            id="isActive"
                                            checked={formData.isActive}
                                            onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                                            disabled={isUpdating}
                                        />
                                        <Label htmlFor="isActive" className="cursor-pointer">
                                            {formData.isActive ? "Aktif" : "Pasif"}
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Menü İzinleri */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MenuIcon className="h-5 w-5" />
                                Menü İzinleri
                            </CardTitle>
                            <CardDescription>
                                Kullanıcının erişebileceği menüleri seçin (Seçim yapmazsanız, kullanıcı tüm menülere
                                erişebilir)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {menus.map((menu) => (
                                    <div key={menu.id} className="space-y-3">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id={menu.id}
                                                checked={formData.allowedMenus.includes(menu.id)}
                                                onCheckedChange={() => handleMenuToggle(menu.id)}
                                                disabled={isUpdating}
                                            />
                                            <Label
                                                htmlFor={menu.id}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {menu.title}
                                            </Label>
                                        </div>
                                        {menu.items && menu.items.length > 0 && (
                                            <div className="ml-6 space-y-2">
                                                {menu.items.map((item) => (
                                                    <div key={item.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={item.id}
                                                            checked={formData.allowedMenus.includes(item.id)}
                                                            onCheckedChange={() => handleMenuToggle(item.id)}
                                                            disabled={isUpdating}
                                                        />
                                                        <Label
                                                            htmlFor={item.id}
                                                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-muted-foreground"
                                                        >
                                                            {item.title}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Varsayılan Sayfa */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Home className="h-5 w-5" />
                                Varsayılan Sayfa
                            </CardTitle>
                            <CardDescription>
                                Kullanıcının giriş yaptıktan sonra yönlendirileceği sayfayı seçin
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label htmlFor="defaultPage">Varsayılan Sayfa</Label>
                                <Select
                                    value={formData.defaultPage}
                                    onValueChange={(value) => handleInputChange("defaultPage", value)}
                                    disabled={isUpdating}
                                >
                                    <SelectTrigger id="defaultPage">
                                        <SelectValue placeholder="Varsayılan sayfa seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allMenuOptions.map((option) => (
                                            <SelectItem key={option.id} value={option.url}>
                                                {option.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {!formData.defaultPage && (
                                    <p className="text-xs text-muted-foreground">
                                        Seçim yapmazsanız, kullanıcı ana sayfaya yönlendirilir
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push("/users")}
                            disabled={isUpdating}
                        >
                            İptal
                        </Button>
                        <Button type="submit" disabled={isUpdating}>
                            {isUpdating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Güncelleniyor...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Değişiklikleri Kaydet
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
