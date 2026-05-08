import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import * as React from "react"
import { Table } from "@tanstack/react-table"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  totalItems?: number
}

export function DataTablePagination<TData>({
  table,
  totalItems,
}: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination
  const pageCount = table.getPageCount()
  const currentPage = pageIndex + 1

  const getPageNumbers = () => {
    const pages = []
    const showMax = 5

    if (pageCount <= showMax) {
      for (let i = 1; i <= pageCount; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, "...", pageCount)
      } else if (currentPage >= pageCount - 2) {
        pages.push(1, "...", pageCount - 2, pageCount - 1, pageCount)
      } else {
        pages.push(1, "...", currentPage, "...", pageCount)
      }
    }
    return pages
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
      <div className="flex items-center gap-2 order-2 sm:order-1">
        <span className="text-[14px] text-slate-500">Show</span>
        <Select
          value={`${pageSize}`}
          onValueChange={(value) => {
            if (value === "all") {
              table.setPageSize(totalItems || 1000)
            } else {
              table.setPageSize(Number(value))
            }
          }}
        >
          <SelectTrigger className="h-9 w-[75px] border-slate-200 bg-white text-slate-700">
            <SelectValue placeholder={pageSize} />
          </SelectTrigger>
          <SelectContent side="top">
            {[10, 20, 30, 40, 50].map((size) => (
              <SelectItem key={size} value={`${size}`}>
                {size}
              </SelectItem>
            ))}
            {totalItems !== undefined && (
              <SelectItem value="all">All</SelectItem>
            )}
          </SelectContent>
        </Select>
        <span className="text-[14px] text-slate-500">
          of {totalItems ?? table.getFilteredRowModel().rows.length} results
        </span>
      </div>

      <div className="flex items-center gap-1 order-1 sm:order-2">
        <Button
          variant="outline"
          className="h-9 w-9 p-0 border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === "..." ? (
              <span className="px-2 text-slate-400">...</span>
            ) : (
              <Button
                variant={currentPage === page ? "default" : "outline"}
                className={cn(
                  "h-9 w-9 p-0 text-[14px] font-medium transition-all",
                  currentPage === page
                    ? "bg-[#2eb88a] text-white hover:bg-[#259b74] border-[#2eb88a]"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
                onClick={() => table.setPageIndex((page as number) - 1)}
              >
                {page}
              </Button>
            )}
          </React.Fragment>
        ))}

        <Button
          variant="outline"
          className="h-9 w-9 p-0 border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
