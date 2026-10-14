"use client"

import * as React from "react"
import { ArrowLeft, RefreshCw, Trash2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useDeletedEmployeesQuery } from "@/hooks/queries/use-employees-query"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Employee } from "@/types/employee"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { RestoreEmployeeDialog } from "@/components/employee/restore-employee-dialog"

type PopulatedField = { name: string; _id: string }

export default function DeletedEmployeesPage() {
  const router = useRouter()
  const { data, isLoading, refetch, isFetching } = useDeletedEmployeesQuery()
  const [employeeToRestore, setEmployeeToRestore] = React.useState<Employee | null>(null)

  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: "employeeId",
      header: "ID",
      cell: ({ row }) => {
        const empId = row.original.employeeObjId?.employeeId
        const isAvail = row.original.isPreviousEmployeeIdAvailable
        return (
          <div className="flex flex-col gap-1 items-start">
            <span className="font-bold text-[#2eb88a]">
              {empId || "N/A"}
            </span>
            {empId && (
              isAvail ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">
                  ID Available
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-600 font-medium border border-rose-100">
                  ID In Use
                </span>
              )
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "uniqueId",
      header: "Punch ID",
      cell: ({ row }) => (
        <span className="font-medium text-slate-600">
          {row.original.uniqueId || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "Employee",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800">{row.original.name}</span>
          <span className="text-xs text-slate-500">{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize bg-slate-50 text-slate-600 border-slate-200 font-bold">
          {row.original.role}
        </Badge>
      ),
    },
    {
      accessorKey: "companyId",
      header: "Company",
      cell: ({ row }) => (
        <span className="text-sm font-bold text-slate-700">
          {(row.original.companyId as unknown as PopulatedField)?.name || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "departmentId",
      header: "Department",
      cell: ({ row }) => (
        <span className="text-sm text-slate-600">
          {(row.original.departmentId as unknown as PopulatedField)?.name || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "designationId",
      header: "Designation",
      cell: ({ row }) => (
        <span className="text-sm text-slate-600">
          {(row.original.designationId as unknown as PopulatedField)?.name || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "deletedAt",
      header: "Exited On",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-rose-600">
            {row.original.deletedAt ? format(new Date(row.original.deletedAt), "dd MMM yyyy") : "N/A"}
          </span>
          <span className="text-[10px] text-slate-400">
            {row.original.deletedAt ? format(new Date(row.original.deletedAt), "HH:mm") : ""}
          </span>
        </div>
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
            onClick={() => setEmployeeToRestore(row.original)}
            className="h-8 w-8 rounded-full text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all cursor-pointer"
            title="Restore Employee"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Trash2 className="h-6 w-6 text-rose-500" />
              Deleted Employees
            </h2>
            <p className="text-sm text-slate-500">
              View employees who have been removed from the organization.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isLoading || isFetching}
          className="border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors h-10 w-10 p-0 cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>


      <DataTable
        columns={columns}
        data={data || []}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Search deleted employees..."
        showSrNo={true}
      />

      {/* Interactive Restore Dialog */}
      <RestoreEmployeeDialog
        employee={employeeToRestore}
        open={!!employeeToRestore}
        onOpenChange={(open) => {
          if (!open) setEmployeeToRestore(null)
        }}
        onSuccess={() => refetch()}
      />
    </div>
  )
}
