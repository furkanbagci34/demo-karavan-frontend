"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/hooks/api/useAuth";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { LogoFull } from "../dashboard/logo";
import { Users, Shield, UserPlus, Building } from "lucide-react";

export function RegisterForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
    const { mutate: register, isPending } = useRegister({
        onError: (error: unknown) => {
            console.error("Register error:", error);
            let errorMessage = "Bir hata oluştu";

            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === "object" && error !== null && "message" in error) {
                errorMessage = String((error as { message: unknown }).message);
            }

            toast.error("Kayıt başarısız", {
                description: errorMessage,
            });
        },
    });
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        register({ name: `${firstName} ${lastName}`, email, password });
    }

    return (
        <div className={cn("flex flex-col", className)} {...props}>
            <div className="flex flex-col items-center space-y-6 pb-16 pt-10">
                <LogoFull className="h-12 w-auto" />
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight text-orange-600">
                        Demonte Karavan - Yeni Hesap
                    </h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        Karavan yönetim sistemine katılmak için hesap oluşturun
                    </p>
                </div>
            </div>
            <div className="mx-auto w-full max-w-[400px]">
                <Card className="border-none bg-card/50 shadow-none">
                    <CardContent className="p-0">
                        <form onSubmit={handleSubmit} className="grid gap-6">
                            <div className="grid gap-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor="firstName"
                                            className="text-sm font-medium flex items-center gap-2"
                                        >
                                            <Users className="h-4 w-4 text-orange-500" />
                                            Ad
                                        </Label>
                                        <Input
                                            id="firstName"
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            disabled={isPending}
                                            required
                                            autoComplete="given-name"
                                            name="firstName"
                                            className="border-muted-foreground/20 focus:border-orange-500 focus:ring-orange-500"
                                            placeholder="Adınız"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor="lastName"
                                            className="text-sm font-medium flex items-center gap-2"
                                        >
                                            <Building className="h-4 w-4 text-orange-500" />
                                            Soyad
                                        </Label>
                                        <Input
                                            id="lastName"
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            disabled={isPending}
                                            required
                                            autoComplete="family-name"
                                            name="lastName"
                                            className="border-muted-foreground/20 focus:border-orange-500 focus:ring-orange-500"
                                            placeholder="Soyadınız"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                                        <Users className="h-4 w-4 text-orange-500" />
                                        E-posta Adresi
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isPending}
                                        required
                                        autoComplete="email"
                                        name="email"
                                        className="border-muted-foreground/20 focus:border-orange-500 focus:ring-orange-500"
                                        placeholder="ornek@demontekaravan.com"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-orange-500" />
                                        Şifre
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isPending}
                                        required
                                        autoComplete="new-password"
                                        name="password"
                                        className="border-muted-foreground/20 focus:border-orange-500 focus:ring-orange-500"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-4">
                                <Button
                                    type="submit"
                                    disabled={isPending}
                                    size="lg"
                                    className="bg-orange-600 hover:bg-orange-700 text-white"
                                >
                                    {isPending ? (
                                        <>
                                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                            Kayıt yapılıyor...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Hesap Oluştur
                                        </>
                                    )}
                                </Button>
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-muted-foreground/20" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-background px-2 text-muted-foreground">veya</span>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    type="button"
                                    disabled={isPending}
                                    size="lg"
                                    className="border-muted-foreground/20 hover:border-orange-300 hover:bg-orange-50"
                                >
                                    <Icons.google className="mr-2 h-4 w-4" />
                                    Google ile Kayıt Ol
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
                <div className="mt-6 grid gap-6">
                    <div className="text-center text-sm">
                        Zaten hesabınız var mı?{" "}
                        <Button
                            variant="link"
                            className="h-auto p-0 text-orange-600 hover:text-orange-700 font-normal"
                            asChild
                        >
                            <Link href="/login">Giriş Yap</Link>
                        </Button>
                    </div>
                    <div className="text-balance text-center text-xs text-muted-foreground">
                        <span className="space-x-1">
                            <Link href="/terms" className="underline-offset-4 hover:underline text-orange-600">
                                Hizmet Şartları
                            </Link>
                            <span>-</span>
                            <Link href="/privacy" className="underline-offset-4 hover:underline text-orange-600">
                                Gizlilik Politikası
                            </Link>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
