"use client";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/api/useAuth";
import { useState, useEffect } from "react";
import { User } from "@/types/user";
import { formatDate } from "@/lib/utils";

export default function AccountPage() {
    const { user } = useAuth();
    const [formData, setFormData] = useState<Partial<User>>({
        name: "",
        surname: "",
        email: "",
        phone_number: "",
    });
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // User bilgileri değiştiğinde form verisini güncelle
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                surname: user.surname || "",
                email: user.email || "",
                phone_number: user.phone_number || "",
            });
        }
    }, [user]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Burada profil güncellemesi yapılacak
        console.log("Güncellenen profil:", formData);
        alert("Profil güncellendi!");
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    if (!user) {
        return <div>Kullanıcı bilgileri yükleniyor...</div>;
    }

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Hesabım</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>
            <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">Hesap Bilgilerim</h1>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Hesap Bilgileri</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-medium">
                                        Ad
                                    </label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="Adınız"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="surname" className="text-sm font-medium">
                                        Soyad
                                    </label>
                                    <Input
                                        id="surname"
                                        name="surname"
                                        placeholder="Soyadınız"
                                        value={formData.surname}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium">
                                        E-posta
                                    </label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="E-posta adresiniz"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="phone_number" className="text-sm font-medium">
                                        Telefon Numarası
                                    </label>
                                    <Input
                                        id="phone_number"
                                        name="phone_number"
                                        placeholder="Telefon numaranız"
                                        value={formData.phone_number || ""}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit">Bilgileri Güncelle</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Şifre Değiştir</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="currentPassword" className="text-sm font-medium">
                                        Mevcut Şifre
                                    </label>
                                    <Input
                                        id="currentPassword"
                                        type="password"
                                        placeholder="Mevcut şifreniz"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="newPassword" className="text-sm font-medium">
                                        Yeni Şifre
                                    </label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        placeholder="Yeni şifreniz"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="confirmPassword" className="text-sm font-medium">
                                        Şifre Tekrar
                                    </label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Şifrenizi tekrar girin"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit">Şifre Değiştir</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
