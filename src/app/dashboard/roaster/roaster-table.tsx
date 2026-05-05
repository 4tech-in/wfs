"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/ui/data-table"
import { AttendancePolicyUser } from "@/types/roster"
import { Badge } from "@/components/ui/badge"
import { RoasterDialog } from "@/components/dashboard/roaster-dialog"
import { format } from "date-fns"
import { PaginationState } from "@tanstack/react-table"

type PopulatedField = { name: string; _id: string }
type UniqueIdObject = { name?: string; _id?: string }

interface RoasterTableProps {
  data: AttendancePolicyUser[]
  isLoading?: boolean
  pagination?: PaginationState
  onPaginationChange?: (pagination: PaginationState) => void
  totalItems?: number
  pageCount?: number
}

export function RoasterTable({ data, isLoading, pagination, onPaginationChange, totalItems, pageCount }: RoasterTableProps) {

  const columns: ColumnDef<AttendancePolicyUser>[] = [
    {
      accessorKey: "name",
      header: "Employee Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900">
            {row.original.name}
            {row.original.otherName && (
              <span className="text-slate-400 font-normal ml-1">({row.original.otherName})</span>
            )}
          </span>
          <span className="text-xs text-slate-500">
            {row.original.employeeObjId?.employeeId || `ID: ${row.original.uniqueId}`}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "uniqueId",
      header: "Punch ID",
      cell: ({ row }) => {
        const val = row.original.uniqueId;
        if (typeof val === 'object' && val !== null) {
          const obj = val as unknown as UniqueIdObject;
          return obj.name || obj._id || "N/A";
        }
        return val || "N/A";
      }
    },
    {
      accessorKey: "mobileNo",
      header: "Mobile No",
      cell: ({ row }) => (
        <div className="text-slate-600 font-medium">
          {row.original.mobileNo}
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize bg-blue-50 text-blue-700 border-blue-100 rounded-lg">
          {row.original.role}
        </Badge>
      ),
    },
    {
      accessorKey: "attendancePolicyId",
      header: "Policy ID",
      cell: ({ row }) => {
        const policy = row.original.attendancePolicyId;
        if (!policy) {
          return <span className="text-slate-400 text-sm italic">Not Assigned</span>;
        }

        const displayValue = typeof policy === 'object' ? (policy as unknown as PopulatedField).name : policy;
        
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 rounded-lg">
            {displayValue}
          </Badge>
        );
      },
    },
    {
      accessorKey: "attendancePolicyStartDate",
      header: "Start Date",
      cell: ({ row }) => {
        const start = row.original.attendancePolicyStartDate;
        if (!start) return <span className="text-slate-400">—</span>;
        const date = new Date(start);
        return (
          <div className="text-slate-700 font-semibold whitespace-nowrap">
            {!isNaN(date.getTime()) ? format(date, "dd MMM yyyy") : "—"}
          </div>
        );
      },
    },
    {
      accessorKey: "attendancePolicyEndDate",
      header: "End Date",
      cell: ({ row }) => {
        const end = row.original.attendancePolicyEndDate;
        if (!end) return <span className="text-slate-400">—</span>;
        const date = new Date(end);
        return (
          <div className="text-slate-700 font-semibold whitespace-nowrap">
            {!isNaN(date.getTime()) ? format(date, "dd MMM yyyy") : "—"}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => {
        const date = row.original.createdAt ? new Date(row.original.createdAt) : null
        return (
          <div className="text-slate-600 font-medium">
            {date && !isNaN(date.getTime()) ? format(date, "dd MMM yyyy") : "—"}
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <RoasterDialog 
                initialValues={{
                  employeeIds: [row.original._id],
                  shiftId: typeof row.original.attendancePolicyId === 'object' 
                    ? (row.original.attendancePolicyId as unknown as PopulatedField)._id 
                    : row.original.attendancePolicyId || "",
                  startDate: row.original.attendancePolicyStartDate 
                    ? new Date(row.original.attendancePolicyStartDate).toISOString().split("T")[0] 
                    : new Date().toISOString().split("T")[0],
                  endDate: row.original.attendancePolicyEndDate 
                    ? new Date(row.original.attendancePolicyEndDate).toISOString().split("T")[0] 
                    : new Date().toISOString().split("T")[0],
                  companyId: typeof row.original.companyId === 'object' 
                    ? (row.original.companyId as unknown as PopulatedField)._id 
                    : row.original.companyId || "",
                }}
                initialEmployees={[row.original]}
                title="Edit Roster"
                description="Update the shift or date range for this employee."
                trigger={
                  <DropdownMenuItem 
                    onSelect={(e) => e.preventDefault()}
                    className="rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Roster
                  </DropdownMenuItem>
                }
              />
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      searchKey="name"
      searchPlaceholder="Search by employee name..."
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      totalItems={totalItems}
      pageCount={pageCount}
    />
  )
}
