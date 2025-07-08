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

export default function MyApisPage() {
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
                                <BreadcrumbPage>Test Sayfası</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>
            <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">Test Sayfası</h1>
                </div>
                <div className="flex flex-col items-center justify-center h-64 bg-muted/50 rounded-lg border-2 border-dashed">
                    <h2 className="text-lg text-muted-foreground">Bu bir test sayfasıdır</h2>
                    <p className="text-sm text-muted-foreground mt-2">
                        Temel React frontend projesi başarıyla kuruldu.
                    </p>
                </div>
            </div>
        </>
    );
}
