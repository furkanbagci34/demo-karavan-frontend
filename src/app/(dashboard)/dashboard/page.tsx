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

export default function DashboardPage() {
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
                                <BreadcrumbPage>Genel Bakış</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>
            <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                </div>

                <div className="grid gap-6 md:grid-cols-3 mb-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Toplam Makale</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">0</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">0</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Aktif Kullanıcı</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">0</div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="flex-1">
                    <CardHeader>
                        <CardTitle>Son İşlemler</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Henüz işlem bulunmuyor.</p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
