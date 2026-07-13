"use client"

import * as React from "react"
import { RefreshCw, XCircle, Trash2 } from "lucide-react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useDataTable } from "@/hooks/use-data-table"
import { useEmployeesQuery } from "@/hooks/queries/use-employees-query"
import { Employee, EmployeeQueryParams } from "@/types/employee"
import { RegisterEmployeeDialog, EditEmployeeDialog } from "@/components/employee/employee-dialogs"
import { AvailableEmployeeIdDialog } from "@/components/employee/available-employee-id-dialog"
import { ExcelUpload } from "@/components/ExcelUpload"
import { DeleteEmployeeDialog } from "@/components/employee/delete-employee-dialog"
import { DataTableExport } from "@/components/ui/data-table-export"
import { employeeService } from "@/services/employee-service"
import { EmployeeTable, getEmployeeColumns } from "./employee-table"
import { InfiniteScrollSelect } from "@/components/ui/infinite-scroll-select"
import { useCompanyDropdownInfiniteQuery } from "@/hooks/queries/use-company"
import { useDepartmentsQuery, useDesignationsQuery } from "@/hooks/queries/use-org"
import { DepartmentManagementDialog } from "@/components/org/department-management-dialog"
import { DesignationManagementDialog } from "@/components/org/designation-management-dialog"
import { useDebounce } from "@/hooks/use-debounce"
import { Suspense } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function EmployeeMasterContent() {
  const searchParams = useSearchParams()
  const initialCompanyId = searchParams.get("companyId") || undefined
  const initialGender = searchParams.get("gender") || undefined

  const [editingEmployee, setEditingEmployee] = React.useState<Employee | null>(null)
  const [deletingUserIds, setDeletingUserIds] = React.useState<string[]>([])
  const [companyId, setCompanyId] = React.useState<string | undefined>(initialCompanyId)
  const [gender, setGender] = React.useState<string | undefined>(initialGender)
  const [departmentId, setDepartmentId] = React.useState<string | undefined>(undefined)
  const [designationId, setDesignationId] = React.useState<string | undefined>(undefined)
  const [attendancePolicyStatus, setAttendancePolicyStatus] = React.useState<string | undefined>(undefined)
  const [isDeptDialogOpen, setIsDeptDialogOpen] = React.useState(false)
  const [isDesgDialogOpen, setIsDesgDialogOpen] = React.useState(false)
  const [companySearch, setCompanySearch] = React.useState("")
  const debouncedCompanySearch = useDebounce(companySearch, 500)
  const router = useRouter()
  const pathname = usePathname()

  const handleClearFilters = () => {
    setCompanyId(undefined)
    setDepartmentId(undefined)
    setDesignationId(undefined)
    setGender(undefined)
    setAttendancePolicyStatus(undefined)
    onPaginationChange({ ...pagination, pageIndex: 0 })
    router.push(pathname)
  }

  const {
    pagination,
    onPaginationChange,
    onSortingChange,
    search,
    onSearchChange,
    apiParams,
  } = useDataTable({
    storageKey: "employee-master",
    initialPageSize: 10,
  })

  const { data, isLoading, refetch, isFetching } = useEmployeesQuery({ 
    ...apiParams, 
    companyId,
    departmentId,
    designationId,
    gender,
    attendancePolicyStatus
  } as EmployeeQueryParams)



  const { 
    data: companiesData, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading: companiesLoading 
  } = useCompanyDropdownInfiniteQuery({ search: debouncedCompanySearch })

  const { data: deptsData, isLoading: deptsLoading } = useDepartmentsQuery()
  const { data: desgsData, isLoading: desgsLoading } = useDesignationsQuery()

  const companies = companiesData?.pages.flatMap((page) => page.data) || []
  const departments = deptsData?.data?.filter(d => d.isActive !== false) || []
  const designations = desgsData?.data?.filter(d => d.isActive !== false) || []

  // Use a static version of columns for export (without actions, including all fields)
  const exportColumns = React.useMemo(() => getEmployeeColumns(undefined, undefined, undefined, undefined, true), [])

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Employee Master</h2>
          <p className="text-sm text-slate-500">
            Manage your organization&apos;s employees and their access levels.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <DataTableExport
            columns={exportColumns}
            filename="employee_report"
            fetchData={() => employeeService.getAll({ 
              ...apiParams, 
              limit: "all",
              companyId,
              departmentId,
              designationId,
              gender,
              attendancePolicyStatus
            } as EmployeeQueryParams)}
            defaultSelectedColumns={['name', 'uniqueId', 'designation', 'doj', 'fatherName']}
          />
          <AvailableEmployeeIdDialog />
          <ExcelUpload 
            uploadUrl="/user/bulk-upload"
            onSuccess={() => refetch()}
            templateHeaders={[
              "name", "role", "uniqueId", "mobileNo", "gender", "dob", "doj", 
              "permanentAddress", "currentAddress", "workingHours", "aadharNo", 
              "pfNo", "esiNo", "companyId", "designationId", "departmentId", 
              "alias", "contactPerson", "phoneNumber", "referredBy", "notes"
            ]}
            templateSampleData={[{
              name: "John Doe",
              role: "user",
              uniqueId: "1001",
              mobileNo: "9876543210",
              gender: "male",
              dob: "1995-05-10",
              doj: "2023-01-01",
              permanentAddress: "Nagpur",
              currentAddress: "Nagpur",
              workingHours: "8",
              aadharNo: "123412341234",
              pfNo: "",
              esiNo: "",
              companyId: "",
              designationId: "",
              departmentId: "",
              alias: "JD",
              contactPerson: "Manager",
              phoneNumber: "9999999999",
              referredBy: "HR",
              notes: "Good employee"
            }]}
            templateFileName="employee_bulk_upload_template.xlsx"
            title="Bulk Upload Employees"
            description="Upload your employee data using an Excel or CSV file."
          />

          <Link href="/dashboard/employee/deleted">
            <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all rounded-xl flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              View Deleted
            </Button>
          </Link>
          <RegisterEmployeeDialog />
        </div>
      </div>

      <EmployeeTable
        data={data?.data || []}
        isLoading={isLoading}
        totalItems={data?.pagination?.total || 0}
        pageCount={data?.pagination?.totalPages || 0}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        onSortingChange={onSortingChange}
        search={search}
        onSearchChange={onSearchChange}
        onEdit={setEditingEmployee}
        onDelete={(id) => setDeletingUserIds([id])}
        extraActions={
          <div className="flex items-center gap-2">
            {(companyId || departmentId || designationId || gender || attendancePolicyStatus) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="h-10 px-4 border-rose-100 text-rose-600 bg-rose-50 hover:bg-rose-100 hover:border-rose-200 rounded-xl transition-all flex items-center gap-2 font-bold text-xs"
                title="Clear All Filters"
              >
                <XCircle className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
            
            <div className="w-[180px]">
              <InfiniteScrollSelect
                placeholder="Filter by Company"
                searchPlaceholder="Search companies..."
                items={companies}
                value={companyId}
                onValueChange={(val) => {
                  setCompanyId(val === companyId ? undefined : val)
                  onPaginationChange({ ...pagination, pageIndex: 0 })
                }}
                onSearchChange={setCompanySearch}
                loadMore={() => fetchNextPage()}
                hasNextPage={!!hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                isLoading={companiesLoading}
                getLabel={(item) => item.name}
                getValue={(item) => item._id}
                className="h-10 border-slate-200 rounded-xl bg-white shadow-sm font-semibold text-xs text-slate-700"
              />
            </div>

            <div className="w-[180px]">
              <InfiniteScrollSelect
                placeholder="Filter by Dept"
                searchPlaceholder="Search departments..."
                items={departments}
                value={departmentId}
                onValueChange={(val) => {
                  setDepartmentId(val === departmentId ? undefined : val)
                  onPaginationChange({ ...pagination, pageIndex: 0 })
                }}
                isLoading={deptsLoading}
                getLabel={(item) => item.name}
                getValue={(item) => item._id}
                hideSearch={true}
                className="h-10 border-slate-200 rounded-xl bg-white shadow-sm font-semibold text-xs text-slate-700"
                actionButton={
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-xs font-bold text-teal-600 hover:text-teal-700 hover:bg-teal-50 px-2 py-1.5 h-8"
                    onClick={() => setIsDeptDialogOpen(true)}
                  >
                    + Manage Departments
                  </Button>
                }
              />
            </div>

            <div className="w-[180px]">
              <InfiniteScrollSelect
                placeholder="Filter by Desg"
                searchPlaceholder="Search designations..."
                items={designations}
                value={designationId}
                onValueChange={(val) => {
                  setDesignationId(val === designationId ? undefined : val)
                  onPaginationChange({ ...pagination, pageIndex: 0 })
                }}
                isLoading={desgsLoading}
                getLabel={(item) => item.name}
                getValue={(item) => item._id}
                hideSearch={true}
                className="h-10 border-slate-200 rounded-xl bg-white shadow-sm font-semibold text-xs text-slate-700"
                actionButton={
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-xs font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-2 py-1.5 h-8"
                    onClick={() => setIsDesgDialogOpen(true)}
                  >
                    + Manage Designations
                  </Button>
                }
              />
            </div>

            <div className="w-[180px]">
              <Select
                value={attendancePolicyStatus || "all"}
                onValueChange={(val) => {
                  setAttendancePolicyStatus(val === "all" ? undefined : val)
                  onPaginationChange({ ...pagination, pageIndex: 0 })
                }}
              >
                <SelectTrigger className="h-10 border-slate-200 rounded-xl bg-white shadow-sm font-semibold text-xs text-slate-700">
                  <SelectValue placeholder="Attendance Policy" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl bg-white">
                  <SelectItem value="all" className="text-xs font-semibold text-slate-700 cursor-pointer">All Policies</SelectItem>
                  <SelectItem value="assigned" className="text-xs font-semibold text-slate-700 cursor-pointer">Assigned</SelectItem>
                  <SelectItem value="not_assigned" className="text-xs font-semibold text-slate-700 cursor-pointer">Not Assigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        }
      />

      <DepartmentManagementDialog 
        open={isDeptDialogOpen} 
        onOpenChange={setIsDeptDialogOpen} 
      />

      <DesignationManagementDialog 
        open={isDesgDialogOpen} 
        onOpenChange={setIsDesgDialogOpen} 
      />

      <EditEmployeeDialog
        employee={editingEmployee}
        open={!!editingEmployee}
        onOpenChange={(open) => !open && setEditingEmployee(null)}
      />

      <DeleteEmployeeDialog
        userIds={deletingUserIds}
        open={deletingUserIds.length > 0}
        onOpenChange={(open) => !open && setDeletingUserIds([])}
      />
    </div>
  )
}

export default function EmployeeMaster() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-slate-50/20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500 animate-pulse">Loading Employees...</p>
        </div>
      </div>
    }>
      <EmployeeMasterContent />
    </Suspense>
  )
}