"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
  Updater,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DataTablePagination } from "./data-table-pagination"
import { DataTableViewOptions } from "./data-table-view-options"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Search } from "lucide-react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageCount?: number
  pagination?: PaginationState
  onPaginationChange?: (pagination: PaginationState) => void
  onSortingChange?: (sorting: SortingState) => void
  isLoading?: boolean
  searchKey?: string
  searchPlaceholder?: string
  enableSorting?: boolean
  onSearchChange?: (value: string) => void
  searchValue?: string
  extraActions?: React.ReactNode
  totalItems?: number
  height?: string
  showSrNo?: boolean
  hideSearch?: boolean
  rowSelection?: Record<string, boolean>
  onRowSelectionChange?: (rowSelection: Record<string, boolean>) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  pagination: externalPagination,
  onPaginationChange: externalOnPaginationChange,
  onSortingChange,
  isLoading = false,
  searchKey,
  searchPlaceholder = "Search...",
  enableSorting = true,
  onSearchChange,
  searchValue,
  extraActions,
  totalItems,
  height,
  showSrNo = true,
  hideSearch = false,
  rowSelection: externalRowSelection,
  onRowSelectionChange: externalOnRowSelectionChange,
}: DataTableProps<TData, TValue>) {
  const [internalRowSelection, setInternalRowSelection] = React.useState({})
  
  const [localPagination, setLocalPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const pagination = externalPagination ?? localPagination

  const rowSelection = externalRowSelection ?? internalRowSelection
  const onRowSelectionChange = React.useCallback((updaterOrValue: Updater<Record<string, boolean>>) => {
    const nextValue = typeof updaterOrValue === 'function' 
      ? updaterOrValue(rowSelection as Record<string, boolean>) 
      : updaterOrValue
    
    if (externalOnRowSelectionChange) {
      externalOnRowSelectionChange(nextValue)
    } else {
      setInternalRowSelection(nextValue)
    }
  }, [externalOnRowSelectionChange, rowSelection])
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])

  // Determine if we are using server-side pagination
  const isServerSide = !!externalOnPaginationChange && !!externalPagination

  // Calculate the total number of pages if not explicitly provided
  const effectivePageCount = React.useMemo(() => {
    if (!isServerSide) return undefined
    if (pageCount !== undefined) return pageCount
    if (totalItems !== undefined && pagination?.pageSize) {
      return Math.ceil(totalItems / pagination.pageSize) || 1
    }
    return -1
  }, [isServerSide, pageCount, totalItems, pagination?.pageSize])

  const handlePaginationChange = React.useCallback(
    (updaterOrValue: Updater<PaginationState>) => {
      if (externalOnPaginationChange && externalPagination) {
        const nextPagination =
          typeof updaterOrValue === "function"
            ? updaterOrValue(externalPagination)
            : updaterOrValue
        externalOnPaginationChange(nextPagination)
      } else {
        setLocalPagination(updaterOrValue)
      }
    },
    [externalOnPaginationChange, externalPagination]
  )

  const internalOnSortingChange = React.useCallback(
    (updaterOrValue: Updater<SortingState>) => {
      if (onSortingChange) {
        const nextSorting =
          typeof updaterOrValue === "function"
            ? updaterOrValue(sorting)
            : updaterOrValue
        setSorting(nextSorting)
        onSortingChange(nextSorting)
      } else {
        setSorting(updaterOrValue)
      }
    },
    [onSortingChange, sorting]
  )

  const finalColumns = React.useMemo(() => {
    if (!showSrNo) return columns

    const srNoColumn: ColumnDef<TData, TValue> = {
      id: "srNo",
      header: "Sr. No.",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row, table }) => {
        const { pagination } = table.getState()
        return (
          <div className="text-slate-500 font-medium text-center">
            {isServerSide 
              ? (pagination.pageIndex * pagination.pageSize) + row.index + 1
              : row.index + 1
            }
          </div>
        )
      },
    }

    return [srNoColumn, ...columns]
  }, [columns, showSrNo, isServerSide])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: finalColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    manualPagination: isServerSide,
    manualSorting: isServerSide,
    pageCount: effectivePageCount,
    enableSorting,
    enableRowSelection: true,
    onRowSelectionChange: onRowSelectionChange,
    onSortingChange: internalOnSortingChange,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const onSearchValueChange = React.useCallback(
    (value: string) => {
      if (onSearchChange) {
        onSearchChange(value)
      } else if (searchKey) {
        table.getColumn(searchKey)?.setFilterValue(value)
      }
    },
    [onSearchChange, searchKey, table]
  )

  const currentSearchValue =
    searchValue ??
    (searchKey ? (table.getColumn(searchKey)?.getFilterValue() as string) : "") ??
    ""

  return (
    <div className="space-y-4">
      {!hideSearch && (searchKey || onSearchChange) && (
        <div className="flex items-center justify-between py-4">
          <Input
            placeholder={searchPlaceholder}
            value={currentSearchValue}
            onChange={(event) => onSearchValueChange(event.target.value)}
            leftIcon={<Search className="h-4 w-4 text-slate-400" />}
            className="max-w-sm border-slate-200 focus-visible:ring-emerald-500/20"
          />
          <div className="flex items-center gap-2">
            {extraActions}
            <DataTableViewOptions table={table} />
          </div>
        </div>
      )}
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
        <Table
          wrapperClassName="overflow-auto relative custom-scrollbar h-full"
          wrapperStyle={{ maxHeight: height || "650px" }}
        >
          <TableHeader className="bg-[#3CC3A3] sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        "text-white font-semibold h-14 text-[13px] tracking-tight text-center px-6 border-r border-white/20 last:border-r-0",
                        "first:pl-8 last:pr-8"
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i} className="border-b border-slate-100 last:border-0 h-16">
                  {columns.map((_, j) => (
                    <TableCell key={j} className="px-6 first:pl-8 last:pr-8 border-r border-slate-100 last:border-r-0">
                      <Skeleton className="h-5 w-full rounded-md" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    "group h-16 border-b border-slate-100 last:border-0 transition-colors",
                    "hover:bg-slate-50/50",
                    "data-[state=selected]:bg-emerald-50/30 data-[state=selected]:hover:bg-emerald-50/50"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-6 first:pl-8 last:pr-8 border-r border-slate-100 last:border-r-0 text-[14px] text-slate-600 font-medium"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={finalColumns.length}
                  className="h-32 text-center text-slate-400 font-medium"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} totalItems={totalItems} />
    </div>
  )
}
