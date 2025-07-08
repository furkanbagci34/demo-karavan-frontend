"use client";

import * as React from "react";
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
    RowSelectionState,
} from "@tanstack/react-table";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    searchKey?: string;
    total?: number;
    page?: number;
    perPage?: number;
    perPageOptions?: boolean;
    isLoading?: boolean;
    isPreviousData?: boolean;
    isFetching?: boolean;
    onPageChange?: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
    onRowSelectionChange?: (rows: TData[]) => void;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    searchKey,
    total = 0,
    page = 1,
    perPage = 10,
    perPageOptions,
    isLoading = false,
    isPreviousData = false,
    isFetching = false,
    onPageChange,
    onPerPageChange,
    onRowSelectionChange,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

    const tableColumns = React.useMemo(
        () => [
            {
                id: "select",
                header: ({ table }) => (
                    <Checkbox
                        checked={
                            table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")
                        }
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Tümünü seç"
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Satırı seç"
                    />
                ),
                enableSorting: false,
                enableHiding: false,
            },
            ...columns,
        ],
        [columns]
    );

    const table = useReactTable({
        data,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            rowSelection,
        },
        enableRowSelection: true,
    });

    // Memoize selected rows callback
    React.useEffect(() => {
        if (onRowSelectionChange) {
            const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);
            onRowSelectionChange(selectedRows);
        }
    }, [rowSelection, onRowSelectionChange, table]);

    // Memoize page numbers calculation
    const pageNumbers = React.useMemo(() => {
        const totalPages = Math.ceil(total / perPage);

        if (totalPages <= 6) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const pageNumbers: number[] = [];
        pageNumbers.push(1);

        const startPage = Math.max(2, page - 1);
        const endPage = Math.min(totalPages - 1, page + 1);

        if (startPage > 2) {
            pageNumbers.push(-1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        if (endPage < totalPages - 1) {
            pageNumbers.push(-2);
        }

        pageNumbers.push(totalPages);

        return pageNumbers;
    }, [total, perPage, page]);

    const totalPages = Math.ceil(total / perPage);

    return (
        <div className="relative flex flex-col">
            {searchKey && (
                <div className="flex items-center py-4">
                    <Input
                        placeholder="Ara..."
                        value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                        onChange={(event) => table.getColumn(searchKey)?.setFilterValue(event.target.value)}
                        className="max-w-sm"
                    />
                </div>
            )}
            <div className="rounded-md border flex-1">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {isLoading && !isPreviousData ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + 1} className="h-24">
                                    <div className="flex items-center justify-center">
                                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className={isFetching && isPreviousData ? "opacity-60" : ""}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                                    Sonuç bulunamadı.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="sticky bottom-0 bg-background flex flex-col sm:flex-row items-center justify-end gap-4 py-4">
                {perPageOptions && (
                    <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">Sayfa başına</p>
                        <Select value={perPage.toString()} onValueChange={(value) => onPerPageChange?.(Number(value))}>
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={perPage} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[10, 20, 30, 40, 50].map((pageSize) => (
                                    <SelectItem key={pageSize} value={pageSize.toString()}>
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => onPageChange?.(Math.max(1, page - 1))}
                            disabled={page === 1 || (isPreviousData && isFetching)}
                        >
                            &lt;
                        </Button>
                        <div className="hidden sm:flex items-center space-x-2">
                            {pageNumbers.map((pageNum) =>
                                pageNum > 0 ? (
                                    <Button
                                        key={pageNum}
                                        variant={pageNum === page ? "default" : "outline"}
                                        className="h-8 w-8"
                                        onClick={() => onPageChange?.(pageNum)}
                                        disabled={pageNum === page || (isPreviousData && isFetching)}
                                    >
                                        {pageNum}
                                    </Button>
                                ) : (
                                    <span key={pageNum} className="px-2">
                                        ...
                                    </span>
                                )
                            )}
                        </div>
                        <div className="sm:hidden">
                            <Select value={page.toString()} onValueChange={(value) => onPageChange?.(Number(value))}>
                                <SelectTrigger className="h-8 w-[70px]">
                                    <SelectValue placeholder={page} />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                        <SelectItem key={pageNum} value={pageNum.toString()}>
                                            {pageNum}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages || (isPreviousData && isFetching)}
                        >
                            &gt;
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

