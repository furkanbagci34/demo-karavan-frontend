import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    // Mobil için sayfa numaralarını sınırla
    const getVisiblePages = () => {
        if (totalPages <= 7) {
            return pages;
        }

        const delta = 2;
        const range = [];
        const rangeWithDots = [];

        for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
            range.push(i);
        }

        if (currentPage - delta > 2) {
            rangeWithDots.push(1, "...");
        } else {
            rangeWithDots.push(1);
        }

        rangeWithDots.push(...range);

        if (currentPage + delta < totalPages - 1) {
            rangeWithDots.push("...", totalPages);
        } else {
            rangeWithDots.push(totalPages);
        }

        return rangeWithDots;
    };

    const visiblePages = getVisiblePages();

    return (
        <div className="flex items-center justify-center gap-1 sm:gap-2">
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Desktop: Tüm sayfa numaralarını göster */}
            <div className="hidden sm:flex items-center gap-1">
                {visiblePages.map((page, index) => (
                    <Button
                        key={index}
                        variant={currentPage === page ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8 sm:h-10 sm:w-10"
                        onClick={() => typeof page === "number" && onPageChange(page)}
                        disabled={typeof page !== "number"}
                    >
                        {page}
                    </Button>
                ))}
            </div>

            {/* Mobil: Sadece mevcut sayfa numarasını göster */}
            <div className="flex sm:hidden items-center gap-1">
                <span className="text-sm font-medium px-2">
                    {currentPage} / {totalPages}
                </span>
            </div>

            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}
