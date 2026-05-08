"use client"

import * as React from "react"
import { ColumnDef, PaginationState, SortingState } from "@tanstack/react-table"
import { useRouter } from "next/navigation"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Eye } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Employee } from "@/types/employee"
import { format } from "date-fns"

interface EmployeeTableProps {
    data: Employee[]
    isLoading: boolean
    totalItems: number
    pageCount: number
    pagination: PaginationState
    onPaginationChange: (pagination: PaginationState) => void
    onSortingChange: (sorting: SortingState) => void
    search: string
    onSearchChange: (value: string) => void
    onEdit?: (employee: Employee) => void
    onDelete?: (id: string) => void
    onView?: (employee: Employee) => void
    showActions?: boolean
    hideSearch?: boolean
    isDashboardView?: boolean
    extraActions?: React.ReactNode
    rowSelection?: Record<string, boolean>
    onRowSelectionChange?: (rowSelection: Record<string, boolean>) => void
}

export const getEmployeeColumns = (
    onEdit?: (employee: Employee) => void,
    onDelete?: (id: string) => void,
    onView?: (employee: Employee) => void,
    isDashboardView?: boolean,
    isExport?: boolean,
): ColumnDef<Employee>[] => {
    type PopulatedField = { name: string; _id: string };

    const cols: ColumnDef<Employee>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <div className="flex justify-center">
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected()}
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Select all"
                        className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-[#3CC3A3]"
                    />
                </div>
            ),
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                        className="border-slate-300 data-[state=checked]:bg-[#3CC3A3] data-[state=checked]:border-[#3CC3A3]"
                    />
                </div>
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "employeeId",
            header: "ID",
            cell: ({ row }) => (
                <span className="font-bold text-[#2eb88a] text-center">
                    {row.original.employeeObjId?.employeeId || "N/A"}
                </span>
            ),
            meta: {
                exportValue: (item: Employee) => item.employeeObjId?.employeeId || "N/A"
            }
        },
        {
            accessorKey: "uniqueId",
            header: "Punch ID",
            cell: ({ row }) => (
                <span className="font-medium text-slate-600 text-center">
                    {row.original.uniqueId || "N/A"}
                </span>
            ),
            meta: {
                exportValue: (item: Employee) => item.uniqueId?.toString() || "N/A"
            }
        },
        {
            accessorKey: "name",
            header: "Employee",
            cell: ({ row }) => (
                <div className="flex flex-col items-center text-center">
                    <span className="font-semibold text-slate-800">{row.original.otherName || row.original.name}</span>
                </div>
            ),
            meta: {
                exportValue: (item: Employee) => item.name
            }
        },
        {
            accessorKey: "designationId",
            header: "Designation",
            cell: ({ row }) => (
                <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-slate-600 capitalize">
                        {row.original.designationId?.name || "N/A"}
                    </span>
                </div>
            ),
            meta: {
                exportValue: (item: Employee) => item.designationId?.name || "N/A"
            }
        },
        {
            accessorKey: "departmentId",
            header: "Department",
            cell: ({ row }) => (
                <div className="flex items-center justify-center text-center">
                    <span className="text-sm text-slate-600">
                        {row.original.departmentId?.name || "N/A"}
                    </span>
                </div>
            ),
            meta: {
                exportValue: (item: Employee) => item.departmentId?.name || "N/A"
            }
        },
        {
            accessorKey: "company",
            header: "Company",
            cell: ({ row }) => (
                <div className="flex items-center justify-center text-center">
                    <span className="text-sm text-slate-700 font-bold">{(row.original.companyId as unknown as PopulatedField)?.name || "N/A"}</span>
                </div>
            ),
            meta: {
                exportValue: (item: Employee) => (item.companyId as unknown as PopulatedField)?.name || "N/A"
            }
        },
        {
            accessorKey: "mobileNo",
            header: "Mobile No",
            cell: ({ row }) => (
                <div className="flex items-center justify-center text-center">
                    <span className="text-sm text-slate-600">{row.original.mobileNo || "N/A"}</span>
                </div>
            ),
            meta: {
                exportValue: (item: Employee) => item.mobileNo || "N/A"
            }
        },
    ];

    if (isExport) {
        cols.push({
            accessorKey: "email",
            header: "Email",
            cell: () => null,
            meta: { exportValue: (item: Employee) => item.email || "N/A" }
        });
        cols.push({
            accessorKey: "otherName",
            header: "Other Name",
            cell: () => null,
            meta: { exportValue: (item: Employee) => item.otherName || "N/A" }
        });
        cols.push({
            accessorKey: "fatherName",
            header: "Father's Name",
            cell: () => null,
            meta: { exportValue: (item: Employee) => item.fatherName || "N/A" }
        });
        cols.push({
            accessorKey: "motherName",
            header: "Mother's Name",
            cell: () => null,
            meta: { exportValue: (item: Employee) => item.motherName || "N/A" }
        });
        cols.push({
            accessorKey: "spouseName",
            header: "Spouse Name",
            cell: () => null,
            meta: { exportValue: (item: Employee) => item.spouseName || "N/A" }
        });
        cols.push({
            accessorKey: "gender",
            header: "Gender",
            cell: () => null,
            meta: { exportValue: (item: Employee) => item.gender || "N/A" }
        });
        cols.push({
            accessorKey: "dob",
            header: "Date of Birth",
            cell: () => null,
            meta: { exportValue: (item: Employee) => item.dob ? format(new Date(item.dob), "dd MMM yyyy") : "N/A" }
        });
        cols.push({
            accessorKey: "maritalStatus",
            header: "Marital Status",
            cell: () => null,
            meta: { exportValue: (item: Employee) => item.maritalStatus || "N/A" }
        });
        cols.push({
            accessorKey: "bloodGroup",
            header: "Blood Group",
            cell: () => null,
            meta: { exportValue: (item: Employee) => item.bloodGroup || "N/A" }
        });
        cols.push({
            accessorKey: "emergencyContact",
            header: "Emergency Contact",
            cell: () => null,
            meta: { exportValue: (item: Employee) => item.emergencyContact?.name ? `${item.emergencyContact.name}${item.emergencyContact.phone ? ` (${item.emergencyContact.phone})` : ""}` : "N/A" }
        });
        cols.push({
            accessorKey: "doj",
            header: "Joining Date",
            cell: () => null,
            meta: { exportValue: (item: Employee) => item.doj ? format(new Date(item.doj), "dd MMM yyyy") : "N/A" }
        });
        cols.push({
            accessorKey: "aadharNo",
            header: "Aadhar No",
            cell: () => null,
            meta: { exportValue: (item: Employee) => item.aadharNo || "N/A" }
        });
        cols.push({
            accessorKey: "pfNo",
            header: "PF No",
            cell: () => null,
            meta: { exportValue: (item: Employee) => item.pfNo || "N/A" }
        });
        cols.push({
            accessorKey: "esiNo",
            header: "ESI No",
            cell: () => null,
            meta: { exportValue: (item: Employee) => item.esiNo || "N/A" }
        });
        cols.push({
            accessorKey: "attendancePolicyId",
            header: "Attendance Policy",
            cell: () => null,
            meta: { exportValue: (item: Employee) => (item.attendancePolicyId as unknown as PopulatedField)?.name || "N/A" }
        });
        cols.push({
            accessorKey: "payrollPolicyId",
            header: "Payroll Policy",
            cell: () => null,
            meta: { exportValue: (item: Employee) => (item.payrollPolicyId as unknown as PopulatedField)?.name || "N/A" }
        });
        cols.push({
            accessorKey: "category",
            header: "Category",
            cell: () => null,
            meta: { exportValue: (item: Employee) => item.category || "N/A" }
        });
        cols.push({
            accessorKey: "workingHours",
            header: "Working Hours",
            cell: () => null,
            meta: { exportValue: (item: Employee) => item.workingHours || "N/A" }
        });
        cols.push({
            accessorKey: "reference",
            header: "Reference",
            cell: () => null,
            meta: { exportValue: (item: Employee) => item.reference || "N/A" }
        });
        cols.push({
            accessorKey: "notes",
            header: "Notes",
            cell: () => null,
            meta: { exportValue: (item: Employee) => item.notes || "N/A" }
        });
        cols.push({
            accessorKey: "permanentAddress",
            header: "Permanent Address",
            cell: () => null,
            meta: { exportValue: (item: Employee) => item.permanentAddress || "N/A" }
        });
        cols.push({
            accessorKey: "currentAddress",
            header: "Current Address",
            cell: () => null,
            meta: { exportValue: (item: Employee) => item.currentAddress || "N/A" }
        });
        cols.push({
            accessorKey: "role",
            header: "Role",
            cell: () => null,
            meta: { exportValue: (item: Employee) => item.role || "N/A" }
        });
        cols.push({
            accessorKey: "createdAt",
            header: "Created At",
            cell: () => null,
            meta: { exportValue: (item: Employee) => item.createdAt ? format(new Date(item.createdAt), "dd MMM yyyy HH:mm") : "N/A" }
        });
        cols.push({
            accessorKey: "updatedAt",
            header: "Updated At",
            cell: () => null,
            meta: { exportValue: (item: Employee) => item.updatedAt ? format(new Date(item.updatedAt), "dd MMM yyyy HH:mm") : "N/A" }
        });
    }

    if (onEdit || onDelete || onView) {
        cols.push({
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const employee = row.original

                return (
                    <div className="flex items-center justify-center gap-2">
                        {onView && (
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-slate-400 hover:text-[#2eb88a] hover:bg-[#2eb88a]/5 rounded-full h-8 w-8 p-0"
                                onClick={() => onView(employee)}
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                        )}
                        {onEdit && (
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full h-8 w-8 p-0"
                                onClick={() => onEdit(employee)}
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                        )}
                        {onDelete && (
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-slate-400 hover:text-destructive hover:bg-destructive/5 rounded-full h-8 w-8 p-0"
                                onClick={() => onDelete(employee.id || employee._id || "")}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                )
            },
        })
    }

    return cols
}

export function EmployeeTable({
    data,
    isLoading,
    totalItems,
    pageCount,
    pagination,
    onPaginationChange,
    onSortingChange,
    search,
    onSearchChange,
    onEdit,
    onDelete,
    onView,
    showActions,
    hideSearch,
    isDashboardView,
    extraActions,
    rowSelection,
    onRowSelectionChange,
}: EmployeeTableProps) {
    const router = useRouter()

    // Default onView redirect only if showActions is not explicitly false
    const effectiveOnView = React.useMemo(() => {
        if (showActions === false) return undefined
        return onView || ((emp: Employee) => router.push(`/dashboard/employee/${emp.id || emp._id}`))
    }, [onView, router, showActions])

    const columns = React.useMemo(
        () => getEmployeeColumns(
            showActions === false ? undefined : onEdit,
            showActions === false ? undefined : onDelete,
            effectiveOnView,
            isDashboardView,
            false
        ),
        [onEdit, onDelete, effectiveOnView, showActions, isDashboardView]
    )

    return (
        <DataTable
            columns={columns}
            data={data}
            isLoading={isLoading}
            totalItems={totalItems}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            onSortingChange={onSortingChange}
            searchKey="uniqueId"
            searchPlaceholder="Search employee..."
            searchValue={search}
            onSearchChange={onSearchChange}
            showSrNo={true}
            hideSearch={hideSearch}
            extraActions={extraActions}
            rowSelection={rowSelection}
            onRowSelectionChange={onRowSelectionChange}
        />
    )
}
