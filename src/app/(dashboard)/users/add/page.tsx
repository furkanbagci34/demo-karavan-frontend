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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Users, ArrowLeft, Loader2, Menu as MenuIcon, Pencil, ChevronDown } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { useUsers } from "@/hooks/api/useUsers";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import menusData from "@/config/menus.json";
import { SignatureModal } from "@/components/SignatureModal";

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

export default function AddUserPage() {
    const router = useRouter();
    const { createUser, isCreating } = useUsers();

    const [formData, setFormData] = useState({
        name: "",
        surname: "",
        email: "",
        password: "",
        phoneNumber: "",
        role: "user" as "admin" | "user",
        allowedMenus: [] as string[],
        defaultPage: "",
        signature: "",
    });

    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [isMenuPermissionsOpen, setIsMenuPermissionsOpen] = useState(false);

    const menus = menusData.menus as MenuItem[];

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

    const handleInputChange = (field: string, value: string) => {
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
        if (!formData.name || !formData.surname || !formData.email || !formData.password) {
            toast.error("Lütfen zorunlu alanları doldurun");
            return;
        }

        if (formData.password.length < 6) {
            toast.error("Şifre en az 6 karakter olmalıdır");
            return;
        }

        // E-posta validasyonu
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            toast.error("Geçerli bir e-posta adresi giriniz");
            return;
        }

        createUser(
            {
                name: formData.name,
                surname: formData.surname,
                email: formData.email,
                password: formData.password,
                phoneNumber: formData.phoneNumber || undefined,
                role: formData.role,
                allowedMenus: formData.allowedMenus.length > 0 ? formData.allowedMenus : undefined,
                defaultPage: formData.defaultPage || undefined,
                signature: formData.signature || undefined,
            },
            {
                onSuccess: () => {
                    toast.success("Kullanıcı başarıyla oluşturuldu");
                    router.push("/users");
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onError: (error: any) => {
                    console.error("Kullanıcı oluşturma hatası:", error);
                    const errorMessage = error?.message || "Kullanıcı oluşturulurken bir hata oluştu";
                    toast.error(errorMessage);
                },
            }
        );
    };

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
                                <BreadcrumbPage>Yeni Kullanıcı</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-4">
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Yeni Kullanıcı Oluştur</h1>
                        <p className="text-muted-foreground">Sisteme yeni kullanıcı ekleyin</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/users">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Geri Dön
                            </Link>
                        </Button>
                        <Button type="submit" form="user-form" disabled={isCreating}>
                            {isCreating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Oluşturuluyor...
                                </>
                            ) : (
                                <>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Kullanıcı Oluştur
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Sol Kolon - Temel Bilgiler */}
                        <div className="lg:col-span-2 space-y-4">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Temel Bilgiler
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="name" className="text-sm">
                                                Ad <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="name"
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => handleInputChange("name", e.target.value)}
                                                placeholder="Ad"
                                                required
                                                disabled={isCreating}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="surname" className="text-sm">
                                                Soyad <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="surname"
                                                type="text"
                                                value={formData.surname}
                                                onChange={(e) => handleInputChange("surname", e.target.value)}
                                                placeholder="Soyad"
                                                required
                                                disabled={isCreating}
                                                className="h-9"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="email" className="text-sm">
                                            E-posta <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange("email", e.target.value)}
                                            placeholder="ornek@demontekaravan.com"
                                            required
                                            disabled={isCreating}
                                            className="h-9"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="password" className="text-sm">
                                                Şifre <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => handleInputChange("password", e.target.value)}
                                                placeholder="En az 6 karakter"
                                                required
                                                minLength={6}
                                                disabled={isCreating}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="phoneNumber" className="text-sm">
                                                Telefon
                                            </Label>
                                            <Input
                                                id="phoneNumber"
                                                type="tel"
                                                value={formData.phoneNumber}
                                                onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                                                placeholder="05XX XXX XX XX"
                                                disabled={isCreating}
                                                className="h-9"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="role" className="text-sm">
                                                Rol <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={formData.role}
                                                onValueChange={(value: "admin" | "user") =>
                                                    handleInputChange("role", value)
                                                }
                                                disabled={isCreating}
                                            >
                                                <SelectTrigger id="role" className="h-9">
                                                    <SelectValue placeholder="Rol seçin" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="user">Kullanıcı</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="defaultPage" className="text-sm">
                                                Varsayılan Sayfa
                                            </Label>
                                            <Select
                                                value={formData.defaultPage}
                                                onValueChange={(value) => handleInputChange("defaultPage", value)}
                                                disabled={isCreating}
                                            >
                                                <SelectTrigger id="defaultPage" className="h-9">
                                                    <SelectValue placeholder="Seçin (opsiyonel)" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {allMenuOptions.map((option) => (
                                                        <SelectItem key={option.id} value={option.url}>
                                                            {option.title}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Menü İzinleri */}
                            <Collapsible open={isMenuPermissionsOpen} onOpenChange={setIsMenuPermissionsOpen}>
                                <Card>
                                    <CollapsibleTrigger asChild>
                                        <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
                                            <CardTitle className="text-lg flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <MenuIcon className="h-4 w-4" />
                                                    Menü İzinleri
                                                    {formData.allowedMenus.length > 0 && (
                                                        <span className="text-xs font-normal text-muted-foreground">
                                                            ({formData.allowedMenus.length} seçili)
                                                        </span>
                                                    )}
                                                </div>
                                                <ChevronDown
                                                    className={`h-4 w-4 transition-transform ${
                                                        isMenuPermissionsOpen ? "rotate-180" : ""
                                                    }`}
                                                />
                                            </CardTitle>
                                            <CardDescription className="text-xs mt-1">
                                                Seçim yapmazsanız, kullanıcı tüm menülere erişebilir
                                            </CardDescription>
                                        </CardHeader>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <CardContent className="pt-0">
                                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                                {menus.map((menu) => (
                                                    <div key={menu.id} className="space-y-2">
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={menu.id}
                                                                checked={formData.allowedMenus.includes(menu.id)}
                                                                onCheckedChange={() => handleMenuToggle(menu.id)}
                                                                disabled={isCreating}
                                                            />
                                                            <Label
                                                                htmlFor={menu.id}
                                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                            >
                                                                {menu.title}
                                                            </Label>
                                                        </div>
                                                        {menu.items && menu.items.length > 0 && (
                                                            <div className="ml-6 space-y-1.5">
                                                                {menu.items.map((item) => (
                                                                    <div
                                                                        key={item.id}
                                                                        className="flex items-center space-x-2"
                                                                    >
                                                                        <Checkbox
                                                                            id={item.id}
                                                                            checked={formData.allowedMenus.includes(
                                                                                item.id
                                                                            )}
                                                                            onCheckedChange={() =>
                                                                                handleMenuToggle(item.id)
                                                                            }
                                                                            disabled={isCreating}
                                                                        />
                                                                        <Label
                                                                            htmlFor={item.id}
                                                                            className="text-xs leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-muted-foreground"
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
                                    </CollapsibleContent>
                                </Card>
                            </Collapsible>
                        </div>

                        {/* Sağ Kolon - İmza ve Ayarlar */}
                        <div className="space-y-4">
                            {/* İmza */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Pencil className="h-4 w-4" />
                                        İmza
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {formData.signature && formData.signature.trim() ? (
                                        <div className="border rounded-lg p-2 bg-gray-50">
                                            <img
                                                src={formData.signature}
                                                alt="Kullanıcı imzası"
                                                className="h-24 w-full border rounded bg-white object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                            <Pencil className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                            <p className="text-xs text-muted-foreground">Henüz imza eklenmemiş</p>
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-2">
                                        <Button
                                            type="button"
                                            variant={
                                                formData.signature && formData.signature.trim() ? "outline" : "default"
                                            }
                                            onClick={() => setIsSignatureModalOpen(true)}
                                            disabled={isCreating}
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Pencil className="mr-2 h-3 w-3" />
                                            {formData.signature && formData.signature.trim()
                                                ? "İmzayı Düzenle"
                                                : "İmza Ekle"}
                                        </Button>
                                        {formData.signature && formData.signature.trim() && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setFormData((prev) => ({ ...prev, signature: "" }))}
                                                disabled={isCreating}
                                                size="sm"
                                                className="w-full"
                                            >
                                                İmzayı Kaldır
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>

                {/* İmza Modal */}
                <SignatureModal
                    open={isSignatureModalOpen}
                    onOpenChange={setIsSignatureModalOpen}
                    onSave={(sig) => {
                        if (sig && sig.trim()) {
                            setFormData((prev) => ({ ...prev, signature: sig.trim() }));
                            toast.success("İmza kaydedildi");
                        } else {
                            toast.error("İmza kaydedilemedi");
                        }
                    }}
                    onClear={() => {
                        setFormData((prev) => ({ ...prev, signature: "" }));
                        toast.success("İmza temizlendi");
                    }}
                    initialSignature={formData.signature}
                />
            </div>
        </>
    );
}
