"use client"

import * as React from "react"
import { ColumnDef, PaginationState } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { format } from "date-fns"
import { Vehicle } from "@/types/vehicle"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VehicleTableProps {
  data: Vehicle[]
  isLoading?: boolean
  totalItems: number
  pagination: PaginationState
  onPaginationChange?: (updater: PaginationState | ((prev: PaginationState) => PaginationState)) => void
  searchValue?: string
  onSearchChange?: (value: string) => void
  onEdit: (vehicle: Vehicle) => void
  onDelete: (id: string) => void
}

function formatDate(val?: string) {
  if (!val) return "-"
  try {
    return format(new Date(val), "dd MMM yyyy")
  } catch {
    return "-"
  }
}

export const getVehicleColumns = (
  onEdit: (vehicle: Vehicle) => void,
  onDelete: (id: string) => void
): ColumnDef<Vehicle>[] => {
  return [
    {
      accessorKey: "vehicleNo",
      header: "Vehicle Number",
      cell: ({ row }) => (
        <span className="font-bold text-slate-900">{row.original.vehicleNo}</span>
      ),
    },
    {
      accessorKey: "vehicleCode",
      header: "Vehicle Code",
      cell: ({ row }) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
          {row.original.vehicleCode}
        </span>
      ),
    },
    // {
    //   accessorKey: "createdBy.name",
    //   header: "Created By",
    //   cell: ({ row }) => (
    //     <div className="flex flex-col">
    //       <span className="text-sm font-medium text-slate-700">{row?.original?.createdBy?.name}</span>
    //       <span className="text-[10px] text-slate-400">{row?.original?.createdBy?.email}</span>
    //     </div>
    //   ),
    // },
    {
      accessorKey: "createdAt",
      header: "Created Date",
      cell: ({ row }) => (
        <span className="text-sm text-slate-500">{formatDate(row?.original?.createdAt)}</span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-[#2eb88a] hover:bg-emerald-50 rounded-xl h-9 w-9 transition-colors"
            onClick={() => onEdit(row?.original)}
          >
            <Pencil className="h-4 w-4" />
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

export function VehicleTable({
  data,
  isLoading = false,
  totalItems = 0,
  pagination = { pageIndex: 0, pageSize: 10 },
  onPaginationChange = () => {},
  searchValue,
  onSearchChange,
  onEdit,
  onDelete,
}: VehicleTableProps) {
  const columns = React.useMemo(() => getVehicleColumns(onEdit, onDelete), [onEdit, onDelete])

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      totalItems={totalItems}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search vehicle number or code..."
    />
  )
}
