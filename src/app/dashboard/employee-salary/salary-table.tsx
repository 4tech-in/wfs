"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { 
  User, 
  Calendar, 
  Trash2,
  Edit,
  Calculator
} from "lucide-react"
import { CalculateSalaryDialog } from "./calculate-salary-dialog"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { SalaryListItem } from "@/types/salary"
import { format } from "date-fns"
import { PaginationState } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"

interface SalaryTableProps {
  data: SalaryListItem[]
  isLoading: boolean
  pagination: PaginationState
  onPaginationChange: (pagination: PaginationState) => void
  totalItems?: number
  onDelete?: (userId: string) => void
  onEdit?: (item: SalaryListItem) => void
}

export function SalaryTable({ 
  data, 
  isLoading,
  pagination,
  onPaginationChange,
  totalItems,
  onDelete,
  onEdit
}: SalaryTableProps) {
  const [calculatingEmployee, setCalculatingEmployee] = React.useState<{ id: string, name: string } | null>(null)
  const [isCalculateOpen, setIsCalculateOpen] = React.useState(false)
  
  const getEmployeeData = (item: SalaryListItem) => {
    return item.user || item.userId || null;
  }

  const getSalaryTypeBadge = (item: SalaryListItem) => {
    if (item.monthly) return (
        <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-100/50 gap-1.5 px-3 py-1 rounded-full font-bold uppercase text-[10px]">
            Monthly
        </Badge>
    )
    if (item.hourly) return (
        <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-100/50 gap-1.5 px-3 py-1 rounded-full font-bold uppercase text-[10px]">
            Hourly
        </Badge>
    )
    if (item.daily) return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100/50 gap-1.5 px-3 py-1 rounded-full font-bold uppercase text-[10px]">
            Daily
        </Badge>
    )
    return null
  }

  const getAmount = (item: SalaryListItem) => {
    if (item.monthly) return item.monthlySalary
    if (item.hourly) return item.hourlyRate
    if (item.daily) return item.dailyRate
    return 0
  }

  const columns: ColumnDef<SalaryListItem>[] = [
    {
      accessorKey: "userId",
      header: "Employee",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100/50">
            <User className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 line-clamp-1">
              {getEmployeeData(row.original)?.name || "Unknown"}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              {getEmployeeData(row.original)?.uniqueId || "N/A"}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Salary Type",
      cell: ({ row }) => getSalaryTypeBadge(row.original),
    },
    {
      accessorKey: "amount",
      header: "Rate / Amount",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 font-bold text-slate-900">
          <span className="text-slate-400 font-medium">₹</span>
          <span>{getAmount(row.original)?.toLocaleString()}</span>
          <span className="text-[10px] text-slate-400 font-medium lowercase">
            {row.original.monthly && "/mo"}
            {row.original.hourly && "/hr"}
            {row.original.daily && "/day"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: "Last Updated",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-slate-500 font-medium whitespace-nowrap text-xs">
          <Calendar className="h-3.5 w-3.5 text-slate-300" />
          <span>{format(new Date(row.original.updatedAt), "dd MMM yyyy")}</span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const emp = getEmployeeData(row.original);
        return (
          <div className="flex justify-end gap-2 pr-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (emp) {
                    setCalculatingEmployee({
                      id: typeof emp === 'string' ? emp : emp._id,
                      name: typeof emp === 'string' ? 'Employee' : emp.name
                    })
                    setIsCalculateOpen(true)
                  }
                }}
                className="h-8 px-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border-indigo-100/50 rounded-lg transition-all font-bold text-[10px] uppercase tracking-wider gap-2 shadow-sm"
            >
                <Calculator className="h-3 w-3" />
                Calculate
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (emp) {
                    onEdit?.(row.original)
                  }
                }}
                className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Edit Configuration"
            >
                <Edit className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (emp) {
                    onDelete?.(typeof emp === 'string' ? emp : emp._id)
                  }
                }}
                className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Delete Configuration"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ]

  return (
    <>
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      totalItems={totalItems}
      showSrNo={true}
    />

    <CalculateSalaryDialog
      employeeId={calculatingEmployee?.id || null}
      employeeName={calculatingEmployee?.name || null}
      open={isCalculateOpen}
      onOpenChange={setIsCalculateOpen}
    />
    </>
  )
}
