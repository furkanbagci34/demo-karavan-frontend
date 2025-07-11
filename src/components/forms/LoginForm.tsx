"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/hooks/api/useAuth";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { LogoFull } from "../dashboard/logo";
import { Car, Users, Shield } from "lucide-react";

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
    const { mutate: login, isPending } = useLogin({
        onError: (error: unknown) => {
            let errorMessage = "Bir hata oluştu";

            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === "object" && error !== null && "message" in error) {
                errorMessage = String((error as { message: unknown }).message);
            }

            toast.error("Giriş başarısız", {
                description: errorMessage,
            });
        },
    });
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        login({ email, password });
    }

    return (
        <div className={cn("flex flex-col", className)} {...props}>
            <div className="flex flex-col items-center space-y-6 pb-16 pt-10">
                <LogoFull className="h-20 w-auto" />
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-800">Demonte Karavan</h1>
                    <p className="text-balance text-sm text-gray-600">Yönetim Paneli</p>
                </div>
            </div>
            <div className="mx-auto w-full max-w-[400px]">
                <Card className="border border-gray-200 bg-white/80 backdrop-blur-sm shadow-lg">
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="grid gap-6">
                            <div className="grid gap-5">
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="email"
                                        className="text-sm font-medium flex items-center gap-2 text-gray-700"
                                    >
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
                                        autoComplete="username"
                                        name="email"
                                        className="border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 bg-gray-50/50"
                                        placeholder="ornek@demontekaravan.com"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label
                                            htmlFor="password"
                                            className="text-sm font-medium flex items-center gap-2 text-gray-700"
                                        >
                                            <Shield className="h-4 w-4 text-orange-500" />
                                            Şifre
                                        </Label>
                                        <Button
                                            variant="link"
                                            className="h-auto p-0 text-xs font-normal text-orange-600 hover:text-orange-700"
                                            asChild
                                        >
                                            <Link href="/forgot-password">Şifremi Unuttum</Link>
                                        </Button>
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isPending}
                                        required
                                        autoComplete="current-password"
                                        name="password"
                                        className="border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 bg-gray-50/50"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-4">
                                <Button
                                    type="submit"
                                    disabled={isPending}
                                    size="lg"
                                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                                >
                                    {isPending ? (
                                        <>
                                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                            Giriş yapılıyor...
                                        </>
                                    ) : (
                                        <>
                                            <Car className="mr-2 h-4 w-4" />
                                            Sisteme Giriş Yap
                                        </>
                                    )}
                                </Button>
                                {/* <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-300" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-2 text-gray-500">veya</span>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    type="button"
                                    disabled={isPending}
                                    size="lg"
                                    className="border-gray-300 text-gray-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 transition-all duration-200"
                                >
                                    <Icons.google className="mr-2 h-4 w-4" />
                                    Google ile Giriş Yap
                                </Button> */}
                            </div>
                        </form>
                    </CardContent>
                </Card>
                <div className="mt-6 grid gap-6">
                    <div className="text-center text-sm text-gray-600">
                        Yeni kullanıcı mısınız?{" "}
                        <Button
                            variant="link"
                            className="h-auto p-0 text-orange-600 hover:text-orange-700 font-normal"
                            asChild
                        >
                            <Link href="/register">Hesap Oluştur</Link>
                        </Button>
                    </div>
                    <div className="text-balance text-center text-xs text-gray-500">
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
