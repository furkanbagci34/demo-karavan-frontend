"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStations } from "@/hooks/api/useStations";
import { useUsers } from "@/hooks/api/useUsers";
import { User } from "@/lib/api/types";
import { useQueryClient } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MapPin, Save, Plus, Users, Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Form doğrulama şeması
const stationSchema = z.object({
    name: z.string().min(2, "İstasyon adı en az 2 karakter olmalıdır").max(50, "İstasyon adı çok uzun"),
    authorized_users: z.array(z.number()).optional(),
});

type StationFormData = z.infer<typeof stationSchema>;

export default function AddStationPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { create, isLoading } = useStations();
    const { users, isLoading: isLoadingUsers } = useUsers({ limit: 100 });
    const [open, setOpen] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

    const form = useForm<StationFormData>({
        resolver: zodResolver(stationSchema),
        defaultValues: {
            name: "",
            authorized_users: [],
        },
    });

    const handleUserSelect = (user: User) => {
        const isSelected = selectedUsers.some((u) => u.id === user.id);
        let newSelectedUsers: User[];

        if (isSelected) {
            newSelectedUsers = selectedUsers.filter((u) => u.id !== user.id);
        } else {
            newSelectedUsers = [...selectedUsers, user];
        }

        setSelectedUsers(newSelectedUsers);
        form.setValue(
            "authorized_users",
            newSelectedUsers.map((u) => u.id)
        );
    };

    const removeUser = (userId: number) => {
        const newSelectedUsers = selectedUsers.filter((u) => u.id !== userId);
        setSelectedUsers(newSelectedUsers);
        form.setValue(
            "authorized_users",
            newSelectedUsers.map((u) => u.id)
        );
    };

    const onSubmit = async (data: StationFormData) => {
        try {
            const stationData = {
                name: data.name,
                authorized_users: data.authorized_users || [],
            };

            await create.mutateAsync(stationData);

            // Production cache'ini temizle
            queryClient.invalidateQueries({ queryKey: ["production"] });

            toast.success("İstasyon başarıyla eklendi!", {
                description: `${data.name} istasyonu sisteme kaydedildi.`,
            });

            // İstasyonlar sayfasına yönlendir
            router.push("/stations");
        } catch (error: unknown) {
            console.error("İstasyon ekleme hatası:", error);
            const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu, lütfen tekrar deneyin.";
            toast.error("İstasyon eklenemedi", {
                description: errorMessage,
            });
        }
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
                            <BreadcrumbItem className="hidden sm:block">
                                <BreadcrumbLink href="/manufacture">Üretim</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden sm:block" />
                            <BreadcrumbItem className="hidden sm:block">
                                <BreadcrumbLink href="/stations">İstasyonlar</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden sm:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>İstasyon Ekle</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                {/* Başlık */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <Plus className="h-6 w-6" />
                        İstasyon Ekle
                    </h1>
                </div>

                {/* Form */}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {/* Sol Kolon - İstasyon Bilgileri */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5" />
                                        İstasyon Bilgileri
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>İstasyon Adı *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="İstasyon adını giriniz" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="authorized_users"
                                        render={() => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Yetkili Kullanıcılar</FormLabel>
                                                <Popover open={open} onOpenChange={setOpen}>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                aria-expanded={open}
                                                                className="w-full justify-between"
                                                                disabled={isLoadingUsers}
                                                            >
                                                                {selectedUsers.length === 0
                                                                    ? "Kullanıcı seçiniz..."
                                                                    : `${selectedUsers.length} kullanıcı seçildi`}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-full p-0" align="start">
                                                        <Command>
                                                            <CommandInput placeholder="Kullanıcı ara..." />
                                                            <CommandList>
                                                                <CommandEmpty>Kullanıcı bulunamadı.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {users.map((user) => (
                                                                        <CommandItem
                                                                            key={user.id}
                                                                            value={`${user.name} ${user.surname} ${user.email}`}
                                                                            onSelect={() => handleUserSelect(user)}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    selectedUsers.some(
                                                                                        (u) => u.id === user.id
                                                                                    )
                                                                                        ? "opacity-100"
                                                                                        : "opacity-0"
                                                                                )}
                                                                            />
                                                                            <div className="flex flex-col">
                                                                                <span className="font-medium">
                                                                                    {user.name} {user.surname}
                                                                                </span>
                                                                                <span className="text-sm text-muted-foreground">
                                                                                    {user.email}
                                                                                </span>
                                                                            </div>
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Seçilen kullanıcıları göster */}
                                    {selectedUsers.length > 0 && (
                                        <div className="space-y-2">
                                            <FormLabel className="text-sm font-medium">Seçilen Kullanıcılar:</FormLabel>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedUsers.map((user) => (
                                                    <Badge
                                                        key={user.id}
                                                        variant="secondary"
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Users className="h-3 w-3" />
                                                        {user.name} {user.surname}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeUser(user.id)}
                                                            className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Sağ Kolon - Bilgi Kartı */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5" />
                                        Bilgi
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4 text-sm text-muted-foreground">
                                        <div className="p-4 bg-blue-50 rounded-lg">
                                            <h4 className="font-medium text-blue-900 mb-2">
                                                İstasyon Ekleme Kuralları
                                            </h4>
                                            <ul className="space-y-1 text-blue-800">
                                                <li>• İstasyon adı en az 2 karakter olmalıdır</li>
                                                <li>• İstasyon adı maksimum 50 karakter olabilir</li>
                                                <li>• İstasyon adı benzersiz olmalıdır</li>
                                                <li>• İstasyon ekledikten sonra düzenleyebilirsiniz</li>
                                            </ul>
                                        </div>

                                        <div className="p-4 bg-green-50 rounded-lg">
                                            <h4 className="font-medium text-green-900 mb-2">Yetkili Kullanıcılar</h4>
                                            <ul className="space-y-1 text-green-800">
                                                <li>• İstasyona yetkili kullanıcılar atayabilirsiniz</li>
                                                <li>• Birden fazla kullanıcı seçebilirsiniz</li>
                                                <li>• Kullanıcı arama yapabilirsiniz</li>
                                                <li>• Seçilen kullanıcılar istasyon işlemlerini yapabilir</li>
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Alt Butonlar */}
                        <div className="flex flex-col sm:flex-row justify-end gap-4 sm:space-x-4 sm:space-y-0 pb-10">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() => {
                                    form.reset();
                                    setSelectedUsers([]);
                                }}
                            >
                                Temizle
                            </Button>
                            <Button
                                type="submit"
                                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto "
                                disabled={isLoading || form.formState.isSubmitting}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {isLoading || form.formState.isSubmitting ? "Kaydediliyor..." : "İstasyonu Kaydet"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </>
    );
}
