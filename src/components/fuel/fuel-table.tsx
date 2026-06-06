"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { PaginationState } from "@tanstack/react-table"
import { format } from "date-fns"
import { Trash2, Edit2 } from "lucide-react"
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
  onEdit: (record: FuelRecord) => void
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
  onEdit: (record: FuelRecord) => void,
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
      accessorKey: "vehicleId.vehicleNo",
      header: "Vehicle No.",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900">{row.original.vehicleId?.vehicleNo || "-"}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-tighter">{row.original.vehicleId?.vehicleCode || "NO CODE"}</span>
        </div>
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
      accessorKey: "totalFuel",
      header: "Total Fuel",
      cell: ({ row }) => {
        const totalFuel = row.original.totalFuel ?? (row.original.ratePerLtr > 0 ? parseFloat((row.original.totalAmount / row.original.ratePerLtr).toFixed(2)) : 0);
        return (
          <span className="text-sm font-medium text-slate-600">
            {totalFuel ? `${totalFuel} L` : "-"}
          </span>
        );
      },
    },
    {
      accessorKey: "average",
      header: "Avg (km/L)",
      cell: ({ row }) => (
        <span className="text-sm font-bold text-slate-700">
          {row.original.average ? `${row.original.average} km/L` : "-"}
        </span>
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
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-[#2eb88a] hover:bg-emerald-50 rounded-xl h-9 w-9 transition-colors"
            onClick={() => onEdit(row.original)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl h-9 w-9 transition-colors"
            onClick={() => onDelete(row.original._id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
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
  onEdit,
  onDelete,
  filterNode,
}: FuelTableProps) {
  const columns = React.useMemo(() => getFuelColumns(onEdit, onDelete), [onEdit, onDelete])

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
