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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Users,
    Pencil,
    Trash2,
    Loader2,
    AlertTriangle,
    Mail,
    Phone,
    Search,
    Calendar,
    UserCheck,
    UserX,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { Pagination } from "@/components/ui/pagination";
import { useUsers } from "@/hooks/api/useUsers";
import { User } from "@/lib/api/types";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDebounce } from "@/hooks/use-debounce";

export default function UsersListPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const { users, totalCount, totalPages, isLoading, deleteUser, isDeleting } = useUsers({
        page: currentPage,
        limit: 10,
        search: debouncedSearchTerm,
    });

    // Kullanıcı silme dialog'unu aç
    const handleOpenDeleteDialog = (user: User) => {
        setUserToDelete(user);
        setIsDeleteDialogOpen(true);
    };

    // Kullanıcı silme fonksiyonu
    const handleDeleteUser = async () => {
        if (!userToDelete) return;

        deleteUser(userToDelete.id.toString(), {
            onSuccess: () => {
                toast.success(`${userToDelete.name} ${userToDelete.surname} başarıyla silindi`);
                setIsDeleteDialogOpen(false);
                setUserToDelete(null);
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onError: (error: any) => {
                console.error("Kullanıcı silme hatası:", error);
                const errorMessage = error?.message || "Kullanıcı silinirken bir hata oluştu";
                toast.error(errorMessage);
            },
        });
    };

    // Sayfa değişikliği
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Arama terimi değişikliği
    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1); // Arama yapılınca ilk sayfaya dön
    };

    // Tarih formatla
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("tr-TR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
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
                                <BreadcrumbPage>Kullanıcılar</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 sm:p-6 space-y-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Kullanıcılar</h1>
                        <p className="text-muted-foreground">Sistemdeki kullanıcıları görüntüleyin ve yönetin</p>
                    </div>
                    <Button asChild className="w-fit">
                        <Link href="/users/add">
                            <Plus className="mr-2 h-4 w-4" />
                            Yeni Kullanıcı
                        </Link>
                    </Button>
                </div>

                {/* Stats Card */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="flex items-center p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-md">
                                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Toplam Kullanıcı</p>
                                    <p className="text-2xl font-bold">{totalCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-md">
                                    <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Aktif Kullanıcı</p>
                                    <p className="text-2xl font-bold">
                                        {users.filter((user) => user.is_active).length}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-md">
                                    <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Pasif Kullanıcı</p>
                                    <p className="text-2xl font-bold">
                                        {users.filter((user) => !user.is_active).length}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search Section */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            Arama ve Filtreleme
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="İsim, soyisim veya e-posta ile ara..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            {debouncedSearchTerm && (
                                <Button variant="outline" onClick={() => handleSearchChange("")} size="sm">
                                    Temizle
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Table Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Kullanıcı Listesi
                            </span>
                            {debouncedSearchTerm && (
                                <Badge variant="secondary" className="text-xs">
                                    &quot;{debouncedSearchTerm}&quot; için {users.length} sonuç
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                <span>Kullanıcılar yükleniyor...</span>
                            </div>
                        ) : users.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">
                                    {debouncedSearchTerm ? "Kullanıcı bulunamadı" : "Henüz kullanıcı yok"}
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    {debouncedSearchTerm
                                        ? "Arama kriterlerinizi değiştirerek tekrar deneyin."
                                        : "İlk kullanıcınızı oluşturmak için yukarıdaki butona tıklayın."}
                                </p>
                                {!debouncedSearchTerm && (
                                    <Button asChild>
                                        <Link href="/users/add">
                                            <Plus className="mr-2 h-4 w-4" />
                                            İlk Kullanıcıyı Oluştur
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[50px]">ID</TableHead>
                                                <TableHead>Ad Soyad</TableHead>
                                                <TableHead>E-posta</TableHead>
                                                <TableHead>Telefon</TableHead>
                                                <TableHead>Rol</TableHead>
                                                <TableHead>Durum</TableHead>
                                                <TableHead>Son Giriş</TableHead>
                                                <TableHead>Kayıt Tarihi</TableHead>
                                                <TableHead className="text-right">İşlemler</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {users.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell className="font-medium">#{user.id}</TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">
                                                            {user.name} {user.surname}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                                            {user.email}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                                            {user.phone_number}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={user.role === "admin" ? "default" : "secondary"}
                                                            className="capitalize"
                                                        >
                                                            {user.role}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={user.is_active ? "default" : "destructive"}
                                                            className="gap-1"
                                                        >
                                                            {user.is_active ? (
                                                                <>
                                                                    <UserCheck className="h-3 w-3" />
                                                                    Aktif
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <UserX className="h-3 w-3" />
                                                                    Pasif
                                                                </>
                                                            )}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Calendar className="h-4 w-4" />
                                                            {user.last_signin_at
                                                                ? formatDate(user.last_signin_at)
                                                                : "Hiç giriş yapmamış"}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Calendar className="h-4 w-4" />
                                                            {formatDate(user.created_at)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button variant="outline" size="sm" asChild>
                                                                <Link href={`/users/edit/${user.id}`}>
                                                                    <Pencil className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleOpenDeleteDialog(user)}
                                                                className="text-destructive hover:text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between pt-4">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span>
                                                Sayfa {currentPage} / {totalPages}({totalCount} toplam kullanıcı)
                                            </span>
                                        </div>
                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            onPageChange={handlePageChange}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Kullanıcıyı Sil
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>
                                {userToDelete?.name} {userToDelete?.surname}
                            </strong>{" "}
                            adlı kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteUser}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Siliniyor...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Sil
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
