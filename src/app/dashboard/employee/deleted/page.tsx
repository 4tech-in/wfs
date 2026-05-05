"use client"

import * as React from "react"
import { ArrowLeft, RefreshCw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useDeletedEmployeesQuery } from "@/hooks/queries/use-employees-query"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Employee } from "@/types/employee"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

type PopulatedField = { name: string; _id: string }

export default function DeletedEmployeesPage() {
  const router = useRouter()
  const { data, isLoading, refetch, isFetching } = useDeletedEmployeesQuery()

  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: "employeeId",
      header: "ID",
      cell: ({ row }) => (
        <span className="font-bold text-[#2eb88a]">
          {row.original.employeeObjId?.employeeId || "N/A"}
        </span>
      ),
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
      header: "Deleted At",
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

    </div>
  )
}
