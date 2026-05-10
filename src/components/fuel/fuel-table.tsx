"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { PaginationState } from "@tanstack/react-table"
import { format } from "date-fns"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FuelRecord } from "@/types/fuel"

interface FuelTableProps {
  data: FuelRecord[]
  isLoading?: boolean
  totalItems: number
  pagination: PaginationState
  onPaginationChange?: (updater: PaginationState | ((prev: PaginationState) => PaginationState)) => void
  searchValue?: string
  onSearchChange?: (value: string) => void
  onDelete: (id: string) => void
  filterNode?: React.ReactNode
}

function formatDate(val?: string) {
  if (!val) return "-"
  try {
    return format(new Date(val), "dd MMM yyyy")
  } catch {
    return "-"
  }
}

function formatCurrency(val?: number) {
  if (val === undefined || val === null) return "0.00"
  return val.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatNumber(num?: number) {
  if (num === undefined || num === null) return "0"
  return num.toString()
}

export const getFuelColumns = (
  onDelete: (id: string) => void
): ColumnDef<FuelRecord>[] => {
  return [
    {
      accessorKey: "fillingDate",
      header: "Date",
      cell: ({ row }) => (
        <span className="font-medium text-slate-700">{formatDate(row.original.fillingDate)}</span>
      ),
    },
    {
      accessorKey: "odometer",
      header: "Odometer",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900">{formatNumber(row.original.odometer)}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-tighter">KM READING</span>
        </div>
      ),
    },
    {
      accessorKey: "fuelType",
      header: "Fuel Type",
      cell: ({ row }) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
          {row.original.fuelType}
        </span>
      ),
    },
    {
      accessorKey: "ratePerLtr",
      header: "Rate/Ltr",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-slate-600">₹{formatCurrency(row.original.ratePerLtr)}</span>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="text-sm font-black text-emerald-600">₹{formatCurrency(row.original.totalAmount)}</span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl h-9 w-9 transition-colors"
          onClick={() => onDelete(row.original._id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ]
}

export function FuelTable({
  data,
  isLoading = false,
  totalItems = 0,
  pagination = { pageIndex: 0, pageSize: 10 },
  onPaginationChange = () => {},
  searchValue,
  onSearchChange,
  onDelete,
  filterNode,
}: FuelTableProps) {
  const columns = React.useMemo(() => getFuelColumns(onDelete), [onDelete])

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      totalItems={totalItems}
      pageCount={Math.ceil(totalItems / pagination.pageSize) || 1}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      onSortingChange={() => {}}
      searchKey="title"
      searchPlaceholder="Search by vehicle no or date..."
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      showSrNo={true}
      extraActions={filterNode}
    />
  )
}
